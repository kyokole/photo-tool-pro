// components/creativestudio/ZoomModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  base64Image: string | null;
}

export const ZoomModal: React.FC<ZoomModalProps> = ({ isOpen, onClose, base64Image }) => {
  const { t } = useTranslation();
  if (!isOpen || !base64Image) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex justify-center items-center p-4" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold z-50">
          &times;
        </button>
        <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
             <img 
                src={`data:image/png;base64,${base64Image}`} 
                alt={t('aiStudio.gallery.zoomedAlt')} 
                className="rounded-lg object-contain w-full h-full max-w-full max-h-full"
            />
        </div>
    </div>
  );
};
