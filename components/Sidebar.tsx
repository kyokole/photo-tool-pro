import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings, AppMode, User } from '../types';
import { PassportIcon, BriefcaseIcon, SchoolIcon, IdPhotoIcon, RestorationIcon, GuideIcon, UndoIcon, FashionIcon, SparklesIcon } from './icons';
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
}) => {
  const { t } = useTranslation();

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
  
  const showAdvancedTools = appMode === 'creative_studio';

  let userStatus: 'admin' | 'vip' | 'member' = 'member';
  let statusIcon = 'fas fa-user';
  let statusColor = 'text-[var(--text-secondary)]';
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
      } else if (new Date(currentUser.subscriptionEndDate) > new Date()) {
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
                <div>
                    <p className="text-xs text-[var(--text-secondary)]">{t('user.greeting')}</p>
                    <p className={`text-sm font-bold truncate ${nameColor}`} title={currentUser.username}>{getDisplayName(currentUser.username)}</p>
                </div>
            </div>
             <div className="text-sm font-medium pl-11">
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
            <h2 className="text-base font-semibold uppercase tracking-wider mb-4 animated-gradient-text">{t('sidebar.tools')}</h2>
            <nav className="space-y-1">
                 <button onClick={onCreativeStudioClick} className={getToolButtonClasses('creative_studio')}>
                    <i className="fas fa-wand-magic-sparkles w-5 h-5"></i>
                    <span>{t('tools.creativeStudio')}</span>
                </button>
                 
                {showAdvancedTools && (
                    <div className="pl-4 border-l-2 border-[var(--border-color)] ml-2 space-y-1 animate-fade-in">
                        <button onClick={onPromptAnalyzerClick} className={getToolButtonClasses('prompt_analyzer')}>
                            <div className="w-5 h-5 flex items-center justify-center"><SparklesIcon className="w-5 h-5" /></div>
                            <span>{t('tools.promptAnalyzer')}</span>
                        </button>
                        <button onClick={onFootballStudioClick} className={getToolButtonClasses('football_studio')}>
                            <i className="fas fa-futbol w-5 h-5"></i>
                            <span>{t('tools.footballStudio')}</span>
                        </button>
                        <button onClick={onFashionStudioClick} className={getToolButtonClasses('fashion_studio')}>
                            <FashionIcon />
                            <span>{t('tools.fashionStudio')}</span>
                        </button>
                        <button onClick={onFourSeasonsClick} className={getToolButtonClasses('four_seasons_studio')}>
                            <i className="fas fa-leaf w-5 h-5"></i>
                            <span>{t('tools.fourSeasons')}</span>
                        </button>
                    </div>
                 )}

                 <button onClick={onHeadshotClick} className={getToolButtonClasses('headshot')}>
                    <i className="fas fa-camera w-5 h-5"></i>
                    <span>{t('tools.headshot')}</span>
                </button>
                 <button onClick={onIdPhotoClick} className={getToolButtonClasses('id_photo')}>
                    <IdPhotoIcon />
                    <span>{t('tools.idPhoto')}</span>
                </button>
                 <button onClick={onRestorationClick} className={getToolButtonClasses('restoration')}>
                    <RestorationIcon />
                    <span>{t('tools.restoration')}</span>
                </button>
                {currentUser?.isAdmin && (
                    <button onClick={onAdminPanelClick} className={getToolButtonClasses('admin')}>
                        <i className="fas fa-users-cog w-5 h-5"></i>
                        <span>{t('tools.admin')}</span>
                    </button>
                )}
            </nav>
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