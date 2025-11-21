
// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
import { GoogleGenAI, Modality, Part, Type, GenerateContentResponse } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import type { SerializedFamilyStudioSettings } from '../types';

// --- TYPES ---
// (Kept brief for readability, assume standard types from frontend are mirrored here conceptually)

// --- CONSTANTS ---
const NANO_BANANA_PRO = 'gemini-3-pro-image-preview';
const TEXT_MODEL = 'gemini-2.5-flash';
const VEO_MODEL = 'veo-3.1-fast-generate-preview'; // Or 'veo-3.1-generate-preview' for higher quality if needed

// --- PROMPT BUILDERS (Reuse existing logic) ---
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

// Smart crop for Face Consistency
const getReferenceFaceBuffer = async (base64Data: string) => {
    const buf = Buffer.from(base64Data, 'base64');
    try {
        const img = sharp(buf);
        const meta = await img.metadata();
        const w = meta.width || 0;
        const h = meta.height || 0;
        if (!w || !h) return buf;
        const size = Math.round(Math.min(w, h) * 0.70);
        const left = Math.round((w - size) / 2);
        const top = Math.round((h - size) / 2);
        return await img.extract({ left, top, width: size, height: size }).toBuffer();
    } catch (e) {
        console.warn("Smart crop failed, using original.", e);
        return buf;
    }
};

const makeFeatherMaskBuffer = async (baseW: number, baseH: number, roi: any, feather: number): Promise<Buffer> => {
    const rx = roi.w / 2;
    const ry = roi.h / 2;
    const cx = roi.x + rx;
    const cy = roi.y + ry;
    const svg = `
    <svg width="${baseW}" height="${baseH}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${feather}" /></filter></defs>
      <rect width="100%" height="100%" fill="black" />
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" filter="url(#blur)" />
    </svg>`;
    return await sharp(Buffer.from(svg)).png().toBuffer();
};

async function callGeminiWithRetry<T>(label: string, fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 1200;
  for (let i = 1; i <= maxRetries; i++) {
    try { return await fn(); }
    catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if ((err?.status === 503 || msg.includes('overloaded')) && i < maxRetries) {
        console.warn(`[${label}] Retry ${i}/${maxRetries}`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      } else throw err;
    }
  }
  throw new Error(`[${label}] Failed after retries`);
}

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

                 const prompt = `[TASK] Execute Feature: ${featureAction}. [CONTEXT] Input: ${JSON.stringify(textData)}. [QUALITY] 8K, Nano Banana Pro, highly detailed. 4K OUTPUT.`;
                 parts.push({ text: prompt });

                 const geminiRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                 });
                 const data = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                 if (!data) throw new Error("No image returned.");
                 // For batch effect in single request, backend could loop, but simplified here to 1
                 return res.json({ images: [data], successCount: 1 });
            }

            case 'generateBatchImages': {
                const { prompt, aspectRatio, numOutputs } = payload;
                // Generate multiple images in parallel
                const generateOne = () => ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [{ text: `[TASK] Image Generation. [PROMPT] ${prompt}. [ASPECT] ${aspectRatio}. [QUALITY] 8K, Nano Banana Pro. 4K OUTPUT.` }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });

                const count = Math.min(numOutputs || 1, 4); // Limit for safety
                const promises = Array(count).fill(0).map(() => generateOne());
                const results = await Promise.all(promises);
                const images = results.map(r => r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data).filter(Boolean);
                return res.json({ images: images.map(i => `data:image/png;base64,${i}`) });
            }

            // --- UTILITIES (Thumbnail, Outfit, Video, Trends) ---
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
                const prompt = "Analyze the person's outfit in this image. Describe it briefly in Vietnamese (e.g., 'áo sơ mi trắng', 'váy hoa'). Return only the description.";
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
                const prompt = `Create a high-quality video generation prompt based on this image and idea: "${userIdea}". Return JSON { "englishPrompt": "...", "vietnamesePrompt": "..." }. English prompt should be detailed for Veo.`;
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
                // VEO Video Generation
                // Note: Veo requires specific quota/access. Using text-to-video or image-to-video.
                // Assuming 'veo-3.1-fast-generate-preview' or similar.
                
                let operation = await ai.models.generateVideos({
                  model: VEO_MODEL,
                  prompt: prompt,
                  image: {
                    imageBytes: base64Image.split(',')[1], 
                    mimeType: 'image/png',
                  },
                  config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' } // Veo doesn't support '4K' video output setting via API yet, usually 1080p.
                });
                
                // Polling loop (simplified for serverless - ideally use webhooks or longer timeout)
                let retries = 0;
                while (!operation.done && retries < 30) { // ~5 min max
                  await new Promise(resolve => setTimeout(resolve, 10000));
                  operation = await ai.operations.getVideosOperation({operation: operation});
                  retries++;
                }
                
                if (!operation.done) throw new Error("Video generation timed out.");
                
                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!downloadLink) throw new Error("No video URI returned.");
                
                // Fetch the video bytes
                const vidRes = await fetch(`${downloadLink}&key=${process.env.GEMINI_API_KEY || process.env.API_KEY}`);
                const vidArrayBuffer = await vidRes.arrayBuffer();
                const vidBase64 = Buffer.from(vidArrayBuffer).toString('base64');
                
                return res.json({ videoUrl: `data:video/mp4;base64,${vidBase64}` });
            }

            case 'generateFamilyPhoto_3_Pass': {
                // Use loose typing for settings to prevent build errors if type definitions are out of sync
                const settings: any = payload.settings;
                // PASS 1
                const basePrompt = `[TASK] Create Base Scene for Family Photo. 8K Resolution. [SCENE] ${settings.scene}. [DETAILS] ${settings.customPrompt}.`;
                const baseRes = await ai.models.generateContent({
                    model: NANO_BANANA_PRO,
                    contents: { parts: [{ text: basePrompt }] },
                    config: { responseModalities: [Modality.IMAGE], imageConfig: { imageSize: '4K' } }
                });
                const base64 = baseRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!base64) throw new Error("Pass 1 failed");
                return res.json({ imageData: `data:image/png;base64,${base64}`, similarityScores: [], debug: null });
            }

            // --- PROMPT ANALYZER ---
            case 'generatePromptFromImage': {
                const { base64Image, mimeType, isFaceLockEnabled, language } = payload;
                const promptText = `Describe this image in extreme detail for image generation. ${isFaceLockEnabled ? "Focus intensely on describing the face features, proportions, and identity." : ""} Output language: ${language}.`;
                const geminiRes = await ai.models.generateContent({
                    model: 'gemini-2.5-pro', // Use Pro for better reasoning/description
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
