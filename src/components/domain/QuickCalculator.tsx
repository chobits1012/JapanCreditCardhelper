import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calculator, DollarSign, Store, Calendar, Wallet, Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { calculateReward, type CalculationResult } from '../../services/calculator';
import type { MerchantCategory } from '../../types';

export default function QuickCalculator() {
    const { cards, activeCardIds, addTransaction } = useStore();

    // Filter active cards
    const activeCards = cards.filter(c => activeCardIds.includes(c.id));

    // Form State
    const [amount, setAmount] = useState<number>(10000);
    const [currency, setCurrency] = useState<'JPY' | 'TWD'>('JPY');
    const [exchangeRate, setExchangeRate] = useState<number>(0.22);
    const [isRateLoading, setIsRateLoading] = useState<boolean>(false);
    const [rateSource, setRateSource] = useState<'default' | 'live'>('default');
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [category, setCategory] = useState<MerchantCategory>('general_japan');
    const [merchantName, setMerchantName] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Apple Pay');

    const [results, setResults] = useState<CalculationResult[]>([]);
    const [savedId, setSavedId] = useState<string | null>(null); // Feedback for save

    // Fetch Exchange Rate when Currency changes to JPY
    useEffect(() => {
        const fetchRate = async () => {
            if (currency === 'JPY') {
                setIsRateLoading(true);
                try {
                    // Try to fetch live rate
                    const response = await fetch('https://api.frankfurter.app/latest?from=JPY&to=TWD');
                    if (!response.ok) throw new Error('Network response was not ok');

                    const data = await response.json();
                    if (data?.rates?.TWD) {
                        setExchangeRate(data.rates.TWD);
                        setRateSource('live');
                    }
                } catch (error) {
                    // Fallback to default if offline or error
                    console.log('Using default rate due to error:', error);
                    // We don't overwrite user's manual input if they already changed it? 
                    // For now, let's just stick to current value (which defaults to 0.22) if fetch fails
                    // But if it was 'live' before (e.g. flaky connection), we might want to keep it.
                    // If it's the first load, it stays 0.22.
                    if (rateSource !== 'live') {
                        setRateSource('default');
                    }
                } finally {
                    setIsRateLoading(false);
                }
            }
        };

        fetchRate();
    }, [currency]); // Run when currency switches matches user intent "use instant grab"

    // Helper to create base transaction object
    const createBaseTransaction = () => ({
        id: crypto.randomUUID(),
        date,
        amount,
        currency,
        exchangeRate, // Use state
        merchantName,
        category,
        paymentMethod,
        cardId: '',
        programId: '',
        calculatedRewardAmount: 0,
        appliedRuleNames: []
    });

    const handleCalculate = () => {
        setSavedId(null);
        const baseTx = createBaseTransaction();

        // 2. Calculate for each card
        // 2. Calculate for each card
        const calculatedResults = activeCards.map(card => {
            // Pre-calculate usage for this card based on the transaction date and card's billing cycle
            const usageMap: Record<string, number> = {};
            // const activeProgram = card.programs.find(p => p); // Simplification, normally use getActiveProgram logic

            // In a robust implementation, we'd check activeProgram's rules. 
            // Here we iterate all rules of the current program
            // But calculateReward does getActiveProgram internally.

            // To be precise: find active program for THIS transaction date -> get its rules -> sum usage
            // MVP Shortcut: We just ask `calculateReward` what it needs? No, circular.
            // Correct approach: Iterate active card rules. 
            // We'll rely on our stored transaction data.

            // Let's iterate all known rules for this card (to be safe/simple) or just active program's rules.
            const program = card.programs[0]; // Assuming one active program for now or finding it:
            if (program) {
                program.bonusRules.forEach(rule => {
                    // Pass card.statementDate (default 31 if undefined)
                    const usage = useStore.getState().getRuleUsage(rule.id, date, card.statementDate || 27);
                    usageMap[rule.id] = usage;
                });
            }

            return calculateReward(card, baseTx, usageMap);
        });

        // 3. Sort by total reward (desc)
        calculatedResults.sort((a, b) => b.totalReward - a.totalReward);

        setResults(calculatedResults);
    };

    const handleSave = (res: CalculationResult) => {
        const baseTx = createBaseTransaction();

        // Convert breakdown to usage map
        const ruleUsageMap: Record<string, number> = {};
        res.breakdown.forEach(item => {
            // Accumulate usage per rule
            ruleUsageMap[item.ruleId] = (ruleUsageMap[item.ruleId] || 0) + item.amount;
        });

        const transactionToSave = {
            ...baseTx,
            cardId: res.cardId,
            calculatedRewardAmount: res.totalReward,
            appliedRuleNames: res.breakdown.map(b => b.ruleName),
            ruleUsageMap
        };

        addTransaction(transactionToSave);
        setSavedId(res.cardId);

        // Optional: clear form or show toast
        setTimeout(() => setSavedId(null), 3000);
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
            <header className="flex items-center space-x-2 mb-6 animate-fade-in-up">
                <Calculator className="w-6 h-6 text-indigo-700" />
                <h1 className="text-xl font-bold text-slate-800">回饋試算</h1>
            </header>

            {/* Input Form */}
            <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in-up delay-100">

                {/* Amount Input */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">消費金額</label>
                    <div className="flex items-stretch glass-input p-0 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <div className="flex items-center justify-center pl-4 pr-2 bg-gray-50/50 border-r border-gray-100">
                            <DollarSign className="w-5 h-5 text-gray-500" />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="flex-1 min-w-0 px-4 py-4 bg-transparent border-none text-2xl font-bold text-slate-800 placeholder-slate-300 focus:ring-0 outline-none"
                        />
                        <div className="flex items-center pr-3 space-x-1 shrink-0">
                            <button
                                onClick={() => setCurrency('JPY')}
                                className={`text-xs px-2 py-1 rounded-md transition-all ${currency === 'JPY' ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-slate-400'}`}
                            >JPY</button>
                            <button
                                onClick={() => setCurrency('TWD')}
                                className={`text-xs px-2 py-1 rounded-md transition-all ${currency === 'TWD' ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-slate-400'}`}
                            >TWD</button>
                        </div>
                    </div>
                </div>

                {/* Exchange Rate Input (Only for JPY) */}
                {currency === 'JPY' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-medium text-gray-500 uppercase">匯率 (JPY to TWD)</label>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rateSource === 'live'
                                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                    : 'bg-orange-100 text-orange-600 border border-orange-200'
                                }`}>
                                {isRateLoading ? '更新中...' : rateSource === 'live' ? '● 即時匯率' : '● 預設匯率'}
                            </span>
                        </div>
                        <input
                            type="number"
                            step="0.0001"
                            value={exchangeRate}
                            onChange={(e) => {
                                setExchangeRate(Number(e.target.value));
                                setRateSource('default'); // If user manually edits, treat as custom/default
                            }}
                            className="w-full px-4 py-2 glass-input text-sm text-gray-700 font-mono"
                        />
                    </div>
                )}

                {/* Category & Merchant */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase">通路類型</label>
                        <div className="flex items-center glass-input p-0 overflow-hidden">
                            <div className="pl-3 pr-2 py-3 bg-gray-50/50 border-r border-gray-100">
                                <Store className="w-4 h-4 text-gray-400" />
                            </div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as MerchantCategory)}
                                className="flex-1 min-w-0 px-3 py-3 bg-transparent border-none text-sm text-gray-700 font-medium appearance-none focus:ring-0 outline-none"
                            >
                                <option value="general_japan">一般實體</option>
                                <option value="drugstore">藥妝店</option>
                                <option value="electronics">電器行</option>
                                <option value="convenience">便利商店</option>
                                <option value="department">百貨公司</option>
                                <option value="dining">餐廳</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase">店家名稱 (選填)</label>
                        <input
                            type="text"
                            placeholder="例如: 唐吉軻德"
                            value={merchantName}
                            onChange={(e) => setMerchantName(e.target.value)}
                            className="w-full px-4 py-3 glass-input text-sm text-gray-700"
                        />
                    </div>
                </div>

                {/* Date & Payment */}
                <div className="bg-white/40 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/50">
                        <span className="text-gray-500 font-medium text-sm">消費日期</span>
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none text-sm text-gray-700 font-medium focus:ring-0 p-0 text-right"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium text-sm">支付方式</span>
                        <div className="flex items-center space-x-2">
                            <Wallet className="w-4 h-4 text-gray-400" />
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="bg-transparent border-none text-sm text-gray-700 font-medium appearance-none focus:ring-0 p-0 text-right pr-4"
                            >
                                <option value="Apple Pay">Apple Pay</option>
                                <option value="QUICPay">QUICPay</option>
                                <option value="Physical Card">實體卡</option>
                                <option value="Google Pay">Google Pay</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleCalculate}
                    className="w-full bg-gradient-to-r from-indigo-900 to-violet-800 hover:from-indigo-800 hover:to-violet-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200/50 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 animate-fade-in-up delay-200"
                >
                    <span>計算最佳回饋</span>
                </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 animate-fade-in-up delay-300">推薦順序</h2>

                    {results.map((res, index) => {
                        const card = activeCards.find(c => c.id === res.cardId) || cards.find(c => c.id === res.cardId);
                        if (!card) return null;
                        const isBest = index === 0;

                        return (
                            <div
                                key={res.cardId}
                                className={`glass-card p-5 rounded-2xl transition-all border animate-fade-in-up
                                    ${isBest
                                        ? 'border-rose-200/50 shadow-rose-100/30 shadow-lg scale-[1.02]'
                                        : 'border-white/40 hover:scale-[1.01]'
                                    }
                                `}
                                style={{ animationDelay: `${400 + index * 100}ms` }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        {isBest && <Trophy className="w-4 h-4 text-rose-500" />}
                                        <span className={`font-bold ${isBest ? 'text-indigo-900' : 'text-slate-700'}`}>{card.name}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">{card.bank}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-rose-600">
                                            {res.totalReward} <span className="text-sm font-normal">元</span>
                                        </div>
                                        {res.transactionFee > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                (扣除手續費 {res.transactionFee} 後約 {res.netReward})
                                            </div>
                                        )}
                                        <div className="text-xs font-medium text-gray-600 mt-1">
                                            總回饋率 {(res.totalRate * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                {res.breakdown.length > 0 && (
                                    <div className="px-4 pb-4 pt-2">
                                        <div className="h-px w-full bg-indigo-100/30 mb-2" />
                                        <div className="space-y-1">
                                            {res.breakdown.map((rule, i) => (
                                                <div key={i} className="flex justify-between text-xs text-gray-500">
                                                    <span>{rule.ruleName} <span className="text-[10px] opacity-70 ml-1">({rule.capLimit ? `上限$${rule.capLimit}` : '無上限'})</span></span>
                                                    <span>+{rule.amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {res.warnings.length > 0 && (
                                            <div className="mt-2 p-2 bg-red-50 text-red-400 text-xs rounded-lg border border-red-100">
                                                {res.warnings.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Save Action */}
                                <div className="mt-4 pt-2">
                                    <button
                                        onClick={() => handleSave(res)}
                                        disabled={savedId !== null}
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-all
                                            ${savedId === res.cardId
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                                : isBest
                                                    ? 'bg-white text-indigo-900 hover:bg-slate-50'
                                                    : 'bg-indigo-700 text-white hover:bg-indigo-800'
                                            }
                                         `}
                                    >
                                        {savedId === res.cardId ? '已儲存！' : '紀錄此筆回饋'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
