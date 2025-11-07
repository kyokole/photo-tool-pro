
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IdPhotoJob, Settings, AccordionSection } from '../types';
import { ControlPanel } from './ControlPanel';
import { Spinner } from './creativestudio/Spinner';
import { ZoomModal } from './creativestudio/ZoomModal';

interface BatchProcessorProps {
    jobs: IdPhotoJob[];
    settings: Settings;
    onDestructiveSettingChange: React.Dispatch<React.SetStateAction<Settings>>;
    onPrintSettingChange: React.Dispatch<React.SetStateAction<Settings>>;
    isProcessing: boolean;
    onGenerate: () => void;
    onAddPhotos: () => void;
    onClear: () => void;
    onRemoveJob: (jobId: string) => void;
    isVip: boolean;
    onContactClick: () => void;
    activeSection: AccordionSection;
    setActiveSection: (section: AccordionSection) => void;
    enabledSections: AccordionSection[];
    onOutfitUpload: () => void;
    onClearOutfit: () => void;
}

const JobItem: React.FC<{ job: IdPhotoJob; onRemove: (jobId: string) => void; onZoom: (url: string) => void; isBatchProcessing: boolean; }> = ({ job, onRemove, onZoom, isBatchProcessing }) => {
    const { t } = useTranslation();

    const handleDownload = () => {
        if (!job.processedUrl) return;
        const link = document.createElement('a');
        link.href = job.processedUrl;
        link.download = `pro-id-photo-${job.file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg flex items-center gap-4 border border-[var(--border-color)]">
            <img src={job.originalUrl} alt={job.file.name} className="w-16 h-16 object-cover rounded-md" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[var(--text-primary)]">{job.file.name}</p>
                <div className="text-xs text-[var(--text-secondary)]">
                    {job.status === 'pending' && <span className="text-gray-400">{t('batch.status.pending')}</span>}
                    {job.status === 'processing' && <span className="text-blue-400 animate-pulse">{t('batch.status.processing')}</span>}
                    {job.status === 'done' && <span className="text-green-400">{t('batch.status.done')}</span>}
                    {job.status === 'error' && <span className="text-red-400" title={job.error}>{t('batch.status.error')}</span>}
                </div>
            </div>
            <div className="w-16 h-16 bg-[var(--bg-interactive)] rounded-md flex items-center justify-center">
                {job.status === 'processing' && <Spinner />}
                {job.status === 'done' && job.processedUrl && (
                    <img src={job.processedUrl} alt="processed" className="w-full h-full object-cover rounded-md" />
                )}
                {job.status === 'error' && <i className="fas fa-exclamation-triangle text-red-500"></i>}
            </div>
             <div className="flex items-center gap-2">
                <button
                    onClick={() => job.processedUrl && onZoom(job.processedUrl)}
                    disabled={job.status !== 'done'}
                    className="w-8 h-8 bg-white/5 rounded-md hover:bg-white/10 flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('batch.zoom')}
                >
                    <i className="fas fa-search-plus"></i>
                </button>
                <button
                    onClick={handleDownload}
                    disabled={job.status !== 'done'}
                    className="w-8 h-8 bg-white/5 rounded-md hover:bg-white/10 flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('common.download')}
                >
                    <i className="fas fa-download"></i>
                </button>
                <button
                    onClick={() => onRemove(job.id)}
                    disabled={isBatchProcessing || job.status === 'processing'}
                    className="w-8 h-8 bg-red-500/10 rounded-md hover:bg-red-500/20 flex-shrink-0 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('common.delete')}
                >
                    <i className="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    );
};

const BatchVipLock: React.FC<{ onContactClick: () => void; }> = ({ onContactClick }) => {
    const { t } = useTranslation();

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 rounded-2xl">
            <i className="fas fa-crown text-5xl text-yellow-400 mb-4"></i>
            <h3 className="text-2xl font-bold text-yellow-300">{t('batch.vipLock.title')}</h3>
            <p className="text-gray-300 my-2 max-w-sm">{t('batch.vipLock.description')}</p>
            <button onClick={onContactClick} className="mt-4 btn-secondary text-sm py-2 px-5 rounded-lg font-semibold">{t('batch.vipLock.button')}</button>
        </div>
    );
}

const BatchProcessor: React.FC<BatchProcessorProps> = (props) => {
    const { t } = useTranslation();
    const { jobs, isProcessing, onGenerate, onClear, isVip, onContactClick, onAddPhotos, onRemoveJob } = props;
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Failsafe: If the component is rendered but the user is no longer a VIP,
    // automatically trigger the clear/exit function to prevent getting stuck.
    useEffect(() => {
        if (!isVip) {
            const timer = setTimeout(() => {
                onClear();
            }, 500); // A small delay to allow the lock UI to appear briefly
            return () => clearTimeout(timer);
        }
    }, [isVip, onClear]);

    const pendingJobs = jobs.filter(j => j.status === 'pending').length;
    const completedJobs = jobs.filter(j => j.status === 'done').length;

    const handleDownloadAll = () => {
        const doneJobs = jobs.filter(j => j.status === 'done');
        doneJobs.forEach((job, index) => {
            setTimeout(() => {
                 if (!job.processedUrl) return;
                const link = document.createElement('a');
                link.href = job.processedUrl;
                link.download = `pro-id-photo-${job.file.name}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 300); // Stagger downloads
        });
    };

    return (
        <>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="w-full max-w-6xl mx-auto text-center px-6 pt-6 pb-2 flex-shrink-0">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('batch.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('batch.subtitle', { count: jobs.length })}</p>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_384px] overflow-hidden gap-6 px-6 pb-6 relative">
                    {!isVip && <BatchVipLock onContactClick={onContactClick} />}
                    <main className="flex flex-col bg-[var(--bg-component)] rounded-2xl p-4 border border-[var(--border-color)] min-h-0">
                        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--border-color)]">
                            <div>
                                <h3 className="text-lg font-semibold">{t('batch.jobList')}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{t('batch.statusSummary', { completed: completedJobs, total: jobs.length })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={onAddPhotos} className="btn-secondary text-sm py-2 px-3"><i className="fas fa-plus mr-2"></i>{t('batch.addPhotos')}</button>
                                <button onClick={onClear} className="btn-secondary text-sm py-2 px-3"><i className="fas fa-times mr-2"></i>{t('batch.clear')}</button>
                                <button onClick={handleDownloadAll} disabled={completedJobs === 0} className="btn-secondary text-sm py-2 px-3 disabled:opacity-50"><i className="fas fa-file-archive mr-2"></i>{t('batch.downloadAll')}</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2 scrollbar-thin">
                            {jobs.map(job => <JobItem key={job.id} job={job} onRemove={onRemoveJob} onZoom={setZoomedImage} isBatchProcessing={isProcessing} />)}
                        </div>
                    </main>
                    <div className="w-full flex flex-col min-h-0">
                        <ControlPanel 
                            {...props} 
                            title={t('batch.settingsTitle')} 
                            hasProcessedImage={false} 
                            originalImage={jobs.length > 0 ? 'batch-mode-active' : null}
                            isFreeTierLocked={!isVip} // In batch mode, the lock is purely based on VIP status
                            isVisible={true}
                        />
                        <div className="mt-auto pt-4">
                            <button 
                                onClick={onGenerate} 
                                disabled={isProcessing || pendingJobs === 0 || !isVip} 
                                className="w-full btn-gradient text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="ml-3">{t('batch.processingAll')}</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-layer-group mr-3"></i> {t('batch.generateAll', { count: pendingJobs })}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
             {zoomedImage && (
                <ZoomModal
                    isOpen={!!zoomedImage}
                    onClose={() => setZoomedImage(null)}
                    base64Image={zoomedImage.split(',')[1]}
                />
            )}
        </>
    );
};

export default BatchProcessor;
