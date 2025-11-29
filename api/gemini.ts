
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

// Bảng giá Credit
const CREDIT_COSTS = {
    STANDARD: 2,       // Ảnh thường
    HIGH_QUALITY: 5,   // Ảnh 4K, Phục hồi, Family
    VIDEO: 10,         // Video (Update theo yêu cầu: 1 Video = 10 Credit)
    FREE: 0            // Các tác vụ text/phân tích
};

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
        // Fallback: Guest User (Not logged in)
        // return uid: null to indicate guest status
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
            
            // Check VIP status (Admin is always VIP)
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

    // Fallback for dev mode
    if (idToken && clientVipStatus === true) {
        return { isVip: true, isAdmin: false, uid: 'fallback-user', credits: 9999 };
    }

    return { isVip: false, isAdmin: false, uid: null, credits: 0 };
};

// --- HELPER: DEDUCT CREDITS ---
const deductCredits = async (uid: string, cost: number) => {
    if (!isFirebaseInitialized || !uid || cost <= 0) return;

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw "User does not exist!";
            
            const currentCredits = userDoc.data()?.credits || 0;
            if (currentCredits < cost) {
                throw new Error(`Không đủ tín dụng. Cần ${cost} nhưng bạn chỉ có ${currentCredits}.`);
            }
            
            transaction.update(userRef, { credits: currentCredits - cost });
        });
    } catch (e) {
        console.error("Credit deduction failed:", e);
        throw e;
    }
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
    // Luôn ưu tiên chất lượng cao nhất cho VIP hoặc nếu người dùng chọn High Quality
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

// --- UTILS ---
const getAi = (forVideo: boolean = false) => {
    let apiKey = forVideo ? (process.env.VEO_API_KEY || process.env.GEMINI_API_KEY) : process.env.GEMINI_API_KEY;
    if (!apiKey) apiKey = process.env.API_KEY; // Fallback
    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// --- HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    const { isVip, isAdmin, uid, credits } = await getUserStatus(idToken, clientVipStatus);

    // --- 0. BLOCK NON-VIP FROM EXCLUSIVE FEATURES ---
    if (['generateBatchImages', 'generateBeautyPhoto'].includes(action)) {
        if (!isVip && !isAdmin) {
            return res.status(403).json({ 
                error: "Tính năng này chỉ dành cho Quản trị viên và Thành viên VIP (Gói tháng/năm). Vui lòng nâng cấp để sử dụng." 
            });
        }
    }

    // --- 1. TÍNH TOÁN CHI PHÍ (CREDIT) ---
    let requiredCredits = 0;
    
    // Nếu là VIP, miễn phí hoàn toàn (Cost = 0)
    if (isVip) {
        requiredCredits = 0;
    } else {
        // Nếu là Member thường OR Guest
        if (action === 'generateVeoVideo') {
            requiredCredits = CREDIT_COSTS.VIDEO;
        } else {
            // Các tính năng tạo ảnh
            const freeActions = ['detectOutfit', 'getHotTrends', 'generateVideoPrompt', 'generatePromptFromImage', 'generateMarketingAdCopy', 'generateMarketingVideoScript'];
            
            if (freeActions.includes(action)) {
                requiredCredits = CREDIT_COSTS.FREE;
            } else {
                // Kiểm tra xem user có yêu cầu chất lượng cao (4K) không
                const size = resolveImageSize(payload, false); // Check flag trong payload
                const baseCost = (size === '4K') ? CREDIT_COSTS.HIGH_QUALITY : CREDIT_COSTS.STANDARD;

                // Các tính năng đặc biệt luôn tính giá cao hoặc nhân số lượng
                if (action === 'generateHeadshot') {
                    // Headshot luôn tạo 4 ảnh -> 4 * baseCost
                    requiredCredits = baseCost * 4; 
                } else if (action === 'generateImagesFromFeature') {
                    const count = payload.numImages || 1;
                    requiredCredits = baseCost * count;
                } else if (action === 'generateArtStyleImages') {
                    const count = payload.count || 1;
                    requiredCredits = baseCost * count;
                } else {
                    // Mặc định 1 ảnh
                    requiredCredits = baseCost;
                }
            }
        }
    }

    // --- 2. LOGIC THANH TOÁN & QUYỀN LỢI ---
    let shouldAddWatermark = false;

    if (!uid) {
        // TRƯỜNG HỢP KHÁCH (GUEST): 
        // Cho phép tạo miễn phí nhưng có Watermark.
        requiredCredits = 0; // Không trừ tiền (vì không có tài khoản)
        shouldAddWatermark = true;
    } else if (!isVip && requiredCredits > 0) {
        // TRƯỜNG HỢP THÀNH VIÊN THƯỜNG (MEMBER):
        // Kiểm tra số dư.
        if (credits < requiredCredits) {
            return res.status(402).json({ error: `Không đủ tín dụng. Cần ${requiredCredits} nhưng bạn chỉ có ${credits}.` });
        }
        // Nếu đủ tiền -> Sẽ trừ tiền ở bước sau -> Ảnh sạch (Không Watermark)
        shouldAddWatermark = false; 
    } 
    // TRƯỜNG HỢP VIP: requiredCredits = 0, shouldAddWatermark = false (Mặc định)

    // --- 3. HÀM XỬ LÝ ẢNH ĐẦU RA (WATERMARK LOGIC) ---
    const processOutputImage = async (base64Data: string | undefined): Promise<string> => {
        if (!base64Data) throw new Error("Không có dữ liệu ảnh được tạo.");
        
        if (shouldAddWatermark) {
            const inputBuffer = Buffer.from(base64Data, 'base64');
            const watermarkedBuffer = await addWatermark(inputBuffer);
            return `data:image/png;base64,${watermarkedBuffer.toString('base64')}`;
        }
        
        // Ảnh sạch
        return `data:image/png;base64,${base64Data}`;
    };

    try {
        // --- 4. TRỪ CREDIT (Giao dịch) ---
        // Chỉ trừ nếu là Member (có uid) và không phải VIP và có chi phí
        if (uid && !isVip && requiredCredits > 0) {
            await deductCredits(uid, requiredCredits);
        }

        // --- 5. GỌI AI API ---
        if (action === 'generateVeoVideo') {
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
            
            // Fetch video bytes
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
                 let modelRatio = settings.aspectRatio === '5x5' ? '1:1' : '3:4';

                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize, modelRatio) }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ imageData });
            }

            case 'generateHeadshot': {
                 const { imagePart, prompt: p } = payload;
                 const prompt = `[TASK] Headshot. ${p}. [QUALITY] ${imageSize}, Photorealistic.`;
                 
                 // Generate 4 variations
                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize, undefined, 4) // Request 4 images
                    }
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
                return res.json({ imageData, prompt });
            }

            case 'generateArtStyleImages': {
                const { modelFile, otherFiles, styles, quality, aspect, count, userPrompt } = payload;
                const parts: Part[] = [];
                
                if (!modelFile?.base64 || typeof modelFile.base64 !== 'string') {
                    return res.status(400).json({ error: "Dữ liệu ảnh Model không hợp lệ." });
                }

                parts.push({ inlineData: { data: modelFile.base64, mimeType: modelFile.mimeType } });
                if (otherFiles.clothing?.base64) parts.push({ inlineData: { data: otherFiles.clothing.base64, mimeType: otherFiles.clothing.mimeType } });
                if (otherFiles.accessories?.base64) parts.push({ inlineData: { data: otherFiles.accessories.base64, mimeType: otherFiles.accessories.mimeType } });
                if (otherFiles.product?.base64) parts.push({ inlineData: { data: otherFiles.product.base64, mimeType: otherFiles.product.mimeType } });

                const prompt = `[TASK] Commercial Composite. Inputs: Main Model + optional Clothing/Product. Styles: ${styles.join(', ')}. Description: ${userPrompt}. [INSTRUCTION] Blend inputs naturally. High fashion. Ratio: ${aspect}. Quality: ${quality}.`;
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

            case 'generateBatchImages': {
                // Batch logic: Simply generate multiple images based on prompt
                const { prompt, aspectRatio, numOutputs } = payload;
                const parts = [{ text: `[TASK] Generate Image. Prompt: ${prompt}. Aspect: ${aspectRatio}.` }];
                
                // VIP only -> no credits check needed here, but we enforce VIP status at top.
                // We reuse selectedModel which defaults to Flash unless specified (Batch usually standard).
                
                const generationPromises = [];
                for(let i=0; i < numOutputs; i++) {
                     generationPromises.push(ai.models.generateContent({
                        model: selectedModel,
                        contents: { parts },
                        config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize, aspectRatio) }
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

            case 'generateImagesFromFeature': {
                 const { featureAction, formData } = payload;
                 // Handle specific prompts based on featureAction...
                 // (Giữ nguyên logic prompt hiện có, chỉ cập nhật phần xử lý output)
                 let parts: Part[] = [];
                 let prompt = "";
                 
                 // Example Logic Re-use from previous version for consistency
                 if (featureAction === 'couple_compose') {
                     if (formData.person_left_image?.base64) parts.push({ inlineData: { data: formData.person_left_image.base64, mimeType: formData.person_left_image.mimeType } });
                     if (formData.person_right_image?.base64) parts.push({ inlineData: { data: formData.person_right_image.base64, mimeType: formData.person_right_image.mimeType } });
                     if (formData.custom_background?.base64) parts.push({ inlineData: { data: formData.custom_background.base64, mimeType: formData.custom_background.mimeType } });
                     
                     prompt = `[TASK] Generate couple photo. Face Consistency: ${formData.face_consistency}. Action: ${formData.affection_action}. Background: ${formData.couple_background || "Custom"}. Style: ${formData.aesthetic_style}.`;
                 } else {
                     prompt = `Execute Feature: ${featureAction}. Data: ${JSON.stringify(formData)}`;
                 }
                 parts.push({ text: prompt });

                 // For multi-image generation requests, loop it
                 const numImages = payload.numImages || 1;
                 const generationPromises = [];
                 
                 for(let i=0; i<numImages; i++) {
                     generationPromises.push(ai.models.generateContent({
                        model: selectedModel,
                        contents: { parts },
                        config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(selectedModel, imageSize) }
                     }));
                 }

                 const results = await Promise.all(generationPromises);
                 const images = [];
                 for(const r of results) {
                    const data = r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if(data) {
                        const processed = await processOutputImage(data);
                        // Strip prefix for frontend compatibility if needed, or send full dataUrl
                        images.push(processed.split(',')[1]); 
                    }
                 }
                 
                 return res.json({ images: images, successCount: images.length });
            }
            
             case 'generateFamilyPhoto':
             case 'generateFamilyPhoto_3_Pass': {
                 const familyModel = MODEL_PRO;
                 const { settings } = payload;
                 const prompt = `Family Photo Composite. Scene: ${settings.scene}. Members: ${settings.members.length}. Face Consistency: ${settings.faceConsistency}.`;
                 const geminiRes = await ai.models.generateContent({
                    model: familyModel,
                    contents: { parts: [{ text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: getImageConfig(familyModel, '4K', settings.aspectRatio) }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ imageData, similarityScores: [], debug: null });
             }

            // Text/Utility Actions (Free or Low Cost, handled simply)
            case 'generateMarketingAdCopy': 
            case 'generateMarketingVideoScript':
            case 'detectOutfit':
            case 'getHotTrends':
            case 'generateVideoPrompt':
            case 'generatePromptFromImage': {
                 // Logic xử lý text giữ nguyên, không cần processOutputImage
                 const { product, tone, angle, imagePart, userIdea, base64Image, mimeType, isFaceLockEnabled, language } = payload;
                 let prompt = "";
                 const parts: Part[] = [];

                 if (action === 'generateMarketingAdCopy') {
                     prompt = `Write ad copy for ${product.name}. Language: ${language}.`;
                     if(imagePart) parts.push(imagePart);
                 } else if (action === 'generateMarketingVideoScript') {
                     prompt = `Write video script for ${product.name}. Tone: ${tone}. Language: ${language}.`;
                     if(imagePart) parts.push(imagePart);
                 } else if (action === 'detectOutfit') {
                     prompt = "Describe outfit.";
                     parts.push({ inlineData: { data: base64Image, mimeType } });
                 } else if (action === 'getHotTrends') {
                     prompt = "List 5 fashion trends JSON.";
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
                    config: { responseMimeType: action.includes('JSON') || action === 'getHotTrends' || action === 'generateVideoPrompt' ? "application/json" : undefined }
                 });
                 
                 // Return appropriate JSON structure based on action
                 if (action === 'detectOutfit') return res.json({ outfit: geminiRes.text });
                 if (action === 'getHotTrends') return res.json({ trends: JSON.parse(geminiRes.text || '[]') });
                 if (action === 'generateVideoPrompt') return res.json({ prompts: JSON.parse(geminiRes.text || '{}') });
                 if (action === 'generatePromptFromImage') return res.json({ prompt: geminiRes.text });
                 
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
