import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  uploaderId?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploaderId = 'image-upload' }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onImageUpload(file);
  };


  return (
    <div
      onClick={triggerUpload}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`group w-full h-full flex items-center justify-center p-4 relative cursor-pointer border-2 border-dashed transition-all duration-300 rounded-2xl ${isDragging ? 'border-[var(--accent-cyan)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] bg-transparent hover:border-[var(--accent-cyan)]'}`}
    >
      <input
        type="file"
        id={uploaderId}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        ref={inputRef}
      />
       <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
            <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                <i className="fas fa-upload mr-2"></i> {t('restoration.uploadButton')}
            </div>
            <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('common.uploadPrompt')}</p>
        </div>
       {isDragging && (
          <div className="absolute inset-0 bg-[var(--accent-blue)]/10 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
            <p className="text-white font-bold text-lg">{t('imagePanes.dropToUpload')}</p>
        </div>
      )}
    </div>
  );
};