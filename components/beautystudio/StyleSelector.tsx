import React from 'react';
import type { BeautyStyle, BeautySubFeature } from '../../types';

interface StyleSelectorProps {
  subFeature: BeautySubFeature | null;
  selectedStyle: BeautyStyle | null;
  onSelect: (style: BeautyStyle) => void;
}

const StyleItemImage: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => (
    <div
        onClick={onSelect}
        className="flex flex-col items-center cursor-pointer group space-y-2 flex-shrink-0"
    >
        <div className={`relative w-16 h-16 rounded-full p-0.5 transition-all duration-200 ${isSelected ? 'bg-gradient-to-tr from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]' : 'bg-transparent'}`}>
            {style.id === 'none' ? (
                 <div className="w-full h-full rounded-full bg-[var(--bg-component)] border-2 border-[var(--border-color)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                 </div>
            ) : (
                <img src={style.value} alt={style.label} className="w-full h-full rounded-full object-cover border-2 border-[var(--bg-component)]" />
            )}
        </div>
        <span className={`text-xs font-medium text-center transition-colors ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{style.label}</span>
    </div>
);

const StyleItemColor: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => (
    <div
        onClick={onSelect}
        className="flex flex-col items-center cursor-pointer group space-y-2 flex-shrink-0"
    >
        <div className={`relative w-14 h-14 rounded-lg p-0.5 transition-all duration-200 ${isSelected ? 'bg-[var(--accent-cyan)]' : 'bg-transparent'}`}>
            {style.id === 'none' ? (
                 <div className="w-full h-full rounded-md bg-[var(--bg-component)] border-2 border-[var(--border-color)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                 </div>
            ) : (
                <div style={{ backgroundColor: style.value }} className="w-full h-full rounded-md border border-[var(--border-color)]" />
            )}
        </div>
        <span className={`text-xs font-medium text-center transition-colors ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{style.label}</span>
    </div>
);

const StyleItemIntensity: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => (
    <button
        onClick={onSelect}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 relative ${isSelected ? 'bg-[var(--accent-cyan)] text-white shadow' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
    >
        {style.label}
    </button>
);

export const StyleSelector: React.FC<StyleSelectorProps> = ({ subFeature, selectedStyle, onSelect }) => {
  if (!subFeature || !subFeature.styles || subFeature.styles.length === 0) {
    return (
      <div className="text-center text-[var(--text-secondary)] py-10 h-36 flex items-center justify-center">
        Coming soon!
      </div>
    );
  }

  const styles = subFeature.styles;
  const styleType = styles.find(s => s.id !== 'none')?.type || styles[0]?.type;

  return (
    <div className="h-36 overflow-x-auto overflow-y-hidden py-2 flex items-center scrollbar-thin">
      {styleType === 'image' && (
        <div className="flex items-start space-x-4 px-4">
            {styles.map((style) => (
                <StyleItemImage
                    key={style.id}
                    style={style}
                    isSelected={selectedStyle?.id === style.id}
                    onSelect={() => onSelect(style)}
                />
            ))}
        </div>
      )}
      {styleType === 'color' && (
        <div className="flex items-start space-x-4 px-4">
            {styles.map((style) => (
                <StyleItemColor
                    key={style.id}
                    style={style}
                    isSelected={selectedStyle?.id === style.id}
                    onSelect={() => onSelect(style)}
                />
            ))}
        </div>
      )}
      {styleType === 'intensity' && (
        <div className="flex items-center space-x-3 px-4">
            {styles.map((style) => (
                <StyleItemIntensity
                    key={style.id}
                    style={style}
                    isSelected={selectedStyle?.id === style.id}
                    onSelect={() => onSelect(style)}
                />
            ))}
        </div>
      )}
    </div>
  );
};
