import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useJobQueue } from '../../hooks/useJobQueue';
import type { Job, JobDefinition } from '../../types';
import { JobInputForm } from './JobInputForm';
import { JobList } from './JobList';
import { DownloadIcon, PlayIcon, TrashIcon } from '../icons';
import { smartDownload } from '../../utils/canvasUtils';

// Make JSZip available from the window object loaded via CDN
declare const JSZip: any;

export const BatchProcessor: React.FC = () => {
    const { t } = useTranslation();
    const [jobDefinitions, setJobDefinitions] = useState<JobDefinition[]>([]);
    const [concurrency, setConcurrency] = useState(4);
    const { jobs, submitJobs, retryJob, clearJobs } = useJobQueue(concurrency);

    const handleAddJob = (jobDef: JobDefinition) => {
        if (jobDefinitions.length < 50) {
            setJobDefinitions(prev => [...prev, jobDef]);
        }
    };

    const handleAddMultipleJobs = (newJobs: JobDefinition[]) => {
        const availableSlots = 50 - jobDefinitions.length;
        if (newJobs.length === 0) return;

        if (newJobs.length > availableSlots) {
            alert(t('batch.errors.queueFull', { available: availableSlots, requested: newJobs.length }));
        }

        const jobsToAdd = newJobs.slice(0, availableSlots);
        setJobDefinitions(prev => [...prev, ...jobsToAdd]);
    };

    const handleRemoveJobDefinition = (index: number) => {
        setJobDefinitions(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleStartProcessing = () => {
        submitJobs(jobDefinitions);
        setJobDefinitions([]);
    };

    const handleDownloadAll = useCallback(async () => {
        const successfulJobs = Array.from<Job>(jobs.values()).filter(j => j.status === 'Success' && j.result.length > 0);
        if (successfulJobs.length === 0) {
            alert(t('batch.noSuccess'));
            return;
        }

        const zip = new JSZip();
        for (const job of successfulJobs) {
            for (let i = 0; i < job.result.length; i++) {
                const image = job.result[i];
                const safePrompt = job.prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
                const filename = `job_${job.id.substring(0, 5)}_${safePrompt}_${i + 1}.png`;
                zip.file(filename, image.base64, { base64: true });
            }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        smartDownload(url, "gemini_image_batch.zip");
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [jobs, t]);
    
    const jobsArray = Array.from<Job>(jobs.values());
    const hasSuccessfulJobs = jobsArray.some(j => j.status === 'Success');
    const isProcessing = jobsArray.some(j => j.status === 'Running' || j.status === 'Queued');
    const completedJobs = jobsArray.filter(j => j.status === 'Success' || j.status === 'Failed').length;
    const totalJobs = jobsArray.length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)]">
                <h2 className="text-2xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">{t('batch.addQueue')}</h2>
                <JobInputForm
                    onAddJob={handleAddJob}
                    onAddMultipleJobs={handleAddMultipleJobs}
                    isDisabled={jobDefinitions.length >= 50 || isProcessing}
                />
                
                {jobDefinitions.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold text-lg mb-3">{t('batch.pendingTasks', { count: jobDefinitions.length })}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                            {jobDefinitions.map((def, index) => (
                                <div key={index} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                    <p className="truncate text-sm flex-1 mr-4">
                                        <span className="font-bold text-[var(--accent-text-start)]">{def.numOutputs}x</span> "{def.prompt}"
                                    </p>
                                    <button onClick={() => handleRemoveJobDefinition(index)} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label htmlFor="concurrency" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                {t('batch.concurrentTasks')}
                            </label>
                            <input
                                id="concurrency"
                                type="number"
                                min="1"
                                max="10"
                                value={concurrency}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    if (value >= 1 && value <= 10) setConcurrency(value);
                                }}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2.5 focus:ring-[var(--ring-color)] focus:border-[var(--ring-color)] transition"
                                disabled={isProcessing}
                            />
                        </div>
                        <button
                            onClick={handleStartProcessing}
                            disabled={isProcessing}
                            className="mt-4 w-full flex items-center justify-center gap-2 btn-gradient text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <PlayIcon className="w-6 h-6" />
                            {t('batch.startProcessing', { count: jobDefinitions.length })}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-[var(--bg-component)] p-6 rounded-2xl shadow-lg border border-[var(--border-color)] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-2 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold">{t('batch.results')}</h2>
                    {jobs.size > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadAll}
                                disabled={!hasSuccessfulJobs || isProcessing}
                                className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                {t('batch.downloadAll')}
                            </button>
                            <button
                                onClick={clearJobs}
                                disabled={isProcessing}
                                className="flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-5 h-5" />
                                {t('batch.clearAll')}
                            </button>
                        </div>
                    )}
                </div>
                 {totalJobs > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-[var(--text-secondary)] mb-1">{t('batch.progress', { completed: completedJobs, total: totalJobs })}</p>
                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5">
                            <div className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${(completedJobs / totalJobs) * 100}%` }}></div>
                        </div>
                    </div>
                )}
                <JobList jobs={jobsArray} onRetry={retryJob} />
            </div>
        </div>
    );
};
