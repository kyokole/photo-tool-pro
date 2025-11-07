// components/creativestudio/VideoCreatorModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateVideoFromImage, generateVideoPrompt } from '../services/creativeStudioService';
import { Spinner } from './creativestudio/Spinner';

// FIX: Replaced inline type with a declared interface to resolve global type conflicts.
// This allows for declaration merging if `AIStudio` or `window.aistudio` is defined elsewhere.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

interface VideoCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  base64Image: string | null;
}

const FILTERS = [
    { name: 'None', value: 'none' },
    { name: 'Vintage', value: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
    { name: 'B&W', value: 'grayscale(1)' },
    { name: 'Vivid', value: 'saturate(1.8) contrast(1.2)' },
    { name: 'Cool', value: 'contrast(1.1) brightness(1.1) hue-rotate(-15deg)' },
];

export const VideoCreatorModal: React.FC<VideoCreatorModalProps> = ({ isOpen, onClose, base64Image }) => {
  const { t, i18n } = useTranslation();
  const [userIdea, setUserIdea] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [promptForApi, setPromptForApi] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  const [activeFilter, setActiveFilter] = useState('none');
  const [textOverlay, setTextOverlay] = useState({ text: t('videoCreator.editTextPlaceholder'), x: 20, y: 20, isVisible: false, isDragging: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleGeneratePrompt = async () => {
    if (!userIdea || !base64Image) return;
    setIsGeneratingPrompt(true);
    setGeneratedPrompt('');
    setPromptForApi('');
    setError(null);
    try {
        const prompts = await generateVideoPrompt(userIdea, base64Image);
        setPromptForApi(prompts.englishPrompt);
        if (i18n.language === 'vi') {
            setGeneratedPrompt(prompts.vietnamesePrompt);
        } else {
            setGeneratedPrompt(prompts.englishPrompt);
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsGeneratingPrompt(false);
    }
  };


  const handleGenerate = async () => {
    if (!base64Image || !promptForApi) return;
    
    // VEO API Key Check
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        setShowApiKeyPrompt(true);
        return;
    }
    setShowApiKeyPrompt(false);

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    
    setIsLoading(true);
    setVideoUrl(null);
    setError(null);
    setProgressMessage('');
    setActiveFilter('none');
    setTextOverlay(prev => ({ ...prev, isVisible: false }));

    try {
      const url = await generateVideoFromImage(base64Image, promptForApi, setProgressMessage);
      setVideoUrl(url);
    } catch (e: any) {
      setError(e.message || 'Đã xảy ra lỗi khi tạo video.');
      if (e.message?.includes("Requested entity was not found")) {
        setError("API Key không hợp lệ. Vui lòng chọn lại.");
        setShowApiKeyPrompt(true);
      }
      setProgressMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsLoading(false);
    setError(null);
    setProgressMessage('');
    onClose();
  };
  
  const handleExited = () => {
     setUserIdea('');
     setGeneratedPrompt('');
     setPromptForApi('');
     if (videoUrl) URL.revokeObjectURL(videoUrl);
     setVideoUrl(null);
     setActiveFilter('none');
     setTextOverlay({ text: t('videoCreator.editTextPlaceholder'), x: 20, y: 20, isVisible: false, isDragging: false });
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setTextOverlay(prev => ({ ...prev, isDragging: true }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (textOverlay.isDragging && overlayRef.current) {
      const parentRect = overlayRef.current.parentElement!.getBoundingClientRect();
      setTextOverlay(prev => ({
        ...prev,
        x: Math.max(0, Math.min(parentRect.width - overlayRef.current!.offsetWidth, prev.x + e.movementX)),
        y: Math.max(0, Math.min(parentRect.height - overlayRef.current!.offsetHeight, prev.y + e.movementY)),
      }));
    }
  };

  const handleMouseUp = () => {
    setTextOverlay(prev => ({ ...prev, isDragging: false }));
  };

  if (!isOpen) return null;

  const renderVideoResult = () => (
    <div className="bg-[var(--bg-interactive)] p-4 rounded-lg text-center space-y-4">
        {isLoading && (
            <>
                <Spinner />
                <p className="mt-2 text-sm text-[var(--accent-text-start)] animate-pulse">{progressMessage || "Đang chuẩn bị..."}</p>
            </>
        )}
        {videoUrl && !isLoading && (
             <div className="space-y-4">
                 <p className="text-green-400 font-semibold">{t('videoCreator.success')}</p>
                <div 
                    className="relative w-full mx-auto"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <video ref={videoRef} src={videoUrl} controls autoPlay loop className="w-full rounded-lg max-h-72" style={{ filter: activeFilter }} />
                    {textOverlay.isVisible && (
                        <div
                            ref={overlayRef}
                            className="absolute p-2 text-white font-bold text-lg cursor-move select-none"
                            style={{ 
                                left: `${textOverlay.x}px`, 
                                top: `${textOverlay.y}px`,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                            }}
                            onMouseDown={handleMouseDown}
                            onDoubleClick={() => {
                                const newText = prompt(t('videoCreator.editTextPrompt'), textOverlay.text);
                                if (newText !== null) {
                                    setTextOverlay(prev => ({ ...prev, text: newText }));
                                }
                            }}
                        >
                            {textOverlay.text}
                        </div>
                    )}
                </div>
                 <div className="bg-[var(--bg-primary)] p-3 rounded-lg space-y-3">
                     <h4 className="font-semibold text-sm text-left text-[var(--text-secondary)]">{t('videoCreator.editTools')}</h4>
                     <div className="flex flex-wrap gap-2">
                        {FILTERS.map(f => (
                            <button key={f.name} onClick={() => setActiveFilter(f.value)} className={`px-3 py-1 text-xs rounded-full ${activeFilter === f.value ? 'btn-gradient text-white' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'}`}>
                                {f.name}
                            </button>
                        ))}
                     </div>
                     <div className="flex items-center gap-2">
                         <button onClick={() => setTextOverlay(p => ({ ...p, isVisible: !p.isVisible }))} className="px-3 py-1 text-xs rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]">
                           {textOverlay.isVisible ? t('videoCreator.hideText') : t('videoCreator.addText')}
                         </button>
                         <p className="text-xs text-[var(--text-muted)]">{t('videoCreator.textHelp')}</p>
                     </div>
                     <p className="text-xs text-amber-400/80 text-center pt-2 border-t border-[var(--border-color)]">{t('videoCreator.editNotice')}</p>
                 </div>
             </div>
        )}
        {error && !isLoading && (
             <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-left" role="alert">
                <strong className="font-bold">{t('common.error')}: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
         {showApiKeyPrompt && (
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg text-left" role="alert">
                <strong className="font-bold">{t('videoCreator.apiKeySelect.title')}</strong>
                <p>{t('videoCreator.apiKeySelect.description')} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">{t('videoCreator.apiKeySelect.docs')}</a>.</p>
                <button onClick={async () => {
                    if (window.aistudio) {
                        await window.aistudio.openSelectKey();
                        setShowApiKeyPrompt(false);
                        await handleGenerate();
                    }
                }} className="mt-2 btn-gradient text-white font-bold py-1 px-3 rounded-md">
                    {t('videoCreator.apiKeySelect.button')}
                </button>
            </div>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onAnimationEnd={handleExited}>
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] w-full max-w-4xl text-[var(--text-primary)] relative flex flex-col max-h-[90vh]">
        <button onClick={handleClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] z-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[var(--accent-text-start)] to-[var(--accent-text-end)] text-transparent bg-clip-text">
          {t('videoCreator.title')}
        </h2>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-4 items-center">
                    <p className="text-sm text-[var(--text-secondary)]">{t('videoCreator.sourceImage')}</p>
                    {base64Image && <img src={`data:image/png;base64,${base64Image}`} alt="Nguồn video" className="rounded-lg w-full object-contain max-h-64"/>}
                </div>

                <div className="flex flex-col space-y-4">
                    <div>
                        <label htmlFor="video-idea" className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">{t('videoCreator.step1')}</label>
                        <textarea id="video-idea" value={userIdea} onChange={(e) => setUserIdea(e.target.value)} placeholder={t('videoCreator.ideaPlaceholder')} rows={4} className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 resize-none"/>
                    </div>
                     <button
                        onClick={handleGeneratePrompt}
                        disabled={isGeneratingPrompt || !userIdea}
                        className="w-full bg-[var(--button-secondary)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {isGeneratingPrompt ? <Spinner/> : '✨'}
                         <span className={isGeneratingPrompt ? 'ml-2' : ''}>{isGeneratingPrompt ? t('videoCreator.generatingPrompt') : t('videoCreator.generatePromptButton')}</span>
                    </button>
                </div>
            </div>

             <div>
                <label htmlFor="generated-prompt" className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">{t('videoCreator.step2')}</label>
                <textarea id="generated-prompt" value={generatedPrompt} onChange={(e) => setGeneratedPrompt(e.target.value)} placeholder={t('videoCreator.promptPlaceholder')} rows={4} className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 resize-none font-mono text-sm"/>
             </div>

             <div className="w-full">
                {(isLoading || videoUrl || error || showApiKeyPrompt) && renderVideoResult()}
            </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end">
            <button
                onClick={handleGenerate}
                disabled={isLoading || !promptForApi}
                className="btn-gradient text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
            >
                {isLoading && <Spinner />}
                <span className={isLoading ? 'ml-2' : ''}>
                    {isLoading ? t('videoCreator.creatingVideo') : t('videoCreator.step3')}
                </span>
            </button>
        </div>
      </div>
    </div>
  );
};