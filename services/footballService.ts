import { FootballStudioSettings } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred with the API proxy.');
    }

    return data;
};

export const generateFootballPhoto = async (settings: FootballStudioSettings): Promise<string> => {
    if (!settings.sourceImage) {
        throw new Error("Source image is missing.");
    }
    
    const { base64, mimeType } = await fileToBase64(settings.sourceImage);
    const serializedSettings = {
        ...settings,
        sourceImage: { base64, mimeType }
    };

    const { imageData } = await callBackendApi('generateFootballPhoto', { settings: serializedSettings });
    return imageData;
};
