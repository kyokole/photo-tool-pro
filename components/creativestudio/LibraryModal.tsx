// components/creativestudio/LibraryModal.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ZoomModal } from './ZoomModal';
import { smartDownload } from '../../utils/canvasUtils';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  onDelete: (index: number) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, images, onDelete }) => {
  const { t } = useTranslation();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleDownload = (base64Image: string, index: number) => {
    const imageUrl = `data:image/png;base64,${base64Image}`;
    const fileName = `ai_studio_library_${index}.png`;
    smartDownload(imageUrl, fileName);
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (window.confirm(t('aiStudio.library.deleteConfirm'))) {
        onDelete(index);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div
          className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] w-full max-w-6xl text-[var(--text-primary)] relative flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-text-start)] to-[var(--accent-text-end)] text-transparent bg-clip-text">
                {t('aiStudio.library.title')} ({images.length} / 100)
             </h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] z-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2">
            {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {images.map((base64Image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={`data:image/png;base64,${base64Image}`}
                        alt={`Library image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-2">
                         <button title={t('aiStudio.gallery.zoom')} onClick={() => setZoomedImage(base64Image)} className="h-10 w-10 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)]">
                            <span role="img" aria-label="zoom">🔍</span>
                         </button>
                         <button title={t('common.download')} onClick={() => handleDownload(base64Image, index)} className="h-10 w-10 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)]">
                            <span role="img" aria-label="download">📥</span>
                         </button>
                         <button title={t('aiStudio.library.delete')} onClick={(e) => handleDelete(e, index)} className="h-10 w-10 bg-red-600/50 hover:bg-red-600/80 rounded-full flex items-center justify-center text-white">
                            <span role="img" aria-label="delete">🗑️</span>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-center text-[var(--text-muted)]">
                    <div>
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                        <h3 className="mt-2 text-sm font-medium">{t('aiStudio.library.emptyTitle')}</h3>
                        <p className="mt-1 text-sm">{t('aiStudio.library.emptySubtitle')}</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
      {zoomedImage && (
         <ZoomModal
          isOpen={!!zoomedImage}
          onClose={() => setZoomedImage(null)}
          base64Image={zoomedImage}
        />
      )}
    </>
  );
};