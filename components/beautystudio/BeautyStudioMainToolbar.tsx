import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautyFeature, BeautyBadgeType } from '../../types';

interface MainToolbarProps {
    tools: BeautyFeature[];
    onToolSelect: (tool: BeautyFeature) => void;
    isDisabled: boolean;
}

const Badge: React.FC<{ type: BeautyBadgeType }> = ({ type }) => {
    const baseClasses = "absolute -top-1 -right-1 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow";
    const colorClasses = {
        Free: 'bg-gradient-to-br from-purple-500 to-pink-500',
        Hot: 'bg-gradient-to-br from-red-500 to-orange-500',
        NEW: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    };
    return <span className={`${baseClasses} ${colorClasses[type]}`}>{type}</span>;
};

const FeatureItem: React.FC<{ feature: BeautyFeature; onSelect: () => void; }> = ({ feature, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div
            onClick={onSelect}
            className="flex flex-col items-center justify-start text-center cursor-pointer group space-y-1.5 p-1 flex-shrink-0 w-20"
        >
            <div className="relative w-14 h-14 bg-[var(--bg-component)] rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105 text-2xl">
                <i className={feature.icon}></i>
                {feature.badge && <Badge type={feature.badge} />}
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{t(feature.labelKey)}</span>
        </div>
    );
};

const ScrollButton: React.FC<{ direction: 'left' | 'right'; onClick: () => void; visible: boolean }> = ({ direction, onClick, visible }) => (
  <button
    onClick={onClick}
    className={`absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all duration-300 ${direction === 'left' ? 'left-2' : 'right-2'} ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
  >
    <i className={`fas fa-chevron-${direction}`}></i>
  </button>
);

export const BeautyStudioMainToolbar: React.FC<MainToolbarProps> = ({ tools, onToolSelect, isDisabled }) => {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollability = useCallback(() => {
        const el = scrollRef.current;
        if (el) {
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
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
    }, [checkScrollability, tools]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.7;
            el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-[var(--bg-interactive)] backdrop-blur-sm rounded-2xl shadow-inner p-2">
            <div className={`relative ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div
                    className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[var(--bg-interactive)] to-transparent z-10 pointer-events-none transition-opacity"
                    style={{ opacity: canScrollLeft ? 1 : 0 }}
                ></div>
                <div
                    className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[var(--bg-interactive)] to-transparent z-10 pointer-events-none transition-opacity"
                    style={{ opacity: canScrollRight ? 1 : 0 }}
                ></div>

                <ScrollButton direction="left" onClick={() => scroll('left')} visible={canScrollLeft} />
                <ScrollButton direction="right" onClick={() => scroll('right')} visible={canScrollRight} />

                <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden py-4 no-scrollbar">
                    <div className="flex items-start space-x-1 px-4">
                        {tools.map(tool => (
                            <FeatureItem
                                key={tool.id}
                                feature={tool}
                                onSelect={() => onToolSelect(tool)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};