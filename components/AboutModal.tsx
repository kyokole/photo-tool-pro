import React from 'react';
import { useTranslation } from 'react-i18next';

interface AboutModalProps {
    onClose: () => void;
    onDonateClick: () => void;
}

const ContactLink: React.FC<{ href: string; icon: string; text: string; }> = ({ href, icon, text }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center space-x-3 p-3 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors duration-200"
    >
        <i className={`fab ${icon} fa-fw text-xl text-[var(--accent-cyan)]`}></i>
        <span className="font-semibold text-[var(--text-primary)]">{text}</span>
    </a>
);

const AboutModal: React.FC<AboutModalProps> = ({ onClose, onDonateClick }) => {
    const { t } = useTranslation();

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 relative text-[var(--text-primary)] border border-[var(--border-color)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <i className="fas fa-times fa-2x"></i>
                </button>
                
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] mb-2">{t('aboutModal.title')}</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--accent-blue)] mb-3 flex items-center gap-2"><i className="fas fa-user-circle"></i> {t('aboutModal.author.title')}</h3>
                        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                            <p className="text-lg font-semibold text-[var(--accent-cyan)]">{t('aboutModal.author.name')}</p>
                            <p className="text-[var(--text-secondary)]">{t('aboutModal.author.description')}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-[var(--accent-blue)] mb-3 flex items-center gap-2"><i className="fas fa-headset"></i> {t('aboutModal.contact.title')}</h3>
                        <p className="text-[var(--text-secondary)] mb-4">{t('aboutModal.contact.description')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ContactLink href="https://www.facebook.com/ai.ptstudio" icon="fa-facebook" text={t('aboutModal.contact.facebook')} />
                            <ContactLink href="https://zalo.me/g/wullrr077" icon="fa-rocketchat" text={t('aboutModal.contact.zalo')} />
                            <button 
                                onClick={onDonateClick}
                                className="sm:col-span-2 flex items-center space-x-3 p-3 bg-[var(--accent-border-subtle)] rounded-lg hover:bg-[var(--accent-blue-glow)] transition-colors duration-200 text-left w-full"
                            >
                                <i className="fas fa-coffee fa-fw text-xl text-[var(--accent-cyan)]"></i>
                                <span className="font-semibold text-[var(--accent-cyan)]">{t('aboutModal.contact.donate')}</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AboutModal;