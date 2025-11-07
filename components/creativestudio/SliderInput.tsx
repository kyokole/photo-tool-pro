// components/creativestudio/SliderInput.tsx
import React, { useState, useRef, useEffect } from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
        const percentage = ((value - min) / (max - min)) * 100;
        sliderRef.current.style.setProperty('--progress-percent', `${percentage}%`);
    }
  }, [value, min, max]);

  return (
    <div className="relative">
      <label className="flex justify-between items-center text-sm font-medium text-[var(--text-primary)] mb-2">
        <span>{label}</span>
        <span className="font-bold text-[var(--accent-cyan)] bg-[var(--bg-interactive)] rounded-md px-2 py-1 text-xs">{value}</span>
      </label>
      <div className="relative h-5">
        <input
            ref={sliderRef}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="custom-slider w-full"
        />
        <div className={`slider-tooltip ${isDragging ? 'slider-tooltip-visible' : ''}`}>{value}</div>
      </div>
    </div>
  );
};