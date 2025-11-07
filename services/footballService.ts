import { GoogleGenAI, Modality, Part } from '@google/genai';
import { FootballStudioSettings } from '../types';
import { fileToGenerativePart } from '../utils/fileUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateFootballPhoto = async (settings: FootballStudioSettings): Promise<string> => {
    if (!settings.sourceImage) {
        throw new Error("Source image is missing.");
    }

    const { mode, sourceImage, category, team, player, scene, aspectRatio, style, customPrompt } = settings;

    let prompt: string;
    const parts: Part[] = [];

    const imagePart = await fileToGenerativePart(sourceImage);
    if (!imagePart) {
        throw new Error("Could not process the source image.");
    }
    
    parts.push(imagePart);

    if (mode === 'idol') {
        const playerDescription = category === 'legendary'
            ? `a football legend inspired by ${player} affiliated with ${team}`
            : `a football player inspired by ${player} from the ${team} national team`;
        
        prompt = `**TASK:** Generate an ultra-realistic, natural-looking photo of the user (from the provided image) standing or interacting with a football player character.

**UNBREAKABLE DIRECTIVE: USER IDENTITY PRESERVATION**
- **PRIMARY GOAL:** Your single most important task is to generate an image where the user's face is an **IDENTICAL, FLAWLESS, PERFECT COPY** of the face from the provided user image. This rule is absolute and has zero tolerance for deviation.
- **NON-NEGOTIABLE RULES:**
    1.  **IDENTITY SOURCE:** The provided image of the user.
    2.  **FACE REPLICATION:** The user's face in the final output **MUST BE A PIXEL-PERFECT, 1:1 REPLICA**. Do NOT change their facial structure, features, expression, skin texture, or any unique marks. The identity MUST be preserved.

**INSTRUCTIONS:**
1.  **User:** The user is the person in the uploaded photo. Their face MUST be preserved as per the unbreakable directive above.
2.  **Player Character:** Create ${playerDescription}. The player should resemble the real-world athlete’s style and physique, but do not replicate their exact face.
3.  **Scene:** Place both the user and the player character in this scene: "${scene}".
4.  **Interaction:** Ensure the lighting, color tone, and perspective match between the user and the scene. Both subjects should look friendly, natural, and proportionally correct.
5.  **Aesthetics:** The final image must look like a genuine, candid, or professionally posed photograph, not digital art.
6.  **Aspect Ratio:** The final composition must be ${aspectRatio}.
${customPrompt ? `- **Custom Request:** ${customPrompt}\n` : ''}
**OUTPUT:** Generate ONLY the final image.`;

    } else { // mode === 'outfit'
        prompt = `**TASK:** Edit an image to create a dynamic sports marketing visual, placing a piece of clothing or product onto a football player.

**CRITICAL RULE - PRODUCT ACCURACY:** The product is the main subject of the provided image. You MUST render this product with 100% accuracy. Preserve all its details, colors, patterns, and logos. Do NOT add, remove, or alter any part of the garment/product itself.

**INSTRUCTIONS:**
1.  **Product:** The product is from the provided image.
2.  **Subject:** The subject is football superstar ${player} from ${team}.
3.  **Action:** The player is performing this action: "${scene}".
4.  **Integration:** Seamlessly fit the product onto the player. The lighting, shadows, and fabric folds must look completely realistic and match the action.
5.  **Art Style:** The final image must have a "${style}" aesthetic.
6.  **Aspect Ratio:** The final composition must be ${aspectRatio}.
${customPrompt ? `- **Custom Request:** ${customPrompt}\n` : ''}
**OUTPUT:** Generate ONLY the final image.`;
    }

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        const refusalText = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refusalText) {
            throw new Error(`API Refusal: ${refusalText}`);
        }
        
        throw new Error("No image was generated. The request may have been blocked or failed unexpectedly.");

    } catch (error) {
        console.error("Gemini API Error in Football Service:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while calling the Gemini API.");
    }
};