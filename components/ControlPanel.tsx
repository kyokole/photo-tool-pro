
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings, AspectRatio, BackgroundMode, OutfitMode, HairStyle, PrintLayout, PaperBackground, AccordionSection, User } from '../types';
import { OUTFIT_PRESETS } from '../constants';
import { getFixedCount } from '../utils/canvasUtils';

interface ControlPanelProps {
  settings: Settings;
  onDestructiveSettingChange: React.Dispatch<React.SetStateAction<Settings>>;
  onPrintSettingChange: React.Dispatch<React.SetStateAction<Settings>>;
  isVisible: boolean;
  hasProcessedImage: boolean;
  activeSection: AccordionSection;
  setActiveSection: (section: AccordionSection) => void;
  onOutfitUpload: () => void;
  onClearOutfit: () => void;
  originalImage: string | null;
  enabledSections: AccordionSection[];
  isVip: boolean;
  isFreeTierLocked: boolean;
  onContactClick: () => void;
  title?: string;
  currentUser?: User | null; // Added currentUser to determine lock state more granularly
}

const VipLockOverlay: React.FC<{ onContactClick: () => void }> = ({ onContactClick }) => {
    const { t } = useTranslation();
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4 rounded-lg">
            <i className="fas fa-lock text-3xl text-yellow-400 mb-3"></i>
            <p className="font-semibold text-yellow-300">{t('controlPanel.vipLock.title')}</p>
            <p className="text-xs text-gray-300 mb-4">{t('controlPanel.vipLock.description')}</p>
            <button onClick={onContactClick} className="btn-secondary text-sm py-1 px-3">{t('controlPanel.vipLock.button')}</button>
        </div>
    );
};

// Component for locking specific sub-features for guests
const GuestLockOverlay: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
            <div className="bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-2 border border-yellow-500/30">
                <i className="fas fa-crown text-yellow-400 text-xs"></i>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{title}</span>
            </div>
        </div>
    );
};


export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onDestructiveSettingChange,
  onPrintSettingChange,
  isVisible,
  hasProcessedImage,
  activeSection,
  setActiveSection,
  onOutfitUpload,
  onClearOutfit,
  originalImage,
  enabledSections,
  isVip,
  isFreeTierLocked,
  onContactClick,
  title,
  currentUser
}) => {
  const { t } = useTranslation();
  
  // Logic Update:
  // 1. isFreeTierLocked: Only true for GUESTS after generation to force reload/login.
  // 2. isGuest: Checks if user is logged in.
  const isGuest = !currentUser;
  
  // If isFreeTierLocked is true (post-generation guest), lock whole panel.
  // If not locked, but is guest, lock specific premium features.
  const isGlobalLocked = isFreeTierLocked; 

  if (!isVisible) {
    return null;
  }
  
  const handleAspectRatioSelect = (ratio: AspectRatio) => {
      // After first generation, changing aspect ratio should not reset the image for non-vips
      const changeHandler = (isGlobalLocked || hasProcessedImage) ? onPrintSettingChange : onDestructiveSettingChange;
      changeHandler(prev => ({ ...prev, aspectRatio: ratio }));
      // Restore auto-advancing wizard for new images
      if (!isGlobalLocked && !hasProcessedImage) {
        setActiveSection('background');
      }
  };

  const handleBackgroundModeSelect = (mode: BackgroundMode) => {
      onDestructiveSettingChange(prev => ({
          ...prev,
          background: { ...prev.background, mode: mode },
      }));
      setActiveSection('outfit');
  };

  const handleKeepOutfitToggle = (checked: boolean) => {
      onDestructiveSettingChange(prev => ({
          ...prev,
          outfit: { ...prev.outfit, keepOriginal: checked },
      }));
      if (checked) {
          setActiveSection('face');
      }
  };
  
  const handleOutfitModeChange = (mode: OutfitMode) => {
      onDestructiveSettingChange(prev => ({
          ...prev,
          outfit: { ...prev.outfit, mode: mode },
      }));
  };

  const handleOutfitPresetSelect = (presetValue: string) => {
      onDestructiveSettingChange(prev => ({
          ...prev,
          outfit: { ...prev.outfit, mode: 'preset', preset: presetValue },
      }));
      setActiveSection('face');
  };
  
  const handleNestedDestructiveChange = (field: 'background' | 'outfit' | 'face', subField: string, value: any) => {
    onDestructiveSettingChange(prev => ({
        ...prev,
        [field]: { ...prev[field], [subField]: value },
    }));
  };

  const photoCount = hasProcessedImage && settings.printLayout !== 'none'
    ? getFixedCount(settings.printLayout, settings.aspectRatio)
    : null;

  const getOptionButtonClass = (isActive: boolean) => {
    const base = 'py-2 px-3 rounded-md text-sm transition-all duration-200 w-full transform hover:-translate-y-0.5';
    if (isActive) {
      return `${base} btn-gradient text-white font-semibold shadow-md`;
    }
    return `${base} bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`;
  };
  
  const getWizardTabClass = (isActive: boolean) => {
    const base = 'flex-1 p-3 text-sm font-semibold text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 rounded-t-lg border-b-2';
    if (isActive) {
        return `${base} text-white bg-[var(--bg-interactive)] border-[var(--accent-cyan)]`;
    }
    return `${base} text-[var(--text-secondary)] border-transparent hover:text-white hover:bg-[var(--bg-interactive)]`;
  }

  const SECTIONS: { id: AccordionSection; titleKey: string; icon: string }[] = [
      { id: 'layout', titleKey: 'controlPanel.tabs.layout', icon: 'fa-ruler-combined' },
      { id: 'background', titleKey: 'controlPanel.tabs.background', icon: 'fa-image' },
      { id: 'outfit', titleKey: 'controlPanel.tabs.outfit', icon: 'fa-tshirt' },
      { id: 'face', titleKey: 'controlPanel.tabs.face', icon: 'fa-user' },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
        case 'layout':
            return (
                <div className="space-y-3 animate-fade-in">
                    <p className="text-sm text-[var(--text-secondary)]">{t('controlPanel.layout.description')}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {(['2x3', '3x4', '4x6', '5x5'] as AspectRatio[]).map(ratio => (
                            <button key={ratio} onClick={() => handleAspectRatioSelect(ratio)} className={getOptionButtonClass(settings.aspectRatio === ratio)}>
                                {ratio}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] relative">
                        {isGuest && <GuestLockOverlay title="VIP" />}
                        <div className="flex items-center space-x-2">
                            <input
                                id="high_quality_id"
                                type="checkbox"
                                checked={settings.highQuality || false}
                                onChange={e => onDestructiveSettingChange(prev => ({...prev, highQuality: e.target.checked}))}
                                className="form-checkbox"
                                disabled={isGuest}
                            />
                            <label htmlFor="high_quality_id" className="text-sm font-semibold text-[var(--text-primary)]">
                                {t('common.highQualityLabel')}
                            </label>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 ml-6">
                            {t('common.highQualityDesc')}
                        </p>
                    </div>
                </div>
            );
        case 'background':
             const handleBgChange = isGlobalLocked ? onPrintSettingChange : onDestructiveSettingChange;
            return (
                <div className="relative">
                    {isGlobalLocked && <VipLockOverlay onContactClick={onContactClick} />}
                    <div className={`space-y-4 animate-fade-in ${isGlobalLocked ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-2">
                            {(['light_blue', 'white', 'custom', 'ai'] as BackgroundMode[]).map(mode => (
                                <div key={mode} className="relative">
                                    {/* Lock AI Background for Guests */}
                                    {isGuest && mode === 'ai' && <GuestLockOverlay title="VIP" />}
                                    <button onClick={() => {
                                        if (isGuest && mode === 'ai') return;
                                        handleBgChange(prev => ({...prev, background: { ...prev.background, mode: mode }}));
                                        if (!isGlobalLocked) setActiveSection('outfit');
                                    }} className={getOptionButtonClass(settings.background.mode === mode)}>
                                        {t(`controlPanel.background.buttons.${mode}`)}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {settings.background.mode === 'custom' && (
                            <div className="flex items-center space-x-2 p-2 bg-black/20 rounded-md animate-fade-in">
                                <input type="color" value={settings.background.customColor} onChange={e => handleBgChange(prev => ({...prev, background: {...prev.background, customColor: e.target.value}}))} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" style={{'WebkitAppearance': 'none'}} />
                                <input type="text" value={settings.background.customColor} onChange={e => handleBgChange(prev => ({...prev, background: {...prev.background, customColor: e.target.value}}))} className="w-full bg-transparent text-sm font-mono" />
                            </div>
                        )}
                        {settings.background.mode === 'ai' && (
                            <div className="p-2 bg-black/20 rounded-md animate-fade-in">
                            <textarea value={settings.background.customPrompt} onChange={e => handleBgChange(prev => ({...prev, background: {...prev.background, customPrompt: e.target.value}}))} placeholder={t('controlPanel.background.aiPlaceholder')} className="w-full bg-transparent text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)]" rows={2}></textarea>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'outfit':
            const getOutfitTabClass = (isActive: boolean) => {
                const base = 'flex-1 py-2 text-sm font-semibold text-center transition-all duration-200';
                if (isActive) {
                    return `${base} text-white border-b-2 border-[var(--accent-cyan)]`;
                }
                return `${base} text-[var(--text-secondary)] border-b-2 border-transparent hover:text-white hover:border-[var(--accent-cyan)]/50`;
            }

            return (
                 <div className="relative">
                    {isGlobalLocked && <VipLockOverlay onContactClick={onContactClick} />}
                    <div className={`space-y-4 animate-fade-in ${isGlobalLocked ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                        <div className="flex items-center space-x-2">
                            <input id="keep_outfit" type="checkbox" checked={settings.outfit.keepOriginal} onChange={e => handleKeepOutfitToggle(e.target.checked)} className="form-checkbox" />
                            <label htmlFor="keep_outfit" className="text-sm">{t('controlPanel.outfit.keepOriginal')}</label>
                        </div>
                        {!settings.outfit.keepOriginal && (
                            <div className="animate-fade-in">
                                <div className="flex border-b border-[var(--border-color)] mb-4">
                                    {(['preset', 'custom', 'upload'] as OutfitMode[]).map(mode => (
                                        <div key={mode} className="flex-1 relative">
                                            {/* Lock Custom and Upload for Guests */}
                                            {isGuest && (mode === 'custom' || mode === 'upload') && (
                                                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center cursor-not-allowed">
                                                    <i className="fas fa-lock text-xs text-white/70"></i>
                                                </div>
                                            )}
                                            <button onClick={() => handleOutfitModeChange(mode)} className={`w-full ${getOutfitTabClass(settings.outfit.mode === mode)}`} disabled={isGuest && (mode === 'custom' || mode === 'upload')}>
                                                {t(`controlPanel.outfit.buttons.${mode}`)}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    {settings.outfit.mode === 'preset' && (
                                        <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 -mr-2 scrollbar-thin animate-fade-in">
                                            {OUTFIT_PRESETS.map(preset => (
                                                <button 
                                                    key={preset.value} 
                                                    onClick={() => handleOutfitPresetSelect(preset.value)}
                                                    className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-component)] focus:ring-[var(--accent-blue)] ${
                                                        settings.outfit.preset === preset.value
                                                            ? 'border-[var(--accent-blue)] shadow-lg'
                                                            : 'border-transparent hover:border-[var(--accent-blue)]'
                                                    }`}
                                                >
                                                    <img 
                                                        src={preset.previewUrl} 
                                                        alt={t(preset.nameKey)}
                                                        className="w-full h-24 object-cover object-top"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1">
                                                        <p className="text-white text-xs text-center truncate">{t(preset.nameKey)}</p>
                                                    </div>
                                                    {settings.outfit.preset === preset.value && (
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-blue-glow)] to-transparent pointer-events-none"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {settings.outfit.mode === 'custom' && (
                                        <textarea 
                                            onBlur={() => setActiveSection('face')}
                                            value={settings.outfit.customPrompt} 
                                            onChange={e => handleNestedDestructiveChange('outfit', 'customPrompt', e.target.value)} 
                                            placeholder={t('controlPanel.outfit.customPlaceholder')} 
                                            className="w-full bg-black/20 text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)] animate-fade-in" 
                                            rows={3}
                                        ></textarea>
                                    )}
                                    {settings.outfit.mode === 'upload' && (
                                        <div className="p-2 bg-black/20 rounded-md text-center animate-fade-in">
                                            {!settings.outfit.uploadedFile ? (
                                                <button onClick={onOutfitUpload} className="w-full border-2 border-dashed border-white/30 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] rounded-md py-4 text-sm transition-colors">
                                                    <i className="fas fa-upload mr-2"></i> {t('controlPanel.outfit.uploadButton')}
                                                </button>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <i className="fas fa-check-circle text-green-400"></i>
                                                    <span className="text-sm truncate flex-1">{settings.outfit.uploadedFile.name}</span>
                                                    <button onClick={onClearOutfit} className="text-red-400 hover:text-red-300 w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/20"><i className="fas fa-times"></i></button>
                                                </div>
                                            )}
                                            <p className="text-xs text-[var(--text-secondary)] mt-2">{t('controlPanel.outfit.uploadTip')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'face':
            return (
                  <div className="relative">
                      {isGlobalLocked && <VipLockOverlay onContactClick={onContactClick} />}
                      <div className={`space-y-4 animate-fade-in ${isGlobalLocked ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                        <div className="p-2 rounded-md bg-blue-900/30 border border-blue-500/50 relative">
                            {/* Lock Face Lock for Guests */}
                            {isGuest && <GuestLockOverlay title="VIP" />}
                            <div className="flex items-center space-x-2">
                                <input id="keep_features" type="checkbox" checked={settings.face.keepOriginalFeatures} onChange={e => handleNestedDestructiveChange('face', 'keepOriginalFeatures', e.target.checked)} className="form-checkbox" disabled={isGuest} />
                                <label htmlFor="keep_features" className="text-sm font-bold text-blue-300">{t('controlPanel.face.keepFeatures.label')}</label>
                            </div>
                            <p className="text-xs text-blue-400 mt-1 pl-6">{t('controlPanel.face.keepFeatures.description')}</p>
                        </div>

                        <h4 className="text-sm font-semibold">{t('controlPanel.face.hair.title')}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {(['auto', 'down', 'slicked_back', 'keep_original'] as HairStyle[]).map(style => (
                                <button key={style} onClick={() => handleNestedDestructiveChange('face', 'hairStyle', style)} className={getOptionButtonClass(settings.face.hairStyle === style)}>
                                    {t(`controlPanel.face.hair.styles.${style}`)}
                                </button>
                            ))}
                        </div>
                        
                        <h4 className="text-sm font-semibold">{t('controlPanel.face.adjustments.title')}</h4>
                        <div className="space-y-2 relative">
                            {isGuest && <GuestLockOverlay title="VIP" />}
                            <div className="flex items-center space-x-2">
                                <input id="smooth_skin" type="checkbox" checked={settings.face.smoothSkin} onChange={e => handleNestedDestructiveChange('face', 'smoothSkin', e.target.checked)} className="form-checkbox" disabled={isGuest} />
                                <label htmlFor="smooth_skin" className="text-sm">{t('controlPanel.face.adjustments.smoothSkin')}</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input id="slight_smile" type="checkbox" checked={settings.face.slightSmile} onChange={e => handleNestedDestructiveChange('face', 'slightSmile', e.target.checked)} className="form-checkbox" disabled={settings.face.keepOriginalFeatures || isGuest} />
                                <label htmlFor="slight_smile" className={`text-sm ${settings.face.keepOriginalFeatures ? 'text-[var(--text-secondary)]' : ''}`}>{t('controlPanel.face.adjustments.slightSmile')}</label>
                            </div>
                        </div>
                        <div className="relative">
                             {isGuest && <GuestLockOverlay title="VIP" />}
                             <textarea value={settings.face.otherCustom} onChange={e => handleNestedDestructiveChange('face', 'otherCustom', e.target.value)} placeholder={t('controlPanel.face.otherPlaceholder')} className="w-full bg-black/20 text-sm border border-white/20 rounded p-2 focus:ring-1 focus:ring-[var(--accent-blue)]" rows={2} disabled={isGuest}></textarea>
                        </div>
                    </div>
                  </div>
            );
        default:
            return null;
    }
  }
  
  const paperMode = settings.paperBackground === '#ffffff' ? 'white' : settings.paperBackground === '#DDDDDD' ? 'gray' : 'custom';

  return (
    <aside className="w-full bg-[var(--bg-component)] flex flex-col flex-shrink-0 border-l border-[var(--border-color)] overflow-y-auto scrollbar-thin animate-fade-in flex-1 rounded-xl relative">
        {!originalImage && (
            <div className="absolute inset-0 bg-[var(--bg-component)]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl p-4">
                <div className="text-center">
                    <i className="fas fa-arrow-up text-3xl text-[var(--accent-blue)] mb-3 p-3 bg-black/20 rounded-full"></i>
                    <p className="font-semibold text-lg text-[var(--text-primary)]">{t('controlPanel.uploadFirst.title')}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{t('controlPanel.uploadFirst.description')}</p>
                </div>
            </div>
        )}
        <div className="p-4 pb-0">
             <h2 className="text-base font-semibold uppercase tracking-wider text-center mb-4 animated-gradient-text">{title || t('controlPanel.title')}</h2>
        </div>

        {/* Wizard Content */}
        <div className="flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-color)] px-2 flex-shrink-0">
                {SECTIONS.map((section, index) => {
                  const isEnabled = enabledSections.includes(section.id);
                  return (
                    <button
                        key={section.id}
                        onClick={() => isEnabled && setActiveSection(section.id)}
                        className={`${getWizardTabClass(activeSection === section.id)} ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-controls={`section-content-${section.id}`}
                        aria-selected={activeSection === section.id}
                        disabled={!isEnabled}
                    >
                        <i className={`fas ${section.icon} text-lg w-5 text-center`}></i>
                        <span className="text-xs leading-tight">{`${index + 1}. ${t(section.titleKey)}`}</span>
                    </button>
                  );
                })}
            </div>

            {/* Tab Panel */}
            <div className="p-4">
                {renderActiveSection()}
            </div>
        </div>

        {/* Print Settings */}
        <div className="p-4 border-t border-[var(--border-color)] relative">
             {isGuest && hasProcessedImage && <GuestLockOverlay title="VIP" />}
             <h2 className="text-base font-semibold uppercase tracking-wider text-center mb-4 animated-gradient-text">{t('controlPanel.print.title')}</h2>
             <div className="space-y-3">
                 <div>
                    <label className="text-sm font-semibold block mb-1">{t('controlPanel.print.layout.label')}</label>
                    <select value={settings.printLayout} onChange={e => onPrintSettingChange(prev => ({...prev, printLayout: e.target.value as PrintLayout}))} className="w-full bg-[var(--bg-deep-space)] border border-white/20 rounded-md px-3 py-2 text-sm">
                        <option value="none">{t('controlPanel.print.layout.none')}</option>
                        <option value="10x15">{t('controlPanel.print.layout.10x15')}</option>
                        <option value="13x18">{t('controlPanel.print.layout.13x18')}</option>
                        <option value="20x30">{t('controlPanel.print.layout.20x30')}</option>
                    </select>
                    {settings.printLayout !== 'none' && hasProcessedImage && photoCount &&
                        <p className="text-xs text-[var(--accent-cyan)] mt-1">{t('controlPanel.print.layout.photoCount', { count: photoCount.cols * photoCount.rows, cols: photoCount.cols, rows: photoCount.rows })}</p>
                    }
                 </div>
                 <div>
                    <label className="text-sm font-semibold block mb-1">{t('controlPanel.print.paper.label')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button key="white" onClick={() => onPrintSettingChange(prev => ({...prev, paperBackground: '#ffffff'}))} className={getOptionButtonClass(paperMode === 'white')}>
                            {t('controlPanel.print.paper.options.white')}
                        </button>
                        <button key="gray" onClick={() => onPrintSettingChange(prev => ({...prev, paperBackground: '#DDDDDD'}))} className={getOptionButtonClass(paperMode === 'gray')}>
                            {t('controlPanel.print.paper.options.gray')}
                        </button>
                        <button key="custom" onClick={() => { if (paperMode !== 'custom') { onPrintSettingChange(prev => ({...prev, paperBackground: '#A0AEC0'})); } }} className={getOptionButtonClass(paperMode === 'custom')}>
                            {t('controlPanel.print.paper.options.custom')}
                        </button>
                    </div>
                    {paperMode === 'custom' && (
                        <div className="flex items-center space-x-2 p-2 mt-2 bg-black/20 rounded-md animate-fade-in">
                            <input 
                                type="color" 
                                value={settings.paperBackground} 
                                onChange={e => onPrintSettingChange(prev => ({...prev, paperBackground: e.target.value}))} 
                                className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" 
                                style={{'WebkitAppearance': 'none'}} 
                            />
                            <input 
                                type="text" 
                                value={settings.paperBackground} 
                                onChange={e => onPrintSettingChange(prev => ({...prev, paperBackground: e.target.value}))} 
                                className="w-full bg-transparent text-sm font-mono" 
                            />
                        </div>
                    )}
                 </div>
             </div>
        </div>
    </aside>
  );
};
