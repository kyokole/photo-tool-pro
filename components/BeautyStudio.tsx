import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { BeautyFeature, BeautyStyle, BeautySubFeature, BeautyHistoryItem } from '../types';
import { BEAUTY_FEATURES } from '../constants/beautyStudioConstants';

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
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
 
  const [activeTool, setActiveTool] = useState<BeautyFeature | null>(null);
  const [activeSubFeature, setActiveSubFeature] = useState<BeautySubFeature | null>(null);
  const [activeStyle, setActiveStyle] = useState<BeautyStyle | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<BeautyHistoryItem[]>([]);
 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateModification = async (tool?: BeautyFeature, subFeature?: BeautySubFeature, style?: BeautyStyle, baseImageOverride?: string | null) => {
    const currentTool = tool || activeTool;
    const currentSubFeature = subFeature || activeSubFeature;
    const currentStyle = style || activeStyle;
    const imageToModify = baseImageOverride || originalImage;

    if (!imageToModify) {
      setError("Please upload an image first.");
      return;
    }
    if (!currentTool) {
      setError("Please select a tool.");
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
      // TODO: Refactor to use geminiService.ts and backend proxy
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = imageToModify.split(',')[1];

      const baseInstruction = "The result should be realistic, high-quality, and seamlessly blended with the original photo. Only return the modified image.";
      let prompt: string;

      const customPrompt = currentStyle?.promptInstruction || currentSubFeature?.promptInstruction || currentTool?.promptInstruction;

      if (customPrompt) {
          let finalCustomPrompt = customPrompt;
          if (currentStyle) {
            finalCustomPrompt = finalCustomPrompt.replace('{{style}}', currentStyle.englishLabel);
          }
          if (currentSubFeature) {
            finalCustomPrompt = finalCustomPrompt.replace('{{sub_feature}}', currentSubFeature.englishLabel);
          }
          if(currentTool) {
            finalCustomPrompt = finalCustomPrompt.replace('{{tool}}', currentTool.englishLabel);
          }
          prompt = `${finalCustomPrompt} ${baseInstruction}`;
      } else {
          let effectDescription = `a '${currentTool.englishLabel}' effect`;
          if (currentSubFeature && currentStyle && currentStyle.id !== 'none') {
              effectDescription += `, specifically for the '${currentSubFeature.englishLabel}' with the style '${currentStyle.englishLabel}'`;
          }
          prompt = `You are an expert AI photo retouching artist. The user wants to apply ${effectDescription}. ${baseInstruction}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
     
      let imageFound = false;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const generatedBase64 = part.inlineData.data;
                const newImageDataUrl = `data:image/png;base64,${generatedBase64}`;
                setGeneratedImage(newImageDataUrl);

                const newHistoryItem: BeautyHistoryItem = {
                  id: Date.now().toString(),
                  imageDataUrl: newImageDataUrl
                };
                setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
                imageFound = true;
                break;
            }
        }
      }
     
      if (!imageFound) {
        throw new Error("No image was generated. The response may have been blocked.");
      } else {
        handleClearActiveTool();
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image generation.";
      setError(`Failed to generate image. ${errorMessage}`);
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
  }, [originalImage, generatedImage]);

  const handleClearActiveTool = useCallback(() => {
    setActiveTool(null);
    setActiveSubFeature(null);
    setActiveStyle(null);
  }, []);

  const handleConfirm = useCallback(() => {
    generateModification();
  }, [activeTool, activeSubFeature, activeStyle, originalImage]);

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

  const handleSave = useCallback(() => {
    const imageToSave = generatedImage || originalImage;
    if (imageToSave) {
      const link = document.createElement('a');
      link.href = imageToSave;
      link.download = 'beauty-studio-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    <div className="flex-1 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans animate-fade-in">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        Studio Làm Đẹp
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">Biết trước gương mặt bạn thay đổi sau 30 giây với gương thần AI.</p>
                </div>
                <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>

            <main className="space-y-6">
                <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                
                    {originalImage && (
                    <ImageToolbar
                        onBack={handleBack}
                        onUndo={handleUndo}
                        showBack={!!activeTool}
                        showUndo={!!generatedImage && !activeTool}
                    />
                    )}
                
                    <BeautyStudioImageProcessor
                        originalImage={originalImage}
                        generatedImage={generatedImage}
                        onUploadClick={handleChangeImageClick}
                        isLoading={isLoading}
                        error={error}
                        onSave={handleSave}
                        canSave={!!originalImage}
                    />
                </div>

                <BeautyStudioHistoryPanel
                    history={history}
                    onSelect={handleHistorySelect}
                    currentImage={generatedImage}
                    onClear={handleClearHistory}
                />
                
                <div className="pt-2">
                    <div
                    className={`w-full text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg flex items-center justify-center btn-gradient`}
                    >
                    Trải nghiệm gương thần AI
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
                        onCancel={handleClearActiveTool}
                    />
                ) : (
                    <BeautyStudioMainToolbar
                        tools={BEAUTY_FEATURES}
                        onToolSelect={handleToolSelect}
                        isDisabled={!originalImage || isLoading}
                    />
                )}
            </main>
        </div>
    </div>
  );
};

export default BeautyStudio;
