// components/BeforeAfterSlider.tsx
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface BeforeAfterSliderProps {
    before: string;
    after: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ before, after }) => {
    const { t } = useTranslation();
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(percentage);
    };

    const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isDragging.current = true; };
    const onMouseUp = () => { isDragging.current = false; };
    const onMouseMove = (e: React.MouseEvent) => { if (isDragging.current) handleMove(e.clientX); };
    const onTouchStart = (e: React.TouchEvent) => { isDragging.current = true; handleMove(e.touches[0].clientX); };
    const onTouchEnd = () => { isDragging.current = false; };
    const onTouchMove = (e: React.TouchEvent) => { if (isDragging.current) handleMove(e.touches[0].clientX); };

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-[4/3] max-w-full max-h-full overflow-hidden select-none cursor-ew-resize rounded-lg bg-black/20"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onMouseMove={onMouseMove}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
        >
            <img src={before} alt={t('restoration.originalAlt')} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <img src={after} alt={t('restoration.resultAlt')} className="absolute inset-0 w-full h-full object-contain" />
            </div>
            <div className="absolute top-0 bottom-0 bg-white w-1 cursor-ew-resize pointer-events-none" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white rounded-full h-9 w-9 flex items-center justify-center shadow-lg pointer-events-none">
                    <i className="fas fa-arrows-alt-h text-gray-700"></i>
                </div>
            </div>
        </div>
    );
};
