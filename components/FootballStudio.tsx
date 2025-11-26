
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FootballStudioSettings, FootballStudioResult, FootballCategory } from '../types';
import { generateFootballPhoto } from '../services/footballService';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { FOOTBALL_ASPECT_RATIOS, FOOTBALL_TEAMS, FOOTBALL_PLAYERS, FOOTBALL_IDOL_SCENES, FOOTBALL_OUTFIT_SCENES, FOOTBALL_STYLES, DEFAULT_FOOTBALL_SETTINGS } from '../constants/footballConstants';
import { Spinner } from './creativestudio/Spinner';
import { smartDownload } from '../utils/canvasUtils';

interface FootballStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const FootballStudio: React.FC<FootballStudioProps> = ({ theme, setTheme }) => {
    const { t, i18n } = useTranslation();
    const [settings, setSettings] = useState<FootballStudioSettings>(DEFAULT_FOOTBALL_SETTINGS);
    const [result, setResult] = useState<FootballStudioResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const sourceImageUrl = useMemo(() => settings.sourceImage ? URL.createObjectURL(settings.sourceImage) : null, [settings.sourceImage]);

    // Dynamic options based on mode and category
    const teamOptions = useMemo(() => {
        const teams = FOOTBALL_TEAMS[settings.category];
        return [...teams].sort((a, b) => {
            if (a === 'vietnam') return -1;
            if (b === 'vietnam') return 1;
            return t(`footballStudio.teams.${a}`).localeCompare(t(`footballStudio.teams.${b}`), i18n.language);
        });
    }, [settings.category, i18n.language, t]);

    const playerOptions = useMemo(() => {
        return FOOTBALL_PLAYERS[settings.category]?.[settings.team] || [];
    }, [settings.category, settings.team]);
    
    const sceneOptions = useMemo(() => {
        return settings.mode === 'idol' ? FOOTBALL_IDOL_SCENES : FOOTBALL_OUTFIT_SCENES;
    }, [settings.mode]);

    const updateSettings = (update: Partial<FootballStudioSettings>) => {
        setSettings(prev => ({ ...prev, ...update }));
    };

    // Effect to update dependent dropdowns
    useEffect(() => {
        const newTeams = FOOTBALL_TEAMS[settings.category];
        if (!newTeams.includes(settings.team)) {
            const newTeam = newTeams.includes('vietnam') ? 'vietnam' : newTeams[0];
            const newPlayers = FOOTBALL_PLAYERS[settings.category]?.[newTeam] || [];
            const newPlayer = newPlayers[0]?.vi || '';
            updateSettings({ team: newTeam, player: newPlayer });
        }
    }, [settings.category]);

    useEffect(() => {
        const newPlayers = FOOTBALL_PLAYERS[settings.category]?.[settings.team] || [];
        const currentPlayerExists = newPlayers.some(p => p.vi === settings.player);
        if (!currentPlayerExists) {
            updateSettings({ player: newPlayers[0]?.vi || '' });
        }
    }, [settings.team]);

    useEffect(() => {
        const newScenes = settings.mode === 'idol' ? FOOTBALL_IDOL_SCENES : FOOTBALL_OUTFIT_SCENES;
        if (!newScenes.includes(settings.scene)) {
            updateSettings({ scene: newScenes[0] });
        }
    }, [settings.mode]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            updateSettings({ sourceImage: e.target.files[0] });
        }
    };

    const triggerUpload = () => {
        document.getElementById('football-studio-upload')?.click();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isLoading) return;
        const file = e.dataTransfer.files?.[0];
        if (file) updateSettings({ sourceImage: file });
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!settings.sourceImage && !isLoading) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

    const handleGenerate = useCallback(async () => {
        if (!settings.sourceImage) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const playerInfo = FOOTBALL_PLAYERS[settings.category]?.[settings.team]?.find(p => p.vi === settings.player);
            
            const promptSettings = {
                ...settings,
                team: t(`footballStudio.teams.${settings.team}`),
                player: playerInfo?.en || settings.player,
                scene: t(settings.scene),
                style: t(settings.style),
            };

            const imageUrl = await generateFootballPhoto(promptSettings);
            setResult({ id: `football-${Date.now()}`, imageUrl });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    }, [settings, t]);
    
    const renderSetting = (label: string, control: React.ReactNode) => (
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{label}</label>
            {control}
        </div>
    );
    
    const canGenerate = !isLoading && !!settings.sourceImage;
    const currentLang = i18n.language as 'vi' | 'en';

    return (
        <div className="flex-1 flex flex-col animate-fade-in h-full">
            <input type="file" id="football-studio-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />

            <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('footballStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('footballStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 min-h-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
                {/* Main Content Area */}
                <main className="flex-1 flex flex-col gap-6 min-h-0">
                    <div className="bg-[var(--bg-component)] rounded-xl p-3 flex flex-col min-h-0 flex-1 border border-[var(--border-color)] shadow-lg">
                        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">
                            {settings.mode === 'idol' ? t('footballStudio.sourceImage') : t('footballStudio.outfitImage')}
                        </h2>
                        <div 
                            onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={handleDragLeave}
                            onClick={!sourceImageUrl ? triggerUpload : undefined}
                            className={`group relative flex-1 rounded-2xl overflow-hidden flex items-center justify-center p-4 transition-all duration-300 border-2 border-dashed ${!sourceImageUrl ? 'bg-[var(--bg-interactive)] cursor-pointer' : ''} ${isDragging ? 'border-[var(--accent-cyan)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] hover:border-[var(--accent-cyan)]'}`}>
                            {sourceImageUrl ? (
                                <div className="group relative max-w-full max-h-full">
                                    <img src={sourceImageUrl} alt="source" className="block max-w-full max-h-full object-contain rounded-lg" />
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                       <button onClick={triggerUpload} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                            <i className="fas fa-file-image mr-2"></i> {settings.mode === 'idol' ? t('footballStudio.changeButton') : t('footballStudio.outfitChangeButton')}
                                        </button>
                                    </div>
                                </div>
                           ) : (
                                <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                                     <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                        <i className="fas fa-upload mr-2"></i> {settings.mode === 'idol' ? t('footballStudio.uploadButton') : t('footballStudio.outfitUploadButton')}
                                    </div>
                                    <p className="text-[var(--text-secondary)] mt-3 text-sm">{settings.mode === 'idol' ? t('footballStudio.idolUploadTip') : t('footballStudio.outfitUploadTip')}</p>
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
                        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase text-center tracking-wider">{t('footballStudio.result')}</h2>
                        <div className="flex-1 grid place-items-center bg-[var(--bg-deep-space)] rounded-lg p-4 shadow-inner min-h-[300px]">
                            {isLoading ? (
                                <div className="text-center p-8"><Spinner /></div>
                            ) : result ? (
                                <div className="group relative w-full h-full rounded-lg overflow-hidden">
                                    <img src={result.imageUrl} alt="Generated football photo" className="object-contain w-full h-full animate-fade-in" />
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={() => smartDownload(result.imageUrl, `football-studio-${result.id}.png`)} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                            <i className="fas fa-download mr-2"></i> {t('footballStudio.download')}
                                        </button>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg"><p>{error}</p></div>
                            ) : (
                                <div className="text-center p-8 text-gray-500"><i className="fas fa-image fa-3x"></i><p className="mt-2">{t('footballStudio.resultPlaceholder')}</p></div>
                            )}
                        </div>
                    </div>
                </main>

                 {/* Control Panel */}
                <aside className="w-full lg:w-[420px] bg-[var(--bg-component)] p-4 rounded-xl flex flex-col flex-shrink-0 border border-[var(--border-color)] overflow-y-auto scrollbar-thin lg:order-first">
                    <h2 className="text-lg font-bold text-center mb-4">{t('footballStudio.settings')}</h2>
                    <div className="space-y-4">
                        {renderSetting(t('footballStudio.mode'), (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => updateSettings({ mode: 'idol' })} className={`py-2 px-3 rounded-md text-sm transition-all duration-200 w-full font-semibold ${settings.mode === 'idol' ? 'btn-gradient text-white shadow-md' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}>{t('footballStudio.idolMode')}</button>
                                <button onClick={() => updateSettings({ mode: 'outfit' })} className={`py-2 px-3 rounded-md text-sm transition-all duration-200 w-full font-semibold ${settings.mode === 'outfit' ? 'btn-gradient text-white shadow-md' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}>{t('footballStudio.outfitMode')}</button>
                            </div>
                        ))}
                        
                        {renderSetting(t('footballStudio.category'), (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => updateSettings({ category: 'contemporary' })} className={`py-2 px-3 rounded-md text-sm transition-all duration-200 w-full font-semibold ${settings.category === 'contemporary' ? 'btn-gradient text-white shadow-md' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}>{t('footballStudio.categories.contemporary')}</button>
                                <button onClick={() => updateSettings({ category: 'legendary' })} className={`py-2 px-3 rounded-md text-sm transition-all duration-200 w-full font-semibold ${settings.category === 'legendary' ? 'btn-gradient text-white shadow-md' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}>{t('footballStudio.categories.legendary')}</button>
                            </div>
                        ))}
                        
                        {renderSetting(t('footballStudio.team'), <select value={settings.team} onChange={e => updateSettings({ team: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">{teamOptions.map(teamKey => <option key={teamKey} value={teamKey}>{t(`footballStudio.teams.${teamKey}`)}</option>)}</select>)}
                        {renderSetting(t('footballStudio.player'), 
                            <select value={settings.player} onChange={e => updateSettings({ player: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                <option value="">{t('footballStudio.placeholders.player')}</option>
                                {playerOptions.map(p => <option key={p.vi} value={p.vi}>{p[currentLang] || p.vi}</option>)}
                            </select>
                        )}
                        {renderSetting(t('footballStudio.scene'), 
                            <select value={settings.scene} onChange={e => updateSettings({ scene: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                <option value="">{t('footballStudio.placeholders.scene')}</option>
                                {sceneOptions.map(sKey => <option key={sKey} value={sKey}>{t(sKey)}</option>)}
                            </select>
                        )}
                        
                        {/* Aspect Ratio Button Grid */}
                        {renderSetting(t('footballStudio.aspectRatio'), 
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {FOOTBALL_ASPECT_RATIOS.map(r => (
                                    <button 
                                        key={r.value} 
                                        onClick={() => updateSettings({ aspectRatio: r.value })}
                                        className={`py-2 px-2 rounded-md text-xs font-bold transition-all duration-200 w-full ${settings.aspectRatio === r.value ? 'btn-gradient text-white shadow' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        {t(r.labelKey)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {renderSetting(t('footballStudio.style'), 
                            <select value={settings.style} onChange={e => updateSettings({ style: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                <option value="">{t('footballStudio.placeholders.style')}</option>
                                {FOOTBALL_STYLES.map(sKey => <option key={sKey} value={sKey}>{t(sKey)}</option>)}
                            </select>
                        )}
                        {renderSetting(t('footballStudio.customPrompt'), <input type="text" value={settings.customPrompt} onChange={e => updateSettings({ customPrompt: e.target.value })} placeholder={t('footballStudio.customPromptPlaceholder')} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm" />)}
                    
                        {/* Quality Toggle */}
                        <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                            <div className="flex items-center space-x-2">
                                <input
                                    id="high_quality_fb"
                                    type="checkbox"
                                    checked={settings.highQuality || false}
                                    onChange={e => updateSettings({ highQuality: e.target.checked })}
                                    className="form-checkbox"
                                />
                                <label htmlFor="high_quality_fb" className="text-sm font-semibold text-[var(--text-primary)]">
                                    {t('common.highQualityLabel')}
                                </label>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 ml-6">
                                {t('common.highQualityDesc')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-auto pt-4">
                         <button onClick={handleGenerate} disabled={!canGenerate} className={`w-full btn-gradient text-white font-bold py-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${canGenerate ? 'animate-pulse-glow' : ''}`}>
                            {isLoading ? <><Spinner /> <span className="ml-2">{t('footballStudio.generating')}</span></> : <><i className="fas fa-futbol mr-2"></i> {t('footballStudio.generateButton')}</>}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default FootballStudio;
