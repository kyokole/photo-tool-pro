import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { BeautyFeature, BeautyStyle, BeautySubFeature, BeautyHistoryItem } from '../types';
import { BEAUTY_FEATURES } from '../constants/beautyStudioConstants';
import { generateBeautyPhoto } from '../services/geminiService';
import { applyWatermark, dataUrlToBlob } from '../utils/canvasUtils';

import { BeautyStudioImageProcessor } from './beautystudio/BeautyStudioImageProcessor';
import { BeautyStudioMainToolbar } from './beautystudio/BeautyStudioMainToolbar';
import { DetailedEditor } from './beautystudio/DetailedEditor';
import { BeautyStudioHistoryPanel } from './beautystudio/BeautyStudioHistoryPanel';
import { ImageToolbar } from './beautystudio/ImageToolbar';

interface BeautyStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

const BeautyStudio: React.FC<BeautyStudioProps> = ({ theme, setTheme, isVip }) => {
  const { t } = useTranslation();
  const [currentBaseImage, setCurrentBaseImage] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<string | null>(null);
 
  const [activeTool, setActiveTool] = useState<BeautyFeature | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<BeautySubFeature | null>(null);
  const [activeStyle, setActiveStyle] = useState<BeautyStyle | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<BeautyHistoryItem[]>([]);
 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateModification = useCallback(async (toolOverride?: BeautyFeature, subFeatureOverride?: BeautySubFeature, styleOverride?: BeautyStyle) => {
    const currentTool = toolOverride || activeTool;
    const currentSubFeature = subFeatureOverride || activeSubFeature;
    const currentStyle = styleOverride || activeStyle;
    const imageToModify = activeResult || currentBaseImage;

    if (!imageToModify) {
      setError(t('errors.uploadRequired'));
      return;
    }
    if (!currentTool) {
      setError("Vui lòng chọn một công cụ.");
      return;
    }

    if (currentTool.subFeatures && currentTool.subFeatures.length > 0) {
      if (!currentSubFeature || !currentStyle || currentStyle.id === 'none') {
        // This case is handled by disabling the button now, but we keep this for safety
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const imageDataFromServer = await generateBeautyPhoto(
        imageToModify,
        currentTool,
        currentSubFeature,
        currentStyle
      );
      
      const newImageDataUrl = !isVip ? await applyWatermark(imageDataFromServer) : imageDataFromServer;

      if (!toolOverride) { // This is a preview generation
        setActiveResult(newImageDataUrl);
      } else { // This is a single-click action, so apply directly
        const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: newImageDataUrl };
        setHistory(prev => [newHistoryItem, ...prev]);
        setCurrentBaseImage(newImageDataUrl);
        setActiveResult(null);
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : t('errors.unknownError');
      setError(t('errors.beautyGenerationFailed', { error: errorMessage }));
      setActiveResult(null); // Clear result on error
    } finally {
      setIsLoading(false);
    }
  }, [activeTool, activeSubFeature, activeStyle, activeResult, currentBaseImage, isVip, t]);
 
  const handleToolSelect = useCallback((tool: BeautyFeature) => {
    if (activeResult) {
      const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: activeResult };
      setHistory(prev => [newHistoryItem, ...prev]);
      setCurrentBaseImage(activeResult);
      setActiveResult(null);
    }
    
    if (!tool.subFeatures || tool.subFeatures.length === 0) {
        generateModification(tool, undefined, undefined);
        return;
    }

    setActiveTool(tool);
    const defaultSubFeature = tool.subFeatures[0] || null;
    setActiveSubFeature(defaultSubFeature);
    const noneStyle = defaultSubFeature?.styles?.find(s => s.id === 'none') || null;
    setActiveStyle(noneStyle);

  }, [activeResult, generateModification]);

  const handleStyleSelect = useCallback((style: BeautyStyle) => {
      setActiveStyle(style);
      // When user selects a new style, clear the previous preview
      // to ensure the confirm button is disabled until a new preview is generated.
      setActiveResult(null);
  }, []);

  const handleCancel = useCallback(() => {
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
    setActiveResult(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (activeResult) {
        const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: activeResult };
        setHistory(prev => [newHistoryItem, ...prev]);
        setCurrentBaseImage(activeResult);
    }
    setActiveResult(null);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, [activeResult]);

  const handleImageUpload = (imageDataUrl: string) => {
    const initialHistoryItem: BeautyHistoryItem = { id: 'original', imageDataUrl };
    setCurrentBaseImage(imageDataUrl);
    setActiveResult(null);
    setError(null);
    setHistory([initialHistoryItem]);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  };
 
  const handleBackToMainToolbar = useCallback(() => {
    setActiveResult(null);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (activeResult) {
        setActiveResult(null);
    } else if (history.length > 1) {
        const newHistory = history.slice(1);
        setCurrentBaseImage(newHistory[0].imageDataUrl);
        setHistory(newHistory);
    }
  }, [activeResult, history]);

  const handleSave = useCallback(async () => {
    const imageToSave = activeResult || currentBaseImage;
    if (!imageToSave) return;

    try {
        const blob = dataUrlToBlob(imageToSave);
        const file = new File([blob], 'beauty-studio-result.png', { type: 'image/png' });
        
        if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
            await navigator.share({
                files: [file],
                title: 'Beauty Studio Result',
                text: 'Created with AI PHOTO SUITE',
            });
        } else {
            const link = document.createElement('a');
            link.href = imageToSave;
            link.download = 'beauty-studio-result.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (err) {
        console.error('Error saving or sharing file:', err);
        if (err instanceof Error && err.name !== 'AbortError') {
            const link = document.createElement('a');
            link.href = imageToSave;
            link.download = 'beauty-studio-result.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
  }, [currentBaseImage, activeResult]);

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
    setCurrentBaseImage(item.imageDataUrl);
    setActiveResult(null);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);

    const itemIndex = history.findIndex(h => h.id === item.id);
    if (itemIndex > -1) {
        setHistory(prev => prev.slice(itemIndex));
    }
  };
 
  const handleClearHistory = useCallback(() => {
    if (history.length > 0) {
      const originalItem = history[history.length - 1];
      setCurrentBaseImage(originalItem.imageDataUrl);
      setHistory([originalItem]);
      setActiveResult(null);
    }
  }, [history]);

  return (
    <div className="flex-1 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans animate-fade-in">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('beautyStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('beautyStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>

            <main className="space-y-6">
                <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                
                    {currentBaseImage && (
                        <ImageToolbar
                            onBack={handleBackToMainToolbar}
                            onUndo={handleUndo}
                            showBack={!!activeTool}
                            showUndo={!!activeResult || history.length > 1}
                        />
                    )}
                
                    <BeautyStudioImageProcessor
                        originalImage={currentBaseImage}
                        generatedImage={activeResult}
                        onUploadClick={handleChangeImageClick}
                        isLoading={isLoading}
                        error={error}
                        onSave={handleSave}
                        canSave={!!currentBaseImage}
                    />
                </div>

                {error && (
                    <div className="bg-red-900/50 text-red-300 text-center p-3 rounded-md border border-red-500/50">
                        <strong>{t('common.error')}:</strong> {error}
                    </div>
                )}
                
                {activeTool ? (
                    <DetailedEditor
                        activeTool={activeTool}
                        activeSubFeature={activeSubFeature}
                        activeStyle={activeStyle}
                        onSubFeatureSelect={setActiveSubFeature}
                        onStyleSelect={handleStyleSelect}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                        onGenerate={() => generateModification()}
                        isLoading={isLoading}
                        hasPreview={!!activeResult}
                    />
                ) : (
                    <BeautyStudioMainToolbar
                        tools={BEAUTY_FEATURES}
                        onToolSelect={handleToolSelect}
                        isDisabled={!currentBaseImage || isLoading}
                    />
                )}

                {history.length > 1 && (
                    <BeautyStudioHistoryPanel
                        history={history}
                        onSelect={handleHistorySelect}
                        currentImage={activeResult || currentBaseImage}
                        onClear={handleClearHistory}
                    />
                )}
            </main>
        </div>
    </div>
  );
};

export default BeautyStudio;