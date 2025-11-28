
import type { PrintLayout, AspectRatio, PaperBackground, LayoutResult } from '../types';

// --- Types ---
export type CanvasMime = 'image/png' | 'image/jpeg';

export type FixedCountMap = { cols:number; rows:number };
// LayoutResult is now imported from ../types.ts to avoid circular dependency

// --- Constants ---
export const DPI = 300;
export const MM_PER_INCH = 25.4;

export const PASS_RATIO: Record<AspectRatio, number> = { '2x3':2/3, '3x4':3/4, '4x6':2/3, '5x5':1 };
export const PAPER_MM: Record<Exclude<PrintLayout, 'none'>, {w:number,h:number}> = {
  '10x15':{w:100,h:150}, '13x18':{w:130,h:180}, '20x30':{w:200,h:300}
};

export const PHOTO_SIZES_MM: Record<AspectRatio, {width:number, height:number}> = {
    '2x3': { width: 20, height: 30 },
    '3x4': { width: 30, height: 40 },
    '4x6': { width: 40, height: 60 },
    '5x5': { width: 50, height: 50 },
};

// --- Core Utility Functions ---

export const mm2px = (mm: number) => Math.round((mm / MM_PER_INCH) * DPI);

export const smartDownload = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- CLIENT-SIDE WATERMARKING FUNCTION (IMPROVED) ---
/**
 * Applies a professional, tiled watermark pattern programmatically.
 * This ensures visibility on all backgrounds and prevents cropping.
 */
export const applyWatermark = (baseImageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    console.error('Failed to get canvas context');
                    resolve(baseImageSrc);
                    return;
                }

                // 1. Draw Original Image
                ctx.drawImage(img, 0, 0);

                // 2. Configure Watermark Style
                // Dynamic font size based on image width
                const fontSize = Math.max(24, Math.floor(canvas.width * 0.04)); 
                const text = "AI PHOTO SUITE • PREVIEW";
                ctx.font = `900 ${fontSize}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // 3. Create Tiled Pattern
                // We rotate the context to draw diagonal text
                ctx.save();
                
                // Calculate grid spacing
                const stepX = canvas.width * 0.6; // Horizontal spacing
                const stepY = canvas.height * 0.3; // Vertical spacing
                
                // Rotate 30 degrees
                const angle = -30 * Math.PI / 180;
                ctx.rotate(angle);

                // Draw text in a grid that covers the rotated canvas
                // We extend the loop range because rotation moves coordinates out of view
                for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                    for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                        // Shadow/Stroke for contrast (Black)
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
                        ctx.strokeText(text, x, y);

                        // Main Text (White transparent)
                        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
                        ctx.fillText(text, x, y);
                    }
                }
                
                ctx.restore();

                // 4. Add a Main Center Logo (Optional, for strong branding)
                const centerSize = Math.max(40, Math.floor(canvas.width * 0.08));
                ctx.font = `900 ${centerSize}px 'Exo 2', sans-serif`;
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
                ctx.lineWidth = 2;
                ctx.textAlign = "center";
                
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                ctx.strokeText("AI PHOTO SUITE", centerX, centerY);
                ctx.fillText("AI PHOTO SUITE", centerX, centerY);

                // 5. Export
                resolve(canvas.toDataURL('image/jpeg', 0.95));

            } catch (e) {
                console.error("Watermark error:", e);
                resolve(baseImageSrc); // Fallback to original if canvas fails
            }
        };

        img.onerror = () => {
            console.error("Failed to load image for watermarking");
            resolve(baseImageSrc);
        };

        img.src = baseImageSrc;
    });
};


// --- Layout Engine ---

/**
 * Calculates how many photos fit.
 * Standard: 2mm gap.
 */
export function getFixedCount(paper: Exclude<PrintLayout, 'none'>, ratio: AspectRatio): FixedCountMap {
    const paperDim = PAPER_MM[paper]; 
    const photoDim = PHOTO_SIZES_MM[ratio];
    const gap = 2; // 2mm gap

    // Calculation: (PhotoW + Gap) * Cols - Gap <= PaperW
    // Cols <= (PaperW + Gap) / (PhotoW + Gap)
    
    const cols = Math.floor((paperDim.w + gap) / (photoDim.width + gap));
    const rows = Math.floor((paperDim.h + gap) / (photoDim.height + gap));

    // Fallback to 1 if dimensions are somehow flipped or weird, though standard sizes shouldn't fail.
    return { cols: Math.max(1, cols), rows: Math.max(1, rows) };
}


function calculateLayout({ pageW, pageH, passRatio, paper, minPad, minGap, ratio }: {
  pageW: number; pageH: number; passRatio: number; paper: Exclude<PrintLayout, 'none'>; minPad: number; minGap: number; ratio: AspectRatio;
}): LayoutResult {
    // 1. EXACT DIMENSIONS: Calculate cell size based on strict millimeter definition
    // This ensures 3x4 is exactly 30mm x 40mm, not "fit to page".
    const photoDimMM = PHOTO_SIZES_MM[ratio];
    const cellW = mm2px(photoDimMM.width);
    const cellH = mm2px(photoDimMM.height);

    // 2. Get grid capacity
    const { cols, rows } = getFixedCount(paper, ratio);

    // 3. Calculate total grid size
    const totalGridW = cols * cellW + (cols - 1) * minGap;
    const totalGridH = rows * cellH + (rows - 1) * minGap;

    // 4. Center the grid on the page
    const padX = Math.floor((pageW - totalGridW) / 2);
    const padY = Math.floor((pageH - totalGridH) / 2);

    // Guard against negative padding (though getFixedCount should prevent this)
    const safePadX = Math.max(0, padX);
    const safePadY = Math.max(0, padY);

    return { 
        cols, 
        rows, 
        cellW, 
        cellH, 
        gap: minGap, 
        padX: safePadX, 
        padY: safePadY, 
        x0: safePadX, 
        y0: safePadY 
    };
}


// --- Canvas Generation Functions ---

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

/**
 * Draws image with crop fit (cover) inside the destination rect.
 * This ensures the photo fills the ID card slot completely, cropping excess edges.
 */
const drawImageWithCrop = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number
) => {
    const sourceRatio = img.width / img.height;
    const destRatio = dWidth / dHeight;
    let sx, sy, sWidth, sHeight;

    if (sourceRatio > destRatio) {
        // Source is wider than destination -> Crop width (left/right)
        sHeight = img.height;
        sWidth = sHeight * destRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        // Source is taller than destination -> Crop height (top/bottom)
        sWidth = img.width;
        sHeight = sWidth / destRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
};


export const generatePaperPreview = (
    imageSrc: string,
    printLayout: PrintLayout,
    aspectRatio: AspectRatio,
    paperBackground: PaperBackground,
    previewTargetWidth: number = 800,
): Promise<{ dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        if (printLayout === 'none' || !imageSrc) {
            return reject(new Error("Dữ liệu không hợp lệ để tạo xem trước."));
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const paperConfig = PAPER_MM[printLayout];
                const paperRatio = paperConfig.w / paperConfig.h;

                const previewW = previewTargetWidth;
                const previewH = previewTargetWidth / paperRatio;

                // Determine pixels per mm for this preview scale
                const previewMM2PX = (mm: number) => (mm / paperConfig.w) * previewW;

                // Calculate layout using preview scale units
                const photoDimMM = PHOTO_SIZES_MM[aspectRatio];
                const cellW = Math.round(previewMM2PX(photoDimMM.width));
                const cellH = Math.round(previewMM2PX(photoDimMM.height));
                const minGap = Math.round(previewMM2PX(2)); // 2mm gap

                const { cols, rows } = getFixedCount(printLayout, aspectRatio);
                
                const totalGridW = cols * cellW + (cols - 1) * minGap;
                const totalGridH = rows * cellH + (rows - 1) * minGap;
                const padX = Math.floor((previewW - totalGridW) / 2);
                const padY = Math.floor((previewH - totalGridH) / 2);

                const canvas = document.createElement('canvas');
                canvas.width = previewW;
                canvas.height = previewH;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Không thể tạo context cho canvas."));
                
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetY = 5;
                ctx.fillStyle = paperBackground;
                drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 8);
                ctx.fill();
                ctx.restore();
                
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const x = padX + c * (cellW + minGap);
                        const y = padY + r * (cellH + minGap);
                        
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x, y, cellW, cellH);
                        
                        // Use Smart Crop (Cover) for preview as well
                        drawImageWithCrop(ctx, img, x, y, cellW, cellH);
                    }
                }
                
                resolve({ dataUrl: canvas.toDataURL('image/png') });
            } catch(e) {
                 console.error("Error in generatePaperPreview:", e);
                 reject(e);
            }
        };
        img.onerror = () => reject(new Error("Không thể tải ảnh nguồn để tạo xem trước."));
        img.src = imageSrc;
    });
};

export const generatePrintSheet = (
    imageSrc: string,
    printLayout: PrintLayout,
    aspectRatio: AspectRatio,
    paperBackground: PaperBackground,
    outputFormat: CanvasMime = 'image/jpeg'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (printLayout === 'none' || !imageSrc) {
            return reject(new Error("Dữ liệu không hợp lệ để tạo trang in."));
        }
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const paperConfig = PAPER_MM[printLayout];
                const pageW_px = mm2px(paperConfig.w);
                const pageH_px = mm2px(paperConfig.h);
                const gap_px = mm2px(2); // 2mm gap standard

                // Use strict layout calculation
                const layout = calculateLayout({
                    pageW: pageW_px,
                    pageH: pageH_px,
                    passRatio: PASS_RATIO[aspectRatio],
                    paper: printLayout,
                    minPad: 0, // Pad calculated internally by centering
                    minGap: gap_px,
                    ratio: aspectRatio,
                });
                
                console.log("Export Layout:", { mode: aspectRatio, ...layout });

                const canvas = document.createElement('canvas');
                canvas.width = pageW_px;
                canvas.height = pageH_px;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Không thể tạo context cho canvas."));

                ctx.fillStyle = paperBackground;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                for (let r = 0; r < layout.rows; r++) {
                    for (let c = 0; c < layout.cols; c++) {
                        const x = layout.x0 + c * (layout.cellW + layout.gap);
                        const y = layout.y0 + r * (layout.cellH + layout.gap);
                        
                        // Use Smart Crop (Cover) logic here
                        // This ensures if the AI generated a square image, it fills the 3x4 slot perfectly
                        drawImageWithCrop(ctx, img, x, y, layout.cellW, layout.cellH);
                    }
                }
                
                const quality = outputFormat === 'image/jpeg' ? 0.95 : undefined;
                resolve(canvas.toDataURL(outputFormat, quality));
            } catch(e) {
                 console.error("An unexpected error occurred in generatePrintSheet:", e);
                 const message = e instanceof Error ? e.message : "Lỗi không xác định";
                 reject(new Error(`Đã xảy ra lỗi khi tạo trang in: ${message}`));
            }
        };
        img.onerror = () => reject(new Error("Không thể tải ảnh nguồn để xử lý."));
        img.src = imageSrc;
    });
};

// --- File/Blob Utilities ---

export function dataUrlToBlob(dataURL: string): Blob {
  try {
    const parts = dataURL.split(',');
    if (parts.length < 2) throw new Error('Invalid DataURL');
    const header = parts[0];
    const base64 = parts[1];
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch (e) {
    console.error("Failed to convert data URL to blob", e);
    return new Blob([], { type: 'application/octet-stream' });
  }
}

export function extToMime(ext:'png'|'jpg'|'jpeg'): CanvasMime {
  return ext==='png' ? 'image/png' : 'image/jpeg';
}

export function canvasToBlobSafe(
  canvas: HTMLCanvasElement,
  mime: CanvasMime,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) return resolve(blob);
        // Fallback via dataURL if toBlob returns null
        console.warn("canvas.toBlob() returned null, falling back to dataURL conversion.");
        const dataURL = canvas.toDataURL(mime, quality);
        return resolve(dataUrlToBlob(dataURL));
      }, mime, quality);
    } catch(e) {
      // Fallback in case toBlob throws an error (e.g., security restrictions)
      console.error("canvas.toBlob() threw an error, falling back to dataURL conversion.", e);
      try {
        const dataURL = canvas.toDataURL(mime, quality);
        resolve(dataUrlToBlob(dataURL));
      } catch (e2) {
        console.error("Complete failure to convert canvas to blob.", e2);
        resolve(new Blob([], { type: mime }));
      }
    }
  });
}
