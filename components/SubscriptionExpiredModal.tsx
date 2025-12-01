
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PAYMENT_PACKAGES } from '../constants';
import type { PaymentPackage, PackageType, User } from '../types';

interface UpgradeVipModalProps {
    onClose: () => void;
    onContact: () => void; // Fallback to manual contact
    currentUser?: User | null;
}

const UpgradeVipModal: React.FC<UpgradeVipModalProps> = ({ onClose, onContact, currentUser }) => {
    const { t } = useTranslation();
    const [selectedPackage, setSelectedPackage] = useState<(PaymentPackage & { nameKey: string, shortCode: string }) | null>(null);
    const [step, setStep] = useState<'select' | 'payment'>('select');

    // Filter packages by type
    const creditPackages = PAYMENT_PACKAGES.filter(p => p.type === 'credit');
    const vipPackages = PAYMENT_PACKAGES.filter(p => p.type === 'vip');

    const handlePackageClick = (pkg: (PaymentPackage & { nameKey: string, shortCode: string })) => {
        setSelectedPackage(pkg);
        setStep('payment');
    };

    const handleBack = () => {
        setStep('select');
        setSelectedPackage(null);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const renderPackageCard = (pkg: (PaymentPackage & { nameKey: string, shortCode: string })) => (
        <div 
            key={pkg.id} 
            onClick={() => handlePackageClick(pkg)}
            className={`relative bg-[#1a1d24] rounded-xl p-4 border transition-all cursor-pointer group hover:scale-[1.02] flex flex-col justify-between min-h-[140px]
                ${pkg.popular ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-700 hover:border-gray-500'}
            `}
        >
            {pkg.popular && (
                <div className="absolute -top-3 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                    HOT
                </div>
            )}
            
            <div>
                <h4 className={`font-bold text-lg mb-1 group-hover:text-yellow-400 transition-colors ${pkg.type === 'vip' ? 'text-purple-300' : 'text-white'}`}>
                    {t(pkg.nameKey)}
                </h4>
                <div className="text-gray-400 text-xs mb-2">
                    {pkg.type === 'credit' ? `${pkg.amount} Credits` : `${pkg.amount} ${t('countdown.days', { count: '' }).trim()}`}
                </div>
            </div>

            <div>
                {pkg.originalPrice && (
                    <div className="text-gray-600 text-xs line-through">
                        {formatCurrency(pkg.originalPrice)}
                    </div>
                )}
                <div className="text-yellow-400 font-bold text-xl">
                    {formatCurrency(pkg.price)}
                </div>
            </div>
        </div>
    );

    const renderPaymentStep = () => {
        if (!selectedPackage || !currentUser) return null;

        // Generate dynamic transfer content: PHOTO [ShortUID] [ShortPackage]
        const shortUid = currentUser.uid.substring(0, 6).toUpperCase();
        const transferContent = `PHOTO ${shortUid} ${selectedPackage.shortCode}`.toUpperCase();
        
        // Generate VietQR Link
        const bankId = 'VCB'; // Vietcombank
        const accountNo = '9937601088'; // From donate modal
        const accountName = 'LE HOAI VU';
        // IMPORTANT: Ensure addInfo matches transferContent EXACTLY
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${selectedPackage.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

        return (
            <div className="flex flex-col md:flex-row gap-8 h-full">
                <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 bg-white rounded-2xl">
                    <img src={qrUrl} alt="VietQR" className="max-w-full h-auto rounded-lg shadow-md mb-4" />
                    <p className="text-gray-500 text-xs text-center">
                        {t('paymentModal.scanQr')}
                    </p>
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
                    <div>
                        <h3 className="text-white font-bold text-xl mb-2">{t('paymentModal.transferInfo')}</h3>
                        <p className="text-gray-400 text-sm">{t('paymentModal.autoActivationNote')}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#1a1d24] p-3 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase">{t('paymentModal.bank')}</p>
                            <p className="text-white font-mono font-bold">Vietcombank</p>
                        </div>
                        <div className="bg-[#1a1d24] p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">{t('paymentModal.accountNo')}</p>
                                <p className="text-white font-mono font-bold text-lg">{accountNo}</p>
                            </div>
                            <button onClick={() => navigator.clipboard.writeText(accountNo)} className="text-blue-400 hover:text-blue-300">
                                <i className="fas fa-copy"></i>
                            </button>
                        </div>
                        <div className="bg-[#1a1d24] p-3 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase">{t('paymentModal.amount')}</p>
                            <p className="text-yellow-400 font-mono font-bold text-xl">{formatCurrency(selectedPackage.price)}</p>
                        </div>
                        <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/50 flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs text-blue-300 uppercase font-bold">{t('paymentModal.content')}</p>
                                <p className="text-white font-mono font-bold text-lg tracking-wide">{transferContent}</p>
                                <p className="text-[10px] text-yellow-500 mt-1 italic">* {t('paymentModal.contentNote')}</p>
                            </div>
                            <button onClick={() => navigator.clipboard.writeText(transferContent)} className="text-blue-400 hover:text-blue-300 relative z-10">
                                <i className="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-auto">
                        <button onClick={handleBack} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors">
                            {t('common.back')}
                        </button>
                        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors">
                            {t('paymentModal.iHavePaid')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#0f1115] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-gray-800 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#13151a]">
                    <div>
                        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-wider">
                            {step === 'select' ? t('paymentModal.title') : t('paymentModal.paymentTitle')}
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">
                            {step === 'select' ? t('paymentModal.subtitle') : `${t('paymentModal.selectedPackage')}: ${t(selectedPackage?.nameKey || '')}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    {step === 'select' ? (
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* LEFT: CREDIT PACKAGES */}
                            <div className="w-full md:w-1/2">
                                <div className="flex items-center gap-2 mb-4">
                                    <i className="fas fa-coins text-yellow-400 text-xl"></i>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">{t('paymentModal.creditPackages')}</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                                    {creditPackages.map(renderPackageCard)}
                                </div>
                                <p className="text-gray-500 text-xs mt-4 italic">
                                    * {t('upgradeVipModal.creditNote')}
                                </p>
                            </div>

                            {/* RIGHT: VIP PACKAGES */}
                            <div className="w-full md:w-1/2">
                                <div className="flex items-center gap-2 mb-4">
                                    <i className="fas fa-crown text-purple-400 text-xl animate-pulse"></i>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">{t('paymentModal.vipPackages')}</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                                    {vipPackages.map(renderPackageCard)}
                                </div>
                                
                                {/* VIP Benefits List */}
                                <div className="mt-6 bg-[#16181d] rounded-xl p-4 border border-gray-800">
                                    <h4 className="text-gray-300 font-bold text-xs mb-3 uppercase">{t('paymentModal.vipBenefits')}</h4>
                                    <ul className="space-y-2 text-xs text-gray-400">
                                        <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> {t('upgradeVipModal.vipBenefit1')}</li>
                                        <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> {t('upgradeVipModal.vipBenefit2')}</li>
                                        <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> {t('upgradeVipModal.vipBenefit3')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        renderPaymentStep()
                    )}
                </div>

                {/* Footer (Only for select step) */}
                {step === 'select' && (
                    <div className="p-4 bg-[#13151a] border-t border-gray-800 text-center">
                        <button onClick={onContact} className="text-xs text-blue-400 hover:text-blue-300 underline">
                            {t('paymentModal.manualSupport')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpgradeVipModal;
