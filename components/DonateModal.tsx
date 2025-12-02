
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DonateModalProps {
    onClose: () => void;
}

const DonateModal: React.FC<DonateModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [copyButtonText, setCopyButtonText] = useState(t('donateModal.copy'));
    const [isQrZoomed, setIsQrZoomed] = useState(false);
    
    // --- CẤU HÌNH THÔNG TIN DONATE TẠI ĐÂY ---
    const accountNumber = '88996868777'; // Số tài khoản ngân hàng
    const accountName = 'LE HOAI VU'; // Tên chủ tài khoản
    const bankName = 'MB Bank'; // Tên ngân hàng
    
    // Link QR Code (Thay bằng link ảnh QR của bạn nếu cần)
    const qrCodeUrl = "https://lh3.googleusercontent.com/d/10ZyxwBH8Sr2XyV_eMuaGNlrv8dpB0Iut";
    
    // Link PayPal.Me của bạn (Đã cập nhật từ ảnh chụp màn hình)
    const paypalLink = "https://www.paypal.com/paypalme/kyokole"; 
    // ------------------------------------------

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber).then(() => {
            setCopyButtonText(t('donateModal.copied'));
            setTimeout(() => setCopyButtonText(t('donateModal.copy')), 2000);
        });
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in" 
                onClick={onClose}
            >
                <div 
                    className="bg-[var(--bg-component)] rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 md:p-8 relative text-[var(--text-primary)] border border-[var(--border-color)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <i className="fas fa-times fa-2x"></i>
                    </button>
                    
                    <div className="text-center mb-6">
                        <i className="fas fa-coffee text-[var(--accent-cyan)] text-4xl mb-3"></i>
                        <h2 className="text-2xl font-bold text-[var(--accent-cyan)]">{t('aboutModal.contact.donate')}</h2>
                        <p className="text-[var(--text-secondary)] mt-2 text-sm">{t('donateModal.description')}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[var(--bg-tertiary)] rounded-md">
                            <div>
                                <p className="text-xs text-[var(--text-secondary)]">{t('donateModal.accountNumber')}</p>
                                <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">{accountNumber}</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="bg-[var(--accent-blue)] text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-[var(--accent-cyan)] transition-colors min-w-[80px]"
                            >
                                <i className="fas fa-copy mr-1"></i> {copyButtonText}
                            </button>
                        </div>
                         <div className="p-3 bg-[var(--bg-tertiary)] rounded-md">
                            <p className="text-xs text-[var(--text-secondary)]">{t('donateModal.accountHolder')}</p>
                            <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">{accountName}</p>
                        </div>
                         <div className="p-3 bg-[var(--bg-tertiary)] rounded-md">
                            <p className="text-xs text-[var(--text-secondary)]">{t('donateModal.bank')}</p>
                            <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">{bankName}</p>
                        </div>
                        
                        {/* PayPal Button */}
                        <a 
                            href={paypalLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-3 bg-[#0070BA] hover:bg-[#003087] text-white rounded-md transition-colors w-full"
                        >
                            <i className="fab fa-paypal text-xl"></i>
                            <span className="font-bold">{t('donateModal.donatePaypal')}</span>
                        </a>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{t('donateModal.qrPrompt')}</p>
                        <img 
                            src={qrCodeUrl}
                            alt={t('donateModal.qrAlt')}
                            className="w-full max-w-[250px] mx-auto rounded-lg border-4 border-[var(--bg-tertiary)] shadow-lg cursor-zoom-in transition-transform hover:scale-105"
                            onClick={() => setIsQrZoomed(true)}
                        />
                    </div>
                </div>
            </div>
            {isQrZoomed && (
                <div 
                    className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center backdrop-blur-md p-4 animate-fade-in"
                    onClick={() => setIsQrZoomed(false)}
                >
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={qrCodeUrl}
                            alt={t('donateModal.qrAlt')}
                            className="max-w-[95vw] max-h-[95vh] w-auto h-auto rounded-lg shadow-2xl"
                        />
                         <button 
                            onClick={() => setIsQrZoomed(false)} 
                            className="absolute -top-3 -right-3 bg-white/20 text-white rounded-full h-8 w-8 flex items-center justify-center text-xl hover:bg-white/30 transition-colors"
                            aria-label="Close zoomed QR code"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default DonateModal;
