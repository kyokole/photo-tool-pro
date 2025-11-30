
// services/geminiService.ts
import { getAuthInstance, getDbInstance, deductUserCredits, refundUserCredits } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Settings, FilePart, FashionStudioSettings, ThumbnailInputs, ThumbnailRatio, BatchAspectRatio, Scene, RestorationOptions, DocumentRestorationOptions, BeautyFeature, BeautySubFeature, BeautyStyle, SerializedFamilyStudioSettings, FamilyStudioResult, MarketingProduct, MarketingSettings, MarketingResult, ArtStylePayload } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { CREDIT_COSTS } from '../constants';

/**
 * A generic API client to communicate with our own Vercel Serverless Function backend.
 * This function acts as a secure proxy for all Gemini API calls.
 * Includes user authentication, VIP status verification, and ROBUST CLIENT-SIDE BILLING.
 */
export const callGeminiApi = async (action: string, payload: any, creditCost: number = 0): Promise<any> => {
    const auth = getAuthInstance();
    const db = getDbInstance();
    const user = auth.currentUser;
    
    let idToken: string | null = null;
    let clientVipStatus = false;
    let isPaid = false;
    let creditsDeducted = false; // Cờ quan trọng: để biết đã thực sự trừ tiền hay chưa

    if (user) {
        try {
            // 1. Get ID Token
            idToken = await user.getIdToken(false);

            // 2. CHECK VIP STATUS & DEDUCT CREDITS (CLIENT SIDE)
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const isAdmin = userData?.isAdmin === true;
                const expiryDate = new Date(userData?.subscriptionEndDate || 0);
                const isVip = isAdmin || (expiryDate > new Date());
                clientVipStatus = isVip;

                // --- LOGIC BILLING THÔNG MINH ---
                if (!isVip && creditCost > 0) {
                    // Trừ tiền TRƯỚC khi gọi API (Optimistic)
                    await deductUserCredits(creditCost);
                    isPaid = true; 
                    creditsDeducted = true; // Đánh dấu đã trừ tiền
                } else if (isVip) {
                    isPaid = true; // VIP luôn được tính là đã thanh toán
                }
            }
        } catch (error: any) {
            console.error("Error processing user/credits:", error);
            if (error.message === "INSUFFICIENT_CREDITS") {
                throw new Error("insufficient credits"); 
            }
            // Các lỗi khác thì vẫn cho gọi API nhưng server sẽ đóng dấu watermark
        }
    }

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action, 
                payload: { ...payload, isPaid }, // Gửi cờ 'isPaid' để Server biết bỏ watermark
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
        // --- CƠ CHẾ HOÀN TIỀN TỰ ĐỘNG (AUTO-REFUND) ---
        // Nếu đã trừ tiền mà API lỗi (bất kể lỗi gì: mạng, server 500, AI lỗi), hoàn lại tiền ngay.
        if (creditsDeducted) {
            console.warn(`[Billing] API Call Failed. Initiating Refund of ${creditCost} credits.`);
            await refundUserCredits(creditCost).catch(err => console.error("FATAL: Refund failed", err));
            // Có thể thêm thông báo vào error message để UI hiển thị cho người dùng biết họ đã được hoàn tiền
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
    // Tính phí: Ảnh thẻ tiêu chuẩn 2, Chất lượng cao 5
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    
    const { imageData } = await callGeminiApi('generateIdPhoto', { originalImage, settings, outfitImagePart }, cost);
    return imageData;
};

// --- Headshot Generator ---
export const generateHeadshot = async (imagePart: FilePart, prompt: string, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');
    // Headshot tạo 4 ảnh. Nếu prompt chứa [QUALITY: 4K] thì là giá cao.
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
// Legacy 1-pass
export const generateFamilyPhoto = async (settings: Omit<SerializedFamilyStudioSettings, 'rois'>, setProgress: (message: string) => void): Promise<string> => {
    setProgress('Đang gửi yêu cầu tạo ảnh gia đình...');
    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const { imageData } = await callGeminiApi('generateFamilyPhoto', { settings }, cost);
    return imageData;
};

// 3-pass method
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
    // Beauty studio costs standard unless implicit high quality logic (currently standard)
    // Assuming standard for basic tools
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
    const { text } = await callGeminiApi('generateMarketingAdCopy', { product, imagePart, language }, 0); // Free
    return text;
};

export const generateMarketingVideoScript = async (product: Record<string, string>, tone: string, angle: string, imagePart?: FilePart, language: string = 'vi'): Promise<string> => {
    const { text } = await callGeminiApi('generateMarketingVideoScript', { product, tone, angle, imagePart, language }, 0); // Free
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
    // Video is expensive
    const { videoUrl } = await callGeminiApi('generateVeoVideo', { base64Image, prompt: script }, CREDIT_COSTS.VIDEO_GENERATION);
    setProgress('Video đã hoàn tất! Đang tải xuống...');
    return videoUrl;
};

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

    // Calculate cost based on quantity and quality
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
    // Batch is VIP only usually, but if cost applies:
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
    // Standard cost for thumbnail
    return callGeminiApi('generateThumbnail', { modelImage, refImage, inputs, ratio }, CREDIT_COSTS.STANDARD_IMAGE);
};

// --- OUTFIT EDITOR ---
export const detectOutfit = async (base64Image: string, mimeType: string): Promise<string> => {
    const { outfit } = await callGeminiApi('detectOutfit', { base64Image, mimeType }, 0); // Free
    return outfit;
};

export const editOutfitOnImage = async (base64Image: string, mimeType: string, newOutfitPrompt: string): Promise<string> => {
    // Edit cost
    const { imageData } = await callGeminiApi('editOutfitOnImage', { base64Image, mimeType, newOutfitPrompt }, CREDIT_COSTS.STANDARD_IMAGE);
    return imageData;
};

export const generateVideoFromImage = async (
    base64Image: string,
    prompt: string,
    setProgress: (message: string) => void
): Promise<string> => {
    setProgress('Đang kết nối máy chủ Veo (Video Gen)...');
    const { videoUrl, error } = await callGeminiApi('generateVeoVideo', { base64Image, prompt }, CREDIT_COSTS.VIDEO_GENERATION);
    if (error) throw new Error(error);
    setProgress('Video đã tạo xong! Đang tải...'); 
    return videoUrl;
};

// --- CREATIVE STUDIO GEN ---
export const generateImagesFromFeature = async (
    featureAction: string,
    formData: Record<string, any>,
    numImages: number
): Promise<{images: string[], successCount: number}> => {
    
    // Serializer helper
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
                if(value.file instanceof File) {
                    const { base64, mimeType } = await fileToBase64(value.file);
                    serializedData[key] = { ...value, file: { base64, mimeType } };
                } else {
                    serializedData[key] = value;
                }
            } else if (Array.isArray(value) && value.some(item => typeof item === 'object' && item !== null && 'file' in item)) {
                 serializedData[key] = await Promise.all(value.map(async item => {
                    if (item.file instanceof File) {
                        const { base64, mimeType } = await fileToBase64(item.file);
                        return { ...item, file: { base64, mimeType } };
                    }
                    return item;
                }));
            } else {
                serializedData[key] = value;
            }
        }
        return serializedData;
    };

    const serializedFormData = await serializeFiles(formData);
    
    const isHQ = formData.highQuality || formData.quality === 'high' || formData.quality === 'ultra';
    const unitCost = isHQ ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const totalCost = unitCost * numImages;

    const { images, successCount } = await callGeminiApi('generateImagesFromFeature', {
        featureAction,
        formData: serializedFormData,
        numImages,
    }, totalCost);
    return { images, successCount };
};

export const getHotTrends = async (): Promise<string[]> => {
    const { trends } = await callGeminiApi('getHotTrends', {}, 0);
    return trends;
};

export const generateVideoPrompt = async (userIdea: string, base64Image: string): Promise<{ englishPrompt: string, vietnamesePrompt: string }> => {
    const { prompts } = await callGeminiApi('generateVideoPrompt', { userIdea, base64Image }, 0);
    return prompts;
};

// --- VOICE STUDIO (NEW) ---
export const generateSpeech = async (text: string, voiceId: string, language: string): Promise<string> => {
    const { audioData } = await callGeminiApi('generateSpeech', { text, voiceId, language }, CREDIT_COSTS.AUDIO_GENERATION);
    return audioData;
};
