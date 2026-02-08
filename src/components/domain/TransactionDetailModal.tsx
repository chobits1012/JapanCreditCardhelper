import { useState, useEffect } from 'react';
import { X, DollarSign, Store, Calendar, CreditCard as CardIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { recalculateTransaction, recalculateCardTransactions } from '../../services/calculator';
import type { MerchantCategory, Transaction } from '../../types';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction;
}

export default function TransactionDetailModal({ isOpen, onClose, transaction }: TransactionDetailModalProps) {
    const { cards, updateTransaction, getRuleUsage, mode } = useStore();

    // Form State
    const [amount, setAmount] = useState<number>(transaction.amount);
    const [currency, setCurrency] = useState<'JPY' | 'TWD'>(transaction.currency);
    const [date, setDate] = useState<string>(transaction.date);
    const [category, setCategory] = useState<MerchantCategory>(transaction.category);
    const [merchantName, setMerchantName] = useState<string>(transaction.merchantName);
    const [paymentMethod, setPaymentMethod] = useState<string>(transaction.paymentMethod);
    const [cardId, setCardId] = useState<string>(transaction.cardId);

    // Update local state when transaction prop changes
    useEffect(() => {
        setAmount(transaction.amount);
        setCurrency(transaction.currency);
        setDate(transaction.date);
        setCategory(transaction.category);
        setMerchantName(transaction.merchantName || '');
        setPaymentMethod(transaction.paymentMethod);
        setCardId(transaction.cardId);
    }, [transaction]);

    if (!isOpen) return null;

    const selectedCard = cards.find(c => c.id === cardId);
    const oldCard = cards.find(c => c.id === transaction.cardId);

    const handleSave = () => {
        if (!selectedCard) return;

        const isCardSwitched = transaction.cardId !== cardId;

        // Calculate usage map for the NEW card's rules
        const usageMap: Record<string, number> = {};
        const program = selectedCard.programs[0];

        if (program) {
            program.bonusRules.forEach(rule => {
                // Get current usage for this rule
                let used = getRuleUsage(rule.id, cardId, date, selectedCard.statementDate || 27, selectedCard.billingCycleType);

                // Only subtract the current transaction's usage if NOT switching cards
                if (!isCardSwitched && transaction.ruleUsageMap?.[rule.id]) {
                    used -= transaction.ruleUsageMap[rule.id];
                }

                usageMap[rule.id] = Math.max(0, used);
            });
        }

        const updatedTxData: Omit<Transaction, 'calculatedRewardAmount' | 'appliedRuleNames' | 'ruleUsageMap'> = {
            id: transaction.id,
            date,
            amount,
            currency,
            exchangeRate: transaction.exchangeRate,
            merchantName,
            category,
            paymentMethod,
            cardId: cardId,
            programId: transaction.programId,
        };

        // 1. Calculate the edited transaction
        const finalTx = recalculateTransaction(selectedCard, updatedTxData, usageMap, mode);
        updateTransaction(finalTx);

        // 2. If card was switched, recalculate ALL transactions on the OLD card
        //    This ensures cumulative thresholds are properly updated
        if (isCardSwitched && oldCard) {
            // Get current transactions (including the one we just updated)
            const currentTransactions = useStore.getState().transactions;

            // Recalculate old card's transactions (the edited tx is no longer on this card)
            const recalculatedOldCardTxs = recalculateCardTransactions(oldCard, currentTransactions, mode);

            // Update each recalculated transaction
            recalculatedOldCardTxs.forEach(tx => {
                updateTransaction(tx);
            });
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-[#F8F5F2] rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 flex justify-between items-center border-b border-stone-200/60 bg-white/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">修改交易紀錄</h2>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {transaction.id.slice(0, 8)}...</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Merchant & Category Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5" /> 店家名稱
                            </label>
                            <input
                                type="text"
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="請輸入店名"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5" /> 通路類別
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as MerchantCategory)}
                                className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                                <option value="general_japan">一般實體</option>
                                <option value="drugstore">藥妝店</option>
                                <option value="electronics">電器行</option>
                                <option value="convenience">便利商店</option>
                                <option value="department">百貨公司</option>
                                <option value="dining">餐廳</option>
                                <option value="online">網購</option>
                            </select>
                        </div>
                    </div>

                    {/* Amount & Currency */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> 消費金額
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-3 bg-white border border-stone-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                />
                            </div>
                            <div className="flex bg-white p-1 rounded-xl border border-stone-200">
                                {(['JPY', 'TWD'] as const).map(curr => (
                                    <button
                                        key={curr}
                                        onClick={() => setCurrency(curr)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currency === curr ? 'bg-indigo-600 text-white shadow-md' : 'text-stone-400'}`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Card & Payment */}
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <CardIcon className="w-3.5 h-3.5" /> 付款卡片
                            </label>
                            <select
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                            >
                                {cards.map(c => (
                                    <option key={c.id} value={c.id}>{c.bank} - {c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5" /> 支付方式
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                            >
                                <option value="Apple Pay">Apple Pay</option>
                                <option value="QUICPay">QUICPay</option>
                                <option value="Physical Card">實體卡</option>
                                <option value="Google Pay">Google Pay</option>
                                <option value="PayPay (玉山Wallet)">PayPay (玉山Wallet)</option>
                                <option value="PayPay (全支付)">PayPay (全支付)</option>
                                <option value="PayPay (街口)">PayPay (街口)</option>
                            </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> 消費日期
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-stone-200/60 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-stone-200 text-slate-600 font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-[0.98]"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] py-3 px-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                    >
                        儲存修改
                    </button>
                </div>
            </div>
        </div>
    );
}
