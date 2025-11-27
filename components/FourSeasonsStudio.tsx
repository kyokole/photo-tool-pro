
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { generateFourSeasonsPhoto, detectOutfit, editOutfitOnImage } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/fileUtils';
import { dataUrlToBlob, smartDownload } from '../utils/canvasUtils';
// REMOVED: import { applyWatermark } from '../utils/canvasUtils';
import type { Scene, FilePart } from '../types';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type AspectRatio = '1:1' | '4:3' | '9:16' | '16:9' | '3:4';

interface FourSeasonsStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-10 w-10' }) => (
  <svg className={`animate-spin ${size}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Particles: React.FC = () => (
    <div className="particles" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="particle"></div>
        ))}
    </div>
);


const FourSeasonsStudio: React.FC<FourSeasonsStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [activeSeason, setActiveSeason] = useState<Season>('spring');
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [customDescription, setCustomDescription] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredRatio, setHoveredRatio] = useState<AspectRatio | null>(null);
    const [isHighQuality, setIsHighQuality] = useState(false);

    // State for the new outfit editor
    const [outfitEditPrompt, setOutfitEditPrompt] = useState<string>('');
    const [isEditingOutfit, setIsEditingOutfit] = useState(false);
    const [detectedOutfit, setDetectedOutfit] = useState<string>('');


    const sourceImageUrl = useMemo(() => sourceFile ? URL.createObjectURL(sourceFile) : null, [sourceFile]);

    const seasonsConfig = useMemo(() => ({
        spring: {
            nameKey: 'fourSeasons.seasons.spring', icon: '🌸', subtitleKey: 'fourSeasons.subtitles.spring',
            generateButtonKey: 'fourSeasons.generateButtonBySeason.spring',
            accent: 'text-green-400', accentBg: 'bg-green-500 hover:bg-green-600', accentBorder: 'border-green-500', ring: 'ring-green-500',
            imageUrl: 'https://images.pexels.com/photos/2102907/pexels-photo-2102907.jpeg',
            prompts: t('fourSeasons.prompts.spring', { returnObjects: true }) as Scene[]
        },
        summer: {
            nameKey: 'fourSeasons.seasons.summer', icon: '☀️', subtitleKey: 'fourSeasons.subtitles.summer',
            generateButtonKey: 'fourSeasons.generateButtonBySeason.summer',
            accent: 'text-yellow-400', accentBg: 'bg-yellow-500 hover:bg-yellow-600', accentBorder: 'border-yellow-500', ring: 'ring-yellow-500',
            imageUrl: 'https://images.pexels.com/photos/1430677/pexels-photo-1430677.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
            prompts: t('fourSeasons.prompts.summer', { returnObjects: true }) as Scene[]
        },
        autumn: {
            nameKey: 'fourSeasons.seasons.autumn', icon: '🍂', subtitleKey: 'fourSeasons.subtitles.autumn',
            generateButtonKey: 'fourSeasons.generateButtonBySeason.autumn',
            accent: 'text-orange-400', accentBg: 'bg-orange-500 hover:bg-orange-600', accentBorder: 'border-orange-500', ring: 'ring-orange-500',
            imageUrl: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
            prompts: t('fourSeasons.prompts.autumn', { returnObjects: true }) as Scene[]
        },
        winter: {
            nameKey: 'fourSeasons.seasons.winter', icon: '❄️', subtitleKey: 'fourSeasons.subtitles.winter',
            generateButtonKey: 'fourSeasons.generateButtonBySeason.winter',
            accent: 'text-sky-400', accentBg: 'bg-sky-500 hover:bg-sky-600', accentBorder: 'border-sky-500', ring: 'ring-sky-500',
            imageUrl: 'https://images.pexels.com/photos/751601/pexels-photo-751601.jpeg',
            prompts: t('fourSeasons.prompts.winter', { returnObjects: true }) as Scene[]
        },
    }), [t]);

    const aspectRatioHints: Record<AspectRatio, string> = {
        '1:1': t('batch.ratios.ratio_1_1', { defaultValue: 'Vuông (Avatar/Facebook)' }),
        '4:3': t('batch.ratios.ratio_4_3', { defaultValue: 'Chân dung cổ điển' }),
        '9:16': t('batch.ratios.ratio_9_16', { defaultValue: 'Dọc (Story/TikTok)' }),
        '16:9': t('batch.ratios.ratio_16_9', { defaultValue: 'Ngang (Youtube/Điện ảnh)' }),
        '3:4': t('batch.ratios.ratio_3_4', { defaultValue: 'Dọc (Điện thoại)' })
    };

    useEffect(() => {
        if (resultImage) {
            const detect = async () => {
                setDetectedOutfit('');
                try {
                    const base64Data = resultImage.split(',')[1];
                    const mimeType = resultImage.match(/data:([^;]+);/)?.[1] || 'image/png';
                    const outfit = await detectOutfit(base64Data, mimeType);
                    setDetectedOutfit(outfit);
                } catch (e) {
                    console.error("Outfit detection failed:", e);
                    setDetectedOutfit(''); // Reset on failure
                }
            };
            detect();
        } else {
            setDetectedOutfit('');
            setOutfitEditPrompt('');
        }
    }, [resultImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSourceFile(e.target.files[0]);
            setResultImage(null);
            setError(null);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isLoading) return;
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSourceFile(file);
            setResultImage(null);
            setError(null);
        }
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!sourceFile && !isLoading) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

    const triggerUpload = () => {
        document.getElementById('season-upload-input')?.click();
    };

    const handleGenerate = useCallback(async () => {
        if (!sourceFile || !selectedScene) {
            setError(t('errors.uploadRequired'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const imagePart = await fileToGenerativePart(sourceFile);
            if (!imagePart) throw new Error(t('errors.fileProcessingError'));
            
            let generatedImage = await generateFourSeasonsPhoto(imagePart, selectedScene, activeSeason, aspectRatio, customDescription, isHighQuality);
            
            // REMOVED: Client-side watermarking
            // if (!isVip) { generatedImage = await applyWatermark(generatedImage); }

            setResultImage(generatedImage);

        } catch (err) {
            const errorString = String(err);
            if (errorString.includes('FUNCTION_INVOCATION_TIMEOUT') || errorString.includes('504')) {
                setError(t('errors.timeout'));
            } else {
                setError(err instanceof Error ? err.message : t('errors.unknownError'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [sourceFile, selectedScene, activeSeason, aspectRatio, customDescription, t, isVip, isHighQuality]);

     const handleEditOutfit = useCallback(async () => {
        if (!resultImage || !outfitEditPrompt.trim()) return;

        setIsEditingOutfit(true);
        setError(null);

        try {
            const base64Data = resultImage.split(',')[1];
            const mimeType = resultImage.match(/data:([^;]+);/)?.[1] || 'image/png';
            let newImage = await editOutfitOnImage(base64Data, mimeType, outfitEditPrompt);

            // REMOVED: Client-side watermarking
            // if (!isVip) { newImage = await applyWatermark(newImage); }

            setResultImage(newImage); 
            setOutfitEditPrompt(''); 
        } catch (err) {
            const errorString = String(err);
            if (errorString.includes('FUNCTION_INVOCATION_TIMEOUT') || errorString.includes('504')) {
                setError(t('errors.timeout'));
            } else {
                setError(err instanceof Error ? err.message : t('errors.unknownError'));
            }
        } finally {
            setIsEditingOutfit(false);
        }
    }, [resultImage, outfitEditPrompt, t, isVip]);

    const handleDownload = useCallback(async () => {
        if (!resultImage) return;
        
        try {
            // Check if running on mobile for better UX using Native Share
            if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                const blob = dataUrlToBlob(resultImage);
                const file = new File([blob], `four-seasons-${activeSeason}.png`, { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'Four Seasons Photo',
                });
            } else {
                smartDownload(resultImage, `four-seasons-${activeSeason}.png`);
            }
        } catch (e) {
            // Fallback if share fails or is cancelled, try forcing download
            console.error("Share failed, falling back to download", e);
            smartDownload(resultImage, `four-seasons-${activeSeason}.png`);
        }
    }, [resultImage, activeSeason]);
    
    const currentSeasonTheme = seasonsConfig[activeSeason];
    
    return (
        <div className="flex-1 flex flex-col h-full font-sans transition-colors duration-500">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
                 <div />
                 <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('fourSeasons.title')}
                    </h1>
                    <p key={activeSeason} className="text-[var(--text-secondary)] mt-2 text-lg animate-fade-in">{t(currentSeasonTheme.subtitleKey)}</p>
                 </div>
                 <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>
            
            <div className="w-full max-w-5xl mx-auto px-4 py-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.keys(seasonsConfig).map(s => {
                        const seasonKey = s as Season;
                        const season = seasonsConfig[seasonKey];
                        const isActive = activeSeason === seasonKey;
                        
                        let particles = null;
                        if (seasonKey === 'spring' || seasonKey === 'autumn' || seasonKey === 'winter') {
                           particles = <Particles />;
                        }

                        return (
                            <button
                                key={seasonKey}
                                onClick={() => { setActiveSeason(seasonKey); setSelectedScene(null); }}
                                className={`season-card season-card-${seasonKey} group relative h-28 rounded-2xl overflow-hidden text-white font-bold text-xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${isActive ? `ring-4 ${season.ring}` : 'focus:ring-2 focus:ring-opacity-50 ' + season.ring}`}
                            >
                                <img src={season.imageUrl} alt={t(season.nameKey)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}></div>
                                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                                    <span className="text-3xl">{season.icon}</span>
                                    <span>{t(season.nameKey)}</span>
                                </div>
                                {particles}
                            </button>
                        )
                    })}
                </div>
            </div>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 md:p-8 min-h-0">
                {/* Left Panel */}
                <div className="space-y-6 bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] overflow-y-auto scrollbar-thin">
                    <div>
                        <h3 className="text-lg font-bold mb-2">{t('fourSeasons.uploadTitle')}</h3>
                         <div 
                            onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={handleDragLeave}
                            onClick={!sourceImageUrl ? triggerUpload : undefined}
                            className={`group relative flex items-center justify-center p-4 transition-all duration-300 border-2 border-dashed rounded-2xl min-h-[192px] ${!sourceImageUrl ? 'bg-[var(--bg-interactive)] cursor-pointer' : 'bg-black/20'} ${isDragging ? `${currentSeasonTheme.accentBorder} bg-opacity-20` : 'border-[var(--border-color)] hover:border-[var(--accent-cyan)]'}`}
                        >
                            <input type="file" id="season-upload-input" className="hidden" accept="image/*" onChange={handleFileChange} />
                            {sourceImageUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img src={sourceImageUrl} alt="Preview" className="max-h-48 max-w-full object-contain rounded-lg"/>
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                       <button onClick={triggerUpload} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                            <i className="fas fa-file-image mr-2"></i> {t('fashionStudio.changeImage')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                                    <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                        <i className="fas fa-upload mr-2"></i> {t('headshot.uploadButton')}
                                    </div>
                                    <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('common.uploadPrompt')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2">{t('fourSeasons.contextTitle')}</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                           {(currentSeasonTheme.prompts || []).map((p, i) => (
                                <div key={i} onClick={() => setSelectedScene(p)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${selectedScene?.title === p.title ? `bg-[var(--bg-interactive-hover)] shadow-inner ${currentSeasonTheme.accentBorder}` : `bg-[var(--bg-interactive)] border-transparent hover:border-[var(--border-color)]`}`}>
                                    <p className="font-semibold">{p.title}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{p.desc}</p>
                                </div>
                           ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">{t('fourSeasons.aspectRatioTitle')}</h3>
                            {/* Hover Hint Bubble */}
                            <div className={`bg-[var(--accent-cyan)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transition-all duration-300 transform ${hoveredRatio ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                {hoveredRatio && aspectRatioHints[hoveredRatio]}
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {(['1:1', '4:3', '3:4', '16:9', '9:16'] as AspectRatio[]).map(r => (
                                 <button 
                                    key={r} 
                                    onClick={() => setAspectRatio(r)}
                                    onMouseEnter={() => setHoveredRatio(r)}
                                    onMouseLeave={() => setHoveredRatio(null)}
                                    className={`py-2 px-3 rounded-md text-sm font-bold transition-all duration-200 w-full ${aspectRatio === r ? `${currentSeasonTheme.accentBg} text-white shadow` : `bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-bold mb-2">{t('fourSeasons.detailsTitle')}</h3>
                        <textarea
                            value={customDescription}
                            onChange={(e) => setCustomDescription(e.target.value)}
                            placeholder={t('fashionStudio.placeholders.description')}
                            rows={2}
                            className={`w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-interactive)] focus:ring-2 focus:${currentSeasonTheme.ring} transition duration-200`}
                        />
                    </div>
                    {/* High Quality Checkbox */}
                    <div className="flex items-center space-x-2 p-2 bg-[var(--bg-interactive)] rounded-lg border border-[var(--border-color)]">
                        <input
                            id="high_quality_fs"
                            type="checkbox"
                            checked={isHighQuality}
                            onChange={e => setIsHighQuality(e.target.checked)}
                            className="form-checkbox"
                        />
                        <label htmlFor="high_quality_fs" className="text-sm font-semibold text-[var(--text-primary)]">
                            {t('common.highQualityLabel')}
                        </label>
                    </div>

                     <button onClick={handleGenerate} disabled={isLoading || !sourceFile || !selectedScene} className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:bg-gray-400/50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${currentSeasonTheme.accentBg}`}>
                        {isLoading ? <><Spinner size="h-5 w-5" /> <span>{t('fourSeasons.generating')}</span></> : <><i className="fas fa-magic"></i> {t(currentSeasonTheme.generateButtonKey)}</>}
                    </button>
                </div>
                {/* Right Panel */}
                <div className={`bg-[var(--bg-component)] p-4 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[500px]`}>
                    {isLoading ? (
                         <div className="w-full h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
                            <div className={`relative ${currentSeasonTheme.accent}`}>
                                <Spinner />
                            </div>
                            <p className={`mt-4 font-semibold animate-pulse ${currentSeasonTheme.accent}`}>{t('fourSeasons.generating')}</p>
                        </div>
                    ) : error ? (
                        <p className="text-red-400 text-center">{error}</p>
                    ) : resultImage ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="w-full h-full relative group flex-1 rounded-lg overflow-hidden">
                                <img src={resultImage} alt="Generated result" className="w-full h-full object-cover"/>
                                <button 
                                    onClick={handleDownload} 
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer w-full h-full border-none"
                                >
                                    <i className="fas fa-download fa-2x text-white"></i>
                                </button>
                            </div>
                             <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-lg space-y-3 animate-fade-in border border-[var(--border-color)]">
                                <h4 className="font-semibold text-[var(--text-primary)]">
                                    {t('fourSeasons.editOutfit.title')} {detectedOutfit && `(${detectedOutfit})`}
                                </h4>
                                <textarea 
                                    value={outfitEditPrompt}
                                    onChange={(e) => setOutfitEditPrompt(e.target.value)}
                                    placeholder={t('fourSeasons.editOutfit.placeholder')}
                                    rows={2}
                                    className="w-full p-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-interactive)] focus:ring-2 focus:ring-[var(--ring-color)] transition duration-200 text-sm"
                                />
                                <button 
                                    onClick={handleEditOutfit} 
                                    disabled={isEditingOutfit || !outfitEditPrompt.trim()}
                                    className={`w-full text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isEditingOutfit ? 'bg-gray-500' : currentSeasonTheme.accentBg}`}
                                >
                                    {isEditingOutfit ? <><Spinner size="h-5 w-5" /> <span>{t('fourSeasons.editOutfit.editing')}</span></> : <><i className="fas fa-tshirt"></i> {t('fourSeasons.editOutfit.button')}</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-secondary)]">
                            <i className={`fas fa-leaf fa-4x mb-4 ${currentSeasonTheme.accent}`}></i>
                            <h3 className="font-semibold text-lg text-[var(--text-primary)]">{t('fourSeasons.resultPlaceholder')}</h3>
                            <p className="text-sm max-w-xs">{t('fourSeasons.resultPlaceholderDesc')}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FourSeasonsStudio;
