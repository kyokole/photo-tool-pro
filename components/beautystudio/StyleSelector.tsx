import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautyStyle, BeautySubFeature } from '../../types';

interface StyleSelectorProps {
  subFeature: BeautySubFeature | null;
  selectedStyle: BeautyStyle | null;
  onSelect: (style: BeautyStyle) => void;
}

const ScrollableContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollability = useCallback(() => {
        const el = scrollRef.current;
        if (el) {
            setCanScrollLeft(el.scrollLeft > 5);
            setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            checkScrollability();
            el.addEventListener('scroll', checkScrollability, { passive: true });
            const resizeObserver = new ResizeObserver(checkScrollability);
            resizeObserver.observe(el);
            return () => {
                el.removeEventListener('scroll', checkScrollability);
                resizeObserver.unobserve(el);
            };
        }
    }, [checkScrollability, children]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.8;
            el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };
    
    return (
        <div className="relative h-36">
            <div
                className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[var(--bg-component)] to-transparent z-10 pointer-events-none transition-opacity"
                style={{ opacity: canScrollLeft ? 1 : 0 }}
            />
            <div
                className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[var(--bg-component)] to-transparent z-10 pointer-events-none transition-opacity"
                style={{ opacity: canScrollRight ? 1 : 0 }}
            />
             <button
                onClick={() => scroll('left')}
                className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-300 left-2 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-label="Scroll left"
              >
                <i className="fas fa-chevron-left text-sm"></i>
            </button>
            <button
                onClick={() => scroll('right')}
                className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-300 right-2 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-label="Scroll right"
            >
                <i className="fas fa-chevron-right text-sm"></i>
            </button>

            <div ref={scrollRef} className="h-full overflow-x-auto overflow-y-hidden py-2 flex items-center no-scrollbar">
                {children}
            </div>
        </div>
    );
};


const StyleItemImage: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div
            onClick={onSelect}
            className="flex flex-col items-center cursor-pointer group space-y-2 flex-shrink-0 w-20"
        >
            <div className={`relative w-16 h-16 rounded-full p-0.5 transition-all duration-200 ${isSelected ? 'bg-gradient-to-tr from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]' : 'bg-transparent'}`}>
                {style.id === 'none' ? (
                     <div className="w-full h-full rounded-full bg-[var(--bg-component)] border-2 border-[var(--border-color)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                     </div>
                ) : style.value.startsWith('fa') ? (
                     <div className={`w-full h-full rounded-full bg-[var(--bg-component)] border-2 flex items-center justify-center text-2xl transition-colors ${isSelected ? 'border-transparent text-[var(--accent-cyan)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                        <i className={style.value} />
                     </div>
                ) : (
                    <img src={style.value} alt={t(style.labelKey)} className="w-full h-full rounded-full object-cover border-2 border-[var(--bg-component)]" />
                )}
            </div>
            <span className={`text-xs font-medium text-center transition-colors w-full h-8 flex items-center justify-center whitespace-normal ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{t(style.labelKey)}</span>
        </div>
    );
};

const StyleItemColor: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => {
    const { t } = useTranslation();
    return (
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
            <span className={`text-xs font-medium text-center transition-colors ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{t(style.labelKey)}</span>
        </div>
    );
};

const StyleItemIntensity: React.FC<{ style: BeautyStyle; isSelected: boolean; onSelect: () => void; }> = ({ style, isSelected, onSelect }) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onSelect}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 relative ${isSelected ? 'bg-[var(--accent-cyan)] text-white shadow' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
        >
            {t(style.labelKey)}
        </button>
    );
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({ subFeature, selectedStyle, onSelect }) => {
  const { t } = useTranslation();
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
    <ScrollableContainer>
      {styleType === 'image' && (
        <div className="flex items-start space-x-2 px-6">
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
        <div className="flex items-start space-x-4 px-6">
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
        <div className="flex items-center space-x-3 px-6">
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
    </ScrollableContainer>
  );
};