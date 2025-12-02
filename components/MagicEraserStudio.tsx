
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

const MagicEraserStudio: React.FC<MagicEraserStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    
    // History State
    const [history, setHistory] = useState<EraserHistoryItem[]>([]);

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageStatusText, setImageStatusText] = useState('');
    const [isHighQuality, setIsHighQuality] = useState(true); // Default true for best experience

    // Video State
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [videoInputType, setVideoInputType] = useState<'file' | 'url'>('file');
    const [isVideoProcessing, setIsVideoProcessing] = useState(false);
    const [videoSource, setVideoSource] = useState<'general' | 'veo' | 'sora'>('general');
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoStatusText, setVideoStatusText] = useState('');
    const [videoFinished, setVideoFinished] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);

    const videoInputRef = useRef<HTMLInputElement>(null);

    // --- SMART UX: Auto-switch input type based on source ---
    useEffect(() => {
        if (videoSource === 'general') {
            // General video -> File upload is preferred/only sensible option in this context
            setVideoInputType('file');
        } else {
            // Cloud sources (Veo, Sora) -> URL is preferred
            setVideoInputType('url');
        }
        
        // Clean up previous state to avoid confusion
        setVideoFile(null);
        setVideoUrl('');
        setVideoFinished(false);
        setProcessedVideoUrl(null);
        setError(null); // Fix: Defined but not used in original context
    }, [videoSource]);

    // Explicit helper to set error
    const setError = (msg: string | null) => {
        // Just a helper to handle different error states if needed later
    };


    const addToHistory = (item: EraserHistoryItem) => {
        setHistory(prev => [item, ...prev]);
    };

    const handleHistorySelect = (item: EraserHistoryItem) => {
        if (item.type === 'image') {
            setActiveTab('image');
            setProcessedImage(item.result);
            setImageFile(null); // Reset upload input
        } else {
            setActiveTab('video');
            setVideoFinished(true);
            setProcessedVideoUrl(item.result);
        }
    };

    // Handlers for Image
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
                setImageError(t('magicEraser.errors.processingFailed') + (msg ? `: ${msg}` : ''));
            }
        } finally {
            setIsImageProcessing(false);
        }
    };

    // Handlers for Video
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
            setVideoFinished(false);
            setVideoProgress(0);
        }
    };

    const triggerVideoUpload = () => videoInputRef.current?.click();

    const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            setVideoFinished(false);
            setVideoProgress(0);
            setVideoInputType('file');
        }
    };

    const handleVideoSubmit = async () => {
        if (videoInputType === 'file' && !videoFile) return;
        if (videoInputType === 'url' && !videoUrl) return;

        setIsVideoProcessing(true);
        setVideoProgress(0);
        setVideoFinished(false);
        setProcessedVideoUrl(null);
        setVideoStatusText(t('magicEraser.status.uploading'));

        const steps = [
            { progress: 10, text: t('magicEraser.status.uploading') },
            { progress: 30, text: videoInputType === 'url' ? t('magicEraser.status.downloading_url') : t('magicEraser.status.analyzing') },
            { progress: 60, text: t('magicEraser.status.processing') },
            { progress: 80, text: t('magicEraser.status.cleaning') },
            { progress: 95, text: t('magicEraser.status.finalizing') },
        ];

        let currentStep = 0;

        const progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                setVideoProgress(steps[currentStep].progress);
                setVideoStatusText(steps[currentStep].text);
                currentStep++;
            }
        }, 800);

        try {
            const payload = videoInputType === 'file' ? { file: videoFile } : { url: videoUrl };
            const resultUrl = await removeVideoWatermark(payload, videoSource);
            
            clearInterval(progressInterval);
            setVideoProgress(100);
            setVideoStatusText(t('magicEraser.status.success'));
            setProcessedVideoUrl(resultUrl);
            setVideoFinished(true);
            
            addToHistory({
                id: Date.now().toString(),
                type: 'video',
                original: videoInputType === 'file' && videoFile ? URL.createObjectURL(videoFile) : videoUrl,
                result: resultUrl,
                timestamp: Date.now(),
                name: videoInputType === 'file' && videoFile ? videoFile.name : 'Video Link'
            });

        } catch (e) {
            clearInterval(progressInterval);
            setIsVideoProcessing(false);
            setVideoProgress(0);
            alert(t('magicEraser.errors.processingFailed'));
        } finally {
            setIsVideoProcessing(false);
        }
    };

    const getUrlPlaceholder = () => {
        switch (videoSource) {
            case 'sora': return t('magicEraser.video.placeholders.sora');
            case 'veo': return t('magicEraser.video.placeholders.veo');
            default: return t('magicEraser.video.placeholders.general');
        }
    };
    
    const getUrlDesc = () => {
        switch (videoSource) {
            case 'sora': return t('magicEraser.video.urlDescSora');
            case 'veo': return t('magicEraser.video.urlDescVeo');
            default: return t('magicEraser.video.urlDescGeneral');
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
                
                {/* Quality Toggle */}
                <div className="bg-[var(--bg-component)] p-3 rounded-xl border border-[var(--border-color)] flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="hq-eraser" 
                        checked={isHighQuality} 
                        onChange={e => setIsHighQuality(e.target.checked)} 
                        className="form-checkbox h-5 w-5 text-[var(--accent-cyan)]"
                    />
                    <div>
                        <label htmlFor="hq-eraser" className="text-sm font-bold text-[var(--text-primary)] block">{t('common.highQualityLabel')}</label>
                        <p className="text-xs text-[var(--text-secondary)]">Giữ nguyên độ phân giải gốc (Khuyên dùng)</p>
                    </div>
                </div>

                <button 
                    onClick={handleImageSubmit}
                    disabled={!imageFile || isImageProcessing}
                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                >
                    {isImageProcessing ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> <span>{imageStatusText}</span></>
                    ) : (
                        <><i className="fas fa-eraser"></i> {t('magicEraser.image.process')}</>
                    )}
                </button>

                {imageError && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center text-sm">
                        {imageError}
                    </div>
                )}
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
                        <button 
                            onClick={() => smartDownload(processedImage, `cleaned-image-${Date.now()}.png`)}
                            className="w-full btn-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        >
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
                            { id: 'general', icon: 'fas fa-file-video', label: t('magicEraser.video.sourceOptions.general') },
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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            {videoInputType === 'file' ? <i className="fas fa-upload text-[var(--accent-cyan)]"></i> : <i className="fas fa-link text-[var(--accent-cyan)]"></i>}
                            {videoInputType === 'file' ? t('magicEraser.video.inputType.file') : t('magicEraser.video.inputType.url')}
                        </h3>
                        
                        {/* Context-Aware Switcher: Only show if not 'General' OR let user manually override if needed. 
                            For better UX based on feedback, we'll hide it for 'General' since it confuses users. */}
                        {videoSource !== 'general' && (
                            <div className="flex gap-1 bg-[var(--bg-deep-space)] p-1 rounded-lg border border-[var(--border-color)]">
                                <button 
                                    onClick={() => setVideoInputType('file')} 
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${videoInputType === 'file' ? 'bg-[var(--bg-tertiary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                                >
                                    File
                                </button>
                                <button 
                                    onClick={() => setVideoInputType('url')} 
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${videoInputType === 'url' ? 'bg-[var(--bg-tertiary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                                >
                                    Link
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="min-h-[180px] transition-all duration-300">
                        {videoInputType === 'file' ? (
                            !videoFile ? (
                                <div 
                                    onClick={triggerVideoUpload}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleVideoDrop}
                                    className="h-48 border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-cyan)] hover:bg-[var(--accent-blue)]/5 transition-all group"
                                >
                                    <input type="file" ref={videoInputRef} onChange={handleVideoUpload} accept="video/mp4,video/quicktime" className="hidden" />
                                    <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                        <i className="fas fa-cloud-upload-alt text-3xl text-[var(--accent-cyan)]"></i>
                                    </div>
                                    <p className="font-semibold text-[var(--text-primary)]">{t('common.uploadPrompt')}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{t('magicEraser.video.uploadDesc')}</p>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden bg-black h-48 flex items-center justify-center border border-[var(--border-color)]">
                                    <video src={URL.createObjectURL(videoFile)} controls className="max-h-full max-w-full" />
                                    <button 
                                        onClick={() => { setVideoFile(null); setVideoFinished(false); }} 
                                        className="absolute top-2 right-2 bg-red-600/80 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
                                        {videoFile.name}
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="h-48 flex flex-col justify-center space-y-4 bg-[var(--bg-tertiary)]/30 rounded-xl p-4 border border-[var(--border-color)]">
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    {getUrlPlaceholder()}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fas fa-link text-[var(--accent-cyan)]"></i>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full pl-10 pr-4 py-3.5 bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all text-sm shadow-inner"
                                    />
                                </div>
                                <div className="flex items-start gap-2 bg-[var(--bg-component)] p-3 rounded-lg border border-white/5">
                                    <i className="fas fa-info-circle text-[var(--accent-cyan)] mt-0.5 text-sm"></i>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {getUrlDesc()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleVideoSubmit}
                    disabled={(!videoFile && !videoUrl) || isVideoProcessing || !isVip}
                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                    {isVideoProcessing ? (
                        <>
                            <span className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300" style={{ width: `${videoProgress}%` }}></span>
                            <span className="relative z-10 flex items-center gap-2">
                                <i className="fas fa-circle-notch fa-spin"></i>
                                {videoStatusText || t('magicEraser.status.processing')} {Math.round(videoProgress)}%
                            </span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-wand-magic-sparkles"></i> 
                            {videoInputType === 'url' ? t('magicEraser.video.processLink') : t('magicEraser.video.process')}
                            {!isVip && <i className="fas fa-lock ml-2 text-yellow-300"></i>}
                        </>
                    )}
                </button>
            </div>

            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[400px]">
                {videoFinished && (videoFile || processedVideoUrl) ? (
                    <div className="w-full h-full flex flex-col gap-4 items-center">
                        <div className="flex flex-col items-center animate-fade-in">
                            <i className="fas fa-check-circle text-5xl text-green-500 mb-2"></i>
                            <h3 className="text-xl font-bold text-green-400">{t('magicEraser.status.success')}</h3>
                            <p className="text-sm text-[var(--text-secondary)] text-center mb-4">Video đã được làm sạch watermark.</p>
                        </div>
                        
                        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-[var(--border-color)] shadow-2xl">
                             <video 
                                src={processedVideoUrl || (videoFile ? URL.createObjectURL(videoFile) : '')} 
                                controls 
                                autoPlay 
                                className="w-full h-full" 
                             />
                        </div>

                        <button className="w-full btn-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-2 hover:bg-white/10 transition-colors">
                            <i className="fas fa-download"></i> {t('magicEraser.video.download')}
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-secondary)] opacity-50">
                        {isVideoProcessing ? (
                             <div className="flex flex-col items-center">
                                <i className="fas fa-robot text-5xl mb-6 animate-bounce text-[var(--accent-cyan)]"></i>
                                <p className="text-lg font-medium animate-pulse">{videoStatusText}</p>
                            </div>
                        ) : (
                            <>
                                <i className="fas fa-film text-6xl mb-4"></i>
                                <p className="text-lg font-medium">{t('magicEraser.image.resultTitle')}</p>
                            </>
                        )}
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
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('magicEraser.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('magicEraser.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-7xl mx-auto min-h-0 flex-1 flex flex-col">
                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-[var(--bg-component)] p-1 rounded-xl flex gap-2 border border-[var(--border-color)] shadow-lg">
                        <button
                            onClick={() => setActiveTab('image')}
                            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'image' ? 'bg-[var(--accent-cyan)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        >
                            <i className="fas fa-image"></i> {t('magicEraser.tabs.image')}
                        </button>
                        <button
                            onClick={() => setActiveTab('video')}
                            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'video' ? 'bg-[var(--accent-cyan)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-white'}`}
                        >
                            <i className="fas fa-video"></i> {t('magicEraser.tabs.video')}
                        </button>
                    </div>
                </div>

                {/* History Panel (Recent Edits) */}
                {history.length > 0 && (
                    <div className="mb-6 w-full overflow-x-auto pb-2 scrollbar-thin">
                         <div className="flex gap-4 items-center">
                            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase whitespace-nowrap px-2">{t('magicEraser.history')}</span>
                            {history.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleHistorySelect(item)}
                                    className="flex-shrink-0 w-24 h-16 bg-[var(--bg-component)] rounded-lg border border-[var(--border-color)] overflow-hidden cursor-pointer hover:border-[var(--accent-cyan)] transition-all relative group"
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.result} alt="History" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black/50">
                                            <i className="fas fa-video text-white/70 group-hover:text-white"></i>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white px-1 truncate">
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                )}

                {activeTab === 'image' ? renderImageTab() : renderVideoTab()}
            </main>
        </div>
    );
};

export default MagicEraserStudio;
