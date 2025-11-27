
import { callGeminiApi } from './geminiService';

export async function generatePromptFromImage(base64Image: string, mimeType: string, isFaceLockEnabled: boolean, language: string): Promise<string> {
    const { prompt } = await callGeminiApi('generatePromptFromImage', {
        base64Image,
        mimeType,
        isFaceLockEnabled,
        language
    });
    return prompt;
}
