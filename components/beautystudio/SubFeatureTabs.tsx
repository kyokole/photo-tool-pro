import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautySubFeature } from '../../types';


interface SubFeatureTabsProps {
  subFeatures: BeautySubFeature[];
  selectedSubFeature: BeautySubFeature | null;
  onSelect: (subFeature: BeautySubFeature) => void;
}


export const SubFeatureTabs: React.FC<SubFeatureTabsProps> = ({ subFeatures, selectedSubFeature, onSelect }) => {
  const { t } = useTranslation();
  if (!subFeatures || subFeatures.length === 0) {
    return null; // Don't render if there are no sub-features
  }
 
  return (
    <div className="overflow-x-auto whitespace-nowrap border-b border-[var(--border-color)] no-scrollbar">
        <div className="flex items-center space-x-4 px-4">
            {subFeatures.map((subFeature) => (
                <button
                    key={subFeature.id}
                    onClick={() => onSelect(subFeature)}
                    className={`py-3 text-sm font-semibold transition-colors duration-200 relative ${
                    selectedSubFeature?.id === subFeature.id
                        ? 'text-[var(--accent-cyan)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <div className="flex items-center space-x-1">
                        <span>{t(subFeature.labelKey)}</span>
                    </div>
                    {selectedSubFeature?.id === subFeature.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] rounded-full"></div>
                    )}
                </button>
            ))}
      </div>
    </div>
  );
};