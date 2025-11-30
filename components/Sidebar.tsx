
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings, AppMode, User } from '../types';
import { PassportIcon, BriefcaseIcon, SchoolIcon, IdPhotoIcon, UndoIcon, GuideIcon, SparklesIcon } from './icons';
import SubscriptionCountdown from './SubscriptionCountdown';

const getDisplayName = (username: string | undefined): string => {
    if (!username) return '';
    // If it looks like an email, format it. Otherwise, display as is.
    if (username.includes('@')) {
        const namePart = username.split('@')[0];
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return username;
};

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const getButtonClass = (lang: string) => {
        const base = "px-3 py-1 text-xs font-bold rounded-md transition-colors";
        if (i18n.language === lang) {
            return `${base} bg-[var(--accent-cyan)] text-white`;
        }
        return `${base} bg-[var(--bg-component-light)] text-[var(--text-secondary)] hover:bg-white/10 hover:text-white`;
    };

    return (
        <div className="flex items-center justify-center space-x-2 p-2 bg-black/20 rounded-lg">
            <button onClick={() => changeLanguage('vi')} className={getButtonClass('vi')}>
                VI
            </button>
            <button onClick={() => changeLanguage('en')} className={getButtonClass('en')}>
                EN
            </button>
        </div>
    );
};

interface SidebarProps {
  appMode: AppMode;
  onIdPhotoClick: () => void;
  onHeadshotClick: () => void;
  onRestorationClick: () => void;
  onFashionStudioClick: () => void;
  onCreativeStudioClick: () => void;
  onPromptAnalyzerClick: () => void;
  onFootballStudioClick: () => void;
  onFourSeasonsClick: () => void;
  onBeautyStudioClick: () => void;
  onFamilyStudioClick: () => void;
  onMarketingStudioClick: () => void; 
  onArtStyleStudioClick: () => void;
  onVoiceStudioClick: () => void; // New prop
  onAdminPanelClick: () => void;
  onPresetSelect: (settings: Partial<Settings>) => void;
  onUndo: () => void;
  historyCount: number;
  onGuideClick: () => void;
  onAboutClick: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  onSubscriptionExpired: () => void;
  isImageUploaded: boolean;
  isVip: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    appMode,
    onIdPhotoClick,
    onHeadshotClick,
    onRestorationClick,
    onFashionStudioClick,
    onCreativeStudioClick,
    onPromptAnalyzerClick,
    onFootballStudioClick,
    onFourSeasonsClick,
    onBeautyStudioClick,
    onFamilyStudioClick,
    onMarketingStudioClick,
    onArtStyleStudioClick,
    onVoiceStudioClick,
    onAdminPanelClick,
    onPresetSelect, 
    onUndo, 
    historyCount, 
    onGuideClick,
    onAboutClick,
    currentUser,
    onLogout,
    onChangePasswordClick,
    onSubscriptionExpired,
    isImageUploaded,
    isVip
}) => {
  const { t } = useTranslation();
  const [isVipToolsExpanded, setIsVipToolsExpanded] = useState(false);

  const presets = [
    {
      name: t('presets.passport'),
      icon: <PassportIcon />,
      settings: {
        background: { mode: 'light_blue', customColor: '#e0e8f0', customPrompt: '' },
        outfit: { mode: 'preset', preset: 'Sơ mi trắng', customPrompt: '', uploadedFile: null, keepOriginal: false },
        aspectRatio: '3x4',
      }
    },
    {
      name: t('presets.corporate'),
      icon: <BriefcaseIcon />,
      settings: {
        background: { mode: 'white', customColor: '#ffffff', customPrompt: '' },
        outfit: { mode: 'preset', preset: 'Vest đen nam', customPrompt: '', uploadedFile: null, keepOriginal: false },
        aspectRatio: '3x4',
      }
    },
    {
      name: t('presets.student'),
      icon: <SchoolIcon />,
      settings: {
        background: { mode: 'light_blue', customColor: '#e0e8f0', customPrompt: '' },
        outfit: { mode: 'custom', preset: 'Sơ mi trắng', customPrompt: t('presets.studentPrompt'), uploadedFile: null, keepOriginal: false },
        aspectRatio: '3x4',
      }
    }
  ];

  const baseButtonClasses = "w-full flex items-center space-x-3 rounded-md transition-all duration-200 text-left py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/5 border-l-4 border-transparent pl-4 hover:pl-5";
  const getToolButtonClasses = (mode: AppMode) => {
    if (appMode === mode) {
        return `w-full flex items-center space-x-3 rounded-md transition-all duration-200 text-left py-2.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-active)] font-semibold shadow-inner pl-3 border-l-4 border-[var(--ring-color)]`;
    }
    return baseButtonClasses;
  };
  
  const getVipToolButtonClasses = (mode: AppMode) => {
    const base = "flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all duration-200 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] aspect-square";
    if (appMode === mode) {
        return `${base} bg-[var(--bg-tertiary)] text-[var(--text-active)] font-semibold shadow-inner ring-2 ring-[var(--ring-color)]`;
    }
    return `${base} bg-[var(--bg-interactive)]`;
  };
  
  let userStatus: 'admin' | 'vip' | 'member' = 'member';
  let statusIcon = 'fas fa-user-check';
  let statusColor = 'text-green-400';
  let statusTooltip = t('user.status.member');
  let iconAnimation = '';
  let nameColor = 'text-white';

  if (currentUser) {
      if (currentUser.isAdmin) {
          userStatus = 'admin';
          statusIcon = 'fas fa-crown';
          statusColor = 'text-[var(--accent-gold)]';
          nameColor = 'text-[var(--accent-gold)]';
          statusTooltip = t('user.status.admin');
          iconAnimation = 'animate-pulse-gold';
      } else if (isVip) {
          userStatus = 'vip';
          statusIcon = 'fas fa-star';
          statusColor = 'text-[var(--accent-cyan)]';
          nameColor = 'text-[var(--accent-cyan)]';
          statusTooltip = t('user.status.vip');
      }
  }


  return (
    <aside className="bg-[var(--bg-component)] w-full md:w-72 p-5 flex flex-col flex-shrink-0 border-r border-[var(--border-color)]">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] p-3 rounded-xl shadow-lg" style={{boxShadow: '0 0 25px var(--accent-blue-glow)'}}>
          <IdPhotoIcon />
        </div>
        <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">{t('sidebar.mainTitle')}</h1>
            <p className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] tracking-widest uppercase">{t('sidebar.subtitle')}</p>
        </div>
      </div>

      {currentUser && (
        <div className="mb-6 p-3 bg-black/20 rounded-lg border border-[var(--border-color)] space-y-3">
            <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${statusColor} ${iconAnimation}`} title={statusTooltip}>
                    <i className={`${statusIcon} text-xl`}></i>
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">{t('user.greeting')}</p>
                    <p className={`text-sm font-bold truncate ${nameColor}`} title={currentUser.username}>{getDisplayName(currentUser.username)}</p>
                </div>
            </div>
            
            {/* New Credit Display */}
            <div className="flex items-center justify-between bg-[var(--bg-deep-space)] p-2 rounded-md border border-white/5">
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <i className="fas fa-coins text-yellow-400"></i> Credit:
                </span>
                <span className="text-sm font-bold text-white">{currentUser.credits || 0}</span>
            </div>

             <div className="text-sm font-medium pl-1">
                <span className="text-[var(--text-secondary)] text-xs">{t('user.expiry')}: </span>
                {currentUser.isAdmin ? (
                    <span className="text-[var(--accent-blue)]" title={t('user.permanent')}><i className="fas fa-infinity"></i></span>
                ) : (
                    <SubscriptionCountdown 
                      endDateString={currentUser.subscriptionEndDate} 
                      onExpire={onSubscriptionExpired}
                    />
                )}
            </div>
            <div className={`grid ${currentUser.providerId === 'password' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-2 border-t border-[var(--border-color)]`}>
                {currentUser.providerId === 'password' && (
                    <button 
                        onClick={onChangePasswordClick} 
                        className="text-center text-xs text-[var(--accent-blue)] hover:text-[var(--accent-cyan)] hover:underline"
                    >
                        {t('user.changePassword')}
                    </button>
                )}
                <button 
                    onClick={onLogout} 
                    className="text-center text-xs text-[var(--text-secondary)] hover:text-white hover:underline"
                >
                    {t('user.logout')}
                </button>
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2 -mr-2 space-y-6 scrollbar-thin">
        {appMode === 'id_photo' && (
            <div>
              <h2 className="text-base font-semibold uppercase tracking-wider mb-4 animated-gradient-text">{t('sidebar.quickPresets')}</h2>
              <div className="space-y-2">
                {presets.map(preset => (
                  <button 
                    key={preset.name} 
                    onClick={() => onPresetSelect(preset.settings as Partial<Settings>)} 
                    disabled={!isImageUploaded}
                    className={`${baseButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {preset.icon}
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
        )}
        
        <div>
            <h2 className="text-base font-semibold uppercase tracking-wider mb-4 animated-gradient-text">{t('sidebar.freeTools')}</h2>
            <nav className="space-y-1">
                 <button onClick={onHeadshotClick} className={getToolButtonClasses('headshot')}>
                    <div className="w-5 h-5"><i className="fas fa-camera"></i></div>
                    <span>{t('tools.headshot')}</span>
                </button>
                 <button onClick={onIdPhotoClick} className={getToolButtonClasses('id_photo')}>
                    <div className="w-5 h-5"><i className="fas fa-id-card"></i></div>
                    <span>{t('tools.idPhoto')}</span>
                </button>
            </nav>
        </div>

        <div className="pt-4 mt-4 border-t border-[var(--border-color)]">
          <button
            onClick={() => setIsVipToolsExpanded(!isVipToolsExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider mb-3 text-[var(--accent-gold)] hover:text-yellow-300 transition-colors"
            aria-expanded={isVipToolsExpanded}
            aria-controls="vip-tools-grid"
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-star"></i>
              {t('sidebar.vipTools')}
            </div>
            <i className={`fas fa-chevron-down transition-transform duration-300 ${isVipToolsExpanded ? 'rotate-180' : ''}`}></i>
          </button>
          
          <div
            id="vip-tools-grid"
            className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
              isVipToolsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0"> {/* Wrapper for grid animation */}
              <nav className="space-y-1 pb-2">
                <button onClick={onVoiceStudioClick} className={getToolButtonClasses('voice_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-microphone-alt"></i></div>
                    <span>{t('tools.voiceStudio')}</span>
                </button>
                <button onClick={onArtStyleStudioClick} className={getToolButtonClasses('art_style_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-palette"></i></div>
                    <span>{t('artStyleStudio.title')}</span>
                </button>
                <button onClick={onMarketingStudioClick} className={getToolButtonClasses('marketing_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-bullhorn"></i></div>
                    <span>{t('marketingStudio.title')}</span>
                </button>
                <button onClick={onRestorationClick} className={getToolButtonClasses('restoration')}>
                    <div className="w-5 h-5"><i className="fas fa-wand-magic"></i></div>
                    <span>{t('tools.restoration')}</span>
                </button>
                <button onClick={onFashionStudioClick} className={getToolButtonClasses('fashion_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-tshirt"></i></div>
                    <span>{t('tools.fashionStudio')}</span>
                </button>
                 <button onClick={onFootballStudioClick} className={getToolButtonClasses('football_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-futbol"></i></div>
                    <span>{t('tools.footballStudio')}</span>
                </button>
                 <button onClick={onFamilyStudioClick} className={getToolButtonClasses('family_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-users"></i></div>
                    <span>{t('tools.familyStudio')}</span>
                </button>
                <button onClick={onBeautyStudioClick} className={getToolButtonClasses('beauty_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-gem"></i></div>
                    <span>{t('tools.beautyStudio')}</span>
                </button>
                <button onClick={onCreativeStudioClick} className={getToolButtonClasses('creative_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-wand-magic-sparkles"></i></div>
                    <span>{t('tools.creativeStudio')}</span>
                </button>
                <button onClick={onPromptAnalyzerClick} className={getToolButtonClasses('prompt_analyzer')}>
                    <SparklesIcon />
                    <span>{t('tools.promptAnalyzer')}</span>
                </button>
                <button onClick={onFourSeasonsClick} className={getToolButtonClasses('four_seasons_studio')}>
                    <div className="w-5 h-5"><i className="fas fa-leaf"></i></div>
                    <span>{t('tools.fourSeasons')}</span>
                </button>
                {currentUser?.isAdmin && (
                    <button onClick={onAdminPanelClick} className={getToolButtonClasses('admin')}>
                        <div className="w-5 h-5"><i className="fas fa-users-cog"></i></div>
                        <span>{t('tools.admin')}</span>
                    </button>
                )}
              </nav>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold uppercase tracking-wider mb-4 animated-gradient-text">{t('sidebar.utilities')}</h2>
          <nav className="space-y-1">
             <button onClick={onGuideClick} className={baseButtonClasses}>
              <GuideIcon />
              <span>{t('utilities.guide')}</span>
            </button>
            <button onClick={onAboutClick} className={baseButtonClasses}>
                <div className="w-5 h-5"><i className="fas fa-info-circle"></i></div>
                <span>{t('utilities.about')}</span>
            </button>
            {appMode === 'id_photo' && (
                <button onClick={onUndo} disabled={historyCount === 0} className={`${baseButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <UndoIcon />
                    <span>{t('utilities.undo')} ({historyCount})</span>
                </button>
            )}
          </nav>
        </div>
        <div className="pt-6 border-t border-[var(--border-color)]">
          <LanguageSwitcher />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
