// services/geminiService.ts
import type { Settings, FilePart, FashionStudioSettings, ThumbnailInputs, ThumbnailRatio, BatchAspectRatio, Scene } from '../types';

/**
 * A generic API client to communicate with our own Vercel Serverless Function backend.
 * This function acts as a secure proxy for all Gemini API calls.
 * @param action The specific Gemini action to perform (e.g., 'generateIdPhoto').
 * @param payload The data required for that action.
 * @returns The result from the backend.
 */
const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const data = await response.json();

    if (!response.ok) {
        // Forward the error message from the backend
        throw new Error(data.error || 'An unknown error occurred with the API proxy.');
    }

    return data;
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

// --- Restoration Tool ---
export const initialCleanImage = async (imagePart: FilePart): Promise<string> => {
  const { imageData } = await callBackendApi('initialCleanImage', { imagePart });
  return imageData;
};

export const advancedRestoreImage = async (imagePart: FilePart): Promise<string> => {
  const { imageData } = await callBackendApi('advancedRestoreImage', { imagePart });
  return imageData;
};

export const colorizeImage = async (imagePart: FilePart): Promise<string> => {
  const { imageData } = await callBackendApi('colorizeImage', { imagePart });
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
