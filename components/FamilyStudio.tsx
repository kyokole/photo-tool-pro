import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { FamilyMember, FamilyStudioSettings, FamilyStudioResult } from '../types';
import { FAMILY_SCENES, FAMILY_OUTFITS, FAMILY_POSES, DEFAULT_FAMILY_STUDIO_SETTINGS, FAMILY_ASPECT_RATIOS } from '../constants/familyStudioConstants';
import { serializeFamilyMembers } from '../utils/fileUtils';
import { generateFamilyPhoto } from '../services/geminiService';
import { applyWatermark, dataUrlToBlob, smartDownload } from '../utils/canvasUtils';

interface FamilyStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

const MemberUploader: React.FC<{
    member: FamilyMember;
    onUpdate: (update: Partial<FamilyMember>) => void;
    onRemove: () => void;
    memberNumber: number;
}> = ({ member, onUpdate, onRemove, memberNumber }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const imageUrl = useMemo(() => member.photo ? URL.createObjectURL(member.photo) : null, [member.photo]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpdate({ photo: e.target.files[0] });
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onUpdate({ photo: file });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

    return (
        <div className="bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm">{t('familyStudio.member')} {memberNumber}</h4>
                <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-xs font-bold">&times; {t('familyStudio.removeMember')}</button>
            </div>
            <div className="flex gap-2">
                <div 
                    className={`relative group w-24 h-24 rounded-lg flex-shrink-0 bg-[var(--bg-interactive)] border-2 border-dashed transition-colors ${isDragging ? 'border-[var(--accent-cyan)]' : 'border-transparent'}`}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    {imageUrl ? (
                        <img src={imageUrl} alt={`Member ${memberNumber}`} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-3xl">
                           <i className="fas fa-user-plus"></i>
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <label htmlFor={`age-${member.id}`} className="text-xs font-medium text-[var(--text-secondary)]">{t('familyStudio.ageLabel')}</label>
                    <input
                        type="text"
                        id={`age-${member.id}`}
                        value={member.age}
                        onChange={(e) => onUpdate({ age: e.target.value })}
                        placeholder={t('familyStudio.agePlaceholder')}
                        className="w-full bg-[var(--bg-interactive)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-sm mt-1"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-1">
                <button onClick={() => setIsCustomizing(!isCustomizing)} className="text-xs text-[var(--accent-cyan)] hover:underline">
                    {isCustomizing ? `[-] ${t('common.cancel')}` : `[+] ${t('familyStudio.customizeIndividual')}`}
                </button>
            </div>
             {isCustomizing && (
                <div className="space-y-2 mt-2 animate-fade-in">
                     <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)]">{t('familyStudio.bodyDescriptionLabel')}</label>
                        <textarea
                            value={member.bodyDescription || ''}
                            onChange={(e) => onUpdate({ bodyDescription: e.target.value })}
                            placeholder={t('familyStudio.bodyDescriptionPlaceholder')}
                            rows={2}
                            className="w-full bg-[var(--bg-interactive)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-sm mt-1 resize-y"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)]">{t('familyStudio.individualOutfit')}</label>
                        <input
                            type="text"
                            value={member.outfit || ''}
                            onChange={(e) => onUpdate({ outfit: e.target.value })}
                            placeholder={t('familyStudio.outfitPlaceholder')}
                            className="w-full bg-[var(--bg-interactive)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-sm mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)]">{t('familyStudio.individualPose')}</label>
                        <input
                            type="text"
                            value={member.pose || ''}
                            onChange={(e) => onUpdate({ pose: e.target.value })}
                            placeholder={t('familyStudio.posePlaceholder')}
                            className="w-full bg-[var(--bg-interactive)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-sm mt-1"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};


const FamilyStudio: React.FC<FamilyStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<FamilyStudioSettings>(DEFAULT_FAMILY_STUDIO_SETTINGS);
    const [result, setResult] = useState<FamilyStudioResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateSettings = (update: Partial<FamilyStudioSettings>) => {
        setSettings(prev => ({ ...prev, ...update }));
    };

    const addMember = () => {
        if (settings.members.length >= 9) {
            alert(t('familyStudio.maxMembersReached'));
            return;
        }
        const newMember: FamilyMember = { id: `member_${Date.now()}`, photo: null, age: '' };
        updateSettings({ members: [...settings.members, newMember] });
    };

    const removeMember = (id: string) => {
        if (settings.members.length <= 2) {
            alert(t('familyStudio.minMembersRequired'));
            return;
        }
        updateSettings({ members: settings.members.filter(m => m.id !== id) });
    };

    const updateMember = (id: string, update: Partial<FamilyMember>) => {
        updateSettings({ members: settings.members.map(m => m.id === id ? { ...m, ...update } : m) });
    };

    const handleGenerate = useCallback(async () => {
        if (settings.members.length < 2) {
            setError(t('familyStudio.minMembersRequired'));
            return;
        }
        if (settings.members.some(m => !m.photo)) {
            setError(t('errors.uploadRequired'));
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const serializedMembers = await serializeFamilyMembers(settings.members);
            const payload = { ...settings, members: serializedMembers };

            const imageDataFromServer = await generateFamilyPhoto(payload);
            
            const finalImage = !isVip ? await applyWatermark(imageDataFromServer) : imageDataFromServer;
            
            setResult({ id: `family-${Date.now()}`, imageUrl: finalImage });

        } catch (err) {
            console.error("Family photo generation failed:", err);
            const displayMessage = err instanceof Error ? err.message : t('errors.unknownError');
            setError(t('errors.generationFailed', { error: displayMessage }));
        } finally {
            setIsLoading(false);
        }
    }, [settings, t, isVip]);

    const canGenerate = useMemo(() => {
        return !isLoading && settings.members.length >= 2 && settings.members.every(m => m.photo !== null);
    }, [isLoading, settings.members]);
    
    const handleDownload = useCallback(async () => {
        if (!result) return;
        try {
            const blob = dataUrlToBlob(result.imageUrl);
            const file = new File([blob], `family-photo-${result.id}.png`, { type: 'image/png' });
            
            if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
                await navigator.share({
                    files: [file],
                    title: 'Family Photo by AI PHOTO SUITE',
                });
            } else {
                smartDownload(result.imageUrl, `family-photo-${result.id}.png`);
            }
        } catch (err) {
            console.error('Error saving or sharing file:', err);
            if (err instanceof Error && err.name !== 'AbortError') {
                 smartDownload(result.imageUrl, `family-photo-${result.id}.png`);
            }
        }
    }, [result]);

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans animate-fade-in">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('familyStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('familyStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8 mt-6 flex-1">
                {/* Left Panel: Settings */}
                <aside className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col">
                    <div className="flex-grow overflow-y-auto space-y-6 pr-2 -mr-2 scrollbar-thin">
                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('familyStudio.membersTitle')}</h3>
                            <div className="space-y-3">
                                {settings.members.map((member, index) => (
                                    <MemberUploader
                                        key={member.id}
                                        member={member}
                                        onUpdate={(update) => updateMember(member.id, update)}
                                        onRemove={() => removeMember(member.id)}
                                        memberNumber={index + 1}
                                    />
                                ))}
                            </div>
                            <button onClick={addMember} className="w-full mt-3 text-sm py-2 border-2 border-dashed border-[var(--border-color)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors">
                                + {t('familyStudio.addMember')}
                            </button>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('familyStudio.settingsTitle')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold block mb-2">{t('familyStudio.sceneLabel')}</label>
                                    <select value={settings.scene} onChange={e => updateSettings({ scene: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                        {FAMILY_SCENES.map(s => <option key={s} value={t(`familyStudioOptions.scenes.${s}`)}>{t(`familyStudioOptions.scenes.${s}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold block mb-2">{t('familyStudio.outfitLabel')}</label>
                                    <select value={settings.outfit} onChange={e => updateSettings({ outfit: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                        {FAMILY_OUTFITS.map(o => <option key={o} value={t(`familyStudioOptions.outfits.${o}`)}>{t(`familyStudioOptions.outfits.${o}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold block mb-2">{t('familyStudio.poseLabel')}</label>
                                    <select value={settings.pose} onChange={e => updateSettings({ pose: e.target.value })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                        {FAMILY_POSES.map(p => <option key={p} value={t(`familyStudioOptions.poses.${p}`)}>{t(`familyStudioOptions.poses.${p}`)}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="text-sm font-semibold block mb-2">{t('familyStudio.aspectRatioLabel')}</label>
                                    <select value={settings.aspectRatio} onChange={e => updateSettings({ aspectRatio: e.target.value as '4:3' | '16:9' })} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                                        {FAMILY_ASPECT_RATIOS.map(ratio => (
                                            <option key={ratio.value} value={ratio.value}>{t(ratio.labelKey)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-start space-x-3 p-3 rounded-lg bg-black/20 border border-[var(--border-color)]">
                                    <input 
                                        id="faceConsistency" 
                                        type="checkbox" 
                                        checked={settings.faceConsistency} 
                                        onChange={e => updateSettings({ faceConsistency: e.target.checked })} 
                                        className="form-checkbox mt-1" 
                                    />
                                    <div>
                                        <label htmlFor="faceConsistency" className="font-semibold text-white">{t('familyStudio.faceConsistencyLabel')}</label>
                                        <p className="text-xs text-[var(--text-secondary)]">{t('familyStudio.faceConsistencyTooltip')}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                                        {t('familyStudio.customPromptLabel')}
                                        <div className="group relative">
                                            <i className="fas fa-info-circle text-[var(--text-secondary)] cursor-help"></i>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-black/80 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm z-10">
                                                {t('familyStudio.customPromptTooltip')}
                                            </div>
                                        </div>
                                    </label>
                                    <textarea value={settings.customPrompt} onChange={e => updateSettings({ customPrompt: e.target.value })} placeholder={t('familyStudio.customPromptPlaceholder')} rows={3} className="w-full bg-[var(--bg-deep-space)] text-sm border border-white/20 rounded-md p-2 focus:ring-1 focus:ring-[var(--accent-blue)] resize-y"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="mt-auto pt-6">
                        <button onClick={handleGenerate} disabled={!canGenerate} className={`w-full btn-gradient text-white font-bold py-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${canGenerate ? 'animate-pulse-glow' : ''}`}>
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('familyStudio.generating')}
                                </>
                            ) : (
                                <><i className="fas fa-users mr-2"></i> {t('familyStudio.generateButton')}</>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Right Panel: Result */}
                <main className="bg-[var(--bg-component)] p-4 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[500px]">
                    {isLoading ? (
                        <div className="text-center p-8">
                             <svg className="animate-spin h-10 w-10 text-[var(--accent-blue)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-4 text-[var(--text-secondary)] animate-pulse">{t('familyStudio.generating')}</p>
                        </div>
                    ) : result ? (
                        <div className="group relative w-full h-full rounded-lg overflow-hidden">
                            <img src={result.imageUrl} alt="Generated family photo" className="object-contain w-full h-full animate-fade-in" />
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button onClick={handleDownload} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                    <i className="fas fa-download mr-2"></i> {t('familyStudio.download')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-gray-500">
                            {error ? (
                                <p className="text-red-400">{error}</p>
                            ) : (
                                <>
                                    <i className="fas fa-image fa-4x mb-4"></i>
                                    <h3 className="font-semibold text-lg">{t('familyStudio.resultTitle')}</h3>
                                    <p className="mt-1 text-sm">{t('familyStudio.resultPlaceholder')}</p>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </main>
        </div>
    );
};

export default FamilyStudio;