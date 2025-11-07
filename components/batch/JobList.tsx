import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Job, GeneratedImage } from '../../types';
import { JobItem } from './JobItem';
import { JobStatus } from '../../types';
import { DownloadIcon } from '../icons';


interface JobListProps {
  jobs: Job[];
  onRetry: (jobId: string) => void;
}


const ImageGridItem: React.FC<{ image: GeneratedImage, job: Job }> = ({ image, job }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image.base64}`;
        const safePrompt = job.prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `job_${job.id.substring(0, 5)}_${safePrompt}_${image.id.substring(0,5)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div
          className="group relative aspect-square rounded-lg overflow-hidden"
          title={job.prompt} // Show prompt on hover
        >
          <img
            src={`data:image/png;base64,${image.base64}`}
            alt={job.prompt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button onClick={handleDownload} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors">
                <DownloadIcon className="w-6 h-6" />
             </button>
          </div>
        </div>
    );
};




export const JobList: React.FC<JobListProps> = ({ jobs, onRetry }) => {
  const { t } = useTranslation();
  if (jobs.length === 0) {
    return (
      <div className="text-center py-10 px-4 h-full flex flex-col items-center justify-center">
        <p className="text-[var(--text-muted)]">{t('batch.noTasks')}</p>
        <p className="text-[var(--text-muted)] mt-2 text-sm">{t('batch.noTasksDesc')}</p>
      </div>
    );
  }


  const pendingOrFailedJobs = jobs.filter(job => job.status !== JobStatus.Success);
  const successfulJobs = jobs.filter(job => job.status === JobStatus.Success);
 
  // Flatten all images from successful jobs into a single array
  const allImages = successfulJobs.flatMap(job =>
    job.result.map(image => ({ image, job }))
  );


  return (
    <div className="space-y-6 flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thin">
      {/* Section for pending and failed jobs */}
      {pendingOrFailedJobs.length > 0 && (
        <div className="space-y-4">
          {pendingOrFailedJobs.map(job => (
            <JobItem key={job.id} job={job} onRetry={onRetry} />
          ))}
        </div>
      )}


      {/* Divider */}
      {pendingOrFailedJobs.length > 0 && allImages.length > 0 && (
         <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[var(--border-color)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--bg-component)] px-2 text-sm text-[var(--text-secondary)]">{t('batch.successResults')}</span>
            </div>
          </div>
      )}


      {/* Section for successful images */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allImages.map(({image, job}) => (
            <ImageGridItem key={image.id} image={image} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};