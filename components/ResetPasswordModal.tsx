import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';

interface ResetPasswordModalProps {
    user: User | null;
    onClose: () => void;
    onReset: (email: string) => Promise<void>;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user, onClose, onReset }) => {
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setError('');
            setSuccess('');
            setIsLoading(false);
        }
    }, [user]);

    if (!user) {
        return null;
    }

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await onReset(user.username); // username is used as email here
            setSuccess(t('resetPassword.success', { email: user.username }));
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.passwordResetError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-md p-6 md:p-8 relative border border-[var(--border-color)] text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[var(--text-primary)] transition-colors" disabled={isLoading}>
                    <i className="fas fa-times fa-lg"></i>
                </button>
                <div className="text-[var(--accent-blue)] mb-4">
                    <i className="fas fa-key fa-3x"></i>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">{t('resetPassword.title')}</h2>
                
                {!success && (
                    <>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {t('resetPassword.description')} <strong className="text-[var(--text-primary)]">{user.username}</strong>?
                        </p>
                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={onClose} 
                                disabled={isLoading}
                                className="w-full btn-secondary text-[var(--text-primary)] font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50"
                            >
                                {isLoading ? t('common.processing') : t('common.confirm')}
                            </button>
                        </div>
                    </>
                )}

                {success && <p className="text-green-400 text-sm mt-6">{success}</p>}
            </div>
        </div>
    );
};

export default ResetPasswordModal;