
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
            
            // Direct File object (e.g. subject_image, person_left_image)
            if (value instanceof File) {
                const { base64, mimeType } = await fileToBase64(value);
                serializedData[key] = { base64, mimeType };
            } 
            // Array of Files
            else if (Array.isArray(value) && value.every(item => item instanceof File)) {
                 serializedData[key] = await Promise.all(value.map(file => fileToBase64(file)));
            } 
            // Wrapper object with file property (e.g. { file: File, description: '...' })
            else if (typeof value === 'object' && value !== null && !(value instanceof File) && 'file' in value) {
                if(value.file instanceof File) {
                    const { base64, mimeType } = await fileToBase64(value.file);
                    serializedData[key] = { ...value, file: { base64, mimeType } };
                } else {
                    serializedData[key] = value;
                }
            }
            // Array of wrapper objects
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

export const enhanceVideoPrompt = async (prompt: string, language: string = 'en'): Promise<string> => {
    const { enhancedPrompt } = await callGeminiApi('enhanceVideoPrompt', { prompt, language }, 0); // Free tool
    return enhancedPrompt;
};

export const analyzeVideoFrames = async (frames: string[], language: string = 'en'): Promise<string[]> => {
    const { prompts } = await callGeminiApi('analyzeVideoFrames', { frames, language }, 0);
    return prompts;
};

export const generateVideoFromImage = async (
    base64Image: string | null,
    prompt: string,
    setProgress: (message: string) => void,
    characterImages?: string[],
    settings?: { resolution: '720p' | '1080p', audio: boolean, aspectRatio?: '16:9' | '9:16' }
): Promise<string> => {
    // Updated to use the new unified Veo action
    setProgress('Đang kết nối máy chủ Veo...');
    
    const payload: any = { prompt };
    if (base64Image) {
        payload.base64Image = base64Image;
    }
    if (characterImages && characterImages.length > 0) {
        payload.characterImages = characterImages;
    }
    if (settings) {
        payload.settings = settings;
    }

    // Video generation cost is handled in callGeminiApi or backend logic based on usage
    // Default is 10 credits, but might vary.
    const { videoUrl, error } = await callGeminiApi('generateVeoVideo', payload, 10); 
    if (error) {
        throw new Error(error);
    }
    setProgress('Video đã tạo xong! Đang tải...'); 
    return videoUrl;
};
