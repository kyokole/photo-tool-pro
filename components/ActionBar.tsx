import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PrintLayout, AspectRatio, PaperBackground } from '../types';
import { generatePrintSheet, dataUrlToBlob, smartDownload, canvasToBlobSafe, extToMime } from '../utils/canvasUtils';

interface ActionBarProps {
    zoom: number;
    setZoom: (zoom: number) => void;
    rotation: number;
    setRotation: (rotation: number) => void;
    processedImage: string | null;
    isPanelVisible: boolean;
    setIsPanelVisible: (visible: boolean) => void;
    printLayout: PrintLayout;
    aspectRatio: AspectRatio;
    paperBackground: PaperBackground;
}

const ActionBar: React.FC<ActionBarProps> = ({ zoom, setZoom, rotation, setRotation, processedImage, isPanelVisible, setIsPanelVisible, printLayout, aspectRatio, paperBackground }) => {
    const { t } = useTranslation();
    const [isDownloadMenuOpen, setDownloadMenuOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // State and refs for interactive sliders
    const [isZooming, setIsZooming] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const zoomSliderRef = useRef<HTMLInputElement>(null);
    const rotationSliderRef = useRef<HTMLInputElement>(null);

    const updateSliderProgress = (sliderRef: React.RefObject<HTMLInputElement>, value: number, min: number, max: number) => {
        if (sliderRef.current) {
            const percentage = ((value - min) / (max - min)) * 100;
            sliderRef.current.style.setProperty('--progress-percent', `${percentage}%`);
        }
    };
    
    useEffect(() => {
        updateSliderProgress(zoomSliderRef, zoom, 0.2, 3);
    }, [zoom]);

    useEffect(() => {
        updateSliderProgress(rotationSliderRef, rotation, -180, 180);
    }, [rotation]);


    const handleDownload = async (format: 'png' | 'jpeg') => {
        if (!processedImage) {
            alert(t('errors.noResultToExport'));
            return;
        }
        setIsGenerating(true);
        try {
            const fileExt = format;
            const mime = extToMime(format);
            let blob: Blob;
            let filename: string;

            if (printLayout !== 'none') {
                const dataUrl = await generatePrintSheet(processedImage, printLayout, aspectRatio, paperBackground, mime);
                blob = dataUrlToBlob(dataUrl);
                filename = `in-${printLayout}-${aspectRatio}.${fileExt}`;
            } else {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error(t('errors.canvasContextError'));

                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error(t('errors.loadImageError')));
                    image.src = processedImage;
                });
                
                const angleRad = rotation * Math.PI / 180;
                const cos = Math.abs(Math.cos(angleRad));
                const sin = Math.abs(Math.sin(angleRad));
                const newWidth = img.width * cos + img.height * sin;
                const newHeight = img.width * sin + img.height * cos;

                canvas.width = newWidth;
                canvas.height = newHeight;
                
                ctx.translate(newWidth / 2, newHeight / 2);
                ctx.rotate(angleRad);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                
                blob = await canvasToBlobSafe(canvas, mime, 0.95);
                filename = `anh-the-pro-${aspectRatio}.${fileExt}`;
            }
            if (blob.size === 0) throw new Error(t('errors.fileCreationError'));
            
            const url = URL.createObjectURL(blob);
            smartDownload(url, filename);
            setTimeout(() => URL.revokeObjectURL(url), 100);

        } catch (error) {
            const msg = error instanceof Error ? error.message : t('errors.unknownError');
            alert(t('errors.downloadFailed', { error: msg }));
        } finally {
            setIsGenerating(false);
            setDownloadMenuOpen(false);
        }
    }
    
    const handleShare = async () => {
        // Share functionality remains unchanged
        if (!processedImage) return;
        try {
            const blob = dataUrlToBlob(processedImage);
            const file = new File([blob], `anh-the-pro-${aspectRatio}.png`, { type: blob.type });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: 'Ảnh thẻ PRO', files: [file] });
            } else if (navigator.clipboard?.write) {
                 await navigator.clipboard.write([ new ClipboardItem({ [blob.type]: blob }) ]);
                alert(t('actionBar.copiedToClipboard'));
            }
        } catch (error) {
             if (error instanceof Error && error.name !== 'AbortError') alert(t('errors.shareFailed', { error: error.message }));
        }
    };

    const handlePrint = async () => {
        if (!processedImage) return;
        let printWindow: Window | null = null;
    
        try {
            // Open the window immediately on user click to avoid popup blockers
            printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!printWindow) {
                throw new Error(t('errors.popupBlocked'));
            }
    
            const doc = printWindow.document;
            doc.open();
            // Write a placeholder/loader first
            doc.write(`
                <html>
                    <head>
                        <title>${t('actionBar.printTitle')}</title>
                        <style>
                            body { margin: 0; background-color: #333; display: grid; place-items: center; color: white; font-family: sans-serif; height: 100vh; }
                            img { max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 0 20px rgba(0,0,0,0.5); display: none; }
                            .loader { font-size: 1.5rem; }
                        </style>
                    </head>
                    <body>
                        <div class="loader">${t('common.processing')}</div>
                        <img id="print-image" />
                    </body>
                </html>
            `);
            doc.close();
    
            // Now, do the async work to generate the print sheet
            const printContentUrl = printLayout !== 'none'
                ? await generatePrintSheet(processedImage, printLayout, aspectRatio, paperBackground, 'image/png')
                : processedImage;
            
            // Get the image element in the new window and set its src
            const imgElement = doc.getElementById('print-image') as HTMLImageElement;
            if (imgElement) {
                const loaderElement = doc.querySelector('.loader');
                if (loaderElement) (loaderElement as HTMLElement).style.display = 'none';
    
                imgElement.style.display = 'block';
                imgElement.onload = () => {
                    printWindow?.focus();
                    printWindow?.print();
                };
                imgElement.src = printContentUrl;
            } else {
                // Fallback if the element isn't found
                doc.body.innerHTML = `<img src="${printContentUrl}" onload="window.print()" />`;
            }
    
        } catch (error) {
            console.error("Print failed:", error);
            alert(`${t('errors.printPrepareFailed')} ${error instanceof Error ? error.message : ''}`);
            if (printWindow) {
                try { printWindow.close(); } catch(e) {}
            }
        }
    };

    const handleRotationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            // Clamp value between -180 and 180 to match slider range
            const clampedValue = Math.max(-180, Math.min(180, value));
            setRotation(clampedValue);
        } else if (e.target.value === '') {
            setRotation(0); // Or handle empty state as you see fit
        }
    };
    
    return (
        <div className="bg-[var(--bg-component)] border-t border-[var(--border-color)] p-2 flex items-center justify-between flex-shrink-0 flex-wrap gap-4">
            {/* View Controls */}
            <div className="flex items-center space-x-4 flex-grow">
                <div className="flex items-center space-x-2 text-[var(--text-secondary)] min-w-[180px]" title={t('actionBar.zoomTooltip')}>
                    <i className="fas fa-search-plus"></i>
                    <div className="relative w-full">
                        <input
                            ref={zoomSliderRef}
                            type="range"
                            min="0.2"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onMouseDown={() => setIsZooming(true)}
                            onMouseUp={() => setIsZooming(false)}
                            onTouchStart={() => setIsZooming(true)}
                            onTouchEnd={() => setIsZooming(false)}
                            onChange={e => setZoom(parseFloat(e.target.value))}
                            className="custom-slider w-full"
                        />
                         <div className={`slider-tooltip ${isZooming ? 'slider-tooltip-visible' : ''}`}>{Math.round(zoom * 100)}%</div>
                    </div>
                    <span className="text-sm font-mono w-12 text-center text-[var(--text-primary)]">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center space-x-2 text-[var(--text-secondary)] min-w-[180px]" title={t('actionBar.rotateTooltip')}>
                    <i className="fas fa-sync-alt"></i>
                    <div className="relative w-full">
                        <input
                            ref={rotationSliderRef}
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={rotation}
                             onMouseDown={() => setIsRotating(true)}
                            onMouseUp={() => setIsRotating(false)}
                            onTouchStart={() => setIsRotating(true)}
                            onTouchEnd={() => setIsRotating(false)}
                            onChange={e => setRotation(parseInt(e.target.value, 10))}
                            className="custom-slider w-full"
                        />
                        <div className={`slider-tooltip ${isRotating ? 'slider-tooltip-visible' : ''}`}>{rotation}°</div>
                    </div>
                    <div className="flex items-center justify-center w-16 text-center bg-black/20 rounded-md px-1">
                        <input
                            type="number"
                            min="-180"
                            max="180"
                            value={rotation}
                            onChange={handleRotationInputChange}
                            className="w-12 text-sm font-mono text-center bg-transparent appearance-none outline-none text-[var(--text-primary)]"
                            style={{ MozAppearance: 'textfield' }}
                        />
                        <span className="text-sm font-mono text-[var(--text-secondary)]">°</span>
                    </div>
                </div>
                <button onClick={() => { setZoom(1); setRotation(0); }} className="w-8 h-8 bg-white/5 rounded-md hover:bg-white/10 flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('actionBar.resetViewTooltip')}>
                    <i className="fas fa-undo"></i>
                </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
                <button onClick={handlePrint} disabled={!processedImage} className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-md flex items-center transition-colors">
                    <i className="fas fa-print mr-2"></i> {t('actionBar.print')}
                </button>
                <div className="relative">
                    <button onClick={() => setDownloadMenuOpen(prev => !prev)} disabled={!processedImage || isGenerating} className="btn-gradient text-white font-bold py-2 px-4 rounded-md flex items-center min-w-[120px] justify-center disabled:opacity-50">
                       {isGenerating ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : <><i className="fas fa-download mr-2"></i> {t('actionBar.download')}</>}
                    </button>
                    {isDownloadMenuOpen && (
                        <div className="absolute bottom-full mb-2 w-48 bg-[var(--bg-component-light)] rounded-md shadow-lg right-0 z-10 border border-[var(--border-color)] animate-fade-in" onMouseLeave={() => setDownloadMenuOpen(false)}>
                            <button onClick={() => handleDownload('png')} className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-white/10 rounded-t-md">{t('actionBar.png')}</button>
                            <button onClick={() => handleDownload('jpeg')} className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-white/10 rounded-b-md">{t('actionBar.jpeg')}</button>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsPanelVisible(!isPanelVisible)} className="w-8 h-8 bg-white/5 rounded-md hover:bg-white/10 hidden md:flex items-center justify-center" title={isPanelVisible ? t('actionBar.hidePanel') : t('actionBar.showPanel')}>
                    <i className={`fas ${isPanelVisible ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                </button>
            </div>
        </div>
    );
};

export default ActionBar;
