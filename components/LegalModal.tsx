import React from 'react';
import { useTranslation } from 'react-i18next';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    titleKey: string;
    contentKey: string;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, titleKey, contentKey }) => {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-component)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[var(--border-color)]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--accent-cyan)]">{t(titleKey)}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
                        aria-label={t('common.cancel')}
                    >
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto scrollbar-thin text-[var(--text-secondary)]">
                    <p className="whitespace-pre-wrap leading-relaxed">
                        {t(contentKey)}
                    </p>
                </main>
            </div>
        </div>
    );
};

export default LegalModal;
