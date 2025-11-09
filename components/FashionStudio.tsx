import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FashionStudioSettings, FashionStudioResult, FashionCategory, FashionAspectRatio, FashionStyle } from '../types';
import { FASHION_FEMALE_STYLES, FASHION_MALE_STYLES, FASHION_GIRL_STYLES, FASHION_BOY_STYLES, FASHION_ASPECT_RATIOS } from '../constants';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { smartDownload } from '../utils/canvasUtils';

interface FashionStudioProps {
    sourceFile: File | null;
    settings: FashionStudioSettings;
    onSettingsChange: React.Dispatch<React.SetStateAction<FashionStudioSettings>>;
    result: FashionStudioResult | null;
    isLoading: boolean;
    error: string | null;
    onImageUpload: (file: File) => void;
    onGenerate: () => void;
    onReset: () => void;
    theme: string;
    setTheme: (theme: string) => void;
}

const FashionStudio: React.FC<FashionStudioProps> = ({
    sourceFile,
    settings,
    onSettingsChange,
    result,
    isLoading,
    error,
    onImageUpload,
    onGenerate,
    onReset,
    theme,
    setTheme,
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const sourceImageUrl = useMemo(() => sourceFile ? URL.createObjectURL(sourceFile) : null, [sourceFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };
    
    const triggerUpload = () => {
        const input = document.getElementById('fashion-studio-upload') as HTMLInputElement;
        if (input) {
            input.value = '';
            input.click();
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isLoading) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onImageUpload(file);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!sourceFile && !isLoading) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };


    const handleNewUploadRequest = () => {
      if (isLoading) {
          if(window.confirm(t('confirmations.cancelInProgress'))) {
              triggerUpload();
          }
      } else if (sourceFile) {
           if(window.confirm(t('confirmations.discardChanges'))) {
              onReset();
              triggerUpload();
          }
      } else {
          triggerUpload();
      }
    };
    
    const handleCategoryChange = (category: FashionCategory) => {
        onSettingsChange(prev => ({...prev, category}));
    };

    const currentStyleOptions: FashionStyle[] = 
        settings.category === 'female' ? FASHION_FEMALE_STYLES :
        settings.category === 'male' ? FASHION_MALE_STYLES :
        settings.category === 'girl' ? FASHION_GIRL_STYLES :
        FASHION_BOY_STYLES;

    const canGenerate = !isLoading && !!sourceFile;

    const titles: Record<FashionCategory, string> = {
        female: t('fashionStudio.titles.female'),
        male: t('fashionStudio.titles.male'),
        girl: t('fashionStudio.titles.girl'),
        boy: t('fashionStudio.titles.boy'),
    };
    
    const categories: {key: FashionCategory, label: string}[] = [
        { key: 'female', label: t('fashionStudio.categories.female') },
        { key: 'male', label: t('fashionStudio.categories.male') },
        { key: 'girl', label: t('fashionStudio.categories.girl') },
        { key: 'boy', label: t('fashionStudio.categories.boy') },
    ];


    return (
        <div className="flex-1 flex flex-col animate-fade-in h-full">
            <input type="file" id="fashion-studio-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            
            <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2">
                 <div /> {/* Spacer */}
                 <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {titles[settings.category]}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('fashionStudio.subtitle')}</p>
                 </div>
                 <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
                {/* Control Panel */}
                <aside className="w-full lg:w-[380px] bg-[var(--bg-component)] p-4 rounded-xl flex flex-col flex-shrink-0 border border-[var(--border-color)] overflow-y-auto scrollbar-thin">
                    <div className="space-y-5">
                        <div>
                            <label className="text-sm font-semibold block mb-2 text-gray-300">{t('fashionStudio.labels.category')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.key}
                                        onClick={() => handleCategoryChange(cat.key)}
                                        className={`py-2 px-3 rounded-md text-sm transition-all duration-200 w-full font-semibold ${settings.category === cat.key ? 'btn-gradient text-white shadow-md' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="style-select" className="text-sm font-semibold block mb-2 text-gray-300">{t('fashionStudio.labels.style', { count: currentStyleOptions.length })}</label>
                            <select
                                id="style-select"
                                value={settings.style}
                                onChange={e => onSettingsChange(prev => ({...prev, style: e.target.value}))}
                                className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm"
                            >
                                {currentStyleOptions.map(s => <option key={s.key} value={s.promptValue}>{t(s.key)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="aspect-select" className="text-sm font-semibold block mb-2 text-gray-300">{t('fashionStudio.labels.aspectRatio')}</label>
                            <select
                                id="aspect-select"
                                value={settings.aspectRatio}
                                onChange={e => onSettingsChange(prev => ({...prev, aspectRatio: e.target.value as FashionAspectRatio}))}
                                className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm"
                            >
                                {FASHION_ASPECT_RATIOS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="desc-textarea" className="text-sm font-semibold block mb-2 text-gray-300">{t('fashionStudio.labels.description')}</label>
                             <textarea
                                id="desc-textarea"
                                value={settings.description}
                                onChange={e => onSettingsChange(prev => ({...prev, description: e.target.value}))}
                                placeholder={t('fashionStudio.placeholders.description')}
                                rows={4}
                                className="w-full bg-[var(--bg-deep-space)] text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)] resize-y"
                             />
                        </div>
                    </div>
                     <div className="mt-auto pt-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <input
                                id="high_quality"
                                type="checkbox"
                                checked={settings.highQuality}
                                onChange={e => onSettingsChange(prev => ({...prev, highQuality: e.target.checked}))}
                                className="form-checkbox"
                            />
                            <label htmlFor="high_quality" className="text-sm font-semibold text-gray-200">
                                {t('fashionStudio.labels.highQuality')}
                            </label>
                            <div className="relative group">
                                <i className="fas fa-info-circle text-gray-400 cursor-pointer"></i>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/80 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm">
                                    {t('fashionStudio.tooltips.highQuality')}
                                </div>
                            </div>
                        </div>

                        <button onClick={onGenerate} disabled={!canGenerate} className={`w-full btn-gradient text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${canGenerate ? 'animate-pulse-glow' : ''}`}>
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('common.processing')}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-magic mr-3"></i> {t('fashionStudio.generateButton')}
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col gap-6 min-h-0">
                    <div className="bg-[var(--bg-component)] rounded-xl p-3 flex flex-col min-h-0 flex-1 border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('fashionStudio.sourceImageTitle')}</h2>
                        <div 
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={!sourceImageUrl ? triggerUpload : undefined}
                            className={`group relative flex-1 rounded-2xl overflow-hidden flex items-center justify-center p-4 transition-all duration-300 border-2 border-dashed ${isDragging ? 'border-[var(--accent-cyan)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] bg-[var(--bg-interactive)]'} ${!sourceImageUrl ? 'hover:border-[var(--accent-cyan)] cursor-pointer' : ''}`}
                        >
                           {sourceImageUrl ? (
                                <div className="group relative max-w-full max-h-full">
                                    <img src={sourceImageUrl} alt={t('fashionStudio.sourceAlt')} className="block max-w-full max-h-full object-contain rounded-lg" />
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                       <button onClick={handleNewUploadRequest} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                            <i className="fas fa-file-image mr-2"></i> {t('fashionStudio.changeImage')}
                                        </button>
                                    </div>
                                </div>
                           ) : (
                                <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                                     <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                        <i className="fas fa-upload mr-2"></i> {t('fashionStudio.uploadButton')}
                                    </div>
                                    <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('fashionStudio.uploadTip')}</p>
                                </div>
                           )}
                           {isDragging && !sourceImageUrl && (
                               <div className="absolute inset-0 bg-[var(--accent-blue)]/10 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
                                    <p className="text-white font-bold text-lg">{t('imagePanes.dropToUpload')}</p>
                                </div>
                           )}
                        </div>
                    </div>
                    <div className="bg-[var(--bg-component)] rounded-xl p-3 flex flex-col min-h-0 flex-1 border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('fashionStudio.resultsTitle')}</h2>
                        <div className="flex-1 grid place-items-center bg-[var(--bg-deep-space)] rounded-lg p-4 shadow-inner overflow-hidden">
                           {isLoading ? (
                                <div className="text-center p-8">
                                    <svg className="animate-spin h-10 w-10 text-[var(--accent-cyan)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <p className="mt-4 text-gray-400 animate-pulse">{t('fashionStudio.generatingText')}</p>
                                </div>
                            ) : result ? (
                                <div className="group relative w-full h-full overflow-hidden rounded-lg">
                                    <img src={result.imageUrl} alt={t('fashionStudio.resultAlt')} className="object-cover w-full h-full animate-fade-in" />
                                     <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                       <button onClick={() => smartDownload(result.imageUrl, `fashion-studio-${result.id}.png`)} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                            <i className="fas fa-download mr-2"></i> {t('common.download')}
                                        </button>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg">
                                    <p>{error}</p>
                                </div>
                            ) : (
                                <div className="text-center p-8 text-gray-500">
                                    <i className="fas fa-image fa-3x"></i>
                                    <p className="mt-2">{t('fashionStudio.resultsPlaceholder')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FashionStudio;