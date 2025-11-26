
// components/RestorationTool.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestorationResult, RestorationOptions, DocumentRestorationOptions } from '../types';
import { performRestoration, performDocumentRestoration } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/fileUtils';
import { applyWatermark } from '../utils/canvasUtils';
import { ImageUploader } from './ImageUploader';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { smartDownload } from '../utils/canvasUtils';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface RestorationToolProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

const DEFAULT_PHOTO_OPTIONS: RestorationOptions = {
    mode: 'hq',
    removeScratches: true,
    removeYellowing: true,
    sharpenFace: true,
    redrawHair: false,
    naturalSkinSmoothing: false,
    colorize: true,
    isVietnamese: true,
    gender: 'auto',
    age: 'auto',
    context: '',
    highQuality: false, // Default to fast mode
};

const DEFAULT_DOC_OPTIONS: DocumentRestorationOptions = {
    documentType: 'general',
    removeStains: true,
    deskew: true,
    enhanceText: true,
    preserveSignatures: true,
    customPrompt: '',
    highQuality: false, // Default to fast mode
};

const RestorationTool: React.FC<RestorationToolProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [result, setResult] = useState<RestorationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [activeTool, setActiveTool] = useState<'photo' | 'document'>('photo');
    const [photoOptions, setPhotoOptions] = useState<RestorationOptions>(DEFAULT_PHOTO_OPTIONS);
    const [documentOptions, setDocumentOptions] = useState<DocumentRestorationOptions>(DEFAULT_DOC_OPTIONS);
    const [resultViewMode, setResultViewMode] = useState<'compare' | 'result'>('compare');

    const originalImageUrl = useMemo(() => {
        if (!originalFile) return null;
        return URL.createObjectURL(originalFile);
    }, [originalFile]);

    useEffect(() => {
        return () => {
            if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        };
    }, [originalImageUrl]);

    const handleReset = useCallback(() => {
        setOriginalFile(null);
        setResult(null);
        setError(null);
        setIsLoading(false);
        setPhotoOptions(DEFAULT_PHOTO_OPTIONS);
        setDocumentOptions(DEFAULT_DOC_OPTIONS);
        setResultViewMode('compare');
    }, []);

    const handleImageUpload = (file: File) => {
        handleReset();
        setOriginalFile(file);
    };

    const handleGenerate = async () => {
        if (!originalFile) return;
        
        setIsLoading(true);
        setError(null);
        setResult(null);
        setResultViewMode('compare');

        try {
            const imagePart = await fileToGenerativePart(originalFile);
            if (!imagePart) throw new Error(t('errors.fileProcessingError'));
            
            let restoredDataUrl: string;

            if(activeTool === 'photo') {
                restoredDataUrl = await performRestoration(imagePart, photoOptions);
            } else { // document
                restoredDataUrl = await performDocumentRestoration(imagePart, documentOptions);
            }

            if (!isVip) {
                restoredDataUrl = await applyWatermark(restoredDataUrl);
            }

            setResult({
                originalUrl: URL.createObjectURL(originalFile),
                restoredUrl: restoredDataUrl,
            });

        } catch (err) {
            let errorString = String(err);
            if (errorString.includes('FUNCTION_INVOCATION_TIMEOUT') || errorString.includes('504')) {
                setError(t('errors.timeout'));
            } else {
                const displayMessage = err instanceof Error ? err.message : t('errors.unknownError');
                setError(t('errors.restorationPipelineFailed', { error: displayMessage }));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const getResultTabClass = (isActive: boolean) => 
        `px-4 sm:px-6 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
            isActive ? 'bg-[var(--bg-component-light)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-component-light)]/50'
        }`;

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
                    <div className="flex-shrink-0 flex bg-[var(--bg-interactive)] p-1 rounded-lg">
                        <button onClick={() => setResultViewMode('compare')} className={getResultTabClass(resultViewMode === 'compare')}>
                            <i className="fas fa-sliders-h mr-2"></i> {t('restoration.viewModes.compare')}
                        </button>
                        <button onClick={() => setResultViewMode('result')} className={getResultTabClass(resultViewMode === 'result')}>
                           <i className="fas fa-image mr-2"></i> {t('restoration.viewModes.result')}
                        </button>
                    </div>

                    <div className="w-full flex-grow relative min-h-0">
                        <div className="w-full h-full flex items-center justify-center">
                            {resultViewMode === 'compare' ? (
                                <BeforeAfterSlider before={result.originalUrl} after={result.restoredUrl} />
                            ) : (
                                <img 
                                    src={result.restoredUrl} 
                                    alt={t('restoration.resultAlt')} 
                                    className="w-full h-full object-contain rounded-lg"
                                    style={{ WebkitTouchCallout: 'default' }}
                                />
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0" style={{ minHeight: '44px' }}> {/* Reserve space to prevent layout shift */}
                        {resultViewMode === 'result' && (
                            <button onClick={() => smartDownload(result.restoredUrl, `${activeTool}-restored-${Date.now()}.png`)} className="btn-gradient text-white font-bold py-2 px-6 rounded-lg shadow-lg animate-fade-in">
                                <i className="fas fa-download mr-2"></i> {t('common.download')}
                            </button>
                        )}
                    </div>
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

    const getTabClass = (isActive: boolean) => 
        `flex-1 flex items-center justify-center gap-2 p-4 text-lg font-bold rounded-t-lg border-b-4 transition-all duration-300 ${
            isActive ? 'bg-[var(--bg-component)] border-[var(--accent-cyan)] text-white' : 'bg-[var(--bg-interactive)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-component-light)] hover:text-white'
        }`;

    return (
        <div className="flex-1 flex flex-col animate-fade-in h-full px-4 sm:px-6 lg:p-8">
            <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-4 sm:pt-6 lg:pt-0 pb-2">
                <div />
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

            <main className="w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row gap-8 my-4 overflow-hidden">
                <div className="flex-1 flex flex-col lg:order-last min-h-0">
                     <div className="flex-1 bg-[var(--bg-component)] rounded-2xl shadow-lg border border-[var(--border-color)] flex items-center justify-center min-h-[400px]">
                        {renderContent()}
                     </div>
                </div>
                
                <aside className="w-full lg:w-[450px] lg:flex-shrink-0 bg-transparent flex flex-col overflow-hidden">
                    <div className="flex">
                        <button className={getTabClass(activeTool === 'photo')} onClick={() => setActiveTool('photo')}>
                            <i className="fas fa-image"></i> {t('restoration.tabs.photo')}
                        </button>
                        <button className={getTabClass(activeTool === 'document')} onClick={() => setActiveTool('document')}>
                            <i className="fas fa-file-alt"></i> {t('restoration.tabs.document')}
                        </button>
                    </div>
                    
                    <div className={`bg-[var(--bg-component)] rounded-b-2xl shadow-lg p-6 border border-t-0 border-[var(--border-color)] flex flex-col flex-grow overflow-y-auto scrollbar-thin transition-opacity duration-500 ${!originalFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {activeTool === 'photo' ? (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-3">
                                    <h3 className="text-base font-bold text-center animated-gradient-text uppercase tracking-wider">{t('restoration.modes.title')}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['quick', 'hq', 'portrait', 'reconstruct'] as RestorationOptions['mode'][]).map(mode => (
                                             <button key={mode} onClick={() => setPhotoOptions(p => ({...p, mode}))} className={`p-3 rounded-lg text-sm transition-all text-center ${photoOptions.mode === mode ? 'bg-[var(--accent-blue)]/20 border-2 border-[var(--accent-blue)] text-white' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border-2 border-transparent'}`}>
                                                <p className="font-semibold">{t(`restoration.modes.${mode}.title`)}</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-1">{t(`restoration.modes.${mode}.desc`)}</p>
                                             </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                                    <h3 className="text-base font-bold text-center animated-gradient-text uppercase tracking-wider">{t('restoration.details.title')}</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        <div className="flex items-center space-x-2"><input id="removeScratches" type="checkbox" checked={photoOptions.removeScratches} onChange={e => setPhotoOptions(p => ({...p, removeScratches: e.target.checked}))} className="form-checkbox" /><label htmlFor="removeScratches" className="text-sm">{t('restoration.details.removeScratches')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="removeYellowing" type="checkbox" checked={photoOptions.removeYellowing} onChange={e => setPhotoOptions(p => ({...p, removeYellowing: e.target.checked}))} className="form-checkbox" /><label htmlFor="removeYellowing" className="text-sm">{t('restoration.details.removeYellowing')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="sharpenFace" type="checkbox" checked={photoOptions.sharpenFace} onChange={e => setPhotoOptions(p => ({...p, sharpenFace: e.target.checked}))} className="form-checkbox" /><label htmlFor="sharpenFace" className="text-sm">{t('restoration.details.sharpenFace')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="redrawHair" type="checkbox" checked={photoOptions.redrawHair} onChange={e => setPhotoOptions(p => ({...p, redrawHair: e.target.checked}))} className="form-checkbox" /><label htmlFor="redrawHair" className="text-sm">{t('restoration.details.redrawHair')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="naturalSkinSmoothing" type="checkbox" checked={photoOptions.naturalSkinSmoothing} onChange={e => setPhotoOptions(p => ({...p, naturalSkinSmoothing: e.target.checked}))} className="form-checkbox" /><label htmlFor="naturalSkinSmoothing" className="text-sm">{t('restoration.details.naturalSkinSmoothing')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="colorize" type="checkbox" checked={photoOptions.colorize} onChange={e => setPhotoOptions(p => ({...p, colorize: e.target.checked}))} className="form-checkbox" /><label htmlFor="colorize" className="text-sm">{t('restoration.options.core.colorize')}</label></div>
                                    </div>
                                </div>
                                 <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                                    <h3 className="text-base font-bold text-center animated-gradient-text uppercase tracking-wider">{t('restoration.options.context.title')}</h3>
                                     <div className="flex items-center space-x-2"><input id="isVietnamese" type="checkbox" checked={photoOptions.isVietnamese} onChange={e => setPhotoOptions(p => ({...p, isVietnamese: e.target.checked}))} className="form-checkbox" /><label htmlFor="isVietnamese" className="text-sm">{t('restoration.details.isVietnamese')}</label></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold block mb-1">{t('restoration.options.face.gender')}</label>
                                            <select value={photoOptions.gender} onChange={e => setPhotoOptions(p => ({...p, gender: e.target.value as RestorationOptions['gender']}))} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-2 py-1.5 text-sm"><option value="auto">{t('restoration.options.auto')}</option><option value="male">{t('restoration.options.face.genders.male')}</option><option value="female">{t('restoration.options.face.genders.female')}</option></select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold block mb-1">{t('restoration.options.face.age')}</label>
                                            <select value={photoOptions.age} onChange={e => setPhotoOptions(p => ({...p, age: e.target.value as RestorationOptions['age']}))} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-2 py-1.5 text-sm"><option value="auto">{t('restoration.options.auto')}</option><option value="child">{t('restoration.options.face.ages.child')}</option><option value="young_adult">{t('restoration.options.face.ages.young_adult')}</option><option value="adult">{t('restoration.options.face.ages.adult')}</option><option value="elderly">{t('restoration.options.face.ages.elderly')}</option></select>
                                        </div>
                                    </div>
                                     <textarea value={photoOptions.context} onChange={e => setPhotoOptions(p => ({...p, context: e.target.value}))} placeholder={t('restoration.options.context.placeholder')} className="w-full bg-[var(--bg-deep-space)] text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)]" rows={2}></textarea>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="high_quality_res"
                                            type="checkbox"
                                            checked={photoOptions.highQuality || false}
                                            onChange={e => setPhotoOptions(p => ({...p, highQuality: e.target.checked}))}
                                            className="form-checkbox"
                                        />
                                        <label htmlFor="high_quality_res" className="text-sm font-semibold text-[var(--text-primary)]">
                                            {t('common.highQualityLabel')}
                                        </label>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 ml-6">
                                        {t('common.highQualityDesc')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="text-sm font-semibold block mb-2">{t('restoration.docOptions.docType.label')}</label>
                                    <select value={documentOptions.documentType} onChange={e => setDocumentOptions(p => ({...p, documentType: e.target.value as DocumentRestorationOptions['documentType']}))} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                        <option value="general">{t('restoration.docOptions.docType.types.general')}</option>
                                        <option value="id_card">{t('restoration.docOptions.docType.types.id_card')}</option>
                                        <option value="license">{t('restoration.docOptions.docType.types.license')}</option>
                                        <option value="certificate">{t('restoration.docOptions.docType.types.certificate')}</option>
                                        <option value="handwritten">{t('restoration.docOptions.docType.types.handwritten')}</option>
                                    </select>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-center my-3 animated-gradient-text uppercase tracking-wider">{t('restoration.docOptions.options.title')}</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2"><input id="removeStains" type="checkbox" checked={documentOptions.removeStains} onChange={e => setDocumentOptions(p => ({...p, removeStains: e.target.checked}))} className="form-checkbox" /><label htmlFor="removeStains" className="text-sm">{t('restoration.docOptions.options.removeStains')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="deskew" type="checkbox" checked={documentOptions.deskew} onChange={e => setDocumentOptions(p => ({...p, deskew: e.target.checked}))} className="form-checkbox" /><label htmlFor="deskew" className="text-sm">{t('restoration.docOptions.options.deskew')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="enhanceText" type="checkbox" checked={documentOptions.enhanceText} onChange={e => setDocumentOptions(p => ({...p, enhanceText: e.target.checked}))} className="form-checkbox" /><label htmlFor="enhanceText" className="text-sm">{t('restoration.docOptions.options.enhanceText')}</label></div>
                                        <div className="flex items-center space-x-2"><input id="preserveSignatures" type="checkbox" checked={documentOptions.preserveSignatures} onChange={e => setDocumentOptions(p => ({...p, preserveSignatures: e.target.checked}))} className="form-checkbox" /><label htmlFor="preserveSignatures" className="text-sm">{t('restoration.docOptions.options.preserveSignatures')}</label></div>
                                    </div>
                                </div>
                                <div className="border-t border-[var(--border-color)] pt-4">
                                    <h3 className="text-base font-bold text-center mb-3 animated-gradient-text uppercase tracking-wider">{t('restoration.options.context.title')}</h3>
                                    <textarea value={documentOptions.customPrompt} onChange={e => setDocumentOptions(p => ({...p, customPrompt: e.target.value}))} placeholder={t('restoration.docOptions.customPromptPlaceholder')} className="w-full bg-[var(--bg-deep-space)] text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)]" rows={3}></textarea>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="high_quality_doc"
                                            type="checkbox"
                                            checked={documentOptions.highQuality || false}
                                            onChange={e => setDocumentOptions(p => ({...p, highQuality: e.target.checked}))}
                                            className="form-checkbox"
                                        />
                                        <label htmlFor="high_quality_doc" className="text-sm font-semibold text-[var(--text-primary)]">
                                            {t('common.highQualityLabel')}
                                        </label>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 ml-6">
                                        {t('common.highQualityDesc')}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="pt-6">
                            {(originalFile && !result) && (
                                <button onClick={() => handleGenerate()} disabled={isLoading} className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50">
                                    {isLoading ? <>{t('common.processing')}</> : <><i className="fas fa-wand-magic-sparkles mr-2"></i> {t('restoration.restoreButton')}</>}
                                </button>
                            )}
                            {result && (
                                <button onClick={handleReset} className="w-full btn-secondary text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 text-lg">
                                    {t('restoration.restoreAnother')}
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default RestorationTool;
