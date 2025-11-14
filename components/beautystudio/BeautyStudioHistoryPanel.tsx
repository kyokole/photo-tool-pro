import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautyHistoryItem } from '../../types';

interface HistoryPanelProps {
  history: BeautyHistoryItem[];
  onSelect: (item: BeautyHistoryItem) => void;
  currentImage: string | null;
  onClear: () => void;
}

const TrashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const BeautyStudioHistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, currentImage, onClear }) => {
  const { t } = useTranslation();
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-component)] rounded-xl p-4 border border-[var(--border-color)] shadow-lg">
       <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold animated-gradient-text">{t('history.title')}</h2>
        <button
          onClick={onClear}
          className="flex items-center space-x-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-500 transition-colors"
          title={t('history.clear')}
        >
          <TrashIcon />
          <span>{t('history.clear')}</span>
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin">
        <div className="flex items-center space-x-3 px-2">
          {history.map(item => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer p-1 transition-all duration-200 ${currentImage === item.imageDataUrl ? 'bg-[var(--accent-cyan)]' : 'bg-transparent hover:bg-white/10'}`}
            >
              <img
                src={item.imageDataUrl}
                alt={`${t('history.version')} ${item.id}`}
                className="w-full h-full object-cover rounded-md border-2 border-[var(--bg-component)]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};