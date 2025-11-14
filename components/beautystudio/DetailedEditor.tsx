import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautyFeature, BeautyStyle, BeautySubFeature } from '../../types';
import { StyleSelector } from './StyleSelector';
import { SubFeatureTabs } from './SubFeatureTabs';

interface DetailedEditorProps {
    activeTool: BeautyFeature | null;
    activeSubFeature: BeautySubFeature | null;
    activeStyle: BeautyStyle | null;
    onSubFeatureSelect: (subFeature: BeautySubFeature) => void;
    onStyleSelect: (style: BeautyStyle) => void;
    onConfirm: () => void;
    onCancel: () => void;
    onGenerate: () => void;
    isLoading: boolean;
    hasPreview: boolean;
}

export const DetailedEditor: React.FC<DetailedEditorProps> = (props) => {
    const {
        activeTool,
        activeSubFeature,
        activeStyle,
        onSubFeatureSelect,
        onStyleSelect,
        onConfirm,
        onCancel,
        onGenerate,
        isLoading,
        hasPreview,
    } = props;
    const { t } = useTranslation();

    const handleSubFeatureSelect = useCallback((subFeature: BeautySubFeature) => {
        onSubFeatureSelect(subFeature);
        const stylesToConsider = subFeature.styles || [];
        // Automatically select the 'none' style to force a deliberate choice from the user
        const noneStyle = stylesToConsider.find(s => s.id === 'none') || stylesToConsider[0] || null;
       
        if(noneStyle) {
          onStyleSelect(noneStyle);
        }
    }, [onSubFeatureSelect, onStyleSelect]);


    if (!activeTool) return null;

    return (
        <div className="bg-[var(--bg-component)] rounded-t-2xl shadow-lg fixed bottom-0 left-0 right-0 w-full max-w-4xl mx-auto animate-slide-up z-30 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-[var(--bg-hover)]" aria-label={t('beautyStudio.detailedEditor.cancel')}>
                    <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{t(activeTool.labelKey)}</h2>
                <button
                  onClick={onConfirm}
                  disabled={!hasPreview || isLoading}
                  className="p-2 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-50"
                  aria-label={t('beautyStudio.detailedEditor.confirm')}
                >
                    <svg className="w-6 h-6 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
            </div>

            <div className="pt-2 pb-4">
                <SubFeatureTabs
                    subFeatures={activeTool.subFeatures || []}
                    selectedSubFeature={activeSubFeature}
                    onSelect={handleSubFeatureSelect}
                />
                <StyleSelector
                    subFeature={activeSubFeature}
                    selectedStyle={activeStyle}
                    onSelect={onStyleSelect}
                />
            </div>
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-component)]">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || !activeStyle || activeStyle.id === 'none'}
                    className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('beautyStudio.detailedEditor.generating')}</span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-magic mr-2"></i>
                            <span>{t('beautyStudio.detailedEditor.preview')}</span>
                        </>
                    )}
                </button>
            </div>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};