import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Job } from '../../types';
import { JobStatus } from '../../types';
import { RetryIcon } from '../icons';


interface JobItemProps {
  job: Job;
  onRetry: (jobId: string) => void;
}


const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
    const { t } = useTranslation();
    const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
    
    const statusConfig: Record<JobStatus, { className: string; text: string }> = {
        [JobStatus.Queued]: { className: "bg-gray-700 text-gray-300", text: t('batch.status.queued') },
        [JobStatus.Running]: { className: "bg-blue-900 text-blue-300 animate-pulse", text: t('batch.status.running') },
        [JobStatus.Success]: { className: "bg-green-900 text-green-300", text: t('batch.status.success') },
        [JobStatus.Failed]: { className: "bg-red-900 text-red-300", text: t('batch.status.failed') },
    };

    const config = statusConfig[status];
    return <span className={`${baseClasses} ${config.className}`}>{config.text}</span>;
};


const Spinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);




export const JobItem: React.FC<JobItemProps> = ({ job, onRetry }) => {
    const { t } = useTranslation();
  // This component now only renders pending or failed jobs.
  // The successful jobs are rendered as a grid in JobList.
  if (job.status === JobStatus.Success) {
    return null;
  }
 
  return (
    <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded-lg border border-[var(--border-color)]">
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-4 min-w-0">
          <div className="flex items-center">
             {job.status === JobStatus.Running && <Spinner />}
             {job.status !== JobStatus.Running && <StatusBadge status={job.status} />}
            <p className="text-sm text-[var(--text-secondary)] truncate ml-2">{job.prompt}</p>
          </div>
        </div>
        {job.status === JobStatus.Failed && (
          <button onClick={() => onRetry(job.id)} className="flex items-center gap-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-1 px-3 rounded-md transition-colors flex-shrink-0">
            <RetryIcon className="w-4 h-4" />
            {t('batch.retry')}
          </button>
        )}
      </div>


      {job.status === JobStatus.Failed && job.error && (
        <div className="mt-2 p-2 bg-red-900/50 text-red-300 rounded-md text-xs">
          <strong>{t('batch.error')}:</strong> {job.error}
        </div>
      )}
    </div>
  );
};