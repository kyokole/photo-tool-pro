import React from 'react';
import { useTranslation } from 'react-i18next';

interface UpgradeVipModalProps {
    onClose: () => void;
    onContact: () => void;
}

const UpgradeVipModal: React.FC<UpgradeVipModalProps> = ({ onClose, onContact }) => {
    const { t } = useTranslation();

    const benefits = [
        'upgradeVipModal.benefits.unlimited',
        'upgradeVipModal.benefits.allTools',
        'upgradeVipModal.benefits.batch',
        'upgradeVipModal.benefits.priority'
    ];

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-md p-6 md:p-8 relative border border-[var(--border-color)] text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[var(--text-primary)] transition-colors">
                    <i className="fas fa-times fa-lg"></i>
                </button>

                <div className="text-[var(--accent-gold)] mb-4 animate-pulse-gold">
                    <i className="fas fa-crown fa-3x"></i>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-[var(--accent-gold)]">{t('upgradeVipModal.title')}</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                    {t('upgradeVipModal.description')}
                </p>

                <div className="text-left space-y-3 mb-8">
                    {benefits.map(benefitKey => (
                        <div key={benefitKey} className="flex items-center gap-3">
                            <i className="fas fa-check-circle text-green-400"></i>
                            <span className="text-[var(--text-primary)]">{t(benefitKey)}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={onClose}
                        className="w-full btn-secondary text-[var(--text-primary)] font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    >
                        {t('upgradeVipModal.closeButton')}
                    </button>
                    <button
                        onClick={onContact}
                        className="w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg"
                    >
                        {t('upgradeVipModal.contactButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeVipModal;