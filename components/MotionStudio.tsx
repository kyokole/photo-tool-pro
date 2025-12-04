
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { MotionShot, MotionStudioSettings, MotionCharacter, AnalyzedScene } from '../types';
import { CREDIT_COSTS } from '../constants';
import { VideoIcon, UploadIcon, PlusIcon, TrashIcon, PlayIcon, DownloadIcon } from './icons';
import { generateVideoFromImage, enhanceVideoPrompt, analyzeVideoFrames } from '../services/creativeStudioService';
import { fileToBase64, resizeBase64 } from '../utils/fileUtils';
import { smartDownload } from '../utils/canvasUtils';

// Make JSZip available from the window object loaded via CDN
declare const JSZip: any;

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

interface MotionStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

// --- CONSTANTS: SAMPLE PROJECTS & CAMERA MOVES ---
// UPDATED: Use keys for localization
const CAMERA_MOVEMENTS = [
    { id: 'static', labelKey: 'motionStudio.camera.static', prompt: 'static camera, stable shot' },
    { id: 'zoom_in', labelKey: 'motionStudio.camera.zoom_in', prompt: 'slow zoom in, cinematic approach' },
    { id: 'zoom_out', labelKey: 'motionStudio.camera.zoom_out', prompt: 'slow zoom out, revealing surroundings' },
    { id: 'pan_left', labelKey: 'motionStudio.camera.pan_left', prompt: 'camera panning left, smooth motion' },
    { id: 'pan_right', labelKey: 'motionStudio.camera.pan_right', prompt: 'camera panning right, smooth motion' },
    { id: 'tracking', labelKey: 'motionStudio.camera.tracking', prompt: 'tracking shot, following the subject' },
    { id: 'drone', labelKey: 'motionStudio.camera.drone', prompt: 'aerial drone shot, sweeping view' },
];

const SAMPLE_PROJECTS = [
    {
        id: 'cyberpunk',
        nameKey: 'motionStudio.samples.cyberpunk',
        shotsKey: 'motionStudio.sampleScripts.cyberpunk'
    },
    {
        id: 'nature',
        nameKey: 'motionStudio.samples.nature',
        shotsKey: 'motionStudio.sampleScripts.nature'
    }
];

const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);


// --- COMPONENT: Cinema Modal (Sequential Player) ---
const CinemaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    shots: MotionShot[];
}> = ({ isOpen, onClose, shots }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Filter only completed shots
    const completedShots = useMemo(() => shots.filter(s => s.status === 'done' && s.videoUrl), [shots]);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (videoRef.current && isOpen && completedShots[currentIndex]) {
            videoRef.current.load();
            videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        }
    }, [currentIndex, isOpen, completedShots]);

    const handleEnded = () => {
        if (currentIndex < completedShots.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    if (!isOpen || completedShots.length === 0) return null;

    const currentShot = completedShots[currentIndex];

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 animate-fade-in">
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <i className="fas fa-times text-3xl"></i>
            </button>

            <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative border border-gray-800">
                 <video 
                    ref={videoRef}
                    src={currentShot.videoUrl} 
                    className="w-full h-full object-contain" 
                    controls 
                    autoPlay 
                    onEnded={handleEnded}
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-white text-xs font-mono">
                    {t('motionStudio.cinema.playingScene', { current: currentIndex + 1, total: completedShots.length })}
                </div>
                {/* Subtitle/Prompt Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12 pointer-events-none">
                     <p className="text-white text-sm font-medium text-center opacity-90 drop-shadow-md max-w-3xl mx-auto line-clamp-2">
                        {currentShot.prompt}
                     </p>
                </div>
            </div>

            <div className="mt-6 flex gap-4">
                <button 
                    onClick={() => setCurrentIndex(0)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-redo"></i> {t('motionStudio.cinema.replay')}
                </button>
            </div>
            
            {/* Film Strip Thumbnail Preview */}
            <div className="mt-8 flex gap-2 overflow-x-auto max-w-full pb-2 px-4 no-scrollbar mask-linear-fade">
                 {completedShots.map((shot, idx) => (
                     <button 
                        key={shot.id} 
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative h-16 aspect-video rounded overflow-hidden border-2 transition-all flex-shrink-0 ${currentIndex === idx ? 'border-[var(--accent-cyan)] scale-110 z-10' : 'border-transparent opacity-50 hover:opacity-100'}`}
                     >
                         {/* Use image preview if available, else fallback to video poster/black */}
                         {shot.imagePreview ? (
                             <img src={shot.imagePreview} className="w-full h-full object-cover" />
                         ) : (
                             <video src={shot.videoUrl} className="w-full h-full object-cover" />
                         )}
                     </button>
                 ))}
            </div>
        </div>
    );
};

// --- COMPONENT: HighlightTextarea (The "Magic" Input) ---
const HighlightTextarea: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    characters: MotionCharacter[];
    className?: string;
}> = ({ value, onChange, placeholder, characters, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const getHighlightedText = (text: string) => {
        if (!text) return <span className="text-gray-500 opacity-50">{placeholder}</span>;
        let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const sortedChars = [...characters].sort((a, b) => b.name.length - a.name.length);
        
        sortedChars.forEach(char => {
            if (!char.name.trim()) return;
            // FIX: Escape special regex characters to prevent crashes
            const safeName = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(@?${safeName})`, 'gi'); 
            html = html.replace(regex, '<span class="text-yellow-400 font-bold bg-yellow-500/20 rounded px-0.5">$1</span>');
        });

        return <span dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, '<br/>') + '<br/>' }} />; 
    };

    return (
        <div className={`relative group overflow-hidden rounded-lg bg-[var(--bg-deep-space)] border border-white/10 focus-within:ring-1 focus-within:ring-[var(--accent-cyan)] focus-within:border-[var(--accent-cyan)] transition-all ${className}`} ref={containerRef}>
            <div 
                ref={backdropRef}
                className="absolute inset-0 p-3 whitespace-pre-wrap break-words pointer-events-none font-sans text-sm leading-relaxed overflow-hidden text-transparent"
                style={{ color: 'transparent' }} 
            >
               <div className="text-[var(--text-primary)]">
                   {getHighlightedText(value)}
               </div>
            </div>

            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full bg-transparent p-3 text-sm font-sans leading-relaxed resize-none outline-none text-transparent caret-white selection:bg-blue-500/30"
                style={{ color: 'transparent' }}
                spellCheck={false}
            />
        </div>
    );
};

// --- COMPONENT: Character Quick Bar ---
const CharacterQuickBar: React.FC<{
    characters: MotionCharacter[];
    onInsert: (tag: string) => void;
}> = ({ characters, onInsert }) => {
    const { t } = useTranslation();
    if (characters.length === 0) return null;

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-2 border-b border-white/5">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase whitespace-nowrap mr-1">
                <i className="fas fa-user-tag mr-1"></i> {t('motionStudio.character.quickCast')}
            </span>
            {characters.map(char => (
                <button
                    key={char.id}
                    onClick={() => onInsert(`@${char.name} `)}
                    className="flex items-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-white/10 rounded-full pl-1 pr-3 py-1 transition-all group flex-shrink-0"
                    title={`Insert @${char.name}`}
                >
                    <img src={char.previewUrl} alt={char.name} className="w-6 h-6 rounded-full object-cover border border-[var(--accent-cyan)]/50" />
                    <span className="text-xs font-mono font-bold text-[var(--accent-cyan)] group-hover:text-white">@{char.name}</span>
                </button>
            ))}
        </div>
    );
};


// --- Sub-Components for Character Management ---

const CharacterManagerTab: React.FC<{
    characters: MotionCharacter[];
    onAdd: (file: File, name: string, desc: string) => void;
    onRemove: (id: string) => void;
    onClearAll: () => void;
}> = ({ characters, onAdd, onRemove, onClearAll }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [tempName, setTempName] = useState('');
    const [tempDesc, setTempDesc] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            if (!tempName) {
                const cleanName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                setTempName(cleanName);
            }
        }
    };

    const handleSave = () => {
        if (selectedFile && tempName) {
            onAdd(selectedFile, tempName, tempDesc);
            setTempName('');
            setTempDesc('');
            setSelectedFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 h-full min-h-0">
             {/* LEFT: Create Profile */}
             <div className="flex flex-col h-full overflow-y-auto scrollbar-thin pr-1">
                 <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] shadow-lg flex flex-col h-auto">
                    <h3 className="text-sm font-bold text-[var(--accent-cyan)] mb-4 uppercase tracking-wide border-b border-white/10 pb-2 flex items-center gap-2">
                        <i className="fas fa-user-plus"></i> {t('motionStudio.character.createTitle')}
                    </h3>
                    
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative aspect-[3/4] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group mb-4 shadow-inner ${previewUrl ? 'border-[var(--accent-cyan)] bg-black/40' : 'border-[var(--border-color)] bg-[var(--bg-interactive)] hover:border-[var(--accent-cyan)] hover:bg-[var(--bg-hover)]'}`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <span className="text-white font-bold text-xs"><i className="fas fa-pen"></i> {t('motionStudio.character.changeImage')}</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <div className="w-12 h-12 rounded-full bg-[var(--bg-deep-space)] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg border border-white/5">
                                    <PlusIcon className="w-6 h-6 text-[var(--accent-cyan)]" />
                                </div>
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">{t('motionStudio.character.add')}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 flex-1">
                        <div>
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 block uppercase tracking-wider">{t('motionStudio.character.triggerLabel')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-[var(--accent-cyan)] font-bold">@</span>
                                <input 
                                    type="text" 
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                                    placeholder={t('motionStudio.character.namePlaceholder')}
                                    className="w-full bg-[var(--bg-deep-space)] border border-white/10 rounded-lg text-sm pl-7 pr-3 py-2 focus:ring-1 focus:ring-[var(--accent-cyan)] outline-none font-mono text-[var(--accent-cyan)] placeholder-gray-600"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 block uppercase tracking-wider">{t('motionStudio.character.promptLabel')}</label>
                             <textarea 
                                value={tempDesc}
                                onChange={(e) => setTempDesc(e.target.value)}
                                placeholder={t('motionStudio.character.descPlaceholder')}
                                className="w-full bg-[var(--bg-deep-space)] border border-white/10 rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-[var(--accent-cyan)] outline-none resize-none h-24 scrollbar-thin placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                        <button 
                            onClick={handleSave}
                            disabled={!selectedFile || !tempName}
                            className="w-full btn-gradient text-white font-bold py-2 rounded-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 text-xs flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-save"></i> {t('motionStudio.character.save')}
                        </button>
                    </div>
                 </div>
             </div>

             {/* RIGHT: Character Grid (Mobile optimized with grid-cols-2/3) */}
             <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-inner">
                 <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                        <i className="fas fa-users"></i> {t('motionStudio.character.listTitle')} <span className="bg-[var(--accent-cyan)] text-white px-1.5 py-0.5 rounded text-[10px] font-mono">{characters.length}</span>
                    </h3>
                    {characters.length > 0 && (
                         <button onClick={onClearAll} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                            <i className="fas fa-trash"></i> {t('motionStudio.clear')}
                        </button>
                    )}
                 </div>
                 
                 <div className="p-4 overflow-y-auto scrollbar-thin grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start h-full">
                    {characters.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 h-64">
                            <i className="fas fa-user-astronaut text-5xl mb-3 text-[var(--bg-tertiary)]"></i>
                            <p className="text-sm text-center max-w-xs">{t('motionStudio.character.emptyList')}</p>
                        </div>
                    ) : (
                        characters.map((char) => (
                            <div key={char.id} className="bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-xl overflow-hidden group relative hover:border-[var(--accent-cyan)] transition-all hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] flex flex-col">
                                <div className="aspect-square relative overflow-hidden">
                                    <img src={char.previewUrl} alt={char.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <p className="text-sm font-bold text-white truncate shadow-black drop-shadow-md">@{char.name}</p>
                                    </div>
                                    <button 
                                        onClick={() => onRemove(char.id)}
                                        className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 duration-200 shadow-lg"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="p-2 bg-[var(--bg-tertiary)] flex-1 border-t border-white/5">
                                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-tight h-full">
                                        {char.description || t('motionStudio.character.noDesc')}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        </div>
    );
};

const ShotItem: React.FC<{ 
    shot: MotionShot; 
    index: number;
    onDelete: (id: string) => void; 
    onPromptChange: (id: string, val: string) => void;
    characters: MotionCharacter[];
}> = ({ shot, index, onDelete, onPromptChange, characters }) => {
    const { t, i18n } = useTranslation();
    const [isEnhancing, setIsEnhancing] = useState(false);
    
    const handleInsertChar = (tag: string) => {
        onPromptChange(shot.id, shot.prompt + tag);
    };

    const handleEnhancePrompt = async () => {
        if (!shot.prompt) return;
        setIsEnhancing(true);
        try {
            // Pass language to enhanceVideoPrompt
            const enhancedPrompt = await enhanceVideoPrompt(shot.prompt, i18n.language);
            if (enhancedPrompt) onPromptChange(shot.id, enhancedPrompt);
        } catch (e) {
            console.error("Enhance failed", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleCameraSelect = (movePrompt: string) => {
        // Check if a movement is already in prompt, if not append it
        // Simplified: Just append for now
        onPromptChange(shot.id, shot.prompt ? `${shot.prompt}, ${movePrompt}` : movePrompt);
    };

    return (
        <div className={`p-0 rounded-xl border flex flex-col relative group transition-all overflow-hidden shadow-md ${
            shot.status === 'done' ? 'bg-[var(--bg-tertiary)] border-[var(--accent-cyan)] shadow-[0_0_10px_rgba(88,166,255,0.1)]' :
            shot.status === 'processing' ? 'bg-[var(--bg-tertiary)] border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
            'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-white/30'
        }`}>
             {/* Status Bar / Progress Effect */}
             {shot.status === 'processing' && (
                 <div className="absolute top-0 left-0 h-1 bg-blue-500 animate-progress w-full z-10"></div>
             )}

             {/* Header Bar */}
             <div className="flex justify-between items-center bg-[var(--bg-interactive)] px-3 py-2 border-b border-white/5">
                 <div className="flex items-center gap-2">
                     <span className={`text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm ${shot.status === 'done' ? 'bg-green-600' : 'bg-[var(--accent-blue)]'}`}>
                        #{index + 1}
                     </span>
                     {shot.imagePreview && (
                         <span className="text-[10px] text-[var(--accent-cyan)] font-mono uppercase tracking-wider flex items-center gap-1">
                            <i className="fas fa-image"></i> Img2Vid
                         </span>
                     )}
                 </div>
                 <div className="flex items-center gap-2">
                    {shot.status === 'processing' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase animate-pulse">
                            <i className="fas fa-circle-notch fa-spin"></i> {t(`motionStudio.status.processing`)}
                        </span>
                    )}
                    {shot.status === 'done' && (
                         <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase">
                            <i className="fas fa-check-circle"></i> {t(`motionStudio.status.done`)}
                        </span>
                    )}
                     <button 
                        onClick={() => onDelete(shot.id)} 
                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1 opacity-50 group-hover:opacity-100"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                 </div>
             </div>
             
             {/* Main Content Area */}
             <div className="flex flex-col">
                 {/* Video Result (If Done) - Takes Priority */}
                 {shot.status === 'done' && shot.videoUrl ? (
                      <div className="relative aspect-video bg-black group/video">
                         <video src={shot.videoUrl} controls className="w-full h-full object-contain" />
                         <div className="absolute top-2 right-2 opacity-0 group-hover/video:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => smartDownload(shot.videoUrl!, `shot_${index+1}.mp4`)} className="bg-black/60 text-white p-2 rounded hover:bg-black/80">
                                <i className="fas fa-download"></i>
                            </button>
                         </div>
                     </div>
                 ) : (
                    // Input Area (If Pending/Processing)
                    <div className="flex flex-col p-3 gap-2">
                        {!shot.imagePreview && (
                            <CharacterQuickBar characters={characters} onInsert={handleInsertChar} />
                        )}
                        
                        <div className="flex gap-3">
                            {shot.imagePreview && (
                                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-inner relative group/img">
                                    <img src={shot.imagePreview} alt="Start Frame" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg"></div>
                                </div>
                            )}
                            
                            <div className="flex-1 relative min-w-0">
                                <HighlightTextarea 
                                    value={shot.prompt}
                                    onChange={(val) => onPromptChange(shot.id, val)}
                                    placeholder={t('motionStudio.shotPlaceholder')}
                                    characters={characters}
                                    className="h-24 bg-[var(--bg-deep-space)]/50"
                                />
                                <button 
                                    onClick={handleEnhancePrompt}
                                    disabled={isEnhancing || !shot.prompt || shot.status !== 'pending'}
                                    className="absolute bottom-2 right-2 p-1.5 rounded bg-purple-600/80 hover:bg-purple-500 text-white shadow-md transition-all text-xs flex items-center gap-1 disabled:opacity-50"
                                    title={t('motionStudio.enhancePrompt')}
                                >
                                    {isEnhancing ? <i className="fas fa-spinner fa-spin"></i> : <MagicWandIcon />}
                                </button>
                            </div>
                        </div>

                        {/* Camera Movement Quick Tools */}
                        {shot.status === 'pending' && (
                            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 pt-1">
                                {CAMERA_MOVEMENTS.map(move => (
                                    <button 
                                        key={move.id}
                                        onClick={() => handleCameraSelect(move.prompt)}
                                        className="px-2 py-1 rounded bg-[var(--bg-deep-space)] hover:bg-[var(--bg-hover)] border border-white/5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] whitespace-nowrap transition-colors flex-shrink-0"
                                    >
                                        {t(move.labelKey)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                 )}
                 
                 {/* Prompt display for Done state */}
                 {shot.status === 'done' && (
                     <div className="p-2 text-xs text-[var(--text-secondary)] border-t border-white/5 bg-[var(--bg-deep-space)] truncate">
                         <span className="font-bold text-[var(--accent-cyan)]">Prompt:</span> {shot.prompt}
                     </div>
                 )}
             </div>
        </div>
    );
};

const VideoAnalysisTab: React.FC<{
    onUseShot: (prompt: string, image: string) => void;
}> = ({ onUseShot }) => {
    const { t, i18n } = useTranslation();
    const [analyzing, setAnalyzing] = useState(false);
    const [scenes, setScenes] = useState<AnalyzedScene[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [statusText, setStatusText] = useState("");

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const videoUrl = URL.createObjectURL(file);
        setAnalyzing(true);
        setScenes([]);
        
        try {
            // 1. Load Video
            setStatusText(t('motionStudio.analysis.extracting'));
            const frames = await captureFrames(videoUrl, 6); // Capture 6 keyframes
            
            // 2. Analyze with Gemini
            setStatusText(t('motionStudio.analysis.analyzing'));
            const prompts = await analyzeVideoFrames(frames, i18n.language);
            
            // 3. Combine
            const newScenes: AnalyzedScene[] = frames.map((frame, idx) => ({
                id: `scene_${Date.now()}_${idx}`,
                timestamp: `Scene ${idx + 1}`,
                image: frame, // Base64
                prompt: prompts[idx] || "Analyzing..."
            }));
            
            setScenes(newScenes);
        } catch (error) {
            console.error(error);
            alert("Failed to analyze video.");
        } finally {
            setAnalyzing(false);
            URL.revokeObjectURL(videoUrl);
        }
    };

    const captureFrames = async (videoUrl: string, count: number): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = "anonymous"; // Should not matter for local blob

            const frames: string[] = [];
            
            video.onloadedmetadata = async () => {
                const duration = video.duration;
                const interval = duration / count;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) { reject("Canvas context error"); return; }

                canvas.width = 480; // Resize for efficiency
                canvas.height = (video.videoHeight / video.videoWidth) * 480;

                for (let i = 0; i < count; i++) {
                    const time = i * interval + (interval / 2); // Middle of segment
                    video.currentTime = time;
                    await new Promise(r => {
                         const seekHandler = () => {
                             video.removeEventListener('seeked', seekHandler);
                             r(true);
                         };
                         video.addEventListener('seeked', seekHandler);
                    });
                    
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    // Standard JPEG compression
                    frames.push(canvas.toDataURL('image/jpeg', 0.7));
                }
                resolve(frames);
            };
            video.onerror = reject;
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Upload Section */}
             <div className="bg-[var(--bg-component)] p-6 rounded-xl border border-[var(--border-color)] shadow-lg mb-6 text-center">
                <input type="file" accept="video/mp4,video/mov" onChange={handleVideoUpload} className="hidden" id="video-upload-analysis" />
                <label htmlFor="video-upload-analysis" className="cursor-pointer block">
                    <div className="w-16 h-16 bg-[var(--bg-interactive)] rounded-full flex items-center justify-center mx-auto mb-3 hover:scale-110 transition-transform text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">
                        {analyzing ? <i className="fas fa-circle-notch fa-spin text-2xl"></i> : <i className="fas fa-upload text-2xl"></i>}
                    </div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{t('motionStudio.analysis.uploadTitle')}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{analyzing ? statusText : t('motionStudio.analysis.uploadDesc')}</p>
                </label>
            </div>

            {/* Results Grid */}
             <div className="flex-1 overflow-y-auto scrollbar-thin">
                {scenes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                         {scenes.map((scene) => (
                             <div key={scene.id} className="bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-xl overflow-hidden group hover:border-[var(--accent-cyan)] transition-all">
                                 <div className="aspect-video relative">
                                     <img src={scene.image} className="w-full h-full object-cover" />
                                     <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-mono">{scene.timestamp}</div>
                                 </div>
                                 <div className="p-3">
                                     <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-3 min-h-[3rem]">{scene.prompt}</p>
                                     <div className="flex gap-2">
                                         <button 
                                            onClick={() => { navigator.clipboard.writeText(scene.prompt); alert("Copied!"); }}
                                            className="flex-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] py-2 rounded border border-white/5 text-[var(--text-primary)]"
                                         >
                                             <i className="fas fa-copy mr-1"></i> {t('motionStudio.analysis.copyPrompt')}
                                         </button>
                                         <button 
                                            onClick={() => onUseShot(scene.prompt, scene.image)}
                                            className="flex-1 text-xs bg-[var(--accent-cyan)]/10 hover:bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] py-2 rounded border border-[var(--accent-cyan)]/30 font-bold"
                                         >
                                             <i className="fas fa-reply mr-1"></i> {t('motionStudio.analysis.useShot')}
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                    </div>
                ) : !analyzing && (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] opacity-50">
                         <i className="fas fa-film text-5xl mb-3"></i>
                         <p>{t('motionStudio.analysis.empty')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const MotionStudio: React.FC<MotionStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [shots, setShots] = useState<MotionShot[]>([]);
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'character' | 'analysis'>('text');
    const [characters, setCharacters] = useState<MotionCharacter[]>([]);
    const [isCinemaOpen, setIsCinemaOpen] = useState(false);
    
    // Text Mode State
    const [bulkInput, setBulkInput] = useState('');
    
    // Image Mode State
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePrompt, setImagePrompt] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    
    // Settings
    const [settings, setSettings] = useState<MotionStudioSettings>({ aspectRatio: '16:9', resolution: '720p', audio: false });
    const [isGenerating, setIsGenerating] = useState(false);
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

    // --- Character Logic ---
    const handleAddCharacter = (file: File, name: string, desc: string) => {
        const newChar: MotionCharacter = {
            id: `char_${Date.now()}`,
            name: name,
            image: file,
            previewUrl: URL.createObjectURL(file),
            description: desc
        };
        setCharacters(prev => [...prev, newChar]);
    };

    const handleRemoveCharacter = (id: string) => {
        setCharacters(prev => prev.filter(c => c.id !== id));
    };

    const handleBulkAdd = () => {
        if (!bulkInput.trim()) return;
        const lines = bulkInput.split('\n').filter(line => line.trim() !== '');
        
        const newShots: MotionShot[] = lines.map((line, index) => {
            let cleanPrompt = line.trim();
            cleanPrompt = cleanPrompt.replace(/^(\d+\.|#\d+|Scene \d+:|-|•)\s*/i, '');
            return {
                id: `shot_${Date.now()}_${shots.length + index + 1}`,
                prompt: cleanPrompt,
                status: 'pending'
            };
        });
        
        setShots(prev => [...prev, ...newShots]);
        setBulkInput('');
    };

    const handleQuickInsertChar = (tag: string) => {
        setBulkInput(prev => prev + tag);
    };
    
    const handleLoadSample = (sampleId: string) => {
        const sample = SAMPLE_PROJECTS.find(s => s.id === sampleId);
        if (!sample) return;
        
        // Updated to fetch translated array
        const prompts = t(sample.shotsKey, { returnObjects: true });
        if (!Array.isArray(prompts)) {
            console.error("Expected array for sample prompts but got:", prompts);
            return;
        }
        
        const newShots: MotionShot[] = prompts.map((prompt: string, index: number) => ({
            id: `shot_${Date.now()}_${index}`,
            prompt: prompt,
            status: 'pending'
        }));
        setShots(newShots); 
    };

    const handlePasteInput = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData('text');
        if (text.includes('\n')) {
            e.preventDefault();
            const lines = text.split('\n').filter(line => line.trim() !== '');
             const newShots: MotionShot[] = lines.map((line, index) => {
                let cleanPrompt = line.trim();
                cleanPrompt = cleanPrompt.replace(/^(\d+\.|#\d+|Scene \d+:|-|•)\s*/i, '');
                return {
                    id: `shot_${Date.now()}_${shots.length + index + 1}`,
                    prompt: cleanPrompt,
                    status: 'pending',
                };
            });
            setShots(prev => [...prev, ...newShots]);
        }
    };

    const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...newFiles]);
        }
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const removeSelectedImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddImageShots = () => {
        if (selectedImages.length === 0) return;
        const newShots: MotionShot[] = selectedImages.map((file, index) => ({
            id: `shot_${Date.now()}_${shots.length + index + 1}`,
            prompt: imagePrompt.trim() || t('motionStudio.defaultImagePrompt'),
            image: file,
            imagePreview: URL.createObjectURL(file),
            status: 'pending'
        }));
        setShots(prev => [...prev, ...newShots]);
        setSelectedImages([]);
        setImagePrompt('');
    };

    const handleDeleteShot = (id: string) => {
        setShots(prev => prev.filter(s => s.id !== id));
    };
    
    const handlePromptChange = (id: string, newPrompt: string) => {
        setShots(prev => prev.map(s => s.id === id ? { ...s, prompt: newPrompt } : s));
    };

    const handleClearAll = () => {
        if (window.confirm(t('motionStudio.clearConfirm'))) {
            setShots([]);
        }
    };

    const handleUseAnalyzedShot = async (prompt: string, imageBase64: string) => {
        // Convert base64 back to File object for consistency
        try {
            const res = await fetch(imageBase64);
            const blob = await res.blob();
            const file = new File([blob], `analyzed_shot_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            const newShot: MotionShot = {
                id: `shot_${Date.now()}`,
                prompt: prompt,
                image: file,
                imagePreview: imageBase64,
                status: 'pending'
            };
            setShots(prev => [...prev, newShot]);
            setActiveTab('text'); // Switch back to list to show user
        } catch (e) {
            console.error("Failed to convert analyzed image", e);
        }
    };
    
    const processQueue = async () => {
         if (!isVip) return;
         if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyPrompt(true);
            return;
         }
         setShowApiKeyPrompt(false);

         setIsGenerating(true);
         const pendingShots = shots.filter(s => s.status === 'pending');
         for (const shot of pendingShots) {
             setShots(prev => prev.map(s => s.id === shot.id ? { ...s, status: 'processing' } : s));
             try {
                 let base64Image = null;
                 if (shot.image) {
                     const converted = await fileToBase64(shot.image);
                     base64Image = `data:${converted.mimeType};base64,${converted.base64}`;
                 } 
                 
                 // --- INTELLIGENT CHARACTER SYNC LOGIC ---
                 let finalPrompt = shot.prompt;
                 let charImages: string[] = [];
                 
                 // Only perform parsing for text-based shots (image-to-video usually relies on the image itself)
                 if (!shot.image) {
                     characters.forEach(char => {
                         const trigger = `@${char.name}`;
                         if (finalPrompt.includes(trigger)) {
                             // 1. Replace trigger with description for AI context
                             finalPrompt = finalPrompt.replaceAll(trigger, `${char.description || char.name}`);
                             // 2. Extract character image for reference
                         }
                     });
                     
                     // Now resolve the base64 for found characters
                     // Re-iterate to find which chars were used
                     const usedChars = characters.filter(c => shot.prompt.includes(`@${c.name}`));
                     for (const char of usedChars) {
                         try {
                             const b64 = await fileToBase64(char.image);
                             charImages.push(b64.base64); // Only push raw base64 string
                         } catch (err) {
                             console.error("Failed to read character image", char.name, err);
                         }
                     }
                 }

                 // Pass settings (resolution, audio) to API
                 const videoUrl = await generateVideoFromImage(
                     base64Image, 
                     finalPrompt, 
                     (msg) => console.log(msg),
                     charImages.length > 0 ? charImages : undefined,
                     settings 
                 );
                 
                 setShots(prev => prev.map(s => s.id === shot.id ? { ...s, status: 'done', videoUrl } : s));
             } catch (e) {
                 console.error(e);
                 setShots(prev => prev.map(s => s.id === shot.id ? { ...s, status: 'error' } : s));
             }
         }
         setIsGenerating(false);
    };

    const handleDownloadZip = async () => {
        const doneShots = shots.filter(s => s.status === 'done' && s.videoUrl);
        if (doneShots.length === 0) return;
        
        const zip = new JSZip();
        const folder = zip.folder("motion_shots");
        
        for (let i = 0; i < doneShots.length; i++) {
            const shot = doneShots[i];
            try {
                const response = await fetch(shot.videoUrl!);
                const blob = await response.blob();
                folder.file(`shot_${i + 1}.mp4`, blob);
            } catch (e) {
                console.error("Failed to zip shot", shot.id, e);
            }
        }
        
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        smartDownload(url, `motion_project_${Date.now()}.zip`);
    };

    // --- UI LOGIC FOR LAYOUT ---
    const isCharacterTab = activeTab === 'character';
    const isAnalysisTab = activeTab === 'analysis';
    const isFullWidth = isCharacterTab || isAnalysisTab;

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 font-sans animate-fade-in h-auto lg:h-full overflow-y-auto lg:overflow-hidden">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6 flex-shrink-0">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('motionStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('motionStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            {/* DYNAMIC GRID LAYOUT: Full width for Character Tab & Analysis, Split for Text/Image */}
            <main className={`w-full max-w-7xl mx-auto grid gap-6 min-h-0 flex-1 lg:overflow-hidden ${isFullWidth ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_350px]'}`}>
                
                <div className="flex flex-col gap-6 min-h-0 overflow-visible lg:overflow-hidden min-w-0">
                    <div className="flex bg-[var(--bg-component)] p-1 rounded-xl border border-[var(--border-color)] flex-shrink-0 shadow-sm overflow-x-auto no-scrollbar">
                        <button onClick={() => setActiveTab('text')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'text' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                            <i className="fas fa-font"></i> {t('motionStudio.tabs.text')}
                        </button>
                        <button onClick={() => setActiveTab('image')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'image' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                            <i className="fas fa-image"></i> {t('motionStudio.tabs.image')}
                        </button>
                        <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'analysis' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                            <i className="fas fa-film"></i> {t('motionStudio.tabs.analysis')}
                        </button>
                         <button onClick={() => setActiveTab('character')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'character' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                            <i className="fas fa-users-cog"></i> {t('motionStudio.character.title')}
                        </button>
                    </div>

                    <div className={`bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-5 flex-shrink-0 transition-all duration-300 flex flex-col ${isFullWidth ? 'flex-1 min-h-0 overflow-hidden' : 'min-h-[220px]'}`}>
                        
                        {activeTab === 'character' ? (
                            <CharacterManagerTab
                                characters={characters}
                                onAdd={handleAddCharacter}
                                onRemove={handleRemoveCharacter}
                                onClearAll={() => setCharacters([])}
                            />
                        ) : activeTab === 'analysis' ? (
                            <VideoAnalysisTab onUseShot={handleUseAnalyzedShot} />
                        ) : activeTab === 'text' ? (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                     <label className="block text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                                        <i className="fas fa-pen-nib text-[var(--accent-cyan)]"></i>
                                        {t('motionStudio.addShot')}
                                    </label>
                                    {/* Compact Character Bar inside the Header of Input */}
                                    <CharacterQuickBar characters={characters} onInsert={handleQuickInsertChar} />
                                </div>
                                
                                <div className="relative flex-grow">
                                    {/* We use standard textarea here for bulk input, but HighlightTextarea logic is applied in the Shot List */}
                                    <textarea 
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        onPaste={handlePasteInput}
                                        placeholder={t('motionStudio.bulkInputPlaceholder')}
                                        className="w-full h-full min-h-[120px] bg-[var(--bg-deep-space)] border border-white/10 rounded-lg p-4 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all resize-none placeholder-gray-600"
                                    />
                                    <button 
                                        onClick={handleBulkAdd}
                                        disabled={!bulkInput.trim()}
                                        className="absolute bottom-3 right-3 btn-secondary text-xs font-bold py-2 px-4 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 shadow-md"
                                    >
                                        <i className="fas fa-plus mr-1"></i> {t('motionStudio.addBulk')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4 h-full">
                                <div className="flex gap-4 overflow-x-auto pb-2 min-h-[100px] items-center p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] border-dashed scrollbar-thin">
                                    <input type="file" multiple accept="image/*" ref={imageInputRef} onChange={handleImageFiles} className="hidden" />
                                    <button 
                                        onClick={() => imageInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center w-24 h-24 flex-shrink-0 rounded-lg bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-all group"
                                    >
                                        <div className="bg-[var(--accent-cyan)]/10 p-2 rounded-full group-hover:scale-110 transition-transform">
                                            <UploadIcon className="w-6 h-6 text-[var(--accent-cyan)]" />
                                        </div>
                                        <span className="text-[10px] mt-1 text-[var(--text-secondary)] font-semibold">{t('motionStudio.uploadImages')}</span>
                                    </button>
                                    
                                    {selectedImages.map((file, idx) => (
                                        <div key={idx} className="relative w-24 h-24 flex-shrink-0 group rounded-lg overflow-hidden border border-white/10">
                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                            <button onClick={() => removeSelectedImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">&times;</button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2 flex-grow">
                                    {/* HIDE CHARACTER BAR IN IMAGE MODE AS REQUESTED */}
                                    <div className="flex gap-3 h-full">
                                        <textarea 
                                            value={imagePrompt}
                                            onChange={(e) => setImagePrompt(e.target.value)}
                                            placeholder={t('motionStudio.imageInputPlaceholder')}
                                            className="flex-1 bg-[var(--bg-deep-space)] border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] resize-none placeholder-gray-600"
                                        />
                                        <button 
                                            onClick={handleAddImageShots}
                                            disabled={selectedImages.length === 0}
                                            className="btn-secondary text-xs font-bold py-2 px-4 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 flex flex-col items-center justify-center min-w-[100px]"
                                        >
                                            <i className="fas fa-plus text-lg mb-1"></i> 
                                            <span>{t('motionStudio.addBulk')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Only show Shot List if NOT in character tab or Analysis Tab */}
                    {!isFullWidth && (
                        <div className="flex-1 overflow-visible lg:overflow-y-auto scrollbar-thin bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-4 flex flex-col min-h-0">
                             <div className="flex justify-between items-center mb-4 flex-shrink-0 sticky top-0 z-10 bg-[var(--bg-component)] pb-2 border-b border-white/5">
                                <span className="text-sm text-[var(--text-secondary)] font-bold uppercase flex items-center gap-2">
                                    <i className="fas fa-list-ul"></i>
                                    {t('motionStudio.shotList')} 
                                    <span className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full text-xs border border-white/10">{shots.length}</span>
                                </span>
                                <div className="flex gap-2">
                                     {shots.some(s => s.status === 'done') && (
                                        <>
                                            <button onClick={() => setIsCinemaOpen(true)} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors">
                                                <i className="fas fa-play-circle"></i> {t('motionStudio.playFilm')}
                                            </button>
                                            <button onClick={handleDownloadZip} className="text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1 px-2 py-1 rounded hover:bg-green-500/10 transition-colors">
                                                <i className="fas fa-download"></i> ZIP
                                            </button>
                                        </>
                                    )}
                                    {shots.length > 0 && (
                                        <button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                                            <i className="fas fa-trash"></i> {t('motionStudio.clear')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {shots.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 min-h-[200px]">
                                    <div className="p-4 bg-[var(--bg-tertiary)] rounded-full mb-3">
                                        <VideoIcon />
                                    </div>
                                    <p className="text-sm font-medium mb-3">{t('motionStudio.emptyList')}</p>
                                    <div className="flex gap-2">
                                        {SAMPLE_PROJECTS.map(sample => (
                                            <button 
                                                key={sample.id}
                                                onClick={() => handleLoadSample(sample.id)}
                                                className="text-xs bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] px-3 py-1.5 rounded-full text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 transition-colors"
                                            >
                                                + {t(sample.nameKey)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 pr-1 pb-10 lg:pb-0">
                                    {shots.map((shot, idx) => (
                                        <ShotItem 
                                            key={shot.id}
                                            index={idx}
                                            shot={shot} 
                                            onDelete={handleDeleteShot} 
                                            onPromptChange={handlePromptChange}
                                            characters={characters}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Controls (HIDDEN IF FULL WIDTH) */}
                {!isFullWidth && (
                    <div className="flex flex-col gap-6 min-w-0 order-last">
                         <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-5 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-5 pb-2 border-b border-white/10">
                                {t('motionStudio.settings.title')}
                            </h3>
                            
                            <div className="space-y-5 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">{t('motionStudio.settings.aspectRatio')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['16:9', '9:16'] as const).map(ratio => (
                                            <button
                                                key={ratio}
                                                onClick={() => setSettings(p => ({...p, aspectRatio: ratio}))}
                                                className={`py-3 px-2 rounded-lg text-xs font-bold border transition-all ${settings.aspectRatio === ratio ? 'bg-[var(--bg-interactive)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                            >
                                                {t(`motionStudio.ratios.${ratio === '16:9' ? 'landscape' : 'portrait'}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                 <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">{t('motionStudio.settings.resolution')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['720p', '1080p'] as const).map(res => (
                                            <button
                                                key={res}
                                                onClick={() => setSettings(p => ({...p, resolution: res}))}
                                                className={`py-3 px-2 rounded-lg text-xs font-bold border transition-all ${settings.resolution === res ? 'bg-[var(--bg-interactive)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                            >
                                                {t(`motionStudio.resolutions.${res === '720p' ? 'hd' : 'fhd'}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">{t('motionStudio.settings.audio')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSettings(p => ({...p, audio: false}))}
                                            className={`py-3 px-2 rounded-lg text-xs font-bold border transition-all ${!settings.audio ? 'bg-[var(--bg-interactive)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                        >
                                            {t('motionStudio.settings.audioOptions.off')}
                                        </button>
                                        <button
                                            onClick={() => setSettings(p => ({...p, audio: true}))}
                                            className={`py-3 px-2 rounded-lg text-xs font-bold border transition-all ${settings.audio ? 'bg-[var(--bg-interactive)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                        >
                                            {t('motionStudio.settings.audioOptions.on')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/10">
                                 {!isVip && (
                                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                                        <i className="fas fa-crown text-yellow-400 mt-0.5"></i>
                                        <div>
                                            <p className="text-xs font-bold text-yellow-200">{t('motionStudio.settings.vipRequired')}</p>
                                            <p className="text-[10px] text-yellow-200/70">{t('motionStudio.settings.vipDesc')}</p>
                                        </div>
                                    </div>
                                )}
                                 {showApiKeyPrompt && (
                                    <div className="mb-4 bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg text-left text-xs" role="alert">
                                        <strong className="font-bold block mb-1">{t('videoCreator.apiKeySelect.title')}</strong>
                                        <button onClick={async () => {
                                            if (window.aistudio) {
                                                await window.aistudio.openSelectKey();
                                                setShowApiKeyPrompt(false);
                                            }
                                        }} className="mt-2 btn-gradient text-white font-bold py-1 px-3 rounded-md w-full">
                                            {t('videoCreator.apiKeySelect.button')}
                                        </button>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={processQueue}
                                    disabled={isGenerating || shots.length === 0 || !isVip}
                                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isGenerating ? (
                                        <><i className="fas fa-circle-notch fa-spin"></i> {t('motionStudio.generating')}</>
                                    ) : (
                                        <><i className="fas fa-film"></i> {t('motionStudio.generateAll')}</>
                                    )}
                                </button>
                                
                                <p className="text-[10px] text-center text-[var(--text-secondary)] mt-3">
                                    {t('motionStudio.generatingDesc', { count: shots.filter(s => s.status === 'pending').length })}
                                </p>
                            </div>
                         </div>
                    </div>
                )}
            </main>

            <CinemaModal 
                isOpen={isCinemaOpen} 
                onClose={() => setIsCinemaOpen(false)} 
                shots={shots} 
            />
        </div>
    );
};

export default MotionStudio;
