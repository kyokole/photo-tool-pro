import React from 'react';
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
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-interactive)] backdrop-blur-sm rounded-2xl shadow-inner p-2">
       <div className="flex items-center justify-between mb-2 px-3 pt-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Lịch sử tạo ảnh</h2>
        <button
          onClick={onClear}
          className="flex items-center space-x-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-500 transition-colors"
          title="Xóa lịch sử"
        >
          <TrashIcon />
          <span>Xóa</span>
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin">
        <div className="flex items-center space-x-3 px-2">
          {history.map(item => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer p-0.5 transition-all duration-200 ${currentImage === item.imageDataUrl ? 'bg-[var(--accent-cyan)]' : 'bg-transparent'}`}
            >
              <img
                src={item.imageDataUrl}
                alt={`History item ${item.id}`}
                className="w-full h-full object-cover rounded-md border-2 border-[var(--bg-component)]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
