import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '../BeforeAfterSlider';

interface ImageProcessorProps {
  originalImage: string | null;
  generatedImage: string | null;
  onUploadClick: () => void;
  isLoading: boolean;
  error: string | null;
  onSave: () => void;
  canSave: boolean;
}

// --- Icons ---
const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--text-muted)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

const FitToScreenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ChangeImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const Loader: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="absolute inset-0 bg-[var(--bg-component)] bg-opacity-90 flex flex-col items-center justify-center z-20 rounded-xl p-4">
            <div className="w-16 h-16 border-4 border-t-4 border-[var(--accent-cyan)] border-gray-200/20 rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--text-primary)] font-semibold text-center">{t('beautyStudio.imageProcessor.loading')}</p>
            <p className="mt-2 text-[var(--text-secondary)] text-sm text-center">{t('beautyStudio.imageProcessor.loadingDesc')}</p>
        </div>
    );
};

const ActionControls: React.FC<{
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSave: () => void;
  canSave: boolean;
  onUploadClick: () => void;
}> = ({ onZoomIn, onZoomOut, onReset, onSave, canSave, onUploadClick }) => {
    const { t } = useTranslation();
    return (
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end space-y-2">
            <div className="bg-[var(--bg-interactive)] backdrop-blur-sm p-1 rounded-lg shadow-md flex items-center space-x-1">
                <button onClick={onZoomOut} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors" aria-label={t('beautyStudio.imageProcessor.zoomOut')}><MinusIcon /></button>
                <button onClick={onReset} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors" aria-label={t('beautyStudio.imageProcessor.resetZoom')}><FitToScreenIcon /></button>
                <button onClick={onZoomIn} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors" aria-label={t('beautyStudio.imageProcessor.zoomIn')}><PlusIcon /></button>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={onSave} disabled={!canSave} title={t('beautyStudio.imageProcessor.save')} className="p-2 rounded-full bg-black/40 text-white disabled:opacity-50 hover:bg-black/50 transition-all"><SaveIcon /></button>
                <button onClick={onUploadClick} title={t('beautyStudio.imageProcessor.change')} className="p-2 rounded-full bg-black/40 text-white hover:bg-black/50 transition-all"><ChangeImageIcon /></button>
            </div>
        </div>
    );
};

export const BeautyStudioImageProcessor: React.FC<ImageProcessorProps> = ({ originalImage, generatedImage, onUploadClick, isLoading, error, onSave, canSave }) => {
  const { t } = useTranslation();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(3/4);
 
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const imageToMeasure = generatedImage || originalImage;
    if (imageToMeasure) {
      const img = new Image();
      img.onload = () => {
        setImageAspectRatio(img.naturalWidth / img.naturalHeight);
      };
      img.src = imageToMeasure;
    } else {
      setImageAspectRatio(3/4);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [originalImage, generatedImage]);
 
  useEffect(() => {
    if (zoom === 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    e.preventDefault();
    isPanning.current = true;
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
    if (imageContainerRef.current) {
        imageContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    if (imageContainerRef.current) {
        imageContainerRef.current.style.cursor = zoom > 1 ? 'grab' : 'default';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPanPoint.current.x;
    const dy = e.clientY - lastPanPoint.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
  };

  const imageToShow = generatedImage || originalImage;
  const hasResult = originalImage && generatedImage;

  return (
    <div
        className="bg-[var(--bg-component)] rounded-xl shadow-lg p-2 sm:p-3 relative w-full max-w-2xl mx-auto flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: imageAspectRatio }}
    >
      {isLoading && <Loader />}

      {!originalImage && (
        <div
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--border-color)] rounded-lg h-full w-full cursor-pointer hover:border-[var(--accent-cyan)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <UploadIcon />
          <h3 className="font-bold text-[var(--text-primary)]">{t('beautyStudio.uploadPlaceholder.title')}</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t('beautyStudio.uploadPlaceholder.description')}</p>
        </div>
      )}
     
      {originalImage && (
         <div
            ref={imageContainerRef}
            className="w-full h-full relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
         >
            <div
                className="w-full h-full rounded-lg overflow-hidden"
                style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    cursor: zoom > 1 ? 'grab' : 'default',
                    transition: isPanning.current ? 'none' : 'transform 0.2s ease-out',
                }}
            >
                {hasResult ? (
                    <BeforeAfterSlider before={originalImage} after={generatedImage} />
                ) : (
                    <img src={originalImage} alt="Original" className="object-cover w-full h-full" />
                )}
            </div>

             <ActionControls
                onZoomIn={() => setZoom(z => Math.min(z + 0.25, 4))}
                onZoomOut={() => setZoom(z => Math.max(z - 0.25, 1))}
                onReset={() => setZoom(1)}
                onSave={onSave}
                canSave={canSave}
                onUploadClick={onUploadClick}
            />
         </div>
      )}
    </div>
  );
};
