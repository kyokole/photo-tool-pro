
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
const VEO_MODEL_REF = 'veo-3.1-generate-preview'; // Model supporting reference images
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
        config.imageSize = imageSize;
    }
    if (model === MODEL_FLASH && count > 1) {
        config.numberOfImages = count;
    }
    return config;
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

const findVideoCandidatesInJson = (obj: any, results: { key: string, url: string }[] = []) => {
    if (!obj) return results;
    
    if (typeof obj === 'string') {
        return results;
    }
    
    if (Array.isArray(obj)) {
        for (const item of obj) {
            findVideoCandidatesInJson(item, results);
        }
        return results;
    }
    
    if (typeof obj === 'object') {
        for (const key in obj) {
            const val = obj[key];
            if (typeof val === 'string') {
                 if (val.match(/^https?:\/\/.*\.mp4(\?.*)?$/i) || 
                    val.includes('googlevideo.com') || 
                    val.includes('videos.openai.com') ||
                    (val.includes('openai-assets') && val.includes('video')) ||
                    val.includes('.mp4')) {
                    
                    if (val.startsWith('http')) {
                        results.push({ key: key, url: val });
                    }
                }
            } else {
                findVideoCandidatesInJson(val, results);
            }
        }
    }
    return results;
}

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
            const ai = getAi(false); // Use standard key
            const { prompt } = payload;
            
            const systemInstruction = `You are a professional film director and cinematographer.
            Rewrite the user's video prompt into a highly detailed, cinematic description suitable for AI video generation (like Veo or Sora).
            
            Focus on:
            1. Camera Angle (Wide, Close-up, Drone, Tracking shot).
            2. Lighting (Cinematic, Golden Hour, Neon, Moody).
            3. Movement (Slow motion, Hyperlapse, Smooth).
            4. Details (Textures, atmosphere, weather).
            
            Keep it concise but descriptive. Do not add introductory text like "Here is the prompt". Just return the refined prompt.
            
            User Prompt: "${prompt}"`;
            
            const response = await ai.models.generateContent({
                model: TEXT_MODEL,
                contents: { parts: [{ text: systemInstruction }] }
            });
            
            return res.json({ enhancedPrompt: response.text });
         }
 
         if (action === 'generateVeoVideo') {
             const ai = getAi(false, 'video');
             const { base64Image, prompt, characterImages } = payload;
             
             let selectedModel = VEO_MODEL_FAST;
             let config: any = { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' };
             
             // --- FEATURE: CHARACTER CONSISTENCY (Backend Logic) ---
             let referenceImagesPayload = undefined;
             
             if (characterImages && Array.isArray(characterImages) && characterImages.length > 0) {
                 console.log("Character images detected. Switching to Veo 3.1 Reference Mode.");
                 selectedModel = VEO_MODEL_REF; // Must switch to generate-preview for references
                 
                 // Enforce strict constraints for reference mode
                 config = {
                     numberOfVideos: 1,
                     resolution: '720p', // Required for ref images
                     aspectRatio: '16:9' // Required for ref images
                 };
                 
                 // Limit to 3 reference images as per SDK limitation
                 referenceImagesPayload = characterImages.slice(0, 3).map((b64: string) => ({
                     image: {
                         imageBytes: b64,
                         mimeType: 'image/png',
                     },
                     referenceType: 'ASSET', // VideoGenerationReferenceType.ASSET
                 }));
             }
             
             const requestPayload: any = {
                 model: selectedModel,
                 prompt: prompt, 
                 config: config
             };

             if (referenceImagesPayload) {
                 requestPayload.config.referenceImages = referenceImagesPayload;
             } else if (base64Image) {
                 // Standard Image-to-Video (Start Frame)
                 // Do not use if using Reference Images to avoid conflict, unless specifically supported
                 requestPayload.image = { imageBytes: base64Image.split(',')[1], mimeType: 'image/png' };
             }

             console.log(`Calling Veo API. Model: ${selectedModel}, RefImages: ${referenceImagesPayload?.length || 0}`);
             
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
                           // FIX: Count forced to 1 to prevent error/waste. Frontend loops 4 times.
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
                   const prompt = `[TASK] Fashion Photo. Category: ${settings.category}. Style: ${settings.style}. ${settings.description}. [QUALITY] Photorealistic. ${imageSize} Output.`;
                   
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
            case 'generateFootballPhoto': {
               return await runWithFallback(async (ai) => {
                   const { settings } = payload;
                   const prompt = `[TASK] Football Photo. Player: ${settings.player}. Team: ${settings.team}. Scene: ${settings.scene}. Style: ${settings.style}.`;
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [{ inlineData: { data: settings.sourceImage.base64, mimeType: settings.sourceImage.mimeType } }, { text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) }
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
           case 'generateMarketingImage': {
               return await runWithFallback(async (ai) => {
                   const { productImagePart, referenceImagePart, productDetails, settings } = payload;
                   const parts: Part[] = [];
                   if (productImagePart) parts.push(productImagePart);
                   if (referenceImagePart) parts.push(referenceImagePart);
                   const prompt = `[TASK] Marketing Image. Product: ${productDetails.brand} ${productDetails.name}. Template: ${settings.templateId}. Tone: ${settings.tone}. Features: ${productDetails.features}. [QUALITY] 8K, Advertising.`;
                   parts.push({ text: prompt });
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
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
                   if (!modelFile?.base64) return res.status(400).json({ error: "Dữ liệu ảnh Model không hợp lệ." });
                   parts.push({ inlineData: { data: modelFile.base64, mimeType: modelFile.mimeType } });
                   if (otherFiles.clothing?.base64) parts.push({ inlineData: { data: otherFiles.clothing.base64, mimeType: otherFiles.clothing.mimeType } });
                   if (otherFiles.accessories?.base64) parts.push({ inlineData: { data: otherFiles.accessories.base64, mimeType: otherFiles.accessories.mimeType } });
                   if (otherFiles.product?.base64) parts.push({ inlineData: { data: otherFiles.product.base64, mimeType: otherFiles.product.mimeType } });
                   const prompt = `[TASK] Commercial Composite. Inputs: Main Model + optional Clothing/Product. Styles: ${styles.join(', ')}. Description: ${userPrompt}. [INSTRUCTION] Blend inputs naturally. High fashion. Ratio: ${aspect}. Quality: ${quality}.`;
                   parts.push({ text: prompt });
                   
                   return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                       const generationPromises = [];
                       for(let i=0; i<count; i++) {
                           generationPromises.push(ai.models.generateContent({
                               model: model,
                               contents: { parts },
                               config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize, aspect) }
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
                    if (featureAction === 'couple_compose') {
                        if (formData.person_left_image?.base64) parts.push({ inlineData: { data: formData.person_left_image.base64, mimeType: formData.person_left_image.mimeType } });
                        if (formData.person_right_image?.base64) parts.push({ inlineData: { data: formData.person_right_image.base64, mimeType: formData.person_right_image.mimeType } });
                        if (formData.custom_background?.base64) parts.push({ inlineData: { data: formData.custom_background.base64, mimeType: formData.custom_background.mimeType } });
                        prompt = `[TASK] Generate couple photo. Face Consistency: ${formData.face_consistency}. Action: ${formData.affection_action}. Background: ${formData.couple_background || "Custom"}. Style: ${formData.aesthetic_style}.`;
                    } else {
                        prompt = `Execute Feature: ${featureAction}. Data: ${JSON.stringify(formData)}`;
                    }
                    parts.push({ text: prompt });
                    const numImages = payload.numImages || 1;
                    
                    return await generateWithModelFallback(selectedModel, MODEL_FLASH, async (model) => {
                        const generationPromises = [];
                        for(let i=0; i<numImages; i++) {
                            generationPromises.push(ai.models.generateContent({
                               model: model,
                               contents: { parts },
                               config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, imageSize) }
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
            case 'generateFamilyPhoto':
            case 'generateFamilyPhoto_3_Pass': {
                return await runWithFallback(async (ai) => {
                    const { settings } = payload;
                    const prompt = `Family Photo Composite. Scene: ${settings.scene}. Members: ${settings.members.length}. Face Consistency: ${settings.faceConsistency}.`;
                    
                    return await generateWithModelFallback(MODEL_PRO, MODEL_FLASH, async (model) => {
                        const geminiRes = await ai.models.generateContent({
                           model: model,
                           contents: { parts: [{ text: prompt }] },
                           config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(model, '4K', settings.aspectRatio) }
                        });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData, similarityScores: [], debug: null });
                    });
                });
            }
            case 'generateSongContent': {
                const ai = getAi(false);
                const { topic, genre, mood, language } = payload;
                const prompt = `ACT AS A PROFESSIONAL SONGWRITER. Topic: ${topic} Genre: ${genre} Mood: ${mood} Language: ${language} OUTPUT JSON: title, lyrics, chords, description, stylePrompt.`;
                const geminiRes = await ai.models.generateContent({
                   model: TEXT_MODEL,
                   contents: { parts: [{ text: prompt }] },
                   config: { responseMimeType: "application/json" }
                });
                return res.json(JSON.parse(geminiRes.text || '{}'));
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
                     const imgConfig = (modelToUse === MODEL_PRO) ? {} : getImageConfig(modelToUse, '1K');

                     const prompt = "TASK: Magic Eraser / Inpainting. Remove all watermarks, text overlays, logos, and unwanted objects. Restore the background naturally. Return a clean, high-quality image. Do not alter the main subject.";
                     
                     return await generateWithModelFallback(modelToUse, MODEL_FLASH, async (model) => {
                         const effectiveConfig = (model === MODEL_PRO) ? {} : getImageConfig(model, '1K');

                        const geminiRes = await ai.models.generateContent({
                            model: model,
                            contents: { parts: [imagePart, { text: prompt }] },
                            config: { responseModalities: [Modality.IMAGE], imageConfig: effectiveConfig }
                        });
                        const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                        return res.json({ imageData });
                     });
                 });
            }
            case 'removeVideoWatermark': {
                const { url } = payload;
                let resultVideoUrl = "";

                if (url) {
                    if (url.match(/\.(mp4|mov)$/i)) {
                        return res.json({ videoUrl: url });
                    }

                    try {
                        const response = await fetch(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            }
                        });
                        let html = await response.text();
                        html = decodeEntities(html);

                        const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
                        if (jsonMatch && jsonMatch[1]) {
                            try {
                                const json = JSON.parse(jsonMatch[1]);
                                const candidates = findVideoCandidatesInJson(json);
                                
                                const scoredCandidates = candidates.map(c => {
                                    let score = 0;
                                    const k = c.key.toLowerCase();
                                    const v = c.url.toLowerCase();
                                    if (k.includes('download')) score += 20;
                                    if (k.includes('original')) score += 15;
                                    if (k.includes('source')) score += 10;
                                    if (k.includes('file') && !k.includes('preview')) score += 5;
                                    if (v.includes('1080p')) score += 5;
                                    if (k.includes('preview')) score -= 10;
                                    if (k.includes('thumbnail')) score -= 10;
                                    if (k.includes('poster')) score -= 10;
                                    if (k.includes('watermark')) score -= 20;
                                    if (v.includes('watermark')) score -= 20;
                                    if (v.includes('preview')) score -= 5;
                                    return { ...c, score };
                                });

                                scoredCandidates.sort((a, b) => b.score - a.score);
                                
                                if (scoredCandidates.length > 0 && scoredCandidates[0].score > -15) {
                                    resultVideoUrl = decodeEntities(scoredCandidates[0].url);
                                }
                            } catch (e) { console.error("JSON Parse Error", e); }
                        }

                        if (!resultVideoUrl) {
                             const regexes = [
                                /"download_url"\s*:\s*"([^"]+)"/i,
                                /"original_video_url"\s*:\s*"([^"]+)"/i,
                                /<meta property="og:video:secure_url" content="([^"]+)"/i,
                             ];
                             for (const regex of regexes) {
                                 const match = html.match(regex);
                                 if (match && match[1]) {
                                     resultVideoUrl = decodeEntities(match[1]);
                                     break;
                                 }
                             }
                        }
                        
                        if (!resultVideoUrl) resultVideoUrl = url;

                    } catch (err) {
                        console.error("Extraction Error:", err);
                        resultVideoUrl = url;
                    }
                } 
                return res.json({ videoUrl: resultVideoUrl }); 
            }
            case 'detectOutfit':
            case 'generateVideoPrompt':
            case 'generatePromptFromImage': {
                 return await runWithFallback(async (ai) => {
                     const { base64Image, mimeType, userIdea, isFaceLockEnabled, language } = payload;
                     let prompt = "";
                     const parts: Part[] = [];
                     if (action === 'detectOutfit') {
                         prompt = "Describe outfit.";
                         parts.push({ inlineData: { data: base64Image, mimeType } });
                     } else if (action === 'generateVideoPrompt') {
                         prompt = `Video prompt from idea: ${userIdea}. JSON.`;
                         if(base64Image) parts.push({ inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } });
                     } else if (action === 'generatePromptFromImage') {
                         prompt = `Describe image. ${isFaceLockEnabled ? 'Focus face.' : ''} Language: ${language}.`;
                         parts.push({ inlineData: { data: base64Image, mimeType } });
                     }
                     parts.push({ text: prompt });
                     const geminiRes = await ai.models.generateContent({
                        model: TEXT_MODEL,
                        contents: { parts },
                        config: { responseMimeType: action.includes('JSON') || action === 'generateVideoPrompt' ? "application/json" : undefined }
                     });
                     if (action === 'detectOutfit') return res.json({ outfit: geminiRes.text });
                     if (action === 'generateVideoPrompt') return res.json({ prompts: JSON.parse(geminiRes.text || '{}') });
                     if (action === 'generatePromptFromImage') return res.json({ prompt: geminiRes.text });
                     return res.json({ text: geminiRes.text });
                 });
            }
            case 'generateMarketingAdCopy': 
            case 'generateMarketingVideoScript':
            case 'getHotTrends': {
                 const ai = getAi(false);
                 const { product, tone, imagePart, language } = payload;
                 let prompt = "";
                 const parts: Part[] = [];
                 if (action === 'generateMarketingAdCopy') {
                     prompt = `Write ad copy for ${product.name}. Language: ${language}.`;
                     if(imagePart) parts.push(imagePart);
                 } else if (action === 'generateMarketingVideoScript') {
                     prompt = `Write video script for ${product.name}. Tone: ${tone}. Language: ${language}.`;
                     if(imagePart) parts.push(imagePart);
                 } else if (action === 'getHotTrends') {
                     prompt = "List 5 fashion trends JSON.";
                 }
                 parts.push({ text: prompt });
                 const geminiRes = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: { parts },
                    config: { responseMimeType: action === 'getHotTrends' ? "application/json" : undefined }
                 });
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
