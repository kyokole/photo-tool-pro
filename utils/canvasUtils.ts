import type { PrintLayout, AspectRatio, PaperBackground } from '../types';

// --- Types ---
export type CanvasMime = 'image/png' | 'image/jpeg';

export type FixedCountMap = { cols:number; rows:number };
export interface LayoutResult {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  padX: number;
  padY: number;
  gap: number;
  x0: number;
  y0: number;
}

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

const isMobile = (): boolean => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const smartDownload = (imageUrl: string, fileName: string) => {
    if (isMobile()) {
        // On mobile, the best UX is to open the image in a new tab.
        // This allows the user to long-press and use the native "Save to Photos" functionality.
        window.open(imageUrl, '_blank');
    } else {
        // On desktop, we can force a direct download.
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// --- Layout Engine ---

/**
 * Calculates how many photos of a given aspect ratio can fit onto a specific paper size.
 * This is a dynamic calculation based on physical dimensions.
 */
export function getFixedCount(paper: Exclude<PrintLayout, 'none'>, ratio: AspectRatio): FixedCountMap {
    const paperDim = PAPER_MM[paper]; // e.g., {w: 100, h: 150}
    const photoDim = PHOTO_SIZES_MM[ratio]; // e.g., {width: 50, height: 50}
    const gap = 2; // A 2mm gap between photos for easier cutting.

    // Total width used by 'n' columns = (n * photo_width) + ((n - 1) * gap)
    // To find 'n', we can rearrange: n * (photo_width + gap) - gap <= paper_width
    // So, n <= (paper_width + gap) / (photo_width + gap)
    
    // We assume the paper is held in portrait orientation (e.g., 100mm wide, 150mm tall).
    // We calculate how many photos fit without rotating them.
    const cols = Math.floor((paperDim.w + gap) / (photoDim.width + gap));
    const rows = Math.floor((paperDim.h + gap) / (photoDim.height + gap));

    return { cols: Math.max(1, cols), rows: Math.max(1, rows) };
}


function calculateLayout({ pageW, pageH, passRatio, paper, minPad, minGap, ratio }: {
  pageW: number; pageH: number; passRatio: number; paper: Exclude<PrintLayout, 'none'>; minPad: number; minGap: number; ratio: AspectRatio;
}): LayoutResult {
    const { cols, rows } = getFixedCount(paper, ratio);

    const availableW = pageW - 2 * minPad - (cols - 1) * minGap;
    const availableH = pageH - 2 * minPad - (rows - 1) * minGap;

    // Calculate cell size based on width constraint
    const cellW_fromWidth = availableW / cols;
    const cellH_fromWidth = cellW_fromWidth / passRatio;

    // Calculate cell size based on height constraint
    const cellH_fromHeight = availableH / rows;
    const cellW_fromHeight = cellH_fromHeight * passRatio;

    let cellW: number, cellH: number;

    // Determine which constraint is more limiting to maintain aspect ratio
    if (cellH_fromWidth * rows <= availableH) {
        // Width is the limiting factor
        cellW = Math.floor(cellW_fromWidth);
        cellH = Math.floor(cellH_fromWidth);
    } else {
        // Height is the limiting factor
        cellH = Math.floor(cellH_fromHeight);
        cellW = Math.floor(cellW_fromHeight);
    }

    if (cellW <= 0 || cellH <= 0) {
        console.error("Layout calculation resulted in zero or negative cell size.", {cellW, cellH, pageW, pageH});
        return { cols: 0, rows: 0, cellW: 1, cellH: 1, gap: minGap, padX: minPad, padY: minPad, x0: minPad, y0: minPad };
    }
    
    // Recalculate padding to center the grid of photos
    const totalGridW = cols * cellW + (cols - 1) * minGap;
    const totalGridH = rows * cellH + (rows - 1) * minGap;
    const padX = Math.floor((pageW - totalGridW) / 2);
    const padY = Math.floor((pageH - totalGridH) / 2);

    return { cols, rows, cellW, cellH, gap: minGap, padX, padY, x0: padX, y0: padY };
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
 * Draws an image inside a destination box on a canvas, maintaining the image's aspect ratio.
 * It scales the image to fit completely within the box and centers it.
 */
const drawImageWithContain = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number
) => {
    const imgRatio = img.width / img.height;
    const destRatio = dWidth / dHeight;
    let finalWidth: number, finalHeight: number, finalX: number, finalY: number;

    if (imgRatio > destRatio) {
        // Image is wider than the destination box, so fit to width
        finalWidth = dWidth;
        finalHeight = dWidth / imgRatio;
        finalX = dx;
        finalY = dy + (dHeight - finalHeight) / 2;
    } else {
        // Image is taller than or has the same ratio as the destination box, so fit to height
        finalHeight = dHeight;
        finalWidth = dHeight * imgRatio;
        finalY = dy;
        finalX = dx + (dWidth - finalWidth) / 2;
    }

    ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
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

                const layout = calculateLayout({
                    pageW: previewW,
                    pageH: previewH,
                    passRatio: PASS_RATIO[aspectRatio],
                    paper: printLayout,
                    minPad: Math.round(previewW * 0.02),
                    minGap: Math.round(previewW * 0.015),
                    ratio: aspectRatio,
                });
                
                console.log("Preview Layout:", { mode: aspectRatio, ...layout });

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
                
                for (let r = 0; r < layout.rows; r++) {
                    for (let c = 0; c < layout.cols; c++) {
                        const x = layout.x0 + c * (layout.cellW + layout.gap);
                        const y = layout.y0 + r * (layout.cellH + layout.gap);
                        drawImageWithContain(ctx, img, x, y, layout.cellW, layout.cellH);
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
                
                const layout = calculateLayout({
                    pageW: pageW_px,
                    pageH: pageH_px,
                    passRatio: PASS_RATIO[aspectRatio],
                    paper: printLayout,
                    minPad: mm2px(4),
                    minGap: mm2px(2),
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
                        drawImageWithContain(ctx, img, x, y, layout.cellW, layout.cellH);
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
