
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import { generateArtStyleImages } from '../services/geminiService';
import { fileToResizedDataURL } from '../utils/fileUtils';
import { smartDownload } from '../utils/canvasUtils';
import type { ArtStyleUploadedFile } from '../types';

interface ArtStyleStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

// Sub-component: Upload Card (Styled with app theme)
const UploadCard: React.FC<{
    title: string;
    subtitle?: string;
    file: ArtStyleUploadedFile | null;
    onFile: (file: File) => void;
    onClear: () => void;
    labelSelect: string;
}> = ({ title, subtitle, file, onFile, onClear, labelSelect }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
    };

    return (
        <div
            className={`rounded-2xl border-2 border-dashed p-4 transition-colors relative flex flex-col justify-between h-full min-h-[220px] ${
                dragOver ? 'border-[var(--accent-cyan)] bg-[var(--bg-interactive-hover)]' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-cyan)]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{title}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{subtitle}</div>
                </div>
                {file && (
                    <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-red-400 hover:text-red-300 p-1">
                        <i className="fas fa-times"></i>
                    </button>
                )}
            </div>

            <div 
                className="flex-1 flex items-center justify-center cursor-pointer overflow-hidden rounded-xl relative"
                onClick={() => inputRef.current?.click()}
            >
                {file ? (
                    <img src={file.previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-[var(--text-muted)] group">
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-interactive)] flex items-center justify-center mb-2 group-hover:bg-[var(--accent-cyan)] group-hover:text-white transition-colors">
                            <i className="fas fa-upload"></i>
                        </div>
                        <span className="text-xs font-medium group-hover:text-[var(--text-primary)] transition-colors">{labelSelect}</span>
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { e.target.value = ''; onFile(f); }
                }}
            />
        </div>
    );
};

// Sub-component: Check Pill
const CheckPill: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; labelKey: string }> = ({ label, checked, onChange, labelKey }) => {
    const { t } = useTranslation();
    return (
        <label className={`cursor-pointer select-none inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${checked ? 'bg-[var(--bg-interactive)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-[var(--accent-cyan)] border-[var(--accent-cyan)]' : 'border-[var(--text-muted)]'}`}>
                {checked && <i className="fas fa-check text-white text-[10px]"></i>}
            </div>
            <span className="text-sm font-medium">{t(labelKey)}</span>
            <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        </label>
    );
};

// Sub-component: Chip
const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
            active ? 'bg-[var(--accent-cyan)] text-white border-[var(--accent-cyan)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
        }`}
    >
        {label}
    </button>
);

const ArtStyleStudio: React.FC<ArtStyleStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t, i18n } = useTranslation();
    // Upload states
    const [model, setModel] = useState<ArtStyleUploadedFile | null>(null);
    const [clothing, setClothing] = useState<ArtStyleUploadedFile | null>(null);
    const [accessories, setAccessories] = useState<ArtStyleUploadedFile | null>(null);
    const [product, setProduct] = useState<ArtStyleUploadedFile | null>(null);

    // Options
    const styleOptions = ["Professional", "Luxury", "Natural", "Modern", "SkinFocus", "Artistic", "Cinematic"];
    const [styles, setStyles] = useState<string[]>(["Professional"]);
    
    const qualityOptions = ["1080p", "2K", "4K", "8K"];
    const [quality, setQuality] = useState("8K");
    
    // Updated aspect options to use keys for translation
    const aspectOptions = [
        { value: "9:16", labelKey: "artStyleStudio.ratios.portrait" },
        { value: "16:9", labelKey: "artStyleStudio.ratios.landscape" },
        { value: "1:1", labelKey: "artStyleStudio.ratios.square" }
    ];
    const [aspect, setAspect] = useState("9:16");

    const [count, setCount] = useState(2);
    const [userPrompt, setUserPrompt] = useState("");
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const setFileWithPreview = async (file: File, setter: React.Dispatch<React.SetStateAction<ArtStyleUploadedFile | null>>) => {
        if (file.size > 15 * 1024 * 1024) {
            setError(t('artStyleStudio.errors.fileTooLarge'));
            return;
        }
        const previewUrl = await fileToResizedDataURL(file);
        setter({ file, previewUrl });
        setError(null);
    };

    const toggleStyle = (label: string, checked: boolean) => {
        setStyles((prev) => {
            const s = new Set(prev);
            if (checked) s.add(label); else s.delete(label);
            return Array.from(s);
        });
    };

    const onSuggestPrompt = () => {
        const isVi = i18n.language.startsWith('vi');
        const parts = [];
        
        if(model) parts.push(isVi ? "người mẫu thời trang" : "fashion model");
        if(product) parts.push(isVi ? "tương tác với sản phẩm" : "interacting with product");
        if(clothing) parts.push(isVi ? "mặc trang phục" : "wearing outfit");
        if(accessories) parts.push(isVi ? "đeo phụ kiện" : "wearing accessories");
        
        const localizedStyles = styles.map(s => t(`artStyleStudio.styles.${s}`));
        parts.push(...localizedStyles);
        
        if (isVi) {
            parts.push("chất lượng cao", "ánh sáng studio chuyên nghiệp", "độ phân giải 8k");
        } else {
            parts.push("high quality", "professional studio lighting", "8k resolution");
        }
        
        setUserPrompt(parts.join(', '));
    };

    const onGenerate = async () => {
        if (!model) {
            setError(t('artStyleStudio.errors.modelRequired'));
            return;
        }
        setLoading(true);
        setPreviews([]);
        setError(null);

        try {
            const payload = {
                modelFile: model,
                otherFiles: { clothing: clothing || undefined, accessories: accessories || undefined, product: product || undefined },
                styles,
                quality,
                aspect,
                count,
                userPrompt: userPrompt || t('artStyleStudio.defaultPrompt'),
            };
            
            const urls = await generateArtStyleImages(payload);
            setPreviews(urls);
        } catch (e: any) {
            console.error(e);
            const msg = e.message || t('errors.unknownError');
            setError(t('errors.generationFailed', { error: msg }));
        } finally {
            setLoading(false);
        }
    };

    const downloadAll = () => {
        previews.forEach((url, i) => smartDownload(url, `art-style-${i}.png`));
    };

    return (
        <div className="flex-1 flex flex-col font-sans animate-fade-in h-full">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 pt-6 pb-2">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('artStyleStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('artStyleStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 min-h-0">
                
                {/* Left Panel: Inputs */}
                <div className="flex flex-col gap-6 overflow-y-auto scrollbar-thin pr-2 pb-10">
                    
                    {/* Upload Section */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-2xl border border-[var(--border-color)] shadow-lg">
                        <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 uppercase tracking-wide">
                            {t('artStyleStudio.uploadSection')}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <UploadCard labelSelect={t('artStyleStudio.selectImage')} title={t('artStyleStudio.modelTitle')} file={model} onFile={(f) => setFileWithPreview(f, setModel)} onClear={() => setModel(null)} />
                            <UploadCard labelSelect={t('artStyleStudio.selectImage')} title={t('artStyleStudio.productTitle')} file={product} onFile={(f) => setFileWithPreview(f, setProduct)} onClear={() => setProduct(null)} />
                            <UploadCard labelSelect={t('artStyleStudio.selectImage')} title={t('artStyleStudio.clothingTitle')} subtitle={t('artStyleStudio.clothingSubtitle')} file={clothing} onFile={(f) => setFileWithPreview(f, setClothing)} onClear={() => setClothing(null)} />
                            <UploadCard labelSelect={t('artStyleStudio.selectImage')} title={t('artStyleStudio.accessoriesTitle')} subtitle={t('artStyleStudio.accessoriesSubtitle')} file={accessories} onFile={(f) => setFileWithPreview(f, setAccessories)} onClear={() => setAccessories(null)} />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">{t('artStyleStudio.uploadHint')}</p>
                    </div>

                    {/* Settings Section */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-2xl border border-[var(--border-color)] shadow-lg">
                        <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 uppercase tracking-wide">
                            {t('artStyleStudio.styleSection')}
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">{t('artStyleStudio.styleLabel')}</label>
                            <div className="flex flex-wrap gap-2">
                                {styleOptions.map(opt => (
                                    <CheckPill key={opt} label={opt} labelKey={`artStyleStudio.styles.${opt}`} checked={styles.includes(opt)} onChange={(v) => toggleStyle(opt, v)} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">{t('artStyleStudio.qualityLabel')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {qualityOptions.map(q => <Chip key={q} label={q} active={quality === q} onClick={() => setQuality(q)} />)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">{t('artStyleStudio.aspectLabel')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {aspectOptions.map(a => (
                                        <Chip 
                                            key={a.value} 
                                            label={t(a.labelKey) + ` (${a.value})`} 
                                            active={aspect === a.value} 
                                            onClick={() => setAspect(a.value)} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prompt & Action */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-2xl border border-[var(--border-color)] shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('artStyleStudio.promptSection')}</h3>
                            <button onClick={onSuggestPrompt} className="text-xs bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] px-2 py-1 rounded text-[var(--accent-cyan)] transition-colors">
                                {t('artStyleStudio.suggestPrompt')}
                            </button>
                        </div>
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder={t('artStyleStudio.promptPlaceholder')}
                            className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all min-h-[80px]"
                        />
                        
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{t('artStyleStudio.imageCount')}:</span>
                                <input 
                                    type="number" min={1} max={4} value={count} 
                                    onChange={(e) => setCount(Math.max(1, Math.min(4, parseInt(e.target.value))))}
                                    className="w-14 bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md p-1 text-center font-bold"
                                />
                            </div>
                            <button 
                                onClick={onGenerate}
                                disabled={loading || !model}
                                className="flex-1 btn-gradient text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> {t('artStyleStudio.generating')}</>
                                ) : (
                                    <><i className="fas fa-magic"></i> {t('artStyleStudio.generate', { count })}</>
                                )}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="flex flex-col gap-4 h-full min-h-0">
                    <div className="flex-1 bg-[var(--bg-component)] rounded-2xl border border-[var(--border-color)] shadow-lg p-4 overflow-y-auto scrollbar-thin">
                        <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-2">
                            <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('artStyleStudio.previewSection')}</h3>
                            {previews.length > 0 && (
                                <button onClick={downloadAll} className="text-xs bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] px-3 py-1.5 rounded-full text-[var(--text-primary)] transition-colors">
                                    <i className="fas fa-download mr-1"></i> {t('artStyleStudio.downloadAll')}
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: count }).map((_, i) => (
                                    <div key={i} className="aspect-[3/4] bg-[var(--bg-interactive)] rounded-xl animate-pulse flex items-center justify-center">
                                        <i className="fas fa-image text-4xl text-[var(--text-muted)] opacity-20"></i>
                                    </div>
                                ))}
                            </div>
                        ) : previews.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {previews.map((url, i) => (
                                    <div key={i} className="group relative rounded-xl overflow-hidden shadow-md bg-black">
                                        <img src={url} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxUrl(url)} />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => smartDownload(url, `art-style-${i}.png`)} className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
                                                <i className="fas fa-download"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60">
                                <i className="fas fa-palette text-6xl mb-4"></i>
                                <p>{t('artStyleStudio.emptyPreview')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Simple Lightbox */}
            {lightboxUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
                    <img src={lightboxUrl} className="max-w-full max-h-full rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white text-4xl" onClick={() => setLightboxUrl(null)}>&times;</button>
                </div>
            )}
        </div>
    );
};

export default ArtStyleStudio;
