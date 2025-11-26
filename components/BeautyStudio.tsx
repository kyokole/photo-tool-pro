
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
  const [originalUpload, setOriginalUpload] = useState<string | null>(null);
  const [currentBaseImage, setCurrentBaseImage] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);
 
  const [activeTool, setActiveTool] = useState<BeautyFeature | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<BeautySubFeature | null>(null);
  const [activeStyle, setActiveStyle] = useState<BeautyStyle | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHighQuality, setIsHighQuality] = useState(false); // New state

  const [history, setHistory] = useState<BeautyHistoryItem[]>([]);
 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateModification = useCallback(async (tool: BeautyFeature, subFeature: BeautySubFeature | null, style: BeautyStyle | null, isSingleClickAction: boolean = false) => {
    const imageToModify = activePreview || currentBaseImage;

    if (!imageToModify) {
      setError(t('errors.uploadRequired'));
      return;
    }
    if (!tool) {
      setError("Vui lòng chọn một công cụ.");
      return;
    }
    
    // For tools with sub-features, ensure a style is selected
    if (tool.subFeatures && (!subFeature || !style || style.id === 'none')) {
      return; // Do nothing if no specific style is chosen for a complex tool
    }

    setIsLoading(true);
    setError(null);

    // Temporarily attach highQuality to payload style or tool, 
    // or update generateBeautyPhoto signature.
    // Since I am modifying everything, I'll assume the service will be updated (it is in api/gemini.ts which reads payload)
    // But I need to pass it. `generateBeautyPhoto` takes specific args.
    // I will overload `generateBeautyPhoto` or attach quality to one of the objects.
    // Let's attach it to the 'style' object for transport if simpler, 
    // OR better: modify the service call in geminiService.ts? No, that file wasn't fully requested to be changed but I can change it.
    // Actually, `generateBeautyPhoto` signature in `services/geminiService.ts` takes specific arguments.
    // I will modify `services/geminiService.ts` as well to accept an options object or just piggyback.
    
    // Strategy: Piggyback on `style` object which is passed to backend.
    const styleWithQuality = style ? { ...style, highQuality: isHighQuality } : { highQuality: isHighQuality } as any;
    const toolWithQuality = { ...tool, highQuality: isHighQuality }; // For single click actions

    try {
      const imageDataFromServer = await generateBeautyPhoto(
        imageToModify,
        toolWithQuality,
        subFeature,
        styleWithQuality
      );
      
      const newImageDataUrl = !isVip ? await applyWatermark(imageDataFromServer) : imageDataFromServer;

      if (isSingleClickAction) {
        const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: newImageDataUrl };
        setHistory(prev => [...prev, newHistoryItem]);
        setCurrentBaseImage(newImageDataUrl);
        setActivePreview(null);
      } else {
        setActivePreview(newImageDataUrl);
      }

    } catch (e) {
      console.error(e);
      const errorString = String(e);
      if (errorString.includes('FUNCTION_INVOCATION_TIMEOUT') || errorString.includes('504')) {
          setError(t('errors.timeout'));
      } else {
          const errorMessage = e instanceof Error ? e.message : t('errors.unknownError');
          setError(t('errors.beautyGenerationFailed', { error: errorMessage }));
      }
      setActivePreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [activePreview, currentBaseImage, isVip, t, isHighQuality]);
 
  const handleToolSelect = useCallback((tool: BeautyFeature) => {
    if (activePreview) {
      const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: activePreview };
      setHistory(prev => [...prev, newHistoryItem]);
      setCurrentBaseImage(activePreview);
      setActivePreview(null);
    }
    
    if (!tool.subFeatures || tool.subFeatures.length === 0) {
        generateModification(tool, null, null, true);
        return;
    }

    setActiveTool(tool);
    const defaultSubFeature = tool.subFeatures[0] || null;
    setActiveSubFeature(defaultSubFeature);
    const noneStyle = defaultSubFeature?.styles?.find(s => s.id === 'none') || null;
    setActiveStyle(noneStyle);

  }, [activePreview, generateModification]);

  const handleStyleSelect = useCallback((style: BeautyStyle, subFeature: BeautySubFeature, tool: BeautyFeature) => {
      setActiveStyle(style);
      setActivePreview(null); // Clear old preview
      if (style.id !== 'none') {
        generateModification(tool, subFeature, style);
      }
  }, [generateModification]);

  const handleCancel = useCallback(() => {
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
    setActivePreview(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (activePreview) {
        const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: activePreview };
        setHistory(prev => [...prev, newHistoryItem]);
        setCurrentBaseImage(activePreview);
    }
    setActivePreview(null);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, [activePreview]);

  const handleImageUpload = (imageDataUrl: string) => {
    const initialHistoryItem: BeautyHistoryItem = { id: 'original', imageDataUrl };
    setOriginalUpload(imageDataUrl);
    setCurrentBaseImage(imageDataUrl);
    setActivePreview(null);
    setError(null);
    setHistory([initialHistoryItem]);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  };
 
  const handleBackToMainToolbar = useCallback(() => {
    setActivePreview(null);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (activePreview) {
        setActivePreview(null);
    } else if (history.length > 1) {
        const newHistory = history.slice(0, -1);
        setCurrentBaseImage(newHistory[newHistory.length - 1].imageDataUrl);
        setHistory(newHistory);
    }
  }, [activePreview, history]);

  const handleSave = useCallback(async () => {
    const imageToSave = activePreview || currentBaseImage;
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
  }, [currentBaseImage, activePreview]);

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
    setActivePreview(null);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);

    const itemIndex = history.findIndex(h => h.id === item.id);
    if (itemIndex > -1) {
        setHistory(prev => prev.slice(0, itemIndex + 1));
    }
  };
 
  const handleClearHistory = useCallback(() => {
    if (history.length > 0) {
      const originalItem = history[0];
      setCurrentBaseImage(originalItem.imageDataUrl);
      setHistory([originalItem]);
      setActivePreview(null);
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

            <main className={`space-y-6 ${activeTool ? 'pb-[280px] sm:pb-[250px]' : (history.length > 1 ? 'pb-32' : '')}`}>
                <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                
                    {currentBaseImage && (
                        <ImageToolbar
                            onBack={handleBackToMainToolbar}
                            onUndo={handleUndo}
                            showBack={!!activeTool}
                            showUndo={!!activePreview || history.length > 1}
                        />
                    )}
                
                    <BeautyStudioImageProcessor
                        originalUpload={originalUpload}
                        currentImage={currentBaseImage}
                        previewImage={activePreview}
                        onUploadClick={handleChangeImageClick}
                        isLoading={isLoading}
                        error={error}
                        onSave={handleSave}
                        canSave={!!currentBaseImage}
                    />
                </div>

                <div className="flex justify-center">
                    <div className="flex items-center space-x-2 p-2 bg-[var(--bg-component)] rounded-lg shadow border border-[var(--border-color)]">
                        <input
                            id="high_quality_beauty"
                            type="checkbox"
                            checked={isHighQuality}
                            onChange={e => setIsHighQuality(e.target.checked)}
                            className="form-checkbox"
                        />
                        <label htmlFor="high_quality_beauty" className="text-sm font-semibold text-[var(--text-primary)]">
                            {t('common.highQualityLabel')}
                        </label>
                    </div>
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
                        isLoading={isLoading}
                        hasPreview={!!activePreview}
                    />
                ) : currentBaseImage ? ( // Only show main toolbar if an image is loaded
                    <BeautyStudioMainToolbar
                        tools={BEAUTY_FEATURES}
                        onToolSelect={handleToolSelect}
                        isDisabled={!currentBaseImage || isLoading}
                    />
                ) : null}


                {history.length > 1 && !activeTool && (
                    <BeautyStudioHistoryPanel
                        history={history}
                        onSelect={handleHistorySelect}
                        currentImage={activePreview || currentBaseImage}
                        onClear={handleClearHistory}
                    />
                )}
            </main>
        </div>
    </div>
  );
};

export default BeautyStudio;
