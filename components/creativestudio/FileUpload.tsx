// components/creativestudio/FileUpload.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
  file: File | null;
  setFile: (file: File | null) => void;
  label: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ file, setFile, label }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
    } else {
        setFile(null);
    }
  };
  
  useEffect(() => {
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setPreview(null);
    }
  }, [file]);


  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [setFile]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const onDragEnter = () => setIsDragging(true);
  const onDragLeave = () => setIsDragging(false);

  const handleRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setFile(null);
  };
  
  const openFileDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if(target.files && target.files.length > 0) {
            handleFileChange(target.files[0]);
        }
    }
    input.click();
  }

  if (preview) {
      return (
          <div
              className="w-full relative group rounded-lg bg-[var(--bg-interactive)] min-h-[170px] flex justify-center items-center p-2 border-2 border-dashed border-transparent"
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
          >
              <img src={preview} alt="Preview" className="mx-auto h-full max-h-40 rounded-md object-contain" />
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                  <button onClick={openFileDialog} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                      <i className="fas fa-file-image mr-2"></i> {t('imagePanes.changeImage')}
                  </button>
              </div>
              <button onClick={handleRemove} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs z-10">
                X
              </button>
          </div>
      );
  }

  return (
      <div
          onClick={() => openFileDialog()}
          className={`group w-full p-4 rounded-lg text-center transition-all duration-300 relative min-h-[170px] flex flex-col justify-center items-center cursor-pointer border-2 border-dashed ${isDragging ? 'border-[var(--accent-cyan)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] bg-[var(--bg-interactive)] hover:border-[var(--accent-cyan)]'}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
      >
          <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
              <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                  <i className="fas fa-upload mr-2"></i> {label}
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