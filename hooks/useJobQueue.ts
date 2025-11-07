import { useState, useEffect, useCallback } from 'react';
import type { Job, JobDefinition, GeneratedImage } from '../types';
import { JobStatus } from '../types';
import { generateBatchImages } from '../services/geminiService';


export const useJobQueue = (maxConcurrentJobs: number) => {
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());


  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(prevJobs => {
      const newJobs = new Map(prevJobs);
      const existingJob = newJobs.get(id);
      if (existingJob) {
        // FIX: Replaced spread syntax with Object.assign to fix "Spread types may only be created from object types" error.
        newJobs.set(id, Object.assign({}, existingJob, updates));
      }
      return newJobs;
    });
  };


  const processJob = async (job: Job) => {
    updateJob(job.id, { status: JobStatus.Running });
    try {
      const imageBase64s = await generateBatchImages(job.prompt, job.aspectRatio, job.numOutputs);
      const results: GeneratedImage[] = imageBase64s.map((base64) => ({
        id: crypto.randomUUID(),
        base64,
      }));
      updateJob(job.id, { status: JobStatus.Success, result: results });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      updateJob(job.id, { status: JobStatus.Failed, error: errorMessage });
    }
  };


  useEffect(() => {
    // FIX: Explicitly specify the generic type for `Array.from` to ensure TypeScript correctly infers the array type as `Job[]`.
    const runningJobs = Array.from<Job>(jobs.values()).filter(j => j.status === JobStatus.Running).length;
    // FIX: Explicitly specify the generic type for `Array.from` to ensure TypeScript correctly infers the array type as `Job[]`, fixing the error when calling `processJob`.
    const queuedJobs = Array.from<Job>(jobs.values()).filter(j => j.status === JobStatus.Queued);


    if (runningJobs < maxConcurrentJobs && queuedJobs.length > 0) {
      const jobsToStart = queuedJobs.slice(0, maxConcurrentJobs - runningJobs);
      jobsToStart.forEach(job => processJob(job));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, maxConcurrentJobs]);
 
  const submitJobs = useCallback((jobDefs: JobDefinition[]) => {
    setJobs(prevJobs => {
      const newJobs = new Map(prevJobs);
      jobDefs.forEach(def => {
          const newJob: Job = {
              ...def,
              id: crypto.randomUUID(),
              status: JobStatus.Queued,
              result: [],
          };
          newJobs.set(newJob.id, newJob);
      });
      return newJobs;
    });
  }, []);


  const retryJob = useCallback((jobId: string) => {
    const jobToRetry = jobs.get(jobId);
    if (jobToRetry) {
      updateJob(jobId, { status: JobStatus.Queued, error: undefined, result: [] });
    }
  }, [jobs]);


  const clearJobs = useCallback(() => {
    setJobs(new Map());
  }, []);


  return { jobs, submitJobs, retryJob, clearJobs };
};
