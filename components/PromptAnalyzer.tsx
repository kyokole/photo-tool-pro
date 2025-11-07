import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePromptFromImage } from '../services/promptAnalyzerService';
import { fileToBase64 } from '../utils/fileUtils';
import { SparklesIcon, InfoIcon, CopyIcon, CheckIcon, XIcon } from './icons';
import { ThemeSelector } from './creativestudio/ThemeSelector';

// Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[var(--bg-component)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-[var(--border-color)]" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors"><XIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto scrollbar-thin">{children}</main>
            </div>
        </div>
    );
};

interface PromptAnalyzerProps {
    theme: string;
    setTheme: (theme: string) => void;
    onUseInStudio: (image: File, prompt: string) => void;
}


// Main Component
const PromptAnalyzer: React.FC<PromptAnalyzerProps> = ({ theme, setTheme, onUseInStudio }) => {
    const { t, i18n } = useTranslation();
    const [image, setImage] = useState<{ file: File; url: string } | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isInstructionModalOpen, setInstructionModalOpen] = useState<boolean>(false);
    const [isFaceLockEnabled, setFaceLockEnabled] = useState<boolean>(true);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (file: File) => {
        const url = URL.createObjectURL(file);
        setImage({ file, url });
        setPrompt('');
        setError(null);
    };
    
    const handleGeneratePrompt = useCallback(async () => {
        if (!image) {
            setError(t('promptAnalyzer.error.uploadRequired'));
            return;
        }
        setIsLoading(true);
        setPrompt('');
        setError(null);
        try {
            const { base64, mimeType } = await fileToBase64(image.file);
            let generatedPrompt = await generatePromptFromImage(base64, mimeType, isFaceLockEnabled, i18n.language);
            if (isFaceLockEnabled) {
                generatedPrompt = t('promptAnalyzer.faceLockPrefix') + generatedPrompt;
            }
            setPrompt(generatedPrompt);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : t('promptAnalyzer.error.unknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [image, isFaceLockEnabled, t, i18n.language]);

    const handleCopy = () => {
        if (prompt) {
            navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const handleUseInStudioClick = () => {
        if (image && prompt) {
            onUseInStudio(image.file, prompt);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center animate-fade-in h-full px-4 sm:px-6 lg:p-8">
            <header className="w-full max-w-6xl grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-4 sm:pt-6 lg:pt-0 pb-2">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('promptAnalyzer.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('promptAnalyzer.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                {/* Left Panel: Upload */}
                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-semibold border-b border-[var(--border-color)] pb-2">{t('promptAnalyzer.uploadTitle')}</h2>
                    <ImageUploaderComponent onImageUpload={handleImageUpload} imageUrl={image?.url} fileInputRef={fileInputRef} />
                </div>

                {/* Right Panel: Generate & Display */}
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{t('promptAnalyzer.generatedTitle')}</h2>
                            <button onClick={() => setInstructionModalOpen(true)} className="hover:text-[var(--accent-cyan)] transition-colors" aria-label={t('promptAnalyzer.howToUse.title')}>
                                <InfoIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <button onClick={handleGeneratePrompt} disabled={!image || isLoading} className="flex items-center justify-center px-4 py-2 btn-gradient text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? t('promptAnalyzer.generatingButton') : t('promptAnalyzer.generateButton')}
                        </button>
                    </div>
                    
                    <div className="bg-[var(--bg-component)] border border-[var(--border-color)] rounded-xl flex-grow h-96 flex flex-col">
                        <div className="p-4 flex-grow overflow-y-auto scrollbar-thin">
                            {isLoading && <LoadingSkeleton />}
                            {error && <p className="text-red-400">{error}</p>}
                            {!isLoading && !error && (prompt ? <p className="whitespace-pre-wrap">{prompt}</p> : <p className="text-[var(--text-muted)]">{t('promptAnalyzer.placeholder')}</p>)}
                        </div>
                        {prompt && !isLoading && !error && (
                            <div className="p-3 border-t border-[var(--border-color)] bg-black/20 grid grid-cols-2 gap-2">
                                <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--button-secondary)] hover:opacity-90 text-white font-semibold rounded-lg shadow-md transition-all duration-300">
                                    {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                    {copied ? t('promptAnalyzer.copiedButton') : t('promptAnalyzer.copyButton')}
                                </button>
                                <button onClick={handleUseInStudioClick} className="w-full flex items-center justify-center gap-2 px-4 py-2 btn-gradient text-white font-semibold rounded-lg shadow-md transition-all duration-300">
                                    <i className="fas fa-wand-magic-sparkles w-5 h-5"></i>
                                    {t('promptAnalyzer.useInStudio')}
                                </button>
                            </div>
                        )}
                    </div>

                     <div className="flex items-start space-x-3 p-3 rounded-lg bg-black/20 border border-[var(--border-color)]">
                        <input id="faceLock" type="checkbox" checked={isFaceLockEnabled} onChange={e => setFaceLockEnabled(e.target.checked)} className="form-checkbox mt-1" />
                        <div>
                            <label htmlFor="faceLock" className="font-semibold text-white">{t('promptAnalyzer.faceLockLabel')}</label>
                            <p className="text-sm text-[var(--text-secondary)]">{t('promptAnalyzer.faceLockDescription')}</p>
                        </div>
                    </div>
                </div>
            </main>

            <Modal isOpen={isInstructionModalOpen} onClose={() => setInstructionModalOpen(false)} title={t('promptAnalyzer.howToUse.title')}>
                <div className="space-y-6">
                    <div className="border-l-4 border-cyan-500/50 pl-4 py-2 bg-black/30 rounded-r-md">
                        <h4 className="font-semibold text-cyan-400">{t('promptAnalyzer.howToUse.step1Title')}</h4>
                        <p className="text-sm whitespace-pre-wrap text-gray-300 mt-1">
                            {t('promptAnalyzer.howToUse.step1Content')}
                        </p>
                    </div>

                    <div className="border-l-4 border-purple-500/50 pl-4 py-2 bg-black/30 rounded-r-md">
                        <h4 className="font-semibold text-purple-400">{t('promptAnalyzer.howToUse.step2Title')}</h4>
                        <p 
                            className="text-sm whitespace-pre-wrap text-gray-300 mt-1"
                            dangerouslySetInnerHTML={{ __html: t('promptAnalyzer.howToUse.step2Content') as string }}
                        >
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Sub-components
const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-700 rounded" style={{ width: `${Math.random() * 50 + 50}%` }}></div>)}
    </div>
);

const ImageUploaderComponent: React.FC<{ onImageUpload: (file: File) => void; imageUrl: string | null | undefined; fileInputRef: React.RefObject<HTMLInputElement>}> = ({ onImageUpload, imageUrl, fileInputRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const { t } = useTranslation();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onImageUpload(file);
    };
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); const file = event.dataTransfer.files?.[0]; if (file && file.type.startsWith('image/')) onImageUpload(file); };
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, state: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragging(state); };

    return (
        <div className={`relative group bg-[var(--bg-component)] border-2 border-dashed rounded-xl p-4 transition-all duration-300 h-96 flex flex-col items-center justify-center ${isDragging ? 'border-[var(--accent-cyan)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] hover:border-[var(--accent-cyan)]'} ${!imageUrl ? 'cursor-pointer' : ''}`} 
            onDrop={handleDrop} 
            onDragOver={(e) => handleDragEvents(e, true)} 
            onDragEnter={(e) => handleDragEvents(e, true)} 
            onDragLeave={(e) => handleDragEvents(e, false)}
            onClick={() => !imageUrl && fileInputRef.current?.click()}
        >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {imageUrl ? (
                <>
                    <img src={imageUrl} alt="Uploaded preview" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-semibold">{t('imagePanes.changeImage')}</button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                    <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                        <i className="fas fa-upload mr-2"></i> {t('imagePanes.uploadButton')}
                    </div>
                    <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('common.uploadPrompt')}</p>
                </div>
            )}
            {isDragging && !imageUrl && (
                <div className="absolute inset-0 bg-[var(--accent-blue)]/10 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
                    <p className="text-white font-bold text-lg">{t('imagePanes.dropToUpload')}</p>
                </div>
            )}
        </div>
    );
};

export default PromptAnalyzer;