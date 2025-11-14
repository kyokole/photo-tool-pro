// components/HistoryPanel.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  originalImage: string | null;
  history: HistoryItem[];
  currentImage: string | null;
  onSelect: (item: HistoryItem) => void;
  onSelectOriginal: () => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ originalImage, history, currentImage, onSelect, onSelectOriginal, onClear }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pb-4 animate-fade-in">
      <div className="bg-[var(--bg-component)] rounded-xl p-4 border border-[var(--border-color)] shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold animated-gradient-text">
            {t('history.title')}
          </h2>
          <button
            onClick={onClear}
            className="flex items-center space-x-1 text-sm font-semibold text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            title={t('history.clear')}
          >
            <i className="fas fa-trash-alt"></i>
            <span>{t('history.clear')}</span>
          </button>
        </div>
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
          {originalImage && (
             <div
              onClick={onSelectOriginal}
              className={`flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer p-1 transition-all duration-200 ${currentImage === null ? 'bg-[var(--accent-cyan)]' : 'bg-transparent hover:bg-white/10'}`}
              title={t('imagePanes.originalTitle')}
            >
              <img
                src={originalImage}
                alt={t('imagePanes.originalTitle')}
                className="w-full h-full object-cover rounded-md border-2 border-[var(--bg-component)]"
              />
            </div>
          )}
          {history.map((item, index) => (
            <div
              key={index}
              onClick={() => onSelect(item)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer p-1 transition-all duration-200 ${currentImage === item.image ? 'bg-[var(--accent-cyan)]' : 'bg-transparent hover:bg-white/10'}`}
              title={`${t('history.version')} ${index + 1}`}
            >
              <img
                src={item.image}
                alt={`${t('history.version')} ${index + 1}`}
                className="w-full h-full object-cover rounded-md border-2 border-[var(--bg-component)]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;