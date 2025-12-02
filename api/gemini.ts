
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
const VEO_MODEL = 'veo-3.1-fast-generate-preview';
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
                return `Lỗi từ AI: ${msg}`;
            }
        }
    } catch (e) { }

    if (rawMessage.includes('400')) return "Yêu cầu không hợp lệ (Lỗi 400). Vui lòng kiểm tra lại ảnh đầu vào.";
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
    if (checkHQ(payload) || checkHQ(payload.settings) || checkHQ(payload.options) || checkHQ(payload.formData) || checkHQ(payload.style) || checkHQ(payload.tool)) {
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
    if (model === MODEL_PRO) config.imageSize = imageSize;
    if (model === MODEL_FLASH && count > 1) config.numberOfImages = count;
    return config;
};

const getAi = (useBackup: boolean = false) => {
    let apiKey;
    if (useBackup) {
        apiKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY;
    } else {
        apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey) apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// Helper to decode HTML entities deeply
const decodeEntities = (str: string) => {
    if (!str) return str;
    let decoded = str;
    for (let i = 0; i < 3; i++) {
        decoded = decoded
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\\u0026/g, '&')
            .replace(/\\u002F/g, '/')
            .replace(/\\\//g, '/');
    }
    return decoded;
};

// --- DEEP SOURCE EXTRACTION LOGIC ---
const extractCleanVideoUrl = async (targetUrl: string): Promise<string> => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
    };

    try {
        const response = await fetch(targetUrl, { headers });
        if (!response.ok) throw new Error(`Failed to fetch page: ${response.status}`);
        
        let html = await response.text();
        html = decodeEntities(html);

        // 1. STRATEGY: JSON Hydration Data (Next.js / React Props)
        // This is crucial for Sora/Veo sites as they often hide clean links in props.
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        
        if (scriptMatches) {
            for (const scriptTag of scriptMatches) {
                // Clean tag to get content
                const content = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
                
                // Look for ANY http link ending in mp4/mov/webm inside JSON-like structures
                // We filter out "preview", "poster", "thumbnail", "watermark" to get the clean source
                const potentialUrls = content.match(/https?:\/\/[^"'\s\\]+\.(mp4|mov|webm)(?:\?[^"'\s\\]*)?/gi);

                if (potentialUrls) {
                    const cleanCandidates = potentialUrls
                        .map(u => u.replace(/\\u0026/g, '&').replace(/\\/g, '')) // Fix JSON escaped slashes
                        .filter(u => {
                            const lower = u.toLowerCase();
                            return !lower.includes('preview') && 
                                   !lower.includes('thumbnail') && 
                                   !lower.includes('poster') &&
                                   !lower.includes('small') &&
                                   !lower.includes('watermark');
                        });

                    // Prioritize specific high-quality CDNs
                    const bestCandidate = cleanCandidates.find(u => u.includes('cdn.openai.com') || u.includes('storage.googleapis.com') || u.includes('video.twimg.com')) || cleanCandidates[0];

                    if (bestCandidate) return bestCandidate;
                }
            }
        }

        // 2. STRATEGY: Raw Regex on HTML Body (Fallback)
        // Look for patterns like "url": "..." or "src": "..."
        const regex = /"(?:url|src|secure_url|video_url)"\s*:\s*"([^"]+\.(?:mp4|mov|webm)[^"]*)"/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
             let candidate = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
             if (!candidate.includes('preview') && !candidate.includes('watermark')) {
                 return candidate;
             }
        }

        // 3. STRATEGY: OpenGraph / Meta Tags
        const ogVideo = html.match(/property="og:video(?::secure_url)?"\s+content="([^"]+)"/i);
        if (ogVideo && ogVideo[1]) {
            return decodeEntities(ogVideo[1]);
        }

        const twitterVideo = html.match(/name="twitter:player:stream"\s+content="([^"]+)"/i);
        if (twitterVideo && twitterVideo[1]) {
            return decodeEntities(twitterVideo[1]);
        }

        // 4. STRATEGY: If input is already a direct link (checked in caller, but safe here)
        if (targetUrl.match(/\.(mp4|mov)$/i)) return targetUrl;

        throw new Error("Could not extract a clean video source from this page.");

    } catch (error) {
        console.error("Deep Extraction Failed:", error);
        // Return original if extraction fails, frontend will handle error display
        return targetUrl; 
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
                console.warn(`[Smart Retry] Switching to Backup Key/Model due to error: ${msg}`);
                try {
                    if (msg.includes('overloaded') || msg.includes('503')) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                    const aiBackup = getAi(true); 
                    return await logicFn(aiBackup);
                } catch (backupError: any) {
                    console.error("[Backup Failed]", backupError);
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
                console.warn(`[Model Fallback] ${primaryModel} overloaded. Switching to ${fallbackModel}.`);
                return await generateFn(fallbackModel);
            }
            throw error;
        }
    };

    try {
        const imageSize = resolveImageSize(payload, isVip);
        const selectedModel = selectModel(imageSize);

        switch (action) {
            // ... (Keep existing cases: generateSpeech, generateVeoVideo, generateIdPhoto, etc. UNCHANGED) ...
            case 'generateSpeech': {
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
                    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiBaseVoice } } } },
                });
                const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!audioData) throw new Error("Không tạo được âm thanh.");
                return res.json({ audioData });
            }
            case 'generateVeoVideo': {
                const ai = getAi(true);
                const { base64Image, prompt } = payload;
                let operation = await ai.models.generateVideos({
                    model: VEO_MODEL,
                    prompt: prompt, 
                    image: { imageBytes: base64Image.split(',')[1], mimeType: 'image/png' },
                    config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
                });
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
            case 'generateIdPhoto': {
                 return await runWithFallback(async (ai) => {
                     const { originalImage, settings } = payload;
                     const buildIdPhotoPrompt = (s: any) => {
                         let p = `**NHIỆM VỤ:** Tạo ảnh thẻ chuyên nghiệp (ID Photo). Cắt lấy phần đầu và vai chuẩn thẻ. `;
                         if (s.background.mode === 'ai' && s.background.customPrompt) p += `**1. NỀN:** AI Background: "${s.background.customPrompt}". Bokeh nhẹ. `;
                         else { const c = s.background.mode === 'custom' ? s.background.customColor : (s.background.mode === 'white' ? '#FFFFFF' : '#E0E8F0'); p += `**1. NỀN:** Màu đơn sắc ${c}. Tách nền sạch sẽ. `; }
                         if (s.outfit.mode === 'upload') p += `**2. TRANG PHỤC:** Thay bằng bộ đồ ở ảnh tham chiếu thứ 2. `;
                         else if (!s.outfit.keepOriginal) { const outfitName = s.outfit.mode === 'preset' ? s.outfit.preset : s.outfit.customPrompt; p += `**2. TRANG PHỤC:** Thay thế trang phục thành "${outfitName}". `; }
                         p += `**3. GƯƠNG MẶT:** Giữ nguyên 100% đặc điểm nhận dạng. `;
                         if (s.face.hairStyle !== 'keep_original') { let h = s.face.hairStyle === 'auto' ? "gọn gàng" : (s.face.hairStyle === 'slicked_back' ? "vuốt ngược" : "thả tự nhiên"); p += `Tóc: ${h}. `; }
                         if (s.face.smoothSkin) p += `Làm mịn da. `;
                         return p;
                     };
                     const prompt = buildIdPhotoPrompt(settings);
                     const parts = [{ inlineData: { data: originalImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                     if (payload.outfitImagePart) parts.splice(1, 0, payload.outfitImagePart);
                     return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                         const geminiRes = await ai.models.generateContent({ model, contents: { parts }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, settings.aspectRatio === '5x5' ? '1:1' : '3:4') } });
                         const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                         return res.json({ imageData });
                     });
                 });
            }
            case 'generateHeadshot': {
                 return await runWithFallback(async (ai) => {
                     const { imagePart, prompt } = payload;
                     return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [imagePart, { text: `[TASK] Headshot. ${prompt}. [QUALITY] ${imageSize}` }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, undefined, 4) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                     });
                 });
            }
            case 'performRestoration':
            case 'performDocumentRestoration': {
                 return await runWithFallback(async (ai) => {
                    const { imagePart, options } = payload;
                    const prompt = `Restoration. Level: ${options.mode}. Remove scratches, colorize.`;
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                    });
                });
            }
            case 'generateFashionPhoto': {
                 return await runWithFallback(async (ai) => {
                    const { imagePart, settings } = payload;
                    const prompt = `Fashion Photo. ${settings.style}. ${settings.description}. Photorealistic.`;
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                    });
                });
            }
            case 'generateFootballPhoto': {
                 return await runWithFallback(async (ai) => {
                    const { settings } = payload;
                    const prompt = `Football Photo. Player: ${settings.player}. Team: ${settings.team}. Scene: ${settings.scene}.`;
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [{ inlineData: { data: settings.sourceImage.base64, mimeType: settings.sourceImage.mimeType } }, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                    });
                });
            }
            case 'generateBeautyPhoto': {
                return await runWithFallback(async (ai) => {
                    const { baseImage, tool, subFeature, style } = payload;
                    const prompt = `Beauty Retouch. Tool: ${tool.englishLabel}. Feature: ${subFeature?.englishLabel}. Style: ${style?.englishLabel}.`;
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                    });
                });
            }
            case 'generateFourSeasonsPhoto': {
                 return await runWithFallback(async (ai) => {
                    const { imagePart, scene, season, aspectRatio, customDescription } = payload;
                    const prompt = `Four Seasons Photo. ${season}. ${scene.title}. ${customDescription}.`;
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, aspectRatio) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                    });
                });
            }
            case 'generateMarketingImage': {
                 return await runWithFallback(async (ai) => {
                    const { productImagePart, referenceImagePart, productDetails, settings } = payload;
                    const parts: Part[] = [];
                    if (productImagePart) parts.push(productImagePart);
                    if (referenceImagePart) parts.push(referenceImagePart);
                    const prompt = `Marketing Image. ${productDetails.brand} ${productDetails.name}. ${settings.templateId}. 8K.`;
                    parts.push({ text: prompt });
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, settings.aspectRatio) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData, prompt });
                    });
                });
            }
            case 'generateArtStyleImages': {
                 return await runWithFallback(async (ai) => {
                    const { modelFile, otherFiles, styles, quality, aspect, count, userPrompt } = payload;
                    const parts: Part[] = [];
                    if (!modelFile?.base64) return res.status(400).json({ error: "No model image." });
                    parts.push({ inlineData: { data: modelFile.base64, mimeType: modelFile.mimeType } });
                    if (otherFiles.clothing?.base64) parts.push({ inlineData: { data: otherFiles.clothing.base64, mimeType: otherFiles.clothing.mimeType } });
                    const prompt = `Commercial Composite. Styles: ${styles.join(', ')}. ${userPrompt}.`;
                    parts.push({ text: prompt });
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const generationPromises = [];
                        for(let i=0; i<count; i++) {
                            generationPromises.push(ai.models.generateContent({ model, contents: { parts }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, aspect) } }));
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
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const generationPromises = [];
                        for(let i=0; i < numOutputs; i++) {
                             generationPromises.push(ai.models.generateContent({ model, contents: { parts: [{ text: `Generate Image. ${prompt}` }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, aspectRatio) } }));
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
                     if (featureAction === 'couple_compose') {
                         if (formData.person_left_image?.base64) parts.push({ inlineData: { data: formData.person_left_image.base64, mimeType: formData.person_left_image.mimeType } });
                         if (formData.person_right_image?.base64) parts.push({ inlineData: { data: formData.person_right_image.base64, mimeType: formData.person_right_image.mimeType } });
                         if (formData.custom_background?.base64) parts.push({ inlineData: { data: formData.custom_background.base64, mimeType: formData.custom_background.mimeType } });
                         prompt = `Couple photo. Action: ${formData.affection_action}. Background: ${formData.couple_background}.`;
                     } else { prompt = `Execute Feature: ${featureAction}. Data: ${JSON.stringify(formData)}`; }
                     parts.push({ text: prompt });
                     const numImages = payload.numImages || 1;
                     return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                         const generationPromises = [];
                         for(let i=0; i<numImages; i++) {
                             generationPromises.push(ai.models.generateContent({ model, contents: { parts }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) } }));
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
            case 'generateFamilyPhoto':
            case 'generateFamilyPhoto_3_Pass': {
                 return await runWithFallback(async (ai) => {
                     const { settings } = payload;
                     const prompt = `Family Photo. Scene: ${settings.scene}. Members: ${settings.members.length}.`;
                     return await generateWithModelFallback(MODEL_PRO, MODEL_FLASH, async (model) => {
                         const geminiRes = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, '4K', settings.aspectRatio) } });
                         const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                         return res.json({ imageData, similarityScores: [], debug: null });
                     });
                 });
            }
            case 'generateSongContent': {
                 const ai = getAi(false);
                 const { topic, genre, mood, language } = payload;
                 const prompt = `Songwriter. Topic: ${topic} Genre: ${genre} Mood: ${mood} Language: ${language} JSON output.`;
                 const geminiRes = await ai.models.generateContent({ model: TEXT_MODEL, contents: { parts: [{ text: prompt }] }, config: { responseMimeType: "application/json" } });
                 return res.json(JSON.parse(geminiRes.text || '{}'));
             }
             case 'generateAlbumArt': {
                 return await runWithFallback(async (ai) => {
                     const { description } = payload;
                     return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [{ text: `Album Art. ${description}` }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, '2K', '1:1') } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                     });
                 });
             }
            case 'removeWatermark': {
                 return await runWithFallback(async (ai) => {
                     const { imagePart, highQuality } = payload;
                     const modelToUse = highQuality ? MODEL_PRO : MODEL_FLASH;
                     const imgSize = highQuality ? '2K' : '1K';
                     const prompt = "Magic Eraser. Remove watermarks, text, logos. Restore background.";
                     return await generateWithModelFallback(modelToUse, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({ model, contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imgSize) } });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                     });
                 });
            }
            
            // --- UPDATED LOGIC FOR VIDEO REMOVAL (DEEP EXTRACTION) ---
            case 'removeVideoWatermark': {
                const { url } = payload;
                if (!url) return res.status(400).json({ error: 'Missing URL' });

                // If it's already a clean direct link, return it immediately
                if (url.match(/\.(mp4|mov)$/i)) {
                    return res.json({ videoUrl: url });
                }

                // Use the Deep Extraction logic
                // This logic parses the page content to find the hidden source URL
                const cleanUrl = await extractCleanVideoUrl(url);
                
                // Return the extracted URL
                return res.json({ videoUrl: cleanUrl });
            }

            case 'detectOutfit':
            case 'generateVideoPrompt':
            case 'generatePromptFromImage': 
            case 'generateMarketingAdCopy': 
            case 'generateMarketingVideoScript':
            case 'getHotTrends': {
                 // Text generation logic
                 const ai = getAi(false);
                 const { base64Image, mimeType, userIdea, isFaceLockEnabled, language, product, tone, imagePart } = payload;
                 const parts: Part[] = [];
                 let prompt = "";
                 
                 if (action === 'detectOutfit') { prompt = "Describe outfit."; parts.push({ inlineData: { data: base64Image, mimeType } }); }
                 else if (action === 'generateVideoPrompt') { prompt = `Video prompt from idea: ${userIdea}. JSON.`; if(base64Image) parts.push({ inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } }); }
                 else if (action === 'generatePromptFromImage') { prompt = `Describe image. ${isFaceLockEnabled ? 'Focus face.' : ''} Language: ${language}.`; parts.push({ inlineData: { data: base64Image, mimeType } }); }
                 else if (action === 'generateMarketingAdCopy') { prompt = `Write ad copy for ${product.name}. Language: ${language}.`; if(imagePart) parts.push(imagePart); }
                 else if (action === 'generateMarketingVideoScript') { prompt = `Write video script for ${product.name}. Tone: ${tone}. Language: ${language}.`; if(imagePart) parts.push(imagePart); }
                 else if (action === 'getHotTrends') { prompt = "List 5 fashion trends JSON."; }

                 parts.push({ text: prompt });
                 const geminiRes = await ai.models.generateContent({ model: TEXT_MODEL, contents: { parts }, config: { responseMimeType: action.includes('JSON') || action === 'generateVideoPrompt' || action === 'getHotTrends' ? "application/json" : undefined } });
                 
                 if (action === 'detectOutfit') return res.json({ outfit: geminiRes.text });
                 if (action === 'generateVideoPrompt') return res.json({ prompts: JSON.parse(geminiRes.text || '{}') });
                 if (action === 'generatePromptFromImage') return res.json({ prompt: geminiRes.text });
                 if (action === 'getHotTrends') return res.json({ trends: JSON.parse(geminiRes.text || '[]') });
                 return res.json({ text: geminiRes.text });
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
