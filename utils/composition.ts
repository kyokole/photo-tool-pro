import { ASPECT_RATIO_MAP } from '../constants';
import type { AspectRatio } from '../types';

/**
 * Programmatically crops an image to a specified aspect ratio.
 * This function ensures a deterministic, pixel-perfect crop, taking control away from the AI.
 * It uses a "cover" strategy, ensuring the cropped area fills the target aspect ratio
 * without leaving empty space, and then centers the result.
 * @param imageSrc The source image data URL, expected to have padding.
 * @param aspectRatio The target aspect ratio (e.g., '3x4', '5x5').
 * @returns A promise that resolves with the data URL of the cropped image.
 */
export const smartCrop = (imageSrc: string, aspectRatio: AspectRatio): Promise<string> => {
    return new Promise((resolve, reject) => {
        const targetRatio = ASPECT_RATIO_MAP[aspectRatio];
        if (!targetRatio) {
            return reject(new Error(`Invalid aspect ratio provided: ${aspectRatio}`));
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Could not create canvas context"));
            }

            let srcX = 0;
            let srcY = 0;
            let srcWidth = img.width;
            let srcHeight = img.height;
            const sourceRatio = img.width / img.height;

            // Determine the dimensions of the crop area from the source image
            if (sourceRatio > targetRatio) {
                // Source is wider than target, so crop the sides
                srcHeight = img.height;
                srcWidth = srcHeight * targetRatio;
                srcX = (img.width - srcWidth) / 2;
                srcY = 0;
            } else {
                // Source is taller than target, so crop the top and bottom
                srcWidth = img.width;
                srcHeight = srcWidth / targetRatio;
                srcX = 0;
                srcY = (img.height - srcHeight) / 2;
            }
            
            // Set canvas dimensions to the crop dimensions
            canvas.width = srcWidth;
            canvas.height = srcHeight;
            
            // Draw the cropped portion of the source image onto the canvas
            ctx.drawImage(
                img,
                srcX,
                srcY,
                srcWidth,
                srcHeight,
                0, // Destination X
                0, // Destination Y
                srcWidth, // Destination Width
                srcHeight // Destination Height
            );

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error("Failed to load image for cropping."));
        };
        img.src = imageSrc;
    });
};
