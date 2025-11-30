
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { VOICE_OPTIONS, VOICE_REGIONS } from '../constants';
import type { VoiceOption } from '../types';
import { generateSpeech } from '../services/geminiService';
import { smartDownload } from '../utils/canvasUtils';
import { CREDIT_COSTS } from '../constants';

interface VoiceStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

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

const VoiceStudio: React.FC<VoiceStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t, i18n } = useTranslation();
    const [text, setText] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // State for tabs and selection
    const [activeRegion, setActiveRegion] = useState<string>('north');
    const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);

    // Filter voices based on active region
    const filteredVoices = useMemo(() => {
        return VOICE_OPTIONS.filter(v => v.regionKey === activeRegion);
    }, [activeRegion]);

    // Select the first voice when region changes
    useEffect(() => {
        if (filteredVoices.length > 0) {
            setSelectedVoice(filteredVoices[0]);
        }
    }, [activeRegion, filteredVoices]);

    const handleGenerate = async () => {
        if (!text.trim() || !selectedVoice) return;
        
        setIsLoading(true);
        setError(null);
        setAudioUrl(null);
        
        try {
            const base64Audio = await generateSpeech(text, selectedVoice.id, i18n.language);
            
            // Convert base64 to Blob URL
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/wav' }); 
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('errors.unknownError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayPause = () => {
        if (!audioRef.current || !audioUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const handleDownload = () => {
        if (audioUrl) {
            smartDownload(audioUrl, `voice_studio_${Date.now()}.wav`);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 font-sans animate-fade-in h-auto lg:h-full overflow-y-auto lg:overflow-hidden">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6 flex-shrink-0">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('voiceStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('voiceStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 flex-1 lg:overflow-hidden">
                
                {/* LEFT COLUMN: Controls & Voices */}
                <div className="flex flex-col gap-6 overflow-visible lg:overflow-y-auto scrollbar-thin pr-2 pb-10">
                    
                    {/* Text Input */}
                    <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-5 flex flex-col h-[300px]">
                        <label className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2">{t('voiceStudio.input.label')}</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('voiceStudio.input.placeholder')}
                            className="flex-grow w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-xl p-4 text-base resize-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all placeholder-gray-600"
                            maxLength={500}
                        />
                        <div className="text-right text-xs text-[var(--text-secondary)] mt-2">
                            {text.length} / 500
                        </div>
                    </div>

                    {/* Voice Selection */}
                    <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg overflow-hidden flex flex-col">
                        
                        {/* Region Tabs */}
                        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-x-auto no-scrollbar">
                            {VOICE_REGIONS.map(region => (
                                <button
                                    key={region.id}
                                    onClick={() => setActiveRegion(region.id)}
                                    className={`flex-1 min-w-[80px] py-4 text-xs sm:text-sm font-bold transition-all uppercase tracking-wide flex flex-col items-center gap-1 ${
                                        activeRegion === region.id 
                                        ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' 
                                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5 border-b-2 border-transparent'
                                    }`}
                                >
                                    <i className={`${region.icon} text-lg`}></i>
                                    <span>{t(region.labelKey)}</span>
                                </button>
                            ))}
                        </div>

                        {/* Voice Grid - Mobile Responsive */}
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto scrollbar-thin bg-[var(--bg-interactive)]">
                            {filteredVoices.map((voice) => (
                                <button
                                    key={voice.id}
                                    onClick={() => setSelectedVoice(voice)}
                                    className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 group flex items-center gap-3 ${
                                        selectedVoice?.id === voice.id 
                                        ? 'border-[var(--accent-cyan)] bg-[var(--bg-component)] shadow-md' 
                                        : 'border-transparent bg-[var(--bg-tertiary)] hover:border-white/20'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                                        selectedVoice?.id === voice.id ? 'bg-[var(--accent-cyan)] text-white' : 'bg-[var(--bg-deep-space)] text-[var(--text-secondary)]'
                                    }`}>
                                        <i className={voice.icon}></i>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-sm font-bold truncate ${selectedVoice?.id === voice.id ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                                            {voice.provinceKey ? t(`voiceStudio.provinces.${voice.provinceKey}`) : t(voice.nameKey)}
                                        </div>
                                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate leading-tight">
                                            {t(voice.nameKey)}
                                        </div>
                                    </div>
                                    {selectedVoice?.id === voice.id && (
                                        <div className="absolute top-2 right-2 text-[var(--accent-cyan)] text-xs">
                                            <i className="fas fa-check-circle"></i>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Output & Info */}
                <div className="flex flex-col gap-6">
                    {/* Output Card */}
                    <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-2xl p-6 flex flex-col justify-center items-center relative min-h-[300px]">
                        <h3 className="absolute top-6 left-6 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-4">{t('auth.result')}</h3>
                        
                        {/* Visualization */}
                        <div className="w-full flex-1 flex flex-col items-center justify-center py-8">
                            {audioUrl ? (
                                <div className="w-full max-w-sm">
                                    <AudioVisualizer isPlaying={isPlaying} />
                                    <audio 
                                        ref={audioRef} 
                                        src={audioUrl} 
                                        onPlay={() => setIsPlaying(true)} 
                                        onPause={() => setIsPlaying(false)} 
                                        onEnded={() => setIsPlaying(false)}
                                        className="hidden" 
                                    />
                                    <div className="text-center mt-4 text-[var(--accent-cyan)] font-mono text-sm">00:00 / --:--</div>
                                </div>
                            ) : (
                                <div className="text-[var(--text-muted)] text-sm italic flex flex-col items-center gap-3 opacity-50">
                                    <i className="fas fa-wave-square text-4xl"></i>
                                    {t('voiceStudio.output.placeholder')}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="w-full mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Main Action Button */}
                        <div className="w-full flex gap-3 flex-wrap">
                            {!audioUrl ? (
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={!text.trim() || isLoading}
                                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isLoading ? (
                                        <><i className="fas fa-circle-notch fa-spin"></i> {t('voiceStudio.actions.generating')}</>
                                    ) : (
                                        <><i className="fas fa-microphone-alt"></i> {t('voiceStudio.actions.generate')} {isVip ? '(Miễn phí)' : `(${CREDIT_COSTS.AUDIO_GENERATION} Credits)`}</>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handlePlayPause} 
                                        className="flex-1 btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                    >
                                        {isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
                                        {isPlaying ? t('voiceStudio.actions.pause') : t('voiceStudio.actions.play')}
                                    </button>
                                    <button 
                                        onClick={handleDownload} 
                                        className="btn-secondary px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                                    >
                                        <i className="fas fa-download"></i> {t('common.download')}
                                    </button>
                                    <button 
                                        onClick={() => { setAudioUrl(null); setText(''); }} 
                                        className="btn-secondary px-4 rounded-xl font-bold flex items-center justify-center hover:text-red-400 transition-colors"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-xl border border-[var(--border-color)] shadow-lg flex-1">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-4 border-b border-white/10 pb-2">{t('voiceStudio.settings.info')}</h3>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            {t('voiceStudio.infoText')}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VoiceStudio;
