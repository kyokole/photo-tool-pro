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
                
                <GuideSection title={t('guide.creativeStudio.title')}>
                    <p>{t('guide.creativeStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.creativeStudio.step1.title')}:</strong> {t('guide.creativeStudio.step1.desc')}</li>
                        <li><strong>{t('guide.creativeStudio.step2.title')}:</strong> {t('guide.creativeStudio.step2.desc')}</li>
                        <li><strong>{t('guide.creativeStudio.step3.title')}:</strong> {t('guide.creativeStudio.step3.desc')}</li>
                    </ol>
                    <p className="mt-2"><strong>{t('common.note')}:</strong> {t('guide.creativeStudio.note')}</p>
                </GuideSection>
                
                <GuideSection title={t('guide.promptAnalyzer.title')}>
                    <p>{t('guide.promptAnalyzer.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.promptAnalyzer.step1.title')}:</strong> {t('guide.promptAnalyzer.step1.desc')}</li>
                        <li><strong>{t('guide.promptAnalyzer.step2.title')}:</strong> {t('guide.promptAnalyzer.step2.desc')}</li>
                        <li><strong>{t('guide.promptAnalyzer.step3.title')}:</strong> {t('guide.promptAnalyzer.step3.desc')}</li>
                    </ol>
                    <p className="mt-2"><strong>{t('common.note')}:</strong> {t('guide.promptAnalyzer.note')}</p>
                </GuideSection>

                <GuideSection title={t('guide.fourSeasons.title')}>
                    <p>{t('guide.fourSeasons.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.fourSeasons.step1.title')}:</strong> {t('guide.fourSeasons.step1.desc')}</li>
                        <li><strong>{t('guide.fourSeasons.step2.title')}:</strong> {t('guide.fourSeasons.step2.desc')}</li>
                        <li><strong>{t('guide.fourSeasons.step3.title')}:</strong> {t('guide.fourSeasons.step3.desc')}</li>
                    </ol>
                </GuideSection>
                
                <GuideSection title={t('guide.fashionStudio.title')}>
                    <p>{t('guide.fashionStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.fashionStudio.step1.title')}:</strong> {t('guide.fashionStudio.step1.desc')}</li>
                        <li><strong>{t('guide.fashionStudio.step2.title')}:</strong> {t('guide.fashionStudio.step2.desc')}</li>
                        <li><strong>{t('guide.fashionStudio.step3.title')}:</strong> {t('guide.fashionStudio.step3.desc')}</li>
                    </ol>
                </GuideSection>

                <GuideSection title={t('guide.footballStudio.title')}>
                    <p>{t('guide.footballStudio.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.footballStudio.step1.title')}:</strong> {t('guide.footballStudio.step1.desc')}</li>
                        <li><strong>{t('guide.footballStudio.step2.title')}:</strong> {t('guide.footballStudio.step2.desc')}</li>
                        <li><strong>{t('guide.footballStudio.step3.title')}:</strong> {t('guide.footballStudio.step3.desc')}</li>
                    </ol>
                </GuideSection>
                
                <GuideSection title={t('guide.headshot.title')}>
                    <p>{t('guide.headshot.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.headshot.step1.title')}:</strong> {t('guide.headshot.step1.desc')}</li>
                        <li><strong>{t('guide.headshot.step2.title')}:</strong> {t('guide.headshot.step2.desc')}</li>
                        <li><strong>{t('guide.headshot.step3.title')}:</strong> {t('guide.headshot.step3.desc')}</li>
                    </ol>
                </GuideSection>

                <GuideSection title={t('guide.idPhoto.title')}>
                    <p>{t('guide.idPhoto.intro')}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li><strong>{t('guide.idPhoto.step1.title')}:</strong> {t('guide.idPhoto.step1.desc')}</li>
                        <li><strong>{t('guide.idPhoto.step2.title')}:</strong> {t('guide.idPhoto.step2.desc')}</li>
                        <li><strong>{t('guide.idPhoto.step3.title')}:</strong> {t('guide.idPhoto.step3.desc')}</li>
                        <li><strong>{t('guide.idPhoto.step4.title')}:</strong> {t('guide.idPhoto.step4.desc')}</li>
                    </ol>
                    <p className="mt-2"><strong>{t('common.note')}:</strong> {t('guide.idPhoto.note')}</p>
                </GuideSection>

                <GuideSection title={t('guide.restoration.title')}>
                     <p>{t('guide.restoration.intro')}</p>
                     <ol className="list-decimal list-inside space-y-1 pl-4">
                         <li><strong>{t('guide.restoration.step1.title')}:</strong> {t('guide.restoration.step1.desc')}</li>
                         <li><strong>{t('guide.restoration.step2.title')}:</strong> {t('guide.restoration.step2.desc')}</li>
                         <li><strong>{t('guide.restoration.step3.title')}:</strong> {t('guide.restoration.step3.desc')}</li>
                         <li><strong>{t('guide.restoration.step4.title')}:</strong> {t('guide.restoration.step4.desc')}</li>
                     </ol>
                </GuideSection>

                <GuideSection title={t('guide.tips.title')}>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                        <li><strong>{t('guide.tips.tip1.title')}:</strong> {t('guide.tips.tip1.desc')}</li>
                        <li><strong>{t('guide.tips.tip2.title')}:</strong> {t('guide.tips.tip2.desc')}</li>
                        <li>{t('guide.tips.tip3.desc')}</li>
                    </ul>
                </GuideSection>
            </div>
        </div>
    );
};

export default UserGuideModal;