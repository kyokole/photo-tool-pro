import React from 'react';
import { useTranslation } from 'react-i18next';

interface PipelineTrackerProps {
    steps: string[];
    currentStep: number;
    isLoading: boolean;
    isFinished: boolean;
}

const CheckmarkIcon = () => (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const SpinnerIcon = () => (
     <svg className="animate-spin h-5 w-5 text-[var(--accent-cyan)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ steps, currentStep, isLoading, isFinished }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-[var(--bg-deep-space)] p-6 rounded-xl border border-[var(--border-color)] h-full shadow-inner">
            <h2 className="text-2xl font-bold text-[var(--accent-cyan)] mb-4">{t('pipelineTracker.title')}</h2>
            <ul className="space-y-3">
                {steps.map((stepKey, index) => {
                    const isCompleted = isFinished || index < currentStep;
                    const isActive = isLoading && index === currentStep;

                    return (
                        <li key={index} className="flex items-center gap-4 transition-all duration-500">
                           <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                {isCompleted ? <CheckmarkIcon /> : isActive ? <SpinnerIcon /> : <div className="w-3 h-3 bg-[var(--text-secondary)] rounded-full"></div>}
                            </div>
                            <span className={`
                                ${isCompleted ? 'text-green-400 line-through' : ''}
                                ${isActive ? 'text-[var(--accent-cyan)] font-semibold' : 'text-[var(--text-secondary)]'}
                            `}>
                                {t(stepKey)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
