
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
        if (tx.gateway === 'PAYPAL') {
            return { 
                icon: 'fa-paypal', 
                lib: 'fab', // Brand icon
                color: 'text-blue-400', 
                bg: 'bg-blue-500/20',
                border: 'border-blue-500/30'
            };
        }
        if (tx.type === 'vip') {
            return { 
                icon: 'fa-crown', 
                lib: 'fas', // Solid icon
                color: 'text-purple-400', 
                bg: 'bg-purple-500/20',
                border: 'border-purple-500/30'
            };
        }
        // Mặc định là Credit
        return { 
            icon: 'fa-coins', 
            lib: 'fas', // Solid icon
            color: 'text-yellow-400', 
            bg: 'bg-yellow-500/20',
            border: 'border-yellow-500/30'
        };
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#1C2128] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-[var(--border-color)] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <header className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[#161b22]">
                    <div>
                         <h2 className="text-xl font-bold text-white">{t('history.transactionsTitle')}</h2>
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
                            <div className="w-24 h-24 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-700 opacity-50">
                                <i className="fas fa-receipt text-4xl text-gray-500"></i>
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
                                    <div key={tx.id} className="group relative bg-[#1C2128] p-4 rounded-xl border border-white/5 hover:border-[var(--accent-cyan)]/50 transition-all duration-200 hover:shadow-lg hover:bg-[#262c36]">
                                        <div className="flex items-start gap-4">
                                            {/* Icon Box */}
                                            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl shadow-inner border ${style.bg} ${style.color} ${style.border}`}>
                                                <i className={`${style.lib} ${style.icon}`}></i>
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-white text-base truncate pr-2">
                                                            {packageName}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                            <span>{time}</span>
                                                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                            <span>{date}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-bold text-lg ${tx.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                                            +{tx.amount} {tx.type === 'vip' ? t('history.days') : 'Credits'}
                                                        </div>
                                                        <div className="text-xs font-mono text-gray-400 mt-0.5">
                                                            {tx.price ? formatCurrency(tx.price, tx.currency) : t('history.free')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Info */}
                                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 text-gray-500 font-mono bg-black/20 px-2 py-1 rounded select-all">
                                                        <i className="fas fa-hashtag text-[10px]"></i> 
                                                        {tx.gateway === 'PAYPAL' ? tx.orderId?.substring(0, 12) + '...' : tx.shortId}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tx.gateway === 'PAYPAL' ? (
                                                            <span className="flex items-center gap-1 text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
                                                                <i className="fab fa-paypal"></i> PayPal
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-gray-300 bg-gray-700/30 px-2 py-0.5 rounded">
                                                                <i className="fas fa-qrcode"></i> {t('history.bankTransfer')}
                                                            </span>
                                                        )}
                                                        
                                                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                                            tx.status === 'success' ? 'bg-green-500/10 text-green-400' : 
                                                            tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                                                        }`}>
                                                            {tx.status === 'success' ? t('history.status.success') : (tx.status === 'pending' ? t('history.status.pending') : t('history.status.failed'))}
                                                        </span>
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
                    <footer className="p-4 border-t border-[var(--border-color)] bg-[#161b22] text-center text-xs text-gray-500">
                        {t('history.showingRecent', { count: transactions.length })}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default TransactionHistoryModal;
