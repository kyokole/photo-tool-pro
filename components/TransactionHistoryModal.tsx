
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDbInstance } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Transaction, User } from '../types';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            const fetchTransactions = async () => {
                setIsLoading(true);
                try {
                    const db = getDbInstance();
                    const q = query(
                        collection(db, 'transactions'),
                        where('uid', '==', currentUser.uid)
                    );
                    const querySnapshot = await getDocs(q);
                    const list: Transaction[] = [];
                    querySnapshot.forEach((doc) => {
                        list.push({ id: doc.id, ...doc.data() } as Transaction);
                    });
                    
                    // Sắp xếp client-side: Mới nhất lên đầu
                    list.sort((a, b) => {
                        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                    });
                    
                    setTransactions(list);
                } catch (error) {
                    console.error("Error fetching transactions:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTransactions();
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
        };
    };
    
    const formatCurrency = (amount: number, currency: string = 'VND') => {
         if (currency === 'USD') {
             return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
         }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm xác định icon và màu sắc dựa trên loại giao dịch
    const getTransactionStyle = (tx: Transaction) => {
        if (tx.type === 'vip') {
            return { 
                icon: 'fas fa-crown', // Vương miện rõ ràng hơn
                color: 'text-purple-400', 
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
                label: 'Gói VIP'
            };
        }
        // Mặc định là Credit
        return { 
            icon: 'fas fa-coins', // Tiền xu
            color: 'text-yellow-400', 
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            label: 'Gói Credit'
        };
    };

    const getGatewayIcon = (gateway?: string) => {
        if (gateway === 'PAYPAL') return <i className="fab fa-paypal text-blue-400" title="PayPal"></i>;
        return <i className="fas fa-university text-green-400" title="Chuyển khoản"></i>;
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0d1117] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-[var(--border-color)] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <header className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[#161b22]">
                    <div>
                         <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <i className="fas fa-history text-[var(--accent-blue)]"></i>
                            {t('history.transactionsTitle')}
                         </h2>
                         <p className="text-xs text-gray-400 mt-1">{t('history.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </header>
                
                {/* Body */}
                <main className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-[#0d1117]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <svg className="animate-spin h-8 w-8 text-[var(--accent-cyan)] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-400">{t('common.processing')}</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                             <div className="w-24 h-24 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-600">
                                <i className="fas fa-receipt text-4xl text-gray-600"></i>
                            </div>
                            <h3 className="text-white font-semibold mb-1 text-lg">{t('history.noTransactions')}</h3>
                            <p className="text-sm text-gray-500">{t('history.noTransactionsDesc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => {
                                const style = getTransactionStyle(tx);
                                const { time, date } = formatDate(tx.timestamp);
                                // Dịch tên gói nếu có key, không thì dùng tên gốc
                                const packageName = t(`paymentPackages.${tx.packageId}`, { defaultValue: tx.packageName || tx.packageId });
                                
                                return (
                                    <div key={tx.id} className="bg-[#161b22] rounded-xl p-4 border border-white/5 hover:border-[var(--accent-cyan)]/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {/* Icon lớn bên trái */}
                                            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl ${style.bg} ${style.color} border ${style.border}`}>
                                                <i className={style.icon}></i>
                                            </div>

                                            {/* Nội dung chính */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white text-sm sm:text-base truncate pr-2">
                                                        {packageName}
                                                    </h4>
                                                    {/* Số lượng nhận được - Highlight màu xanh/vàng */}
                                                    <div className={`font-bold text-base ${tx.status === 'success' ? 'text-green-400' : 'text-gray-400'}`}>
                                                        +{tx.amount} {tx.type === 'vip' ? t('history.days') : 'Credits'}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <i className="far fa-clock"></i>
                                                            <span>{time}, {date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            {getGatewayIcon(tx.gateway)}
                                                            <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-[10px]">
                                                                {tx.gateway === 'PAYPAL' ? `ID: ${tx.orderId?.slice(-8)}` : `Mã: ${tx.shortId}`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Giá tiền - Luôn hiển thị số tiền, kể cả 0 */}
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-white/90">
                                                            {formatCurrency(tx.price || 0, tx.currency)}
                                                        </div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                                                            tx.status === 'success' ? 'text-green-500' : 
                                                            tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                                                        }`}>
                                                            {tx.status === 'success' ? t('history.status.success') : (tx.status === 'pending' ? t('history.status.pending') : t('history.status.failed'))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
                
                {/* Footer Summary */}
                {transactions.length > 0 && (
                    <footer className="p-3 border-t border-[var(--border-color)] bg-[#161b22] text-center text-xs text-gray-500">
                        {t('history.showingRecent', { count: transactions.length })}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default TransactionHistoryModal;
