import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ChangePasswordModalProps {
    onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onChangePassword, onClose }) => {
    const { t } = useTranslation();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOldPasswordVisible, setOldPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError(t('errors.fillAllFields'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('errors.passwordsDoNotMatch'));
            return;
        }
        if (newPassword.length < 6) { 
            setError(t('errors.passwordTooShort'));
            return;
        }

        setIsLoading(true);
        try {
            await onChangePassword(oldPassword, newPassword);
            setSuccess(t('changePassword.success'));
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.unknownError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-md p-6 md:p-8 relative border border-[var(--border-color)] text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[var(--text-primary)] transition-colors">
                    <i className="fas fa-times fa-lg"></i>
                </button>
                <div className="text-[var(--accent-blue)] mb-4">
                    <i className="fas fa-shield-alt fa-3x"></i>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">{t('changePassword.title')}</h2>
                
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="relative">
                            <input type={isOldPasswordVisible ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder={t('changePassword.oldPassword')} required className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] pr-10" />
                            <button
                                type="button"
                                onClick={() => setOldPasswordVisible(!isOldPasswordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                aria-label={isOldPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                                <i className={`fas ${isOldPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                         <div className="relative">
                            <input type={isNewPasswordVisible ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('changePassword.newPassword')} required className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] pr-10" />
                             <button
                                type="button"
                                onClick={() => setNewPasswordVisible(!isNewPasswordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                aria-label={isNewPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                                <i className={`fas ${isNewPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                         <div className="relative">
                            <input type={isConfirmPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('changePassword.confirmPassword')} required className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] pr-10" />
                             <button
                                type="button"
                                onClick={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                aria-label={isConfirmPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                                <i className={`fas ${isConfirmPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm text-left">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                            {isLoading ? t('common.saving') : t('common.saveChanges')}
                        </button>
                    </form>
                )}

                {success && <p className="text-green-400 text-sm mt-6">{success}</p>}
            </div>
        </div>
    );
};

export default ChangePasswordModal;