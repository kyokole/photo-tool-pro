import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { BeautyFeature, BeautyStyle, BeautySubFeature, BeautyHistoryItem } from '../types';
import { BEAUTY_FEATURES } from '../constants/beautyStudioConstants';
import { generateBeautyPhoto } from '../services/geminiService';
import { applyWatermark } from '../utils/canvasUtils';

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

  const generateModification = async (tool?: BeautyFeature, subFeature?: BeautySubFeature, style?: BeautyStyle) => {
    const currentTool = tool || activeTool;
    const currentSubFeature = subFeature || activeSubFeature;
    const currentStyle = style || activeStyle;
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
        setActiveResult(null); // Clear temporary preview if "None" is selected
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setActiveResult(null); // Clear previous result before generating new one

    try {
      const imageDataFromServer = await generateBeautyPhoto(
        imageToModify,
        currentTool,
        currentSubFeature,
        currentStyle
      );
      
      const newImageDataUrl = !isVip ? await applyWatermark(imageDataFromServer) : imageDataFromServer;
      setActiveResult(newImageDataUrl);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : t('errors.unknownError');
      setError(t('errors.beautyGenerationFailed', { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleToolSelect = useCallback((tool: BeautyFeature) => {
    // If there's an active result, commit it to the base image and history
    if (activeResult) {
      const newHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: activeResult };
      setHistory(prev => [newHistoryItem, ...prev]);
      setCurrentBaseImage(activeResult);
      setActiveResult(null);
    }
    
    // Simple tools without sub-features generate immediately
    if (!tool.subFeatures || tool.subFeatures.length === 0) {
        generateModification(tool, undefined, undefined);
        return;
    }

    // For complex tools, open the detailed editor
    setActiveTool(tool);
    const defaultSubFeature = tool.subFeatures[0] || null;
    setActiveSubFeature(defaultSubFeature);
    const defaultStyle = defaultSubFeature?.styles?.find(s => s.id !== 'none') || defaultSubFeature?.styles?.[0] || null;
    setActiveStyle(defaultStyle);

  }, [activeResult, generateModification]);

  const handleCancel = useCallback(() => {
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
    setActiveResult(null); // Discard preview
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
    setCurrentBaseImage(imageDataUrl);
    setActiveResult(null);
    setError(null);
    setHistory([]);
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  };
 
  const handleBackToMainToolbar = useCallback(() => {
    setActiveResult(null); // Discard temp changes
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (activeResult) { // Undo the preview
        setActiveResult(null);
    } else if(history.length > 0) { // Revert to previous history state
        const lastItem = history[0];
        const newHistory = history.slice(1);
        const previousState = newHistory[0]?.imageDataUrl || null;
        setCurrentBaseImage(lastItem.imageDataUrl); // Set the base to the last committed change
        setHistory(newHistory);
    }
  }, [activeResult, history]);

  const handleSave = useCallback(() => {
    const imageToSave = activeResult || currentBaseImage;
    if (imageToSave) {
      const link = document.createElement('a');
      link.href = imageToSave;
      link.download = 'beauty-studio-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

    // Prune history to the selected point
    const itemIndex = history.findIndex(h => h.id === item.id);
    if (itemIndex > -1) {
        setHistory(prev => prev.slice(itemIndex));
    }
  };
 
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    if (currentBaseImage) {
        // If there's an image, create a single history item for it as the new start point
        const initialHistoryItem: BeautyHistoryItem = { id: Date.now().toString(), imageDataUrl: currentBaseImage };
        setHistory([initialHistoryItem]);
    }
  }, [currentBaseImage]);

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
                            showUndo={!!activeResult || history.length > 0}
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

                <BeautyStudioHistoryPanel
                    history={history}
                    onSelect={handleHistorySelect}
                    currentImage={activeResult || currentBaseImage}
                    onClear={handleClearHistory}
                />
                
                <div className="pt-2">
                    <div
                        className={`w-full text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg flex items-center justify-center btn-gradient`}
                    >
                       {t('beautyStudio.magicMirror')}
                    </div>
                </div>
                
                {activeTool ? (
                    <DetailedEditor
                        activeTool={activeTool}
                        activeSubFeature={activeSubFeature}
                        activeStyle={activeStyle}
                        onSubFeatureSelect={setActiveSubFeature}
                        onStyleSelect={setActiveStyle}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                ) : (
                    <BeautyStudioMainToolbar
                        tools={BEAUTY_FEATURES}
                        onToolSelect={handleToolSelect}
                        isDisabled={!currentBaseImage || isLoading}
                    />
                )}
            </main>
        </div>
    </div>
  );
};

export default BeautyStudio;
