
import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeSelector } from './creativestudio/ThemeSelector';
import type { MarketingProduct, MarketingSettings, MarketingResult, FashionAspectRatio } from '../types';
import { MARKETING_TEMPLATES, MARKETING_TONES, FASHION_ASPECT_RATIOS } from '../constants';
import { generateMarketingAdCopy, generateMarketingImage, generateMarketingVideoScript, generateMarketingVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Spinner } from './creativestudio/Spinner';
import { smartDownload } from '../utils/canvasUtils';

interface MarketingStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    isVip: boolean;
}

// FIX: Moved InputField outside of the component to prevent re-mounting on every render
const InputField = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (e: any) => void, placeholder: string }) => (
    <div>
        <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{label}</label>
        <input 
            type="text" 
            placeholder={placeholder} 
            value={value} 
            onChange={onChange} 
            className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all placeholder-gray-600" 
        />
    </div>
);

const MarketingStudio: React.FC<MarketingStudioProps> = ({ theme, setTheme, isVip }) => {
    const { t } = useTranslation();
    const [product, setProduct] = useState<MarketingProduct>({
        name: '', brand: '', category: '', price: '', merchant: '', rating: '4.5',
        features: '', pros: '', cons: '', productImage: null, referenceImage: null
    });
    const [settings, setSettings] = useState<MarketingSettings>({
        templateId: MARKETING_TEMPLATES[0].id,
        tone: 'professional',
        aspectRatio: '1:1',
        customAngle: '',
        highQuality: true
    });
    
    // Added prompt and seed state for display and manual control
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [seed, setSeed] = useState('');
    
    const [result, setResult] = useState<MarketingResult>({ adCopy: '', videoScript: '', generatedImageUrl: null, generatedVideoUrl: null });
    const [isLoading, setIsLoading] = useState({ ad: false, video: false, image: false, videoRender: false });
    const [activeTab, setActiveTab] = useState<'image' | 'ad' | 'video'>('image');
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
    
    const productInputRef = useRef<HTMLInputElement>(null);
    const refInputRef = useRef<HTMLInputElement>(null);

    // Helpers
    const handleProductChange = (field: keyof MarketingProduct, value: any) => setProduct(prev => ({ ...prev, [field]: value }));
    const handleSettingsChange = (field: keyof MarketingSettings, value: any) => setSettings(prev => ({ ...prev, [field]: value }));
    
    const triggerUpload = (ref: React.RefObject<HTMLInputElement>) => ref.current?.click();
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'productImage' | 'referenceImage') => {
        if (e.target.files?.[0]) handleProductChange(field, e.target.files[0]);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(t('actionBar.copiedToClipboard'));
    };
    
    const copyPayload = () => {
        const payload = {
            product,
            settings,
            seed
        };
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        alert(t('actionBar.copiedToClipboard'));
    }

    const getActiveImageBase64 = async (): Promise<{ base64: string, mimeType: string } | null> => {
        // Priority: Generated Image > Uploaded Product Image
        if (result.generatedImageUrl) {
            return {
                base64: result.generatedImageUrl.split(',')[1],
                mimeType: 'image/png'
            };
        }
        if (product.productImage) {
            return await fileToBase64(product.productImage);
        }
        return null;
    };

    // Actions
    const generateAd = async () => {
        if (!product.name) return alert(t('errors.fillAllFields'));
        setIsLoading(prev => ({ ...prev, ad: true }));
        try {
            const imageData = await getActiveImageBase64();
            const imagePart = imageData ? { inlineData: { data: imageData.base64, mimeType: imageData.mimeType } } : undefined;

            const textProduct = {
                name: product.name, brand: product.brand, category: product.category,
                price: product.price, merchant: product.merchant, rating: product.rating,
                features: product.features, pros: product.pros, cons: product.cons
            };
            const copy = await generateMarketingAdCopy(textProduct, imagePart);
            setResult(prev => ({ ...prev, adCopy: copy }));
            setActiveTab('ad');
        } catch (e) { console.error(e); }
        finally { setIsLoading(prev => ({ ...prev, ad: false })); }
    };

    const generateVideoScript = async () => {
        if (!product.name) return alert(t('errors.fillAllFields'));
        setIsLoading(prev => ({ ...prev, video: true }));
        try {
            const imageData = await getActiveImageBase64();
            const imagePart = imageData ? { inlineData: { data: imageData.base64, mimeType: imageData.mimeType } } : undefined;

            const textProduct = {
                name: product.name, brand: product.brand, category: product.category,
                price: product.price, merchant: product.merchant, rating: product.rating,
                features: product.features, pros: product.pros, cons: product.cons
            };
            const script = await generateMarketingVideoScript(textProduct, settings.tone, settings.customAngle, imagePart);
            setResult(prev => ({ ...prev, videoScript: script }));
            setActiveTab('video');
        } catch (e) { console.error(e); }
        finally { setIsLoading(prev => ({ ...prev, video: false })); }
    };

    const generateImage = async () => {
        if (!product.productImage) return alert(t('errors.uploadRequired'));
        setIsLoading(prev => ({ ...prev, image: true }));
        try {
            const prodImg = await fileToBase64(product.productImage);
            const refImg = product.referenceImage ? await fileToBase64(product.referenceImage) : null;
            
            // Mock setting the prompt for display purposes (since the real prompt is built server side)
            // In a real app we might return this from the server
            setGeneratedPrompt(`[Generating for ${product.name} with template ${settings.templateId}]...`);

            const url = await generateMarketingImage(
                { inlineData: { data: prodImg.base64, mimeType: prodImg.mimeType } },
                refImg ? { inlineData: { data: refImg.base64, mimeType: refImg.mimeType } } : null,
                { name: product.name, brand: product.brand, category: product.category, features: product.features },
                settings
            );
            setResult(prev => ({ ...prev, generatedImageUrl: url }));
            setActiveTab('image');
            setGeneratedPrompt(t('marketingStudio.results.imagePlaceholder')); // Reset prompt or update with real one if returned
        } catch (e) { console.error(e); }
        finally { setIsLoading(prev => ({ ...prev, image: false })); }
    };

    const renderVideo = async () => {
        const imageData = await getActiveImageBase64();
        if (!imageData) return alert(t('errors.uploadRequired'));
        if (!result.videoScript) return alert("Vui lòng tạo kịch bản video trước.");

        // Check for Veo API Key (or use server environment)
        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyPrompt(true);
            return;
        }
        setShowApiKeyPrompt(false);

        setIsLoading(prev => ({ ...prev, videoRender: true }));
        setResult(prev => ({ ...prev, generatedVideoUrl: null }));

        try {
            const videoUrl = await generateMarketingVideo(
                `data:${imageData.mimeType};base64,${imageData.base64}`, 
                result.videoScript, 
                (msg) => console.log(msg)
            );
            setResult(prev => ({ ...prev, generatedVideoUrl: videoUrl }));
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes("Requested entity was not found")) {
                alert("API Key không hợp lệ hoặc đã hết hạn. Vui lòng chọn lại.");
                setShowApiKeyPrompt(true);
            } else {
                alert("Lỗi tạo video: " + e.message);
            }
        } finally {
            setIsLoading(prev => ({ ...prev, videoRender: false }));
        }
    };

    const productImagePreview = useMemo(() => product.productImage ? URL.createObjectURL(product.productImage) : null, [product.productImage]);
    const refImagePreview = useMemo(() => product.referenceImage ? URL.createObjectURL(product.referenceImage) : null, [product.referenceImage]);

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 font-sans animate-fade-in h-full overflow-hidden">
            <header className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6 flex-shrink-0">
                <div />
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {t('marketingStudio.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('marketingStudio.subtitle')}</p>
                </div>
                <div className="flex justify-end"><ThemeSelector currentTheme={theme} onChangeTheme={setTheme} /></div>
            </header>

            <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 min-h-0 flex-1 overflow-hidden">
                {/* Left Column: Inputs */}
                <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin pr-2 pb-10">
                    
                    {/* Section 1: Product Info */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-xl border border-[var(--border-color)] shadow-lg">
                        <div className="flex items-center gap-2 mb-5 pb-2 border-b border-white/10">
                            <span className="bg-[var(--accent-cyan)] text-white text-xs font-bold px-2 py-0.5 rounded">1</span>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('marketingStudio.sections.productInfo')}</h3>
                        </div>
                        
                        <div className="space-y-5">
                            <InputField 
                                label={t('marketingStudio.labels.name')} 
                                placeholder={t('marketingStudio.placeholders.name')} 
                                value={product.name} 
                                onChange={e => handleProductChange('name', e.target.value)} 
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label={t('marketingStudio.labels.brand')} 
                                    placeholder={t('marketingStudio.placeholders.brand')} 
                                    value={product.brand} 
                                    onChange={e => handleProductChange('brand', e.target.value)} 
                                />
                                <InputField 
                                    label={t('marketingStudio.labels.category')} 
                                    placeholder={t('marketingStudio.placeholders.category')} 
                                    value={product.category} 
                                    onChange={e => handleProductChange('category', e.target.value)} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label={t('marketingStudio.labels.price')} 
                                    placeholder={t('marketingStudio.placeholders.price')} 
                                    value={product.price} 
                                    onChange={e => handleProductChange('price', e.target.value)} 
                                />
                                <InputField 
                                    label={t('marketingStudio.labels.merchant')} 
                                    placeholder={t('marketingStudio.placeholders.merchant')} 
                                    value={product.merchant} 
                                    onChange={e => handleProductChange('merchant', e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.features')}</label>
                                <textarea 
                                    placeholder={t('marketingStudio.placeholders.features')} 
                                    value={product.features} 
                                    onChange={e => handleProductChange('features', e.target.value)} 
                                    rows={3} 
                                    className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all placeholder-gray-600" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-green-400 mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.pros')}</label>
                                    <textarea 
                                        placeholder={t('marketingStudio.placeholders.pros')} 
                                        value={product.pros} 
                                        onChange={e => handleProductChange('pros', e.target.value)} 
                                        rows={2} 
                                        className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all placeholder-gray-600" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-400 mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.cons')}</label>
                                    <textarea 
                                        placeholder={t('marketingStudio.placeholders.cons')} 
                                        value={product.cons} 
                                        onChange={e => handleProductChange('cons', e.target.value)} 
                                        rows={2} 
                                        className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all placeholder-gray-600" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Media */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-xl border border-[var(--border-color)] shadow-lg">
                        <div className="flex items-center gap-2 mb-5 pb-2 border-b border-white/10">
                            <span className="bg-[var(--accent-cyan)] text-white text-xs font-bold px-2 py-0.5 rounded">2</span>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('marketingStudio.sections.media')}</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 text-center uppercase">{t('marketingStudio.media.productImage')}</label>
                                <div onClick={() => triggerUpload(productInputRef)} className="aspect-square bg-[var(--bg-interactive)] rounded-lg border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-cyan)] overflow-hidden relative transition-all group">
                                    <input type="file" ref={productInputRef} hidden accept="image/*" onChange={e => handleFileChange(e, 'productImage')} />
                                    {productImagePreview ? (
                                        <>
                                            <img src={productImagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-edit text-white"></i></div>
                                        </>
                                    ) : (
                                        <div className="text-center text-xs text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)]">
                                            <i className="fas fa-plus text-2xl mb-2 block"></i>
                                            {t('marketingStudio.media.noFile')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 text-center uppercase">{t('marketingStudio.media.refImage')}</label>
                                <div onClick={() => triggerUpload(refInputRef)} className="aspect-square bg-[var(--bg-interactive)] rounded-lg border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-cyan)] overflow-hidden relative transition-all group">
                                    <input type="file" ref={refInputRef} hidden accept="image/*" onChange={e => handleFileChange(e, 'referenceImage')} />
                                    {refImagePreview ? (
                                        <>
                                            <img src={refImagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-edit text-white"></i></div>
                                        </>
                                    ) : (
                                        <div className="text-center text-xs text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)]">
                                            <i className="fas fa-user text-2xl mb-2 block"></i>
                                            {t('marketingStudio.media.noFile')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-3 italic text-center">{t('marketingStudio.media.uploadTip')}</p>
                    </div>

                    {/* Section 3: AI Settings */}
                    <div className="bg-[var(--bg-component)] p-5 rounded-xl border border-[var(--border-color)] shadow-lg">
                        <div className="flex items-center gap-2 mb-5 pb-2 border-b border-white/10">
                            <span className="bg-[var(--accent-cyan)] text-white text-xs font-bold px-2 py-0.5 rounded">3</span>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">{t('marketingStudio.sections.aiSettings')}</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.template')}</label>
                                <select value={settings.templateId} onChange={e => handleSettingsChange('templateId', e.target.value)} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all">
                                    {MARKETING_TEMPLATES.map(template => <option key={template.id} value={template.id}>{t(template.labelKey)}</option>)}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.tone')}</label>
                                    <select value={settings.tone} onChange={e => handleSettingsChange('tone', e.target.value)} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all">
                                        {MARKETING_TONES.map(tone => <option key={tone.id} value={tone.id}>{t(tone.labelKey)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.aspectRatio')}</label>
                                    <select value={settings.aspectRatio} onChange={e => handleSettingsChange('aspectRatio', e.target.value)} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all">
                                        {FASHION_ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{t(r.labelKey)}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Seed Input */}
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.seed')}</label>
                                <input 
                                    type="text" 
                                    placeholder="(Optional)" 
                                    value={seed} 
                                    onChange={e => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all placeholder-gray-600" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">{t('marketingStudio.labels.customAngle')}</label>
                                <textarea 
                                    placeholder={t('marketingStudio.placeholders.customAngle')} 
                                    value={settings.customAngle} 
                                    onChange={e => handleSettingsChange('customAngle', e.target.value)} 
                                    rows={2} 
                                    className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent transition-all placeholder-gray-600" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="flex flex-col bg-[var(--bg-component)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
                     {/* Prompt Preview */}
                    <div className="p-4 bg-[var(--bg-interactive)] border-b border-[var(--border-color)]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{t('marketingStudio.results.imagePrompt')}</label>
                             <div className="flex gap-2">
                                <button onClick={() => copyToClipboard(generatedPrompt)} className="text-xs bg-[var(--bg-component)] hover:bg-white/10 border border-[var(--border-color)] px-2 py-1 rounded text-[var(--text-secondary)] transition-colors">
                                    {t('marketingStudio.actions.copyPrompt')}
                                </button>
                                <button onClick={copyPayload} className="text-xs bg-[var(--bg-component)] hover:bg-white/10 border border-[var(--border-color)] px-2 py-1 rounded text-[var(--text-secondary)] transition-colors">
                                    {t('marketingStudio.actions.copyPayload')}
                                </button>
                            </div>
                        </div>
                        <textarea 
                            value={generatedPrompt}
                            readOnly
                            placeholder={t('marketingStudio.results.promptPlaceholder')}
                            className="w-full bg-[var(--bg-deep-space)] border border-white/10 rounded-lg p-2 text-xs text-[var(--text-secondary)] resize-none focus:outline-none h-16"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border-color)]">
                        <button onClick={() => setActiveTab('image')} className={`flex-1 py-3 text-sm font-bold transition-all uppercase tracking-wider ${activeTab === 'image' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}>{t('marketingStudio.results.image')}</button>
                        <button onClick={() => setActiveTab('ad')} className={`flex-1 py-3 text-sm font-bold transition-all uppercase tracking-wider ${activeTab === 'ad' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}>{t('marketingStudio.results.adCopy')}</button>
                        <button onClick={() => setActiveTab('video')} className={`flex-1 py-3 text-sm font-bold transition-all uppercase tracking-wider ${activeTab === 'video' ? 'bg-[var(--bg-interactive)] text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}>{t('marketingStudio.results.videoScript')}</button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 relative flex flex-col">
                        {activeTab === 'image' && (
                            <div className="h-full flex flex-col items-center justify-center gap-6">
                                <div className="flex-1 w-full flex items-center justify-center bg-[var(--bg-deep-space)] rounded-xl border border-[var(--border-color)] overflow-hidden relative group shadow-inner">
                                    {isLoading.image ? (
                                        <div className="text-center"><Spinner /><p className="mt-4 text-sm font-semibold animate-pulse text-[var(--accent-cyan)]">{t('marketingStudio.actions.generating')}</p></div>
                                    ) : result.generatedImageUrl ? (
                                        <>
                                            <img src={result.generatedImageUrl} className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => smartDownload(result.generatedImageUrl!, 'marketing-image.png')} className="btn-secondary text-white py-3 px-6 rounded-lg font-bold flex items-center gap-2 transform hover:scale-105 transition-transform"><i className="fas fa-download"></i>{t('common.download')}</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[var(--text-muted)] text-center opacity-50">
                                            <i className="fas fa-image text-6xl mb-4 block"></i>
                                            <p className="text-lg font-medium">{t('marketingStudio.results.imagePlaceholder')}</p>
                                        </div>
                                    )}
                                </div>
                                <button onClick={generateImage} disabled={isLoading.image || !product.productImage} className="w-full btn-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"><i className="fas fa-magic"></i>{t('marketingStudio.actions.generateImage')}</button>
                            </div>
                        )}

                        {activeTab === 'ad' && (
                            <div className="h-full flex flex-col gap-4">
                                <div className="flex-1 bg-[var(--bg-deep-space)] rounded-xl border border-[var(--border-color)] p-6 overflow-y-auto whitespace-pre-wrap relative shadow-inner text-[var(--text-primary)] leading-relaxed">
                                    {isLoading.ad ? <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div> : (result.adCopy || <span className="text-[var(--text-muted)] italic">{t('marketingStudio.results.adCopyPlaceholder')}</span>)}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={generateAd} disabled={isLoading.ad} className="flex-1 btn-gradient text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"><i className="fas fa-pen-nib"></i>{t('marketingStudio.actions.generateAd')}</button>
                                    <button onClick={() => copyToClipboard(result.adCopy)} disabled={!result.adCopy} className="btn-secondary px-6 rounded-lg hover:bg-white/10 transition-colors"><i className="fas fa-copy"></i></button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'video' && (
                            <div className="h-full flex flex-col gap-4">
                                {showApiKeyPrompt && (
                                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg text-left text-sm animate-fade-in" role="alert">
                                        <strong className="font-bold flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> {t('videoCreator.apiKeySelect.title')}</strong>
                                        <p className="mt-1">{t('videoCreator.apiKeySelect.description')} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white transition-colors">{t('videoCreator.apiKeySelect.docs')}</a>.</p>
                                        <button onClick={async () => {
                                            if (window.aistudio) {
                                                await window.aistudio.openSelectKey();
                                                setShowApiKeyPrompt(false);
                                            }
                                        }} className="mt-3 btn-gradient text-white font-bold py-1.5 px-4 rounded-md text-xs hover:opacity-90">
                                            {t('videoCreator.apiKeySelect.button')}
                                        </button>
                                    </div>
                                )}

                                <div className="flex-1 bg-[var(--bg-deep-space)] rounded-xl border border-[var(--border-color)] p-4 overflow-y-auto whitespace-pre-wrap relative flex flex-col shadow-inner">
                                    {isLoading.video ? (
                                        <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div>
                                    ) : (
                                        <>
                                            <div className="flex-1 mb-4 overflow-y-auto max-h-[40%] border-b border-white/10 pb-4">
                                                <h4 className="text-xs font-bold text-[var(--accent-cyan)] mb-2 uppercase tracking-wide">AI Script Idea:</h4>
                                                <div className="text-sm text-[var(--text-primary)] leading-relaxed">
                                                    {result.videoScript || <span className="text-[var(--text-muted)] italic">{t('marketingStudio.results.videoScriptPlaceholder')}</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col items-center justify-center bg-black/40 rounded-lg relative overflow-hidden border border-white/5">
                                                {isLoading.videoRender ? (
                                                    <div className="text-center">
                                                        <Spinner />
                                                        <p className="mt-3 text-xs text-[var(--accent-cyan)] font-bold animate-pulse">Rendering Video (Veo Model)...</p>
                                                        <p className="text-[10px] text-[var(--text-muted)] mt-1">This may take a minute.</p>
                                                    </div>
                                                ) : result.generatedVideoUrl ? (
                                                    <video controls src={result.generatedVideoUrl} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="text-center text-[var(--text-muted)] text-sm opacity-50">
                                                        <i className="fas fa-film text-4xl mb-2 block"></i>
                                                        <p>Video Preview Area</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={generateVideoScript} disabled={isLoading.video} className="flex-1 btn-secondary text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"><i className="fas fa-file-alt"></i>{t('marketingStudio.actions.generateVideoScript')}</button>
                                    <button onClick={renderVideo} disabled={isLoading.videoRender || !result.videoScript} className="flex-1 btn-gradient text-white font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"><i className="fas fa-video"></i>{t('marketingStudio.actions.renderVideo')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MarketingStudio;
