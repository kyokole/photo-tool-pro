
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { HeadshotStyle, HeadshotResult, User } from '../types';
import { HEADSHOT_STYLES, CREDIT_COSTS } from '../constants';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { smartDownload } from '../utils/canvasUtils';

interface HeadshotGeneratorProps {
    sourceFile: File | null;
    results: HeadshotResult[];
    isLoading: boolean;
    error: string | null;
    onImageUpload: (file: File) => void;
    onGenerate: (file: File, style: HeadshotStyle) => void;
    onReset: () => void;
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
    currentUser: User | null;
}

const HeadshotGenerator: React.FC<HeadshotGeneratorProps> = ({
    sourceFile,
    results,
    isLoading,
    error,
    onImageUpload,
    onGenerate,
    onReset,
    theme,
    setTheme,
    isVip,
    currentUser
}) => {
    const { t } = useTranslation();
    const [selectedStyle, setSelectedStyle] = useState<HeadshotStyle>(HEADSHOT_STYLES[0]);
    const [isDragging, setIsDragging] = useState(false);
    const [isHighQuality, setIsHighQuality] = useState(false); // New state
    const sourceImageUrl = useMemo(() => sourceFile ? URL.createObjectURL(sourceFile) : null, [sourceFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };
    
    const triggerUpload = () => {
        const input = document.getElementById('headshot-upload') as HTMLInputElement;
        if (input) {
            input.value = '';
            input.click();
        }
    };

    const handleGenerateClick = () => {
        if (sourceFile && selectedStyle) {
            const styleWithQuality = { ...selectedStyle, highQuality: isHighQuality };
            onGenerate(sourceFile, styleWithQuality);
        }
    }

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
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isLoading) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onImageUpload(file);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!sourceFile && !isLoading) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };


    const getOptionButtonClass = (isActive: boolean) => {
        const base = 'p-3 rounded-lg text-center transition-all duration-200 text-sm font-semibold';
        if (isActive) {
            return `${base} btn-gradient text-white shadow-md`;
        }
        return `${base} bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`;
    };

    const hasResults = results.length > 0;
    const canGenerate = !isLoading && !!sourceFile;

    // Calculate cost: 4 images * cost per image
    const singleImageCost = isHighQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;
    const totalCost = 4 * singleImageCost;

    return (
        <div className="flex-1 flex flex-col text-[var(--text-primary)] animate-fade-in">
            <input type="file" id="headshot-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 pt-6 pb-2">
                 <div /> {/* Spacer */}
                 <div className="text-center">
                    <h1 
                        className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text"
                        style={{ fontFamily: "'Exo 2', sans-serif" }}
                    >
                        {t('headshot.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('headshot.subtitle')}</p>
                 </div>
                 <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 px-6 pb-6">
                {/* Left Panel */}
                <div className="w-full lg:w-2/5 flex flex-col gap-4">
                    <div className="bg-[var(--bg-component)] rounded-xl p-3 flex flex-col min-h-0 flex-1 border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('headshot.sourceImageTitle')}</h2>
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
                                    <img src={sourceImageUrl} alt={t('headshot.sourceAlt')} className="block max-w-full max-h-full object-contain rounded-lg" />
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                       <button onClick={handleNewUploadRequest} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                            <i className="fas fa-file-image mr-2"></i> {t('headshot.useAnotherImage')}
                                        </button>
                                    </div>
                                </div>
                           ) : (
                                <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                                     <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                        <i className="fas fa-upload mr-2"></i> {t('headshot.uploadButton')}
                                    </div>
                                    <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('headshot.uploadTip')}</p>
                                </div>
                           )}
                           {isDragging && !sourceImageUrl && (
                               <div className="absolute inset-0 bg-[var(--accent-blue)]/10 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
                                    <p className="text-white font-bold text-lg">{t('imagePanes.dropToUpload')}</p>
                                </div>
                           )}
                        </div>
                    </div>

                    <div className="bg-[var(--bg-component)] rounded-xl p-4 border border-[var(--border-color)] shadow-lg">
                         <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider text-center">{t('headshot.styleTitle')}</h2>
                         <div className="grid grid-cols-2 gap-3">
                             {HEADSHOT_STYLES.map(style => (
                                 <button
                                     key={style.id}
                                     onClick={() => setSelectedStyle(style)}
                                     className={getOptionButtonClass(selectedStyle.id === style.id)}
                                 >
                                     {t(style.nameKey)}
                                 </button>
                             ))}
                         </div>
                         <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                            <div className="flex items-center space-x-2">
                                <input
                                    id="high_quality_hs"
                                    type="checkbox"
                                    checked={isHighQuality}
                                    onChange={e => setIsHighQuality(e.target.checked)}
                                    className="form-checkbox"
                                />
                                <label htmlFor="high_quality_hs" className="text-sm font-semibold text-[var(--text-primary)]">
                                    {t('common.highQualityLabel')}
                                </label>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 ml-6">
                                {t('common.highQualityDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full lg:w-3/5 bg-[var(--bg-component)] rounded-xl p-3 flex flex-col border border-[var(--border-color)] shadow-lg">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('headshot.resultsTitle')}</h2>
                     <div className="flex-1 grid place-items-center bg-[var(--bg-deep-space)] rounded-lg p-4 shadow-inner">
                        {hasResults && !isLoading ? (
                             <div className="grid grid-cols-2 gap-4 w-full h-full">
                                {results.map(result => (
                                    <div key={result.id} className="relative group overflow-hidden rounded-lg aspect-w-1 aspect-h-1 bg-black/20">
                                        <img src={result.imageUrl} alt={t('headshot.resultAlt')} className="w-full h-full object-cover animate-fade-in" />
                                         <button onClick={() => smartDownload(result.imageUrl, `headshot-${result.id}.png`)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <i className="fas fa-download fa-2x text-white"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-[var(--text-secondary)] p-4">
                                <i className="fas fa-camera-retro fa-3x"></i>
                                <p className="mt-2">{t('headshot.resultsPlaceholder')}</p>
                                {!sourceFile && <p className="text-xs mt-1">{t('headshot.uploadAndSelectStyle')}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
             {error && (
              <div className="bg-red-900/50 text-red-300 text-center p-3 rounded-md border border-red-500/50 mx-6 mb-2">
                <strong>{t('common.error')}:</strong> {error}
              </div>
            )}

            <div className="flex-shrink-0 pt-4 border-t border-[var(--border-color)] px-6 pb-2">
                 <button onClick={handleGenerateClick} disabled={!canGenerate} className={`w-full max-w-md mx-auto btn-gradient text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${canGenerate ? 'animate-pulse-glow' : ''}`}>
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('headshot.generating')}
                        </>
                    ) : (
                        <>
                            <i className="fas fa-magic mr-3"></i> 
                            {t('headshot.generateButton')} 
                            {isVip ? ' (Miễn phí)' : (currentUser ? ` (${totalCost} Credits)` : ' (Miễn phí - Watermark)')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default HeadshotGenerator;
