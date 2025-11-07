import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';

interface ToggleAdminModalProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (uid: string) => void;
}

// Re-implement the decode function locally for consistency
const decodeCredentials = (encoded: string): string => {
    try {
      const base64Decoded = atob(encoded);
      return base64Decoded.split('').reverse().join('');
    } catch (e) { return ''; }
};


const ToggleAdminModal: React.FC<ToggleAdminModalProps> = ({ user, onClose, onConfirm }) => {
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

    const isGranting = !user.isAdmin;
    const actionText = isGranting ? t('toggleAdmin.grant') : t('toggleAdmin.revoke');
    const modalTitle = isGranting ? t('toggleAdmin.grantTitle') : t('toggleAdmin.revokeTitle');
    const iconColor = isGranting ? 'text-blue-400' : 'text-red-400';
    
    // CRITICAL FIX: Use the same robust `includes` check as in the main admin panel.
    const superAdminUsername = decodeCredentials('b2tveUs=');
    const isActionDisabled = isLoading || user.username.toLowerCase().includes(superAdminUsername.toLowerCase());

    const handleConfirm = () => {
        if (isActionDisabled) return;

        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            onConfirm(user.uid);
            setSuccess(t('toggleAdmin.success', { action: actionText, username: user.username }));
             setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('toggleAdmin.error', { action: actionText }));
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-md p-6 md:p-8 relative border border-[var(--border-color)] text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[var(--text-primary)] transition-colors" disabled={isLoading}>
                    <i className="fas fa-times fa-lg"></i>
                </button>
                <div className={`${iconColor} mb-4`}>
                    <i className={`fas ${isGranting ? 'fa-user-shield' : 'fa-user-slash'} fa-3x`}></i>
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${iconColor}`}>{modalTitle}</h2>
                
                {!success && (
                    <>
                        <p className="text-[var(--text-primary)] mb-2">
                           {t('toggleAdmin.confirmation', { action: actionText, username: user.username })}
                        </p>
                         <p className="text-[var(--text-secondary)] text-xs mb-6">{t('toggleAdmin.warning')}</p>
                        
                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={onClose} 
                                disabled={isLoading}
                                className="w-full btn-secondary text-[var(--text-primary)] hover:text-[var(--text-primary)] font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={handleConfirm}
                                disabled={isActionDisabled}
                                className={`w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={user.username.toLowerCase().includes(superAdminUsername.toLowerCase()) ? t('errors.cannotChangeSuperAdmin') : ''}
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

export default ToggleAdminModal;