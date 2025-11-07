import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ASPECT_RATIO_MAP } from '../constants';
import type { AspectRatio, PrintLayout, PaperBackground } from '../types';
import { generatePaperPreview } from '../utils/canvasUtils';

const paneStyles: Record<string, React.CSSProperties> = {
  containMedia: {
    width: 'auto', height: 'auto',
    maxWidth: '100%', maxHeight: '100%',
    objectFit: 'contain',
  },
};

interface ImagePanesProps {
  originalImage: string | null;
  processedImage: string | null;
  onUploadClick: () => void;
  onFileDrop: (files: FileList) => void;
  zoomLevel: number;
  rotation: number;
  aspectRatio: AspectRatio;
  printLayout: PrintLayout;
  keepOriginalFeatures: boolean;
  paperBackground: PaperBackground;
  isAiCropped: boolean;
}

const ImagePanes: React.FC<ImagePanesProps> = ({ 
    originalImage, 
    processedImage, 
    onUploadClick, 
    onFileDrop, 
    zoomLevel, 
    rotation,
    aspectRatio, 
    printLayout, 
    keepOriginalFeatures,
    paperBackground,
    isAiCropped,
}) => {
    const { t } = useTranslation();
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const resultContainerRef = useRef<HTMLDivElement>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const resultViewportRef = useRef<HTMLDivElement>(null);
    const [resultKey, setResultKey] = useState(0);

    // State for smart viewport sizing
    const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({ width: '100%', height: 'auto' });

    useEffect(() => {
        setPan({ x: 0, y: 0 }); // Reset pan on new image
        if (processedImage) {
            setResultKey(prev => prev + 1); // Trigger animation on new image
        }
    }, [processedImage]);

    const isPrintView = printLayout !== 'none';
    
    useEffect(() => {
        if (isPrintView && processedImage && previewCanvasRef.current && resultContainerRef.current) {
            let isActive = true;
            setPreviewError(null);
            const canvas = previewCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            try {
                canvas.width = 300; canvas.height = 150;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = "14px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(t('imagePanes.creatingPreview'), canvas.width / 2, canvas.height / 2);

                const container = resultContainerRef.current;
                if (!container) throw new Error("Canvas container not found");
                const previewContainerWidth = container.clientWidth > 0 ? container.clientWidth : 780;

                generatePaperPreview(processedImage, printLayout, aspectRatio, paperBackground, previewContainerWidth)
                    .then(({ dataUrl }) => {
                        if (!isActive) return;
                        const img = new Image();
                        img.onload = () => {
                            if (isActive && previewCanvasRef.current) {
                                const currentCanvas = previewCanvasRef.current;
                                currentCanvas.width = img.width; currentCanvas.height = img.height;
                                const currentCtx = currentCanvas.getContext('2d');
                                currentCtx?.drawImage(img, 0, 0);
                            }
                        };
                        img.src = dataUrl;
                    })
                    .catch(err => {
                        if (!isActive) return;
                        console.error("Preview generation failed:", err);
                        setPreviewError(err instanceof Error ? err.message : t('errors.unknownError'));
                    });
            } catch(e) {
                console.error("Error preparing preview:", e);
                setPreviewError(e instanceof Error ? e.message : t('errors.previewError'));
            }
            return () => { isActive = false; };
        } else if (!isPrintView && resultContainerRef.current) {
            // Smart Sizing Logic
            const container = resultContainerRef.current;
            const containerRatio = container.clientWidth / container.clientHeight;
            const imageRatio = ASPECT_RATIO_MAP[aspectRatio];

            if (containerRatio > imageRatio) {
                // Container is WIDER than the image, so fit to height
                setViewportStyle({ height: '100%', width: 'auto' });
            } else {
                // Container is TALLER than (or same ratio as) the image, so fit to width
                setViewportStyle({ width: '100%', height: 'auto' });
            }
        }
    }, [isPrintView, processedImage, printLayout, aspectRatio, paperBackground, t]);


    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileDrop(files);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!processedImage || e.button !== 0 || isPrintView) return;
        e.preventDefault();
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        setIsPanning(true);
        if(resultViewportRef.current) resultViewportRef.current.style.transition = 'none';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning || isPrintView) return;
        e.preventDefault();
        setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
    };

    const handleMouseUp = () => {
        if (!isPanning) return;
        setIsPanning(false);
        if(resultViewportRef.current) resultViewportRef.current.style.transition = 'transform 0.2s ease-out';
    };

    const renderResultContent = () => {
      if (!processedImage) {
          return (
              <div className="text-center text-[var(--text-secondary)] p-4 flex flex-col items-center justify-center h-full">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 opacity-50">
                    <path d="M14.5 4L17.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.4382 10.3444C12.7932 9.98943 13.3862 9.91497 13.8242 10.1504L15.3022 10.9214C16.2082 11.3914 16.5202 12.5184 16.0502 13.4244L15.4202 14.6824C15.1842 15.1204 14.6542 15.3484 14.1682 15.2214L11.5312 14.5494C11.0452 14.4224 10.6692 14.0464 10.5422 13.5604L9.87022 10.9234C9.74322 10.4374 9.97122 9.90743 10.4092 9.67143L11.1802 9.28643C11.6182 9.05043 12.0832 9.20843 12.4382 9.56343" fill="currentColor" fillOpacity="0.1"/>
                    <path d="M12.4382 9.56343C12.0832 9.20843 11.6182 9.05043 11.1802 9.28643L10.4092 9.67143C9.97122 9.90743 9.74322 10.4374 9.87022 10.9234L10.5422 13.5604C10.6692 14.0464 11.0452 14.4224 11.5312 14.5494L14.1682 15.2214C14.6542 15.3484 15.1842 15.1204 15.4202 14.6824L16.0502 13.4244C16.5202 12.5184 16.2082 11.3914 15.3022 10.9214L13.8242 10.1504C13.3862 9.91497 12.7932 9.98943 12.4382 10.3444" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                  <p className="font-semibold text-lg">{t('imagePanes.resultPlaceholder')}</p>
                  <p className="text-sm">{t('imagePanes.resultPlaceholderDesc')}</p>
              </div>
          );
      }
      if (isPrintView) {
          return previewError ? (
              <div className="text-red-400 text-center text-sm p-4">
                  <p>{t('errors.previewCreationError')}:</p>
                  <p className="font-mono text-xs mt-1">{previewError}</p>
              </div>
          ) : (
              <canvas ref={previewCanvasRef} style={paneStyles.containMedia} />
          );
      } else {
          return (
              <>
                  <img src={processedImage} alt={t('imagePanes.processedAlt')} className="w-full h-full object-cover shadow-lg" />
                  <div className="absolute inset-0 border border-dashed border-white/20 pointer-events-none" title={t('imagePanes.safeCropArea')}></div>
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                      {keepOriginalFeatures && (
                          <div className="bg-black/60 text-white text-xs font-bold py-1 px-2 rounded-md backdrop-blur-sm animate-fade-in">
                              <i className="fas fa-lock mr-1"></i> {t('imagePanes.faceLocked')}
                          </div>
                      )}
                      {isAiCropped && (
                          <div className="bg-black/60 text-white text-xs font-bold py-1 px-2 rounded-md backdrop-blur-sm animate-fade-in">
                              <i className="fas fa-robot mr-1"></i> {t('imagePanes.aiAligned')}
                          </div>
                      )}
                  </div>
              </>
          );
      }
  };

    const getViewportStyle = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            margin: 'auto',
            display: 'grid',
            placeItems: 'center',
            padding: 12,
            background: 'var(--bg-deep-space)',
            borderRadius: 10,
            overflow: 'hidden',
        };

        if (isPrintView) {
            return {
                ...baseStyle,
                width: '100%',
                height: '100%',
            };
        } else {
            return {
                ...baseStyle,
                ...viewportStyle, // Apply smart sizing
                aspectRatio: ASPECT_RATIO_MAP[aspectRatio],
                maxWidth: '100%',
                maxHeight: '100%',
            };
        }
    };


    return (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
            {/* GỐC PANE */}
            <div className="bg-[var(--bg-component)] rounded-xl p-3 flex flex-col min-h-0 flex-1 border border-[var(--border-color)] shadow-lg">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('imagePanes.originalTitle')}</h2>
                 <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={!originalImage ? onUploadClick : undefined}
                    className={`relative group flex-1 rounded-2xl overflow-hidden flex items-center justify-center p-4 transition-all duration-300 border-2 border-dashed ${isDraggingOver && !originalImage ? 'border-[var(--accent-cyan)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] bg-[var(--bg-interactive)]'} ${!originalImage ? 'hover:border-[var(--accent-cyan)] cursor-pointer' : ''}`}
                >
                    {originalImage ? (
                        <div className="group relative max-w-full max-h-full">
                            <img src={originalImage} alt={t('imagePanes.originalAlt')} className="block max-w-full max-h-full object-contain rounded-lg" />
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                <button onClick={onUploadClick} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                    <i className="fas fa-file-image mr-2"></i> {t('imagePanes.changeImage')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none w-full">
                            <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                <i className="fas fa-upload mr-2"></i> {t('imagePanes.uploadButton')}
                            </div>
                            <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('common.uploadPrompt')}</p>
                            <div className="mt-4 text-left text-sm border-t border-[var(--border-color)] pt-3 w-4/5 sm:w-3/5">
                                <p className="font-bold text-center mb-3 animated-gradient-text">{t('imagePanes.uploadTips.title')}</p>
                                <div className="space-y-2 text-[var(--text-secondary)]">
                                    <div className="flex items-start gap-2">
                                        <i className="fas fa-check-circle text-[var(--accent-cyan)] mt-1"></i>
                                        <span>{t('imagePanes.uploadTips.tip1')}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <i className="fas fa-check-circle text-[var(--accent-cyan)] mt-1"></i>
                                        <span>{t('imagePanes.uploadTips.tip2')}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <i className="fas fa-check-circle text-[var(--accent-cyan)] mt-1"></i>
                                        <span>{t('imagePanes.uploadTips.tip3')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {isDraggingOver && !originalImage && (
                        <div className="absolute inset-0 bg-[var(--accent-blue)]/10 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
                            <p className="text-white font-bold text-lg">{t('imagePanes.dropToUpload')}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* KẾT QUẢ PANE */}
            <div className="bg-[var(--bg-component)] rounded-xl p-3 flex flex-col w-full h-full flex-1 border border-[var(--border-color)] shadow-lg">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('imagePanes.resultTitle')}</h2>
                <div 
                    ref={resultContainerRef}
                    className="flex-1 overflow-hidden rounded-lg relative bg-[var(--bg-deep-space)] flex items-center justify-center shadow-inner" // Centering the viewport
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isPanning ? 'grabbing' : (processedImage && !isPrintView ? 'grab' : 'default') }}
                >
                    <div
                        ref={resultViewportRef}
                        className="flex items-center justify-center" // No w-full h-full here
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease-out',
                             // Let the inner div dictate the size
                            width: 'auto', 
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%',
                        }}
                    >
                        <div 
                            key={resultKey} 
                            className={`viewport ${processedImage ? 'animate-fade-in' : ''}`}
                            style={getViewportStyle()}
                        >
                             {renderResultContent()}
                        </div>
                    </div>

                    {/* FIXED CENTERLINE GUIDE - MOVED OUTSIDE OF THE TRANSFORMED DIV */}
                    {processedImage && !isPrintView && (
                      <div 
                        className="absolute top-0 bottom-0 left-1/2 w-px pointer-events-none" 
                        style={{
                          transform: 'translateX(-50%)',
                          backgroundImage: 'linear-gradient(to bottom, rgba(239, 68, 68, 0.7) 50%, transparent 50%)', // Dashed line effect
                          backgroundSize: '1px 10px',
                          backgroundRepeat: 'repeat-y'
                        }}
                        aria-hidden="true"
                        title={t('imagePanes.centerGuide')}
                      ></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImagePanes;