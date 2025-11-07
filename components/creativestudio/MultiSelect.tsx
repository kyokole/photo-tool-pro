// components/creativestudio/MultiSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface MultiSelectProps {
  label: string;
  options: { key: string, label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (optionKey: string) => {
    if (selected.includes(optionKey)) {
      onChange(selected.filter(item => item !== optionKey));
    } else {
      onChange([...selected, optionKey]);
    }
  };

  const getLabelForKey = (key: string) => {
    return options.find(opt => opt.key === key)?.label || key;
  };

  return (
    <div className="relative col-span-1 md:col-span-2 lg:col-span-1" ref={wrapperRef}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 flex justify-between items-center cursor-pointer min-h-[50px]"
      >
        <div className="flex flex-wrap gap-1">
          {selected.length > 0 ? (
            selected.map(itemKey => (
              <span key={itemKey} className="bg-[var(--button-primary)] text-white text-xs font-semibold px-2 py-1 rounded-full">
                {getLabelForKey(itemKey)}
              </span>
            ))
          ) : (
            <span className="text-[var(--text-muted)]">{t('aiStudio.multiSelect.placeholder')}</span>
          )}
        </div>
        <svg className={`w-5 h-5 text-[var(--text-muted)] transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <div
              key={option.key}
              onClick={() => handleSelect(option.key)}
              className="px-4 py-2 cursor-pointer hover:bg-[var(--accent-gradient-start)]/50 flex items-center"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.key)}
                readOnly
                className="h-4 w-4 rounded border-gray-300 text-[var(--button-primary)] focus:ring-[var(--ring-color)] bg-gray-700 mr-3"
              />
              <span className="text-[var(--text-primary)]">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};