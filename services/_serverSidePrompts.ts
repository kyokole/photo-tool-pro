// services/_serverSidePrompts.ts
// This file contains prompt-building logic that should ONLY run on the server.
// It is imported by the /api/gemini.ts serverless function.

import type { Settings, FashionStudioSettings, Scene, FootballStudioSettings } from '../types';

// --- PROMPTS FOR ID PHOTO TOOL ---
export const buildIdPhotoPrompt = (settings: Settings): string => {
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

// --- PROMPTS FOR HEADSHOT GENERATOR ---
export const buildHeadshotPrompt = (stylePrompt: string) => `
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

// --- PROMPTS FOR RESTORATION TOOL ---
export { INITIAL_CLEAN_PROMPT, ADVANCED_RESTORATION_PROMPT, COLORIZATION_PROMPT } from '../constants';


// --- PROMPT FOR FASHION STUDIO ---
export const buildFashionStudioPrompt = (settings: FashionStudioSettings) => {
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

// --- PROMPT FOR FOUR SEASONS STUDIO ---
export const buildFourSeasonsPrompt = (scene: Scene, season: string, aspectRatio: string, customDescription: string) => {
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

// --- PROMPTS FOR PROMPT ANALYZER ---
export const BASE_PROMPT_INSTRUCTION = `You are a world-class expert in reverse-engineering images into prompts for generative AI. Your sole task is to analyze the provided image with microscopic detail and generate a prompt that can be used by an advanced AI image generator to reconstruct the original image with near-perfect, 1:1 fidelity. Your output MUST be a single, long, cohesive paragraph of descriptive phrases separated by commas. Do not use any other formatting. Your entire response must be ONLY the prompt.`;
export const FACE_LOCK_INSTRUCTION = `**SPECIAL INSTRUCTION: FACE LOCK ACTIVE** For the **Facial Description** step, your task changes. Instead of creating a similar face, you must describe the provided face with 100% accuracy to ensure the AI reconstructs the *exact same person*. Detail the unique shape of their eyes, nose, lips, jawline, and chin with extreme precision. The goal is to retain the person's identity perfectly.`;


// --- PROMPTS FOR FOOTBALL STUDIO ---
export const buildFootballIdolPrompt = (settings: FootballStudioSettings) => {
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

export const buildFootballOutfitPrompt = (settings: FootballStudioSettings) => {
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

// --- PROMPTS FOR CREATIVE STUDIO ---
export const createFinalPrompt = (userRequest: string, hasIdentityImages: boolean, isCouple: boolean = false): string => {
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

export const buildImageVariationPrompt = (
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
