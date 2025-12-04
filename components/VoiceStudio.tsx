
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { VOICE_OPTIONS, VOICE_REGIONS } from '../constants';
import type { VoiceOption } from '../types';
import { generateSpeech } from '../services/geminiService';
import { smartDownload } from '../utils/canvasUtils';
import { CREDIT_COSTS } from '../constants';
import { SliderInput } from './creativestudio/SliderInput';

interface VoiceStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
    onInsufficientCredits?: () => void;
    checkCredits: (cost: number) => boolean;
}

// --- Audio Utilities ---

const SAMPLE_RATE = 24000; // Gemini TTS standard sample rate

// Decodes Base64 Raw PCM (Int16) into an AudioBuffer
const decodePCM = (base64Data: string, ctx: AudioContext): AudioBuffer => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert Uint8Array bytes to Int16Array
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    
    // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0) for Web Audio API
    for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32Data.length, SAMPLE_RATE);
    buffer.copyToChannel(float32Data, 0);
    return buffer;
};

// Encodes AudioBuffer back to WAV Blob for downloading
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

    // write RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * 2, true);
    writeString(view, 8, 'WAVE');
    // write fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    // write data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * 2, true);

    // write the PCM samples
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) {
            // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Blob([view], { type: 'audio/wav' });
};

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
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

// Custom Speed Slider component
const SpeedSlider: React.FC<{ value: number, onChange: (val: number) => void, t: any }> = ({ value, onChange, t }) => {
    const sliderRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (sliderRef.current) {
            const min = 0.5;
            const max = 2.0;
            const percentage = ((value - min) / (max - min)) * 100;
            sliderRef.current.style.setProperty('--progress-percent', `${percentage}%`);
        }
    }, [value]);

    const getSpeedLabel = (val: number) => {
        if (val < 0.8) return t('voiceStudio.settings.speed_slow');
        if (val > 1.2) return t('voiceStudio.settings.speed_fast');
        return t('voiceStudio.settings.speed_normal');
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t('voiceStudio.settings.speed')}</span>
                <span className="text-xs font-bold text-[var(--accent-cyan)]">{value}x ({getSpeedLabel(value)})</span>
            </div>
            <div className="relative h-6 flex items-center">
                <input
                    ref={sliderRef}
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={value}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="custom-slider w-full"
                />
            </div>
        </div>
    );
};

const VoiceStudio: React.FC<VoiceStudioProps> = ({ theme, setTheme, isVip, onInsufficientCredits, checkCredits }) => {
    const { t, i18n } = useTranslation();
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [speed, setSpeed] = useState(1.0);
    
    // Audio Context State
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    
    // Playback Timing State
    const startTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const animationFrameRef = useRef<number>(0);

    // State for tabs and selection
    const [activeRegion, setActiveRegion] = useState<string>('north');
    const [selectedVoice, setSelectedVoice] = useState<any | null>(null); // Use any to access stylePrompt

    // Initialize Audio Context on user interaction (or component mount if allowed)
    const getAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    };

    // Clean up
    useEffect(() => {
        return () => {
            if (sourceNodeRef.current) {
                try { sourceNodeRef.current.stop(); } catch(e) {}
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const filteredVoices = useMemo(() => {
        return VOICE_OPTIONS.filter(v => v.regionKey === activeRegion);
    }, [activeRegion]);

    useEffect(() => {
        // Only reset selected voice if the current one is not in the new region
        if (!selectedVoice || selectedVoice.regionKey !== activeRegion) {
            if (filteredVoices.length > 0) {
                setSelectedVoice(filteredVoices[0]);
            } else {
                setSelectedVoice(null);
            }
        }
    }, [activeRegion, filteredVoices, selectedVoice]);

    const handleGenerate = async () => {
        if (!text.trim() || !selectedVoice) return;

        // CLIENT-SIDE CREDIT CHECK
        if (!checkCredits(CREDIT_COSTS.AUDIO_GENERATION)) {
            if (onInsufficientCredits) onInsufficientCredits();
            return;
        }
        
        // Stop any current playback
        stopPlayback();
        setAudioBuffer(null);
        setDuration(0);
        setCurrentTime(0);
        
        setIsLoading(true);
        setError(null);
        
        try {
            // PROMPT ENGINEERING MAGIC:
            // Combine the style prompt from constants with the user's text.
            const fullPrompt = `${selectedVoice.stylePrompt}\n\nNội dung cần đọc:\n${text}`;

            // Pass the base geminiVoice AND SPEED to the service
            const base64Audio = await generateSpeech(fullPrompt, selectedVoice.id, i18n.language, selectedVoice.geminiVoice, speed);
            
            const ctx = getAudioContext();
            const decodedBuffer = decodePCM(base64Audio, ctx);
            
            setAudioBuffer(decodedBuffer);
            setDuration(decodedBuffer.duration);
            
        } catch (err: any) {
            const errorMsg = err.message || '';
            if (errorMsg.includes("insufficient credits")) {
                if (onInsufficientCredits) onInsufficientCredits();
            } else {
                console.error(err);
                setError(errorMsg || t('errors.unknownError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const stopPlayback = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setIsPlaying(false);
        pausedAtRef.current = 0;
        startTimeRef.current = 0;
        setCurrentTime(0);
    };

    const pausePlayback = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        // Calculate where we paused
        const ctx = getAudioContext();
        pausedAtRef.current += ctx.currentTime - startTimeRef.current;
        setIsPlaying(false);
    };

    const playPlayback = () => {
        if (!audioBuffer) return;
        const ctx = getAudioContext();
        
        // Create a new source node
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.onended = () => {
            // Only reset if we reached the end naturally
        };

        startTimeRef.current = ctx.currentTime;
        
        // If we were paused at the end, restart
        if (pausedAtRef.current >= audioBuffer.duration) {
            pausedAtRef.current = 0;
        }

        source.start(0, pausedAtRef.current);
        sourceNodeRef.current = source;
        setIsPlaying(true);

        // Update loop for timer
        const update = () => {
            if (!sourceNodeRef.current) return;
            const now = ctx.currentTime;
            const rawTime = pausedAtRef.current + (now - startTimeRef.current);
            const displayTime = Math.min(rawTime, audioBuffer.duration);
            setCurrentTime(displayTime);

            if (rawTime >= audioBuffer.duration) {
                setIsPlaying(false);
                pausedAtRef.current = 0; // Reset for next play
                return;
            }
            
            animationFrameRef.current = requestAnimationFrame(update);
        };
        update();
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            playPlayback();
        }
    };

    const handleDownload = () => {
        if (audioBuffer) {
            const wavBlob = bufferToWav(audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            smartDownload(url, `voice_studio_${selectedVoice?.provinceKey || 'audio'}_${Date.now()}.wav`);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }
    };

    const formatTime = (time: number) => {
        const m = Math.floor(time / 60).toString().padStart(2, '0');
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
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
                    <div className="bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] shadow-lg p-5 flex flex-col h-[300px] relative">
                        <label className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2">{t('voiceStudio.input.label')}</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('voiceStudio.input.placeholder')}
                            className="flex-grow w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-xl p-4 text-base resize-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all placeholder-gray-600"
                            maxLength={5000}
                        />
                        <div className="text-right text-xs text-[var(--text-secondary)] mt-2">
                            {text.length} / 5000
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

                        {/* Voice Grid */}
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
                        
                        {/* Re-structured Header to prevent Overlap */}
                        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                                {t('auth.result')}
                            </h3>
                            <div className="w-full sm:w-1/2">
                                <SpeedSlider value={speed} onChange={setSpeed} t={t} />
                            </div>
                        </div>

                        {/* Visualization */}
                        <div className="w-full flex-1 flex flex-col items-center justify-center py-4">
                            {audioBuffer ? (
                                <div className="w-full max-w-sm">
                                    <AudioVisualizer isPlaying={isPlaying} />
                                    <div className="text-center mt-4 text-[var(--accent-cyan)] font-mono text-sm">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
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
                            {!audioBuffer ? (
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={!text.trim() || isLoading}
                                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isLoading ? (
                                        <><i className="fas fa-circle-notch fa-spin"></i> {t('voiceStudio.actions.generating')}</>
                                    ) : (
                                        <><i className="fas fa-microphone-alt"></i> {t('voiceStudio.actions.generate')} {isVip ? ` (${t('common.free')})` : ` (${CREDIT_COSTS.AUDIO_GENERATION} Credits)`}</>
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
                                        onClick={() => { 
                                            stopPlayback();
                                            setAudioBuffer(null);
                                            setDuration(0);
                                            setCurrentTime(0);
                                        }} 
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
