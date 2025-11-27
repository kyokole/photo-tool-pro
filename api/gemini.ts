
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
    'generateVideoFromImage'
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

// --- HELPER: USER STATUS CHECK ---
interface UserStatus {
    isVip: boolean;
    isAdmin: boolean;
    uid: string | null;
}

const getUserStatus = async (idToken?: string, clientVipStatus?: boolean): Promise<UserStatus> => {
    // 1. If no token, definitely a guest
    if (!idToken) {
        return { isVip: false, isAdmin: false, uid: null };
    }

    // 2. Try Server-Side Verification (Best Security)
    if (isFirebaseInitialized) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(uid).get();

            if (!userDoc.exists) {
                // Valid token but no DB record? Fallback to client claim if token is valid
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
            // Fall through to Fail-Open strategy
        }
    }

    // 3. Fail-Open Strategy (Trust Client Fallback)
    // If server verification failed (e.g. missing config) BUT user sent a token and claims VIP,
    // we trust them to avoid ruining the UX for paid users during config issues.
    if (idToken && clientVipStatus === true) {
        console.warn("Using Client-Side VIP Status because Server Verification failed.");
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

        // Tạo SVG pattern cho watermark dạng lưới nghiêng chuyên nghiệp
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
        return imageBuffer; // Fallback to original on error
    }
};

// --- HELPER: RESOLUTION RESOLVER ---
const resolveImageSize = (payload: any, isVip: boolean): string => {
    if (!isVip) return '1K';

    if (payload.quality === 'high' || payload.quality === 'ultra') return '4K';
    if (payload.settings?.highQuality === true) return '4K';
    if (payload.options?.highQuality === true) return '4K';
    if (payload.highQuality === true) return '4K';
    
    if (payload.formData?.highQuality === true) return '4K'; 
    if (payload.style?.highQuality === true) return '4K';
    if (payload.tool?.highQuality === true) return '4K';
    
    return '1K';
};

// --- HELPER: MODEL SELECTOR ---
const selectModel = (imageSize: string): string => {
    if (imageSize === '4K') return MODEL_PRO;
    return MODEL_FLASH;
};

// --- HELPER: CONFIG BUILDER ---
const getImageConfig = (model: string, imageSize: string, aspectRatio?: string) => {
    const config: any = {};
    if (aspectRatio) config.aspectRatio = aspectRatio;
    
    // Only add imageSize if using the Pro model.
    if (model === MODEL_PRO) {
        config.imageSize = imageSize;
    }
    return config;
};

// --- PROMPT BUILDERS ---
const buildIdPhotoPrompt = (settings: any): string => {
    let prompt = `**Cắt ảnh chân dung:** Cắt lấy phần đầu và vai chuẩn thẻ. Loại bỏ nền tạp.
**Vai trò:** Biên tập viên ảnh thẻ chuyên nghiệp (Passport/Visa standard).
`;
    if (settings.background.mode === 'ai' && settings.background.customPrompt.trim() !== '') {
        prompt += `**1. Nền AI:** "${settings.background.customPrompt}". Làm mờ nền (bokeh) để nổi bật chủ thể. Ánh sáng nền khớp với người.\n`;
    } else {
        const color = settings.background.mode === 'custom' ? settings.background.customColor : (settings.background.mode === 'white' ? '#FFFFFF' : '#E0E8F0');
        prompt += `**1. Nền:** Màu đồng nhất ${color}. Tách nền (masking) hoàn hảo từng sợi tóc.\n`;
    }
    
    if (settings.outfit.mode === 'upload') {
        prompt += `**2. Trang phục (từ ảnh 2):** Thay trang phục cho người (ảnh 1) bằng bộ đồ ở ảnh 2. Vừa vặn, tự nhiên.\n`;
    } else if (!settings.outfit.keepOriginal) {
        prompt += `**2. Trang phục:** Thay thành "${settings.outfit.mode === 'preset' ? settings.outfit.preset : settings.outfit.customPrompt}". Phải khớp cổ và vai.\n`;
    }

    const hairStyleMap: Record<string, string> = {
        'auto': 'Gọn gàng, lịch sự, lộ rõ trán và tai (chuẩn ảnh thẻ)',
        'down': 'Tóc thả tự nhiên, mềm mại, vén gọn gàng',
        'slicked_back': 'Chải vuốt ngược ra sau (Slicked back), gọn gàng',
        'keep_original': 'Giữ nguyên kiểu tóc gốc'
    };

    const hairDesc = hairStyleMap[settings.face.hairStyle] || settings.face.hairStyle;

    if (settings.face.hairStyle !== 'keep_original') {
         prompt += `**3. TÓC (ƯU TIÊN THAY ĐỔI):** Thay đổi kiểu tóc thành: "${hairDesc}". `;
         if (settings.face.keepOriginalFeatures) {
             prompt += `LƯU Ý: Giữ nguyên 100% đặc điểm ngũ quan (mắt, mũi, miệng, cấu trúc mặt) của ảnh gốc, NHƯNG PHẢI THAY ĐỔI TÓC theo yêu cầu. `;
         } else {
             prompt += `Tinh chỉnh nhẹ gương mặt cho chuyên nghiệp. `;
         }
    } else {
         prompt += `**3. Tóc:** Giữ nguyên tóc gốc. `;
         if (!settings.face.keepOriginalFeatures) prompt += `Tinh chỉnh nhẹ cho chuyên nghiệp. `;
    }

    if (settings.face.smoothSkin) prompt += `Làm mịn da tự nhiên (giữ kết cấu). `;
    if (settings.face.otherCustom) prompt += `Yêu cầu thêm: ${settings.face.otherCustom}. `;
    
    prompt += `**4. Xuất bản:** Canvas tỷ lệ chân dung chuẩn. Có padding xung quanh. Độ phân giải cao.`;
    return prompt;
};

const buildRestorationPrompt = (options: any): string => {
    const { restorationLevel, removeScratches, colorize, faceEnhance, gender, age, context } = options;
    let prompt = `Chuyên gia phục chế ảnh. Phục hồi ảnh cũ này (Mức độ ${restorationLevel}/100). Ưu tiên BẢO TOÀN DANH TÍNH.\n`;
    if (removeScratches) prompt += `- Xóa xước, rách, nhiễu, mốc. Inpaint liền mạch.\n`;
    if (faceEnhance) prompt += `- Làm rõ nét mặt (mắt, da, tóc) nhưng KHÔNG đổi cấu trúc. Giới tính: ${gender}, Tuổi: ${age}.\n`;
    if (colorize) prompt += `- Tô màu chân thực, tự nhiên (da, áo, nền).\n`;
    else prompt += `- Giữ đen trắng, tăng tương phản/chi tiết.\n`;
    if (context) prompt += `- Bối cảnh: "${context}".\n`;
    return prompt;
};

const buildBeautyPrompt = (tool: any, subFeature: any, style: any): string => {
    const main = "Expert AI photo retoucher. Perform localized modification. Preserve identity/pose/bg.";
    const instr = style?.promptInstruction || subFeature?.promptInstruction || tool?.promptInstruction;
    let mod = instr || `Apply ${tool.englishLabel} effect.`;
    if (instr) {
        mod = mod.replace('{{style}}', style?.englishLabel || '').replace('{{sub_feature}}', subFeature?.englishLabel || '').replace('{{tool}}', tool?.englishLabel || '');
    }
    return `${main} Modification: ${mod}. Return image only.`;
};

const getFramingInstruction = (style: string): string => {
    switch (style) {
        case 'full_body': return "Full Body Shot. Show the subject from head to toe. Shoes must be visible.";
        case 'half_body': return "Medium Shot. Frame from the waist up. **CRITICAL: DO NOT SHOW LEGS. DO NOT SHOW SHOES.** Focus on the upper body.";
        case 'shoulder_portrait': return "Close-up Portrait. Frame from the shoulders up. Focus intensely on facial details.";
        case 'cinematic_wide': return "Wide Angle Shot. Environmental portrait showing the subject in a broad scene.";
        default: return "Standard portrait framing.";
    }
};

// --- UTILS ---
const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// --- HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    // 1. Extract Data
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    // 2. Verify User (with fallback)
    const { isVip, isAdmin } = await getUserStatus(idToken, clientVipStatus);

    // 3. Block VIP Features if not VIP
    if (VIP_ONLY_ACTIONS.includes(action) && !isVip) {
        return res.status(403).json({ error: "Tính năng này chỉ dành cho thành viên VIP. Vui lòng nâng cấp để sử dụng." });
    }

    const ai = getAi();
    
    // 4. Determine Quality & Model
    const imageSize = resolveImageSize(payload, isVip);
    const selectedModel = selectModel(imageSize);

    // 5. Output Processor (Add Watermark if not VIP)
    const processOutputImage = async (base64Data: string | undefined): Promise<string> => {
        if (!base64Data) throw new Error("Không có dữ liệu ảnh được tạo.");
        if (isVip) return `data:image/png;base64,${base64Data}`;

        // Add watermark for free users
        const inputBuffer = Buffer.from(base64Data, 'base64');
        const watermarkedBuffer = await addWatermark(inputBuffer);
        return `data:image/png;base64,${watermarkedBuffer.toString('base64')}`;
    };

    try {
        switch (action) {
            case 'generateIdPhoto': {
                 const { originalImage, settings } = payload;
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
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize)
                    }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ imageData });
            }

            case 'performRestoration':
            case 'performDocumentRestoration': {
                const { imagePart, options } = payload;
                const prompt = buildRestorationPrompt(options);
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize)
                    }
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
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize) 
                    }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateFourSeasonsPhoto': {
                const { imagePart, scene, season, aspectRatio, customDescription } = payload;
                const prompt = `[TASK] Four Seasons Photo. Season: ${season}. Scene: ${scene.title}. ${scene.desc}. ${customDescription}. [QUALITY] Photorealistic. [ASPECT] ${aspectRatio}.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize, aspectRatio) 
                    }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateFootballPhoto': {
                const { settings } = payload;
                const prompt = `[TASK] Football Photo. Mode: ${settings.mode}. Team: ${settings.team}. Player: ${settings.player}. Scene: ${settings.scene}. Style: ${settings.style}. ${settings.customPrompt}. [QUALITY] Photorealistic.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [{ inlineData: { data: settings.sourceImage.base64, mimeType: settings.sourceImage.mimeType } }, { text: prompt }] },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize) 
                    }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateBeautyPhoto': {
                const { baseImage, tool, subFeature, style } = payload;
                const prompt = buildBeautyPrompt(tool, subFeature, style);
                const parts = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize) 
                    }
                });
                const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                return res.json({ imageData });
            }

            case 'generateImagesFromFeature': {
                 const { featureAction, formData } = payload;
                 const parts: Part[] = [];
                 const textData: Record<string, any> = {};

                 const processValue = (val: any): any => {
                    if (!val) return val;
                    if (val.base64 && val.mimeType) {
                        parts.push({ inlineData: { data: val.base64, mimeType: val.mimeType } });
                        return `[Image_${parts.length}]`;
                    }
                    if (typeof val === 'object' && val.file && val.file.base64) {
                         parts.push({ inlineData: { data: val.file.base64, mimeType: val.file.mimeType } });
                        return { ...val, file: `[Image_${parts.length}]` };
                    }
                    if (Array.isArray(val)) return val.map(item => processValue(item));
                    if (typeof val === 'object') {
                        const newObj: Record<string, any> = {};
                        for (const k in val) newObj[k] = processValue(val[k]);
                        return newObj;
                    }
                    if (typeof val === 'string' && val.length > 10000) return "[TRUNCATED]";
                    return val;
                 };

                 for (const key in formData) textData[key] = processValue(formData[key]);

                 let specificInstructions = "";
                 if (featureAction === 'couple_compose') {
                     specificInstructions = `[STRICT IDENTITY & GENDER PROTOCOL]...`;
                 } else if (['try_on_outfit', 'change_hairstyle', 'korean_style_studio', 'professional_headshot', 'product_photo', 'place_in_scene'].includes(featureAction)) {
                     const framingInstr = getFramingInstruction(textData.frame_style || 'half_body');
                     specificInstructions = `[STRICT IDENTITY & FRAMING PROTOCOL]... FRAMING: ${framingInstr}`;
                 }

                 const prompt = `
                 [TASK] Execute Feature: ${featureAction}.
                 [CONTEXT] Input Data: ${JSON.stringify(textData)}.
                 ${specificInstructions}
                 [OUTPUT CONFIG] Quality: ${imageSize}, Photorealistic. Aspect Ratio: ${textData.aspect_ratio || '3:4'}.
                 `;
                 parts.push({ text: prompt });

                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize)
                    }
                 });
                 
                 const rawData = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                 const processedData = await processOutputImage(rawData);
                 return res.json({ images: [processedData.split(',')[1]], successCount: 1 });
            }

            case 'generateBatchImages': {
                const { prompt, aspectRatio, numOutputs } = payload;
                const generateOne = () => ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [{ text: `[TASK] Image Generation. [PROMPT] ${prompt}. [ASPECT] ${aspectRatio}. [QUALITY] ${imageSize}.` }] },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize)
                    }
                });

                const count = Math.min(numOutputs || 1, 4);
                const promises = Array(count).fill(0).map(() => generateOne());
                const results = await Promise.all(promises);
                
                const processedImages = await Promise.all(results.map(async (r) => {
                    const raw = r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (!raw) return null;
                    const processed = await processOutputImage(raw);
                    return processed.split(',')[1]; 
                }));
                
                return res.json({ images: processedImages.filter(Boolean) });
            }

            case 'generateThumbnail': {
                 const { modelImage, refImage, inputs, ratio } = payload;
                 const parts: Part[] = [];
                 if (modelImage) parts.push({ inlineData: { data: modelImage, mimeType: 'image/jpeg' } });
                 if (refImage) parts.push({ inlineData: { data: refImage, mimeType: 'image/jpeg' } });
                 const prompt = `[TASK] Generate YouTube Thumbnail Background. [RATIO] ${ratio}. [INFO] Title: ${inputs.title}, Speaker: ${inputs.speaker}, Action: ${inputs.action}. [STYLE] Professional, High CTR, 4K.`;
                 parts.push({ text: prompt });

                 const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize)
                    }
                 });
                 const imageData = await processOutputImage(geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
                 return res.json({ image: imageData });
            }

            case 'generateVideoFromImage': {
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
                while (!operation.done && retries < 30) {
                  await new Promise(resolve => setTimeout(resolve, 10000));
                  operation = await ai.operations.getVideosOperation({operation: operation});
                  retries++;
                }
                
                if (!operation.done) throw new Error("Video generation timed out.");
                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!downloadLink) throw new Error("No video URI returned.");
                
                const vidRes = await fetch(`${downloadLink}&key=${process.env.GEMINI_API_KEY || process.env.API_KEY}`);
                const vidArrayBuffer = await vidRes.arrayBuffer();
                const vidBase64 = Buffer.from(vidArrayBuffer).toString('base64');
                
                return res.json({ videoUrl: `data:video/mp4;base64,${vidBase64}` });
            }

            case 'generateFamilyPhoto':
            case 'generateFamilyPhoto_3_Pass': {
                const { settings } = payload;
                const { members, scene, outfit, pose, customPrompt, faceConsistency } = settings;
                
                // Force High Quality/Pro Model for Family Photo
                const familyModel = MODEL_PRO;
                const familySize = '4K'; 

                const parts: Part[] = [];
                let memberDescriptions = "";

                if (members && Array.isArray(members)) {
                    members.forEach((m: any, index: number) => {
                        const memberLabel = `[REFERENCE_FACE_ID_${index + 1}]`;
                        if (m.photo?.base64) {
                            const cleanBase64 = m.photo.base64.replace(/^data:image\/\w+;base64,/, "");
                            parts.push({
                                inlineData: { data: cleanBase64, mimeType: m.photo.mimeType || 'image/jpeg' }
                            });
                            
                            parts.push({
                                text: `This is ${memberLabel}.`
                            });

                            memberDescriptions += `- Person ${index + 1}: Based strictly on ${memberLabel}. Age: ${m.age}. ${m.bodyDescription ? `Body: ${m.bodyDescription}.` : ''} ${m.outfit ? `Individual Outfit: ${m.outfit}.` : ''} ${m.pose ? `Individual Pose: ${m.pose}.` : ''}\n`;
                        }
                    });
                }

                let systemInstruction = `
                **ROLE:** Expert Family Photographer & Digital Compositor using "Banana Pro" Identity Protocol.
                **TASK:** Compose a hyper-realistic family photo based on the provided ${members.length} reference images.
                
                **IDENTITY PRESERVATION PROTOCOL (CRITICAL - STRICT):**
                1. You must map each [REFERENCE_FACE_ID_X] to a person in the final image.
                2. **DO NOT MIX FACES.** Person 1 must look like Reference 1. Person 2 must look like Reference 2.
                3. **ADULTS (ESPECIALLY WOMEN/MOTHERS): DO NOT "BEAUTIFY", "REJUVENATE" OR "FILTER" THE FACE.**
                   - Preserve distinctive facial marks, nasolabial folds, natural skin texture, and bone structure.
                   - Do not turn a 40-year-old mother into a 20-year-old model. Respect the input age and features.
                   - Ensure the face looks like a real person, not a wax figure or AI drawing.
                4. **CHILDREN:** Maintain their likeness but allow for natural expressions.
                ${faceConsistency ? '5. **STRICT MODE:** Face consistency is the highest priority over style. If lighting clashes with identity, prioritize identity.' : ''}

                **SCENE CONFIGURATION:**
                - **Scene/Background:** ${scene}.
                - **Global Outfit Theme:** ${outfit} (unless overridden by individual settings).
                - **Global Pose/Vibe:** ${pose}.
                - **Additional Requests:** ${customPrompt}.

                **MEMBER MAPPING:**
                ${memberDescriptions}

                **OUTPUT SPEC:**
                - Resolution: 4K (Ultra High Definition).
                - Style: Photorealistic, cinematic lighting, sharp focus on all faces.
                - Aspect Ratio: ${settings.aspectRatio || '4:3'}.
                `;

                parts.push({ text: systemInstruction });

                const geminiRes = await ai.models.generateContent({
                    model: familyModel,
                    contents: { parts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(familyModel, familySize, settings.aspectRatio || '4:3')
                    }
                });

                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!data) throw new Error("Failed to generate image.");
                
                const imageData = await processOutputImage(data);
                return res.json({ imageData, similarityScores: [], debug: null });
            }

            case 'detectOutfit': {
                const { base64Image, mimeType } = payload;
                const prompt = "Analyze the person's outfit in this image. Describe it briefly in Vietnamese. Return only the description.";
                const geminiRes = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] }
                });
                return res.json({ outfit: geminiRes.text?.trim() || '' });
            }

            case 'editOutfitOnImage': {
                if (!isVip) return res.status(403).json({ error: "Tính năng chỉnh sửa trang phục chỉ dành cho VIP." });
                const { base64Image, mimeType, newOutfitPrompt } = payload;
                const prompt = `[TASK] Edit Outfit. Change outfit to: "${newOutfitPrompt}". Preserve face, pose, and background. [QUALITY] ${imageSize}, photorealistic.`;
                const geminiRes = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: getImageConfig(selectedModel, imageSize)
                    }
                });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const imageData = await processOutputImage(data);
                return res.json({ imageData });
            }

            case 'getHotTrends': {
                const prompt = "List 5 current hot fashion or photography trends in Vietnam. Return JSON array of strings.";
                const geminiRes = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: { parts: [{ text: prompt }] },
                    config: { responseMimeType: "application/json" }
                });
                try {
                    const trends = JSON.parse(geminiRes.text || '[]');
                    return res.json({ trends });
                } catch { return res.json({ trends: [] }); }
            }

            case 'generateVideoPrompt': {
                if (!isVip) return res.status(403).json({ error: "Tính năng tạo prompt video chỉ dành cho VIP." });
                const { userIdea, base64Image } = payload;
                const prompt = `Create a high-quality video generation prompt based on this image and idea: "${userIdea}". Return JSON { "englishPrompt": "...", "vietnamesePrompt": "..." }.`;
                const parts: Part[] = [{ text: prompt }];
                if (base64Image) parts.unshift({ inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } });
                
                const geminiRes = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: { parts },
                    config: { responseMimeType: "application/json" }
                });
                return res.json({ prompts: JSON.parse(geminiRes.text || '{}') });
            }

            case 'generatePromptFromImage': {
                if (!isVip) return res.status(403).json({ error: "Tính năng phân tích ảnh chỉ dành cho VIP." });
                const { base64Image, mimeType, isFaceLockEnabled, language } = payload;
                const promptText = `Describe this image in extreme detail for image generation. ${isFaceLockEnabled ? "Focus intensely on describing the face features, proportions, and identity." : ""} Output language: ${language}.`;
                const geminiRes = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: promptText }] }
                });
                return res.json({ prompt: geminiRes.text });
            }

            default:
                return res.status(400).json({ error: "Unknown action" });
        }
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ error: e.message || "Server Error" });
    }
}
