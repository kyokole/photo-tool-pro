import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestorationResult } from '../types';
import { ImageUploader } from './ImageUploader';
import { ResultCard } from './ResultCard';
import { PipelineTracker } from './PipelineTracker';
import { Loader } from './Loader';
import { PIPELINE_STEPS } from '../constants';
import { ThemeSelector } from './creativestudio/ThemeSelector';

interface RestorationToolProps {
    originalFile: File | null;
    results: RestorationResult[];
    isLoading: boolean;
    error: string | null;
    currentStep: number;
    onImageUpload: (file: File) => void;
    onReset: () => void;
    theme: string;
    setTheme: (theme: string) => void;
}

const RestorationTool: React.FC<RestorationToolProps> = ({ 
    originalFile,
    results,
    isLoading,
    error,
    currentStep,
    onImageUpload,
    onReset,
    theme,
    setTheme
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 flex flex-col items-center animate-fade-in h-full px-4 sm:px-6 lg:p-8">
            <header className="w-full max-w-6xl grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-4 sm:pt-6 lg:pt-0 pb-2">
                <div /> {/* Spacer */}
                <div className="text-center">
                    <h1 
                        className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text"
                        style={{ fontFamily: "'Exo 2', sans-serif" }}
                    >
                        {t('restoration.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('restoration.subtitle')}</p>
                </div>
                 <div className="flex justify-end">
                    <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                </div>
            </header>

            <main 
                className="relative w-full max-w-4xl flex-grow flex flex-col items-center justify-center bg-[var(--bg-component)] rounded-2xl shadow-lg p-4 sm:p-8 border border-[var(--border-color)] my-4"
            >
                {!originalFile && <ImageUploader onImageUpload={onImageUpload} uploaderId="restoration-upload" />}
                
                {isLoading && (
                    <div className="w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
                        <div className="w-full lg:w-1/2">
                            <Loader currentStepText={t(PIPELINE_STEPS[currentStep] ?? 'pipelineSteps.complete')} />
                        </div>
                        <div className="w-full lg:w-1/2">
                            <PipelineTracker steps={PIPELINE_STEPS} currentStep={currentStep} isLoading={isLoading} isFinished={false} />
                        </div>
                    </div>
                )}

                {!isLoading && results.length > 0 && (
                <div className="w-full flex flex-col gap-8">
                    <div className="space-y-8 no-scrollbar overflow-y-auto max-h-[70vh] p-1">
                    {results.map((result, index) => (
                        <ResultCard 
                            key={index}
                            title={t(`${result.key}.title`)}
                            description={t(`${result.key}.description`)}
                            imageUrl={result.imageUrl}
                            fileName={`step-${index}-${originalFile?.name.replace(/\.[^/.]+$/, "") || 'restored'}.jpg`}
                        />
                    ))}
                    </div>
                    <button onClick={onReset} className="w-full md:w-1/2 mx-auto btn-secondary text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 text-lg mt-4">
                        {t('restoration.restoreAnother')}
                    </button>
                </div>
                )}

                {error && !isLoading && (
                <div className="mt-6 text-center text-red-300 bg-red-900/50 p-4 rounded-lg border border-red-500/50">
                    <p className="font-semibold">{t('restoration.errorTitle')}</p>
                    <p>{error}</p>
                    <button onClick={onReset} className="mt-4 btn-secondary text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
                        {t('common.retry')}
                    </button>
                </div>
                )}
            </main>
        </div>
    );
};

export default RestorationTool;