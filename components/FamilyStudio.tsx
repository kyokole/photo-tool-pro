
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { FamilyMember, FamilyStudioSettings, FamilyStudioResult, ROI, SerializedFamilyStudioSettings } from '../types';
import { FAMILY_SCENES, FAMILY_OUTFITS, FAMILY_POSES, DEFAULT_FAMILY_STUDIO_SETTINGS, FAMILY_ASPECT_RATIOS } from '../constants/familyStudioConstants';
import { serializeFamilyMembers } from '../utils/fileUtils';
import { generateFamilyPhoto_3_Pass } from '../services/geminiService';
import { dataUrlToBlob, smartDownload } from '../utils/canvasUtils';
// REMOVED: import { applyWatermark } from '../utils/canvasUtils';
import { ZoomModal } from './creativestudio/ZoomModal';
import { CREDIT_COSTS } from '../constants';

interface FamilyStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

// Helper for base64 display
const b64Src = (b64: string) => `data:image/png;base64,${b64}`;

const DebugPanel: React.FC<{ debugData: NonNullable<FamilyStudioResult['debug']> }> = ({ debugData }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="mt-4 text-xs text-gray-500 hover:text-white underline w-full text-center opacity-50 hover:opacity-100 transition-opacity">
                🛠️ Xem Thông tin Kỹ thuật (Debug)
            </button>
        );
    }

    return (
        <div className="mt-4 w-full bg-[#0d1117] border border-gray-700 rounded-lg p-4 text-left font-mono text-xs text-gray-300 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-yellow-500 uppercase tracking-wider">Thông tin Kỹ thuật</h3>
                <button onClick={() => setIsOpen(false)} className="text-red-400 hover:text-red-300 px-2">✕</button>
            </div>

            {/* PASS 1 */}
            <div className="mb-6">
                <h4 className="text-blue-400 font-bold mb-2 border-l-2 border-blue-400 pl-2">Bước 1: Cảnh nền cơ sở</h4>
                <div className="relative w-full aspect-[4/3] bg-gray-800 rounded overflow-hidden border border-gray-600">
                     <img src={b64Src(debugData.pass1)} className="w-full h-full object-contain" alt="Pass 1 Base" />
                </div>
            </div>

             {/* PASS 2 */}
            <div className="mb-6">
                <h4 className="text-pink-400 font-bold mb-2 border-l-2 border-pink-400 pl-2">Bước 2 & 3: Quá trình Inpainting</h4>
                <div className="space-y-4">
                    {debugData.pass2.map((m, idx) => (
                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-700">
                            <p className="mb-2 font-bold text-gray-400">Thành viên: <span className="text-cyan-300">{m.memberId}</span></p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {m.debug.map((iter, i) => (
                                    <div key={i} className="flex-shrink-0 w-32">
                                        <div className="text-[10px] text-center bg-gray-900 py-1 rounded-t text-gray-500">Lần lặp {iter.iteration}</div>
                                        <div className="grid grid-cols-2 gap-px bg-gray-600 border border-gray-600">
                                             <img src={b64Src(iter.maskBase64)} className="w-full aspect-square object-cover bg-black/50" title="Mặt nạ (Mask)" />
                                             <img src={b64Src(iter.imageBase64)} className="w-full aspect-square object-cover" title="Kết quả Inpaint" />
                                        </div>
                                        <div className="bg-gray-900 text-[9px] p-1 text-gray-500 rounded-b truncate">
                                            Vùng: {Math.round(iter.roi.x)},{Math.round(iter.roi.y)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ROI JSON */}
             <div>
                <h4 className="text-green-400 font-bold mb-2 border-l-2 border-green-400 pl-2">Dữ liệu Vùng (ROI)</h4>
                <pre className="bg-gray-900 p-2 rounded text-[10px] text-green-300 overflow-x-auto custom-scrollbar">
                    {JSON.stringify(debugData.roiJson, null, 2)}
                </pre>
            </div>
        </div>
    );
};

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
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-3xl cursor-pointer">
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
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    const updateSettings = (update: Partial<FamilyStudioSettings>) => {
      setSettings(prev => ({ ...prev, ...update }));
    };

    const addMember = () => {
      if (settings.members.length >= 9) {
        alert(t('familyStudio.maxMembersReached'));
        return;
      }
      const newMember: FamilyMember = { id: `member_${Date.now()}`, photo: null, age: '' };
      setSettings(prev => ({ ...prev, members: [...prev.members, newMember] }));
    };

    const removeMember = (id: string) => {
      if (settings.members.length <= 2) {
        alert(t('familyStudio.minMembersRequired'));
        return;
      }
      setSettings(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
    };

    const updateMember = (id: string, update: Partial<FamilyMember>) => {
      setSettings(prev => ({
        ...prev,
        members: prev.members.map(m =>
          m.id === id ? { ...m, ...update } : m
        ),
      }));
    };

    const handleDragStart = (index: number) => (dragItem.current = index);
    const handleDragEnter = (index: number) => (dragOverItem.current = index);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDragEnd = () => {
      if (dragItem.current === null || dragOverItem.current === null) return;
      if (dragItem.current === dragOverItem.current) { 
          dragItem.current = null;
          dragOverItem.current = null;
          return; 
      }

      setSettings(prev => {
        const newMembers = [...prev.members];
        const draggedItemContent = newMembers.splice(dragItem.current!, 1)[0];
        newMembers.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        return { ...prev, members: newMembers };
      });
    };

    const calculateRois = (members: FamilyMember[], aspectRatio: '4:3' | '16:9'): ROI[] => {
        const rois: ROI[] = [];
        const ar = aspectRatio === '16:9' ? 16 / 9 : 4 / 3;

        const roiWPct = Math.min(0.24, 0.72 / Math.max(1, members.length));
        const roiHPct = (roiWPct * 1.20) / ar;
        const yPct = 0.20; 
        const spacing = 1 / (members.length + 1);

        members.forEach((m, i) => {
            const cx = spacing * (i + 1);
            rois.push({ memberId: m.id, xPct: Math.max(0, cx - roiWPct / 2), yPct, wPct: roiWPct, hPct: roiHPct });
        });
        return rois;
    };


    const handleGenerate = useCallback(async () => {
        if (settings.members.length < 2) { setError(t('familyStudio.minMembersRequired')); return; }
        if (settings.members.some(m => !m.photo)) { setError(t('errors.uploadRequired')); return; }

        setIsLoading(true); setError(null); setResult(null);
        try {
            const rois = calculateRois(settings.members, settings.aspectRatio);
            const serializedMembers = await serializeFamilyMembers(settings.members);

            // Always enforce highQuality to true for 4K output
            const settingsPayload: SerializedFamilyStudioSettings = {
                ...settings,
                highQuality: true,
                members: serializedMembers,
                rois,
            };

            const { imageData, similarityScores, debug } =
            await generateFamilyPhoto_3_Pass(settingsPayload, setProgressMessage);

            // REMOVED: Client-side watermarking
            // const finalImage = !isVip ? await applyWatermark(imageData) : imageData;
            const finalImage = imageData;

            setResult({ id: `family-${Date.now()}`, imageUrl: finalImage, similarityScores, debug });
        } catch (err: any) {
            console.error(err);
            const msg = err?.error?.message ?? err?.message ?? (typeof err === 'string' ? err : '');
            if (err?.error?.code === 503 || (msg && msg.toLowerCase().includes('overloaded'))) {
                setError(t('errors.generationOverloaded'));
            } else {
                setError(t('errors.generationFailed', { error: msg || 'Lỗi không xác định từ máy chủ.' }));
            }
        } finally {
            setIsLoading(false); setProgressMessage('');
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

    const cost = settings.highQuality ? CREDIT_COSTS.HIGH_QUALITY_IMAGE : CREDIT_COSTS.STANDARD_IMAGE;

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
                                    <div
                                        key={member.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragEnter={() => handleDragEnter(index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        className="cursor-move"
                                    >
                                        <MemberUploader
                                            member={member}
                                            onUpdate={(update) => updateMember(member.id, update)}
                                            onRemove={() => removeMember(member.id)}
                                            memberNumber={index + 1}
                                        />
                                    </div>
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
                                {/* Face Consistency Checkbox with Default Checked */}
                                <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-900/30 border border-blue-500/50">
                                    <input 
                                        id="faceConsistency" 
                                        type="checkbox" 
                                        checked={settings.faceConsistency} 
                                        onChange={e => updateSettings({ faceConsistency: e.target.checked })} 
                                        className="form-checkbox mt-1 h-5 w-5 text-blue-400" 
                                    />
                                    <div>
                                        <label htmlFor="faceConsistency" className="font-bold text-blue-300 cursor-pointer">{t('familyStudio.faceConsistencyLabel')}</label>
                                        <p className="text-xs text-blue-400/80 mt-1">{t('familyStudio.faceConsistencyTooltip')}</p>
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
                                <div className="text-center mt-2">
                                    <span className="text-xs text-green-400 font-bold border border-green-500/50 bg-green-500/10 px-2 py-1 rounded">
                                        <i className="fas fa-check-circle mr-1"></i> {t('common.highQualityLabel')}
                                    </span>
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
                                    {progressMessage || t('familyStudio.generating')}
                                </>
                            ) : (
                                <><i className="fas fa-users mr-2"></i> {t('familyStudio.generateButton')} {isVip ? '(Miễn phí)' : `(${cost} Credits)`}</>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Right Panel: Result */}
                <main className="bg-[var(--bg-component)] p-4 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[500px]">
                    {isLoading ? (
                        <div className="text-center p-8">
                             <svg className="animate-spin h-10 w-10 text-[var(--accent-blue)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-4 text-[var(--text-secondary)] animate-pulse">{progressMessage || t('familyStudio.generating')}</p>
                        </div>
                    ) : result ? (
                        <div className="w-full h-full flex flex-col items-center">
                            <div className="group relative w-full h-auto max-h-[70vh] rounded-lg overflow-hidden flex-shrink-0">
                                <img src={result.imageUrl} alt="Generated family photo" className="w-full h-full object-contain animate-fade-in" />
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                                    <button title={t('aiStudio.gallery.zoom')} onClick={() => setZoomedImage(result.imageUrl.split(',')[1])} className="h-10 w-10 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)]">
                                        <span role="img" aria-label="zoom">🔍</span>
                                    </button>
                                    <button onClick={handleDownload} className="btn-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105">
                                        <i className="fas fa-download mr-2"></i> {t('familyStudio.download')}
                                    </button>
                                    {result.similarityScores && (
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm p-2 rounded-md text-xs text-white">
                                            <h5 className="font-bold mb-1">{t('resultCard.similarityScore')}:</h5>
                                            {result.similarityScores.map(s => {
                                                const member = settings.members.find(m => m.id === s.memberId);
                                                const score = Math.max(0, s.score); // Clamp score
                                                const scoreColor = score >= 0.85 ? 'text-green-400' : score >= 0.75 ? 'text-yellow-400' : 'text-red-400';
                                                return (
                                                    <p key={s.memberId}>
                                                        {member?.age || t('familyStudio.member')}:{' '}
                                                        <span className={`font-bold ${scoreColor}`}>
                                                            {(score * 100).toFixed(1)}%
                                                        </span>
                                                    </p>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {result.debug && <DebugPanel debugData={result.debug} />}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-gray-500">
                            {error ? (
                                <p className="text-red-400 max-w-md">{error}</p>
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
            {zoomedImage && (
                <ZoomModal
                    isOpen={!!zoomedImage}
                    onClose={() => setZoomedImage(null)}
                    base64Image={zoomedImage}
                />
            )}
        </div>
    );
};

export default FamilyStudio;
