
import { getAuthInstance, getDbInstance, deductUserCredits, refundUserCredits } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Settings, FilePart, FashionStudioSettings, ThumbnailInputs, ThumbnailRatio, BatchAspectRatio, Scene, RestorationOptions, DocumentRestorationOptions, BeautyFeature, BeautySubFeature, BeautyStyle, SerializedFamilyStudioSettings, MarketingSettings, ArtStylePayload, MusicSettings, SongStructure, MusicAnalysisResult } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { CREDIT_COSTS } from '../constants';

/**
 * A generic API client to communicate with our own Vercel Serverless Function backend.
 */
export const callGeminiApi = async (action: string, payload: any, creditCost: number = 0): Promise<any> => {
    const auth = getAuthInstance();
    const db = getDbInstance();
    const user = auth.currentUser;
    
    let idToken: string | null = null;
    let clientVipStatus = false;
    let isPaid = false;
    let creditsDeducted = false;

    if (user) {
        try {
            idToken = await user.getIdToken(false);
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const isAdmin = userData?.isAdmin === true;
                const expiryDate = new Date(userData?.subscriptionEndDate || 0);
                const isVip = isAdmin || (expiryDate > new Date());
                clientVipStatus = isVip;

                if (!isVip && creditCost > 0) {
                    await deductUserCredits(creditCost);
                    isPaid = true; 
                    creditsDeducted = true;
                } else if (isVip) {
                    isPaid = true;
                }
            }
        } catch (error: any) {
            console.error("Error processing user/credits:", error);
            if (error.message === "INSUFFICIENT_CREDITS") {
                throw new Error("insufficient credits"); 
            }
        }
    }

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action, 
                payload: { ...payload, isPaid },
                idToken,
                clientVipStatus 
            }),
        });

        if (!response.ok) {
            const errorText = await response.text(); 
            let errorMessage = errorText; 
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || JSON.stringify(errorData);
            } catch (e) { }
            throw new Error(errorMessage);
        }

        return await response.json();

    } catch (error) {
        if (creditsDeducted) {
            console.warn(`[Billing] API Call Failed. Initiating Refund of ${creditCost} credits.`);
            await refundUserCredits(creditCost).catch(err => console.error("FATAL: Refund failed", err));
            if (error instanceof Error) {
                error.message += " (Credits have been refunded)";
            }
        }
        throw error;
    }
};

// --- ID Photo Tool ---
export const generateIdPhoto = async (originalImage: string, settings: Settings, signal?: AbortSignal, outfitImagePart?: FilePart): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateIdPhoto', { originalImage, settings, outfitImagePart }, cost);
    return imageData;
};

// --- Headshot Generator ---
export const generateHeadshot = async (imagePart: FilePart, prompt: string, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const isHQ = prompt.includes("4K");
    const baseCost = isHQ ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const totalCost = baseCost * 4;
    const { imageData } = await callGeminiApi('generateHeadshot', { imagePart, prompt }, totalCost);
    return imageData;
};

// --- Restoration Tool ---
export const performRestoration = async (imagePart: FilePart, options: RestorationOptions): Promise<string> => {
    const cost = options.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('performRestoration', { imagePart, options }, cost);
    return imageData;
};

export const performDocumentRestoration = async (imagePart: FilePart, options: DocumentRestorationOptions): Promise<string> => {
    const cost = options.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('performDocumentRestoration', { imagePart, options }, cost);
    return imageData;
};

// --- Fashion Studio ---
export const generateFashionPhoto = async (imagePart: FilePart, settings: FashionStudioSettings, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateFashionPhoto', { imagePart, settings }, cost);
    return imageData;
};

// --- Family Studio ---
export const generateFamilyPhoto = async (settings: any, setProgress: (message: string) => void): Promise<string> => {
    setProgress('Đang gửi yêu cầu tạo ảnh gia đình...');
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateFamilyPhoto', { settings }, cost);
    return imageData;
};

export const generateFamilyPhoto_3_Pass = async (
    settings: SerializedFamilyStudioSettings,
    setProgressMessage: (message: string) => void
): Promise<{ imageData: string, similarityScores: { memberId: string, score: number }[], debug?: any }> => {
    setProgressMessage('Đang khởi tạo quy trình tạo ảnh 3 bước...');
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const result = await callGeminiApi('generateFamilyPhoto_3_Pass', { settings }, cost);
    return result;
};

// --- Beauty Studio ---
export const generateBeautyPhoto = async (
    baseImage: string,
    tool: BeautyFeature,
    subFeature: BeautySubFeature | null,
    style: BeautyStyle | null
): Promise<string> => {
    const cost = CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateBeautyPhoto', { baseImage, tool, subFeature, style }, cost);
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
    const cost = highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateFourSeasonsPhoto', { imagePart, scene, season, aspectRatio, customDescription, highQuality }, cost);
    return imageData;
};

// --- Football Studio ---
export const generateFootballPhoto = async (settings: any): Promise<string> => {
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateFootballPhoto', { settings }, cost);
    return imageData;
};

// --- Marketing Studio ---
export const generateMarketingAdCopy = async (product: Record<string, string>, imagePart?: FilePart, language: string = 'vi'): Promise<string> => {
    const { text } = await callGeminiApi('generateMarketingAdCopy', { product, imagePart, language }, 0);
    return text;
};

export const generateMarketingVideoScript = async (product: Record<string, string>, tone: string, angle: string, imagePart?: FilePart, language: string = 'vi'): Promise<string> => {
    const { text } = await callGeminiApi('generateMarketingVideoScript', { product, tone, angle, imagePart, language }, 0);
    return text;
};

export const generateMarketingImage = async (
    productImagePart: FilePart,
    referenceImagePart: FilePart | null,
    productDetails: Record<string, string>,
    settings: MarketingSettings
): Promise<{ imageData: string, prompt: string }> => {
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData, prompt } = await callGeminiApi('generateMarketingImage', {
        productImagePart,
        referenceImagePart,
        productDetails,
        settings
    }, cost);
    return { imageData, prompt };
};

export const generateMarketingVideo = async (
    base64Image: string, 
    script: string,
    setProgress: (message: string) => void
): Promise<string> => {
    setProgress('Đang kết nối máy chủ Veo (Video Gen)...');
    const { videoUrl } = await callGeminiApi('generateVeoVideo', { base64Image, prompt: script }, CREDIT_COSTS.VIDEO_GENERATION);
    setProgress('Video đã hoàn tất! Đang tải xuống...');
    return videoUrl;
};

export const analyzeProductImage = async (base64Image: string, mimeType: string, language: string): Promise<Record<string, string>> => {
    const result = await callGeminiApi('analyzeProductImage', { base64Image, mimeType, language }, 0);
    return result;
}

// --- ART STYLE STUDIO ---
export const generateArtStyleImages = async (payload: any): Promise<string[]> => {
    const { modelFile, otherFiles, styles, quality, aspect, count, userPrompt } = payload;

    const extractBase64Data = async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        return { base64, mimeType };
    };

    const modelData = await extractBase64Data(modelFile.file);
    const convertedOtherFiles: any = {};
    if (otherFiles.clothing?.file) convertedOtherFiles.clothing = await extractBase64Data(otherFiles.clothing.file);
    if (otherFiles.accessories?.file) convertedOtherFiles.accessories = await extractBase64Data(otherFiles.accessories.file);
    if (otherFiles.product?.file) convertedOtherFiles.product = await extractBase64Data(otherFiles.product.file);

    const apiPayload: ArtStylePayload = {
        modelFile: modelData,
        otherFiles: convertedOtherFiles,
        styles,
        quality,
        aspect,
        count,
        userPrompt
    };
    const unitCost = (quality === '4K' || quality === '8K') ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const totalCost = unitCost * count;
    const { images } = await callGeminiApi('generateArtStyleImages', apiPayload, totalCost);
    return images;
};

// --- BATCH GENERATOR ---
export const generateBatchImages = async (
  prompt: string,
  aspectRatio: BatchAspectRatio,
  numOutputs: number
): Promise<string[]> => {
    const totalCost = CREDIT_COSTS.STANDARD_IMAGE * numOutputs;
    const { images } = await callGeminiApi('generateBatchImages', { prompt, aspectRatio, numOutputs }, totalCost);
    return images;
};

// --- THUMBNAIL GENERATOR ---
export const generateThumbnail = async ({
    modelImage,
    refImage,
    inputs,
    ratio
}: {
    modelImage: string;
    refImage: string | null;
    inputs: ThumbnailInputs;
    ratio: ThumbnailRatio;
}): Promise<{ image?: string; error?: string; }> => {
    return callGeminiApi('generateThumbnail', { modelImage, refImage, inputs, ratio }, CREDIT_COSTS.STANDARD_IMAGE);
};

// --- OUTFIT EDITOR ---
export const detectOutfit = async (base64Image: string, mimeType: string): Promise<string> => {
    const { outfit } = await callGeminiApi('detectOutfit', { base64Image, mimeType }, 0);
    return outfit;
};

export const editOutfitOnImage = async (base64Image: string, mimeType: string, newOutfitPrompt: string): Promise<string> => {
    const { imageData } = await callGeminiApi('editOutfitOnImage', { base64Image, mimeType, newOutfitPrompt }, CREDIT_COSTS.STANDARD_IMAGE);
    return imageData;
};

export const generateVideoFromImage = async (
    base64Image: string | null,
    prompt: string,
    setProgress: (message: string) => void,
    characterImages?: string[],
    settings?: any
): Promise<string> => {
    setProgress('Đang kết nối máy chủ Veo (Video Gen)...');
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
    const { videoUrl, error } = await callGeminiApi('generateVeoVideo', payload, CREDIT_COSTS.VIDEO_GENERATION);
    if (error) throw new Error(error);
    setProgress('Video đã tạo xong! Đang tải...'); 
    return videoUrl;
};

export const enhanceVideoPrompt = async (prompt: string, language: string = 'en'): Promise<string> => {
    const { enhancedPrompt } = await callGeminiApi('enhanceVideoPrompt', { prompt, language }, 0);
    return enhancedPrompt;
};

// --- CREATIVE STUDIO GEN ---
export const generateImagesFromFeature = async (
    featureAction: string,
    formData: Record<string, any>,
    numImages: number
): Promise<{images: string[], successCount: number}> => {
    // Serialization logic moved to creativeStudioService or handled here if needed.
    // For now, assuming direct call from creativeStudioService.ts which handles file conversion.
    // To resolve circular dependency, we implement a basic passthrough.
    return { images: [], successCount: 0 }; 
};

export const getHotTrends = async (): Promise<string[]> => {
    const { trends } = await callGeminiApi('getHotTrends', {}, 0);
    return trends;
};

export const generateVideoPrompt = async (userIdea: string, base64Image: string): Promise<{ englishPrompt: string, vietnamesePrompt: string }> => {
    const { prompts } = await callGeminiApi('generateVideoPrompt', { userIdea, base64Image }, 0);
    return prompts;
};

// --- VOICE STUDIO ---
export const generateSpeech = async (text: string, voiceId: string, language: string, baseVoice?: string, speed?: number): Promise<string> => {
    const { audioData } = await callGeminiApi('generateSpeech', { text, voiceId, language, baseVoice, speed }, CREDIT_COSTS.AUDIO_GENERATION);
    return audioData;
};

// --- MUSIC STUDIO ---
export const generateSongContent = async (settings: MusicSettings): Promise<SongStructure> => {
    return await callGeminiApi('generateSongContent', settings, 0);
};

export const generateAlbumArt = async (description: string): Promise<string> => {
    const { imageData } = await callGeminiApi('generateAlbumArt', { description }, CREDIT_COSTS.MUSIC_GENERATION);
    return imageData;
};

export const analyzeMusicAudio = async (audioFile: File): Promise<MusicAnalysisResult> => {
    const { base64, mimeType } = await fileToBase64(audioFile);
    return await callGeminiApi('analyzeMusicAudio', { base64, mimeType }, CREDIT_COSTS.MUSIC_GENERATION); // Analysis costs same as generation
};

// --- MAGIC ERASER STUDIO ---
export const removeWatermark = async (imagePart: FilePart, highQuality: boolean = false): Promise<string> => {
    const { imageData } = await callGeminiApi('removeWatermark', { imagePart, highQuality }, 0); 
    return imageData;
};

export const removeVideoWatermark = async (source: { file?: File, url?: string }, type: 'veo' | 'sora' | 'general'): Promise<{ videoUrl: string, prompt?: string }> => {
    let payload: any = { type };
    if (source.url) {
        payload.url = source.url;
    } else if (source.file) {
         payload.filename = source.file.name;
    }
    // API now returns prompt along with videoUrl
    const { videoUrl, prompt } = await callGeminiApi('removeVideoWatermark', payload, 0); 
    return { videoUrl, prompt };
};