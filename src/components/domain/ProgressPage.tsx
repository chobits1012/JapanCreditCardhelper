import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import ConfirmModal from '../ui/ConfirmModal';

export default function ProgressPage() {
    const { cards, activeCardIds, transactions, getRuleUsage, removeTransaction, resetTransactions, mode } = useStore();
    const activeCards = cards.filter(c => activeCardIds.includes(c.id));

    // Sort transactions by date desc
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                                            const used = getRuleUsage(rule.id, nowStr, card.statementDate || 27);
                                            const cap = rule.capAmount || 0;
                                            const safeUsed = typeof used === 'number' ? used : 0;
                                            const safeCap = typeof cap === 'number' && cap > 0 ? cap : 1;
                                            const rawPercent = (safeUsed / safeCap) * 100;
                                            const percent = Math.min(100, Math.max(0, rawPercent));

                                            const isNearLimit = percent >= 80;
                                            const isFull = percent >= 100;

                                            return (
                                                <div key={rule.id} className="space-y-2.5">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-sm font-medium text-slate-700">{rule.name}</span>
                                                        <div className="text-right">
                                                            <span className={`text-xs font-bold font-mono ${isFull ? 'text-rose-500' : isNearLimit ? 'text-amber-500' : 'text-indigo-600'}`}>
                                                                ${used.toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium ml-1">/ ${cap.toLocaleString()}</span>
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
                    <h2 className="text-lg font-bold text-gray-800">交易紀錄</h2>
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
                    <div className="space-y-0.5 px-2">
                        {sortedTransactions.map(tx => {
                            const card = cards.find(c => c.id === tx.cardId);

                            // Receipt Style (Standalone)
                            const receiptStyle = "bg-[#FFFBF5] p-3 flex justify-between items-center group border border-stone-200 border-dashed rounded-xl shadow-sm hover:bg-[#FFF9F0] transition-colors relative";

                            return (
                                <div key={tx.id} className={receiptStyle}>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-stone-500 font-mono tracking-tighter">
                                                {format(new Date(tx.date), 'MM/dd')}
                                            </span>
                                            <span className="font-medium text-stone-800 font-serif">
                                                {tx.merchantName || '未知名稱'}
                                            </span>
                                        </div>
                                        <div className="flex justify-start items-center mt-1">
                                            {/* Fixed Width Container for Alignment */}
                                            <div className="w-32 flex items-center text-[10px] text-stone-500 tracking-wider truncate mr-1">
                                                <span className="flex-shrink-0">{card?.bank}</span>
                                                <span className="text-stone-300 mx-1 flex-shrink-0">|</span>
                                                <span className="truncate">{card?.name}</span>
                                            </div>
                                            <span className="text-xs font-mono text-stone-600 bg-stone-100 px-1.5 rounded flex-shrink-0">
                                                {tx.currency} {tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-stone-800 font-mono">
                                                +{tx.calculatedRewardAmount}
                                            </div>
                                            <div className="text-[10px] text-gray-400">回饋</div>
                                        </div>
                                        <button
                                            onClick={() => openModal(
                                                '刪除紀錄',
                                                '確定要刪除這筆交易紀錄嗎？\n刪除後進度將會扣除，但無法復原。',
                                                () => removeTransaction(tx.id),
                                                true
                                            )}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-60 group-hover:opacity-100"
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
        </div>
    );
}
