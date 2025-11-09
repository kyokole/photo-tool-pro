// components/creativestudio/FeatureSelector.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FEATURES } from '../../constants/creativeStudioConstants';
import { FeatureAction } from '../../types';

interface FeatureSelectorProps {
  selectedFeature: FeatureAction;
  onSelectFeature: (featureId: FeatureAction) => void;
}

const UNIMPLEMENTED_FEATURES: FeatureAction[] = [
  // This list is now empty because all features have been implemented on the backend.
];


export const FeatureSelector: React.FC<FeatureSelectorProps> = ({ selectedFeature, onSelectFeature }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex justify-center flex-wrap gap-2 sm:gap-3 my-8">
      {FEATURES.map((feature) => {
        const isImplemented = !UNIMPLEMENTED_FEATURES.includes(feature.action);
        
        return (
          <button
            key={feature.action}
            onClick={() => isImplemented && onSelectFeature(feature.action)}
            disabled={!isImplemented}
            title={!isImplemented ? t('aiStudio.comingSoon') : undefined}
            className={`flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base border border-transparent ${
              selectedFeature === feature.action
                ? 'btn-gradient text-white shadow-lg shadow-[var(--accent-blue-glow)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100`}
          >
            <i className={`${feature.icon} w-5 text-center`}></i>
            <span className="ml-2">{t(`aiStudio.features.${feature.action}`)}</span>
          </button>
        )
      })}
    </div>
  );
};