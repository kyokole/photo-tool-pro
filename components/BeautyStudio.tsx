import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { applyBeautyEffect } from '../services/geminiService';
import { BEAUTY_FEATURES } from '../constants';
import type { BeautyFeature, BeautyStyle, BeautySubFeature, BeautyHistoryItem } from '../types';

import { ImageProcessor } from './beautystudio/ImageProcessor';
import { MainToolbar } from './beautystudio/MainToolbar';
import { DetailedEditor } from './beautystudio/DetailedEditor';
import { HistoryPanel } from './beautystudio/HistoryPanel';
import { ImageToolbar } from './beautystudio/ImageToolbar';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { CameraView } from './beautystudio/CameraView';
import { dataUrlToBlob, smartDownload } from '../utils/canvasUtils';

interface BeautyStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const BeautyStudio: React.FC<BeautyStudioProps> = ({ theme, setTheme }) => {
  const { t } = useTranslation();
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<BeautyFeature | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<BeautySubFeature | null>(null);
  const [activeStyle, setActiveStyle] = useState<BeautyStyle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BeautyHistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const generateModification = async (tool?: BeautyFeature, subFeature?: BeautySubFeature, style?: BeautyStyle, baseImageOverride?: string | null) => {
    const currentTool = tool || activeTool;
    const currentSubFeature = subFeature || activeSubFeature;
    const currentStyle = style || activeStyle;
    const imageToModify = baseImageOverride || originalImage;

    if (!imageToModify) {
      setError(t('beautyStudio.error.uploadRequired'));
      return;
    }
    if (!currentTool) {
      setError(t('beautyStudio.error.toolRequired'));
      return;
    }

    if (currentTool.subFeatures && currentTool.subFeatures.length > 0) {
      if (!currentSubFeature || !currentStyle || currentStyle.id === 'none') {
        setGeneratedImage(null);
        handleClearActiveTool();
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseInstruction = "The result should be realistic, high-quality, and seamlessly blended with the original photo. Only return the modified image.";
      let prompt: string;
      const customPrompt = currentStyle?.promptInstruction || currentSubFeature?.promptInstruction || currentTool?.promptInstruction;

      if (customPrompt) {
          let finalCustomPrompt = customPrompt;
          if (currentStyle) finalCustomPrompt = finalCustomPrompt.replace('{{style}}', currentStyle.englishLabel);
          if (currentSubFeature) finalCustomPrompt = finalCustomPrompt.replace('{{sub_feature}}', currentSubFeature.englishLabel);
          if (currentTool) finalCustomPrompt = finalCustomPrompt.replace('{{tool}}', currentTool.englishLabel);
          prompt = `${finalCustomPrompt} ${baseInstruction}`;
      } else {
          let effectDescription = `a '${currentTool.englishLabel}' effect`;
          if (currentSubFeature && currentStyle && currentStyle.id !== 'none') {
              effectDescription += `, specifically for the '${currentSubFeature.englishLabel}' with the style '${currentStyle.englishLabel}'`;
          }
          prompt = `You are an expert AI photo retouching artist. The user wants to apply ${effectDescription}. ${baseInstruction}`;
      }

      const newImageDataUrl = await applyBeautyEffect(imageToModify, prompt);

      setGeneratedImage(newImageDataUrl);

      const newHistoryItem: BeautyHistoryItem = {
        id: Date.now().toString(),
        imageDataUrl: newImageDataUrl
      };
      setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
      handleClearActiveTool();

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image generation.";
      setError(t('beautyStudio.error.generationFailed', { errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleToolSelect = useCallback((tool: BeautyFeature) => {
    const imageForNextStep = generatedImage || originalImage;
    if (generatedImage) {
        setOriginalImage(generatedImage);
        setGeneratedImage(null);
    }

    if (!tool.subFeatures || tool.subFeatures.length === 0) {
        generateModification(tool, undefined, undefined, imageForNextStep);
        return;
    }

    setActiveTool(tool);
    const defaultSubFeature = tool.subFeatures[0] || null;
    setActiveSubFeature(defaultSubFeature);
   
    const stylesToConsider = defaultSubFeature?.styles || [];
    const defaultStyle = stylesToConsider?.find(s => s.id !== 'none') || stylesToConsider?.[0] || defaultSubFeature?.styles?.find(s => s.id === 'none') || null;
    setActiveStyle(defaultStyle);
  }, [originalImage, generatedImage, generateModification]);

  const handleClearActiveTool = useCallback(() => {
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, []);

  const handleConfirm = useCallback(() => {
    generateModification();
  }, [activeTool, activeSubFeature, activeStyle, originalImage, generateModification]);

  const handleImageUpload = (imageDataUrl: string) => {
    setOriginalImage(imageDataUrl);
    setGeneratedImage(null);
    setError(null);
    setHistory([]);
    handleClearActiveTool();
  };
 
  const handleBack = useCallback(() => {
    handleClearActiveTool();
  }, [handleClearActiveTool]);

  const handleUndo = useCallback(() => {
    setGeneratedImage(null);
  }, []);

  const handleSave = useCallback(async () => {
    const imageToSave = generatedImage || originalImage;
    if (!imageToSave) return;

    try {
        const blob = dataUrlToBlob(imageToSave);
        const file = new File([blob], 'beauty-plus-result.png', { type: blob.type });

        // Use Web Share API if available (modern mobile browsers)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'AI Beauty Image',
                text: 'Created with AI PHOTO SUITE.',
            });
        } else {
            // Fallback for desktops or older browsers
            smartDownload(imageToSave, 'beauty-plus-result.png');
        }
    } catch (error) {
        // Handle user cancellation of share sheet gracefully
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Save/Share failed:', error);
            // Fallback to simple download on any other error
            smartDownload(imageToSave, 'beauty-plus-result.png');
        }
    }
  }, [originalImage, generatedImage]);

  const handleChangeImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
 
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        handleImageUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHistorySelect = (item: BeautyHistoryItem) => {
    setGeneratedImage(item.imageDataUrl);
    handleClearActiveTool();
  };
 
  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans bg-[var(--bg-primary)] animate-fade-in">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        {isCameraOpen && <CameraView onCapture={(dataUrl) => { handleImageUpload(dataUrl); setIsCameraOpen(false); }} onClose={() => setIsCameraOpen(false)} />}
        <style>{`
            .title-beauty-plus { font-family: 'Exo 2', sans-serif; }
        `}</style>
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8 bg-[var(--bg-component)] rounded-xl py-6 px-4 shadow-lg border border-[var(--border-color)] flex items-center justify-between">
          <div></div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text title-beauty-plus">Beauty Plus</h1>
            <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
                {t('beautyStudio.magicMirror')}
            </p>
          </div>
          <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
        </header>

        <main className="space-y-6">
            {!originalImage ? (
                <div className="bg-[var(--bg-component)] rounded-2xl shadow-inner p-8 flex flex-col items-center justify-center min-h-[400px] border border-[var(--border-color)]">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('beautyStudio.start.title')}</h2>
                    <p className="text-[var(--text-secondary)] mb-8">{t('beautyStudio.start.subtitle')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-md">
                        <button onClick={handleChangeImageClick} className="flex flex-col items-center justify-center p-6 bg-[var(--bg-tertiary)] rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-[var(--border-color)] hover:border-[var(--accent-cyan)]">
                             <div className="text-4xl mb-3 animated-gradient-text"><i className="fas fa-upload"></i></div>
                             <span className="font-bold text-[var(--text-primary)]">{t('beautyStudio.start.uploadButton')}</span>
                             <span className="text-xs text-[var(--text-secondary)] mt-1">{t('beautyStudio.start.uploadSubtitle')}</span>
                        </button>
                        <button onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center justify-center p-6 bg-[var(--bg-tertiary)] rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-[var(--border-color)] hover:border-[var(--accent-cyan)]">
                            <div className="text-4xl mb-3 animated-gradient-text"><i className="fas fa-camera-retro"></i></div>
                            <span className="font-bold text-[var(--text-primary)]">{t('beautyStudio.start.cameraButton')}</span>
                            <span className="text-xs text-[var(--text-secondary)] mt-1">{t('beautyStudio.start.cameraSubtitle')}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <ImageToolbar
                            onBack={handleBack}
                            onUndo={handleUndo}
                            showBack={!!activeTool}
                            showUndo={!!generatedImage && !activeTool}
                        />
                        <ImageProcessor
                            originalImage={originalImage}
                            generatedImage={generatedImage}
                            onUploadClick={handleChangeImageClick}
                            isLoading={isLoading}
                            error={error}
                            onSave={handleSave}
                            canSave={!!originalImage}
                        />
                    </div>

                    <HistoryPanel
                        history={history}
                        onSelect={handleHistorySelect}
                        currentImage={generatedImage}
                        onClear={handleClearHistory}
                    />
                    
                    {activeTool ? (
                        <DetailedEditor
                            activeTool={activeTool}
                            activeSubFeature={activeSubFeature}
                            activeStyle={activeStyle}
                            onSubFeatureSelect={setActiveSubFeature}
                            onStyleSelect={setActiveStyle}
                            onConfirm={handleConfirm}
                            onCancel={handleClearActiveTool}
                        />
                    ) : (
                        <MainToolbar
                            tools={BEAUTY_FEATURES}
                            onToolSelect={handleToolSelect}
                            isDisabled={!originalImage || isLoading}
                        />
                    )}
                </>
            )}
        </main>
      </div>
    </div>
  );
};

export default BeautyStudio;