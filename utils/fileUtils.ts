import type { FilePart } from '../types';

const MAX_DIMENSION = 4096; // Max width or height for the image

// New resizing utility
const resizeImage = (file: File): Promise<{ dataUrl: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('File could not be read.'));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG for compression. Gemini handles JPEG fine.
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95); // 95% quality
        resolve({ dataUrl, mimeType });
      };
      img.onerror = (err) => reject(new Error(`Image load error: ${String(err)}`));
    };
    reader.onerror = (err) => reject(new Error(`File reader error: ${String(err)}`));
  });
};

export const fileToResizedDataURL = async (file: File): Promise<string> => {
    const { dataUrl } = await resizeImage(file);
    return dataUrl;
};


export const fileToGenerativePart = async (file: File): Promise<FilePart | null> => {
  try {
    const { dataUrl, mimeType } = await resizeImage(file);
    const base64Data = dataUrl.split(',')[1];
    if (base64Data) {
      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };
    }
    return null;
  } catch (error) {
    console.error("Error resizing and converting file to GenerativePart:", error);
    return null;
  }
};

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise(async (resolve, reject) => {
    try {
        const { dataUrl, mimeType } = await resizeImage(file);
        const base64 = dataUrl.split(',')[1];
        if (base64) {
            resolve({ base64, mimeType });
        } else {
            reject(new Error("Failed to parse resized file data."));
        }
    } catch (error) {
        console.error("Error resizing and converting file to Base64:", error);
        reject(error);
    }
  });
}