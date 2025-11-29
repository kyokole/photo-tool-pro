
// components/creativestudio/ImageGallery.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from './Spinner';
import { ZoomModal } from './ZoomModal';
import { smartDownload } from '../../utils/canvasUtils';

interface ImageGalleryProps {
  isLoading: boolean;
  images: string[];
  numImagesToLoad: number;
  onOpenVideoCreator: (base64Image: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ isLoading, images, numImagesToLoad, onOpenVideoCreator }) => {
  const { t } = useTranslation();
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleOpenZoomModal = (imageBase64: string) => {
    setSelectedImage(imageBase64);
    setIsZoomModalOpen(true);
  };

  const handleDownload = (base64Image: string, index: number) => {
    // Determine mime type if possible, or default to png
    const mimeType = base64Image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `ai_studio_image_${index + 1}.${ext}`;
    smartDownload(imageUrl, fileName);
  }

  const handleCloseModals = () => {
    setIsZoomModalOpen(false);
    setSelectedImage(null);
  };

  // Helper to safely render image source
  const getSrc = (base64: string) => {
      // Check for JPEG signature (starts with /9j/)
      const mime = base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
      return `data:${mime};base64,${base64}`;
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] backdrop-blur-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: numImagesToLoad }).map((_, index) => (
            <div key={index} className="aspect-square bg-[var(--bg-interactive)] rounded-lg flex items-center justify-center">
              <Spinner />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] backdrop-blur-xl flex items-center justify-center min-h-[400px]">
        <div className="text-center text-[var(--text-muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium">{t('aiStudio.gallery.noImagesTitle')}</h3>
          <p className="mt-1 text-sm">{t('aiStudio.gallery.noImagesSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-color)] backdrop-blur-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((base64Image, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
              <img
                src={getSrc(base64Image)}
                alt={`Generated image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-2">
                 <button title={t('aiStudio.gallery.zoom')} onClick={() => handleOpenZoomModal(base64Image)} className="h-10 w-10 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)]">
                    <span role="img" aria-label="zoom">🔍</span>
                 </button>
                 <button title={t('common.download')} onClick={() => handleDownload(base64Image, index)} className="h-10 w-10 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)]">
                    <span role="img" aria-label="download">📥</span>
                 </button>
                 <button title={t('aiStudio.gallery.createVideo')} onClick={() => onOpenVideoCreator(base64Image)} className="h-10 w-10 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)]">
                    <span role="img" aria-label="video">🎬</span>
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedImage && (
         <ZoomModal
          isOpen={isZoomModalOpen}
          onClose={handleCloseModals}
          base64Image={selectedImage}
        />
      )}
    </>
  );
};
