import { GoogleGenAI, Modality, Part, GenerateContentResponse } from '@google/genai';
import type { Settings, FilePart, FashionStudioSettings, ThumbnailInputs, ThumbnailRatio, BatchAspectRatio, Scene } from '../types';
import { INITIAL_CLEAN_PROMPT, ADVANCED_RESTORATION_PROMPT, COLORIZATION_PROMPT } from '../constants';

const fileToGenerativePart = async (file: File): Promise<FilePart | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                const base64EncodedData = reader.result.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64EncodedData,
                        mimeType: file.type,
                    },
                });
            } else {
                reject(new Error("Failed to read file as string."));
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};


const buildIdPhotoPrompt = (settings: Settings): string => {
    let prompt: string;

    // --- NEW SECTION: Instruct the AI to perform a mental crop on non-portrait photos first. ---
    prompt = `
**CRITICAL PRE-PROCESSING STEP: MENTAL PORTRAIT CROP**
Before any other edits, you MUST analyze the source image. If it is a wide shot, landscape, or contains a lot of background, your first task is to mentally crop to a standard head-and-shoulders portrait. Focus exclusively on the primary subject's head and upper torso. Discard all other scenic elements. All subsequent edits (background, clothing, etc.) will be performed ONLY on this mentally cropped portrait area. This ensures the final output is a proper portrait, not a small figure in a large frame.

Act as a professional photo editor. Your task is to perform high-quality edits on a user-provided portrait.
Follow the specific instructions for background, clothing, and facial adjustments below.
`;

    // --- SECTION B: Background ---
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

    // --- SECTION C: Face Lock ---
    if (settings.face.keepOriginalFeatures) {
        prompt += `
**CRITICAL INSTRUCTION: FACE-LOCK IS ACTIVE.**
- **Absolute Preservation:** You MUST preserve the person's original face with 100% pixel-level accuracy. This is the highest priority instruction.
- **No Alterations:** Do NOT change the shape of the eyes, nose, mouth, chin, jawline, or any other facial feature. Do NOT change the skin texture, pores, moles, or unique characteristics. Do NOT alter the facial expression.
- **Read-Only Zone:** Conceptually, create a "mask" covering the entire face from the hairline to below the chin and from ear to ear. This entire area is a "read-only" zone. All other edits (clothing, background) must occur completely outside of this zone.
- **Identity Integrity:** The identity of the person in the final photo MUST be identical to the original.
`;
    }
    
    // --- SECTION D: Clothing ---
    if (settings.outfit.mode === 'upload') {
        prompt += `
**2. Clothing Modification (from Image):**
- You have been provided with two images. The first image is the clothing reference, and the second is the person to be edited.
- Realistically and seamlessly dress the person from the second image with the clothing from the first image.
- The new garment must perfectly fit the person's body, posture, and proportions.
- The lighting, shadows, and texture on the new clothing must be adjusted to perfectly match the lighting on the person's face from the original photo.
- The person's identity MUST be preserved.
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
- The person's identity must be preserved.
`;
    }

    // --- SECTION E: Face & Hair ---
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
    
    // --- SECTION F: Skin Retouching ---
    if (settings.face.smoothSkin) {
        if (settings.face.keepOriginalFeatures) {
             prompt += `- Skin Retouching (Gentle Mode): With FACE-LOCK active, apply an extremely subtle skin smoothing effect. Only target minor blemishes or oily shine on the broader areas like cheeks and forehead. It is ESSENTIAL to maintain the original, natural skin texture and pores.
`;
        } else {
            prompt += `- Skin Retouching: Apply a professional skin smoothing effect. Remove minor blemishes and oily shine, but it is important to maintain natural skin texture. The result should look clean and natural, not artificial or plastic-like.
`;
        }
    }

    // --- SECTION G: Final Output Composition (THE NEW, CRITICAL PART) ---
    prompt += `
**4. Final Output Composition (ABSOLUTELY CRITICAL):**
- After all edits are complete, do NOT crop the image.
- Instead, place the edited person onto a new, larger canvas.
- **This new canvas MUST have a standard portrait aspect ratio (e.g., approximately 3:4 or 2:3).**
- Fill this canvas completely with the specified background color from step 1.
- Ensure there is significant empty space (padding) around the person on all sides (top, bottom, left, right). This is crucial for later processing.
- **Generate ONLY the final image with padding.**
- Do NOT output any text, JSON, markdown, or any other content.
`;
    return prompt;
}

const callGeminiApiForIdPhoto = async (
    image: string, 
    prompt: string, 
    signal?: AbortSignal, 
    outfitImagePart?: FilePart
): Promise<string> => {
     if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
    }

    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    
    const imagePart: FilePart = {
        inlineData: {
            data: image.split(',')[1],
            mimeType: image.split(';')[0].split(':')[1],
        },
    };
    
    if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
    }

    const parts: Part[] = [];
    if (outfitImagePart) {
        parts.push(outfitImagePart); // Add outfit image part first
    }
    parts.push(imagePart); // Then add the person's image
    parts.push({ text: prompt });

    console.log("Generated ID Photo Prompt:", prompt);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
    }
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${imageData}`;
        }
    }
    
    const refusalText = response.text;
    if (refusalText) {
       throw new Error(`API từ chối xử lý ảnh. Lý do: ${refusalText}`);
    }
    
    throw new Error("API không trả về ảnh. Yêu cầu có thể đã bị từ chối hoặc gặp lỗi không xác định.");
}

const callGeminiApiForRestoration = async (imagePart: FilePart, prompt: string): Promise<string> => {
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

    try {
        console.log("Calling Gemini for Restoration. Prompt starts with:", prompt.substring(0, 100));
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
        
        const refusalText = response.text;
        if (refusalText) {
           throw new Error(`API từ chối xử lý ảnh. Lý do: ${refusalText}`);
        }
        
        throw new Error("API không trả về ảnh. Yêu cầu có thể đã bị từ chối vì lý do an toàn.");

    } catch (error) {
        console.error("Error calling Gemini API for restoration:", error);
        if (error instanceof Error) {
           throw new Error(`Lỗi Gemini API: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định khi gọi Gemini API.");
    }
};


export const generateIdPhoto = async (originalImage: string, settings: Settings, signal?: AbortSignal, outfitImagePart?: FilePart): Promise<string> => {
    const prompt = buildIdPhotoPrompt(settings);
    return callGeminiApiForIdPhoto(originalImage, prompt, signal, outfitImagePart);
};

export const generateHeadshot = async (imagePart: FilePart, prompt: string, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
    }
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

    const fullPrompt = `
        Act as a professional headshot photographer and retoucher.
        Take the user-provided image and generate a new headshot based on the following style.
        
        **CRITICAL INSTRUCTIONS:**
        1.  **Preserve Identity:** The generated person's face MUST be unmistakably the same person as in the original photo. Preserve all key facial features (eyes, nose, mouth, face shape).
        2.  **High Quality:** The final image must be high-resolution, sharp, and photorealistic.
        3.  **Seamless Integration:** The person must blend perfectly with the new background and clothing. Lighting and shadows must be consistent.

        **Style Request:**
        "${prompt}"

        Generate the final headshot.
    `;

    console.log("Generated Headshot Prompt:", fullPrompt);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imagePart,
                { text: fullPrompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
    }

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("No image was generated by the API for the headshot.");
}

export const generateFashionPhoto = async (imagePart: FilePart, settings: FashionStudioSettings, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

    const userDescription = settings.description ? `${settings.description}. ` : '';
    const highQualityPrompt = settings.highQuality ? 'Chất lượng 4K, độ phân giải siêu cao, chi tiết cực cao. ' : '';
    const basePrompt = `GIỮ NGUYÊN GƯƠNG MẶT từ ảnh tải lên (không thay đổi khuôn mặt, không bóp méo). Tỉ lệ khung: ${settings.aspectRatio}. ${highQualityPrompt}Không chữ, không logo, không viền, không watermark.`;
    let prompt = '';

    switch (settings.category) {
        case 'female':
            prompt = `Ảnh nữ doanh nhân cao cấp, phong cách ${settings.style}, bối cảnh studio sang trọng tông màu hài hoà, ánh sáng điện ảnh, chất liệu vải hi-end, đường may tinh xảo, dáng đứng tự tin quyền lực. ${userDescription}${basePrompt}`;
            break;
        case 'male':
            prompt = `Ảnh nam doanh nhân cao cấp, phong cách ${settings.style}, bối cảnh studio sang trọng tông màu hài hoà, ánh sáng điện ảnh, chất liệu vải hi-end, đường may tinh xảo, dáng đứng tự tin quyền lực. ${userDescription}${basePrompt}`;
            break;
        case 'girl':
            prompt = `Ảnh lookbook thời trang bé gái chuyên nghiệp, mặc trang phục ${settings.style}, bối cảnh studio hoặc ngoài trời phù hợp, ánh sáng tự nhiên trong trẻo, phong cách dễ thương. ${userDescription}${basePrompt}`;
            break;
        case 'boy':
            prompt = `Ảnh lookbook thời trang bé trai chuyên nghiệp, mặc trang phục ${settings.style}, bối cảnh studio hoặc ngoài trời phù hợp, năng động, phong cách, cực chất. ${userDescription}${basePrompt}`;
            break;
    }
    
    console.log("Generated Fashion Studio Prompt:", prompt);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imagePart,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    const refusalText = response.text;
    if (refusalText) {
        throw new Error(`API từ chối xử lý ảnh. Lý do: ${refusalText}`);
    }

    throw new Error("Không thể tạo ảnh. Phản hồi không chứa ảnh. Vui lòng thử lại với ảnh hoặc phong cách khác.");
};

export const generateFourSeasonsPhoto = async (
    imagePart: FilePart,
    scene: Scene,
    season: string,
    aspectRatio: string,
    customDescription: string
): Promise<string> => {
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    const themeTitle = season === 'spring' ? 'mùa xuân' : season === 'summer' ? 'mùa hạ' : season === 'autumn' ? 'mùa thu' : 'mùa đông';

    const prompt = `--- HIERARCHY OF COMMANDS ---
**PRIORITY #1 (ABSOLUTE & NON-NEGOTIABLE): FACIAL IDENTITY REPLICATION**
- **Core Command:** Preserve the exact facial identity and proportions of the reference photo.
- **Feature Lock:** Lock facial features to match the reference image exactly. Keep the same face shape, eyes, nose, mouth, and skin tone.
- **No Alterations:** Do not alter facial symmetry or makeup style.
- **Expression & Lighting:** Maintain natural expression and lighting consistency on the face.
- **Quality & Realism:** Ultra-detailed 8K portrait, realistic texture, no smoothing or plastic look.

**PRIORITY #2 (SECONDARY): SCENE & STYLE (Apply ONLY after Priority #1 is fully met)**
- **Bối cảnh ${themeTitle}:** "${scene.title} - ${scene.desc}".
- **Trang phục:** Người trong ảnh phải mặc trang phục phù hợp với bối cảnh và mùa. Kiểu dáng và màu sắc sẽ do AI tạo ngẫu nhiên để bổ sung hoàn hảo cho khung cảnh.
- **Chi tiết tùy chỉnh:** ${customDescription.trim() !== '' ? `Thêm các chi tiết sau: "${customDescription}".` : 'Không có chi tiết tùy chỉnh.'}

**PRIORITY #3 (TERTIARY): PHOTOGRAPHIC DETAILS**
- **Máy ảnh & Ống kính:** Mô phỏng ảnh chụp bằng Canon EOS R5, ống kính 85mm f/1.8, cài đặt f/2.0, ISO 100.
- **Ánh sáng:** Ánh sáng điện ảnh phù hợp với mùa (VD: vàng ấm cho mùa thu, trong trẻo cho mùa xuân), có ánh sáng chiếu nhẹ từ phía trước (gentle front fill), và hậu cảnh xóa phông (bokeh) mềm mại.
- **Lấy nét:** Lấy nét cực sắc vào mắt và lông mi, với ánh sáng phản chiếu (catchlight) thực tế.
- **Tóc:** Tóc màu nâu đen, rõ từng sợi và highlight tự nhiên.
- **Tỷ lệ khung hình:** Ảnh cuối cùng BẮT BUỘC phải có tỷ lệ ${aspectRatio}.`;

    console.log("Generated Four Seasons Prompt:", prompt);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imagePart,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    const refusalText = response.text;
    if (refusalText) {
        throw new Error(`API Refusal: ${refusalText}`);
    }

    throw new Error("No image was generated. The request may have been blocked or failed unexpectedly.");
};

export const initialCleanImage = async (imagePart: FilePart): Promise<string> => {
  return callGeminiApiForRestoration(imagePart, INITIAL_CLEAN_PROMPT);
};

export const advancedRestoreImage = async (imagePart: FilePart): Promise<string> => {
  return callGeminiApiForRestoration(imagePart, ADVANCED_RESTORATION_PROMPT);
};

export const colorizeImage = async (imagePart: FilePart): Promise<string> => {
  return callGeminiApiForRestoration(imagePart, COLORIZATION_PROMPT);
};

// --- BATCH GENERATOR SERVICE ---
export const generateBatchImages = async (
  prompt: string,
  aspectRatio: BatchAspectRatio,
  numOutputs: number
): Promise<string[]> => {
  if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
      throw new Error("API_KEY_INVALID");
  }
  const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: numOutputs,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("API không trả về ảnh nào.");
    }
   
    return response.generatedImages.map(img => img.image.imageBytes);

  } catch (error) {
    console.error("Error generating images with Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
    throw new Error(`Lỗi API Gemini: ${errorMessage}`);
  }
};


// --- THUMBNAIL GENERATOR SERVICE ---

const imageElementToPart = (image: HTMLImageElement, mimeType: string = 'image/jpeg'): Promise<Part> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        
        ctx.drawImage(image, 0, 0);
        
        canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = (reader.result as string).split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType,
                    },
                });
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(blob);
        }, mimeType, 0.95);
    });
};

export const generateThumbnail = async ({
    modelImage,
    refImage,
    inputs,
    ratio
}: {
    modelImage: HTMLImageElement;
    refImage: HTMLImageElement | null;
    // FIX: Corrected type name from 'Inputs' to 'ThumbnailInputs'.
    inputs: ThumbnailInputs;
    // FIX: Corrected type name from 'Ratio' to 'ThumbnailRatio'.
    ratio: ThumbnailRatio;
}): Promise<{ image?: string; error?: string; }> => {

    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        return { error: "API_KEY_INVALID" };
    }
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    
    try {
        const { title, speaker, outfit, action, extra } = inputs;
        const prompt = `
        Tạo một hình nền cho thumbnail YouTube chất lượng cao, hấp dẫn với tỷ lệ ${ratio}.

        **Yêu cầu cốt lõi:**
        1.  **Chủ thể chính:** Hình ảnh đầu tiên được cung cấp là "ảnh mẫu". Sử dụng người trong ảnh này làm chủ thể chính. **QUAN TRỌNG:** TUYỆT ĐỐI KHÔNG THAY ĐỔI KHUÔN MẶT hoặc DANH TÍNH của người đó. Giữ nguyên các đặc điểm và biểu cảm trên khuôn mặt của họ giống hệt như trong ảnh gốc.
        2.  **Phong cách & Bố cục:** Hình ảnh thứ hai (nếu có) là "ảnh tham khảo". Phong cách hình ảnh tổng thể, bảng màu, ánh sáng và bố cục phải được lấy cảm hứng mạnh mẽ từ "ảnh tham khảo" này. Nếu không có ảnh tham khảo, hãy tạo một phong cách hiện đại, năng động và chuyên nghiệp với nền tối màu xanh, theo chủ đề công nghệ.
        3.  **Ngoại hình chủ thể:** Chủ thể nên mặc: "${outfit}".
        4.  **Hành động của chủ thể:** Chủ thể nên thực hiện hành động hoặc tư thế sau: "${action}".
        5.  **Yếu tố văn bản:** KHÔNG render bất kỳ văn bản nào lên hình ảnh. Người dùng sẽ tự thêm văn bản sau.
        6.  **Ghi chú bổ sung:** ${extra}.

        Đầu ra cuối cùng phải là một hình ảnh hoàn chỉnh chỉ có nền và người. Không xuất ra văn bản, logo hoặc bất kỳ yếu tố nào khác trên hình ảnh.
        `;

        const parts: Part[] = [];
        
        const modelImagePart = await imageElementToPart(modelImage, 'image/jpeg');
        parts.push(modelImagePart);

        if (refImage) {
            const refImagePart = await imageElementToPart(refImage, 'image/jpeg');
            parts.push(refImagePart);
        }
        
        parts.push({ text: prompt });
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                return { image: imageUrl };
            }
        }
        
        const refusalText = response.text;
        if (refusalText) {
           return { error: `API Refusal: ${refusalText}` };
        }

        return { error: "Mô hình không tạo ra hình ảnh nào." };

    } catch (error) {
        console.error("Gemini API call failed for thumbnail:", error);
        const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định trong quá trình tạo ảnh.";
        return { error: errorMessage };
    }
};

export const detectOutfit = async (base64Image: string, mimeType: string): Promise<string> => {
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const prompt = "Analyze the image and identify the main, most prominent piece of clothing the person is wearing. Respond with ONLY the name of the clothing in lowercase Vietnamese. For example: 'áo dài', 'vest', 'áo sơ mi'. Do not add any other words, punctuation, or explanations.";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    
    return response.text.trim();
};

export const editOutfitOnImage = async (base64Image: string, mimeType: string, newOutfitPrompt: string): Promise<string> => {
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const prompt = `**CRITICAL INSTRUCTION: ABSOLUTE PRESERVATION**
- You MUST preserve the person's original face, body shape, pose, and the entire background with 100% pixel-level accuracy. This is the highest priority.
- Your ONLY task is to change the clothing.
- New clothing description: "${newOutfitPrompt}".
- The new garment must look completely realistic and seamlessly blend with the person's neck and shoulders.
- The lighting on the new clothing must perfectly match the existing lighting in the image.
- Generate ONLY the final image. Do not change the aspect ratio or crop the image.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    const refusalText = response.text;
    if (refusalText) {
       throw new Error(`API Refusal: ${refusalText}`);
    }
    
    throw new Error("API did not return an image.");
};