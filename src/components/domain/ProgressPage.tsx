import { useState } from 'react';
import { Trash2, ArrowUpDown, ChevronDown, Calendar, Store, DollarSign } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import ConfirmModal from '../ui/ConfirmModal';
import TransactionDetailModal from './TransactionDetailModal';
import type { Transaction } from '../../types';

export default function ProgressPage() {
    const { cards, activeCardIds, transactions, getRuleUsage, removeTransaction, resetTransactions, mode } = useStore();
    const activeCards = cards.filter(c => activeCardIds.includes(c.id));

    // Sorting State
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Selected Transaction for Detail Modal
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Filter transactions based on mode (Travel = JPY only, Daily = TWD only)
    const filteredTransactions = transactions.filter(tx => {
        return mode === 'travel' ? tx.currency === 'JPY' : tx.currency === 'TWD';
    });

    // Sort transactions
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
            comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === 'amount') {
            comparison = b.amount - a.amount;
        } else if (sortBy === 'merchant') {
            comparison = (a.merchantName || '').localeCompare(b.merchantName || '');
        }
        return sortOrder === 'desc' ? comparison : -comparison;
    });

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false
    });

    const openModal = (title: string, message: string, action: () => void, isDanger = false) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                action();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            isDanger
        });
    };

    const toggleSort = (newSort: 'date' | 'amount' | 'merchant') => {
        if (sortBy === newSort) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSort);
            setSortOrder('desc');
        }
        setIsSortOpen(false);
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-8 pb-20">
            <header className="flex items-center space-x-2 mb-2">
                <h1 className="text-xl font-bold text-gray-800">回饋進度</h1>
            </header>

            <ConfirmModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />

            {selectedTx && (
                <TransactionDetailModal
                    isOpen={!!selectedTx}
                    transaction={selectedTx}
                    onClose={() => setSelectedTx(null)}
                />
            )}

            {/* Progress Section */}
            {activeCards.length === 0 ? (
                <div className="text-center py-10 text-gray-400 glass-card rounded-2xl border border-dashed border-gray-300">
                    <p>請先至「卡片」頁面勾選您擁有的信用卡</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeCards.map(card => {
                        // Find all rules with caps
                        const rulesWithCaps = card.programs.flatMap(p => p.bonusRules)
                            .filter(r => r.capAmount !== undefined)
                            .filter(r => {
                                const allowedRegions = mode === 'travel' ? ['global', 'japan'] : ['global', 'taiwan'];
                                return allowedRegions.includes(r.region || 'japan');
                            });

                        if (rulesWithCaps.length === 0) return null;

                        return (
                            <div key={card.id} className="relative group">
                                {/* Decorative Gradient Border/Glow */}
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-300/30 via-purple-300/30 to-rose-300/30 rounded-[1.2rem] opacity-70 blur-sm group-hover:opacity-100 transition-all duration-500"></div>

                                {/* Card Container - Morandi Latte Theme */}
                                <div className="relative bg-[#E8DCCA]/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-stone-300/40 border border-[#DBCeb5] overflow-hidden transition-transform duration-500 hover:scale-[1.01]">
                                    {/* Card Header */}
                                    <div className="relative px-5 py-4 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-transparent border-b border-indigo-50/50">
                                        <div className="flex items-center gap-3">
                                            {/* Bank Icon / Accent */}
                                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 shadow-sm"></div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg tracking-tight">{card.name}</h3>
                                                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase bg-slate-100/80 px-2 py-0.5 rounded-full">{card.bank}</span>
                                            </div>
                                        </div>
                                        {/* Optional: Card Image placeholder or Icon */}
                                        <div className="w-10 h-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity">
                                            <div className="w-full h-full bg-white/30 backdrop-blur-sm transform rotate-45 translate-x-2"></div>
                                        </div>
                                    </div>

                                    {/* Rules Usage Section */}
                                    <div className="p-5 space-y-6">
                                        {rulesWithCaps.map(rule => {
                                            const nowStr = format(new Date(), 'yyyy-MM-dd');
                                            const used = getRuleUsage(rule.id, nowStr, card.statementDate || 27, card.billingCycleType);
                                            const cap = rule.capAmount || 0;
                                            const safeUsed = typeof used === 'number' ? used : 0;
                                            const safeCap = typeof cap === 'number' && cap > 0 ? cap : 1;
                                            const rawPercent = (safeUsed / safeCap) * 100;
                                            const percent = Math.min(100, Math.max(0, rawPercent));

                                            const isNearLimit = percent >= 80;
                                            const isFull = percent >= 100;

                                            // Determine currency symbol
                                            const currency = rule.capAmountCurrency || 'TWD';
                                            const currencySymbol = currency === 'JPY' ? '¥' : '$';

                                            return (
                                                <div key={rule.id} className="space-y-2.5">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-sm font-medium text-slate-700">{rule.name}</span>
                                                        <div className="text-right">
                                                            <span className={`text-xs font-bold font-mono ${isFull ? 'text-rose-500' : isNearLimit ? 'text-amber-500' : 'text-indigo-600'}`}>
                                                                {currencySymbol}{used.toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium ml-1">/ {currencySymbol}{cap.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar Container */}
                                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-100 shadow-inner relative">
                                                        {/* Background Track Pattern (Optional) */}
                                                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 to-transparent" />

                                                        <div
                                                            className={`h-full rounded-full shadow-sm relative transition-all duration-500 ease-out
                                                                ${isFull
                                                                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                                                                    : isNearLimit
                                                                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                                }
                                                            `}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>

                                                    {isFull && (
                                                        <div className="flex items-center gap-1.5 animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            <p className="text-[10px] font-bold text-rose-500">已達上限，建議更換卡片</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Transaction History Section */}
            <div className="pt-4 border-t border-gray-100">
                <header className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">交易紀錄</h2>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-stone-600 transition-colors"
                            >
                                <ArrowUpDown className="w-3 h-3" />
                                {sortBy === 'date' ? '日期' : sortBy === 'amount' ? '金額' : '商家'}
                                {sortOrder === 'asc' ? '↑' : '↓'}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                                    <div className="absolute left-0 mt-1 w-24 bg-white rounded-xl shadow-xl border border-stone-100 z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button onClick={() => toggleSort('date')} className={`w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-stone-50 flex items-center gap-2 ${sortBy === 'date' ? 'text-indigo-600 bg-indigo-50' : 'text-stone-600'}`}>
                                            <Calendar className="w-3.5 h-3.5" /> 日期
                                        </button>
                                        <button onClick={() => toggleSort('amount')} className={`w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-stone-50 flex items-center gap-2 ${sortBy === 'amount' ? 'text-indigo-600 bg-indigo-50' : 'text-stone-600'}`}>
                                            <DollarSign className="w-3.5 h-3.5" /> 金額
                                        </button>
                                        <button onClick={() => toggleSort('merchant')} className={`w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-stone-50 flex items-center gap-2 ${sortBy === 'merchant' ? 'text-indigo-600 bg-indigo-50' : 'text-stone-600'}`}>
                                            <Store className="w-3.5 h-3.5" /> 商家
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {sortedTransactions.length > 0 && (
                        <button
                            onClick={() => openModal(
                                '清空消費紀錄',
                                '確定要清除所有已紀錄的消費嗎？\n您的卡片設定與自訂資料「不會」被刪除，僅清除進度條與交易列表。',
                                () => resetTransactions(),
                                true
                            )}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                        >
                            清空紀錄
                        </button>
                    )}
                </header>

                {sortedTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        尚未有紀錄
                    </div>
                ) : (
                    <div className="space-y-3 px-1 pb-4">
                        {sortedTransactions.map(tx => {
                            const card = cards.find(c => c.id === tx.cardId);

                            // Receipt Style (Standalone but connected)
                            const receiptStyle = "bg-[#FFFBF5] p-3.5 flex justify-between items-center group border border-stone-200 border-dashed rounded-2xl shadow-sm hover:bg-[#FFF9F0] hover:border-indigo-200 hover:shadow-md transition-all duration-300 relative cursor-pointer active:scale-[0.98]";

                            return (
                                <div
                                    key={tx.id}
                                    className={receiptStyle}
                                    onClick={() => setSelectedTx(tx)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-bold text-stone-400 font-mono tracking-tighter bg-stone-100 px-1.5 py-0.5 rounded">
                                                {format(new Date(tx.date), 'MM/dd')}
                                            </span>
                                            <span className="font-bold text-stone-800 font-serif">
                                                {tx.merchantName || '未知名稱'}
                                            </span>
                                        </div>
                                        <div className="flex justify-start items-center mt-1.5">
                                            {/* Fixed Width Container for Alignment */}
                                            <div className="flex items-center text-[10px] text-stone-500 tracking-wider font-medium truncate mr-1 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100">
                                                <span className="flex-shrink-0">{card?.bank}</span>
                                                <span className="text-stone-300 mx-1 flex-shrink-0">|</span>
                                                <span className="truncate">{card?.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold font-mono text-stone-600 ml-1">
                                                {tx.currency === 'JPY' ? '¥' : '$'} {tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className="text-base font-black text-indigo-600 font-mono">
                                                +{tx.calculatedRewardAmount}
                                            </div>
                                            <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Rewards</div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openModal(
                                                    '刪除紀錄',
                                                    '確定要刪除這筆交易紀錄嗎？\n刪除後進度將會扣除，但無法復原。',
                                                    () => removeTransaction(tx.id),
                                                    true
                                                );
                                            }}
                                            className="p-2.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all group-hover:opacity-100 opacity-40"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reset Data Section */}
            <div className="pt-8 text-center pb-8 border-t border-gray-100 mt-8">
                <button
                    onClick={() => openModal(
                        '重置應用程式',
                        '警告：這是用來修復嚴重錯誤的選項。\n確定要重置整個應用程式嗎？\n\n這將會：\n1. 刪除所有交易紀錄\n2. 刪除所有自訂卡片與設定\n3. 恢復到剛安裝時的狀態',
                        () => {
                            localStorage.clear();
                            window.location.reload();
                        },
                        true
                    )}
                    className="text-[10px] text-gray-300 hover:text-red-400 underline transition-colors"
                >
                    重置應用程式 (Factory Reset)
                </button>
            </div>
        </div >
    );
}
