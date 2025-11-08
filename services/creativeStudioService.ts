// services/creativeStudioService.ts
import { FeatureAction } from "../types";
import { fileToBase64 } from "../utils/fileUtils";

/**
 * A generic API client to communicate with our own Vercel Serverless Function backend.
 * This function acts as a secure proxy for all Gemini API calls.
 * @param action The specific Gemini action to perform (e.g., 'generateImagesFromFeature').
 * @param payload The data required for that action.
 * @returns The result from the backend.
 */
const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        let errorMessage = 'An unknown server error occurred.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

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

    const { images, successCount } = await callBackendApi('generateImagesFromFeature', {
        featureAction,
        formData: serializedFormData,
        numImages,
    });
    return { images, successCount };
};

export const getHotTrends = async (): Promise<string[]> => {
    const { trends } = await callBackendApi('getHotTrends', {});
    return trends;
};

export const generateVideoPrompt = async (userIdea: string, base64Image: string): Promise<{ englishPrompt: string, vietnamesePrompt: string }> => {
    const { prompts } = await callBackendApi('generateVideoPrompt', { userIdea, base64Image });
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
    const { videoUrl, error } = await callBackendApi('generateVideoFromImage', { base64Image, prompt });
    if (error) {
        throw new Error(error);
    }
    // Since the actual generation happens on the backend, we can't provide detailed progress.
    // We update the message after the backend returns the final URL.
    setProgress('Video đã tạo xong! Đang tải...'); 
    return videoUrl;
};