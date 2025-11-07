import { GoogleGenAI } from "@google/genai";

const getModel = () => {
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    if (!process.env.VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY_INVALID");
    }
    // FIX: Use VITE_GEMINI_API_KEY as required by the Vite build process for client-side environment variables.
    return new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY }).models;
}

export const BASE_PROMPT_INSTRUCTION = `You are a world-class expert in reverse-engineering images into prompts for generative AI. Your sole task is to analyze the provided image with microscopic detail and generate a prompt that can be used by an advanced AI image generator to reconstruct the original image with near-perfect, 1:1 fidelity.

Your output MUST be a single, long, cohesive paragraph of descriptive phrases separated by commas. Do not use any other formatting. Your entire response must be ONLY the prompt.

Follow this meticulous process:

1.  **Master Scene & Subject:** Begin with the most crucial elements. Describe the primary subject and the overall scene in a concise phrase. (e.g., "Full-length portrait of an elegant woman in a grand hall").
2.  **Subject Deep Dive:**
    *   **Facial Description:** Describe the person's ethnicity, estimated age, facial structure, skin tone, eye color, and makeup with extreme precision. Describe their expression (e.g., 'a soft, serene smile', 'a look of quiet contemplation').
    *   **Hair:** Detail the hairstyle, color, texture, and any hair accessories. Be specific (e.g., 'intricate updo with voluminous curls', 'jet black hair with a glossy finish').
    *   **Attire & Accessories:** Deconstruct every piece of clothing. Specify the item (e.g., 'ball gown', 'tuxedo'), material ('heavy silk satin', 'delicate lace overlay', 'tulle'), texture, intricate patterns ('floral embroidery with silver thread'), color (use precise color names like 'dusty rose', 'champagne beige'), and fit. Detail all jewelry, bags, or other accessories.
3.  **Environment Analysis:**
    *   **Setting:** Define the location (e.g., 'neoclassical ballroom', 'sun-drenched conservatory', 'modern minimalist interior').
    *   **Architectural & Decorative Elements:** List every visible detail: windows (style, number), columns (style), flooring (material, reflection), walls, furniture, plants (species, condition), decorations.
4.  **Photographic DNA:** Reverse-engineer the photographic technique. This is critical for achieving fidelity.
    *   **Composition:** Specify shot type (full-length, medium shot), camera angle (eye-level, slight low angle), and subject placement (centered, rule of thirds).
    *   **Lens & Camera Effects:** Infer the lens characteristics. Specify the depth of field ('extremely shallow depth of field', 'deep focus'). Describe the bokeh effect in the background if present. Note any lens flare, chromatic aberration, or vignetting.
    *   **Lighting Breakdown:** This is paramount. Identify the light sources (e.g., 'large arched windows providing soft, diffused natural light from the left'). Describe the quality of light ('bright but gentle', 'dramatic chiaroscuro'). Detail the shadows ('soft, long shadows', 'no harsh shadows').
5.  **Artistic & Technical Style:**
    *   **Color Grading:** Describe the overall color palette and mood ('warm, golden tones', 'cool, muted blues'). Mention the color harmony.
    *   **Aesthetic:** Define the style (e.g., 'ultra-photorealistic', 'cinematic fashion photography', 'ethereal fine art portrait').
    *   **Rendering Quality:** Conclude with technical keywords that enforce quality. Always include 'hyper-detailed, 8K, professional photography, masterpiece, sharp focus, high dynamic range (HDR)'.

**Final Mandate:** Synthesize all the above points into a single, dense, comma-separated paragraph. Your only output is this prompt. Do not add any conversational text, headings, or explanations. Start directly with the description.`;

export const FACE_LOCK_INSTRUCTION = `**SPECIAL INSTRUCTION: FACE LOCK ACTIVE**
For the **Facial Description** step, your task changes. Instead of creating a similar face, you must describe the provided face with 100% accuracy to ensure the AI reconstructs the *exact same person*. Detail the unique shape of their eyes, nose, lips, jawline, and chin with extreme precision. The goal is to retain the person's identity perfectly.`;

export async function generatePromptFromImage(base64Image: string, mimeType: string, isFaceLockEnabled: boolean, language: string): Promise<string> {
  try {
    const models = getModel();
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const languageInstruction = `\n**LANGUAGE:** The final output prompt must be written entirely in ${language === 'vi' ? 'Vietnamese' : 'English'}.`;

    const systemInstruction = isFaceLockEnabled 
        ? `${BASE_PROMPT_INSTRUCTION}\n\n${FACE_LOCK_INSTRUCTION}${languageInstruction}` 
        : `${BASE_PROMPT_INSTRUCTION}${languageInstruction}`;

    const response = await models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart] },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 8192,
      }
    });
    
    const text = response.text;

    if (typeof text !== 'string' || !text.trim()) {
      console.error("Gemini API returned an empty or invalid text response.", response);
      const finishReason = response?.candidates?.[0]?.finishReason;
      
      if (finishReason === 'SAFETY') {
        throw new Error("Không thể tạo câu lệnh vì ảnh bị chặn bởi bộ lọc an toàn. Vui lòng thử ảnh khác.");
      }
      if (finishReason) {
        throw new Error(`Mô hình AI đã dừng tạo đột ngột (Lý do: ${finishReason}). Vui lòng thử lại.`);
      }
      
      throw new Error("Mô hình AI trả về phản hồi trống.");
    }
    
    return text.trim();
  } catch (error) {
    console.error("Error generating prompt from Gemini:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes("API_KEY_INVALID"))) {
        throw new Error("API key không hợp lệ. Vui lòng kiểm tra cấu hình.");
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Không thể tạo câu lệnh từ ảnh. Đã xảy ra lỗi không mong muốn với dịch vụ AI.");
  }
}