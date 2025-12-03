
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
    original: string;
    result: string;
    timestamp: number;
    name: string;
    prompt?: string;
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

const ProcessingBar: React.FC<{ progress: number; stage: string }> = ({ progress, stage }) => (
    <div className="w-full max-w-md mx-auto mt-6">
        <div className="flex justify-between text-xs font-mono text-blue-400 mb-2 uppercase tracking-wider">
            <span>{stage}</span>
            <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        <p className="text-center text-gray-500 text-xs mt-2 italic">Thời gian ước tính: 1-2 phút</p>
    </div>
);

const MagicEraserStudio: React.FC<MagicEraserStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
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
    const [videoSource, setVideoSource] = useState<'general' | 'veo' | 'sora'>('sora'); // Default to Sora
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoStage, setVideoStage] = useState('');
    const [videoFinished, setVideoFinished] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
    const [extractedPrompt, setExtractedPrompt] = useState<string>('');
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoLoadError, setVideoLoadError] = useState(false);


    useEffect(() => {
        if (!activeTab) setActiveTab('image');
    }, []);

    const addToHistory = (item: EraserHistoryItem) => {
        setHistory(prev => [item, ...prev]);
    };

    // Image Handlers
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
            setImageError(msg);
        } finally {
            setIsImageProcessing(false);
        }
    };

    // Video Handlers
    const simulateProgress = async () => {
        // Updated stages for "Deep Extraction" method
        const stages = [
            { p: 10, t: "Kết nối máy chủ..." },
            { p: 30, t: "Quét dữ liệu Hydration (JSON)..." },
            { p: 50, t: "Tìm kiếm nguồn Video sạch..." },
            { p: 70, t: "Xác thực đường dẫn..." },
            { p: 90, t: "Đang tải về máy chủ trung gian..." }
        ];

        for (const stage of stages) {
            if (videoFinished || videoError) break; 
            setVideoStage(stage.t);
            const startP = videoProgress;
            const endP = stage.p;
            const stepCount = 20;
            const duration = 1500 + Math.random() * 2000; // Slightly faster feedback
            
            for (let i = 0; i <= stepCount; i++) {
                if (videoFinished || videoError) return; // Break inner loop
                setVideoProgress(startP + (endP - startP) * (i / stepCount));
                await new Promise(r => setTimeout(r, duration / stepCount));
            }
        }
    };

    const handleVideoSubmit = async () => {
        if (!videoUrl) return;

        setIsVideoProcessing(true);
        setVideoProgress(0);
        setVideoStage("Khởi tạo...");
        setVideoFinished(false);
        setProcessedVideoUrl(null);
        setExtractedPrompt('');
        setVideoError(null);
        setVideoLoadError(false);

        // Start progress simulation
        simulateProgress();

        try {
            const payload = { url: videoUrl, type: videoSource };
            const response = await removeVideoWatermark(payload, videoSource) as any; // Type cast for prompt
            
            setVideoProgress(100);
            setVideoStage("Hoàn tất!");

            if (!response.videoUrl) throw new Error("Không nhận được đường dẫn video.");
            
            let finalUrl = response.videoUrl;
            if (finalUrl.includes('&amp;')) finalUrl = finalUrl.replace(/&amp;/g, '&');
            
            setProcessedVideoUrl(finalUrl);
            setExtractedPrompt(response.prompt || '');
            setVideoFinished(true);

            addToHistory({
                id: Date.now().toString(),
                type: 'video',
                original: videoUrl,
                result: finalUrl,
                timestamp: Date.now(),
                name: 'Extracted Video',
                prompt: response.prompt
            });

        } catch (e: any) {
            setVideoProgress(0);
            setVideoStage("Lỗi");
            const msg = e.message || t('magicEraser.errors.videoFailed');
            setVideoError(msg);
        } finally {
            setIsVideoProcessing(false);
        }
    };
    
    const handleVideoDownload = () => {
        if(processedVideoUrl) {
            // Format: AIPhotoSuite_video_[timestamp].mp4
            const filename = `AIPhotoSuite_video_${Date.now()}.mp4`;
            smartDownload(processedVideoUrl, filename);
        }
    };

    const copyPrompt = () => {
        if (extractedPrompt) {
            navigator.clipboard.writeText(extractedPrompt);
            alert("Đã sao chép Prompt!");
        }
    }

    // UI Renders
    const renderImageTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {!isVip && <VipLockOverlay t={t} />}
            <div className="space-y-6">
                <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] relative overflow-hidden">
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
                {imageError && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center text-sm">{imageError}</div>}
            </div>
            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                {processedImage && imageFile ? (
                    <div className="w-full h-full flex flex-col gap-4 animate-fade-in">
                        <div className="flex-1 relative rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-deep-space)]">
                            <BeforeAfterSlider before={URL.createObjectURL(imageFile)} after={processedImage} />
                        </div>
                        <button onClick={() => smartDownload(processedImage!, `cleaned-image-${Date.now()}.png`)} className="w-full btn-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            <i className="fas fa-download"></i> {t('magicEraser.image.download')}
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-secondary)] opacity-50">
                        <i className="fas fa-image text-6xl mb-4"></i>
                        <p className="text-lg font-medium">{t('magicEraser.image.resultTitle')}</p>
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

                <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)]">
                    <div className="flex flex-col justify-center space-y-4">
                         <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('magicEraser.video.inputType.url')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-link text-[var(--accent-cyan)]"></i>
                            </div>
                            <input 
                                type="text" 
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder={videoSource === 'sora' ? t('magicEraser.video.placeholders.sora') : t('magicEraser.video.placeholders.general')}
                                className="w-full pl-10 pr-4 py-3.5 bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all text-sm shadow-inner"
                            />
                        </div>
                         {/* Logo AIPhotoSuite style visual hint */}
                         <div className="flex items-center gap-2 bg-black/30 p-2 rounded text-xs text-gray-400">
                             <i className="fas fa-info-circle"></i>
                             <span>Phương pháp mới: Quét dữ liệu ẩn (Hydration Data) để tìm file gốc sạch nhất.</span>
                         </div>
                    </div>
                </div>

                <button 
                    onClick={handleVideoSubmit}
                    disabled={!videoUrl || isVideoProcessing || !isVip}
                    className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                     <i className="fas fa-search"></i> 
                     {t('magicEraser.video.processLink')}
                </button>

                {videoError && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center text-sm animate-fade-in">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {videoError}
                    </div>
                )}
            </div>

            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col items-center justify-center min-h-[400px]">
                {isVideoProcessing ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                         <div className="mb-6">
                             <i className="fas fa-cloud-download-alt text-5xl text-[var(--accent-cyan)] animate-bounce"></i>
                         </div>
                         <h3 className="text-xl font-bold mb-2">Đang xử lý chuyên sâu...</h3>
                         <ProcessingBar progress={videoProgress} stage={videoStage} />
                         <p className="text-xs text-gray-400 mt-6 max-w-xs text-center leading-relaxed">
                             Đang truy tìm các đoạn video ẩn trong mã nguồn trang web. Vui lòng chờ...
                         </p>
                    </div>
                ) : videoFinished && processedVideoUrl ? (
                    <div className="w-full h-full flex flex-col gap-4 animate-fade-in w-full">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="bg-green-500 rounded-full p-2">
                                <i className="fas fa-check text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-green-400">{t('magicEraser.status.success')}</h3>
                                <p className="text-xs text-gray-400">Đã tìm thấy file gốc chất lượng cao!</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 w-full h-full">
                            {/* Video Player */}
                            <div className="bg-black rounded-lg overflow-hidden border border-[var(--border-color)] shadow-2xl relative group aspect-video flex items-center justify-center">
                                 <video 
                                    src={processedVideoUrl} 
                                    controls 
                                    autoPlay 
                                    playsInline
                                    className="w-full h-full max-h-[400px]"
                                    onError={() => setVideoLoadError(true)}
                                 />
                                 {videoLoadError && (
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 text-center p-6 z-20">
                                         <p className="text-xs"><i className="fas fa-lightbulb text-yellow-400 mr-1"></i> Video gốc từ Sora/Veo thường dùng codec AV1/HEVC. Nếu trình duyệt không phát được hình, vui lòng tải về.</p>
                                     </div>
                                 )}
                            </div>

                            {/* Info Panel (Right Side like Screenshot) */}
                            <div className="flex flex-col gap-3">
                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <h4 className="font-bold text-white mb-3 border-b border-white/10 pb-2">Tải xuống</h4>
                                    
                                    {/* SINGLE DOWNLOAD BUTTON - AS REQUESTED */}
                                    <button onClick={handleVideoDownload} className="w-full btn-gradient text-white font-bold py-4 rounded-lg mb-2 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform text-sm">
                                        <i className="fas fa-download"></i> {t('magicEraser.video.download')}
                                    </button>
                                </div>

                                {extractedPrompt && (
                                    <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-color)] flex-1 overflow-hidden flex flex-col">
                                        <h4 className="font-bold text-white mb-2">ai prompt</h4>
                                        <div className="bg-black/40 p-2 rounded text-xs text-gray-300 overflow-y-auto custom-scrollbar flex-1 mb-2">
                                            {extractedPrompt}
                                        </div>
                                        <button onClick={copyPrompt} className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                                            <i className="fas fa-copy"></i> Sao chép ai prompt
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-secondary)] opacity-50">
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
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('magicEraser.title')}
                    </h1>
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
