
import type { FilePart, FamilyMember, SerializedFamilyMember } from '../types';

// GIẢM XUỐNG 1280px ĐỂ ĐẢM BẢO PAYLOAD < 4.5MB (VERCEL LIMIT)
// ĐẶC BIỆT KHI GỬI 2 ẢNH CÙNG LÚC
const MAX_DIMENSION = 1280; 

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
        // GIẢM CHẤT LƯỢNG XUỐNG 0.85 ĐỂ GIẢM DUNG LƯỢNG
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.85); 
        resolve({ dataUrl, mimeType });
      };
      img.onerror = (err) => reject(new Error(`Image load error: ${String(err)}`));
    };
    reader.onerror = (err) => reject(new Error(`File reader error: ${String(err)}`));
  });
};

// --- Added Function: fileToDataURL (Standard FileReader) ---
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToResizedDataURL = async (file: File): Promise<string> => {
    const { dataUrl } = await resizeImage(file);
    return dataUrl;
};

// --- Added Function: cropImageToAspectRatio (Basic Center Crop) ---
export const cropImageToAspectRatio = (file: File, aspectRatio: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if(!ctx) return reject(new Error("Canvas context failed"));

                let { width, height } = img;
                let cropWidth, cropHeight, x, y;

                // Calculate crop dimensions
                if (width / height > aspectRatio) {
                    // Image is wider than target
                    cropHeight = height;
                    cropWidth = height * aspectRatio;
                    x = (width - cropWidth) / 2;
                    y = 0;
                } else {
                    // Image is taller than target
                    cropWidth = width;
                    cropHeight = width / aspectRatio;
                    x = 0;
                    y = (height - cropHeight) / 2;
                }

                canvas.width = cropWidth;
                canvas.height = cropHeight;
                ctx.drawImage(img, x, y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                resolve(canvas.toDataURL(file.type));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
    });
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

export const serializeFamilyMembers = async (members: FamilyMember[]): Promise<SerializedFamilyMember[]> => {
    return Promise.all(members.map(async (member, index) => {
        if (!member.photo) {
            throw new Error(`Thành viên ${index + 1} thiếu ảnh.`);
        }
        const { base64, mimeType } = await fileToBase64(member.photo);
        return {
            id: member.id,
            age: member.age,
            photo: { base64, mimeType },
            bodyDescription: member.bodyDescription,
            outfit: member.outfit,
            pose: member.pose,
        };
    }));
};
