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
                            <div key={card.id} className="glass-card rounded-2xl overflow-hidden">
                                <div className="bg-white/40 px-4 py-3 border-b border-white/20 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">{card.name}</h3>
                                    <span className="text-xs text-gray-500">{card.bank}</span>
                                </div>
                                <div className="p-4 space-y-5">
                                    {rulesWithCaps.map(rule => {
                                        // Use current date to show "current status"
                                        const nowStr = format(new Date(), 'yyyy-MM-dd');
                                        const used = getRuleUsage(rule.id, nowStr, card.statementDate || 27);
                                        const cap = rule.capAmount || 0;
                                        const percent = Math.min(100, (used / cap) * 100);
                                        const isNearLimit = percent >= 80;
                                        const isFull = percent >= 100;

                                        return (
                                            <div key={rule.id} className="space-y-2">
                                                <div className="flex justify-between items-baseline text-sm">
                                                    <span className="font-medium text-gray-700 font-sans tracking-wide">{rule.name}</span>
                                                    <span className={`${isFull ? 'text-red-500 font-bold' : isNearLimit ? 'text-orange-500' : 'text-gray-500'} font-mono`}>
                                                        ${used} <span className="text-gray-300 text-xs">/ ${cap}</span>
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : isNearLimit ? 'bg-orange-400' : 'bg-primary-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                {isFull && <p className="text-[10px] text-red-500">已達上限，建議更換卡片消費</p>}
                                            </div>
                                        );
                                    })}
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
                    <div className="space-y-3">
                        {sortedTransactions.map(tx => {
                            const card = cards.find(c => c.id === tx.cardId);
                            return (
                                <div key={tx.id} className="glass-card p-3 rounded-xl flex justify-between items-center group">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-gray-400">{format(new Date(tx.date), 'MM/dd')}</span>
                                            <span className="font-medium text-gray-800">{tx.merchantName || '未知名稱'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{card?.name || '未知卡片'}</span>
                                            <span className="text-xs text-gray-400">{tx.currency} {tx.amount}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-primary-900">+{tx.calculatedRewardAmount}</div>
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
