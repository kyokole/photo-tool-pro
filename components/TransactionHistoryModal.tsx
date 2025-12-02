
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
                    // FIX: Removed 'orderBy' to avoid composite index requirement.
                    // We will fetch all user transactions and sort them on the client side.
                    const q = query(
                        collection(db, 'transactions'),
                        where('uid', '==', currentUser.uid)
                    );
                    const querySnapshot = await getDocs(q);
                    const list: Transaction[] = [];
                    querySnapshot.forEach((doc) => {
                        list.push({ id: doc.id, ...doc.data() } as Transaction);
                    });
                    
                    // Sort locally by timestamp descending (newest first)
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
        return new Date(isoString).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };
    
    const formatCurrency = (amount: number, currency: string = 'VND') => {
         if (currency === 'USD') {
             return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
         }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1C2128] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-bold text-[var(--accent-cyan)]">{t('history.transactionsTitle')}</h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <i className="fas fa-circle-notch fa-spin text-2xl text-[var(--accent-cyan)]"></i>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center text-[var(--text-secondary)] p-8">
                            <i className="fas fa-history text-4xl mb-3 opacity-50"></i>
                            <p>{t('history.noTransactions')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx.id} className="bg-[var(--bg-tertiary)] p-4 rounded-lg flex items-center justify-between border border-white/5 hover:border-[var(--accent-cyan)]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.gateway === 'PAYPAL' ? 'bg-blue-900/50 text-blue-400' : (tx.type === 'vip' ? 'bg-purple-900/50 text-purple-400' : 'bg-yellow-900/50 text-yellow-400')}`}>
                                            <i className={`fab ${tx.gateway === 'PAYPAL' ? 'fa-paypal' : (tx.type === 'vip' ? 'fa-crown' : 'fa-coins')}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{tx.packageName || tx.packageId}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{formatDate(tx.timestamp)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === 'vip' ? 'text-purple-400' : 'text-yellow-400'}`}>
                                            +{tx.amount} {tx.type === 'vip' ? t('countdown.days', { count: '' }).trim() : 'Credits'}
                                        </p>
                                        {tx.price && (
                                             <p className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(tx.price, tx.currency)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TransactionHistoryModal;
