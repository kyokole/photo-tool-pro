
import React from 'react';
import { useTranslation } from 'react-i18next';

interface UpgradeVipModalProps {
    onClose: () => void;
    onContact: () => void;
}

const UpgradeVipModal: React.FC<UpgradeVipModalProps> = ({ onClose, onContact }) => {
    const { t } = useTranslation();

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#0f1115] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-gray-800 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Content Area: 2 Columns */}
                <div className="flex flex-col md:flex-row">
                    
                    {/* LEFT COLUMN: CREDIT */}
                    <div className="w-full md:w-1/2 p-6 md:p-10 border-b md:border-b-0 md:border-r border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-yellow-400">
                                <i className="fas fa-coins text-2xl"></i>
                            </div>
                            <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-sm">
                                {t('upgradeVipModal.creditTitle')}
                            </h3>
                        </div>
                        
                        <h2 className="text-white text-2xl md:text-3xl font-extrabold mb-3">
                            {t('upgradeVipModal.creditSubtitle')}
                        </h2>
                        <p className="text-gray-400 text-sm mb-8">
                            {t('upgradeVipModal.creditDesc')}
                        </p>

                        <div className="space-y-4">
                            {/* 100 Credit */}
                            <div className="bg-[#1a1d24] rounded-xl p-4 flex justify-between items-center border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer group">
                                <div>
                                    <div className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">{t('upgradeVipModal.credit100')}</div>
                                    <div className="text-gray-500 text-sm">{t('upgradeVipModal.standardLabel')}</div>
                                </div>
                                <div className="text-yellow-400 font-bold text-xl">50.000 VNĐ</div>
                            </div>

                            {/* 500 Credit - HOT */}
                            <div className="bg-[#1a1d24] rounded-xl p-4 flex justify-between items-center border border-yellow-600/50 hover:border-yellow-500 transition-colors cursor-pointer relative group">
                                <div className="absolute -top-3 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    HOT
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">{t('upgradeVipModal.credit500')}</div>
                                    <div className="text-gray-500 text-sm">{t('upgradeVipModal.bestValue')}</div>
                                </div>
                                <div className="text-yellow-400 font-bold text-xl">200.000 VNĐ</div>
                            </div>
                        </div>

                        <p className="text-gray-500 text-xs mt-6 italic">
                            {t('upgradeVipModal.creditNote')}
                        </p>
                    </div>

                    {/* RIGHT COLUMN: VIP */}
                    <div className="w-full md:w-1/2 p-6 md:p-10 bg-[#0f1115]">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="text-purple-400 animate-pulse">
                                <i className="fas fa-crown text-2xl"></i>
                            </div>
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-sm">
                                {t('upgradeVipModal.vipTitle')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Standard Member Card */}
                            <div className="bg-[#16181d] rounded-xl p-4 border border-gray-800 opacity-60">
                                <h4 className="text-gray-400 font-bold mb-4">{t('upgradeVipModal.memberStandard')}</h4>
                                <ul className="space-y-3 text-xs text-gray-500">
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-coins text-yellow-600"></i> {t('upgradeVipModal.standardBenefit1')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-ban text-red-800"></i> {t('upgradeVipModal.standardBenefit2')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-lock text-gray-600"></i> {t('upgradeVipModal.standardBenefit3')}
                                    </li>
                                </ul>
                            </div>

                            {/* VIP Member Card */}
                            <div className="bg-[#1b1924] rounded-xl p-4 border-2 border-purple-500 relative shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                                    {t('upgradeVipModal.recommended')}
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-white font-bold">{t('upgradeVipModal.memberVip')}</h4>
                                    <div className="bg-purple-500 rounded-full p-0.5">
                                        <i className="fas fa-check text-white text-[10px] w-3 h-3 flex items-center justify-center"></i>
                                    </div>
                                </div>
                                <ul className="space-y-3 text-xs text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <span className="text-purple-400 font-bold">∞</span> {t('upgradeVipModal.vipBenefit1')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-tint-slash text-blue-400"></i> {t('upgradeVipModal.vipBenefit2')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-unlock text-green-400"></i> {t('upgradeVipModal.vipBenefit3')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-[#0f1115] p-6 flex flex-col items-center justify-center border-t border-gray-800">
                    <button
                        onClick={onContact}
                        className="w-full max-w-lg bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transform hover:scale-[1.02]"
                    >
                        <i className="fab fa-facebook-messenger text-xl"></i>
                        <span className="text-lg">{t('upgradeVipModal.contactButton')}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="mt-4 text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
                    >
                        {t('upgradeVipModal.closeButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeVipModal;
