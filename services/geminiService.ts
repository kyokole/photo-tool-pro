// services/geminiService.ts
import { getAuthInstance } from '../services/firebase';
import type { Settings, FilePart, FashionStudioSettings, ThumbnailInputs, ThumbnailRatio, BatchAspectRatio, Scene, RestorationOptions, DocumentRestorationOptions } from '../types';

/**
 * A generic API client to communicate with our own Vercel Serverless Function backend.
 * This function acts as a secure proxy for all Gemini API calls.
 * @param action The specific Gemini action to perform (e.g., 'generateIdPhoto').
 * @param payload The data required for that action.
 * @returns The result from the backend.
 */
const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    let idToken: string | null = null;
    if (user) {
        try {
            idToken = await user.getIdToken();
        } catch (error) {
            console.error("Error getting user ID token:", error);
            // Proceed without a token if it fails
        }
    }

    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, idToken }),
    });

    if (!response.ok) {
        // Read the body ONCE as text.
        const errorText = await response.text(); 
        let errorMessage = errorText; 

        try {
            // Then, TRY to parse that text as JSON.
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (e) {
            // If parsing fails, it was plain text. We already have the error message.
            // No extra action needed.
        }
        throw new Error(errorMessage);
    }

    // If response is OK, we expect valid JSON.
    return response.json();
};

// --- ID Photo Tool ---
export const generateIdPhoto = async (originalImage: string, settings: Settings, signal?: AbortSignal, outfitImagePart?: FilePart): Promise<string> => {
    // AbortSignal is not easily transferable via fetch, so we'll rely on server-side timeouts.
    // However, we can check for abort before making the call.
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    
    const { imageData } = await callBackendApi('generateIdPhoto', { originalImage, settings, outfitImagePart });
    return imageData;
};

// --- Headshot Generator ---
export const generateHeadshot = async (imagePart: FilePart, prompt: string, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const { imageData } = await callBackendApi('generateHeadshot', { imagePart, prompt });
    return imageData;
};

// --- Restoration Tool (New Unified Function) ---
export const performRestoration = async (imagePart: FilePart, options: RestorationOptions): Promise<string> => {
    const { imageData } = await callBackendApi('performRestoration', { imagePart, options });
    return imageData;
};

export const performDocumentRestoration = async (imagePart: FilePart, options: DocumentRestorationOptions): Promise<string> => {
    const { imageData } = await callBackendApi('performDocumentRestoration', { imagePart, options });
    return imageData;
};


// --- Fashion Studio ---
export const generateFashionPhoto = async (imagePart: FilePart, settings: FashionStudioSettings, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const { imageData } = await callBackendApi('generateFashionPhoto', { imagePart, settings });
    return imageData;
};

// --- Four Seasons Studio ---
export const generateFourSeasonsPhoto = async (
    imagePart: FilePart,
    scene: Scene,
    season: string,
    aspectRatio: string,
    customDescription: string
): Promise<string> => {
    const { imageData } = await callBackendApi('generateFourSeasonsPhoto', { imagePart, scene, season, aspectRatio, customDescription });
    return imageData;
};

// --- BATCH GENERATOR SERVICE ---
export const generateBatchImages = async (
  prompt: string,
  aspectRatio: BatchAspectRatio,
  numOutputs: number
): Promise<string[]> => {
    const { images } = await callBackendApi('generateBatchImages', { prompt, aspectRatio, numOutputs });
    return images;
};

// --- THUMBNAIL GENERATOR SERVICE ---
export const generateThumbnail = async ({
    modelImage,
    refImage,
    inputs,
    ratio
}: {
    modelImage: string; // Pass base64 string
    refImage: string | null; // Pass base64 string
    inputs: ThumbnailInputs;
    ratio: ThumbnailRatio;
}): Promise<{ image?: string; error?: string; }> => {
    return callBackendApi('generateThumbnail', { modelImage, refImage, inputs, ratio });
};

// --- OUTFIT EDITOR (from Four Seasons) ---
export const detectOutfit = async (base64Image: string, mimeType: string): Promise<string> => {
    const { outfit } = await callBackendApi('detectOutfit', { base64Image, mimeType });
    return outfit;
};

export const editOutfitOnImage = async (base64Image: string, mimeType: string, newOutfitPrompt: string): Promise<string> => {
    const { imageData } = await callBackendApi('editOutfitOnImage', { base64Image, mimeType, newOutfitPrompt });
    return imageData;
};