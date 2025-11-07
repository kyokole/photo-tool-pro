import React from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadIcon } from './icons';

interface ResultCardProps {
  title: string;
  description: string;
  imageUrl: string;
  fileName: string;
}

const downloadImage = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const ResultCard: React.FC<ResultCardProps> = ({ title, description, imageUrl, fileName }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-[var(--bg-component-light)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] flex flex-col lg:flex-row gap-6 items-start animate-fade-in shadow-md">
      <div className="lg:w-2/5 w-full flex-shrink-0">
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" title={t('resultCard.viewFullImage')}>
          <img src={imageUrl} alt={title} className="rounded-lg shadow-lg w-full object-contain transition-transform duration-300 hover:scale-105" />
        </a>
      </div>
      <div className="flex flex-col h-full flex-grow">
        <h3 className="text-2xl font-bold text-[var(--accent-cyan)] mb-3">{title}</h3>
        <p className="text-[var(--text-primary)] whitespace-pre-wrap text-base leading-relaxed">{description}</p>
        <div className="mt-auto pt-4">
             <button 
                onClick={() => downloadImage(imageUrl, fileName)} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 btn-gradient text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 shadow-lg text-lg"
              >
                <DownloadIcon />
                {t('common.download')}
            </button>
        </div>
      </div>
    </div>
  );
};