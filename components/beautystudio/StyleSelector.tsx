import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautyStyle, BeautySubFeature } from '../../types';


interface StyleSelectorProps {
  subFeature: BeautySubFeature | null;
  selectedStyle: BeautyStyle | null;
  onSelect: (style: BeautyStyle) => void;
}


const StyleItemImage: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => {
    const { t } = useTranslation();

    const isFontAwesomeIcon = style.value.startsWith('fa-');

    return (
        <div
            onClick={onSelect}
            className="flex flex-col items-center cursor-pointer group space-y-2 flex-shrink-0 text-center"
            style={{ width: '68px' }}
        >
            <div className={`relative w-16 h-16 rounded-full p-0.5 transition-all duration-200 ${isSelected ? 'ring-2 ring-[var(--accent-cyan)]' : 'bg-transparent'}`}>
                {style.id === 'none' ? (
                    <div className="w-full h-full rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                ) : isFontAwesomeIcon ? (
                     <div className="w-full h-full rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] flex items-center justify-center">
                        <i className={`${style.value} text-3xl text-[var(--accent-cyan)]`}></i>
                    </div>
                ) : (
                    <img src={style.value} alt={t(style.labelKey)} className="w-full h-full rounded-full object-cover border-2 border-[var(--bg-component)]" />
                )}
            </div>
            <span className={`text-xs font-medium text-center transition-colors w-full break-words ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{t(style.labelKey)}</span>
        </div>
    );
}

const StyleItemColor: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div
            onClick={onSelect}
            className="flex flex-col items-center cursor-pointer group space-y-2 flex-shrink-0 text-center"
             style={{ width: '68px' }}
        >
            <div className={`relative w-14 h-14 rounded-lg p-0.5 transition-all duration-200 ${isSelected ? 'ring-2 ring-[var(--accent-cyan)]' : 'bg-transparent'}`}>
                {style.id === 'none' ? (
                    <div className="w-full h-full rounded-md bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                ) : (
                    <div style={{ backgroundColor: style.value }} className="w-full h-full rounded-md border border-[var(--border-color)]" />
                )}
            </div>
            <span className={`text-xs font-medium text-center transition-colors w-full break-words ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{t(style.labelKey)}</span>
        </div>
    );
}

const StyleItemIntensity: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onSelect}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 relative ${isSelected ? 'btn-gradient text-white shadow' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
        >
            {t(style.labelKey)}
        </button>
    );
}


export const StyleSelector: React.FC<StyleSelectorProps> = ({ subFeature, selectedStyle, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!subFeature || !subFeature.styles || subFeature.styles.length === 0) {
    return (
      <div className="text-center text-[var(--text-muted)] py-10 h-36 flex items-center justify-center">
        Coming soon!
      </div>
    );
  }
  
  const checkArrows = () => {
      const el = scrollRef.current;
      if (el) {
          const buffer = 1; // 1px buffer for floating point inaccuracies
          setShowLeftArrow(el.scrollLeft > buffer);
          setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - buffer);
      }
  };

  useEffect(() => {
      const el = scrollRef.current;
      if (el) {
          checkArrows();
          el.addEventListener('scroll', checkArrows, { passive: true });
          window.addEventListener('resize', checkArrows);
          return () => {
              el.removeEventListener('scroll', checkArrows);
              window.removeEventListener('resize', checkArrows);
          };
      }
  }, [subFeature]);

  const handleScroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
          const scrollAmount = scrollRef.current.clientWidth * 0.8;
          scrollRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  const styles = subFeature.styles;
  const styleType = styles.find(s => s.id !== 'none')?.type || styles[0]?.type;


  return (
    <div className="relative h-[150px]">
       <div
        ref={scrollRef}
        className="h-full overflow-x-auto overflow-y-hidden py-2 flex items-center no-scrollbar"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
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

       <button
          onClick={() => handleScroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--bg-component)]/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Scroll left"
      >
          <i className="fas fa-chevron-left text-xs"></i>
      </button>
       <button
          onClick={() => handleScroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--bg-component)]/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Scroll right"
      >
          <i className="fas fa-chevron-right text-xs"></i>
      </button>
    </div>
  );
};