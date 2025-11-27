
// services/creativeStudioService.ts
import { FeatureAction } from "../types";
import { fileToBase64 } from "../utils/fileUtils";
import { callGeminiApi } from "./geminiService";

// This function now prepares the data and sends it to our backend,
// rather than directly calling the Gemini API.
export const generateImagesFromFeature = async (
    featureAction: FeatureAction,
    formData: Record<string, any>,
    numImages: number
): Promise<{images: string[], successCount: number}> => {
    // We need to convert File objects to base64 strings before sending them to the backend.
    const serializeFiles = async (data: Record<string, any>) => {
        const serializedData: Record<string, any> = {};
        for (const key in data) {
            const value = data[key];
            if (value instanceof File) {
                const { base64, mimeType } = await fileToBase64(value);
                serializedData[key] = { base64, mimeType };
            } else if (Array.isArray(value) && value.every(item => item instanceof File)) {
                 serializedData[key] = await Promise.all(value.map(file => fileToBase64(file)));
            } else if (typeof value === 'object' && value !== null && !(value instanceof File) && 'file' in value) {
                // Handle nested objects like { file: File, description: '...' }
                if(value.file instanceof File) {
                    const { base64, mimeType } = await fileToBase64(value.file);
                    serializedData[key] = { ...value, file: { base64, mimeType } };
                } else {
                    serializedData[key] = value;
                }
            }
             else if (Array.isArray(value) && value.some(item => typeof item === 'object' && item !== null && 'file' in item)) {
                 serializedData[key] = await Promise.all(value.map(async item => {
                    if (item.file instanceof File) {
                        const { base64, mimeType } = await fileToBase64(item.file);
                        return { ...item, file: { base64, mimeType } };
                    }
                    return item;
                }));
            }
            else {
                serializedData[key] = value;
            }
        }
        return serializedData;
    };

    const serializedFormData = await serializeFiles(formData);

    const { images, successCount } = await callGeminiApi('generateImagesFromFeature', {
        featureAction,
        formData: serializedFormData,
        numImages,
    });
    return { images, successCount };
};

export const getHotTrends = async (): Promise<string[]> => {
    const { trends } = await callGeminiApi('getHotTrends', {});
    return trends;
};

export const generateVideoPrompt = async (userIdea: string, base64Image: string): Promise<{ englishPrompt: string, vietnamesePrompt: string }> => {
    const { prompts } = await callGeminiApi('generateVideoPrompt', { userIdea, base64Image });
    return prompts;
};

export const generateVideoFromImage = async (
    base64Image: string,
    prompt: string,
    setProgress: (message: string) => void
): Promise<string> => {
     // The progress logic might need to be adapted since the long-running task is now on the backend.
     // For now, we'll just proxy the call. A more advanced solution would use web sockets or polling.
    setProgress('Đang gửi yêu cầu tạo video...');
    const { videoUrl, error } = await callGeminiApi('generateVideoFromImage', { base64Image, prompt });
    if (error) {
        throw new Error(error);
    }
    // Since the actual generation happens on the backend, we can't provide detailed progress.
    // We update the message after the backend returns the final URL.
    setProgress('Video đã tạo xong! Đang tải...'); 
    return videoUrl;
};
