import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoaderProps {
  currentStepText: string;
}

export const Loader: React.FC<LoaderProps> = ({ currentStepText }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <svg className="animate-spin h-16 w-16 text-[var(--accent-blue)] mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h2 className="text-2xl font-bold text-[var(--accent-blue)] mb-2">{t('common.processing')}</h2>
      <p className="text-[var(--text-primary)] text-lg">{currentStepText}</p>
      <p className="text-[var(--text-secondary)] mt-4 text-sm">{t('loader.patience_restoration')}</p>
    </div>
  );
};
