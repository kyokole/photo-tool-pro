// components/creativestudio/Header.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
    onOpenLibrary: () => void;
    onOpenTrainer: () => void;
    currentTheme: string;
    onChangeTheme: (theme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLibrary, onOpenTrainer, currentTheme, onChangeTheme }) => {
  const { t } = useTranslation();
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
      <div /> {/* Spacer for balance */}
      <div className="text-center">
        <h1
          className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          {t('tools.creativeStudio')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">
          {t('aiStudio.subtitle')}
        </p>
      </div>
      <div className="flex justify-end items-center gap-2 sm:gap-4">
        <ThemeSelector currentTheme={currentTheme} onChangeTheme={onChangeTheme} />
         <button 
            onClick={onOpenTrainer}
            className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hidden sm:flex items-center gap-2 transition-colors"
            title={t('aiStudio.header.trainer')}
        >
             <i className="fas fa-brain w-5 text-center"></i>
             <span>{t('aiStudio.header.trainer')}</span>
        </button>
         <button 
            onClick={onOpenLibrary}
            className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hidden sm:flex items-center gap-2 transition-colors"
            title={t('aiStudio.library.title')}
            aria-label={t('aiStudio.library.openAria')}
        >
             <i className="fas fa-images w-5 text-center"></i>
             <span>{t('aiStudio.library.title')}</span>
        </button>
      </div>
    </header>
  );
};