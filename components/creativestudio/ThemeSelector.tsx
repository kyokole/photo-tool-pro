// components/creativestudio/ThemeSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const THEMES = [
    { id: 'rose-gold-glam', nameKey: 'themes.roseGoldGlam' },
    { id: 'cyberpunk-night', nameKey: 'themes.cyberpunkNight' },
    { id: 'galactic-cobalt', nameKey: 'themes.galacticCobalt' },
    { id: 'synthwave-grid', nameKey: 'themes.synthwaveGrid' },
];

interface ThemeSelectorProps {
    currentTheme: string;
    onChangeTheme: (theme: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onChangeTheme }) => {
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

    const handleThemeChange = (themeId: string) => {
        onChangeTheme(themeId);
        setIsOpen(false);
    }

    const selectedTheme = THEMES.find(t => t.id === currentTheme);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg p-2 sm:px-4 sm:py-2 text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2 transition-colors"
                title={t('themes.change')}
            >
                <i className="fas fa-palette w-5 text-center"></i>
                <span className="hidden sm:inline">{selectedTheme ? t(selectedTheme.nameKey) : t('themes.select')}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-md shadow-lg z-20 border border-[var(--border-color)]">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-hover)] ${currentTheme === theme.id ? 'font-bold text-[var(--accent-text-start)]' : 'text-[var(--text-secondary)]'}`}
                        >
                            {t(theme.nameKey)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};