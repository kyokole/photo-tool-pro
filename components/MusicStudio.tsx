
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { MUSIC_GENRES, MUSIC_MOODS, CREDIT_COSTS } from '../constants';
import type { MusicSettings, SongStructure, MusicAnalysisResult } from '../types';
import { generateSongContent, generateAlbumArt, generateSpeech, analyzeMusicAudio } from '../services/geminiService';
import { smartDownload } from '../utils/canvasUtils';

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

const SAMPLE_RATE = 24000;

const decodePCM = (base64Data: string, ctx: AudioContext): AudioBuffer => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    
    for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32Data.length, SAMPLE_RATE);
    buffer.copyToChannel(float32Data, 0);
    return buffer;
};

const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    function writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * 2, true);

    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][pos]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(44 + offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Blob([view], { type: 'audio/wav' });
};

const AudioVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
    return (
        <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs mx-auto">
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-1 bg-gradient-to-t from-[var(--accent-cyan)] to-[var(--accent-blue)] rounded-full transition-all duration-100 ease-in-out ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                        height: isPlaying ? `${Math.random() * 100}%` : '10%',
                        animationDelay: `${i * 0.05}s`
                    }}
                />
            ))}
        </div>
    );
};

const MusicStudio: React.FC<MusicStudioProps> = ({ theme, setTheme, isVip, onInsufficientCredits, checkCredits }) => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<'compose' | 'analyze'>('compose');

    const [settings, setSettings] = useState<MusicSettings>({
        topic: '',
        genre: 'pop_ballad',
        mood: 'happy',
        language: i18n.language as 'vi' | 'en'
    });
    
    // Compose State
    const [song, setSong] = useState<SongStructure | null>(null);
    const [albumArt, setAlbumArt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isArtLoading, setIsArtLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Analysis State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<MusicAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Audio Player State
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

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

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
            setAnalysisResult(null); // Reset result on new file
        }
    };
    
    const handleAnalyze = async () => {
        if (!audioFile) return;
        
        if (!checkCredits(CREDIT_COSTS.MUSIC_GENERATION)) {
            if (onInsufficientCredits) onInsufficientCredits();
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        try {
             const result = await analyzeMusicAudio(audioFile);
             setAnalysisResult(result);
        } catch (e: any) {
            const errorMsg = e.message || '';
            if (errorMsg.includes("insufficient credits")) {
                if (onInsufficientCredits) onInsufficientCredits();
            } else {
                console.error(e);
                setError(errorMsg || t('errors.unknownError'));
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateSong = async () => {
        if (!settings.topic) return;

        if (!checkCredits(CREDIT_COSTS.MUSIC_GENERATION)) {
            if (onInsufficientCredits) onInsufficientCredits();
            return;
        }

        setIsLoading(true);
        setError(null);
        setSong(null);
        setAlbumArt(null);
        setAudioBuffer(null);
        setIsPlaying(false);
        if (activeSourceRef.current) {
            try { activeSourceRef.current.stop(); } catch(e) {}
            activeSourceRef.current = null;
        }

        try {
            const generatedSong = await generateSongContent(settings);
            setSong(generatedSong);
            
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
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

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

        if (isPlaying) {
            if (activeSourceRef.current) {
                try { activeSourceRef.current.stop(); } catch(e) {}
                activeSourceRef.current = null;
            }
            setIsPlaying(false);
            return;
        }

        if (audioBuffer) {
            playBuffer(audioBuffer);
            return;
        }

        if (!checkCredits(CREDIT_COSTS.AUDIO_GENERATION)) {
            if (onInsufficientCredits) onInsufficientCredits();
            return;
        }

        setIsLoading(true);
        try {
            const prompt = `[Style: ${song.stylePrompt}] \n\n ${song.lyrics}`;
            const base64Audio = await generateSpeech(prompt, 'hanoi_female_26', settings.language, undefined, 1.0); 
            
            const binaryString = atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            
            const int16Data = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(int16Data.length);
            for (let i = 0; i < int16Data.length; i++) {
                float32Data[i] = int16Data[i] / 32768.0;
            }

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const newBuffer = ctx.createBuffer(1, float32Data.length, 24000);
            newBuffer.copyToChannel(float32Data, 0);

            setAudioBuffer(newBuffer);
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
        
        if (audioBuffer) {
             const wavBlob = bufferToWav(audioBuffer);
             const wavUrl = URL.createObjectURL(wavBlob);
             smartDownload(wavUrl, `${song.title}_demo.wav`);
        }
    };

    const copySunoPrompt = () => {
        if (song && song.stylePrompt) {
            navigator.clipboard.writeText(song.stylePrompt);
            alert(t('actionBar.copiedToClipboard'));
        }
    };

    const copyAnalysisStyle = () => {
        if (analysisResult && analysisResult.style) {
            navigator.clipboard.writeText(analysisResult.style);
            alert(t('actionBar.copiedToClipboard'));
        }
    }

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
                
                <div className="flex flex-col gap-6 overflow-visible lg:overflow-y-auto scrollbar-thin pr-2 pb-10">
                    {/* TAB SELECTOR */}
                    <div className="flex bg-[var(--bg-component)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
                        <button 
                            onClick={() => setActiveTab('compose')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'compose' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        >
                            <i className="fas fa-pen-nib"></i> {t('musicStudio.tabs.compose')}
                        </button>
                         <button 
                            onClick={() => setActiveTab('analyze')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'analyze' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        >
                            <i className="fas fa-file-audio"></i> {t('musicStudio.tabs.analyze')}
                        </button>
                    </div>

                    <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-5 space-y-5 min-h-[300px]">
                        
                        {activeTab === 'compose' ? (
                            <>
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

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Language</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSettingsChange('language', 'vi')} className={`px-3 py-1.5 rounded-md text-xs font-bold border ${settings.language === 'vi' ? 'bg-[var(--accent-cyan)] text-white border-transparent' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]'}`}>Tiếng Việt</button>
                                        <button onClick={() => handleSettingsChange('language', 'en')} className={`px-3 py-1.5 rounded-md text-xs font-bold border ${settings.language === 'en' ? 'bg-[var(--accent-cyan)] text-white border-transparent' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]'}`}>English</button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerateSong}
                                    disabled={isLoading || !settings.topic}
                                    className="w-full btn-gradient text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
                                >
                                    {isLoading ? (
                                        <><i className="fas fa-spinner fa-spin"></i> {t('musicStudio.actions.composing')}</>
                                    ) : (
                                        <><i className="fas fa-music"></i> {t('musicStudio.actions.compose')} {isVip ? ` (${t('common.free')})` : ` (${CREDIT_COSTS.MUSIC_GENERATION} Credits)`}</>
                                    )}
                                </button>
                            </>
                        ) : (
                            // ANALYZE TAB INPUT
                            <div className="flex flex-col h-full justify-center">
                                <div 
                                    onClick={() => audioInputRef.current?.click()}
                                    className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--accent-cyan)] hover:bg-[var(--bg-interactive)] transition-all group min-h-[200px]"
                                >
                                    <input 
                                        type="file" 
                                        accept="audio/*" 
                                        ref={audioInputRef} 
                                        onChange={handleAudioFileChange} 
                                        className="hidden" 
                                    />
                                    {audioFile ? (
                                        <>
                                            <i className="fas fa-file-audio text-4xl text-green-400 mb-3"></i>
                                            <p className="font-bold text-[var(--text-primary)]">{audioFile.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <button className="mt-2 text-xs text-[var(--accent-cyan)] hover:underline">{t('fashionStudio.changeImage')}</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <i className="fas fa-cloud-upload-alt text-2xl text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)]"></i>
                                            </div>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">{t('musicStudio.actions.uploadAudio')}</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-2">{t('musicStudio.analysis.uploadTip')}</p>
                                        </>
                                    )}
                                </div>

                                <button 
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !audioFile}
                                    className="w-full btn-gradient text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-6"
                                >
                                    {isAnalyzing ? (
                                        <><i className="fas fa-spinner fa-spin"></i> {t('musicStudio.actions.analyzing')}</>
                                    ) : (
                                        <><i className="fas fa-search-dollar"></i> {t('musicStudio.actions.analyze')} {isVip ? ` (${t('common.free')})` : ` (${CREDIT_COSTS.MUSIC_GENERATION} Credits)`}</>
                                    )}
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-xs text-center">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col h-full overflow-hidden">
                     <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-6 h-full flex flex-col items-center justify-center relative overflow-hidden">
                        
                        {/* RENDER LOGIC FOR COMPOSITION RESULT */}
                        {activeTab === 'compose' && (
                            !song ? (
                                <div className="text-center text-[var(--text-muted)] opacity-50">
                                    <i className="fas fa-compact-disc text-6xl mb-4 animate-spin-slow"></i>
                                    <p className="text-lg font-medium">{t('musicStudio.placeholder')}</p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center gap-6 overflow-y-auto scrollbar-thin">
                                    <div className="flex flex-col items-center gap-4 flex-shrink-0">
                                        <div className="relative">
                                            <VinylRecord imageUrl={albumArt} isPlaying={isPlaying} />
                                            {isArtLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                                                    <div className="text-white text-xs font-bold animate-pulse">{t('musicStudio.status.generatingArt')}</div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handlePlayDemo}
                                                className="btn-gradient text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                            >
                                                {isPlaying ? <i className="fas fa-stop"></i> : <i className="fas fa-play"></i>}
                                                {t('musicStudio.actions.playDemo')} {(!audioBuffer && !isPlaying && !isVip) ? `(${CREDIT_COSTS.AUDIO_GENERATION} Cr)` : ''}
                                            </button>
                                            <button 
                                                onClick={downloadAssets}
                                                className="btn-secondary px-4 py-2 rounded-full font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                                            >
                                                <i className="fas fa-download"></i> {t('musicStudio.actions.download')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full max-w-2xl bg-[var(--bg-deep-space)] p-6 rounded-xl border border-white/10 text-center space-y-4">
                                        <h2 className="text-2xl font-bold text-[var(--accent-gold)]">{song.title}</h2>
                                        
                                        {song.stylePrompt && (
                                            <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-left shadow-inner mb-4">
                                                <label className="text-xs text-[var(--accent-cyan)] font-bold uppercase mb-2 block flex items-center gap-2">
                                                    <i className="fas fa-sliders-h"></i> {t('musicStudio.sunoPromptLabel')}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-black/50 p-3 rounded text-sm text-green-400 font-mono break-words border border-white/5">
                                                        {song.stylePrompt}
                                                    </code>
                                                    <button 
                                                        onClick={copySunoPrompt}
                                                        className="p-3 bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-white rounded border border-white/10 transition-colors"
                                                        title={t('musicStudio.actions.copyPrompt')}
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="text-sm text-[var(--text-secondary)] italic">{song.description}</div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-4">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold uppercase text-[var(--accent-cyan)] border-b border-white/10 pb-1">Lyrics</h4>
                                                <pre className="font-sans text-sm whitespace-pre-wrap leading-relaxed text-gray-300">{song.lyrics}</pre>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold uppercase text-[var(--accent-blue)] border-b border-white/10 pb-1">Chords</h4>
                                                <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-yellow-200/80 bg-black/20 p-3 rounded">{song.chords}</pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {/* RENDER LOGIC FOR ANALYSIS RESULT */}
                        {activeTab === 'analyze' && (
                             isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden bg-black animate-spin-slow">
                                        <div className="absolute inset-0 rounded-full border-[20px] border-gray-900 opacity-50"></div>
                                        <div className="absolute inset-4 rounded-full border-[1px] border-gray-800 opacity-30"></div>
                                        <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-br from-pink-600 to-orange-500 flex items-center justify-center">
                                            <i className="fas fa-search-dollar text-white text-3xl"></i>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-10 pointer-events-none rounded-full"></div>
                                    </div>
                                    <p className="mt-6 font-bold text-[var(--accent-cyan)] animate-pulse">{t('musicStudio.actions.analyzing')}</p>
                                </div>
                             ) : analysisResult ? (
                                <div className="w-full h-full flex flex-col gap-6 overflow-y-auto scrollbar-thin p-4">
                                    {/* Style Prompt Box */}
                                    <div className="bg-[var(--bg-deep-space)] p-6 rounded-xl border border-white/10 shadow-lg animate-fade-in">
                                        <h3 className="text-sm font-bold text-[var(--accent-gold)] uppercase tracking-wide mb-4 flex items-center gap-2">
                                            <i className="fas fa-music"></i> {t('musicStudio.analysis.styleTitle')}
                                        </h3>
                                        <div className="flex items-start gap-4">
                                            <code className="flex-1 bg-black/50 p-4 rounded-lg text-sm text-green-400 font-mono break-words border border-white/5 leading-relaxed">
                                                {analysisResult.style}
                                            </code>
                                            <button 
                                                onClick={copyAnalysisStyle}
                                                className="flex-shrink-0 bg-[var(--button-primary)] hover:opacity-90 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md whitespace-nowrap"
                                            >
                                                <i className="fas fa-copy mr-2"></i> {t('musicStudio.analysis.copyStyle')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lyrics Box */}
                                    <div className="flex-1 bg-[var(--bg-deep-space)] p-6 rounded-xl border border-white/10 shadow-lg animate-fade-in flex flex-col">
                                        <h3 className="text-sm font-bold text-[var(--accent-cyan)] uppercase tracking-wide mb-4 flex items-center gap-2">
                                            <i className="fas fa-microphone-alt"></i> {t('musicStudio.analysis.lyricsTitle')}
                                        </h3>
                                        <div className="flex-1 overflow-y-auto scrollbar-thin bg-black/30 p-4 rounded-lg border border-white/5">
                                            <pre className="font-sans text-sm whitespace-pre-wrap leading-relaxed text-gray-300">
                                                {analysisResult.lyrics}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                             ) : (
                                 <div className="text-center text-[var(--text-muted)] opacity-50">
                                    <i className="fas fa-headphones-alt text-6xl mb-4"></i>
                                    <p className="text-lg font-medium">{t('musicStudio.placeholderAnalysis')}</p>
                                </div>
                             )
                        )}
                     </div>
                </div>
            </main>
        </div>
    );
};

export default MusicStudio;
