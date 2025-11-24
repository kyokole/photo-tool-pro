
// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
import { GoogleGenAI, Modality, Part, Type, GenerateContentResponse } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';

// --- CONSTANTS ---
const NANO_BANANA_PRO = 'gemini-3-pro-image-preview';
const TEXT_MODEL = 'gemini-2.5-flash';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';

// --- HELPER: FRAME STYLE MAPPER ---
const getFramingInstruction = (style: string): string => {
    switch (style) {
        case 'full_body': return "Full Body Shot. Show the subject from head to toe. Shoes must be visible.";
        case 'half_body': return "Medium Shot. Frame from the waist up. **CRITICAL: DO NOT SHOW LEGS. DO NOT SHOW SHOES.** Focus on the upper body.";
        case 'shoulder_portrait': return "Close-up Portrait. Frame from the shoulders up. Focus intensely on facial details.";
        case 'cinematic_wide': return "Wide Angle Shot. Environmental portrait showing the subject in a broad scene.";
        default: return "Standard portrait framing.";
    }
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

    prompt += `**3. Mặt & Tóc:** Kiểu tóc: ${settings.face.hairStyle}. ${settings.face.otherCustom}. `;
    if (!settings.face.keepOriginalFeatures) prompt += `Tinh chỉnh nhẹ cho chuyên nghiệp. `;
    if (settings.face.smoothSkin) prompt += `Làm mịn da tự nhiên (giữ kết cấu). `;
    
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

// --- INIT ---
try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
            admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountJson)) });
        }
    }
} catch (error: any) { console.error("Firebase Init Error:", error.message); }

// --- UTILS ---
const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// --- HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { action, payload } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    const ai = getAi();

    try {
        switch (action) {
            // --- ID PHOTO & HEADSHOT ---
            case 'generateIdPhoto': {
                 const { originalImage, settings } = payload;
                 const prompt = buildIdPhotoPrompt(settings);
                 const parts = [{ inlineData: { data: originalImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                 const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                 });
                 const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                 return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            case 'generateHeadshot': {
                 const { imagePart, prompt: p } = payload;
                 const prompt = `[TASK] Headshot. ${p}. [QUALITY] 8K, Nano Banana Pro.`;
                 const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                 });
                 const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                 return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            // --- RESTORATION ---
            case 'performRestoration':
            case 'performDocumentRestoration': {
                const { imagePart, options } = payload;
                const prompt = buildRestorationPrompt(options);
                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                 });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            // --- CREATIVE STUDIOS (Fashion, Football, Four Seasons, Beauty) ---
            case 'generateFashionPhoto': {
                const { imagePart, settings } = payload;
                const prompt = `[TASK] Fashion Photo. Category: ${settings.category}. Style: ${settings.style}. ${settings.description}. [QUALITY] 8K UHD, Nano Banana Pro. 4K Output.`;
                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            case 'generateFourSeasonsPhoto': {
                const { imagePart, scene, season, aspectRatio, customDescription } = payload;
                const prompt = `[TASK] Four Seasons Photo. Season: ${season}. Scene: ${scene.title}. ${scene.desc}. ${customDescription}. [QUALITY] 8K UHD, Nano Banana Pro. [ASPECT] ${aspectRatio}.`;
                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            case 'generateFootballPhoto': {
                const { settings } = payload;
                const prompt = `[TASK] Football Photo. Mode: ${settings.mode}. Team: ${settings.team}. Player: ${settings.player}. Scene: ${settings.scene}. Style: ${settings.style}. ${settings.customPrompt}. [QUALITY] 8K UHD, Nano Banana Pro.`;
                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [{ inlineData: { data: settings.sourceImage.base64, mimeType: settings.sourceImage.mimeType } }, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            case 'generateBeautyPhoto': {
                const { baseImage, tool, subFeature, style } = payload;
                const prompt = buildBeautyPrompt(tool, subFeature, style);
                const parts = [{ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }];
                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                return res.json({ imageData: `data:image/png;base64,${data}` });
            }

            // --- STUDIO AI & BATCH ---
            case 'generateImagesFromFeature': {
                 const { featureAction, formData, numImages } = payload;
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

                 // INSTRUCTION INJECTION FOR SPECIFIC FEATURES
                 if (featureAction === 'couple_compose') {
                     specificInstructions = `
                     [STRICT IDENTITY & GENDER PROTOCOL]
                     1. **FACE IDENTITY:** You MUST preserve the facial identity of the uploaded images. Treat them as source face textures. Do not generate generic faces.
                     2. **GENDER CONSISTENCY:** Strictly follow specified genders.
                     3. **POSITIONING:** Ensure the person from 'person_left_image' appears on the left.
                     `;
                 } else if (['try_on_outfit', 'change_hairstyle', 'korean_style_studio', 'professional_headshot', 'product_photo', 'place_in_scene'].includes(featureAction)) {
                     const framingInstr = getFramingInstruction(textData.frame_style || 'half_body');
                     specificInstructions = `
                     [STRICT IDENTITY & FRAMING PROTOCOL]
                     1. **FACE IDENTITY (HIGHEST PRIORITY):** The 'subject_image' is the source of truth. You MUST perform a "Face Swap" operation conceptually. The output face MUST be identical to the source face (eyes, nose, mouth, unique features). Do NOT create a lookalike; reproduce the exact person.
                     2. **FRAMING:** ${framingInstr}
                     3. **OUTFIT:** If feature is 'try_on_outfit', apply the 'outfit_image' to the subject's body naturally.
                     `;
                 }

                 // Enhanced Prompt for better Vietnamese handling & framing
                 const prompt = `
                 [TASK] Execute Feature: ${featureAction}.
                 [CONTEXT] Input Data: ${JSON.stringify(textData)}.
                 
                 ${specificInstructions}
                 
                 [LANGUAGE INSTRUCTION] The input data contains descriptions in VIETNAMESE. You MUST interpret them accurately. Translate contextually to English internal logic for image generation if necessary, but preserve specific cultural nuances (e.g., "Ao Dai", "Non La").
                 
                 [OUTPUT CONFIG] 
                 - Quality: 8K, Nano Banana Pro, photorealistic, highly detailed. 
                 - Aspect Ratio: ${textData.aspect_ratio || '3:4'}.
                 `;
                 parts.push({ text: prompt });

                 const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                 });
                 const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                 if (!data) throw new Error("No image returned.");
                 return res.json({ images: [data], successCount: 1 });
            }

            case 'generateBatchImages': {
                const { prompt, aspectRatio, numOutputs } = payload;
                const generateOne = () => ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [{ text: `[TASK] Image Generation. [PROMPT] ${prompt}. [ASPECT] ${aspectRatio}. [QUALITY] 8K, Nano Banana Pro. 4K OUTPUT.` }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });

                const count = Math.min(numOutputs || 1, 4);
                const promises = Array(count).fill(0).map(() => generateOne());
                const results = await Promise.all(promises);
                const images = results.map(r => r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data).filter(Boolean);
                return res.json({ images: images.map(i => `data:image/png;base64,${i}`) });
            }

            // --- UTILITIES ---
            case 'generateThumbnail': {
                 const { modelImage, refImage, inputs, ratio } = payload;
                 const parts: Part[] = [];
                 if (modelImage) parts.push({ inlineData: { data: modelImage, mimeType: 'image/jpeg' } });
                 if (refImage) parts.push({ inlineData: { data: refImage, mimeType: 'image/jpeg' } });
                 const prompt = `[TASK] Generate YouTube Thumbnail Background. [RATIO] ${ratio}. [INFO] Title: ${inputs.title}, Speaker: ${inputs.speaker}, Action: ${inputs.action}. [STYLE] Professional, High CTR, 4K.`;
                 parts.push({ text: prompt });

                 const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                 });
                 const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                 return res.json({ image: `data:image/png;base64,${data}` });
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
                const { base64Image, mimeType, newOutfitPrompt } = payload;
                const prompt = `[TASK] Edit Outfit. Change outfit to: "${newOutfitPrompt}". Preserve face, pose, and background. [QUALITY] 4K, photorealistic.`;
                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });
                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                return res.json({ imageData: `data:image/png;base64,${data}` });
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

            // --- FAMILY STUDIO (Consolidated Advanced Method) ---
            case 'generateFamilyPhoto': // Legacy name mapped to new logic
            case 'generateFamilyPhoto_3_Pass': {
                const { settings } = payload;
                const { members, scene, outfit, pose, customPrompt, rois, faceConsistency } = settings;

                const parts: Part[] = [];

                // 1. Add Member Reference Images with Text Descriptions
                if (members && Array.isArray(members)) {
                    members.forEach((m: any, index: number) => {
                        if (m.photo?.base64) {
                            // Ensure base64 is clean
                            const cleanBase64 = m.photo.base64.replace(/^data:image\/\w+;base64,/, "");
                            parts.push({
                                inlineData: {
                                    data: cleanBase64,
                                    mimeType: m.photo.mimeType || 'image/jpeg'
                                }
                            });
                            
                            // Calculate simplified position
                            const roi = rois?.find((r: any) => r.memberId === m.id);
                            let posDesc = "";
                            if (roi) {
                                const center = roi.xPct + (roi.wPct / 2);
                                posDesc = center < 0.33 ? "on the left" : center > 0.66 ? "on the right" : "in the center";
                            }

                            parts.push({
                                text: `[REFERENCE_MEMBER_${index + 1}] ID: ${m.id}. Attributes: ${m.age}, ${m.bodyDescription || ''}. Preferred Outfit: ${m.outfit || outfit}. Pose: ${m.pose || 'Natural'}. Position: ${posDesc}.`
                            });
                        }
                    });
                }

                // 2. Construct the Advanced Multimodal Prompt with IDENTITY ANCHORING
                // NEW: Enhanced logic for STRICT identity preservation
                let identityInstruction = "";
                if (faceConsistency) {
                    identityInstruction = `
                    [HYPER-REALISTIC IDENTITY PRESERVATION PROTOCOL]
                    You are a specialized forensic artist. Your HIGHEST PRIORITY is to transfer the exact facial features from the [REFERENCE_MEMBER] images to the final composition.
                    
                    **MANDATORY RULES:**
                    1. **DIRECT COPY (Texture Mapping):** Treat the faces in the reference images as "Texture Maps". You must apply these exact facial pixels (eyes, nose, mouth, bone structure) onto the generated bodies.
                    2. **NO HALLUCINATION:** Do not generate a "generic Asian person" or a "generic 35 year old woman". It MUST look EXACTLY like the specific individual in [REFERENCE_MEMBER_1], [REFERENCE_MEMBER_2], etc.
                    3. **IGNORE TEXT BIAS:** Even if the text description says "mother", do not use your internal training of a "generic mother face". Use the REFERENCE IMAGE PIXELS. The text "mother" describes the role, NOT the face.
                    4. **LIGHTING ADAPTATION:** Only adjust the lighting and skin tone to match the scene. Do NOT change the bone structure, eye shape, nose shape, or mouth.
                    5. **AGE FIDELITY:** Preserve the exact age markers (wrinkles, skin texture) from the source photo. Do not artificially smooth or "beautify" unless requested.
                    `;
                } else {
                    identityInstruction = `[CREATIVE INTERPRETATION] Create characters inspired by the reference images, but prioritize artistic style and idealized beauty over exact likeness.`;
                }

                const prompt = `
                [TASK] Create a hyper-realistic family photo compositing the specific people provided above.
                
                **CONTEXT TRANSLATION:**
                The user input below is in VIETNAMESE. Please interpret the context (mood, setting) correctly but DO NOT let the Vietnamese text descriptions override the visual identity of the reference images.
                
                [SCENE] ${scene}
                [GLOBAL OUTFIT STYLE] ${outfit}
                [GLOBAL POSE] ${pose}
                [ADDITIONAL DETAILS] ${customPrompt}
                
                ${identityInstruction}
                
                [COMPOSITION INSTRUCTIONS]
                1. Arrange the members naturally in the scene based on their designated positions.
                2. Interaction: Ensure natural interaction (eye contact, touching, lighting consistency) so they look like they are truly in the same space.
                3. Quality: 8K resolution, photorealistic texture, perfect eyes, skin texture preservation.
                
                Generate the final composite image now.
                `;

                parts.push({ text: prompt });

                const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: { imageSize: '4K' } // Explicitly requesting 4K for detail
                    }
                });

                const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!data) throw new Error("Failed to generate image.");
                
                // Returning debug info as null since we are doing single-pass advanced inference
                return res.json({ imageData: `data:image/png;base64,${data}`, similarityScores: [], debug: null });
            }

            case 'generatePromptFromImage': {
                const { base64Image, mimeType, isFaceLockEnabled, language } = payload;
                const promptText = `Describe this image in extreme detail for image generation. ${isFaceLockEnabled ? "Focus intensely on describing the face features, proportions, and identity." : ""} Output language: ${language}.`;
                const geminiRes = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
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
