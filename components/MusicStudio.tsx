
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { MUSIC_GENRES, MUSIC_MOODS } from '../constants';
import type { MusicSettings, SongStructure } from '../types';
import { generateSongContent, generateAlbumArt, generateSpeech } from '../services/geminiService';
import { smartDownload } from '../utils/canvasUtils';
import { CREDIT_COSTS } from '../constants';

interface MusicStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
    onInsufficientCredits?: () => void;
    checkCredits: (cost: number) => boolean;
}

const VinylRecord: React.FC<{ imageUrl: string | null, isPlaying: boolean }> = ({ imageUrl, isPlaying }) => {
    return (
        <div className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden bg-black ${isPlaying ? 'animate-spin-slow' : ''}`}>
            {/* Grooves */}
            <div className="absolute inset-0 rounded-full border-[20px] border-gray-900 opacity-50"></div>
            <div className="absolute inset-4 rounded-full border-[1px] border-gray-800 opacity-30"></div>
            <div className="absolute inset-8 rounded-full border-[1px] border-gray-800 opacity-30"></div>
            
            {/* Label / Cover Art */}
            <div className="w-1/3 h-1/3 rounded-full overflow-hidden relative z-10 border-4 border-gray-800">
                {imageUrl ? (
                    <img src={imageUrl} alt="Album Art" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                        <i className="fas fa-music text-white text-2xl"></i>
                    </div>
                )}
            </div>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-10 pointer-events-none rounded-full"></div>
        </div>
    );
};

const MusicStudio: React.FC<MusicStudioProps> = ({ theme, setTheme, isVip, onInsufficientCredits, checkCredits }) => {
    const { t, i18n } = useTranslation();
    const [settings, setSettings] = useState<MusicSettings>({
        topic: '',
        genre: 'pop_ballad',
        mood: 'happy',
        language: i18n.language as 'vi' | 'en'
    });
    
    const [song, setSong] = useState<SongStructure | null>(null);
    const [albumArt, setAlbumArt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isArtLoading, setIsArtLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Audio Player State
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Refs for Audio Control
    const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (activeSourceRef.current) {
                try { activeSourceRef.current.stop(); } catch(e) {}
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handleSettingsChange = (key: keyof MusicSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerateSong = async () => {
        if (!settings.topic) return;

        // CLIENT-SIDE CREDIT CHECK
        if (!checkCredits(CREDIT_COSTS.MUSIC_GENERATION)) {
            if (onInsufficientCredits) onInsufficientCredits();
            return;
        }

        setIsLoading(true);
        setError(null);
        setSong(null);
        setAlbumArt(null);
        setAudioBuffer(null); // Reset audio buffer for new song
        setIsPlaying(false);
        if (activeSourceRef.current) {
            try { activeSourceRef.current.stop(); } catch(e) {}
            activeSourceRef.current = null;
        }

        try {
            // 1. Generate Lyrics & Structure
            const generatedSong = await generateSongContent(settings);
            setSong(generatedSong);
            
            // 2. Automatically trigger Art Generation
            setIsArtLoading(true);
            try {
                const artUrl = await generateAlbumArt(generatedSong.description);
                setAlbumArt(artUrl);
            } catch (artError) {
                console.error("Failed to generate album art:", artError);
            }
            setIsArtLoading(false);

        } catch (e: any) {
            const errorMsg = e.message || '';
            if (errorMsg.includes("insufficient credits")) {
                if (onInsufficientCredits) onInsufficientCredits();
            } else {
                console.error(e);
                setError(errorMsg || t('errors.unknownError'));
            }
            setIsArtLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const playBuffer = (buffer: AudioBuffer) => {
        // Initialize context if needed
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

        // Stop previous source if any
        if (activeSourceRef.current) {
            try { activeSourceRef.current.stop(); } catch(e) {}
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        
        activeSourceRef.current = source;
        setIsPlaying(true);

        source.onended = () => {
            setIsPlaying(false);
            activeSourceRef.current = null;
        };
    };

    const handlePlayDemo = async () => {
        if (!song) return;

        // CASE 1: Playing -> STOP
        if (isPlaying) {
            if (activeSourceRef.current) {
                try { activeSourceRef.current.stop(); } catch(e) {}
                activeSourceRef.current = null;
            }
            setIsPlaying(false);
            return;
        }

        // CASE 2: Not Playing + Has Buffer -> REPLAY (FREE)
        if (audioBuffer) {
            playBuffer(audioBuffer);
            return;
        }

        // CASE 3: Not Playing + No Buffer -> GENERATE (COSTS CREDITS)
        // CLIENT-SIDE CREDIT CHECK FOR AUDIO
        if (!checkCredits(CREDIT_COSTS.AUDIO_GENERATION)) {
            if (onInsufficientCredits) onInsufficientCredits();
            return;
        }

        setIsLoading(true);
        try {
            const prompt = `[Style: ${song.stylePrompt}] \n\n ${song.lyrics}`;
            // Use standard speed 1.0 for demo
            const base64Audio = await generateSpeech(prompt, 'hanoi_female_26', settings.language, undefined, 1.0); 
            
            // Decode Base64
            const binaryString = atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            
            // Decode PCM to AudioBuffer
            const int16Data = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(int16Data.length);
            for (let i = 0; i < int16Data.length; i++) {
                float32Data[i] = int16Data[i] / 32768.0;
            }

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const newBuffer = ctx.createBuffer(1, float32Data.length, 24000); // 24kHz standard
            newBuffer.copyToChannel(float32Data, 0);

            setAudioBuffer(newBuffer); // CACHE IT!
            playBuffer(newBuffer);
            
        } catch (e: any) {
            const errorMsg = e.message || '';
            if (errorMsg.includes("insufficient credits")) {
                if (onInsufficientCredits) onInsufficientCredits();
            } else {
                console.error(e);
                alert("Error playing demo audio: " + errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const downloadAssets = () => {
        if (!song) return;
        const textContent = `Title: ${song.title}\n\nLyrics:\n${song.lyrics}\n\nChords:\n${song.chords}`;
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        smartDownload(url, `${song.title}_lyrics.txt`);
        
        if (albumArt) {
            smartDownload(albumArt, `${song.title}_cover.png`);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 font-sans animate-fade-in h-auto lg:h-full overflow-y-auto lg:overflow-hidden">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6 flex-shrink-0">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('musicStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('musicStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 min-h-0 flex-1 lg:overflow-hidden">
                
                {/* Left: Input Panel */}
                <div className="flex flex-col gap-6 overflow-visible lg:overflow-y-auto scrollbar-thin pr-2 pb-10">
                    <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-5 space-y-5">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide border-b border-white/10 pb-2">
                            {t('musicStudio.settings.title')}
                        </h3>
                        
                        <div>
                            <label className="block text-sm font-semibold mb-2">{t('musicStudio.labels.topic')}</label>
                            <textarea 
                                value={settings.topic}
                                onChange={(e) => handleSettingsChange('topic', e.target.value)}
                                placeholder={t('musicStudio.placeholders.topic')}
                                className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] resize-none"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">{t('musicStudio.labels.genre')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {MUSIC_GENRES.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => handleSettingsChange('genre', g.id)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${settings.genre === g.id ? 'btn-gradient text-white' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'}`}
                                    >
                                        {t(g.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">{t('musicStudio.labels.mood')}</label>
                            <div className="flex flex-wrap gap-2">
                                {MUSIC_MOODS.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleSettingsChange('mood', m.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${settings.mood === m.id ? 'bg-[var(--accent-cyan)] text-white border-transparent' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]'}`}
                                    >
                                        {m.icon} {t(m.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateSong}
                            disabled={!settings.topic || isLoading}
                            className="w-full btn-gradient text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                        >
                            {isLoading ? <><i className="fas fa-compact-disc fa-spin"></i> {t('musicStudio.actions.composing')}</> : <><i className="fas fa-music"></i> {t('musicStudio.actions.compose')} {isVip ? '(Miễn phí)' : `(${CREDIT_COSTS.MUSIC_GENERATION} Credits)`}</>}
                        </button>
                    </div>
                </div>

                {/* Right: Display */}
                <div className="flex flex-col bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden h-[600px] lg:h-full relative">
                    {song ? (
                        <div className="flex flex-col h-full">
                            {/* Player / Header */}
                            <div className="bg-[var(--bg-interactive)] p-6 flex flex-col md:flex-row items-center gap-6 border-b border-[var(--border-color)]">
                                <VinylRecord imageUrl={albumArt} isPlaying={isPlaying} />
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent-cyan)]">{song.title}</h2>
                                    <p className="text-[var(--text-secondary)] text-sm uppercase tracking-widest">{t(`musicStudio.genres.${settings.genre}`)} • {t(`musicStudio.moods.${settings.mood}`)}</p>
                                    
                                    <div className="flex gap-3 justify-center md:justify-start mt-4">
                                        <button 
                                            onClick={handlePlayDemo}
                                            disabled={isLoading}
                                            className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform ${isPlaying ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-gradient text-white'}`}
                                        >
                                            {isLoading ? (
                                                <><i className="fas fa-circle-notch fa-spin"></i> {t('common.processing')}</>
                                            ) : isPlaying ? (
                                                <><i className="fas fa-stop"></i> Dừng</>
                                            ) : (
                                                <><i className="fas fa-play"></i> {audioBuffer ? "Phát lại" : t('musicStudio.actions.playDemo')}</>
                                            )}
                                        </button>
                                        <button onClick={downloadAssets} className="px-4 py-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-white transition-colors">
                                            <i className="fas fa-download"></i>
                                        </button>
                                    </div>
                                    {!audioBuffer && !isLoading && !isPlaying && (
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                                            *Nhấn lần đầu sẽ tốn Credit để tạo giọng đọc. Các lần nghe sau miễn phí.
                                        </p>
                                    )}
                                    {isArtLoading && <p className="text-xs text-[var(--accent-cyan)] animate-pulse mt-2">{t('musicStudio.status.generatingArt')}</p>}
                                </div>
                            </div>

                            {/* Lyrics Scroll */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-center">
                                <div className="max-w-xl mx-auto space-y-6">
                                    <div className="text-left bg-[var(--bg-deep-space)] p-4 rounded-lg border border-white/5 font-mono text-xs text-yellow-400">
                                        <strong>Chords:</strong> {song.chords}
                                    </div>
                                    <div className="whitespace-pre-line leading-relaxed text-lg text-[var(--text-primary)] font-medium">
                                        {song.lyrics}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
                            <i className="fas fa-headphones-alt text-6xl mb-4"></i>
                            <p className="text-xl font-medium">{t('musicStudio.placeholder')}</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="absolute bottom-4 left-4 right-4 bg-red-900/80 text-white p-3 rounded-lg text-center backdrop-blur-md">
                            {error}
                        </div>
                    )}
                </div>
            </main>
            
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default MusicStudio;
