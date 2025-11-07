import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResend: () => Promise<void>;
    email: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, onResend, email }) => {
    const { t } = useTranslation();
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const handleResendClick = async () => {
        setIsResending(true);
        setResendMessage('');
        try {
            await onResend();
            setResendMessage(t('verificationModal.resendSuccess'));
        } catch (error) {
            setResendMessage(t('verificationModal.resendError'));
        } finally {
            setIsResending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-md p-4">
            <div
                className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-lg p-6 md:p-8 relative border border-[var(--border-color)] text-center"
            >
                <div className="text-[var(--accent-blue)] mb-4">
                    <i className="fas fa-envelope-open-text fa-3x"></i>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">{t('verificationModal.title')}</h2>
                <p 
                    className="text-[var(--text-secondary)] mb-6"
                    dangerouslySetInnerHTML={{ __html: t('verificationModal.description', { email }) }}
                >
                </p>

                {resendMessage && (
                    <p className={`text-sm mb-4 ${resendMessage.includes('thành công') || resendMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                        {resendMessage}
                    </p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleResendClick}
                        disabled={isResending}
                        className="w-full btn-secondary text-[var(--text-primary)] font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                        {isResending ? t('common.processing') : t('verificationModal.resendButton')}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg"
                    >
                        {t('verificationModal.logoutButton')}
                    </button>
                </div>

                <p className="text-xs text-red-400 font-semibold mt-6">
                    {t('verificationModal.footerNote')}
                </p>
            </div>
        </div>
    );
};

export default VerificationModal;
