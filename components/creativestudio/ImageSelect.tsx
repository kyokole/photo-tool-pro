// components/creativestudio/ImageSelect.tsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageSelectOption } from '../../types';

interface ImageSelectProps {
  label: string;
  options: ImageSelectOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export const ImageSelect: React.FC<ImageSelectProps> = ({ label, options, selectedValue, onChange }) => {
  const { t } = useTranslation();
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.name === selectedValue);
  }, [options, selectedValue]);


  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Preview Pane */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-gray-800/50 rounded-lg p-3 text-center">
            {selectedOption ? (
              <>
                <img src={selectedOption.preview} alt={`Preview of ${selectedOption.name}`} className="w-full aspect-square object-cover rounded-md mb-2 animate-fade-in" />
                <h4 className="font-semibold text-white">{selectedOption.name}</h4>
              </>
            ) : (
              <div className="flex items-center justify-center aspect-square text-gray-400">
                <p>{t('aiStudio.imageSelect.placeholder')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Options Grid */}
        <div className="lg:col-span-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {options.map((option) => (
                <div
                    key={option.name}
                    className={`cursor-pointer group flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                    selectedValue === option.name
                        ? 'bg-purple-600/50 ring-2 ring-purple-400'
                        : 'bg-gray-800/50 hover:bg-purple-600/30'
                    }`}
                    onClick={() => onChange(option.name)}
                    title={option.name}
                >
                    <img
                    src={option.preview}
                    alt={option.name}
                    className="w-full aspect-square object-cover rounded-md transform group-hover:scale-105 transition-transform"
                    loading="lazy"
                    />
                    <p className="text-xs text-center text-gray-300 truncate w-full">{option.name}</p>
                </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
