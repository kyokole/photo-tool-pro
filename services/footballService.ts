
import { FootballStudioSettings } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { callGeminiApi } from './geminiService';

export const generateFootballPhoto = async (settings: FootballStudioSettings): Promise<string> => {
    if (!settings.sourceImage) {
        throw new Error("Source image is missing.");
    }
    
    const { base64, mimeType } = await fileToBase64(settings.sourceImage);
    const serializedSettings = {
        ...settings,
        sourceImage: { base64, mimeType }
    };

    const { imageData } = await callGeminiApi('generateFootballPhoto', { settings: serializedSettings });
    return imageData;
};
