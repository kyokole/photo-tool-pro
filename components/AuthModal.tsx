import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';

interface AuthModalProps {
    onLogin: (username: string, password: string) => Promise<void>;
    onRegister: (username: string, password: string) => Promise<void>;
    onGoogleSignIn: () => Promise<void>;
    onForgotPassword: (email: string) => Promise<void>;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onRegister, onGoogleSignIn, onForgotPassword, onClose }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isGoogleSignInUnavailable, setIsGoogleSignInUnavailable] = useState(false);
    
    // State to toggle between Login and Register views
    const [isLoginView, setIsLoginView] = useState(true);

    // Forgot password state
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryResult, setRecoveryResult] = useState<string>('');
    const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isFindingPassword, setIsFindingPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError(t('errors.fillAllFields'));
            return;
        }
        if (!isLoginView && password.length < 6) {
            setError(t('errors.passwordTooShort'));
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            if (isLoginView) {
                await onLogin(email, password);
            } else {
                await onRegister(email, password);
            }
            // On success, onAuthStateChanged in App.tsx will close the modal.
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.unknownError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignInClick = async () => {
        setError('');
        setIsLoading(true);
        try {
            await onGoogleSignIn();
            // On success, onAuthStateChanged in App.tsx will close the modal.
        } catch (err: any) {
            let userFriendlyError = t('errors.unknownError');
            if (err.code === 'auth/user-disabled') {
                userFriendlyError = t('errors.userDisabled');
            } else if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/operation-not-allowed') {
                setIsGoogleSignInUnavailable(true);
                userFriendlyError = t('auth.unauthorizedDomain');
            } else if (err.code === 'auth/popup-blocked') {
                userFriendlyError = t('auth.popupBlocked');
            } else if (err.code === 'auth/popup-closed-by-user') {
                userFriendlyError = t('auth.popupClosed');
            } else if (err.code === 'auth/cancelled-popup-request') {
                userFriendlyError = t('auth.popupCancelled');
            } else {
                userFriendlyError = err.message || userFriendlyError;
            }
            setError(userFriendlyError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recoveryEmail) {
            setRecoveryResult(t('auth.enterUsernamePrompt'));
            setRecoveryStatus('error');
            return;
        }
        
        setIsFindingPassword(true);
        setRecoveryResult('');
        setRecoveryStatus('idle');

        try {
            await onForgotPassword(recoveryEmail);
            setRecoveryResult(t('auth.recoverySuccess', { email: recoveryEmail }));
            setRecoveryStatus('success');
        } catch (error: any) {
            console.error("Failed to send password reset email:", error);
            if (error.code === 'auth/user-not-found') {
                 setRecoveryResult(t('auth.userNotFound'));
            } else {
                 setRecoveryResult(t('auth.recoveryError'));
            }
            setRecoveryStatus('error');
        } finally {
            setIsFindingPassword(false);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setPassword('');
    };

    const renderMainForm = () => (
        <>
            <div className="text-[var(--accent-blue)] mb-4">
                <i className="fas fa-user-lock fa-3x"></i>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">{isLoginView ? t('auth.loginTitle') : t('auth.registerTitle')}</h2>
            <p className="text-[var(--text-secondary)] mb-6"
                dangerouslySetInnerHTML={{ __html: t('auth.description') }}
            >
            </p>
            
            <div className="space-y-4">
                <button
                    onClick={handleGoogleSignInClick}
                    disabled={isLoading || isGoogleSignInUnavailable}
                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                        <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.651-3.657-11.303-8.653l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path>
                        <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C43.021 36.697 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                    </svg>
                    {isLoading ? t('common.processing') : t('auth.googleSignIn')}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-[var(--border-color)]" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[var(--bg-component)] text-[var(--text-secondary)]">{t('auth.or')}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.usernamePlaceholder')}
                        className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                        required
                        aria-label={t('auth.usernamePlaceholder')}
                        autoComplete="email"
                    />
                    <div>
                        <div className="relative">
                            <input 
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.passwordPlaceholder')}
                                className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] pr-10"
                                required
                                aria-label={t('auth.passwordPlaceholder')}
                                autoComplete={isLoginView ? "current-password" : "new-password"}
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                aria-label={isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                                <i className={`fas ${isPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        {isLoginView && (
                            <div className="text-right text-sm mt-1">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setError('');
                                    }}
                                    className="text-[var(--accent-blue)] hover:text-[var(--accent-cyan)] hover:underline text-xs"
                                >
                                    {t('auth.forgotPassword')}
                                </button>
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoading ? t('common.processing') : (isLoginView ? t('auth.loginButton') : t('auth.registerButton'))}
                    </button>
                </form>

                <p className="text-sm text-[var(--text-secondary)]">
                    {isLoginView ? t('auth.noAccount') : t('auth.hasAccount')}
                    <button onClick={toggleView} className="font-semibold text-[var(--accent-blue)] hover:text-[var(--accent-cyan)] hover:underline ml-1">
                        {isLoginView ? t('auth.registerNow') : t('auth.loginNow')}
                    </button>
                </p>
            </div>
        </>
    );

    const renderForgotPasswordForm = () => (
        <>
            <div className="text-[var(--accent-blue)] mb-4">
                <i className="fas fa-key fa-3x"></i>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">{t('auth.recoverTitle')}</h2>
            <p className="text-[var(--text-secondary)] mb-6">
                {t('auth.recoverDescription')}
            </p>
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <input 
                    type="email" 
                    value={recoveryEmail}
                    onChange={(e) => {
                        setRecoveryEmail(e.target.value);
                        setRecoveryResult('');
                        setRecoveryStatus('idle');
                    }}
                    placeholder={t('auth.recoverPlaceholder')}
                    className="w-full bg-[var(--bg-deep-space)] border border-[var(--border-color)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                    required
                    aria-label={t('auth.recoverPlaceholder')}
                    autoComplete="email"
                />
                <button 
                    type="submit"
                    disabled={isFindingPassword}
                    className="w-full btn-gradient text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isFindingPassword ? t('auth.finding') : t('auth.findButton')}
                </button>
            </form>

            {recoveryResult && (
                <div className={`mt-4 p-3 rounded-md text-sm text-center border ${recoveryStatus === 'success' ? 'bg-green-900/50 border-green-500/50 text-green-300' : 'bg-red-900/50 border-red-500/50 text-red-300'}`}>
                    <p>{recoveryResult}</p>
                </div>
            )}

            <button 
                type="button" 
                onClick={() => {
                    setIsForgotPassword(false);
                    setRecoveryResult('');
                    setRecoveryStatus('idle');
                    setRecoveryEmail('');
                }}
                className="mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
            >
                &larr; {t('auth.backToLogin')}
            </button>
        </>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-md p-6 md:p-8 relative border border-[var(--border-color)] text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[var(--text-primary)] transition-colors">
                    <i className="fas fa-times fa-lg"></i>
                </button>
                {isForgotPassword ? renderForgotPasswordForm() : renderMainForm()}
            </div>
        </div>
    );
};

export default AuthModal;