// /api/gemini.ts
import { GoogleGenAI, Modality, Part } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

// --- CONSTANTS ---
const MODEL_PRO = 'gemini-3-pro-image-preview';
const MODEL_FLASH = 'gemini-2.5-flash-image';
const TEXT_MODEL = 'gemini-2.5-flash';
const VEO_MODEL_FAST = 'veo-3.1-fast-generate-preview';
const VEO_MODEL_REF = 'veo-3.1-generate-preview'; // Model supporting reference images and high quality
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// --- INIT FIREBASE ADMIN ---
let isFirebaseInitialized = false;
try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountJson))
            });
            isFirebaseInitialized = true;
        } else {
            console.warn("Warning: FIREBASE_SERVICE_ACCOUNT_JSON is missing. Server cannot verify ID tokens.");
        }
    } else {
        isFirebaseInitialized = true;
    }
} catch (error: any) {
    console.error("Firebase Init Error:", error.message);
}

// --- HELPER: ERROR PARSING ---
const processGoogleError = (error: any): string => {
    const rawMessage = error.message || String(error);
    console.error("Raw Google Error:", rawMessage);

    if (rawMessage.includes('overloaded') || rawMessage.includes('503')) {
        return "Máy chủ AI đang quá tải (High Traffic). Đang thử lại với mô hình dự phòng...";
    }

    try {
        const jsonMatch = rawMessage.match(/\{.*\}/s);
        if (jsonMatch) {
            const errorObj = JSON.parse(jsonMatch[0]);
            if (errorObj.error?.message) {
                const msg = errorObj.error.message;
                if (msg.includes('inline_data')) return "Dữ liệu ảnh không hợp lệ hoặc bị lỗi định dạng.";
                if (msg.includes('safety')) return "Ảnh bị chặn bởi bộ lọc an toàn của Google.";
                if (msg.includes('quota') || msg.includes('429')) return "Hệ thống đang bận (Quota Exceeded).";
                if (msg.includes('InvalidArgument') || msg.includes('400')) return `Tham số không hợp lệ: ${msg}`;
                return `Lỗi từ AI: ${msg}`;
            }
        }
    } catch (e) { }

    if (rawMessage.includes('400')) return "Yêu cầu không hợp lệ (Lỗi 400). Có thể do xung đột cấu hình ảnh.";
    if (rawMessage.includes('500')) return "Máy chủ AI gặp sự cố (Lỗi 500). Vui lòng thử lại sau.";
    if (rawMessage.includes('timeout') || rawMessage.includes('504')) return "Quá thời gian xử lý. Vui lòng thử lại.";

    return "Đã xảy ra lỗi không xác định khi tạo ảnh.";
};

// --- HELPER: USER STATUS CHECK ---
interface UserStatus {
    isVip: boolean;
    isAdmin: boolean;
    uid: string | null;
    credits: number;
}

const getUserStatus = async (idToken?: string, clientVipStatus?: boolean): Promise<UserStatus> => {
    if (!idToken) {
        return { isVip: false, isAdmin: false, uid: null, credits: 0 };
    }

    if (isFirebaseInitialized) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            const db = admin.firestore();
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return { isVip: !!clientVipStatus, isAdmin: false, uid, credits: 0 };
            }

            const userData = userDoc.data();
            const isAdmin = userData?.isAdmin === true || userData?.isAdmin === 'true';
            
            let isVip = isAdmin;
            if (!isVip && userData?.subscriptionEndDate) {
                const expiryDate = new Date(userData.subscriptionEndDate);
                if (expiryDate > new Date()) {
                    isVip = true;
                }
            }

            return { isVip, isAdmin, uid, credits: userData?.credits || 0 };
        } catch (error) {
            console.error("Server Auth Verification Failed:", error);
        }
    }

    if (idToken) {
        return { isVip: !!clientVipStatus, isAdmin: false, uid: 'fallback-user', credits: 0 };
    }

    return { isVip: false, isAdmin: false, uid: null, credits: 0 };
};

// --- HELPER: WATERMARK ---
const addWatermark = async (imageBuffer: Buffer): Promise<Buffer> => {
    try {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        const width = metadata.width || 1024;
        const height = metadata.height || 1024;

        const svgText = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="watermark" patternUnits="userSpaceOnUse" width="400" height="400" patternTransform="rotate(-45)">
                    <text x="200" y="200" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="rgba(255,255,255,0.2)" text-anchor="middle" alignment-baseline="middle">AI PHOTO SUITE • PREVIEW</text>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#watermark)" />
            <text x="50%" y="95%" font-family="Arial, sans-serif" font-size="${Math.floor(width * 0.03)}" fill="rgba(255,255,255,0.6)" text-anchor="middle" font-weight="bold">AI PHOTO SUITE</text>
        </svg>`;

        return await image.composite([{ input: Buffer.from(svgText), blend: 'over' }]).toBuffer();
    } catch (error) {
        return imageBuffer; 
    }
};

const resolveImageSize = (payload: any, isVip: boolean): string => {
    const checkHQ = (obj: any) => obj?.highQuality === true || obj?.quality === 'high' || obj?.quality === 'ultra' || obj?.quality === '4K';
    const checkPrompt = (p: string) => typeof p === 'string' && (p.includes('4K') || p.includes('8K') || p.includes('High Quality'));
    
    if (checkHQ(payload) || checkHQ(payload.settings) || checkHQ(payload.options) || checkHQ(payload.formData) || checkHQ(payload.style) || checkHQ(payload.tool)) {
        return '4K';
    }
    if (payload.prompt && checkPrompt(payload.prompt)) {
        return '4K';
    }
    return '1K';
};

const selectModel = (imageSize: string): string => {
    if (imageSize === '4K') return MODEL_PRO;
    return MODEL_FLASH;
};

const getImageConfig = (model: string, imageSize: string, aspectRatio?: string, count: number = 1) => {
    const config: any = {};
    if (aspectRatio) config.aspectRatio = aspectRatio;
    if (model === MODEL_PRO) {
        config.imageSize = imageSize; // '1K', '2K', '4K'
    }
    if (model === MODEL_FLASH && count > 1) {
        config.numberOfImages = count;
    }
    return config;
};

// --- HELPER: FRAMING INSTRUCTION ---
const getFramingInstruction = (frameStyle: string): string => {
    // Defaults if undefined or empty
    if (!frameStyle) return "Medium Shot (Waist-up).";

    switch (frameStyle) {
        case 'full_body': 
            return "Wide Angle Full Body Shot. **CRITICAL: Show the subject from head to toe. Do not crop the feet. Ensure the entire outfit and shoes are visible. Do not zoom in.**";
        case 'half_body': 
            return "Medium Shot (Waist-up). Show the subject from the waist up. Visible torso and head.";
        case 'shoulder_portrait': 
            return "Close-up Portrait. Head and shoulders shot. Focus on the face.";
        case 'cinematic_wide': 
            return "Cinematic Wide Shot. Environmental portrait showing the subject small in a vast background. **CRITICAL: Do not zoom in on the person.**";
        default: 
            return "Medium Shot (Waist-up).";
    }
};

const getAi = (useBackup: boolean = false, modelType: 'image' | 'video' = 'image') => {
    let apiKey;
    
    if (modelType === 'video') {
        apiKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    } else {
        if (useBackup) {
            apiKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY;
        } else {
            apiKey = process.env.GEMINI_API_KEY;
        }
        if (!apiKey) apiKey = process.env.API_KEY;
    }
    
    if (!apiKey) throw new Error(`Server API Key missing for ${modelType}.`);
    return new GoogleGenAI({ apiKey });
};

// --- HELPER: SCRAPE VIDEO LINK ---
const extractVideoData = async (url: string, type: string): Promise<{ videoUrl: string, prompt?: string }> => {
    try {
        // Fake a browser User-Agent to prevent 403 Forbidden on some sites
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        };
        
        const response = await fetch(url, { headers });
        if (!response.ok) {
             // If direct fetch fails, just return original (might be playable directly)
             return { videoUrl: url };
        }

        const html = await response.text();
        
        let videoUrl = '';
        let prompt = '';

        // 1. Try OpenGraph tags (Common for most sites including Veo/Sora showcases)
        const ogVideo = html.match(/<meta property="og:video:secure_url" content="(.*?)"/);
        const ogVideo2 = html.match(/<meta property="og:video" content="(.*?)"/);
        const ogDesc = html.match(/<meta property="og:description" content="(.*?)"/);
        const twitterDesc = html.match(/<meta name="twitter:description" content="(.*?)"/);
        const twitterVideo = html.match(/<meta name="twitter:player:stream" content="(.*?)"/);

        if (ogVideo && ogVideo[1]) videoUrl = ogVideo[1];
        else if (ogVideo2 && ogVideo2[1]) videoUrl = ogVideo2[1];
        else if (twitterVideo && twitterVideo[1]) videoUrl = twitterVideo[1];

        if (ogDesc && ogDesc[1]) prompt = ogDesc[1];
        else if (twitterDesc && twitterDesc[1]) prompt = twitterDesc[1];

        // 2. Try specific JSON data patterns (Next.js, React hydration data)
        if (!videoUrl) {
             // Look for .mp4 links in the raw source code
             // Regex for http...mp4
             const mp4Matches = html.match(/"(https?:\/\/[^"]+?\.mp4[^"]*)"/g);
             if (mp4Matches && mp4Matches.length > 0) {
                 // Pick the longest url as it's likely the highest quality one
                 const cleanMatches = mp4Matches.map(m => m.replace(/"/g, '').replace(/\\u0026/g, '&'));
                 videoUrl = cleanMatches.sort((a, b) => b.length - a.length)[0];
             }
        }
        
        // Decode HTML entities in prompt
        if (prompt) {
            prompt = prompt
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">");
        }
        
        // Fallback: If no extraction worked, assume it's a direct link or un-scrapable, return original
        return {
            videoUrl: videoUrl || url, 
            prompt: prompt
        };
        
    } catch (error) {
        console.error("Scraping failed:", error);
        // Return original as fallback
        return { videoUrl: url };
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    const clientPaid = payload?.isPaid === true;
    const { isVip, uid } = await getUserStatus(idToken, clientVipStatus);

    let shouldAddWatermark = true;
    if (isVip || clientPaid) {
        shouldAddWatermark = false;
    } else if (uid && !isVip && !clientPaid) {
        shouldAddWatermark = true;
    }

    const processOutputImage = async (base64Data: string | undefined): Promise<string> => {
        if (!base64Data) throw new Error("Không có dữ liệu ảnh được tạo.");
        if (shouldAddWatermark) {
            const inputBuffer = Buffer.from(base64Data, 'base64');
            const watermarkedBuffer = await addWatermark(inputBuffer);
            return `data:image/png;base64,${watermarkedBuffer.toString('base64')}`;
        }
        return `data:image/png;base64,${base64Data}`;
    };

    const runWithFallback = async (logicFn: (ai: GoogleGenAI) => Promise<any>) => {
        try {
            const ai = getAi(false);
            return await logicFn(ai);
        } catch (error: any) {
            const msg = (error.message || String(error)).toLowerCase();
            if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('overloaded') || msg.includes('503')) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const aiBackup = getAi(true); 
                    return await logicFn(aiBackup);
                } catch (backupError: any) {
                    throw backupError; 
                }
            }
            throw error;
        }
    };

    const generateWithModelFallback = async (
        primaryModel: string,
        fallbackModel: string,
        generateFn: (model: string) => Promise<any>
    ) => {
        try {
            return await generateFn(primaryModel);
        } catch (error: any) {
            const msg = (error.message || String(error)).toLowerCase();
            if ((msg.includes('overloaded') || msg.includes('503')) && primaryModel !== fallbackModel) {
                return await generateFn(fallbackModel);
            }
            throw error;
        }
    };

    try {
        if (action === 'generateSpeech') {
             const ai = getAi(true);
             const { text, voiceId, baseVoice, speed } = payload;
             const geminiBaseVoice = baseVoice || (voiceId.includes('male') && !voiceId.includes('female') ? 'Fenrir' : 'Aoede');
 
             let speedInstruction = "";
             if (speed) {
                 if (speed < 0.8) speedInstruction = "Speaking pace: Very Slow, deliberate.";
                 else if (speed < 1.0) speedInstruction = "Speaking pace: Slow, relaxed.";
                 else if (speed > 1.2) speedInstruction = "Speaking pace: Fast, energetic.";
                 else if (speed > 1.5) speedInstruction = "Speaking pace: Very Fast, hurried.";
                 else speedInstruction = "Speaking pace: Normal, natural.";
             }
             const promptWithSpeed = `${text}\n\n[INSTRUCTION]\n${speedInstruction}`;
 
             const response = await ai.models.generateContent({
                 model: TTS_MODEL,
                 contents: { parts: [{ text: promptWithSpeed }] }, 
                 config: {
                     responseModalities: [Modality.AUDIO],
                     speechConfig: {
                         voiceConfig: {
                             prebuiltVoiceConfig: { voiceName: geminiBaseVoice },
                         },
                     },
                 },
             });
 
             const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
             if (!audioData) throw new Error("Không tạo được âm thanh.");
             return res.json({ audioData });
         }
         
         if (action === 'enhanceVideoPrompt') {
            const ai = getAi(false); 
            const { prompt, language } = payload;
            
            const langInstruction = language === 'vi' 
                ? "Output the result in Vietnamese language. Viết lại bằng tiếng Việt mô tả điện ảnh." 
                : "Output the result in English language.";

            const systemInstruction = `You are a professional film director and cinematographer.
            Rewrite the user's video prompt into a highly detailed, cinematic description suitable for AI video generation (like Veo or Sora).
            
            Focus on:
            1. Camera Angle (Wide, Close-up, Drone, Tracking shot).
            2. Lighting (Cinematic, Golden Hour, Neon, Moody).
            3. Movement (Slow motion, Hyperlapse, Smooth).
            4. Details (Textures, atmosphere, weather).
            
            ${langInstruction}
            Keep it concise but descriptive. Do not add introductory text like "Here is the prompt". Just return the refined prompt.
            
            User Prompt: "${prompt}"`;
            
            const response = await ai.models.generateContent({
                model: TEXT_MODEL,
                contents: { parts: [{ text: systemInstruction }] }
            });
            
            return res.json({ enhancedPrompt: response.text });
         }

         if (action === 'analyzeVideoFrames') {
             const ai = getAi(false);
             const { frames, language } = payload; // frames is Array of Base64 strings

             if (!frames || !Array.isArray(frames) || frames.length === 0) {
                 return res.status(400).json({ error: "No frames provided for analysis." });
             }

             const parts: any[] = [];
             
             // Add instructions first
             const langInstruction = language === 'vi' ? "Tiếng Việt" : "English";
             const instruction = `You are an expert Cinematographer and Prompt Engineer.
             You will be provided with sequential frames from a video.
             
             TASK:
             Analyze each frame and write a detailed, high-quality AI video generation prompt that describes the scene.
             Focus on: Subject, Action, Environment, Lighting, Camera Angle, and Style.
             
             OUTPUT FORMAT:
             Return a JSON Array of strings. Each string is the prompt for the corresponding image index.
             Example: ["Prompt for image 1", "Prompt for image 2", ...]
             
             Language: ${langInstruction}.
             Output ONLY JSON. No markdown.`;

             parts.push({ text: instruction });

             // Add images
             frames.forEach(frame => {
                 // Ensure we strip header if present, though client should send raw base64 usually
                 const base64 = frame.includes('base64,') ? frame.split('base64,')[1] : frame;
                 parts.push({ inlineData: { data: base64, mimeType: 'image/jpeg' } });
             });

             const response = await ai.models.generateContent({
                 model: TEXT_MODEL, // Using Flash for analysis is cost-effective and fast enough
                 contents: { parts },
                 config: { responseMimeType: 'application/json' }
             });
             
             return res.json({ prompts: JSON.parse(response.text || '[]') });
         }
         
         // --- NEW: GET HOT TRENDS HANDLER ---
         if (action === 'getHotTrends') {
             const ai = getAi(false);
             // Prompt Gemini to list current hot trends. 
             // We specifically ask for visual trends suitable for photo generation.
             const prompt = `List 10 currently viral or popular visual trends for social media photos (Instagram, TikTok) in 2024/2025. 
             Focus on styles like "Cyberpunk", "Y2K", "Vintage Film", "Barbiecore", "Old Money", etc.
             Output strictly a JSON array of strings. Example: ["Cyberpunk City", "Y2K Fashion", "Wes Anderson Style"].
             Do not include markdown code blocks.`;
             
             const response = await ai.models.generateContent({
                 model: TEXT_MODEL,
                 contents: { parts: [{ text: prompt }] },
                 config: { responseMimeType: 'application/json' }
             });
             
             let trends = [];
             try {
                 trends = JSON.parse(response.text || '[]');
             } catch (e) {
                 console.warn("Failed to parse trends JSON", e);
                 // Fallback trends if parsing fails
                 trends = ["Cyberpunk", "Y2K", "Vintage", "Cinematic", "Neon", "Pastel", "Minimalist"];
             }
             return res.json({ trends });
         }

         if (action === 'analyzeProductImage') {
            const ai = getAi(false);
            const { base64Image, mimeType, language } = payload;
            
            const prompt = `You are a professional Marketing Copywriter and Product Analyst.
            Analyze the provided product image and extract the following information.
            Return a valid JSON object (NO markdown, NO backticks) with these keys:
            
            - name: Product name (guess if not visible).
            - brand: Brand name (guess if not visible).
            - category: Product category.
            - price: Estimated price in ${language === 'vi' ? 'VND (e.g. 500.000đ)' : 'USD (e.g. $20)'}.
            - merchant: Suggested marketplace (e.g. Shopee, Amazon).
            - rating: A realistic rating (e.g. 4.8).
            - features: Key features observed (comma separated).
            - pros: 3 potential selling points/advantages.
            - cons: 2 potential limitations (be realistic).
            
            Output Language: ${language === 'vi' ? 'Vietnamese' : 'English'}.
            Do NOT include markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const response = await ai.models.generateContent({
                model: TEXT_MODEL,
                contents: { parts: [
                    { inlineData: { data: base64Image, mimeType: mimeType || 'image/jpeg' } },
                    { text: prompt }
                ]},
                config: { responseMimeType: 'application/json' }
            });

            return res.json(JSON.parse(response.text || '{}'));
         }

         // --- NEW CASE: Generate Prompt from Image (Fixing "Unknown action") ---
         if (action === 'generatePromptFromImage') {
            const ai = getAi(false);
            const { base64Image, mimeType, isFaceLockEnabled, language } = payload;

            const langInstruction = language === 'vi' ? 'Tiếng Việt' : 'English';
            
            // Checkbox logic: If checked, add specific instruction
            const faceLockInstruction = isFaceLockEnabled 
                ? 'CRITICAL: The user wants to preserve the face. Describe the facial features (eyes, nose, mouth, skin texture, age, expression) in EXTREME detail so a face-swapper or generator can reconstruct it accurately.' 
                : '';

            const prompt = `Describe this image for an AI image generator prompt.
            Language: ${langInstruction}.
            Focus on: Subject description, clothing, pose, background, lighting, artistic style, and mood.
            ${faceLockInstruction}
            Do not use introductory phrases like "Here is a description". Just output the prompt directly.`;

            const response = await ai.models.generateContent({
                model: TEXT_MODEL, // gemini-2.5-flash works well for vision-to-text
                contents: { parts: [
                    { inlineData: { data: base64Image, mimeType: mimeType || 'image/jpeg' } },
                    { text: prompt }
                ]}
            });

            return res.json({ prompt: response.text });
         }
 
         if (action === 'generateVeoVideo') {
             const ai = getAi(false, 'video');
             const { base64Image, prompt, characterImages, settings } = payload;
             
             // DEFAULT: Fast model
             let selectedModel = VEO_MODEL_FAST;
             let resolution = settings?.resolution || '720p';
             let aspectRatio = settings?.aspectRatio || '16:9';
             let isAudioEnabled = settings?.audio === true;

             if (resolution === '720p') {
                 selectedModel = VEO_MODEL_FAST;
             } else if (resolution === '1080p') {
                 selectedModel = VEO_MODEL_REF;
             }
             
             // FORCE MODEL SELECTION: If input is an image (Image-to-Video) or has characters (Character Sync),
             // use VEO_MODEL_REF (generate-preview) because it reliably supports image input.
             // Fast model support for image input varies by region/version.
             if (base64Image || (characterImages && characterImages.length > 0)) {
                 selectedModel = VEO_MODEL_REF;
             }

             let referenceImagesPayload: any[] | undefined = undefined;
             
             if (characterImages && Array.isArray(characterImages) && characterImages.length > 0) {
                 selectedModel = VEO_MODEL_REF; 
                 referenceImagesPayload = characterImages.slice(0, 3).map((b64: string) => ({
                     image: { imageBytes: b64, mimeType: 'image/png' },
                     referenceType: 'ASSET',
                 }));
             }
             
             const config: any = {
                 numberOfVideos: 1,
                 resolution: resolution,
                 aspectRatio: aspectRatio
             };

             let finalPrompt = prompt;
             if (isAudioEnabled) {
                 finalPrompt += ", cinematic sound effects, high quality audio, immersive atmosphere";
             } else {
                 finalPrompt += ", silent video";
             }

             const requestPayload: any = {
                 model: selectedModel,
                 prompt: finalPrompt, 
                 config: config
             };

             if (referenceImagesPayload) {
                 requestPayload.config.referenceImages = referenceImagesPayload;
             } else if (base64Image) {
                 // BUGFIX: Detect mime type from Data URI or default to jpeg if raw base64 provided.
                 const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
                 const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'; // Default to png if regex fails or unknown
                 const rawBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
                 
                 requestPayload.image = { imageBytes: rawBase64, mimeType: mimeType };
             }
             
             let operation = await ai.models.generateVideos(requestPayload);
             let retries = 0;
             while (!operation.done && retries < 60) {
                 await new Promise(resolve => setTimeout(resolve, 10000));
                 operation = await ai.operations.getVideosOperation({operation: operation});
                 retries++;
             }
             
             if (!operation.done) throw new Error("Video generation timed out.");
             const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
             if (!downloadLink) throw new Error("No video URI returned.");
             
             const usedKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
             const vidRes = await fetch(`${downloadLink}&key=${usedKey}`);
             const vidArrayBuffer = await vidRes.arrayBuffer();
             const vidBase64 = Buffer.from(vidArrayBuffer).toString('base64');
             
             return res.json({ videoUrl: `data:video/mp4;base64,${vidBase64}` });
         }

        const imageSize = resolveImageSize(payload, isVip);
        const selectedModel = selectModel(imageSize);

        switch (action) {
            // ... (Marketing Handlers - unchanged)
            case 'generateMarketingAdCopy': {
                const ai = getAi(false);
                const { product, imagePart, language } = payload;
                const lang = language === 'vi' ? 'Vietnamese' : 'English';
                
                const parts: Part[] = [];
                if (imagePart) parts.push(imagePart);
                
                const prompt = `Act as a professional Marketing Copywriter. Write a HIGH-CONVERSION Ad Copy for Facebook/Instagram.
                
                [Product Information]
                Product: ${product.brand} ${product.name}
                Category: ${product.category}
                Features: ${product.features}
                Pros: ${product.pros}
                Price: ${product.price}
                Where to buy: ${product.merchant}
                
                [Requirements]
                1. Language: ${lang} (Natural, Engaging, Viral style).
                2. Structure:
                   - 🎣 **HOOK**: Grab attention immediately (Question, Shocking fact, or Benefit).
                   - 😩 **PAIN POINT**: What problem does the user have?
                   - 💡 **SOLUTION**: Introduce the product as the hero.
                   - ✅ **BENEFITS**: Bullet points of key features (Use emojis).
                   - 💰 **OFFER**: Mention price/promo clearly.
                   - 👇 **CTA**: Strong Call to Action.
                3. Tone: Enthusiastic, Trustworthy, FOMO (Fear Of Missing Out).
                4. Formatting: Use bolding, emojis, and clear line breaks for readability.`;
                
                parts.push({ text: prompt });
                
                const geminiRes = await ai.models.generateContent({
                   model: TEXT_MODEL, 
                   contents: { parts }
                });
                
                return res.json({ text: geminiRes.text });
            }
            case 'generateMarketingVideoScript': {
                const ai = getAi(false);
                const { product, tone, angle, imagePart, language } = payload;
                const lang = language === 'vi' ? 'Vietnamese' : 'English';
                
                const parts: Part[] = [];
                if (imagePart) parts.push(imagePart);
                
                const prompt = `Act as a professional TV Commercial (TVC) Director and Scriptwriter.
                Write a Viral Video Script (TikTok/Reels format, 30-60s).
                
                [Product Info]
                - Product: ${product.brand} ${product.name}
                - Key Selling Point: ${angle}
                - Tone: ${tone}
                
                [Output Format - Strict Markdown Table]
                Create a table with these columns:
                | Time | Visual (Scene Description) | Audio (Voiceover/Dialogue) | Director Notes (Camera/Lighting) |
                
                [Script Requirements]
                1. Language: ${lang}.
                2. **Visuals**: Be highly descriptive (e.g., "Close-up shot of product texture", "Fast transition", "Split screen").
                3. **Audio**: Catchy, conversational, matches the tone.
                4. **Director Notes**: Add technical cues like "Zoom in", "Pan left", "Soft lighting", "Upbeat music starts".
                5. **Structure**:
                   - 0-3s: Strong Visual Hook (Stop the scroll).
                   - 3-15s: Problem/Context & Product Reveal.
                   - 15-45s: Demo/Benefits/Testimonial vibe.
                   - 45-60s: Strong CTA (Price: ${product.price}, Buy at: ${product.merchant}).
                
                Make it look like a professional production document.`;
                
                parts.push({ text: prompt });
                
                const geminiRes = await ai.models.generateContent({
                   model: TEXT_MODEL,
                   contents: { parts }
                });
                
                return res.json({ text: geminiRes.text });
            }

            case 'generateSongContent': {
                const ai = getAi(false);
                const { topic, genre, mood, language } = payload;
                const langFull = language === 'vi' ? 'Vietnamese' : 'English';

                const prompt = `ACT AS A PROFESSIONAL SONGWRITER. 
                Input: Topic: "${topic}", Genre: "${genre}", Mood: "${mood}", Language: "${langFull}".
                
                TASK:
                1. Write a song title (in ${langFull}).
                2. Write full lyrics with structure (Verse 1, Chorus, Verse 2, Chorus, Bridge, Outro) in ${langFull}.
                3. Write chords for guitar/piano.
                4. Write a short visual description for Album Art. CRITICAL: This description MUST be in ${langFull} language so the user can understand it.
                5. CRITICAL: Generate a "Music Style Prompt" optimized for Suno AI (Keep this style prompt in English for better AI understanding). 
                   Format: comma-separated tags describing genre, mood, instruments, tempo, and vocals.
                   Example: "Upbeat Pop, Female Vocals, 120bpm, Catchy Hook, Piano and Synth".
                   Ensure the style matches the requested "${genre}" and "${mood}".
                
                OUTPUT JSON ONLY:
                {
                  "title": "string",
                  "lyrics": "string",
                  "chords": "string",
                  "description": "string",
                  "stylePrompt": "string"
                }`;
                
                const geminiRes = await ai.models.generateContent({
                   model: TEXT_MODEL,
                   contents: { parts: [{ text: prompt }] },
                   config: { responseMimeType: "application/json" }
                });
                return res.json(JSON.parse(geminiRes.text || '{}'));
            }
            case 'analyzeMusicAudio': {
                // Use Flash for fast multimodal analysis
                const ai = getAi(false);
                const { base64, mimeType } = payload;
                const prompt = `ANALYZE AUDIO FILE.
                Task 1: Extract the full lyrics (transcription). Format with sections like [Verse], [Chorus].
                Task 2: Generate a 'Suno AI Style Prompt'. Describe the music style, genre, mood, instruments, tempo, and vocals in English.
                
                Example Style: "Male Vocals, Acoustic Pop, Sad, 80 BPM, Guitar, Melancholic".
                
                OUTPUT JSON ONLY:
                {
                  "style": "string",
                  "lyrics": "string"
                }`;

                const geminiRes = await ai.models.generateContent({
                   model: 'gemini-2.5-flash',
                   contents: { parts: [
                       { inlineData: { data: base64, mimeType } },
                       { text: prompt }
                   ] },
                   config: { responseMimeType: "application/json" }
                });
                return res.json(JSON.parse(geminiRes.text || '{}'));
            }
             case 'generateIdPhoto': {
                return await runWithFallback(async (ai) => {
                    const { originalImage, settings } = payload;
                    const buildIdPhotoPrompt = (s: any) => {
                        let p = `**NHIỆM VỤ:** Tạo ảnh thẻ chuyên nghiệp (ID Photo). Cắt lấy phần đầu và vai chuẩn thẻ. `;
                        if (s.background.mode === 'ai' && s.background.customPrompt) {
                            p += `**1. NỀN:** AI Background: "${s.background.customPrompt}". Bokeh nhẹ. `;
                        } else {
                            const c = s.background.mode === 'custom' ? s.background.customColor : (s.background.mode === 'white' ? '#FFFFFF' : '#E0E8F0');
                            p += `**1. NỀN:** Màu đơn sắc ${c}. Tách nền sạch sẽ, không lem tóc. `;
                        }
                        if (s.outfit.mode === 'upload') {
                            p += `**2. TRANG PHỤC:** Thay bằng bộ đồ ở ảnh tham chiếu thứ 2. Giữ cấu trúc cơ thể tự nhiên. `;
                        } else if (!s.outfit.keepOriginal) {
                            const outfitName = s.outfit.mode === 'preset' ? s.outfit.preset : s.outfit.customPrompt;
                            p += `**2. TRANG PHỤC:** Thay thế toàn bộ trang phục gốc thành "${outfitName}". Đảm bảo cổ áo và vai cân đối, chuyên nghiệp. `;
                        }
                        p += `**3. GƯƠNG MẶT & TÓC:** Giữ nguyên 100% đặc điểm nhận dạng khuôn mặt. `;
                        if (s.face.hairStyle !== 'keep_original') {
                            let hairDesc = "";
                            if (s.face.hairStyle === 'auto') hairDesc = "Tóc buộc gọn gàng ra sau, lộ rõ hai tai và trán.";
                            else if (s.face.hairStyle === 'slicked_back') hairDesc = "Vuốt ngược gọn gàng (slicked back).";
                            else if (s.face.hairStyle === 'down') hairDesc = "Tóc thả tự nhiên, suôn mượt.";
                            p += `Thay đổi tóc thành: "${hairDesc}". `;
                        } else {
                            p += `Giữ nguyên kiểu tóc gốc. `;
                        }
                        if (s.face.smoothSkin) p += `Làm mịn da nhẹ nhàng. `;
                        if (s.face.slightSmile) p += `Cười mỉm nhẹ. `;
                        return p;
                    };
                    const prompt = buildIdPhotoPrompt(settings);
                    const parts = [{ inlineData: { data: originalImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                    if (payload.outfitImagePart) parts.splice(1, 0, payload.outfitImagePart);
                    let modelRatio = settings.aspectRatio === '5x5' ? '1:1' : '3:4';
                    
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, modelRatio) }
                        });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                    });
                });
           }
           case 'generateHeadshot': {
                return await runWithFallback(async (ai) => {
                    const { imagePart, prompt: p } = payload;
                    const prompt = `[TASK] Headshot. ${p}. [QUALITY] ${imageSize}, Photorealistic.`;
                    
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [imagePart, { text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, undefined, 1) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                    });
                });
           }
           case 'performRestoration':
           case 'performDocumentRestoration': {
               return await runWithFallback(async (ai) => {
                   const { imagePart, options } = payload;
                   const prompt = `Restoration Task. Level: ${options.mode}. Details: Remove scratches, colorize, sharpen. Context: ${options.context || ''}.`;
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [imagePart, { text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                   });
               });
           }
           case 'generateFashionPhoto': {
               return await runWithFallback(async (ai) => {
                   const { imagePart, settings } = payload;
                   
                   // --- FRAMING INSTRUCTION ---
                   const framing = getFramingInstruction(settings.aspectRatio === '16:9' ? 'cinematic_wide' : 'half_body'); // Heuristic default, refine if needed

                   const prompt = `[TASK] FASHION STUDIO - VIRTUAL LOOKBOOK.
                   Category: ${settings.category}. Style: ${settings.style}.
                   Pose: ${settings.description || 'Professional Model Pose'}.
                   Framing: ${framing}
                   
                   [CRITICAL INSTRUCTION - IDENTITY PRESERVATION]
                   1. STRICT FACE LOCK: The face in the output MUST BE A PERFECT COPY of the input subject image.
                   2. Do NOT generate a generic model face. You must use the input face as the absolute reference.
                   3. Preserve facial features (eyes, nose, lips, skin marks) exactly.
                   4. Only change the clothing and background. The head and face structure must be untouched.
                   
                   [FRAMING ENFORCEMENT]
                   **DO NOT ZOOM IN**. If 'Full Body' is requested, user MUST see shoes. If 'Cinematic Wide' is requested, user must see environment.
                   
                   [QUALITY] Photorealistic, 8K, Masterpiece.`;
                   
                   // FORCE MODEL PRO for strict identity
                   const forcedModel = MODEL_PRO;

                   return await generateWithModelFallback(forcedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [imagePart, { text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                   });
               });
           }
            case 'generateFootballPhoto': {
               return await runWithFallback(async (ai) => {
                   const { settings } = payload;
                   const isIdolMode = settings.mode === 'idol';
                   const isHQ = settings.highQuality === true;
                   const targetResolution = isHQ ? '4K' : '1K';
                   
                   // FORCE PRO MODEL FOR IDENTITY PRESERVATION (DUAL IDENTITY LOCKING)
                   const selectedFootballModel = 'gemini-3-pro-image-preview'; 

                   let prompt = "";
                   
                   if (isIdolMode) {
                       // CHUP CUNG IDOL
                       prompt = `[TASK] REALISTIC PHOTO COMPOSITE - CELEBRITY FAN MOMENT.
                       
                       [SCENE DETAILS]
                       - Action: ${settings.scene}.
                       - Style: ${settings.style}.
                       - Context: A real-life photo, high resolution.
                       
                       [CHARACTERS - CRITICAL IDENTITY RULES]
                       1. CELEBRITY: ${settings.player} (${settings.team}). Must look exactly like the real famous footballer.
                       2. FAN (USER): The person from the INPUT IMAGE.
                          - FACE LOCK: The Fan's face MUST be an EXACT REPLICA of the Input Image face.
                          - Do not beautify or genericize the Fan's face. Keep skin texture and features identical.
                       
                       [COMPOSITION]
                       The two people are standing/interacting naturally together in the specified scene.`;
                   } else {
                       // THU DO (VIRTUAL TRY-ON)
                       prompt = `[TASK] VIRTUAL TRY-ON / OUTFIT SWAP.
                       
                       [INPUT]
                       - Source Identity: The person in the provided image.
                       - Target Outfit: ${settings.team} National/Club Football Kit.
                       
                       [SCENE]
                       - Action: ${settings.scene}.
                       - Style: ${settings.style}.
                       
                       [CRITICAL INSTRUCTION - IDENTITY PRESERVATION]
                       1. FACE LOCK: The output face MUST BE 100% IDENTICAL to the source image.
                       2. Do NOT generate a random model. Use the actual input face.
                       3. Only change the clothing and background. Keep the head structure and facial features exact.`;
                   }
                   
                   return await generateWithModelFallback(selectedFootballModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [{ inlineData: { data: settings.sourceImage.base64, mimeType: settings.sourceImage.mimeType } }, { text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, targetResolution) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                   });
               });
           }
           case 'generateBeautyPhoto': {
               return await runWithFallback(async (ai) => {
                   const { baseImage, tool, subFeature, style } = payload;
                   const prompt = `Beauty Retouch. Tool: ${tool.englishLabel}. Feature: ${subFeature?.englishLabel}. Style: ${style?.englishLabel}. Maintain identity.`;
                   const parts = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                   });
               });
           }
           case 'generateFourSeasonsPhoto': {
               return await runWithFallback(async (ai) => {
                   const { imagePart, scene, season, aspectRatio, customDescription } = payload;
                   const prompt = `[TASK] Four Seasons Photo. Season: ${season}. Scene: ${scene.title}. ${scene.desc}. ${customDescription}. [ASPECT] ${aspectRatio}.`;
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [imagePart, { text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, aspectRatio) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                   });
               });
           }
           case 'detectOutfit': {
                return await runWithFallback(async (ai) => {
                    const { base64Image, mimeType } = payload;
                    const prompt = `Hãy mô tả trang phục trong bức ảnh này một cách ngắn gọn bằng Tiếng Việt. Yêu cầu: Chỉ trả về mô tả trang phục. Độ dài tối đa: 15 từ.`;
                    return await generateWithModelFallback(MODEL_FLASH, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({
                            model: model,
                            contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] }
                        });
                        return res.json({ outfit: geminiRes.text?.trim() || "" });
                    });
                });
            }
            case 'editOutfitOnImage': {
                 return await runWithFallback(async (ai) => {
                     const { base64Image, mimeType, newOutfitPrompt } = payload;
                     const prompt = `[TASK] Edit Outfit. Change the person's outfit to: "${newOutfitPrompt}". [CONSTRAINTS] Keep the face, hair, pose, and background 100% unchanged. Only change the clothing.`;
                     return await generateWithModelFallback(MODEL_FLASH, MODEL_PRO, async (model) => {
                         const geminiRes = await ai.models.generateContent({
                             model: model,
                             contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] },
                             config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, '1K') } 
                         });
                         const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                         return res.json({ imageData });
                     });
                 });
            }
            case 'removeVideoWatermark': {
                 const { url, type } = payload;
                 // Execute scraping on server side
                 const result = await extractVideoData(url, type);
                 return res.json(result);
            }
           case 'generateMarketingImage': {
               return await runWithFallback(async (ai) => {
                   const { productImagePart, referenceImagePart, productDetails, settings } = payload;
                   const parts: Part[] = [];
                   if (productImagePart) parts.push(productImagePart);
                   if (referenceImagePart) parts.push(referenceImagePart);
                   const prompt = `[TASK] Marketing Image. Product: ${productDetails.brand} ${productDetails.name}. Template: ${settings.templateId}. Tone: ${settings.tone}. Features: ${productDetails.features}. [QUALITY] 8K, Advertising.`;
                   parts.push({ text: prompt });
                   
                   // FORCE MODEL PRO (Banana Pro) for Marketing Images as requested
                   const marketingModel = MODEL_PRO;

                   return await generateWithModelFallback(marketingModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, settings.aspectRatio) }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData, prompt });
                   });
               });
           }
           case 'generateArtStyleImages': {
               return await runWithFallback(async (ai) => {
                   const { modelFile, otherFiles, styles, quality, aspect, count, userPrompt } = payload;
                   const parts: Part[] = [];
                   
                   // Validation
                   if (!modelFile?.base64) return res.status(400).json({ error: "Dữ liệu ảnh Model không hợp lệ." });
                   
                   // Input Images
                   parts.push({ inlineData: { data: modelFile.base64, mimeType: modelFile.mimeType } });
                   if (otherFiles.clothing?.base64) parts.push({ inlineData: { data: otherFiles.clothing.base64, mimeType: otherFiles.clothing.mimeType } });
                   if (otherFiles.accessories?.base64) parts.push({ inlineData: { data: otherFiles.accessories.base64, mimeType: otherFiles.accessories.mimeType } });
                   if (otherFiles.product?.base64) parts.push({ inlineData: { data: otherFiles.product.base64, mimeType: otherFiles.product.mimeType } });
                   
                   // ULTRA-STRONG IDENTITY PROMPT
                   const prompt = `[TASK] PHOTOREALISTIC COMPOSITE - IDENTITY PRESERVATION IS PRIORITY #1.
                   
                   [INPUTS]
                   - Image 1: REFERENCE IDENTITY (The Face).
                   - Other Images: Clothing/Product context.
                   
                   [SETTINGS]
                   - Styles: ${styles.join(', ')}.
                   - User Description: ${userPrompt}.
                   - Aspect Ratio: ${aspect}.
                   
                   [CRITICAL INSTRUCTIONS]
                   1. 🆔 FACE LOCK: The output face MUST be an EXACT REPLICA of the person in Image 1. 
                      - Do NOT generate a generic face. 
                      - Do NOT change ethnicity, age, or key facial features.
                      - Keep the same facial structure and identity.
                   2. INTEGRATION: Blend the face naturally into the new style/clothing/lighting defined by the styles and description.
                   3. QUALITY: Commercial Fashion Photography, 8K, Ultra-detailed, Masterpiece.
                   
                   GENERATE ONLY THE IMAGE. NO TEXT.`;

                   parts.push({ text: prompt });
                   
                   // Force Google Banana Pro (gemini-3-pro-image-preview)
                   // This model is best for instruction following and identity.
                   const artModel = 'gemini-3-pro-image-preview'; 
                   
                   // Resolution Logic
                   // If user selected 4K or 8K -> Use 4K mode (high cost/latency)
                   // Else (1080p, 2K) -> Use 1K mode (fast)
                   let targetRes = '1K';
                   if (quality === '4K' || quality === '8K') {
                       targetRes = '4K';
                   }

                   return await generateWithModelFallback(artModel, MODEL_FLASH, async (model) => {
                       const generationPromises = [];
                       const imgConfig = getImageConfig(model, targetRes, aspect);
                       
                       for(let i=0; i<count; i++) {
                           generationPromises.push(ai.models.generateContent({
                               model: model,
                               contents: { parts },
                               config: { responseModalities: [Modality.IMAGE], imageConfig: imgConfig }
                           }));
                       }
                       const results = await Promise.all(generationPromises);
                       const images = [];
                       for(const r of results) {
                           const data = r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                           if(data) images.push(await processOutputImage(data));
                       }
                       return res.json({ images });
                   });
               });
           }
           case 'generateBatchImages': {
               return await runWithFallback(async (ai) => {
                   const { prompt, aspectRatio, numOutputs } = payload;
                   const parts = [{ text: `[TASK] Generate Image. Prompt: ${prompt}. Aspect: ${aspectRatio}.` }];
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const generationPromises = [];
                       for(let i=0; i < numOutputs; i++) {
                            generationPromises.push(ai.models.generateContent({
                               model: model,
                               contents: { parts },
                               config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, aspectRatio) }
                           }));
                       }
                       const results = await Promise.all(generationPromises);
                       const images = [];
                       for(const r of results) {
                           const data = r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                           if(data) images.push(await processOutputImage(data));
                       }
                       return res.json({ images });
                   });
               });
           }
           case 'generateImagesFromFeature': {
                return await runWithFallback(async (ai) => {
                    const { featureAction, formData } = payload;
                    let parts: Part[] = [];
                    let prompt = "";
                    let aspectRatio = formData.aspect_ratio || "4:3";
                    
                    // --- HELPER: GET FRAMING ---
                    // Translate frame_style to explicit prompt instruction
                    const framing = getFramingInstruction(formData.frame_style);

                    // --- HELPER: Add Images safely ---
                    const addImagePart = (b64: string, mime: string) => {
                        if(b64) parts.push({ inlineData: { data: b64, mimeType: mime } });
                    };

                    // --- 1. EXTRACT OUTFIT (Tách trang phục) ---
                    if (featureAction === 'extract_outfit') {
                         if (formData.subject_image?.base64) {
                             addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         }
                         prompt = `[TASK] PRODUCT PHOTOGRAPHY: CLOTHING EXTRACTION (Ghost Mannequin).
                         Input: Reference image of a person wearing an outfit.
                         INSTRUCTION:
                         1. ISOLATE the main outfit (top, bottom, dress) seen in the image.
                         2. GENERATE a clean product shot of JUST the clothes on a pure white background.
                         3. STYLE: Ghost Mannequin (3D shape without the person) or High-End Flat Lay.
                         4. NEGATIVE PROMPT: Do NOT generate a human face, head, hands, legs, or skin. Remove the model entirely.
                         5. Quality: 8K, Studio Lighting, Commercial E-commerce style.`;
                    } 
                    // --- 2. CHANGE HAIRSTYLE (Đổi kiểu tóc) ---
                    else if (featureAction === 'change_hairstyle') {
                         if (formData.subject_image?.base64) {
                             addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         }
                         prompt = `[TASK] VIRTUAL HAIR MAKEOVER - IDENTITY LOCK.
                         Input: Portrait of a person.
                         Target: Change hairstyle to "${formData.hairstyle}" (Color: ${formData.hair_color}, Length: ${formData.hair_length}).
                         
                         [FRAMING]
                         ${framing}
                         
                         CRITICAL RULES:
                         1. FACE LOCK: The face in the output MUST be 100% identical to the input image. Do NOT change eyes, nose, mouth, or facial structure.
                         2. Only change the hair area.
                         3. Blend the new hair naturally with the original forehead and ears.
                         4. Style: Photorealistic, High Resolution.`;
                    }
                    // --- 3. TRY ON OUTFIT (Thử trang phục) - SUPER STRICT MODE ---
                    else if (featureAction === 'try_on_outfit') {
                        // Input order matters for context
                        if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType); // INPUT 1 (PERSON)
                        if (formData.outfit_image?.base64) addImagePart(formData.outfit_image.base64, formData.outfit_image.mimeType); // INPUT 2 (OUTFIT)
                        
                        prompt = `[TASK] PHOTOREALISTIC VIRTUAL TRY-ON WITH STRICT IDENTITY PRESERVATION.
                        
                        [INPUTS]
                        - Input 1: REFERENCE PERSON (The Identity Source).
                        - Input 2: TARGET OUTFIT (The Clothing Source).
                        
                        [FRAMING]
                        **${framing}** (STRICT)
                        
                        [CRITICAL INSTRUCTION - FACE LOCK]
                        1. The output MUST contain the EXACT SAME FACE as Input 1.
                        2. Do NOT generate a "similar" person. Use the actual facial features (eyes, nose, mouth, skin texture, jawline) from Input 1.
                        3. Do NOT beautify, age-down, or alter the ethnicity of the person.
                        4. If the face changes, the task is failed.
                        5. **DO NOT ZOOM IN** on the face if a wider shot (Full Body/Half Body) is requested. Maintain the framing distance.
                        
                        [EXECUTION]
                        1. Composite the HEAD and FACE of Input 1 onto a body wearing the outfit from Input 2.
                        2. Adjust skin tone of the neck/body to match the face perfectly.
                        3. Preserve the pose if possible, or adapt the outfit to the person's pose.
                        4. Context: ${formData.prompt_detail || 'High-end studio lighting, neutral background'}.
                        
                        OUTPUT: High-Resolution Photograph.`;
                    }
                    // --- 4. KOREAN STYLE STUDIO ---
                    else if (featureAction === 'korean_style_studio') {
                         if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         const concept = formData.k_concept || "Korean Profile";
                         const quality = formData.quality || "High";

                         prompt = `[TASK] KOREAN STUDIO PORTRAIT.
                         Target Style: ${concept}.
                         
                         [FRAMING]
                         **${framing}**
                         
                         INSTRUCTION: Generate a high-end studio photo of the input person in this specific Korean style.
                         CRITICAL: PRESERVE FACIAL IDENTITY 100%. The face must look exactly like the input person, just with better lighting and makeup styling matching the concept.
                         **ANTI-ZOOM:** If Full Body is selected, show the shoes. Do not crop tightly on the face.
                         Quality: ${quality} Resolution, Photorealistic, 8K, Soft Lighting.`;
                    }
                    // --- 5. COUPLE COMPOSE ---
                    else if (featureAction === 'couple_compose') {
                        if (formData.person_left_image?.base64) addImagePart(formData.person_left_image.base64, formData.person_left_image.mimeType);
                        if (formData.person_right_image?.base64) addImagePart(formData.person_right_image.base64, formData.person_right_image.mimeType);
                        if (formData.custom_background?.base64) addImagePart(formData.custom_background.base64, formData.custom_background.mimeType);

                        prompt = `[TASK] COUPLE PHOTO COMPOSITE - STRICT IDENTITY MATCHING.
                        
                        [INPUTS]
                        - Input 1: MALE / LEFT Person Identity.
                        - Input 2: FEMALE / RIGHT Person Identity.
                        
                        [CONTEXT]
                        Action: ${formData.affection_action}.
                        Background: ${formData.couple_background || "Custom/Scenic"}.
                        Style: ${formData.aesthetic_style}.
                        Framing: **${framing}**.
                        
                        [CRITICAL INSTRUCTION - IDENTITY LOCK]
                        1. You MUST generate 2 distinct people.
                        2. PERSON 1 (Male/Left) MUST look exactly like Input 1.
                        3. PERSON 2 (Female/Right) MUST look exactly like Input 2.
                        4. DO NOT blend their faces. DO NOT hallucinate a random face.
                        5. Prioritize facial similarity above all else.
                        6. **RESPECT FRAMING:** If framing is 'Full Body', show both people fully. Do not zoom into a close-up kiss unless requested.
                        
                        Quality: Photorealistic, 8K, High-End Photography.`;
                    }
                    // --- 6. PRODUCT PHOTO (ENHANCED FACE LOCK) ---
                    else if (featureAction === 'product_photo') {
                        if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                        if (formData.product_image?.base64) addImagePart(formData.product_image.base64, formData.product_image.mimeType);

                        prompt = `[TASK] PROFESSIONAL PRODUCT PHOTOGRAPHY WITH MODEL.
                        Inputs: Reference Image containing Model and/or Product.
                        Framing: **${framing}**.
                        
                        [CRITICAL INSTRUCTION - IDENTITY PRESERVATION]
                        1. FACE LOCK: If the input image contains a person, the face in the output MUST BE 100% IDENTICAL to the input person. 
                        2. Do NOT generate a generic model face. Use the input face as the definitive reference.
                        3. Keep facial features, ethnicity, and expression exactly as they are in the source.
                        4. **NO ZOOM:** Ensure the framing instruction is followed. Do not crop the product or the model's body parts implied by the framing.

                        [SCENE & LIGHTING]
                        Setting: ${formData.prompt_detail || 'Commercial studio, cinematic lighting, premium aesthetic'}.
                        Focus: Highlight the product naturally.
                        
                        Quality: 8K, Advertising Standard, Masterpiece.`;
                    }
                    // --- 7. CREATE ALBUM ---
                    else if (featureAction === 'create_album') {
                         if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         // Note: Create album usually iterates multiple times in the frontend calling this API.
                         // Here we handle one generation request.
                         const pose = formData.poses && formData.poses.length > 0 ? formData.poses[0] : "Natural pose";
                         const bg = formData.backgrounds && formData.backgrounds.length > 0 ? formData.backgrounds[0] : "Scenic background";
                         
                         prompt = `[TASK] TRAVEL/ALBUM PHOTO - CREATE ALBUM.
                         
                         [SUBJECT & IDENTITY]
                         - Subject: Reference Person from Input Image.
                         - Pose: ${pose}.
                         - CRITICAL: FACE LOCK. The output face MUST BE 100% IDENTICAL to the input.
                         
                         [SCENE & FRAMING]
                         - Location: ${bg}.
                         - Framing: **${framing}**.
                         
                         INSTRUCTION: Place the subject naturally in this location with the specified pose and framing. Maintain facial identity 100%. Photorealistic.`;
                    }
                    // --- 8. PLACE IN SCENE (UPDATED WITH FRAMING & FACE LOCK) ---
                    else if (featureAction === 'place_in_scene') {
                         if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         if (formData.background_image?.base64) addImagePart(formData.background_image.base64, formData.background_image.mimeType);
                         
                         const bgDesc = formData.custom_background_prompt || (formData.background_options ? formData.background_options.join(', ') : "Scenic background");
                         
                         prompt = `[TASK] PHOTO COMPOSITE - PLACE SUBJECT IN SCENE.
                         
                         [SCENE]
                         Background Description: ${bgDesc}.
                         
                         [COMPOSITION & FRAMING]
                         **${framing}**
                         
                         [CRITICAL INSTRUCTION - IDENTITY PRESERVATION]
                         1. FACE LOCK: The face in the output MUST BE 100% IDENTICAL to the input subject image.
                         2. Use the input face as the definitive reference. Do not generate a generic face.
                         3. Blend the subject naturally into the background's lighting and perspective (shadows, color tone).
                         4. **RESPECT FRAMING**: Do not auto-zoom to the face.
                         
                         Quality: Photorealistic, 8K.`;
                    }
                     // --- 9. BIRTHDAY PHOTO ---
                    else if (featureAction === 'birthday_photo') {
                         if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         const scene = formData.birthday_scenes && formData.birthday_scenes.length > 0 ? formData.birthday_scenes[0] : "Birthday Party";
                         
                         prompt = `[TASK] BIRTHDAY CELEBRATION PHOTO.
                         Scene: ${scene}.
                         Framing: **${framing}**.
                         Subject: Input Person (Face Lock).
                         
                         INSTRUCTION: Generate a festive birthday photo featuring the subject. Happy expression, birthday decorations, cake/balloons visible. 
                         CRITICAL: FACE LOCK. Keep the face 100% identical to the input. Photorealistic.`;
                    }
                    // --- 10. HOT TREND PHOTO (UPDATED) ---
                    else if (featureAction === 'hot_trend_photo') {
                         if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         const trend = formData.selected_trends && formData.selected_trends.length > 0 ? formData.selected_trends[0] : "Trending Style";
                         prompt = `[TASK] TRENDING STYLE PHOTO - STRICT IDENTITY.
                         Trend: ${trend}.
                         Framing: **${framing}**.
                         
                         [CRITICAL INSTRUCTION - IDENTITY PRESERVATION]
                         1. FACE LOCK: The face in the output MUST BE 100% IDENTICAL to the input subject image.
                         2. Do NOT generate a generic face. Use the input face as the definitive reference.
                         3. Maintain the exact facial structure, key features (eyes, nose, mouth), and expression.
                         4. Apply the visual style of the "${trend}" trend to the clothing, background, and lighting, but keep the face intact.
                         5. **NO UNWANTED ZOOM**: If Full Body is set, show the whole outfit.
                         
                         Quality: 8K, Highly Detailed, Masterpiece.`;
                    }
                    // --- 11. CREATIVE COMPOSITE (Generic) ---
                    else if (featureAction === 'creative_composite') {
                        if (formData.main_subject?.base64) addImagePart(formData.main_subject.base64, formData.main_subject.mimeType);
                        // Add additional components if any
                        if (formData.additional_components && Array.isArray(formData.additional_components)) {
                             formData.additional_components.forEach((comp: any) => {
                                 if (comp.file?.base64) addImagePart(comp.file.base64, comp.file.mimeType);
                             });
                        }
                        
                        if (formData.document_mode) {
                             prompt = `[TASK] DOCUMENT/IMAGE EDITING & INPAINTING - STRUCTURE PRESERVATION.
                             Input: A single document or reference image.
                             User Instruction: "${formData.scene_description || formData.main_subject_description || 'Edit text'}".
                             
                             CRITICAL CONSTRAINTS:
                             1. PRESERVE STRUCTURE: Do NOT regenerate, hallucinate, or reimagine the document layout, fonts, tables, or background. The output must look EXACTLY like the input image, except for the requested change.
                             2. LOCAL EDIT ONLY: Only change the specific text, number, or small detail mentioned in the instruction.
                             3. TEXT MATCHING: If replacing text, match the original font, size, color, and alignment perfectly.
                             4. OUTPUT: Return the edited image maintaining high fidelity to the original source.`;
                        } else {
                             prompt = `[TASK] CREATIVE COMPOSITE.
                             Main Subject Description: ${formData.main_subject_description || 'Person'}.
                             Scene Description: ${formData.scene_description || 'Artistic Scene'}.
                             Framing: **${framing}**.
                             INSTRUCTION: Create a composite image based on the provided inputs and descriptions. Prioritize blending and realism (or artistic style if specified).
                             CRITICAL: FACE LOCK. Keep the face of the main subject 100% identical to the input.`;
                        }
                    }
                    // --- 12. IMAGE VARIATION GENERATOR ---
                     else if (featureAction === 'image_variation_generator') {
                        if (formData.reference_image?.base64) addImagePart(formData.reference_image.base64, formData.reference_image.mimeType);
                        prompt = `[TASK] IMAGE VARIATION - STRICT FACE LOCK.
                        Style: ${formData.style || 'Photorealistic'}.
                        Theme: ${formData.themeAnchor || 'Same Theme'}.
                        Variation Strength: ${formData.variationStrength || 50}%.
                        Identity Lock: ${formData.identityLock || 80}%.
                        Framing: **${framing}**.

                        [CRITICAL INSTRUCTION]
                        1. FACE LOCK: The face in the output MUST BE 100% IDENTICAL to the input reference image.
                        2. Do NOT generate a generic face. Use the input face as the definitive source.
                        3. If the input is a person, preserve their facial features, ethnicity, and expression exactly.
                        4. Only vary the background, lighting, or artistic style as requested.
                        `;
                    }
                    // --- 13. FASHION STUDIO (Thời trang & Studio) ---
                    else if (featureAction === 'fashion_studio') {
                        if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                        if (formData.wardrobe_refs?.base64) addImagePart(formData.wardrobe_refs.base64, formData.wardrobe_refs.mimeType);
                        
                        // STRONG IDENTITY PROMPT FOR FASHION STUDIO
                        prompt = `[TASK] FASHION STUDIO - VIRTUAL LOOKBOOK.
                        Category: ${formData.style_level}. Style: ${formData.wardrobe?.join(', ')}.
                        Pose: ${formData.pose_style}. Lighting: ${formData.lighting}.
                        Background: ${formData.sexy_background}.
                        Framing: **${framing}**.
                        
                        [CRITICAL INSTRUCTION - IDENTITY PRESERVATION]
                        1. STRICT FACE LOCK: The face in the output MUST BE 100% IDENTICAL to the input subject image.
                        2. Do NOT generate a generic model face. You must use the input face as the source of truth.
                        3. If the input is a specific person, the output MUST look exactly like them wearing the new clothes.
                        4. **ANTI-ZOOM**: Adhere strictly to the Framing instruction.
                        
                        Style Instruction: High-end Fashion Photography, 8K.`;
                    }
                    // --- 14. YOGA STUDIO ---
                    else if (featureAction === 'yoga_studio') {
                         if (formData.subject_image?.base64) addImagePart(formData.subject_image.base64, formData.subject_image.mimeType);
                         prompt = `[TASK] YOGA STUDIO.
                         Pose: ${formData.yoga_pose}. Level: ${formData.pose_level}.
                         Location: ${formData.location}. Lighting: ${formData.lighting}. Outfit: ${formData.outfit}.
                         Framing: **${framing}**.
                         INSTRUCTION: Generate a photo of the subject performing the specified yoga pose.
                         CRITICAL: FACE LOCK. The face MUST be 100% identical to the input subject image.
                         **Note:** For Full Body framing, ensure the entire pose (hands, feet) is visible and not cropped.`;
                    }
                    // --- FALLBACK ---
                    else {
                        // Generic handler for any other legacy/future types
                        for (const key in formData) {
                            if (formData[key]?.base64) addImagePart(formData[key].base64, formData[key].mimeType);
                        }
                        prompt = `[TASK] IMAGE GENERATION. Feature: ${featureAction}. Details: ${JSON.stringify(formData)}. 
                        Framing: **${framing}**.
                        CRITICAL: FACE LOCK. If a person is present in the input, keep their face 100% identical. High quality.`;
                    }

                    parts.push({ text: prompt });
                    const numImages = payload.numImages || 1;

                    // MODEL SELECTION LOGIC
                    // For sensitive identity tasks like Fashion Studio, Hair, Extraction, PRODUCT PHOTO, OR IMAGE VARIATION, force MODEL_PRO
                    let forceModel = selectedModel;
                    let targetResolution = imageSize; 

                    if (
                        featureAction === 'extract_outfit' || 
                        featureAction === 'change_hairstyle' || 
                        featureAction === 'fashion_studio' || 
                        featureAction === 'couple_compose' || 
                        featureAction === 'try_on_outfit' || // Added Try On Outfit
                        featureAction === 'product_photo' || 
                        featureAction === 'hot_trend_photo' || 
                        featureAction === 'image_variation_generator' || 
                        featureAction === 'place_in_scene' || // Added Place in Scene
                        featureAction === 'create_album' || // Added Create Album
                        featureAction === 'birthday_photo' || // Added Birthday Photo
                        featureAction === 'yoga_studio' ||
                        (featureAction === 'creative_composite' && formData.document_mode)
                    ) {
                         forceModel = MODEL_PRO; // Use Gemini 3 Pro for superior instruction following and identity preservation
                         // If user didn't select High Quality (4K), we still use Pro model but with 1K resolution for speed/cost
                         if (imageSize !== '4K') {
                             targetResolution = '1K';
                         }
                    }

                    return await generateWithModelFallback(forceModel, MODEL_FLASH, async (model) => {
                        const generationPromises = [];
                        const imgConfig = getImageConfig(model, targetResolution, aspectRatio);
                        
                        for(let i=0; i<numImages; i++) {
                            generationPromises.push(ai.models.generateContent({
                               model: model,
                               contents: { parts },
                               config: { responseModalities: [Modality.IMAGE], imageConfig: imgConfig }
                            }));
                        }
                        const results = await Promise.all(generationPromises);
                        const images = [];
                        for(const r of results) {
                           const data = r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                           if(data) images.push((await processOutputImage(data)).split(',')[1]);
                        }
                        return res.json({ images: images, successCount: images.length });
                    });
                });
           }
           // --- UPDATED FAMILY PHOTO LOGIC FOR IDENTITY PRESERVATION ---
            case 'generateFamilyPhoto':
            case 'generateFamilyPhoto_3_Pass': {
                return await runWithFallback(async (ai) => {
                    const { settings } = payload;
                    
                    let parts: Part[] = [];
                    let prompt = "";

                    // 1. ATTACH REFERENCE IMAGES
                    if (settings.members && settings.members.length > 0) {
                        settings.members.forEach((member: any, index: number) => {
                            if (member.photo && member.photo.base64) {
                                parts.push({ inlineData: { data: member.photo.base64, mimeType: member.photo.mimeType } });
                            }
                        });
                    }

                    // 2. CONSTRUCT STRONG IDENTITY PROMPT
                    if (settings.faceConsistency) {
                         prompt = `[TASK] HYPER-REALISTIC FAMILY COMPOSITE - STRICT IDENTITY MAPPING.\n`;
                         prompt += `SCENE: ${settings.scene}\n`;
                         prompt += `OUTFIT: ${settings.outfit}. POSE: ${settings.pose}\n`;
                         prompt += `CUSTOM REQUEST: ${settings.customPrompt || 'None'}\n\n`;
                         prompt += `[INPUTS] You have received ${settings.members.length} reference images.\n`;
                         prompt += `[MAPPING INSTRUCTIONS]\n`;
                         
                         settings.members.forEach((member: any, index: number) => {
                             prompt += `- Input Image ${index + 1} corresponds to Family Member ${index + 1}. Description: ${member.age} ${member.bodyDescription || ''}.\n`;
                         });

                         prompt += `\n[CRITICAL IDENTITY RULES]\n`;
                         prompt += `1. PRESERVE IDENTITY: The face of Family Member X in the output MUST look exactly like the face in Input Image X.\n`;
                         prompt += `2. NO BLENDING: Do not mix facial features between members. Keep them distinct.\n`;
                         prompt += `3. AGE ACCURACY: Adhere strictly to the age descriptions provided.\n`;
                         prompt += `4. STYLE: Photorealistic, 8K, High-End Studio Photography.\n`;
                    } else {
                        prompt = `Family Photo Composite. Scene: ${settings.scene}. Style: Artistic. Members: ${settings.members.length} people. 
                        Details: ${settings.members.map((m:any) => `${m.age}`).join(', ')}. Custom Request: ${settings.customPrompt}.`;
                    }

                    parts.push({ text: prompt });

                    // ALWAYS FORCE PRO MODEL FOR FAMILY PHOTOS to handle multiple identities
                    const familyModel = MODEL_PRO;

                    return await generateWithModelFallback(familyModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, '4K', settings.aspectRatio) }
                        });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData, similarityScores: [], debug: null });
                    });
                });
           }
           case 'generateAlbumArt': {
                return await runWithFallback(async (ai) => {
                    const { description } = payload;
                    const prompt = `[TASK] Album Cover Art. ${description}. [QUALITY] High resolution, artistic, vinyl style.`;
                    
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [{ text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, '2K', '1:1') }
                       });
                       const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                       return res.json({ imageData });
                   });
               });
            }
            case 'removeWatermark': {
                 return await runWithFallback(async (ai) => {
                     const { imagePart, highQuality } = payload;
                     const modelToUse = highQuality ? MODEL_PRO : MODEL_FLASH;
                     const prompt = "TASK: Magic Eraser / Inpainting. Remove all watermarks, text overlays, logos, and unwanted objects. Restore the background naturally. Return a clean, high-quality image. Do not alter the main subject.";
                     
                     return await generateWithModelFallback(modelToUse, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({
                            model: model,
                            contents: { parts: [imagePart, { text: prompt }] },
                            config: { responseModalities: [Modality.IMAGE], imageConfig: (model === MODEL_PRO) ? {} : getImageConfig(model, '1K') }
                        });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                     });
                 });
            }
            default:
                return res.status(400).json({ error: "Unknown action" });
        }
    } catch (e: any) {
        console.error(e);
        const friendlyError = processGoogleError(e);
        return res.status(500).json({ error: friendlyError });
    }
}