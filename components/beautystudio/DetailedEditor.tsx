import React, { useCallback } from 'react';
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
}


export const DetailedEditor: React.FC<DetailedEditorProps> = (props) => {
    const { t } = useTranslation();
    const {
        activeTool,
        activeSubFeature,
        activeStyle,
        onSubFeatureSelect,
        onStyleSelect,
        onConfirm,
        onCancel,
    } = props;


    const handleSubFeatureSelect = useCallback((subFeature: BeautySubFeature) => {
        onSubFeatureSelect(subFeature);
        const stylesToConsider = subFeature.styles || [];
        const defaultStyle = stylesToConsider.find(s => s.id !== 'none') || stylesToConsider[0] || subFeature.styles?.find(s => s.id === 'none') || null;
       
        if(defaultStyle) {
          onStyleSelect(defaultStyle);
        }
    }, [onSubFeatureSelect, onStyleSelect]);


    const handleStyleSelect = useCallback((style: BeautyStyle) => {
        onStyleSelect(style);
    }, [onStyleSelect]);


    if (!activeTool) return null;


    return (
        <div className="bg-[var(--bg-component)] rounded-t-2xl shadow-lg fixed bottom-0 left-0 right-0 w-full max-w-2xl mx-auto animate-slide-up z-30 border-t border-x border-[var(--border-color)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-[var(--bg-hover)]" aria-label="Close editor">
                    <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{t(activeTool.labelKey)}</h2>
                <button
                  onClick={onConfirm}
                  className="p-2 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-50"
                  disabled={!activeStyle}
                  aria-label="Confirm changes"
                >
                    <svg className="w-6 h-6 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
            </div>


            {/* Sub-Features and Styles */}
            <div className="pt-2">
                <SubFeatureTabs
                    subFeatures={activeTool.subFeatures || []}
                    selectedSubFeature={activeSubFeature}
                    onSelect={handleSubFeatureSelect}
                />
                <StyleSelector
                    subFeature={activeSubFeature}
                    selectedStyle={activeStyle}
                    onSelect={handleStyleSelect}
                />
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