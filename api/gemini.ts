
// /api/gemini.ts
import { GoogleGenAI, Modality, Part } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { Buffer } from 'node:buffer';
import sharp from 'sharp'; // Thư viện xử lý ảnh hiệu năng cao

// --- CONSTANTS ---
const MODEL_PRO = 'gemini-3-pro-image-preview';
const MODEL_FLASH = 'gemini-2.5-flash-image';
const TEXT_MODEL = 'gemini-2.5-flash';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';

// --- VIP RESTRICTIONS ---
const VIP_ONLY_ACTIONS = [
    'performRestoration',
    'performDocumentRestoration',
    'generateFashionPhoto',
    'generateFootballPhoto',
    'generateBeautyPhoto',
    'generateFamilyPhoto',
    'generateFamilyPhoto_3_Pass',
    'generateFourSeasonsPhoto',
    'generateImagesFromFeature',
    'generateBatchImages',
    'generateMarketingAdCopy',
    'generateMarketingVideoScript',
    'generateMarketingImage',
    'generateVeoVideo',
    'generateArtStyleImages'
];

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
    
    // 1. Try to extract JSON error message from Google
    try {
        const jsonMatch = rawMessage.match(/\{.*\}/s);
        if (jsonMatch) {
            const errorObj = JSON.parse(jsonMatch[0]);
            if (errorObj.error?.message) {
                const msg = errorObj.error.message;
                if (msg.includes('inline_data')) return "Dữ liệu ảnh không hợp lệ hoặc bị lỗi định dạng.";
                if (msg.includes('safety')) return "Ảnh bị chặn bởi bộ lọc an toàn của Google.";
                if (msg.includes('quota') || msg.includes('429')) return "Hệ thống đang quá tải, vui lòng thử lại sau.";
                return `Lỗi từ AI: ${msg}`;
            }
        }
    } catch (e) {
        // Ignore JSON parse errors
    }

    // 2. Fallback text matching
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
}

const getUserStatus = async (idToken?: string, clientVipStatus?: boolean): Promise<UserStatus> => {
    if (!idToken) {
        return { isVip: false, isAdmin: false, uid: null };
    }

    if (isFirebaseInitialized) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(uid).get();

            if (!userDoc.exists) {
                return { isVip: !!clientVipStatus, isAdmin: false, uid };
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

            return { isVip, isAdmin, uid };
        } catch (error) {
            console.error("Server Auth Verification Failed:", error);
        }
    }

    if (idToken && clientVipStatus === true) {
        return { isVip: true, isAdmin: false, uid: 'fallback-user' };
    }

    return { isVip: false, isAdmin: false, uid: null };
};

// --- HELPER: SERVER-SIDE WATERMARKING ---
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

        const svgBuffer = Buffer.from(svgText);

        return await image
            .composite([{ input: svgBuffer, blend: 'over' }])
            .toBuffer();
    } catch (error) {
        console.error("Watermarking failed:", error);
        return imageBuffer; 
    }
};

const resolveImageSize = (payload: any, isVip: boolean): string => {
    if (!isVip) return '1K';
    if (payload.quality === 'high' || payload.quality === 'ultra' || payload.quality === '4K' || payload.quality === '8K') return '4K';
    if (payload.settings?.highQuality === true) return '4K';
    if (payload.options?.highQuality === true) return '4K';
    if (payload.highQuality === true) return '4K';
    if (payload.formData?.highQuality === true) return '4K'; 
    if (payload.style?.highQuality === true) return '4K';
    if (payload.tool?.highQuality === true) return '4K';
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

// --- UTILS ---
const getAi = (forVideo: boolean = false) => {
    let apiKey;
    if (forVideo) {
        apiKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    } else {
        apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    }

    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// --- HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    const { isVip } = await getUserStatus(idToken, clientVipStatus);

    if (VIP_ONLY_ACTIONS.includes(action) && !isVip) {
        return res.status(403).json({ error: "Tính năng này chỉ dành cho thành viên VIP. Vui lòng nâng cấp để sử dụng." });
    }

    const processOutputImage = async (base64Data: string | undefined): Promise<string> => {
        if (!base64Data) throw new Error("Không có dữ liệu ảnh được tạo.");
        if (isVip) return `data:image/png;base64,${base64Data}`;
        const inputBuffer = Buffer.from(base64Data, 'base64');
        const watermarkedBuffer = await addWatermark(inputBuffer);
        return `data:image/png;base64,${watermarkedBuffer.toString('base64')}`;
    };

    try {
        if (action === 'generateVeoVideo') {
            const ai = getAi(true);
            const { base64Image, prompt } = payload;
                
            let operation = await ai.models.generateVideos({
                model: VEO_MODEL,
                prompt: prompt, 
                image: {
                    imageBytes: base64Image.split(',')[1], 
                    mimeType: 'image/png',
                },
                config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
            });
            
            let retries = 0;
            const maxRetries = 60;
            while (!operation.done && retries < maxRetries) {
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

        const ai = getAi(false);
        const imageSize = resolveImageSize(payload, isVip);
        const selectedModel = selectModel(imageSize);

        switch (action) {
            case 'generateIdPhoto': {
                 const { originalImage, settings } = payload;
                 const buildIdPhotoPrompt = (s: any) => {
                     let p = `**Cắt ảnh chân dung:** Cắt lấy phần đầu và vai chuẩn thẻ. Loại bỏ nền tạp. Role: ID Photo Editor.`;
                     if (s.background.mode === 'ai' && s.background.customPrompt) p += `**1. Nền AI:** "${s.background.customPrompt}". Bokeh background. `;
                     else {
                         const c = s.background.mode === 'custom' ? s.background.customColor : (s.background.mode === 'white' ? '#FFFFFF' : '#E0E8F0');
                         p += `**1. Nền:** Màu ${c}. Masking tóc hoàn hảo. `;
                     }
                     if (s.outfit.mode === 'upload') p += `**2. Trang phục:** Thay bằng bộ đồ ở ảnh 2. `;
                     else if (!s.outfit.keepOriginal) p += `**2. Trang phục:** Thay thành "${s.outfit.mode === 'preset' ? s.outfit.preset : s.outfit.customPrompt}". `;
                     
                     if (s.face.hairStyle !== 'keep_original') p += `**3. Tóc:** Thay đổi thành "${s.face.hairStyle}". Giữ ngũ quan. `;
                     else p += `**3. Tóc:** Giữ nguyên. `;
                     
                     if (s.face.smoothSkin) p += `Làm mịn da. `;
                     return p;
                 };

                 const prompt = buildIdPhotoPrompt(settings);
                 const parts = [{ inlineData: { data: originalImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                 
                 let modelRatio = '3:4';
                 if (settings.aspectRatio === '5x5') modelRatio = '1:1';

                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize, modelRatio)
                    }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ imageData });
            }

            case 'generateHeadshot': {
                 const { imagePart, prompt: p } = payload;
                 const prompt = `[TASK] Headshot. ${p}. [QUALITY] ${imageSize}, Photorealistic.`;
                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ imageData });
            }

            case 'performRestoration':
            case 'performDocumentRestoration': {
                const { imagePart, options } = payload;
                const prompt = `Restoration Task. Level: ${options.mode}. Details: Remove scratches, colorize, sharpen. Context: ${options.context || ''}.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                 });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateFashionPhoto': {
                const { imagePart, settings } = payload;
                const prompt = `[TASK] Fashion Photo. Category: ${settings.category}. Style: ${settings.style}. ${settings.description}. [QUALITY] Photorealistic. ${imageSize} Output.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }
            
             case 'generateFootballPhoto': {
                const { settings } = payload;
                const prompt = `[TASK] Football Photo. Player: ${settings.player}. Team: ${settings.team}. Scene: ${settings.scene}. Style: ${settings.style}.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [{ inlineData: { data: settings.sourceImage.base64, mimeType: settings.sourceImage.mimeType } }, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateBeautyPhoto': {
                const { baseImage, tool, subFeature, style } = payload;
                const prompt = `Beauty Retouch. Tool: ${tool.englishLabel}. Feature: ${subFeature?.englishLabel}. Style: ${style?.englishLabel}. Maintain identity.`;
                const parts = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }
            
            case 'generateFourSeasonsPhoto': {
                const { imagePart, scene, season, aspectRatio, customDescription } = payload;
                const prompt = `[TASK] Four Seasons Photo. Season: ${season}. Scene: ${scene.title}. ${scene.desc}. ${customDescription}. [ASPECT] ${aspectRatio}.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize, aspectRatio) }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateMarketingImage': {
                const { productImagePart, referenceImagePart, productDetails, settings } = payload;
                const parts: Part[] = [];
                if (productImagePart) parts.push(productImagePart);
                if (referenceImagePart) parts.push(referenceImagePart);

                const prompt = `[TASK] Marketing Image. Product: ${productDetails.brand} ${productDetails.name}. Template: ${settings.templateId}. Tone: ${settings.tone}. Features: ${productDetails.features}. [QUALITY] 8K, Advertising.`;
                parts.push({ text: prompt });

                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize, settings.aspectRatio) }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                // **CHANGED:** Return both imageData and the prompt used
                return res.json({ imageData, prompt });
            }

            case 'generateArtStyleImages': {
                const { modelFile, otherFiles, styles, quality, aspect, count, userPrompt } = payload;
                const parts: Part[] = [];
                
                // Strict validation to avoid "Starting an object on a scalar field" error
                if (!modelFile?.base64 || typeof modelFile.base64 !== 'string') {
                    return res.status(400).json({ error: "Dữ liệu ảnh Model không hợp lệ." });
                }

                parts.push({ inlineData: { data: modelFile.base64, mimeType: modelFile.mimeType } });
                
                if (otherFiles.clothing?.base64) {
                    parts.push({ inlineData: { data: otherFiles.clothing.base64, mimeType: otherFiles.clothing.mimeType } });
                }
                if (otherFiles.accessories?.base64) {
                    parts.push({ inlineData: { data: otherFiles.accessories.base64, mimeType: otherFiles.accessories.mimeType } });
                }
                if (otherFiles.product?.base64) {
                    parts.push({ inlineData: { data: otherFiles.product.base64, mimeType: otherFiles.product.mimeType } });
                }

                const prompt = `[TASK] Commercial Composite / Art Style.
                Inputs: Main Model + optional Clothing/Product.
                Styles: ${styles.join(', ')}.
                Description: ${userPrompt}.
                [INSTRUCTION] Blend inputs naturally. High fashion, commercial quality.
                Ratio: ${aspect}. Quality: ${quality}.`;
                
                parts.push({ text: prompt });

                const generationPromises = [];
                for(let i=0; i<count; i++) {
                    generationPromises.push(ai.models.generateContent({
                        model: selectedModel,
                        contents: { parts },
                        config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize, aspect) }
                    }));
                }
                
                const results = await Promise.all(generationPromises);
                const images = [];
                for(const r of results) {
                    const data = r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if(data) {
                        const processed = await processOutputImage(data);
                        images.push(processed);
                    }
                }
                return res.json({ images });
            }

            case 'generateMarketingAdCopy': 
            case 'generateMarketingVideoScript':
            case 'detectOutfit':
            case 'getHotTrends':
            case 'generateVideoPrompt':
            case 'generatePromptFromImage': {
                 const { product, tone, angle, imagePart, userIdea, base64Image, mimeType, isFaceLockEnabled, language } = payload;
                 let prompt = "";
                 const parts: Part[] = [];

                 if (action === 'generateMarketingAdCopy') {
                     // Updated Prompt for Vietnamese Ad Copy
                     prompt = `Act as an expert Vietnamese Copywriter. Write a high-converting Facebook Ad for the following product in Vietnamese language (Tiếng Việt).
                     Product Name: ${product.name}
                     Brand: ${product.brand}
                     Category: ${product.category}
                     Key Features: ${product.features}
                     Pros: ${product.pros}
                     Cons: ${product.cons}
                     
                     Requirements:
                     - Language: Vietnamese (Tiếng Việt)
                     - Style: Engaging, professional, uses emojis.
                     - Structure: Hook -> Problem -> Solution -> Benefits -> Call to Action.`;
                     
                     if(imagePart) parts.push(imagePart);
                 } else if (action === 'generateMarketingVideoScript') {
                     // Updated Prompt for Vietnamese Video Script
                     prompt = `Act as an expert Video Scriptwriter for TikTok/Reels. Write a short video script for the following product in Vietnamese language (Tiếng Việt).
                     Product Name: ${product.name}
                     Tone: ${tone}
                     Angle/Angle Hook: ${angle}
                     Key Features: ${product.features}
                     
                     Requirements:
                     - Language: Vietnamese (Tiếng Việt)
                     - Format: Split into Scenes with Visuals and Audio/Dialogue.
                     - Style: Viral, fast-paced, engaging.`;
                     
                     if(imagePart) parts.push(imagePart);
                 } else if (action === 'detectOutfit') {
                     prompt = "Describe outfit in image.";
                     parts.push({ inlineData: { data: base64Image, mimeType } });
                 } else if (action === 'getHotTrends') {
                     prompt = "List 5 fashion trends in Vietnam JSON.";
                 } else if (action === 'generateVideoPrompt') {
                     prompt = `Create video prompt from image and idea: ${userIdea}. Return JSON.`;
                     if(base64Image) parts.push({ inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } });
                 } else if (action === 'generatePromptFromImage') {
                     prompt = `Describe image. ${isFaceLockEnabled ? 'Focus on face.' : ''} Language: ${language}.`;
                     parts.push({ inlineData: { data: base64Image, mimeType } });
                 }
                 
                 parts.push({ text: prompt });
                 const geminiRes = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: { parts },
                    config: { responseMimeType: action.includes('JSON') || action === 'getHotTrends' || action === 'generateVideoPrompt' ? "application/json" : undefined }
                 });
                 
                 if (action === 'detectOutfit') return res.json({ outfit: geminiRes.text });
                 if (action === 'getHotTrends') return res.json({ trends: JSON.parse(geminiRes.text || '[]') });
                 if (action === 'generateVideoPrompt') return res.json({ prompts: JSON.parse(geminiRes.text || '{}') });
                 if (action === 'generatePromptFromImage') return res.json({ prompt: geminiRes.text });
                 
                 return res.json({ text: geminiRes.text });
            }

             case 'generateImagesFromFeature': {
                 const { featureAction, formData } = payload;
                 const prompt = `Execute Feature: ${featureAction}. Data: ${JSON.stringify(formData)}`;
                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [{ text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                 });
                 const processedData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ images: [processedData.split(',')[1]], successCount: 1 });
            }
            
             case 'generateFamilyPhoto':
             case 'generateFamilyPhoto_3_Pass': {
                 const familyModel = MODEL_PRO;
                 const { settings } = payload;
                 const prompt = `Family Photo Composite. Scene: ${settings.scene}. Members: ${settings.members.length}.`;
                 const geminiRes = await ai.models.generateContent({
                    model: familyModel,
                    contents: { parts: [{ text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(familyModel, '4K', settings.aspectRatio) }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ imageData, similarityScores: [], debug: null });
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
