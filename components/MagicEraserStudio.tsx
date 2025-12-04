
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { ImageUploader } from './ImageUploader';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { fileToGenerativePart } from '../utils/fileUtils';
import { removeWatermark, removeVideoWatermark } from '../services/geminiService';
import { smartDownload } from '../utils/canvasUtils';

interface MagicEraserStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

interface EraserHistoryItem {
    id: string;
    type: 'image' | 'video';
    original: string; // Blob URL or Link
    result: string; // Blob URL or Link
    timestamp: number;
    name: string;
}

const VipLockOverlay: React.FC<{ t: any }> = ({ t }) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6 rounded-2xl animate-fade-in">
        <div className="bg-yellow-500/10 p-4 rounded-full mb-4 border border-yellow-500/30">
             <i className="fas fa-crown text-5xl text-yellow-400 animate-pulse"></i>
        </div>
        <h3 className="text-2xl font-bold text-yellow-300 mb-2">{t('upgradeVipModal.vipOnlyTitle')}</h3>
        <p className="text-gray-300 mb-6 max-w-sm text-sm">{t('upgradeVipModal.vipOnlyDesc')}</p>
        <div className="text-xs text-gray-500 italic border-t border-white/10 pt-4 w-full">{t('magicEraser.vipNote')}</div>
    </div>
);

const ScanningOverlay: React.FC = () => (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
        <div className="w-full h-full bg-[var(--accent-blue)]/10 absolute inset-0"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-cyan)] to-transparent shadow-[0_0_15px_var(--accent-cyan)] animate-scan"></div>
        <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .animate-scan {
                animation: scan 2s linear infinite;
            }
        `}</style>
    </div>
);

const TerminalLog: React.FC<{ logs: string[] }> = ({ logs }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="bg-black/90 p-4 rounded-lg font-mono text-xs text-green-400 border border-green-500/30 h-40 overflow-y-auto shadow-inner">
            {logs.length === 0 ? (
                <div className="text-gray-500 italic">Ready for analysis...</div>
            ) : (
                logs.map((log, index) => (
                    <div key={index} className="mb-1 break-all">
                        <span className="text-blue-400 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                        {log}
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
            <div className="animate-pulse">_</div>
        </div>
    );
};

const MagicEraserStudio: React.FC<MagicEraserStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    
    // History
    const [history, setHistory] = useState<EraserHistoryItem[]>([]);

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageStatusText, setImageStatusText] = useState('');
    const [isHighQuality, setIsHighQuality] = useState(true);

    // Video State
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isVideoProcessing, setIsVideoProcessing] = useState(false);
    const [videoSource, setVideoSource] = useState<'general' | 'veo' | 'sora'>('general');
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoFinished, setVideoFinished] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
    const [extractedPrompt, setExtractedPrompt] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [processLogs, setProcessLogs] = useState<string[]>([]);
    const [videoLoadError, setVideoLoadError] = useState(false);

    useEffect(() => {
        setVideoUrl('');
        setVideoFinished(false);
        setProcessedVideoUrl(null);
        setExtractedPrompt(null);
        setVideoError(null); 
        setProcessLogs([]);
        setVideoLoadError(false);
    }, [videoSource]);

    useEffect(() => {
        if (!activeTab) setActiveTab('image');
    }, []);

    const addToHistory = (item: EraserHistoryItem) => {
        setHistory(prev => [item, ...prev]);
    };

    const handleImageUpload = (file: File) => {
        setImageFile(file);
        setProcessedImage(null);
        setImageError(null);
    };

    const handleImageSubmit = async () => {
        if (!imageFile) return;
        setIsImageProcessing(true);
        setImageError(null);
        setProcessedImage(null);
        setImageStatusText(t('magicEraser.status.analyzing'));

        try {
            const imagePart = await fileToGenerativePart(imageFile);
            if (!imagePart) throw new Error(t('errors.fileProcessingError'));
            
            setImageStatusText(t('magicEraser.status.processing'));
            const result = await removeWatermark(imagePart, isHighQuality);
            
            setProcessedImage(result);
            addToHistory({
                id: Date.now().toString(),
                type: 'image',
                original: URL.createObjectURL(imageFile),
                result: result,
                timestamp: Date.now(),
                name: imageFile.name
            });
        } catch (error: any) {
            console.error("Eraser failed:", error);
            const msg = error instanceof Error ? error.message : String(error);
             if (msg.includes('429') || msg.includes('quota')) {
                setImageError(t('errors.generationOverloaded'));
            } else {
                setImageError(t('magicEraser.errors.imageFailed') + (msg ? `: ${msg}` : ''));
            }
        } finally {
            setIsImageProcessing(false);
        }
    };

    const addLog = (msg: string) => setProcessLogs(prev => [...prev, msg]);

    const handleVideoSubmit = async () => {
        if (!videoUrl) return;

        setIsVideoProcessing(true);
        setVideoProgress(0);
        setVideoFinished(false);
        setProcessedVideoUrl(null);
        setExtractedPrompt(null);
        setVideoError(null);
        setProcessLogs([]);
        setVideoLoadError(false);
        
        try {
            addLog("Initializing Source Extractor v5.1...");
            await new Promise(r => setTimeout(r, 400));
            
            addLog(`Target: ${videoSource.toUpperCase()}`);
            addLog(`Analyzing link: ${videoUrl.substring(0, 30)}...`);
            
            if (videoUrl.match(/\.(mp4|mov)$/i)) {
                 addLog("Direct file detected.");
                 setVideoProgress(30);
            } else {
                 addLog("Searching for clean source in metadata...");
                 await new Promise(r => setTimeout(r, 600));
                 setVideoProgress(40);
                 addLog("Extracting JSON blob...");
                 await new Promise(r => setTimeout(r, 600));
            }

            const payload = { url: videoUrl, type: videoSource };
            const { videoUrl: responseUrl, prompt } = await removeVideoWatermark(payload, videoSource);
            
            if (!responseUrl) throw new Error("Could not find clean source.");

            addLog("Clean source found!");
            addLog("Extracting metadata (Prompt)...");
            
            if (prompt) {
                setExtractedPrompt(prompt);
                addLog("Prompt extraction successful.");
            } else {
                addLog("No prompt metadata found.");
            }

            setVideoProgress(90);
            await new Promise(r => setTimeout(r, 500));
            setVideoProgress(100);
            
            let finalUrl = responseUrl;
            if (finalUrl.includes('&amp;')) {
                finalUrl = finalUrl.replace(/&amp;/g, '&');
            }
            
            setProcessedVideoUrl(finalUrl);
            setVideoFinished(true);
            addLog("PROCESS COMPLETE.");
            
            addToHistory({
                id: Date.now().toString(),
                type: 'video',
                original: videoUrl,
                result: finalUrl,
                timestamp: Date.now(),
                name: 'Clean Video'
            });

        } catch (e: any) {
            setVideoProgress(0);
            addLog(`ERROR: ${e.message}`);
            setVideoError(t('magicEraser.errors.videoFailed'));
        } finally {
            setIsVideoProcessing(false);
        }
    };
    
    const handleVideoDownload = async () => {
        if (!processedVideoUrl) return;
        
        const filename = `photosuite_${Date.now()}.mp4`;
        
        try {
            // Try fetching as blob to enforce filename
            const response = await fetch(processedVideoUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            smartDownload(url, filename);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (e) {
            console.warn("Blob fetch failed, falling back to direct link", e);
            // Fallback to direct link
            smartDownload(processedVideoUrl, filename);
        }
    };

    const renderImageTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {!isVip && <VipLockOverlay t={t} />}
            <div className="space-y-6">
                <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] relative overflow-hidden">
                    {isImageProcessing && <ScanningOverlay />}
                    <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">{t('magicEraser.image.uploadTitle')}</h3>
                    {!imageFile ? (
                        <div className="h-64">
                            <ImageUploader onImageUpload={handleImageUpload} uploaderId="eraser-image-upload" />
                            <p className="text-center text-xs text-[var(--text-secondary)] mt-2">{t('magicEraser.image.uploadDesc')}</p>
                        </div>
                    ) : (
                        <div className="relative group rounded-xl overflow-hidden h-64 flex items-center justify-center bg-black/20">
                            <img src={URL.createObjectURL(imageFile)} alt="Upload" className="max-h-full max-w-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => { setImageFile(null); setProcessedImage(null); }} className="btn-secondary text-white px-4 py-2 rounded-lg">
                                    <i className="fas fa-trash mr-2"></i> {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="bg-[var(--bg-component)] p-3 rounded-xl border border-[var(--border-color)] flex items-center gap-3">
                    <input type="checkbox" id="hq-eraser" checked={isHighQuality} onChange={e => setIsHighQuality(e.target.checked)} className="form-checkbox h-5 w-5 text-[var(--accent-cyan)]" />
                    <div>
                        <label htmlFor="hq-eraser" className="text-sm font-bold text-[var(--text-primary)] block">{t('common.highQualityLabel')}</label>
                        <p className="text-xs text-[var(--text-secondary)]">Giữ nguyên độ phân giải gốc (Khuyên dùng)</p>
                    </div>
                </div>

                <button onClick={handleImageSubmit} disabled={!imageFile || isImageProcessing} className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3">
                    {isImageProcessing ? <><i className="fas fa-circle-notch fa-spin"></i> <span>{imageStatusText}</span></> : <><i className="fas fa-eraser"></i> {t('magicEraser.image.process')}</>}
                </button>
                {imageError && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center text-sm">{imageError}</div>}
            </div>

            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                {processedImage && imageFile ? (
                    <div className="w-full h-full flex flex-col gap-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                             <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('magicEraser.image.compareTitle')}</h3>
                             <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded uppercase">{t('magicEraser.status.success')}</span>
                        </div>
                        <div className="flex-1 relative rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-deep-space)]">
                            <BeforeAfterSlider before={URL.createObjectURL(imageFile)} after={processedImage} />
                        </div>
                        <button onClick={() => smartDownload(processedImage!, `photosuite_eraser_${Date.now()}.png`)} className="w-full btn-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            <i className="fas fa-download"></i> {t('magicEraser.image.download')}
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-secondary)] opacity-50">
                         {isImageProcessing ? (
                             <div className="flex flex-col items-center">
                                 <i className="fas fa-magic text-5xl mb-6 animate-pulse text-[var(--accent-cyan)]"></i>
                                 <p className="text-lg font-medium animate-pulse">{imageStatusText}</p>
                             </div>
                         ) : (
                             <>
                                 <i className="fas fa-image text-6xl mb-4"></i>
                                 <p className="text-lg font-medium">{t('magicEraser.image.resultTitle')}</p>
                             </>
                         )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderVideoTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {!isVip && <VipLockOverlay t={t} />}
            
            <div className="space-y-6">
                 <div className="bg-[var(--bg-component)] p-5 rounded-2xl shadow-lg border border-[var(--border-color)]">
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">{t('magicEraser.video.sourceLabel')}</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'general', icon: 'fas fa-film', label: t('magicEraser.video.sourceOptions.general') },
                            { id: 'veo', icon: 'fas fa-robot', label: t('magicEraser.video.sourceOptions.veo') },
                            { id: 'sora', icon: 'fas fa-cloud', label: t('magicEraser.video.sourceOptions.sora') }
                        ].map((opt) => (
                             <button 
                                key={opt.id}
                                onClick={() => setVideoSource(opt.id as any)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 h-24 ${
                                    videoSource === opt.id 
                                    ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] shadow-md transform scale-105' 
                                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                }`}
                            >
                                <i className={`${opt.icon} text-2xl mb-2`}></i>
                                <span className="text-xs font-bold text-center leading-tight">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] transition-all duration-500 relative overflow-hidden">
                    {isVideoProcessing && <ScanningOverlay />}
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><i className="fas fa-link text-[var(--accent-cyan)]"></i> {t('magicEraser.video.inputType.url')}</h3>
                    
                    <div className="flex flex-col justify-center space-y-4 bg-[var(--bg-tertiary)]/30 rounded-xl p-4 border border-[var(--border-color)]">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                            {videoSource === 'sora' ? t('magicEraser.video.placeholders.sora') : (videoSource === 'veo' ? t('magicEraser.video.placeholders.veo') : t('magicEraser.video.placeholders.general'))}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i className="fas fa-link text-[var(--accent-cyan)]"></i></div>
                            <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full pl-10 pr-4 py-3.5 bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all text-sm shadow-inner" />
                        </div>
                    </div>
                </div>

                {videoError && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center text-sm animate-fade-in"><i className="fas fa-exclamation-circle mr-2"></i> {videoError}</div>
                )}

                <button 
                    onClick={handleVideoSubmit}
                    disabled={!videoUrl || isVideoProcessing || !isVip}
                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                    {isVideoProcessing ? (
                        <>
                            <span className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300" style={{ width: `${videoProgress}%` }}></span>
                            <span className="relative z-10 flex items-center gap-2"><i className="fas fa-circle-notch fa-spin"></i> {t('magicEraser.status.processing')} {Math.round(videoProgress)}%</span>
                        </>
                    ) : (
                        <><i className="fas fa-search"></i> {t('magicEraser.video.processLink')} {!isVip && <i className="fas fa-lock ml-2 text-yellow-300"></i>}</>
                    )}
                </button>
            </div>

            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center min-h-[400px]">
                {isVideoProcessing && (
                    <div className="w-full h-full flex flex-col">
                         <p className="text-sm text-[var(--text-secondary)] mb-2 font-mono">System Terminal:</p>
                         <div className="flex-1 min-h-[300px]"><TerminalLog logs={processLogs} /></div>
                    </div>
                )}
                
                {!isVideoProcessing && videoFinished && processedVideoUrl ? (
                    <div className="w-full flex flex-col animate-fade-in h-full">
                        {/* Header Info */}
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                             <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-film text-[var(--accent-cyan)]"></i> {t('magicEraser.videoInfo')}
                             </h3>
                             <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow">{t('magicEraser.status.success')}</span>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 flex-1">
                             {/* LEFT COLUMN: Video */}
                             <div className="flex-1 flex flex-col gap-3">
                                 <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-[var(--border-color)] shadow-2xl relative group">
                                     <video src={processedVideoUrl} controls autoPlay playsInline className="w-full h-full object-contain" onError={() => setVideoLoadError(true)} />
                                     {videoLoadError && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 text-center p-6 z-20">
                                            <div className="flex flex-col items-center gap-2">
                                                 <i className="fas fa-video-slash text-3xl mb-2"></i>
                                                 <p className="font-bold">Lỗi Codec (AV1/HEVC)</p>
                                                 <p className="text-xs text-gray-400">Trình duyệt chưa hỗ trợ phát trực tiếp. Hãy tải về để xem.</p>
                                            </div>
                                        </div>
                                     )}
                                </div>
                                <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)] flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-secondary)] font-bold uppercase">{t('magicEraser.format')}:</span>
                                    <span className="text-xs text-white font-mono bg-black/40 px-2 py-1 rounded">MP4</span>
                                </div>
                             </div>

                             {/* RIGHT COLUMN: Actions */}
                             <div className="w-full lg:w-72 flex flex-col gap-4">
                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t('magicEraser.image.download')}</label>
                                     
                                     {/* SINGLE DOWNLOAD BUTTON as requested */}
                                     <button 
                                        onClick={handleVideoDownload}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                                     >
                                         <i className="fas fa-download text-xl"></i>
                                         <span className="text-lg">{t('magicEraser.downloadMain')}</span>
                                     </button>
                                 </div>

                                 <div className="flex-1 flex flex-col min-h-0">
                                     <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 flex justify-between items-center">
                                         {t('magicEraser.aiPrompt')}
                                         {extractedPrompt && (
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(extractedPrompt); alert(t('actionBar.copiedToClipboard')); }}
                                                className="text-[var(--accent-cyan)] hover:text-white transition-colors"
                                                title={t('marketingStudio.actions.copyPrompt')}
                                            >
                                                <i className="fas fa-copy"></i>
                                            </button>
                                         )}
                                     </label>
                                     <div className="flex-1 bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-lg p-3 overflow-y-auto scrollbar-thin max-h-48 text-xs text-[var(--text-primary)] leading-relaxed">
                                         {extractedPrompt || <span className="text-gray-500 italic">No prompt metadata found.</span>}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                ) : !isVideoProcessing && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)] opacity-50">
                        <i className="fas fa-film text-6xl mb-4"></i>
                        <p className="text-lg font-medium">{t('magicEraser.image.resultTitle')}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 font-sans animate-fade-in h-auto lg:h-full overflow-y-auto lg:overflow-hidden">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6 flex-shrink-0">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('magicEraser.title')}</h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('magicEraser.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-7xl mx-auto flex-1 min-h-0 lg:overflow-hidden flex flex-col">
                <div className="flex justify-center mb-6">
                    <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
                        <button onClick={() => setActiveTab('image')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'image' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                            <i className="fas fa-image"></i> {t('magicEraser.tabs.image')}
                        </button>
                        <button onClick={() => setActiveTab('video')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'video' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                            <i className="fas fa-video"></i> {t('magicEraser.tabs.video')}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-visible lg:overflow-y-auto scrollbar-thin pb-10">
                    {activeTab === 'image' ? renderImageTab() : renderVideoTab()}
                </div>
            </main>
        </div>
    );
};

export default MagicEraserStudio;
