// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.

import { GoogleGenAI, Modality, Part } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { 
    buildIdPhotoPrompt, 
    INITIAL_CLEAN_PROMPT, 
    ADVANCED_RESTORATION_PROMPT, 
    COLORIZATION_PROMPT,
    buildHeadshotPrompt,
    buildFashionStudioPrompt,
    buildFourSeasonsPrompt,
    BASE_PROMPT_INSTRUCTION,
    FACE_LOCK_INSTRUCTION,
    buildFootballIdolPrompt,
    buildFootballOutfitPrompt,
    createFinalPrompt as createCreativeStudioFinalPrompt,
    buildImageVariationPrompt
} from '../services/_serverSidePrompts'; // We'll move prompt logic here

// Helper to convert base64 from client to a format the SDK understands
const base64ToPart = (fileData: { base64: string, mimeType: string }): Part => ({
    inlineData: {
        data: fileData.base64,
        mimeType: fileData.mimeType,
    },
});

const getAi = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;
    
    try {
        const ai = getAi();
        const models = ai.models;

        switch (action) {
            case 'generateIdPhoto': {
                const { originalImage, settings, outfitImagePart } = payload;
                const prompt = buildIdPhotoPrompt(settings);
                const imagePart: Part = { inlineData: { data: originalImage.split(',')[1], mimeType: originalImage.split(';')[0].split(':')[1] } };
                const parts: Part[] = [];
                if (outfitImagePart) parts.push(outfitImagePart);
                parts.push(imagePart);
                parts.push({ text: prompt });

                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                const mime = response.candidates[0].content.parts[0].inlineData?.mimeType;
                if (!data || !mime) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateHeadshot': {
                const { imagePart, prompt } = payload;
                const fullPrompt = buildHeadshotPrompt(prompt);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                const mime = response.candidates[0].content.parts[0].inlineData?.mimeType;
                if (!data || !mime) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }
            
            case 'initialCleanImage':
            case 'advancedRestoreImage':
            case 'colorizeImage': {
                const { imagePart } = payload;
                let prompt = '';
                if (action === 'initialCleanImage') prompt = INITIAL_CLEAN_PROMPT;
                else if (action === 'advancedRestoreImage') prompt = ADVANCED_RESTORATION_PROMPT;
                else if (action === 'colorizeImage') prompt = COLORIZATION_PROMPT;

                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                if (!data) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: data });
            }
            
            case 'generateFashionPhoto': {
                const { imagePart, settings } = payload;
                const prompt = buildFashionStudioPrompt(settings);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                const mime = response.candidates[0].content.parts[0].inlineData?.mimeType;
                 if (!data || !mime) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

             case 'generateFourSeasonsPhoto': {
                const { imagePart, scene, season, aspectRatio, customDescription } = payload;
                const prompt = buildFourSeasonsPrompt(scene, season, aspectRatio, customDescription);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                const mime = response.candidates[0].content.parts[0].inlineData?.mimeType;
                if (!data || !mime) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }
            
            case 'generatePromptFromImage': {
                const { base64Image, mimeType, isFaceLockEnabled, language } = payload;
                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const languageInstruction = `\n**LANGUAGE:** The final output prompt must be written entirely in ${language === 'vi' ? 'Vietnamese' : 'English'}.`;
                const systemInstruction = isFaceLockEnabled 
                    ? `${BASE_PROMPT_INSTRUCTION}\n\n${FACE_LOCK_INSTRUCTION}${languageInstruction}` 
                    : `${BASE_PROMPT_INSTRUCTION}${languageInstruction}`;

                const response = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart] }, config: { systemInstruction } });
                return res.status(200).json({ prompt: response.text.trim() });
            }

            case 'detectOutfit': {
                const { base64Image, mimeType } = payload;
                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const prompt = "Analyze the image and identify the main, most prominent piece of clothing the person is wearing. Respond with ONLY the name of the clothing in lowercase Vietnamese. For example: 'áo dài', 'vest', 'áo sơ mi'. Do not add any other words, punctuation, or explanations.";
                const response = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] } });
                return res.status(200).json({ outfit: response.text.trim() });
            }

            case 'editOutfitOnImage': {
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
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                const mime = response.candidates[0].content.parts[0].inlineData?.mimeType;
                if (!data || !mime) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateFootballPhoto': {
                const { settings } = payload;
                const { mode, sourceImage, category, team, player, scene } = settings;
                let prompt = '';
                if(mode === 'idol') {
                    prompt = buildFootballIdolPrompt(settings);
                } else {
                    prompt = buildFootballOutfitPrompt(settings);
                }
                const imagePart = base64ToPart(sourceImage);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const data = response.candidates[0].content.parts[0].inlineData?.data;
                const mime = response.candidates[0].content.parts[0].inlineData?.mimeType;
                if (!data || !mime) throw new Error("API did not return an image.");
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateImagesFromFeature': {
                // This is a complex one, it will handle all creative studio features.
                // We will need a large switch statement or a handler map here.
                // This is a simplified version for brevity.
                const { featureAction, formData, numImages } = payload;
                
                // The actual logic will be complex and needs to be ported from creativeStudioService
                // For now, let's implement a simple case like KOREAN_STYLE_STUDIO
                if (featureAction === 'korean_style_studio') {
                    const { subject_image, k_concept, aspect_ratio, quality, face_consistency } = formData;
                    const HIDDEN_ADDONS_SERVER = "Thần thái K-fashion hiện đại, sang trọng, dáng mềm mại, cổ tay tinh tế, Trang phục couture, Giá trị set đồ trên 2 tỷ VND, Ánh sáng điện ảnh Hàn, Độ chi tiết 8K, Giữ nguyên khuôn mặt tham chiếu";
                    const prompt = `${k_concept}. Aspect ratio ${aspect_ratio}. Image quality ${quality}. ${face_consistency ? HIDDEN_ADDONS_SERVER : ''}`;

                    const userRequest = createCreativeStudioFinalPrompt(prompt, true);
                    const imagePart = base64ToPart(subject_image);
                    
                    const promises = Array(numImages).fill(0).map(() => models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [imagePart, { text: userRequest }] },
                        config: { responseModalities: [Modality.IMAGE] }
                    }));
                    
                    const results = await Promise.allSettled(promises);
                    const images = results.map(r => r.status === 'fulfilled' ? r.value.candidates[0].content.parts[0].inlineData?.data : null).filter(Boolean);

                    return res.status(200).json({ images, successCount: images.length });
                }

                 if (featureAction === 'image_variation_generator') {
                    const { reference_image, aspectRatio, identityLock, variationStrength, themeAnchor, style } = formData;
                    const imagePart = base64ToPart(reference_image);
                    
                    const promises = Array.from({ length: 4 }, (_, i) => {
                        const prompt = buildImageVariationPrompt({ aspectRatio, identityLock, variationStrength, themeAnchor, style }, i);
                        return models.generateContent({
                            model: 'gemini-2.5-flash-image',
                            contents: { parts: [imagePart, { text: prompt }] },
                            config: { responseModalities: [Modality.IMAGE] },
                        });
                    });

                    const responses = await Promise.all(promises);
                    const resultImages = responses.map(response => response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data).filter(Boolean);
                    
                    return res.status(200).json({ images: resultImages, successCount: resultImages.length });
                }

                // Placeholder for other features
                return res.status(400).json({ error: `Feature action '${featureAction}' not yet implemented on the backend.` });
            }

            case 'getHotTrends': {
                 const response = await models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Đóng vai một chuyên gia xu hướng mạng xã hội. Tìm kiếm trên web các xu hướng nhiếp ảnh và chỉnh sửa hình ảnh trực quan mới nhất và phổ biến nhất trên các nền tảng như TikTok, Instagram và Pinterest. Lập một danh sách gồm 25 xu hướng đa dạng và sáng tạo có thể áp dụng cho ảnh của một người. Đặt một cái tên ngắn gọn, hấp dẫn cho mỗi xu hướng bằng tiếng Việt. Chỉ trả về một mảng JSON hợp lệ chứa các chuỗi, trong đó mỗi chuỗi là một tên xu hướng. Không bao gồm các dấu ngoặc kép markdown (\`\`\`json), giải thích hoặc bất kỳ văn bản nào khác ngoài mảng JSON.`,
                    config: { tools: [{googleSearch: {}}] }
                });
                let jsonStr = response.text.trim().match(/(\[[\s\S]*\])/)?.[0];
                if (!jsonStr) throw new Error("Could not parse trends from AI response.");
                return res.status(200).json({ trends: JSON.parse(jsonStr) });
            }

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (error: any) {
        console.error(`Error in /api/gemini for action "${action}":`, error);
        
        // Detailed error checking
        let errorMessage = 'An unknown server error occurred.';
        if (error.message) {
            errorMessage = error.message;
        }
        
        let errorStringForSearch = '';
        try {
            errorStringForSearch = JSON.stringify(error);
        } catch {
            errorStringForSearch = String(error);
        }

        if (errorStringForSearch.includes('429') && (errorStringForSearch.includes('RESOURCE_EXHAUSTED') || errorStringForSearch.includes('rate limit'))) {
            errorMessage = "You have exceeded your free usage quota for today. Please try again in 24 hours or contact an administrator to upgrade.";
        } else if (errorStringForSearch.includes('API_KEY_INVALID') || errorStringForSearch.includes('API key not valid') || error.message.includes('GEMINI_API_KEY')) {
            errorMessage = "The server's API Key is invalid. Please contact the administrator.";
        }

        return res.status(500).json({ error: errorMessage });
    }
}
