// services/geminiService.ts
import { getAuthInstance, getDbInstance } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Settings, FilePart, FashionStudioSettings, ThumbnailInputs, ThumbnailRatio, BatchAspectRatio, Scene, RestorationOptions, DocumentRestorationOptions, BeautyFeature, BeautySubFeature, BeautyStyle, SerializedFamilyStudioSettings, FamilyStudioResult, MarketingProduct, MarketingSettings, MarketingResult, ArtStylePayload } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

/**
 * A generic API client to communicate with our own Vercel Serverless Function backend.
 * This function acts as a secure proxy for all Gemini API calls.
 * Includes user authentication and VIP status verification.
 * @param action The specific Gemini action to perform (e.g., 'generateIdPhoto').
 * @param payload The data required for that action.
 * @returns The result from the backend.
 */
export const callGeminiApi = async (action: string, payload: any): Promise<any> => {
    const auth = getAuthInstance();
    const db = getDbInstance();
    const user = auth.currentUser;
    
    let idToken: string | null = null;
    let clientVipStatus = false;

    if (user) {
        try {
            // 1. Get ID Token
            idToken = await user.getIdToken(false); // Use cached token for speed, force refresh only if needed

            // 2. CHECK VIP STATUS CLIENT-SIDE (FALLBACK MECHANISM)
            // Since backend verification might fail due to missing service account config,
            // we explicitly check the user status here and send it.
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const isAdmin = userData?.isAdmin === true;
                const expiryDate = new Date(userData?.subscriptionEndDate || 0);
                const isVip = isAdmin || (expiryDate > new Date());
                clientVipStatus = isVip;
            }
        } catch (error) {
            console.error("Error preparing user credentials:", error);
        }
    }

    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action, 
            payload, 
            idToken,
            clientVipStatus // Pass the client-verified status
        }),
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
    
    const { imageData } = await callGeminiApi('generateIdPhoto', { originalImage, settings, outfitImagePart });
    return imageData;
};

// --- Headshot Generator ---
export const generateHeadshot = async (imagePart: FilePart, prompt: string, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const { imageData } = await callGeminiApi('generateHeadshot', { imagePart, prompt });
    return imageData;
};

// --- Restoration Tool (New Unified Function) ---
export const performRestoration = async (imagePart: FilePart, options: RestorationOptions): Promise<string> => {
    const { imageData } = await callGeminiApi('performRestoration', { imagePart, options });
    return imageData;
};

export const performDocumentRestoration = async (imagePart: FilePart, options: DocumentRestorationOptions): Promise<string> => {
    const { imageData } = await callGeminiApi('performDocumentRestoration', { imagePart, options });
    return imageData;
};


// --- Fashion Studio ---
export const generateFashionPhoto = async (imagePart: FilePart, settings: FashionStudioSettings, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const { imageData } = await callGeminiApi('generateFashionPhoto', { imagePart, settings });
    return imageData;
};

// --- Family Studio ---
// This is the legacy 1-pass method. Kept for A/B testing or fallback.
export const generateFamilyPhoto = async (settings: Omit<SerializedFamilyStudioSettings, 'rois'>, setProgress: (message: string) => void): Promise<string> => {
    setProgress('Đang gửi yêu cầu tạo ảnh gia đình...');
    const { imageData } = await callGeminiApi('generateFamilyPhoto', { settings });
    return imageData;
};

// This is the new 3-pass method as per the user's specification.
export const generateFamilyPhoto_3_Pass = async (
    settings: SerializedFamilyStudioSettings,
    setProgressMessage: (message: string) => void
): Promise<{ imageData: string, similarityScores: { memberId: string, score: number }[], debug?: any }> => {
    // Polling could be implemented here to get progress updates from the server,
    // but for now, we just pass a simple initial message.
    setProgressMessage('Đang khởi tạo quy trình tạo ảnh 3 bước...');
    const result = await callGeminiApi('generateFamilyPhoto_3_Pass', { settings });
    return result;
};


// --- Beauty Studio ---
export const generateBeautyPhoto = async (
    baseImage: string,
    tool: BeautyFeature,
    subFeature: BeautySubFeature | null,
    style: BeautyStyle | null
): Promise<string> => {
    const { imageData } = await callGeminiApi('generateBeautyPhoto', { baseImage, tool, subFeature, style });
    return imageData;
};

// --- Four Seasons Studio ---
export const generateFourSeasonsPhoto = async (
    imagePart: FilePart,
    scene: Scene,
    season: string,
    aspectRatio: string,
    customDescription: string,
    highQuality: boolean
): Promise<string> => {
    const { imageData } = await callGeminiApi('generateFourSeasonsPhoto', { imagePart, scene, season, aspectRatio, customDescription, highQuality });
    return imageData;
};

// --- Football Studio ---
export const generateFootballPhoto = async (settings: any): Promise<string> => {
    const { imageData } = await callGeminiApi('generateFootballPhoto', { settings });
    return imageData;
};

// --- Marketing Studio ---
export const generateMarketingAdCopy = async (product: Record<string, string>, imagePart?: FilePart): Promise<string> => {
    const { text } = await callGeminiApi('generateMarketingAdCopy', { product, imagePart });
    return text;
};

export const generateMarketingVideoScript = async (product: Record<string, string>, tone: string, angle: string, imagePart?: FilePart): Promise<string> => {
    const { text } = await callGeminiApi('generateMarketingVideoScript', { product, tone, angle, imagePart });
    return text;
};

export const generateMarketingImage = async (
    productImagePart: FilePart,
    referenceImagePart: FilePart | null,
    productDetails: Record<string, string>,
    settings: MarketingSettings
): Promise<string> => {
    const { imageData } = await callGeminiApi('generateMarketingImage', {
        productImagePart,
        referenceImagePart,
        productDetails,
        settings
    });
    return imageData;
};

// NEW: Dedicated function for Marketing Video Generation (Veo)
export const generateMarketingVideo = async (
    base64Image: string, 
    script: string,
    setProgress: (message: string) => void
): Promise<string> => {
    setProgress('Đang kết nối máy chủ Veo (Video Gen)...');
    // UPDATED: Uses the new 'generateVeoVideo' action
    const { videoUrl } = await callGeminiApi('generateVeoVideo', { base64Image, prompt: script });
    setProgress('Video đã hoàn tất! Đang tải xuống...');
    return videoUrl;
};

// --- ART STYLE STUDIO ---
export const generateArtStyleImages = async (payload: any): Promise<string[]> => {
    const {
        modelFile,
        otherFiles,
        styles,
        quality,
        aspect,
        count,
        userPrompt
    } = payload;

    // Helper to ensure clean base64 data extraction
    const extractBase64Data = async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        return { base64, mimeType };
    };

    const modelData = await extractBase64Data(modelFile.file);

    const convertedOtherFiles: any = {};
    
    if (otherFiles.clothing?.file) {
        convertedOtherFiles.clothing = await extractBase64Data(otherFiles.clothing.file);
    }
    if (otherFiles.accessories?.file) {
        convertedOtherFiles.accessories = await extractBase64Data(otherFiles.accessories.file);
    }
    if (otherFiles.product?.file) {
        convertedOtherFiles.product = await extractBase64Data(otherFiles.product.file);
    }

    const apiPayload: ArtStylePayload = {
        modelFile: modelData,
        otherFiles: convertedOtherFiles,
        styles,
        quality,
        aspect,
        count,
        userPrompt
    };

    const { images } = await callGeminiApi('generateArtStyleImages', apiPayload);
    return images;
};


// --- BATCH GENERATOR SERVICE ---
export const generateBatchImages = async (
  prompt: string,
  aspectRatio: BatchAspectRatio,
  numOutputs: number
): Promise<string[]> => {
    const { images } = await callGeminiApi('generateBatchImages', { prompt, aspectRatio, numOutputs });
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
    return callGeminiApi('generateThumbnail', { modelImage, refImage, inputs, ratio });
};

// --- OUTFIT EDITOR (from Four Seasons) ---
export const detectOutfit = async (base64Image: string, mimeType: string): Promise<string> => {
    const { outfit } = await callGeminiApi('detectOutfit', { base64Image, mimeType });
    return outfit;
};

export const editOutfitOnImage = async (base64Image: string, mimeType: string, newOutfitPrompt: string): Promise<string> => {
    const { imageData } = await callGeminiApi('editOutfitOnImage', { base64Image, mimeType, newOutfitPrompt });
    return imageData;
};

export const generateVideoFromImage = async (
    base64Image: string,
    prompt: string,
    setProgress: (message: string) => void
): Promise<string> => {
    setProgress('Đang kết nối máy chủ Veo (Video Gen)...');
    // UPDATED: Uses the new 'generateVeoVideo' action
    const { videoUrl, error } = await callGeminiApi('generateVeoVideo', { base64Image, prompt });
    if (error) {
        throw new Error(error);
    }
    setProgress('Video đã tạo xong! Đang tải...'); 
    return videoUrl;
};