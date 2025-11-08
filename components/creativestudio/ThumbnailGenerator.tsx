// components/creativestudio/ThumbnailGenerator.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { generateThumbnail } from '../../services/geminiService';
import type { ThumbnailRatio as Ratio, ThumbnailInputs as Inputs, ThumbnailImageData as ImageData } from '../../types';

// --- CANVAS UTILITY FUNCTIONS ---
const roundRect = (
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: boolean, stroke: boolean
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
};

const drawTextBox = (
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, padding: number, font: string, weight: number = 800
) => {
  ctx.font = `${weight} ${font}`;
  const metrics = ctx.measureText(text);
  const w = Math.min(maxW, metrics.width + padding * 2);
  const h = parseInt(font, 10) + padding * 1.6;

  ctx.fillStyle = 'rgba(11, 31, 69, 0.8)'; // Equivalent to #0b1f45cc
  roundRect(ctx, x, y, w, h, 14, true, false);

  ctx.fillStyle = '#eaf2ff';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x + padding, y + padding * 0.6);

  return { w, h };
};

const drawModel = (
  ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, frame: { x: number; y: number; w: number; h: number }
) => {
  if (!img) return;
  const { x, y, w, h } = frame;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.67)'; // #000000aa
  ctx.shadowBlur = 40;
  
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
};

const extractPalette = (img: HTMLImageElement): Promise<string[]> => {
    return new Promise((resolve) => {
        try {
            const c = document.createElement('canvas');
            const x = c.getContext('2d');
            if (!x) {
                resolve(['#0a1b3f', '#0b1630']);
                return;
            }
            const w = 120, h = 120;
            c.width = w; c.height = h;
            x.drawImage(img, 0, 0, w, h);
            const data = x.getImageData(0, 0, w, h).data;
            const buckets: { [key: string]: number } = {};
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
                buckets[key] = (buckets[key] || 0) + 1;
            }
            const top = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => {
                const [r, g, b] = k.split(',').map(Number);
                return `rgb(${r},${g},${b})`;
            });
            resolve(top.length ? top : ['#0a1b3f', '#0b1630']);
        } catch (e) {
            console.warn('Palette extract failed', e);
            resolve(['#0a1b3f', '#0b1630']);
        }
    });
};

const imageElementToBase64 = (image: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
};


// --- UI COMPONENTS ---
interface ImageUploaderProps {
  id: string;
  hint: string;
  image: ImageData | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, hint, image, onImageChange, onImageRemove }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if(!image) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (!image) {
      const file = e.dataTransfer.files?.[0];
      if (file) onImageChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageChange(file);
  };

  return (
    <div
      onClick={() => !image && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`group relative h-[230px] rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 border-2 border-dashed ${!image ? 'bg-[var(--bg-interactive)] cursor-pointer' : ''} ${isDragging ? 'border-[var(--accent-cyan)] shadow-lg shadow-[var(--accent-cyan-glow)] bg-[var(--accent-blue)]/10' : 'border-[var(--border-color)] hover:border-[var(--accent-cyan)]'}`}
    >
      <input ref={inputRef} type="file" accept="image/*" id={id} className="hidden" onChange={handleFileChange} />
      {!image ? (
        <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-none">
          <div className="btn-gradient text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[var(--accent-blue-glow)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
            <i className="fas fa-upload mr-2"></i> {hint}
          </div>
          <p className="text-[var(--text-secondary)] mt-3 text-sm">{t('common.uploadPrompt')}</p>
        </div>
      ) : (
        <>
          <img src={image.url} alt="upload preview" className="absolute inset-0 w-full h-full object-cover" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageRemove();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-2 right-2 bg-black/60 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-10 text-xs font-bold"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export const ThumbnailGenerator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [ratio, setRatio] = useState<Ratio>('9:16');
  const [inputs, setInputs] = useState<Inputs>({ title: '', speaker: '', outfit: '', action: '', extra: '' });
  const [modelImage, setModelImage] = useState<ImageData | null>(null);
  const [refImage, setRefImage] = useState<ImageData | null>(null);
  const [palette, setPalette] = useState<string[]>(['#0a1b3f', '#0b1630']);
  const [status, setStatus] = useState('thumbnailDesigner.statusReady');
  const [statusColor, setStatusColor] = useState('text-[var(--accent-cyan)]');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<HTMLImageElement | null>(null);
  const [isSpeakerTooltipVisible, setIsSpeakerTooltipVisible] = useState(false);
  const [statusParams, setStatusParams] = useState({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speakerInputRef = useRef<HTMLInputElement>(null);
  
  // Effect to update status text when language changes
  useEffect(() => {
    // This effect simply re-triggers translation, the `t(status)` in the JSX does the work
  }, [i18n.language, status]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleSuggestionClick = (value: string) => {
    const syntheticEvent = {
        target: { id: 'speaker', value },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
    setIsSpeakerTooltipVisible(false);
    speakerInputRef.current?.blur();
  };
  
  const handleFileChange = async (file: File, type: 'model' | 'ref') => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();

    if (type === 'model') setModelImage({ element: img, url });
    else {
      setRefImage({ element: img, url });
      setPalette(await extractPalette(img));
    }
  };
  
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const is169 = ratio === '16:9';
    canvas.width = is169 ? 1920 : 1080;
    canvas.height = is169 ? 1080 : 1920;
    const W = canvas.width, H = canvas.height;

    if (generatedImage) {
        ctx.drawImage(generatedImage, 0, 0, W, H);
    } else {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, palette[0]);
        g.addColorStop(1, palette[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.lineWidth = Math.max(4, W * 0.005);
        ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    }

    const isPortrait = H > W;
    const personFrame = isPortrait
      ? { x: Math.round(W * 0.06), y: Math.round(H * 0.18), w: Math.round(W * 0.88), h: Math.round(H * 0.48) }
      : { x: Math.round(W * 0.55), y: Math.round(H * 0.12), w: Math.round(W * 0.38), h: Math.round(H * 0.76) };
    drawModel(ctx, modelImage?.element || null, personFrame);

    const margin = Math.round(W * 0.06);
    let tx = isPortrait ? margin : Math.round(W * 0.05);
    let ty = isPortrait ? Math.round(H * 0.68) : Math.round(H * 0.12);

    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 14;

    const f1 = `${Math.round(W * 0.06)}px Inter`, f2 = `${Math.round(W * 0.045)}px Inter`, f3 = `${Math.round(W * 0.03)}px Inter`;

    const box1 = drawTextBox(ctx, inputs.title || t('thumbnailDesigner.programTitleLabel'), tx, ty, W - tx - margin, Math.round(W * 0.015), f1, 800);
    ty += box1.h + Math.round(H * 0.015);
    const box2 = drawTextBox(ctx, inputs.speaker ? t('thumbnailDesigner.bySpeaker', { speaker: inputs.speaker }) : t('thumbnailDesigner.speakerLabel'), tx, ty, W - tx - margin, Math.round(W * 0.012), f2, 800);
    ty += box2.h + Math.round(H * 0.012);
    const box3 = drawTextBox(ctx, inputs.action || t('thumbnailDesigner.actionLabel'), tx, ty, W - tx - margin, Math.round(W * 0.01), f3, 700);
    ty += box3.h + Math.round(H * 0.01);
    
    ctx.shadowColor = 'transparent'; // Disable shadow for tip text
    const tip = `${inputs.outfit ? inputs.outfit + ' · ' : ''}${inputs.extra || ''}`.trim();
    if (tip) {
      ctx.font = `600 ${Math.round(W * 0.025)}px Inter`;
      ctx.fillStyle = 'rgba(234, 242, 255, 0.92)';
      ctx.fillText(tip, tx, ty);
    }
  }, [ratio, inputs, modelImage, palette, generatedImage, t]);

  useEffect(() => { renderCanvas() }, [renderCanvas]);

  const handleGenerate = async () => {
    if (!modelImage) {
      alert(t('thumbnailDesigner.errorNoModel'));
      return;
    }
    setIsGenerating(true);
    setStatus('thumbnailDesigner.statusGenerating');
    setStatusParams({});
    setStatusColor('text-sky-400');
    setGeneratedImage(null);
    await new Promise(res => setTimeout(res, 100));

    try {
        const result = await generateThumbnail({
            modelImage: imageElementToBase64(modelImage.element), 
            refImage: refImage ? imageElementToBase64(refImage.element) : null, 
            inputs, 
            ratio,
        });
        if (result.image) {
            const img = new Image();
            img.src = result.image;
            await img.decode();
            setGeneratedImage(img);
            setStatus('thumbnailDesigner.statusSuccess');
            setStatusColor('text-green-400');
            
            const a = document.createElement('a');
            a.href = result.image;
            a.download = `thumbnail_${ratio.replace(':', '-')}_AI.png`;
            a.click();
        } else throw new Error(result.error || 'Generation failed.');
    } catch (e) {
      console.error(e);
      const err = e instanceof Error ? e.message : String(e);
      setStatus('thumbnailDesigner.statusError');
      setStatusParams({ error: err });
      setStatusColor('text-red-400');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setStatus('thumbnailDesigner.statusReady');
        setStatusParams({});
        setStatusColor('text-[var(--accent-cyan)]');
      }, 4000);
    }
  };

  return (
    <div className="animate-fade-in mt-6">
        <div className="bg-[var(--bg-interactive)] border border-[var(--border-color)] rounded-2xl p-4 shadow-lg">
            <h3 className="m-0 mb-3 text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('thumbnailDesigner.uploadSectionTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-2">
                <ImageUploader id="fileModel" hint={t('thumbnailDesigner.modelHint')} image={modelImage} onImageChange={(f) => handleFileChange(f, 'model')} onImageRemove={() => setModelImage(null)} />
                <ImageUploader id="fileRef" hint={t('thumbnailDesigner.refHint')} image={refImage} onImageChange={(f) => handleFileChange(f, 'ref')} onImageRemove={() => setRefImage(null)} />
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-1">{t('thumbnailDesigner.note')}</p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-5 mt-5">
            <div className="bg-[var(--bg-interactive)] border border-[var(--border-color)] rounded-2xl p-4 shadow-lg">
                <h3 className="m-0 mb-3 text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('thumbnailDesigner.settingsTitle')}</h3>
                
                <div role="tablist" aria-label={t('thumbnailDesigner.ratioLabel')} className="inline-flex gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] p-1.5 rounded-xl mb-2">
                    {(['16:9', '9:16'] as Ratio[]).map((r) => (
                        <div key={r} onClick={() => setRatio(r)} className={`px-3 py-2 rounded-lg cursor-pointer select-none transition-colors ${ratio === r ? 'btn-gradient text-white font-extrabold' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}>
                            {r === '16:9' ? t('thumbnailDesigner.ratioHorizontal') : t('thumbnailDesigner.ratioVertical')}
                        </div>
                    ))}
                </div>

                <div>
                    <label htmlFor="title" className="block text-sm text-[var(--text-secondary)] my-2 font-semibold">{t('thumbnailDesigner.programTitleLabel')}</label>
                    <input id="title" type="text" value={inputs.title} onChange={handleInputChange} placeholder={t('thumbnailDesigner.programTitleLabel')} className="w-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent-blue)] transition-colors"/>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <div className="relative">
                        <label htmlFor="speaker" className="block text-sm text-[var(--text-secondary)] my-2 font-semibold">{t('thumbnailDesigner.speakerLabel')}</label>
                        <input 
                            ref={speakerInputRef}
                            id="speaker" 
                            type="text" 
                            value={inputs.speaker} 
                            onChange={handleInputChange} 
                            placeholder={t('thumbnailDesigner.speakerLabel')} 
                            className="w-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent-blue)] transition-colors"
                            onFocus={() => setIsSpeakerTooltipVisible(true)}
                            onBlur={() => setTimeout(() => setIsSpeakerTooltipVisible(false), 200)}
                        />
                         {isSpeakerTooltipVisible && (
                            <div className="absolute top-full z-10 mt-2 w-auto bg-white rounded-md shadow-lg p-1 animate-fade-in">
                                <div className="absolute -top-1 left-6 h-2 w-2 bg-white rotate-45"></div>
                                <div 
                                    className="text-black cursor-pointer px-4 py-2 hover:bg-gray-100 rounded text-base whitespace-nowrap"
                                    onClick={() => handleSuggestionClick('Kyoko Le')}
                                >
                                    Kyoko Le
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="outfit" className="block text-sm text-[var(--text-secondary)] my-2 font-semibold">{t('thumbnailDesigner.outfitLabel')}</label>
                        <input id="outfit" type="text" value={inputs.outfit} onChange={handleInputChange} placeholder={t('thumbnailDesigner.outfitLabel')} className="w-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent-blue)] transition-colors"/>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="action" className="block text-sm text-[var(--text-secondary)] my-2 font-semibold">{t('thumbnailDesigner.actionLabel')}</label>
                        <input id="action" type="text" value={inputs.action} onChange={handleInputChange} placeholder={t('thumbnailDesigner.actionLabel')} className="w-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent-blue)] transition-colors"/>
                    </div>
                    <div>
                        <label htmlFor="extra" className="block text-sm text-[var(--text-secondary)] my-2 font-semibold">{t('thumbnailDesigner.extraLabel')}</label>
                        <input id="extra" type="text" value={inputs.extra} onChange={handleInputChange} placeholder={t('thumbnailDesigner.extraLabel')} className="w-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent-blue)] transition-colors"/>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap mt-4">
                    <button onClick={renderCanvas} className="px-4 py-3 rounded-xl btn-secondary text-[var(--text-primary)] font-bold cursor-pointer">
                        {t('thumbnailDesigner.updatePreview')}
                    </button>
                    <button onClick={handleGenerate} disabled={isGenerating} className="px-4 py-3 rounded-xl btn-gradient text-white font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {isGenerating ? t('thumbnailDesigner.generatingButton') : t('thumbnailDesigner.generateButton')}
                    </button>
                    <span className={`inline-flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] ${statusColor} px-3 py-2 rounded-full font-bold text-sm transition-colors`}>
                        {t(status, statusParams)}
                    </span>
                </div>
            </div>
            
            <div className="bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-2xl p-2.5 min-h-[300px] flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-full h-auto rounded-lg shadow-2xl shadow-black/50"></canvas>
            </div>
        </div>
    </div>
  );
}
