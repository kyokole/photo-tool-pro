// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
// It has been made self-contained to prevent Vercel bundling issues.

import { GoogleGenAI, Modality, Part } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// --- MERGED CONSTANTS from constants.ts ---
const INITIAL_CLEAN_PROMPT = `
Thực hiện một bước phục chế sơ bộ trên hình ảnh này. Mục tiêu chính là làm rõ các đường viền và chi tiết khuôn mặt, cân bằng lại các mảng tối và giảm độ nhòe của nền. 
QUAN TRỌNG: KHÔNG xóa hết các vết xước hoặc vết mốc. Chỉ thực hiện một lần làm sạch nhẹ nhàng để chuẩn bị cho các bước phục chế sâu hơn. Giữ lại phần lớn các khuyết điểm nhỏ để duy trì cảm giác chân thực.
`;
const ADVANCED_RESTORATION_PROMPT = `
Bạn là một chuyên gia AI phục chế ảnh cũ. Hãy tuân thủ nghiêm ngặt quy trình (pipeline) sau đây để phục chế hình ảnh được cung cấp. Ưu tiên tuyệt đối là BẢO TOÀN DANH TÍNH của người trong ảnh.

**A) QUY TRINI PHỤC CHẾ:**

1.  **Tiền xử lý hư hỏng:**
    *   **Cân bằng màu & tương phản:** Áp dụng cân bằng trắng (white balance) và điều chỉnh nhẹ tone curve.
    *   **Khử nấm/mốc & ố vàng:** Sử dụng inpainting và texture synthesis dựa trên vùng bị hỏng.
    *   **Giảm nhiễu & khối JPEG:** Dùng các thuật toán cao cấp để khử nhiễu và artifact nén JPEG.

2.  **Phục hồi cấu trúc tổng thể:**
    *   **Khử mờ (Deblur):** Áp dụng thuật toán deblur để khắc phục mờ do chuyển động hoặc lấy nét sai.
    *   **Siêu phân giải (Super-Resolution):** Tăng cường chi tiết cho hậu cảnh và trang phục.

3.  **Phục hồi gương mặt (Bảo toàn danh tính):**
    *   **QUAN TRỌNG NHẤT:** Phát hiện và căn chỉnh khuôn mặt. Sử dụng các mô hình phục hồi khuôn mặt chất lượng cao với cường độ vừa phải để tránh hiệu ứng "mặt búp bê", mất tự nhiên.
    *   **KHÓA DANH TÍNH:** Khuôn mặt sau khi phục chế PHẢI là của cùng một người. Không thay đổi cấu trúc khuôn mặt.

4.  **Inpaint vết rách/xước:**
    *   Sử dụng inpainting nhận biết ngữ cảnh (context-aware) để lấp các vết rách/xước còn lại.

5.  **Tinh chỉnh cuối cùng:**
    *   **Làm sắc nét có chọn lọc:** Chỉ làm sắc nét các chi tiết quan trọng: mắt, lông mi, viền môi.
    *   **Tăng tương phản vi mô (Micro-contrast):** Tăng nhẹ tương phản ở các vùng cấu trúc mặt.
    *   **Thêm nhiễu hạt (Grain):** Nếu ảnh trông quá "sạch" và giả, hãy thêm một lớp nhiễu hạt phim rất nhẹ để tạo cảm giác chân thực, cổ điển.

**THỨ TỰ THỰC HIỆN:** Tuân thủ nghiêm ngặt thứ tự sau: Giảm nhiễu → Khử mờ → Siêu phân giải nền → Phục hồi mặt → Inpaint → Tinh chỉnh màu/độ nét. Giữ nguyên ảnh đen trắng gốc.

Hãy áp dụng quy trình này để phục chế hình ảnh tôi đã cung cấp.
`;
const COLORIZATION_PROMPT = `
Bạn là một chuyên gia AI tô màu ảnh. Hãy tô màu cho bức ảnh đen trắng đã được phục chế mà tôi cung cấp. Mục tiêu là tạo ra một bức ảnh chân dung chất lượng cao, trông như mới được chụp trong thời đại xưa, giữ được nét cổ điển nhưng với độ trong và ấm áp. Hãy tuân thủ nghiêm ngặt các yêu cầu sau:

- **Chất lượng tổng thể:** Phục dựng ảnh gần như mới hoàn toàn, giống như một bức chân dung chụp mới từ thập niên xưa.
- **Gương mặt:** Làm cho gương mặt hai nhân vật rõ nét, tự nhiên, mắt sáng, và da mịn màng nhưng vẫn giữ được kết cấu da thật. Tuyệt đối BẢO TOÀN DANH TÍNH.
- **Màu sắc:** Áp dụng một tông màu ấm hơn (sepia tone) cho toàn bộ ảnh để tạo cảm giác cổ điển, hoài niệm.
- **Hậu cảnh và chi tiết:** Đảm bảo nền ảnh nhẵn mịn không còn vết xước. Áo, tóc, và các phụ kiện (ví dụ: khăn ren, quân phục) phải đều sắc nét, khôi phục chi tiết gần như nguyên bản.
- **Phong cách:** Kết hợp giữa nét cổ điển và sự rõ ràng, sắc nét của ảnh hiện đại.

Hãy tiến hành tô màu cho bức ảnh.
`;

// --- MERGED PROMPTS from _serverSidePrompts.ts ---
const buildIdPhotoPrompt = (settings: Settings): string => {
    let prompt = `**CRITICAL PRE-PROCESSING STEP: MENTAL PORTRAIT CROP**
Before any other edits, you MUST analyze the source image. If it is a wide shot, landscape, or contains a lot of background, your first task is to mentally crop to a standard head-and-shoulders portrait. Focus exclusively on the primary subject's head and upper torso. Discard all other scenic elements. All subsequent edits (background, clothing, etc.) will be performed ONLY on this mentally cropped portrait area. This ensures the final output is a proper portrait, not a small figure in a large frame.

Act as a professional photo editor. Your task is to perform high-quality edits on a user-provided portrait.
Follow the specific instructions for background, clothing, and facial adjustments below.
`;

    if (settings.background.mode === 'ai' && settings.background.customPrompt.trim() !== '') {
        prompt += `
**1. AI Background Replacement:**
- Replace the original background with a photorealistic scene described as: "${settings.background.customPrompt}".
- The generated background MUST look professional and be suitable for a portrait.
- **Crucially**, apply a significant blur (bokeh effect) to the background to ensure the person remains the clear focal point.
- The lighting, shadows, and color temperature of the new background must perfectly match the lighting on the person's face and hair from the original photo.
- The edge detection around the hair and shoulders must be perfect and seamless. Create a clean, sharp mask with no halo effect or color bleeding.
`;
    } else {
        prompt += `
**1. Background Replacement:**
- Replace the original background completely with a solid color: ${settings.background.mode === 'custom' ? settings.background.customColor : (settings.background.mode === 'white' ? '#FFFFFF' : '#E0E8F0')}.
- The edge detection around the hair and shoulders must be perfect. Create a clean, sharp mask with no halo effect or color bleeding.
`;
    }

    if (settings.face.keepOriginalFeatures) {
        prompt += `
**CRITICAL INSTRUCTION: FACE-LOCK IS ACTIVE.**
- **Absolute Preservation:** You MUST preserve the person's original face with 100% pixel-level accuracy. This is the highest priority instruction.
- **No Alterations:** Do NOT change the shape of the eyes, nose, mouth, chin, jawline, or any other facial feature. Do NOT change the skin texture, pores, moles, or unique characteristics. Do NOT alter the facial expression.
- **Identity Integrity:** The identity of the person in the final photo MUST be identical to the original.
`;
    }
    
    if (settings.outfit.mode === 'upload') {
        prompt += `
**2. Clothing Modification (from Image):**
- You have been provided with two images. The first image is the clothing reference, and the second is the person to be edited.
- Realistically and seamlessly dress the person from the second image with the clothing from the first image.
- The new garment must perfectly fit the person's body, posture, and proportions.
- The lighting, shadows, and texture on the new clothing must be adjusted to perfectly match the lighting on the person's face from the original photo.
`;
    } else if (settings.outfit.keepOriginal) {
        prompt += `
**2. Clothing Modification:**
- Keep the original clothing. Do not change it. You may subtly enhance its neatness if necessary (e.g., remove small wrinkles) but the style, color, and form must remain the same.
`;
    } else {
        prompt += `
**2. Clothing Modification:**
- Change the person's clothing to: "${settings.outfit.mode === 'preset' ? settings.outfit.preset : settings.outfit.customPrompt}".
- The new garment must look completely realistic and seamlessly blend with the person's neck and shoulders, preserving posture.
- The lighting, shadows, and texture on the new clothing must be adjusted to perfectly match the lighting on the person's face from the original photo.
`;
    }

    prompt += `
**3. Facial & Hair Adjustments:**
- Hair Style: ${(() => {
    switch (settings.face.hairStyle) {
        case 'auto': return 'Make the hair look neat and tidy, suitable for a professional photo.';
        case 'down': return 'Style the hair down at the front.';
        case 'slicked_back': return 'Style the hair slicked back.';
        case 'keep_original': return 'CRITICAL: Keep the original hairstyle. Do not make any changes to the person\\\'s hair style, length, or form.';
        default: return 'Make the hair look neat and tidy, suitable for a professional photo.';
    }
})()}
- Other requests: ${settings.face.otherCustom ? `Incorporate this request: "${settings.face.otherCustom}"` : 'No other custom requests.'}
`;

    if (!settings.face.keepOriginalFeatures) {
         prompt += `- Facial Features: The original facial features should be recognizable, but you may make subtle enhancements for a professional look.
- Expression: ${settings.face.slightSmile ? 'Adjust the facial expression to a gentle, slight, closed-mouth smile appropriate for a professional setting.' : 'Keep the original facial expression.'}
`;
    }
    
    if (settings.face.smoothSkin) {
        if (settings.face.keepOriginalFeatures) {
             prompt += `- Skin Retouching (Gentle Mode): With FACE-LOCK active, apply an extremely subtle skin smoothing effect. Only target minor blemishes or oily shine. It is ESSENTIAL to maintain the original, natural skin texture and pores.
`;
        } else {
            prompt += `- Skin Retouching: Apply a professional skin smoothing effect. Remove minor blemishes and oily shine, but maintain natural skin texture. The result should look clean and natural, not artificial.
`;
        }
    }

    prompt += `
**4. Final Output Composition (ABSOLUTELY CRITICAL):**
- After all edits are complete, do NOT crop the image.
- Instead, place the edited person onto a new, larger canvas.
- **This new canvas MUST have a standard portrait aspect ratio (e.g., approximately 3:4 or 2:3).**
- Fill this canvas completely with the specified background color from step 1.
- Ensure there is significant empty space (padding) around the person on all sides. This is crucial for later processing.
- **Generate ONLY the final image with padding.**
`;
    return prompt;
}
const buildHeadshotPrompt = (stylePrompt: string) => `
    Act as a professional headshot photographer and retoucher.
    Take the user-provided image and generate a new headshot based on the following style.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **Preserve Identity:** The generated person's face MUST be unmistakably the same person as in the original photo. Preserve all key facial features.
    2.  **High Quality:** The final image must be high-resolution, sharp, and photorealistic.
    3.  **Seamless Integration:** The person must blend perfectly with the new background and clothing. Lighting and shadows must be consistent.

    **Style Request:**
    "${stylePrompt}"

    Generate the final headshot.
`;
const buildFashionStudioPrompt = (settings: FashionStudioSettings) => {
    const userDescription = settings.description ? `${settings.description}. ` : '';
    const highQualityPrompt = settings.highQuality ? 'Chất lượng 4K, độ phân giải siêu cao, chi tiết cực cao. ' : '';
    const basePrompt = `GIỮ NGUYÊN GƯƠNG MẶT từ ảnh tải lên. Tỉ lệ khung: ${settings.aspectRatio}. ${highQualityPrompt}Không chữ, không logo, không viền, không watermark.`;
    
    switch (settings.category) {
        case 'female': return `Ảnh nữ doanh nhân cao cấp, phong cách ${settings.style}, bối cảnh studio sang trọng tông màu hài hoà, ánh sáng điện ảnh. ${userDescription}${basePrompt}`;
        case 'male': return `Ảnh nam doanh nhân cao cấp, phong cách ${settings.style}, bối cảnh studio sang trọng tông màu hài hoà, ánh sáng điện ảnh. ${userDescription}${basePrompt}`;
        case 'girl': return `Ảnh lookbook thời trang bé gái chuyên nghiệp, mặc trang phục ${settings.style}, bối cảnh studio hoặc ngoài trời phù hợp, ánh sáng tự nhiên. ${userDescription}${basePrompt}`;
        case 'boy': return `Ảnh lookbook thời trang bé trai chuyên nghiệp, mặc trang phục ${settings.style}, bối cảnh studio hoặc ngoài trời phù hợp, năng động. ${userDescription}${basePrompt}`;
    }
}
const buildFourSeasonsPrompt = (scene: Scene, season: string, aspectRatio: string, customDescription: string) => {
    const themeTitle = season === 'spring' ? 'mùa xuân' : season === 'summer' ? 'mùa hạ' : season === 'autumn' ? 'mùa thu' : 'mùa đông';
    return `--- HIERARCHY OF COMMANDS ---
**PRIORITY #1 (ABSOLUTE & NON-NEGOTIABLE): FACIAL IDENTITY REPLICATION**
- **Core Command:** Preserve the exact facial identity of the reference photo.
- **Feature Lock:** Lock facial features to match the reference image exactly.
- **Quality & Realism:** Ultra-detailed 8K portrait, realistic texture.

**PRIORITY #2 (SECONDARY): SCENE & STYLE**
- **Bối cảnh ${themeTitle}:** "${scene.title} - ${scene.desc}".
- **Trang phục:** Người trong ảnh phải mặc trang phục phù hợp với bối cảnh và mùa.
- **Chi tiết tùy chỉnh:** ${customDescription.trim() !== '' ? `Thêm các chi tiết sau: "${customDescription}".` : 'Không có chi tiết tùy chỉnh.'}

**PRIORITY #3 (TERTIARY): PHOTOGRAPHIC DETAILS**
- **Máy ảnh & Ống kính:** Mô phỏng ảnh chụp bằng Canon EOS R5, ống kính 85mm f/1.8.
- **Ánh sáng:** Ánh sáng điện ảnh phù hợp với mùa, hậu cảnh xóa phông (bokeh).
- **Lấy nét:** Lấy nét cực sắc vào mắt.
- **Tỷ lệ khung hình:** Ảnh cuối cùng BẮT BUỘC phải có tỷ lệ ${aspectRatio}.`;
};
const BASE_PROMPT_INSTRUCTION = `You are a world-class expert in reverse-engineering images into prompts for generative AI. Your sole task is to analyze the provided image with microscopic detail and generate a prompt that can be used by an advanced AI image generator to reconstruct the original image with near-perfect, 1:1 fidelity. Your output MUST be a single, long, cohesive paragraph of descriptive phrases separated by commas. Do not use any other formatting. Your entire response must be ONLY the prompt.`;
const FACE_LOCK_INSTRUCTION = `**SPECIAL INSTRUCTION: FACE LOCK ACTIVE** For the **Facial Description** step, your task changes. Instead of creating a similar face, you must describe the provided face with 100% accuracy to ensure the AI reconstructs the *exact same person*. Detail the unique shape of their eyes, nose, lips, jawline, and chin with extreme precision. The goal is to retain the person's identity perfectly.`;
const buildFootballIdolPrompt = (settings: FootballStudioSettings) => {
    const { category, team, player, scene, aspectRatio, customPrompt } = settings;
    const playerDescription = category === 'legendary'
        ? `a football legend inspired by ${player} affiliated with ${team}`
        : `a football player inspired by ${player} from the ${team} national team`;
    
    return `**TASK:** Generate an ultra-realistic, natural-looking photo of the user (from the provided image) standing or interacting with a football player character.
**UNBREAKABLE DIRECTIVE: USER IDENTITY PRESERVATION**
- **PRIMARY GOAL:** The user's face MUST BE AN IDENTICAL, FLAWLESS, PERFECT COPY of the face from the provided user image. This rule is absolute.
- **NON-NEGOTIABLE RULES:**
    1.  **FACE REPLICATION:** The user's face in the final output MUST BE A PIXEL-PERFECT, 1:1 REPLICA.
**INSTRUCTIONS:**
1.  **User:** The user is the person in the uploaded photo. Their face MUST be preserved.
2.  **Player Character:** Create ${playerDescription}.
3.  **Scene:** Place both in this scene: "${scene}".
4.  **Interaction:** Ensure lighting and perspective match. Both subjects should look natural.
5.  **Aesthetics:** The final image must look like a genuine photograph.
6.  **Aspect Ratio:** The final composition must be ${aspectRatio}.
${customPrompt ? `- **Custom Request:** ${customPrompt}\n` : ''}
**OUTPUT:** Generate ONLY the final image.`;
};
const buildFootballOutfitPrompt = (settings: FootballStudioSettings) => {
    const { team, player, scene, aspectRatio, style, customPrompt } = settings;
    return `**TASK:** Edit an image to create a dynamic sports marketing visual, placing a piece of clothing onto a football player.
**CRITICAL RULE - PRODUCT ACCURACY:** The product is the main subject of the provided image. You MUST render this product with 100% accuracy.
**INSTRUCTIONS:**
1.  **Product:** The product is from the provided image.
2.  **Subject:** The subject is football superstar ${player} from ${team}.
3.  **Action:** The player is performing this action: "${scene}".
4.  **Integration:** Seamlessly fit the product onto the player.
5.  **Art Style:** The final image must have a "${style}" aesthetic.
6.  **Aspect Ratio:** The final composition must be ${aspectRatio}.
${customPrompt ? `- **Custom Request:** ${customPrompt}\n` : ''}
**OUTPUT:** Generate ONLY the final image.`;
};
const createFinalPrompt = (userRequest: string, hasIdentityImages: boolean, isCouple: boolean = false): string => {
    if (!hasIdentityImages) {
        return `**TASK:** Create a high-quality, artistic photograph based on the user request.\n\n**USER REQUEST (Vietnamese):** ${userRequest}`;
    }
    const identityDescription = isCouple
        ? "The FIRST image is IDENTITY_PERSON_1 (left). The SECOND image is IDENTITY_PERSON_2 (right)."
        : "The very first image provided is the IDENTITY REFERENCE image.";

    return `**UNBREAKABLE DIRECTIVE: IDENTITY PRESERVATION**
**PRIMARY GOAL:** Your single most important task is to generate an image where the face of the person is an **IDENTICAL, FLAWLESS, PERFECT COPY** of the face from the IDENTITY REFERENCE image.
**NON-NEGOTIABLE RULES:**
1.  **IDENTITY SOURCE:** ${identityDescription}
2.  **FACE REPLICATION:** The face in the final output **MUST BE A PIXEL-PERFECT, 1:1 REPLICA**. Do NOT change facial structure, features, expression, or skin texture.
3.  **USER REQUEST:** Execute the user's request below, but **ONLY** after satisfying all identity preservation rules.
---
**USER REQUEST (Vietnamese):**
${userRequest}
---
**FINAL CHECK:** Before generating, confirm your plan involves a perfect replication of the identity face.`;
};
const buildImageVariationPrompt = (
  options: { aspectRatio: string; identityLock: number; variationStrength: number; themeAnchor: string; style: string; },
  variationIndex: number
): string => {
  const { aspectRatio, style, identityLock, variationStrength, themeAnchor } = options;
  const themeDescription = themeAnchor === 'Character-appropriate' ? "a context-appropriate background, AI-selected based on their appearance" : `a basic ${themeAnchor} style`;
  const themeAnchorInstruction = themeAnchor === 'Character-appropriate' ? `Main Theme: Intelligently select a theme that fits the character.` : `Main Theme: ${themeAnchor}. Use as a general direction.`;
  const variationDetails = [
    `[Image 1] Camera: medium portrait; Lighting: soft frontal; Background: ${themeDescription} with shallow DOF.`,
    `[Image 2] Camera: 3/4 body, high angle; Lighting: side key; Background: same theme, different area; Pose: head turned.`,
    `[Image 3] Camera: tight head-and-shoulders; Lighting: backlight/rim; Background: different texture (bokeh, foliage); Pose: gentle laugh.`,
    `[Image 4] Camera: medium-wide; Lighting: dramatic contrast; Background: new sub-location; Pose: look-away candid.`
  ];
  return `Generate 1 image at ${aspectRatio} in ${style} style using the uploaded reference as the subject to preserve identity (strength = ${identityLock}/100). Variation policy: target ~${variationStrength}% visual change. ${themeAnchorInstruction} Produce ONE image with these micro-variations: ${variationDetails[variationIndex]}. General constraints: Keep hairstyle/clothing consistent. Avoid repetitive framing. Photorealistic detail. No logos/text. Return only the image.`;
};

// --- END OF MERGED CODE ---


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

                if (featureAction === 'korean_style_studio') {
                    const { subject_image, k_concept, aspect_ratio, quality, face_consistency } = formData;
                    const HIDDEN_ADDONS_SERVER = "Thần thái K-fashion hiện đại, sang trọng, dáng mềm mại, cổ tay tinh tế, Trang phục couture, Giá trị set đồ trên 2 tỷ VND, Ánh sáng điện ảnh Hàn, Độ chi tiết 8K, Giữ nguyên khuôn mặt tham chiếu";
                    const prompt = `${k_concept}. Aspect ratio ${aspect_ratio}. Image quality ${quality}. ${face_consistency ? HIDDEN_ADDONS_SERVER : ''}`;

                    const userRequest = createFinalPrompt(prompt, true);
                    const imagePart = base64ToPart(subject_image);
                    
                    const promises = Array(numImages).fill(0).map(() => models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [imagePart, { text: userRequest }] },
                        config: { responseModalities: [Modality.IMAGE] }
                    }));
                    
                    const results = await Promise.allSettled(promises);
                    const images = results.map(r => r.status === 'fulfilled' ? r.value.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data : null).filter(Boolean);

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

                return res.status(400).json({ error: `Tính năng '${featureAction}' chưa được triển khai trên backend.` });
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
