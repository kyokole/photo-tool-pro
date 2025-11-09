// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
// It has been made self-contained to prevent Vercel bundling issues.

import { GoogleGenAI, Modality, Part, FeatureAction } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { 
    buildIdPhotoPrompt, 
    buildHeadshotPrompt, 
    buildFashionStudioPrompt,
    buildFourSeasonsPrompt,
    buildFootballIdolPrompt,
    buildFootballOutfitPrompt,
    buildProductPhotoPrompt,
    buildTryOnOutfitPrompt,
    buildPlaceInScenePrompt,
    buildBirthdayPhotoPrompt,
    buildCoupleComposePrompt,
    buildChangeHairstylePrompt,
    buildCreativeCompositePrompt,
    buildImageVariationPrompt,
    createFinalPrompt,
    BASE_PROMPT_INSTRUCTION, 
    FACE_LOCK_INSTRUCTION,
    INITIAL_CLEAN_PROMPT,
    ADVANCED_RESTORATION_PROMPT,
    COLORIZATION_PROMPT
} from '../services/_serverSidePrompts';

// --- MERGED TYPES from types.ts ---
// These types are included directly to make this file self-contained.
type AspectRatio = '2x3' | '3x4' | '4x6' | '5x5';
type FashionAspectRatio = '1:1' | '4:3' | '9:16' | '16:9';
type OutfitMode = 'preset' | 'custom' | 'upload';
type HairStyle = 'auto' | 'down' | 'slicked_back' | 'keep_original';
type BackgroundMode = 'white' | 'light_blue' | 'custom' | 'ai';
type PrintLayout = 'none' | '10x15' | '13x18' | '20x30';
type PaperBackground = 'white' | 'gray';
interface Settings {
  aspectRatio: AspectRatio;
  outfit: {
    mode: OutfitMode;
    preset: string;
    customPrompt: string;
    uploadedFile: any; // Simplified for server-side
    keepOriginal: boolean;
  };
  face: {
    otherCustom: string;
    hairStyle: HairStyle;
    keepOriginalFeatures: boolean;
    smoothSkin: boolean;
    slightSmile: boolean;
  };
  background: {
    mode: BackgroundMode;
    customColor: string;
    customPrompt: string;
  };
  safe5x5Layout: boolean;
  printLayout: PrintLayout;
  paperBackground: PaperBackground;
}
type FashionCategory = 'female' | 'male' | 'girl' | 'boy';
interface FashionStudioSettings {
  category: FashionCategory;
  style: string;
  aspectRatio: FashionAspectRatio;
  description: string;
  highQuality: boolean;
}
interface Scene {
  title: string;
  desc: string;
}
type FootballMode = 'idol' | 'outfit';
type FootballCategory = 'contemporary' | 'legendary';
interface FootballStudioSettings {
  mode: FootballMode;
  sourceImage: any; // Simplified for server-side
  category: FootballCategory;
  team: string;
  player: string;
  scene: string;
  aspectRatio: string;
  style: string;
  customPrompt: string;
}

// --- END OF MERGED TYPES ---


// Helper to convert base64 from client to a format the SDK understands
const base64ToPart = (fileData: { base64: string, mimeType: string }): Part => ({
    inlineData: {
        data: fileData.base64,
        mimeType: fileData.mimeType,
    },
});

const getAi = () => {
    // **FIX:** Check for both the user-defined key and the standard key for robustness.
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key của máy chủ chưa được cấu hình. Vui lòng kiểm tra biến môi trường GEMINI_API_KEY hoặc API_KEY và liên hệ quản trị viên.");
    }
    return new GoogleGenAI({ apiKey });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Wrap the entire function logic in a top-level try...catch block.
    // This prevents the function from crashing and ensures a JSON error is always returned.
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        // Input validation is now safely inside the try block
        if (!req.body) {
            return res.status(400).json({ error: 'Yêu cầu không có nội dung (body).'});
        }
        
        const { action, payload } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Thiếu tham số "action" trong yêu cầu.' });
        }
        
        const ai = getAi();
        const models = ai.models;

        switch (action) {
            case 'generateIdPhoto': {
                if (!payload || !payload.originalImage || !payload.settings) return res.status(400).json({ error: 'Thiếu ảnh gốc hoặc cài đặt.' });
                const { originalImage, settings, outfitImagePart } = payload;
                
                const prompt = buildIdPhotoPrompt(settings);
                const imagePart: Part = { inlineData: { data: originalImage.split(',')[1], mimeType: originalImage.split(';')[0].split(':')[1] } };
                const parts: Part[] = [];
                if (outfitImagePart) parts.push(outfitImagePart);
                parts.push(imagePart);
                parts.push({ text: prompt });

                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mime = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
                if (!data || !mime) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateHeadshot': {
                if (!payload || !payload.imagePart || !payload.prompt) return res.status(400).json({ error: 'Thiếu ảnh hoặc prompt.' });
                const { imagePart, prompt } = payload;

                const fullPrompt = buildHeadshotPrompt(prompt);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mime = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
                if (!data || !mime) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }
            
            case 'initialCleanImage':
            case 'advancedRestoreImage':
            case 'colorizeImage': {
                if (!payload || !payload.imagePart) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { imagePart } = payload;

                let prompt = '';
                if (action === 'initialCleanImage') prompt = INITIAL_CLEAN_PROMPT;
                else if (action === 'advancedRestoreImage') prompt = ADVANCED_RESTORATION_PROMPT;
                else if (action === 'colorizeImage') prompt = COLORIZATION_PROMPT;

                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!data) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: data });
            }
            
            case 'generateFashionPhoto': {
                if (!payload || !payload.imagePart || !payload.settings) return res.status(400).json({ error: 'Thiếu ảnh hoặc cài đặt.' });
                const { imagePart, settings } = payload;

                const prompt = buildFashionStudioPrompt(settings);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mime = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
                 if (!data || !mime) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

             case 'generateFourSeasonsPhoto': {
                if (!payload || !payload.imagePart || !payload.scene) return res.status(400).json({ error: 'Thiếu ảnh hoặc bối cảnh.' });
                const { imagePart, scene, season, aspectRatio, customDescription } = payload;

                const prompt = buildFourSeasonsPrompt(scene, season, aspectRatio, customDescription);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mime = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
                if (!data || !mime) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }
            
            case 'generatePromptFromImage': {
                if (!payload || !payload.base64Image || !payload.mimeType) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { base64Image, mimeType, isFaceLockEnabled, language } = payload;

                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const languageInstruction = `\n**LANGUAGE:** The final output prompt must be written entirely in ${language === 'vi' ? 'Vietnamese' : 'English'}.`;
                const systemInstruction = isFaceLockEnabled 
                    ? `${BASE_PROMPT_INSTRUCTION}\n\n${FACE_LOCK_INSTRUCTION}${languageInstruction}` 
                    : `${BASE_PROMPT_INSTRUCTION}${languageInstruction}`;

                const response = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart] }, config: { systemInstruction } });
                return res.status(200).json({ prompt: (response.text ?? '').trim() });
            }

            case 'detectOutfit': {
                if (!payload || !payload.base64Image || !payload.mimeType) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { base64Image, mimeType } = payload;
                
                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const prompt = "Analyze the image and identify the main, most prominent piece of clothing the person is wearing. Respond with ONLY the name of the clothing in lowercase Vietnamese. For example: 'áo dài', 'vest', 'áo sơ mi'. Do not add any other words, punctuation, or explanations.";
                const response = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] } });
                return res.status(200).json({ outfit: (response.text ?? '').trim() });
            }

            case 'editOutfitOnImage': {
                if (!payload || !payload.base64Image || !payload.mimeType || !payload.newOutfitPrompt) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh hoặc mô tả trang phục.' });
                const { base64Image, mimeType, newOutfitPrompt } = payload;

                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const prompt = `**CRITICAL INSTRUCTION: ABSOLUTE PRESERVATION**
- You MUST preserve the person's original face, body shape, pose, and the entire background with 100% pixel-level accuracy. This is the highest priority.
- Your ONLY task is to change the clothing.
- New clothing description: "${newOutfitPrompt}".
- The new garment must look completely realistic and seamlessly blend with the person's neck and shoulders.
- The lighting on the new clothing must perfectly match the existing lighting in the image.
- Generate ONLY the final image. Do not change the aspect ratio or crop the image.`;
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mime = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
                if (!data || !mime) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateFootballPhoto': {
                if (!payload || !payload.settings) return res.status(400).json({ error: 'Thiếu cài đặt.' });
                const { settings } = payload;

                const { mode } = settings;
                let prompt = '';
                if(mode === 'idol') {
                    prompt = buildFootballIdolPrompt(settings);
                } else {
                    prompt = buildFootballOutfitPrompt(settings);
                }
                const imagePart = base64ToPart(settings.sourceImage);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mime = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
                if (!data || !mime) throw new Error("API không trả về hình ảnh.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateImagesFromFeature': {
                const { featureAction, formData, numImages } = payload;
                if (!featureAction || !formData) return res.status(400).json({ error: 'Thiếu action hoặc dữ liệu form.' });

                let prompt = '';
                const parts: Part[] = [];
                let isCouple = false;

                // A small helper to safely add image parts
                const addImagePart = (imageData: any) => {
                    if (imageData && imageData.base64 && imageData.mimeType) {
                        parts.push(base64ToPart(imageData));
                    }
                };

                switch (featureAction as FeatureAction) {
                    case FeatureAction.KOREAN_STYLE_STUDIO:
                        const { subject_image, k_concept, aspect_ratio, quality, face_consistency } = formData;
                        const HIDDEN_ADDONS_SERVER = "Thần thái K-fashion hiện đại, sang trọng, dáng mềm mại, cổ tay tinh tế, Trang phục couture, Giá trị set đồ trên 2 tỷ VND, Ánh sáng điện ảnh Hàn, Độ chi tiết 8K, Giữ nguyên khuôn mặt tham chiếu";
                        prompt = `${k_concept}. Aspect ratio ${aspect_ratio}. Image quality ${quality}. ${face_consistency ? HIDDEN_ADDONS_SERVER : ''}`;
                        addImagePart(subject_image);
                        break;
                    case FeatureAction.IMAGE_VARIATION_GENERATOR:
                        const { reference_image, aspectRatio, identityLock, variationStrength, themeAnchor, style } = formData;
                        addImagePart(reference_image);
                        // This case has multiple parallel calls, so we handle it separately below.
                        break;
                    case FeatureAction.PRODUCT_PHOTO:
                        prompt = buildProductPhotoPrompt(formData);
                        addImagePart(formData.product_image);
                        addImagePart(formData.subject_image);
                        break;
                    case FeatureAction.TRY_ON_OUTFIT:
                        prompt = buildTryOnOutfitPrompt(formData);
                        addImagePart(formData.outfit_image);
                        addImagePart(formData.subject_image);
                        break;
                    case FeatureAction.PLACE_IN_SCENE:
                        prompt = buildPlaceInScenePrompt(formData);
                        addImagePart(formData.background_image);
                        addImagePart(formData.subject_image);
                        break;
                    case FeatureAction.BIRTHDAY_PHOTO:
                        prompt = buildBirthdayPhotoPrompt(formData);
                        addImagePart(formData.subject_image);
                        break;
                    case FeatureAction.COUPLE_COMPOSE:
                        isCouple = true;
                        prompt = buildCoupleComposePrompt(formData);
                        addImagePart(formData.person_left_image);
                        addImagePart(formData.person_right_image);
                        addImagePart(formData.custom_background);
                        break;
                    case FeatureAction.CHANGE_HAIRSTYLE:
                        prompt = buildChangeHairstylePrompt(formData);
                        addImagePart(formData.subject_image);
                        break;
                    case FeatureAction.CREATIVE_COMPOSITE:
                        prompt = buildCreativeCompositePrompt(formData);
                        addImagePart(formData.main_subject?.file);
                        if (formData.additional_components) {
                            formData.additional_components.forEach((comp: any) => addImagePart(comp.file));
                        }
                        break;
                    default:
                        return res.status(400).json({ error: `Tính năng '${featureAction}' chưa được triển khai trên backend.` });
                }
                
                // Handle Image Variation separately due to its unique parallel structure
                if (featureAction === FeatureAction.IMAGE_VARIATION_GENERATOR) {
                     const { reference_image, aspectRatio, identityLock, variationStrength, themeAnchor, style } = formData;
                    const imagePart = base64ToPart(reference_image);
                    const promises = Array.from({ length: 4 }, (_, i) => {
                        const variationPrompt = buildImageVariationPrompt({ aspectRatio, identityLock, variationStrength, themeAnchor, style }, i);
                        return models.generateContent({
                            model: 'gemini-2.5-flash-image',
                            contents: { parts: [imagePart, { text: variationPrompt }] },
                            config: { responseModalities: [Modality.IMAGE] },
                        });
                    });
                    const results = await Promise.allSettled(promises);
                    const images = results.map(r => r.status === 'fulfilled' ? r.value.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data : null).filter(Boolean);
                    return res.status(200).json({ images, successCount: images.length });
                }

                // Standard generation for other features
                const userRequest = createFinalPrompt(prompt, parts.length > 0, isCouple);
                parts.push({ text: userRequest });

                const promises = Array(numImages).fill(0).map(() => models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE] }
                }));
                
                const results = await Promise.allSettled(promises);
                const images = results.map(r => r.status === 'fulfilled' ? r.value.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data : null).filter(Boolean);

                return res.status(200).json({ images, successCount: images.length });
            }

            case 'getHotTrends': {
                 const response = await models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Đóng vai một chuyên gia xu hướng mạng xã hội. Tìm kiếm trên web các xu hướng nhiếp ảnh và chỉnh sửa hình ảnh trực quan mới nhất và phổ biến nhất trên các nền tảng như TikTok, Instagram và Pinterest. Lập một danh sách gồm 25 xu hướng đa dạng và sáng tạo có thể áp dụng cho ảnh của một người. Đặt một cái tên ngắn gọn, hấp dẫn cho mỗi xu hướng bằng tiếng Việt. Chỉ trả về một mảng JSON hợp lệ chứa các chuỗi, trong đó mỗi chuỗi là một tên xu hướng. Không bao gồm các dấu ngoặc kép markdown (\`\`\`json), giải thích hoặc bất kỳ văn bản nào khác ngoài mảng JSON.`,
                    config: { tools: [{googleSearch: {}}] }
                });
                let jsonStr = (response.text ?? '').trim().match(/(\[[\s\S]*\])/)?.[0];
                if (!jsonStr) throw new Error("Không thể phân tích xu hướng từ phản hồi của AI.");
                return res.status(200).json({ trends: JSON.parse(jsonStr) });
            }

            default:
                return res.status(400).json({ error: `Action không xác định: ${action}` });
        }
    } catch (error: any) {
        console.error(`[Vercel Serverless] Lỗi khi thực thi action "${req.body?.action}":`, error);
        
        let errorMessage = 'Đã xảy ra lỗi không xác định ở máy chủ.';
        let statusCode = 500;

        if (error.message) {
            errorMessage = error.message;
        }
        
        // Cố gắng tìm các lỗi cụ thể hơn
        let errorStringForSearch = '';
        try {
            errorStringForSearch = JSON.stringify(error);
        } catch {
            errorStringForSearch = String(error);
        }

        if (errorStringForSearch.includes('429') || errorStringForSearch.includes('RESOURCE_EXHAUSTED') || errorStringForSearch.includes('rate limit')) {
            statusCode = 429;
            // NEW: Enhanced error parsing for Quota Failures
            try {
                // Google API errors often have a nested structure. We try to find it.
                // The actual error object might be in `error.cause` or a JSON string in `error.message`.
                const potentialErrorBody = error.cause?.error || JSON.parse(error.message.substring(error.message.indexOf('{')));
                const details = potentialErrorBody?.details;
                if (details && Array.isArray(details)) {
                    const quotaFailure = details.find(d => d['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure');
                    if (quotaFailure && quotaFailure.violations && quotaFailure.violations.length > 0) {
                        const violation = quotaFailure.violations[0];
                        // Construct a very specific error message for the user
                        errorMessage = `Đã vượt quá hạn ngạch API. Chi tiết: "${violation.description}". Vui lòng kiểm tra hạn ngạch có tên "${violation.subject}" trong Google Cloud Console.`;
                    } else {
                         errorMessage = "Bạn đã vượt quá hạn ngạch sử dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên. Không thể lấy chi tiết lỗi cụ thể.";
                    }
                } else {
                     errorMessage = "Bạn đã vượt quá hạn ngạch sử dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên. Chi tiết lỗi không có sẵn.";
                }
            } catch (parseError) {
                // If parsing fails, fall back to the generic message
                errorMessage = "Bạn đã vượt quá hạn ngạch sử dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên. (Lỗi khi phân tích chi tiết).";
            }
        } else if (errorStringForSearch.includes('API_KEY_INVALID') || errorStringForSearch.includes('API key not valid') || error.message.includes('GEMINI_API_KEY')) {
            errorMessage = "API Key của máy chủ không hợp lệ hoặc bị thiếu. Vui lòng liên hệ quản trị viên.";
            statusCode = 500; // This is a server error, not a client error
        } else if (error instanceof TypeError) {
             errorMessage = `Lỗi cú pháp hoặc dữ liệu không hợp lệ ở máy chủ: ${error.message}`;
             statusCode = 400; // Bad Request
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
}