import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { BatchAspectRatio, JobDefinition } from '../../types';
import { batchAspectRatios, isBatchAspectRatio } from '../../types';
import { PlusIcon, UploadIcon } from '../icons';


interface JobInputFormProps {
  onAddJob: (job: JobDefinition) => void;
  onAddMultipleJobs: (jobs: JobDefinition[]) => void;
  isDisabled: boolean;
}


export const JobInputForm: React.FC<JobInputFormProps> = ({ onAddJob, onAddMultipleJobs, isDisabled }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<BatchAspectRatio>('9:16');
  const [numOutputs, setNumOutputs] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && numOutputs > 0) {
      onAddJob({ prompt, aspectRatio, numOutputs });
      setPrompt('');
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;


    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsedJobs: JobDefinition[] = [];


        if (file.name.endsWith('.txt')) {
          parsedJobs = content.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .map(prompt => ({ prompt, aspectRatio, numOutputs }));
          if (parsedJobs.length === 0) throw new Error(t('batch.errors.txtEmpty'));
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(line => line.trim() !== '');
          const header = lines.shift()?.toLowerCase().trim().replace(/"/g, '');
         
          if (header !== 'prompt,aspectratio,numoutputs') {
             console.warn("CSV header is not 'prompt,aspectratio,numoutputs'. Parsing will proceed assuming this order.");
          }

          parsedJobs = lines.map((line, index) => {
              const parts = line.split(',');
              if (parts.length < 3) throw new Error(t('batch.errors.csvInvalidRow', { row: index + 2 }));
              
              const numOutputsStr = parts.pop()?.trim();
              const aspectRatioRaw = parts.pop()?.trim() as BatchAspectRatio;
              let prompt = parts.join(',').trim();

              if (prompt.startsWith('"') && prompt.endsWith('"')) {
                  prompt = prompt.substring(1, prompt.length - 1).replace(/""/g, '"');
              }
             
              const numOutputs = parseInt(numOutputsStr!, 10);
             
              if (!prompt || !isBatchAspectRatio(aspectRatioRaw) || !aspectRatioRaw || isNaN(numOutputs) || numOutputs < 1 || numOutputs > 4) {
                  throw new Error(t('batch.errors.csvInvalidData', { row: index + 2, line }));
              }
              return { prompt, aspectRatio: aspectRatioRaw, numOutputs };
          });

        } else if (file.name.endsWith('.json')) {
            const data = JSON.parse(content);
            if (!Array.isArray(data)) throw new Error(t('batch.errors.jsonNotArray'));
            parsedJobs = data.map((item, index) => {
                const { prompt, aspectRatio, numOutputs } = item;
                if (!prompt || !isBatchAspectRatio(aspectRatio) || typeof numOutputs !== 'number' || numOutputs < 1 || numOutputs > 4) {
                    throw new Error(t('batch.errors.jsonInvalidObject', { index, item: JSON.stringify(item) }));
                }
                return { prompt, aspectRatio, numOutputs };
            });
        } else {
            throw new Error(t('batch.errors.unsupportedFormat'));
        }
        onAddMultipleJobs(parsedJobs);
      } catch (error) {
          alert(t('batch.errors.fileProcessingError', { error: error instanceof Error ? error.message : 'Unknown error' }));
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {t('batch.promptLabel')}
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('batch.promptPlaceholder')}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2.5 focus:ring-[var(--ring-color)] focus:border-[var(--ring-color)] transition"
            rows={3}
            required
            disabled={isDisabled}
          />
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('batch.aspectRatioLabel')}
            </label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as BatchAspectRatio)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2.5 focus:ring-[var(--ring-color)] focus:border-[var(--ring-color)] transition"
              disabled={isDisabled}
            >
              {batchAspectRatios.map(ratio => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="numOutputs" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('batch.numImagesLabel')}
            </label>
            <input
              id="numOutputs"
              type="number"
              min="1"
              max="4"
              value={numOutputs}
              onChange={(e) => setNumOutputs(parseInt(e.target.value, 10))}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2.5 focus:ring-[var(--ring-color)] focus:border-[var(--ring-color)] transition"
              required
              disabled={isDisabled}
            />
          </div>
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          {t('batch.inputType')}
        </div>
        <button
          type="submit"
          disabled={isDisabled || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-6 h-6" />
          {t('batch.addToQueue')}
        </button>
      </form>


      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[var(--border-color)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg-component)] px-2 text-sm text-[var(--text-secondary)]">{t('batch.or')}</span>
        </div>
      </div>


      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".csv,.json,.txt"
          disabled={isDisabled}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 btn-secondary text-[var(--text-primary)] font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadIcon className="w-5 h-5" />
          {t('batch.uploadFile')}
        </button>
        <p className="mt-2 text-xs text-[var(--text-muted)] text-center">
          {t('batch.txtFormat')}<br />
          {t('batch.csvFormat')}<br/>
          {t('batch.jsonFormat')}
        </p>
      </div>
    </>
  );
};