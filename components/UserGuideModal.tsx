
import React from 'react';
import { useTranslation } from 'react-i18next';

interface UserGuideModalProps {
    onClose: () => void;
}

const GuideSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--accent-blue)] mb-2 border-b border-white/20 pb-1">{title}</h3>
        <div className="space-y-2 text-[#E6EDF3]">{children}</div>
    </div>
);

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
    const { t } = useTranslation();

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-[#1C2128] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative text-white border border-white/20 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-times fa-2x"></i>
                </button>
                <h2 className="text-3xl font-bold mb-6 text-center">{t('guide.title')}</h2>
                
                <p className="text-center text-[#848D97] mb-8 -mt-4">{t('guide.subtitle')}</p>

                {/* Magic Eraser - NEW */}
                 <GuideSection title={t('guide.magicEraser.title')}>
                    <p>{t('guide.magicEraser.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.magicEraser.step1.title')}:</strong> {t('guide.magicEraser.step1.desc')}</li>
                        <li><strong>{t('guide.magicEraser.step2.title')}:</strong> {t('guide.magicEraser.step2.desc')}</li>
                    </ol>
                </GuideSection>
                
                 {/* Motion Studio - NEW */}
                 <GuideSection title={t('guide.motionStudio.title')}>
                    <p>{t('guide.motionStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.motionStudio.step1.title')}:</strong> {t('guide.motionStudio.step1.desc')}</li>
                        <li><strong>{t('guide.motionStudio.step2.title')}:</strong> {t('guide.motionStudio.step2.desc')}</li>
                        <li><strong>{t('guide.motionStudio.step3.title')}:</strong> {t('guide.motionStudio.step3.desc')}</li>
                    </ol>
                </GuideSection>

                {/* Music & Voice - NEW */}
                 <GuideSection title={t('guide.musicVoice.title')}>
                    <p>{t('guide.musicVoice.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.musicVoice.step1.title')}:</strong> {t('guide.musicVoice.step1.desc')}</li>
                        <li><strong>{t('guide.musicVoice.step2.title')}:</strong> {t('guide.musicVoice.step2.desc')}</li>
                        <li><strong>{t('guide.musicVoice.step3.title')}:</strong> {t('guide.musicVoice.step3.desc')}</li>
                    </ol>
                </GuideSection>

                {/* ID Photo - Core */}
                <GuideSection title={t('guide.idPhoto.title')}>
                    <p>{t('guide.idPhoto.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.idPhoto.step1.title')}:</strong> {t('guide.idPhoto.step1.desc')}</li>
                        <li><strong>{t('guide.idPhoto.step2.title')}:</strong> {t('guide.idPhoto.step2.desc')}</li>
                    </ol>
                    <p className="mt-2"><strong>{t('common.note')}:</strong> {t('guide.idPhoto.note')}</p>
                </GuideSection>

                {/* Creative Studio - Advanced */}
                <GuideSection title={t('guide.creativeStudio.title')}>
                    <p>{t('guide.creativeStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.creativeStudio.step1.title')}:</strong> {t('guide.creativeStudio.step1.desc')}</li>
                        <li><strong>{t('guide.creativeStudio.step2.title')}:</strong> {t('guide.creativeStudio.step2.desc')}</li>
                    </ol>
                </GuideSection>

                 {/* Marketing & Art - NEW Combination */}
                 <GuideSection title={t('guide.marketingArt.title')}>
                    <p>{t('guide.marketingArt.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.marketingArt.step1.title')}:</strong> {t('guide.marketingArt.step1.desc')}</li>
                        <li><strong>{t('guide.marketingArt.step2.title')}:</strong> {t('guide.marketingArt.step2.desc')}</li>
                    </ol>
                </GuideSection>

                {/* Beauty Studio */}
                <GuideSection title={t('guide.beautyStudio.title')}>
                    <p>{t('guide.beautyStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.beautyStudio.step1.title')}:</strong> {t('guide.beautyStudio.step1.desc')}</li>
                        <li><strong>{t('guide.beautyStudio.step2.title')}:</strong> {t('guide.beautyStudio.step2.desc')}</li>
                    </ol>
                </GuideSection>

                {/* Family Studio */}
                <GuideSection title={t('guide.familyStudio.title')}>
                    <p>{t('guide.familyStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.familyStudio.step1.title')}:</strong> {t('guide.familyStudio.step1.desc')}</li>
                        <li><strong>{t('guide.familyStudio.step2.title')}:</strong> {t('guide.familyStudio.step2.desc')}</li>
                    </ol>
                </GuideSection>

                <GuideSection title={t('guide.restoration.title')}>
                     <p>{t('guide.restoration.intro')}</p>
                     <ol className="list-decimal list-inside space-y-1 pl-4">
                         <li><strong>{t('guide.restoration.step1.title')}:</strong> {t('guide.restoration.step1.desc')}</li>
                         <li><strong>{t('guide.restoration.step2.title')}:</strong> {t('guide.restoration.step2.desc')}</li>
                     </ol>
                </GuideSection>

                <GuideSection title={t('guide.tips.title')}>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                        <li><strong>{t('guide.tips.tip1.title')}:</strong> {t('guide.tips.tip1.desc')}</li>
                        <li><strong>{t('guide.tips.tip2.title')}:</strong> {t('guide.tips.tip2.desc')}</li>
                    </ul>
                </GuideSection>
            </div>
        </div>
    );
};

export default UserGuideModal;
