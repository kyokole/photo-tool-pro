import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestorationResult, RestorationOptions } from '../types';
import { performRestoration } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/fileUtils';
import { ImageUploader } from './ImageUploader';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { SliderInput } from './creativestudio/SliderInput';

interface RestorationToolProps {
    theme: string;
    setTheme: (theme: string) => void;
}

// A simple Before/After slider component
const BeforeAfterSlider: React.FC<{ before: string, after: string }> = ({ before, after }) => {
    const { t } = useTranslation();
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(percentage);
    };

    const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isDragging.current = true; };
    const onMouseUp = () => { isDragging.current = false; };
    const onMouseMove = (e: React.MouseEvent) => { if (isDragging.current) handleMove(e.clientX); };
    const onTouchStart = () => { isDragging.current = true; };
    const onTouchEnd = () => { isDragging.current = false; };
    const onTouchMove = (e: React.TouchEvent) => { if (isDragging.current) handleMove(e.touches[0].clientX); };

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-[4/3] max-w-full max-h-full overflow-hidden select-none cursor-ew-resize rounded-lg bg-black/20"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onMouseMove={onMouseMove}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
        >
            <img src={before} alt={t('restoration.originalAlt')} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <img src={after} alt={t('restoration.resultAlt')} className="absolute inset-0 w-full h-full object-contain" />
            </div>
            <div className="absolute top-0 bottom-0 bg-white w-1 cursor-ew-resize pointer-events-none" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white rounded-full h-9 w-9 flex items-center justify-center shadow-lg pointer-events-none">
                    <i className="fas fa-arrows-alt-h text-gray-700"></i>
                </div>
            </div>
        </div>
    );
};

const RestorationTool: React.FC<RestorationToolProps> = ({ theme, setTheme }) => {
    const { t } = useTranslation();
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [result, setResult] = useState<RestorationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [options, setOptions] = useState<RestorationOptions>({
        restorationLevel: 75,
        removeScratches: true,
        colorize: true,
        faceEnhance: true,
        gender: 'auto',
        age: 'auto',
        context: '',
    });

    const originalImageUrl = useMemo(() => {
        if (!originalFile) return null;
        return URL.createObjectURL(originalFile);
    }, [originalFile]);

    useEffect(() => {
        // Cleanup object URL when component unmounts or file changes
        return () => {
            if (originalImageUrl) {
                URL.revokeObjectURL(originalImageUrl);
            }
        };
    }, [originalImageUrl]);


    const handleReset = useCallback(() => {
        setOriginalFile(null);
        setResult(null);
        setError(null);
        setIsLoading(false);
    }, []);

    const handleImageUpload = (file: File) => {
        handleReset();
        setOriginalFile(file);
    };

    const runRestorationPipeline = useCallback(async (presetOptions?: Partial<RestorationOptions>) => {
        if (!originalFile) return;

        const finalOptions = { ...options, ...presetOptions };
        
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const imagePart = await fileToGenerativePart(originalFile);
            if (!imagePart) throw new Error(t('errors.fileProcessingError'));
            
            const restoredDataUrl = await performRestoration(imagePart, finalOptions);

            setResult({
                originalUrl: URL.createObjectURL(originalFile),
                restoredUrl: restoredDataUrl,
            });

        } catch (err) {
            const displayMessage = err instanceof Error ? err.message : t('errors.unknownError');
            setError(t('errors.restorationPipelineFailed', { error: displayMessage }));
        } finally {
            setIsLoading(false);
        }
    }, [originalFile, options, t]);
    
    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <svg className="animate-spin h-16 w-16 text-[var(--accent-blue)] mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-[var(--accent-blue)] mb-2">{t('common.processing')}</h2>
                    <p className="text-[var(--text-secondary)] mt-4 text-sm">{t('loader.patience_restoration')}</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="mt-6 text-center text-red-300 bg-red-900/50 p-4 rounded-lg border border-red-500/50">
                    <p className="font-semibold">{t('restoration.errorTitle')}</p>
                    <p>{error}</p>
                    <button onClick={handleReset} className="mt-4 btn-secondary text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
                        {t('common.retry')}
                    </button>
                </div>
            );
        }

        if(result) {
            return (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-4 animate-fade-in p-4">
                    <BeforeAfterSlider before={result.originalUrl} after={result.restoredUrl} />
                    <button onClick={() => window.open(result.restoredUrl, '_blank')} className="btn-gradient text-white font-bold py-2 px-6 rounded-lg shadow-lg">
                        <i className="fas fa-download mr-2"></i> {t('common.download')}
                    </button>
                </div>
            );
        }

        if (originalImageUrl) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center relative group p-4">
                    <img src={originalImageUrl} alt={t('restoration.originalAlt')} className="max-w-full max-h-full object-contain rounded-lg" />
                     <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                        <button onClick={handleReset} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                            <i className="fas fa-file-image mr-2"></i> {t('restoration.changeImage')}
                        </button>
                    </div>
                </div>
            );
        }

        return <ImageUploader onImageUpload={handleImageUpload} uploaderId="restoration-upload" />;
    };


    return (
        <div className="flex-1 flex flex-col animate-fade-in h-full px-4 sm:px-6 lg:p-8">
            <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-4 sm:pt-6 lg:pt-0 pb-2">
                <div /> {/* Spacer */}
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('restoration.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('restoration.subtitle')}</p>
                </div>
                 <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 my-4 overflow-hidden">
                {/* Image Display Area */}
                 <div className="bg-[var(--bg-component)] rounded-2xl shadow-lg border border-[var(--border-color)] flex items-center justify-center min-h-[400px]">
                    {renderContent()}
                 </div>

                {/* Control Panel */}
                <aside className={`bg-[var(--bg-component)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)] flex flex-col overflow-y-auto scrollbar-thin transition-opacity duration-500 ${!originalFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-center mb-3 animated-gradient-text uppercase tracking-wider">{t('restoration.presets.title')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => runRestorationPipeline({ colorize: false })} className="btn-secondary py-2">{t('restoration.presets.quickRestore')}</button>
                                <button onClick={() => runRestorationPipeline({ restorationLevel: 90, colorize: true, faceEnhance: true })} className="btn-secondary py-2">{t('restoration.presets.fullRestore')}</button>
                            </div>
                        </div>

                        <div className="border-t border-[var(--border-color)] pt-4">
                            <h3 className="text-base font-bold text-center mb-4 animated-gradient-text uppercase tracking-wider">{t('restoration.options.core.title')}</h3>
                            <div className="space-y-4">
                               <SliderInput label={t('restoration.options.core.level')} value={options.restorationLevel} onChange={val => setOptions(p => ({...p, restorationLevel: val}))} />
                                <div className="flex items-center space-x-2">
                                    <input id="removeScratches" type="checkbox" checked={options.removeScratches} onChange={e => setOptions(p => ({...p, removeScratches: e.target.checked}))} className="form-checkbox" />
                                    <label htmlFor="removeScratches" className="text-sm">{t('restoration.options.core.scratches')}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input id="colorize" type="checkbox" checked={options.colorize} onChange={e => setOptions(p => ({...p, colorize: e.target.checked}))} className="form-checkbox" />
                                    <label htmlFor="colorize" className="text-sm">{t('restoration.options.core.colorize')}</label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border-t border-[var(--border-color)] pt-4">
                             <h3 className="text-base font-bold text-center mb-4 animated-gradient-text uppercase tracking-wider">{t('restoration.options.face.title')}</h3>
                             <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input id="faceEnhance" type="checkbox" checked={options.faceEnhance} onChange={e => setOptions(p => ({...p, faceEnhance: e.target.checked}))} className="form-checkbox" />
                                    <label htmlFor="faceEnhance" className="text-sm">{t('restoration.options.face.enhance')}</label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">{t('restoration.options.face.gender')}</label>
                                        <select value={options.gender} onChange={e => setOptions(p => ({...p, gender: e.target.value as RestorationOptions['gender']}))} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-2 py-1.5 text-sm">
                                            <option value="auto">{t('restoration.options.auto')}</option>
                                            <option value="male">{t('restoration.options.face.genders.male')}</option>
                                            <option value="female">{t('restoration.options.face.genders.female')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">{t('restoration.options.face.age')}</label>
                                        <select value={options.age} onChange={e => setOptions(p => ({...p, age: e.target.value as RestorationOptions['age']}))} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-2 py-1.5 text-sm">
                                            <option value="auto">{t('restoration.options.auto')}</option>
                                            <option value="child">{t('restoration.options.face.ages.child')}</option>
                                            <option value="young_adult">{t('restoration.options.face.ages.young_adult')}</option>
                                            <option value="adult">{t('restoration.options.face.ages.adult')}</option>
                                            <option value="elderly">{t('restoration.options.face.ages.elderly')}</option>
                                        </select>
                                    </div>
                                </div>
                             </div>
                        </div>

                         <div className="border-t border-[var(--border-color)] pt-4">
                            <h3 className="text-base font-bold text-center mb-3 animated-gradient-text uppercase tracking-wider">{t('restoration.options.context.title')}</h3>
                             <textarea value={options.context} onChange={e => setOptions(p => ({...p, context: e.target.value}))} placeholder={t('restoration.options.context.placeholder')} className="w-full bg-[var(--bg-deep-space)] text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)]" rows={2}></textarea>
                        </div>
                    </div>
                    <div className="mt-auto pt-6">
                        {originalFile && !result && (
                            <button onClick={() => runRestorationPipeline()} disabled={isLoading} className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50">
                                {isLoading ? <>{t('common.processing')}</> : <><i className="fas fa-wand-magic-sparkles mr-2"></i> {t('restoration.restoreButton')}</>}
                            </button>
                        )}
                        {result && (
                            <button onClick={handleReset} className="w-full btn-secondary text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 text-lg">
                                {t('restoration.restoreAnother')}
                            </button>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default RestorationTool;