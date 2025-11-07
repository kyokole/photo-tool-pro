// services/creativeStudioService.ts
import { GoogleGenAI, Modality, GenerateContentResponse, Part } from "@google/genai";
import { FeatureAction } from "../types";
import { HIDDEN_ADDONS, K_CONCEPTS } from '../constants/creativeStudioConstants';
import i18n from '../i18n';

const getImageEditingModel = () => {
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    if (!process.env.VITE_GEMINI_API_KEY) throw new Error("API_KEY_INVALID");
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    return new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY }).models;
};

const getTextModel = () => {
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    if (!process.env.VITE_GEMINI_API_KEY) throw new Error("API_KEY_INVALID");
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    return new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY }).models;
};


// --- START: LOGIC FOR IMAGE VARIATION ---
interface ImageVariationOptions {
  aspectRatio: string;
  identityLock: number;
  variationStrength: number;
  themeAnchor: string;
  style: string;
}

function getImageVariationPromptTemplate(
  options: ImageVariationOptions,
  variationIndex: number
): string {
  const { aspectRatio, style, identityLock, variationStrength, themeAnchor } = options;

  const themeDescription = themeAnchor === 'Character-appropriate'
    ? "một bối cảnh phù hợp theo ngữ cảnh với chủ thể, do AI lựa chọn dựa trên ngoại hình và trang phục của họ"
    : `phong cách cơ bản ${themeAnchor}`;

  const themeAnchorInstruction = themeAnchor === 'Character-appropriate'
    ? `Chủ đề chính: Lựa chọn một cách thông minh một chủ đề phù hợp với nhân vật và bối cảnh của ảnh tham chiếu.`
    : `Chủ đề chính: ${themeAnchor}. Chỉ sử dụng nó như một định hướng chung.`;

  const variationDetails = [
    `[Image 1]
- Camera: medium portrait, eye-level; mild smile.
- Lighting: soft frontal key + gentle fill; neutral white balance.
- Background: ${themeDescription} with shallow depth of field.
- Color grade: neutral, clean skin tones.
- Pose: facing camera, relaxed shoulders.
- Wardrobe: keep as in reference (no major change).`,
    `[Image 2]
- Camera: 3/4 body; slight high angle; step back for more environment.
- Lighting: side key from camera-left; subtle rim from right; warmer WB.
- Background: same theme but different area or backdrop elements (e.g., plants vs wall), add a simple prop (chair/handrail) if natural.
- Color grade: warm cinematic.
- Pose: head turned ~15°, weighted on one leg; hands natural.
- Accessory tweak: small earring/bracelet (if appropriate), subtle scarf or hair tuck. No logos/text.`,
    `[Image 3]
- Camera: tight head-and-shoulders; slight low angle for variation.
- Lighting: backlight/rim emphasizing hair contours; softer key from front.
- Background: different texture or depth (e.g., bokeh lights, foliage, curtain), clearly distinct from Image 1–2.
- Color grade: cooler/teal tint or soft pastel filmic.
- Pose: gentle laugh or lips parted slightly; eyes toward camera.
- Composition: off-center rule-of-thirds.`,
    `[Image 4]
- Camera: medium-wide; include more context; tilt or dutch angle <= 5° allowed.
- Lighting: directional, dramatic contrast; golden-hour or window-light feel.
- Background: new sub-location or backdrop pattern; add motion hint (wind in hair, moving curtain) when fitting.
- Color grade: vivid pop or rich contrast.
- Pose: look-away candid or profile 30–45°; hand adjusting hair or garment.`
  ];

  return `Generate 1 image at ${aspectRatio} in ${style} style using the uploaded reference as the subject to preserve identity (strength = ${identityLock}/100).

Variation policy: target ~${variationStrength}% visual change. Keep subject identity consistent while changing composition, camera, lighting, background, and color grading as specified below.

${themeAnchorInstruction}

Produce ONE image with the following DELIBERATE micro-variations:
${variationDetails[variationIndex]}

General constraints:
- Keep hairstyle and clothing consistent with the reference overall; only allow tiny accessory tweaks.
- Avoid repetitive framing.
- Keep the subject flattering and in focus; background can be blurred if needed.
- Output photorealistic detail unless style demands otherwise.
- Do NOT add brand logos or readable text.
- Keep faces natural, skin realistic, hands sane, no anatomical artifacts.
Return only the single generated image.`;
}
// --- END: LOGIC FOR IMAGE VARIATION ---


const createFinalPrompt = (
    userRequest: string,
    hasIdentityImages: boolean,
    isCouple: boolean = false
): string => {

    if (!hasIdentityImages) {
        return `**TASK:** Create a high-quality, artistic photograph based on the user request.\n\n**USER REQUEST (Vietnamese):** ${userRequest}`;
    }

    const identityDescription = isCouple
        ? "The FIRST image is IDENTITY_PERSON_1 (left). The SECOND image is IDENTITY_PERSON_2 (right)."
        : "The very first image provided is the IDENTITY REFERENCE image.";

    const masterPrompt = `**UNBREAKABLE DIRECTIVE: IDENTITY PRESERVATION**

**PRIMARY GOAL:** Your single most important task is to generate an image where the face of the person is an **IDENTICAL, FLAWLESS, PERFECT COPY** of the face from the IDENTITY REFERENCE image. This rule is absolute and has zero tolerance for deviation.

**NON-NEGOTIABLE RULES:**
1.  **IDENTITY SOURCE:** ${identityDescription}
2.  **FACE REPLICATION:** The face in the final output **MUST BE A PIXEL-PERFECT, 1:1 REPLICA** of the face in the IDENTITY REFERENCE. This is not a suggestion; it is a strict command.
    -   **DO NOT CHANGE:** Facial structure, bone shape, jawline.
    -   **DO NOT CHANGE:** Eye shape, eye color, gaze, eyelashes.
    -   **DO NOT CHANGE:** Mouth shape, lips, smile, teeth, dimples.
    -   **DO NOT CHANGE:** Nose shape and size.
    -   **DO NOT CHANGE:** Skin texture, moles, freckles, or any unique marks.
    -   **DO NOT CHANGE:** The original facial expression.
3.  **REFERENCE IMAGES:** All other images are for context (pose, outfit, background) ONLY. **IT IS FORBIDDEN** to use faces from these other images.
4.  **USER REQUEST:** Execute the user's request below, but **ONLY** after satisfying all the non-negotiable rules above. If the user's request conflicts with face preservation, you **MUST prioritize face preservation**.

---
**USER REQUEST (Vietnamese):**
${userRequest}
---

**FINAL CHECK:** Before generating, confirm that your plan involves a perfect replication of the identity face. Any modification to the face is a failure.
`;
    return masterPrompt;
};

const fileToGenaiPart = async (file: File): Promise<Part> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(',')[1];
            resolve({ inlineData: { mimeType: file.type, data } });
        };
        reader.onerror = (error) => reject(error);
    });
};

const base64ToGenaiPart = (base64Data: string, mimeType: string = 'image/png'): Part => {
    return {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };
};

const callEditingModel = async (parts: Part[], numImages: number): Promise<{images: string[], successCount: number}> => {
    let textPart: Part | null = null;
    const imageParts: Part[] = [];
    for (const part of parts) {
        if ('text' in part && part.text) {
            textPart = part;
        } else {
            imageParts.push(part);
        }
    }

    if (!textPart) {
        throw new Error("A text prompt is required for image generation.");
    }
    const finalParts = [...imageParts, textPart];
    
    const models = getImageEditingModel();

    const promises: Promise<GenerateContentResponse>[] = [];
    for (let i = 0; i < numImages; i++) {
        promises.push(models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: finalParts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        }));
    }

    const results = await Promise.allSettled(promises);
    const resultImages: string[] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            const response = result.value;
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    resultImages.push(part.inlineData.data);
                    break;
                }
            }
        } else {
            console.warn("An image generation request failed:", result.reason);
        }
    });

    return { images: resultImages, successCount: resultImages.length };
};

export const generateImagesFromFeature = async (
    featureAction: FeatureAction,
    formData: Record<string, any>,
    numImages: number
): Promise<{images: string[], successCount: number}> => {

    const buildSingleSubjectPrompt = async (
        subjectImage: File | null,
        otherImageFields: {name: string, file: File | null}[],
        userRequestGenerator: (data: Record<string, any>) => string
    ): Promise<Part[]> => {
        let identityParts: Part[] = [];
        let referenceParts: Part[] = [];
        let hasIdentityImages = false;
        
        if (subjectImage) {
            hasIdentityImages = true;
            identityParts.push(await fileToGenaiPart(subjectImage));
        }
        
        for (const field of otherImageFields) {
            if (field.file) {
                referenceParts.push(await fileToGenaiPart(field.file));
            }
        }

        let userRequest = userRequestGenerator(formData);
        const finalPrompt = createFinalPrompt(userRequest, hasIdentityImages);

        const finalParts: Part[] = [
            ...identityParts,
            ...referenceParts,
            { text: finalPrompt }
        ];

        return finalParts;
    };


    switch (featureAction) {
        case FeatureAction.KOREAN_STYLE_STUDIO: {
            const { subject_image, k_concept, aspect_ratio, quality, face_consistency } = formData;
            const prompt = `${k_concept}. Aspect ratio ${aspect_ratio}. Image quality ${quality}. ${face_consistency ? HIDDEN_ADDONS : ''}`;
             const parts = await buildSingleSubjectPrompt(
                subject_image,
                [],
                () => prompt
             );
             return callEditingModel(parts, numImages);
        }

        case FeatureAction.IMAGE_VARIATION_GENERATOR: {
            const {
                reference_image,
                aspectRatio,
                identityLock,
                variationStrength,
                themeAnchor: themeAnchorKey,
                style: styleKey
            } = formData;

            if (!reference_image) {
                throw new Error("Reference image is required for image variation.");
            }
            
            const themeMap: Record<string, string> = {
                'imageVariation.options.theme.character': 'Character-appropriate',
                'imageVariation.options.theme.classic': 'Classic portrait',
                'imageVariation.options.theme.studio': 'Studio clean',
                'imageVariation.options.theme.outdoor': 'Outdoor natural',
                'imageVariation.options.theme.cozy': 'Cozy indoor',
                'imageVariation.options.theme.urban': 'Urban street',
                'imageVariation.options.theme.fashion': 'Elegant fashion',
                'imageVariation.options.theme.garden': 'Garden/greenery',
                'imageVariation.options.theme.cafe': 'Café daylight',
                'imageVariation.options.theme.beach': 'Beach sunset',
                'imageVariation.options.theme.minimal': 'Minimal backdrop',
            };

            const styleMap: Record<string, string> = {
                'imageVariation.options.style.photorealistic': 'Photorealistic',
                'imageVariation.options.style.cinematic': 'Cinematic',
                'imageVariation.options.style.editorial': 'Editorial',
                'imageVariation.options.style.minimal': 'Minimal Pastel',
                'imageVariation.options.style.vivid': 'Vivid Pop',
            };

            const imagePart = await fileToGenaiPart(reference_image);
            const models = getImageEditingModel();

            const generationPromises = Array.from({ length: 4 }, (_, i) => {
                const optionsForPrompt: ImageVariationOptions = {
                    aspectRatio: aspectRatio || '4:5',
                    identityLock: identityLock ?? 80,
                    variationStrength: variationStrength ?? 25,
                    themeAnchor: themeMap[themeAnchorKey] || 'Character-appropriate',
                    style: styleMap[styleKey] || 'Photorealistic',
                };

                const prompt = getImageVariationPromptTemplate(optionsForPrompt, i);
                const textPart = { text: prompt };
            
                return models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [imagePart, textPart] },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });
            });

            const responses = await Promise.all(generationPromises);

            const resultImages: string[] = responses.map((response, index) => {
                const part = response.candidates?.[0]?.content?.parts?.[0];
                if (part?.inlineData) {
                    return part.inlineData.data;
                }
                console.error(`Image generation failed for variation ${index + 1}. No image data returned.`);
                return null;
            }).filter((img): img is string => img !== null);
            
            return { images: resultImages, successCount: resultImages.length };
        }

        case FeatureAction.PRODUCT_PHOTO:
        case FeatureAction.TRY_ON_OUTFIT:
            {
                const { subject_image, product_image, outfit_image } = formData;
                
                const parts = await buildSingleSubjectPrompt(
                    subject_image,
                    [
                        { name: 'product_image', file: product_image },
                        { name: 'outfit_image', file: outfit_image }
                    ],
                    (data) => {
                        if (featureAction === FeatureAction.PRODUCT_PHOTO) {
                             return `Tạo ảnh quảng cáo chuyên nghiệp với chủ thể đang tương tác với sản phẩm từ ảnh tham chiếu.
KHUNG HÌNH: ${data.frame_style}.
CHI TIẾT: ${data.prompt_detail || 'biểu cảm tự nhiên, ánh sáng studio chuyên nghiệp'}.`;
                        } else { // TRY_ON_OUTFIT
                            return `Thực hiện thử đồ ảo. Mặc cho chủ thể bộ trang phục từ ảnh tham chiếu.
                            KHUNG HÌNH: ${data.frame_style}.
                            BỐI CẢNH & CHI TIẾT: ${data.prompt_detail || 'đứng trong studio'}.`;
                        }
                    }
                );
                return callEditingModel(parts, numImages);
            }

        case FeatureAction.PLACE_IN_SCENE:
        case FeatureAction.BIRTHDAY_PHOTO:
        case FeatureAction.HOT_TREND_PHOTO:
        case FeatureAction.CREATE_ALBUM:
            {
                const { subject_image } = formData;
                if (!subject_image) return { images: [], successCount: 0 };
                
                let generationItems: {prompt: string, image?: File}[] = [];
                if(featureAction === FeatureAction.PLACE_IN_SCENE) {
                    (formData.background_options || []).forEach((bg: string) => generationItems.push({ prompt: bg }));
                    if (formData.custom_background_prompt) generationItems.push({ prompt: formData.custom_background_prompt });
                    if (formData.background_image) generationItems.push({ prompt: 'custom background', image: formData.background_image });
                } else if (featureAction === FeatureAction.BIRTHDAY_PHOTO) {
                     (formData.birthday_scenes || []).forEach((scene: string) => generationItems.push({ prompt: scene }));
                } else if (featureAction === FeatureAction.HOT_TREND_PHOTO) {
                     (formData.selected_trends || []).forEach((trend: string) => generationItems.push({ prompt: trend }));
                } else if (featureAction === FeatureAction.CREATE_ALBUM) {
                    const { poses = [], backgrounds = [] } = formData;
                    poses.forEach((pose: string) => {
                        backgrounds.forEach((bg: string) => {
                            generationItems.push({ prompt: `Tư thế: ${pose}, Bối cảnh: ${bg}` });
                        });
                    });
                }
                
                if (generationItems.length === 0) return { images: [], successCount: 0 };

                const generationTasks: Promise<{images: string[], successCount: number}>[] = [];

                for (const item of generationItems) {
                    const task = async () => {
                        const parts = await buildSingleSubjectPrompt(
                            subject_image,
                            [{ name: 'background_image', file: item.image }],
                            (data) => {
                                 const bgClause = item.image ? "Ghép chủ thể một cách tự nhiên vào ảnh nền được cung cấp." : `Ghép chủ thể một cách tự nhiên vào bối cảnh sau: "${item.prompt}".`;
                                 return `${bgClause} KHUNG HÌNH: ${data.frame_style}. PHONG CÁCH: Ánh sáng và bố cục chân thực. Tư thế cuối cùng phải mới và tự nhiên với bối cảnh.`;
                            }
                        );
                        return callEditingModel(parts, 1);
                    };
                    generationTasks.push(task());
                }

                const results = await Promise.all(generationTasks);
                return { 
                    images: results.flatMap(res => res.images), 
                    successCount: results.reduce((sum, res) => sum + res.successCount, 0) 
                };
            }

        case FeatureAction.COUPLE_COMPOSE: {
            const { person_left_image, person_right_image, custom_background } = formData;
            
            const userRequest = `**NHIỆM VỤ: Ghép ảnh cặp đôi.**
BỐI CẢNH: ${custom_background ? 'sử dụng ảnh nền được cung cấp.' : `bối cảnh chân thực được mô tả là: "${formData.couple_background}".`}
HÀNH ĐỘNG: Bố cục cuối cùng phải thể hiện được cảm giác "${formData.affection_action}".
PHONG CÁCH: "${formData.aesthetic_style}".
KHUNG HÌNH: "${formData.frame_style}".
HƯỚNG DẪN: Sắp xếp người 1 và người 2 một cách tự nhiên trong bối cảnh mới. Điều chỉnh ánh sáng và bóng đổ trên người để khớp với nền một cách liền mạch.`;

            const finalPrompt = createFinalPrompt(userRequest, true, true);
            
            const parts: Part[] = [];
            parts.push(await fileToGenaiPart(person_left_image));
            parts.push(await fileToGenaiPart(person_right_image));

            if (custom_background) {
                parts.push(await fileToGenaiPart(custom_background));
            }
            
            parts.push({ text: finalPrompt });
            return callEditingModel(parts, numImages);
        }

        case FeatureAction.FASHION_STUDIO:
        case FeatureAction.CHANGE_HAIRSTYLE: {
            const { subject_image, wardrobe_refs, custom_bg } = formData;
            
            const parts = await buildSingleSubjectPrompt(
                subject_image,
                [
                    { name: 'wardrobe_refs', file: wardrobe_refs },
                    { name: 'custom_bg', file: custom_bg }
                ],
                (data) => {
                    if (featureAction === FeatureAction.FASHION_STUDIO) {
                        return `Tạo một bức ảnh thời trang cao cấp của chủ thể.
                        PHONG CÁCH: ${data.style_level}.
                        TRANG PHỤC: ${(data.wardrobe || []).join(', ')}.
                        TƯ THẾ: ${data.pose_style}. Tư thế cuối cùng phải mới và lấy cảm hứng từ đây, không phải bản sao trực tiếp.
                        BỐI CẢNH: ${data.sexy_background}.
                        ÁNH SÁNG: ${data.lighting}.
                        KHUNG HÌNH: ${data.frame_style}.`;
                    } else { // CHANGE_HAIRSTYLE
                        return `Tạo một bức chân dung mới của chủ thể với một kiểu tóc khác.
                        KIỂU TÓC MỚI: ${data.hairstyle}.
                        MÀU TÓC: ${data.hair_color}.
                        ĐỘ DÀI TÓC: ${data.hair_length}.
                        HƯỚNG DẪN VỀ TƯ THẾ (QUAN TRỌNG): Mục tiêu là tạo ra bức chân dung tự nhiên nhất với kiểu tóc mới. Sử dụng tư thế ban đầu làm cơ sở, nhưng có thể điều chỉnh nhẹ góc đầu và tư thế vai để phù hợp hơn với mái tóc mới. Hình ảnh cuối cùng phải trông giống như một bức chân dung tự nhiên, có bố cục tốt, không chỉ là một bản chỉnh sửa tĩnh.
                        HƯỚNG DẪN: Kết quả phải chân thực. Hòa trộn mái tóc mới một cách liền mạch.`;
                    }
                }
            );
            return callEditingModel(parts, numImages);
        }

        case FeatureAction.EXTRACT_OUTFIT: {
            const { subject_image } = formData;
            
            const extractionPrompt = `Tách riêng bộ trang phục hoàn chỉnh mà người trong ảnh đang mặc. Loại bỏ người và nền. Đầu ra phải là một hình ảnh sạch của trang phục trên nền trắng tinh, giữ nguyên hình dạng và chi tiết một cách chính xác. Không có bóng đổ.`;
            
            const extractionParts: Part[] = [
                await fileToGenaiPart(subject_image),
                { text: extractionPrompt }
            ];

            const extractionResult = await callEditingModel(extractionParts, 1);

            if (extractionResult.successCount === 0 || !extractionResult.images[0]) {
                throw new Error("Không thể tách được trang phục từ ảnh gốc. Vui lòng thử ảnh khác rõ nét hơn.");
            }
            const extractedOutfitBase64 = extractionResult.images[0];
            
            const productPhotoPrompt = `Từ hình ảnh trang phục được cung cấp, hãy tạo một bức ảnh sản phẩm thương mại điện tử chuyên nghiệp. Trình bày trang phục theo kiểu 'flat lay' trên nền trung tính, sạch sẽ hoặc trên một 'ma-nơ-canh tàng hình'. Ánh sáng phải mềm mại và chất lượng studio, làm nổi bật kết cấu và chi tiết vải. Hình ảnh cuối cùng phải sạch sẽ, hấp dẫn và sẵn sàng để sử dụng cho mục đích thương mại.`;

            const productPhotoParts: Part[] = [
                base64ToGenaiPart(extractedOutfitBase64),
                { text: productPhotoPrompt }
            ];
            
            return callEditingModel(productPhotoParts, 1);
        }

        case FeatureAction.CREATIVE_COMPOSITE: {
            const { main_subject, additional_components = [] } = formData;
            
            const otherImages = additional_components.map((comp: any, index: number) => ({
                name: `additional_${index}`,
                file: comp.file
            }));

            const parts = await buildSingleSubjectPrompt(
                main_subject?.file,
                otherImages,
                (data) => {
                    let mainPrompt = `Tạo một bức ảnh ghép sáng tạo.\n`;
                     if (data.main_subject?.description) {
                        mainPrompt += `MÔ TẢ CHỦ THỂ CHÍNH: ${data.main_subject.description}.\n`;
                     }
                    for(let i=0; i < (data.additional_components || []).length; i++) {
                       const comp = data.additional_components[i];
                       if (comp.file && comp.description) {
                            mainPrompt += `THÀNH PHẦN PHỤ ${i+1}: Từ một ảnh tham chiếu. Được mô tả là: "${comp.description}".\n`;
                       }
                    }
                   mainPrompt += `\nHƯỚNG DẪN GHÉP ẢNH: ${data.scene_description}`;
                   return mainPrompt;
                }
            );

            return callEditingModel(parts, numImages);
        }

        default:
            throw new Error(`Feature "${featureAction}" is not implemented.`);
    }
};

export const getHotTrends = async (): Promise<string[]> => {
    try {
        const models = getTextModel();
        const response = await models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Đóng vai một chuyên gia xu hướng mạng xã hội. Tìm kiếm trên web các xu hướng nhiếp ảnh và chỉnh sửa hình ảnh trực quan mới nhất và phổ biến nhất trên các nền tảng như TikTok, Instagram và Pinterest. Lập một danh sách gồm 25 xu hướng đa dạng và sáng tạo có thể áp dụng cho ảnh của một người. Đặt một cái tên ngắn gọn, hấp dẫn cho mỗi xu hướng bằng tiếng Việt.

Chỉ trả về một mảng JSON hợp lệ chứa các chuỗi, trong đó mỗi chuỗi là một tên xu hướng. Không bao gồm các dấu ngoặc kép markdown (\`\`\`json), giải thích hoặc bất kỳ văn bản nào khác ngoài mảng JSON.`,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        let jsonStr = response.text.trim();

        const startIndex = jsonStr.indexOf('[');
        const endIndex = jsonStr.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        } else {
             throw new Error(i18n.t('aiStudio.trends.invalidResponse'));
        }

        const trends = JSON.parse(jsonStr);
        return Array.isArray(trends) ? trends : [];
    } catch (error: any) {
        console.error("Error fetching hot trends:", error);
        if (error instanceof SyntaxError) {
             throw new Error(i18n.t('aiStudio.trends.parseError'));
        }
        throw new Error(i18n.t('aiStudio.trends.fetchError'));
    }
};


export const generateVideoPrompt = async (userIdea: string, base64Image: string): Promise<{ englishPrompt: string, vietnamesePrompt: string }> => {
    const imagePart = base64ToGenaiPart(base64Image);
    const prompt = `Based on the user's idea and the provided image, you have two tasks:
1.  Generate a short, creative, and visually descriptive prompt in **English** for an AI video generation model (like VEO). This prompt should describe a dynamic scene that starts with the image and evolves based on the idea.
2.  Translate the English prompt you just created into **Vietnamese**.

User idea (Vietnamese): "${userIdea}"
    
Your response MUST be a valid JSON object with two keys: "englishPrompt" and "vietnamesePrompt". Do not include any other text, markdown, or explanations.
Example:
{
  "englishPrompt": "An elegant East Asian woman in a chic tweed jacket...",
  "vietnamesePrompt": "Một người phụ nữ Đông Á thanh lịch trong chiếc áo khoác vải tweed sang trọng..."
}`;

    const models = getTextModel();
    const response = await models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: 'application/json'
        }
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    } else if (jsonStr.startsWith("```")) {
         jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
    }
    
    const prompts = JSON.parse(jsonStr);
    if (!prompts.englishPrompt || !prompts.vietnamesePrompt) {
        throw new Error("AI did not return the expected prompt structure.");
    }

    return prompts;
};

export const generateVideoFromImage = async (
    base64Image: string,
    prompt: string,
    setProgress: (message: string) => void
): Promise<string> => {
    setProgress('Đang khởi tạo tác vụ...');
    
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    if (!process.env.VITE_GEMINI_API_KEY) throw new Error("API_KEY_INVALID");
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    const videoAi = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

    const imagePayload = {
        imageBytes: base64Image,
        mimeType: 'image/png',
    };

    let operation = await videoAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: imagePayload,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });
    setProgress('Đã gửi yêu cầu tạo video. Quá trình này có thể mất vài phút...');
    
    let checks = 0;
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        checks++;
        setProgress(`Đang tạo video... (lần kiểm tra thứ ${checks})`);
        operation = await videoAi.operations.getVideosOperation({ operation: operation });
    }

    setProgress('Video đã tạo xong! Đang tải xuống...');

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Không tìm thấy link tải video trong phản hồi của API.");
    }
    
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    const response = await fetch(`${downloadLink}&key=${process.env.VITE_GEMINI_API_KEY}`);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to download video:", errorBody);
        throw new Error(`Tải video thất bại: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};