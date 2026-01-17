import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calculator, DollarSign, Store, Trophy, Plane, Home } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { calculateReward, type CalculationResult } from '../../services/calculator';
import type { MerchantCategory } from '../../types';

export default function QuickCalculator() {
    const { cards, activeCardIds, addTransaction, mode, toggleMode } = useStore();

    // Form State
    const [amount, setAmount] = useState<number | ''>(10000);
    const [currency, setCurrency] = useState<'JPY' | 'TWD'>('JPY');
    const [exchangeRate, setExchangeRate] = useState<number | ''>(0.22);
    const [isRateLoading, setIsRateLoading] = useState<boolean>(false);
    const [rateSource, setRateSource] = useState<'default' | 'live'>('default');
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [category, setCategory] = useState<MerchantCategory>('general_japan');
    const [merchantName, setMerchantName] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Apple Pay');

    const [results, setResults] = useState<CalculationResult[]>([]);
    const [savedId, setSavedId] = useState<string | null>(null); // Feedback for save

    // Filter active cards logic
    const activeCards = cards.filter(c => {
        // Condition A: It's an active card marked by user
        const isActive = activeCardIds.includes(c.id);

        // Condition B: It's a special Virtual Card (ID starts with 'card_virtual_')
        // We include virtual cards if they match the special payment method
        const isVirtual = c.id.startsWith('card_virtual_');

        // Initial filter: Must be active OR virtual
        if (!isActive && !isVirtual) return false;

        // Payment Method Filtering Logic
        const isSpecialPayment = paymentMethod.startsWith('PayPay');

        if (isSpecialPayment) {
            // If selecting PayPay, ONLY show cards that explicitly support it
            return c.supportedPaymentMethods?.includes(paymentMethod);
        } else {
            // If generic payment (e.g. Apple Pay), EXCLUDE cards that are strictly for special payments (virtual ones)
            // unless we decide virtual cards can do generic? (Usually no, account payments are specific)
            if (isVirtual && c.supportedPaymentMethods && c.supportedPaymentMethods.length > 0) return false;

            // For normal cards, we assume they support generic methods unless specified otherwise
            // (Simple model: if supportedPaymentMethods is empty, it's a normal card)
            return true;
        }
    });

    // Fetch Exchange Rate when Currency changes to JPY
    useEffect(() => {
        const fetchRate = async () => {
            if (currency === 'JPY') {
                setIsRateLoading(true);
                try {
                    // Try to fetch live rate from ExchangeRate-API (Frankfurter doesn't support TWD consistently)
                    const response = await fetch('https://open.er-api.com/v6/latest/JPY');
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
        amount: Number(amount) || 0,
        currency,
        exchangeRate: Number(exchangeRate) || 0, // Use state
        merchantName,
        category,
        paymentMethod,
        cardId: '',
        programId: '',
        calculatedRewardAmount: 0,
        appliedRuleNames: []
    });

    // Instant Calculation Effect
    useEffect(() => {
        // Reset saved state on input change to avoid confusion
        setSavedId(null);

        // debounce slightly to avoid rapid updates if typing fast, though local calc is fast.
        // For now, direct execution is fine for this scale.

        const baseTx = createBaseTransaction();

        const calculatedResults = activeCards.map(card => {
            const usageMap: Record<string, number> = {};
            const program = card.programs[0]; // Active program logic simplification

            // 1. Pre-fetch usage for all rules of this card (to pass to calculator and for display)
            // Ideally we should know WHICH program is active. 
            // calculateReward does internal generic check, but for usageMap we need keys.
            // We'll trust the calculator to apply the right ones, but we provide usage for ALL.
            if (program) {
                program.bonusRules.forEach(rule => {
                    const usage = useStore.getState().getRuleUsage(rule.id, date, card.statementDate || 27);
                    usageMap[rule.id] = usage;
                });
            }

            // 2. Perform Calculation
            return calculateReward(card, baseTx, usageMap, mode);
        });

        // 3. Sort logic:
        // Priority: Net Reward > Total Reward
        calculatedResults.sort((a, b) => b.netReward - a.netReward);

        setResults(calculatedResults);

    }, [amount, currency, exchangeRate, date, category, merchantName, paymentMethod, mode, activeCards.length, activeCardIds]); // Re-calc on any dependency change


    const handleSave = (res: CalculationResult) => {
        const baseTx = createBaseTransaction();

        // Convert breakdown to usage map
        const ruleUsageMap: Record<string, number> = {};
        res.breakdown.forEach(item => {
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
        setTimeout(() => setSavedId(null), 3000);
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
            <header className="flex items-center justify-between mb-4 animate-fade-in-up">
                <div className="flex items-center space-x-2">
                    <Calculator className="w-6 h-6 text-indigo-700" />
                    <h1 className="text-xl font-bold text-slate-800">回饋試算</h1>
                </div>

                {/* Mode Toggle Switch */}
                <button
                    onClick={toggleMode}
                    className={`
                        relative flex items-center h-9 rounded-full p-1 transition-all duration-300 shadow-inner
                        ${mode === 'travel' ? 'bg-indigo-100 w-32' : 'bg-orange-100 w-32'}
                    `}
                >
                    <div className={`
                        absolute w-1/2 h-7 rounded-full shadow-sm flex items-center justify-center transition-all duration-300 font-bold text-xs gap-1 z-10
                        ${mode === 'travel'
                            ? 'translate-x-[calc(100%-4px)] left-0 bg-indigo-600 text-white'
                            : 'translate-x-0 left-1 bg-orange-500 text-white'
                        }
                    `}>
                        {mode === 'travel' ? <Plane className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                        {mode === 'travel' ? '旅日模式' : '日常模式'}
                    </div>

                    {/* Background Labels */}
                    <div className="w-full h-full flex justify-between items-center text-[10px] font-bold px-3">
                        <span className={`transition-opacity duration-300 ${mode === 'daily' ? 'opacity-0' : 'text-indigo-400 opacity-70'}`}>日常</span>
                        <span className={`transition-opacity duration-300 ${mode === 'travel' ? 'opacity-0' : 'text-orange-400 opacity-70'}`}>旅日</span>
                    </div>
                </button>
            </header>

            {/* Input Form */}
            <div className="glass-card rounded-2xl p-5 space-y-4 animate-fade-in-up delay-100">

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
                            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="flex-1 min-w-0 px-4 py-3 bg-transparent border-none text-2xl font-bold text-slate-800 placeholder-slate-300 focus:ring-0 outline-none"
                            placeholder="0"
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

                    {/* TWD Conversion Display (Only for JPY) */}
                    {currency === 'JPY' && amount && Number(amount) > 0 && exchangeRate && (
                        <div className="flex items-center gap-1.5 ml-1 mt-1.5 text-[11px] text-gray-400 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span>≈</span>
                            <span className="font-medium text-gray-500">TWD ${Math.floor(Number(amount) * Number(exchangeRate)).toLocaleString()}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px]">
                                {rateSource === 'live' ? '即時匯率' : '預設匯率'} {Number(exchangeRate).toFixed(4)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Exchange Rate Input (Only for JPY) */}
                {currency === 'JPY' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-medium text-gray-500 uppercase">匯率</label>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rateSource === 'live'
                                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                : 'bg-orange-100 text-orange-600 border border-orange-200'
                                }`}>
                                {isRateLoading ? '更新中...' : rateSource === 'live' ? '● 即時' : '● 預設'}
                            </span>
                        </div>
                        <input
                            type="number"
                            step="0.0001"
                            value={exchangeRate}
                            onChange={(e) => {
                                setExchangeRate(e.target.value === '' ? '' : Number(e.target.value));
                                setRateSource('default');
                            }}
                            className="w-full px-3 py-2 glass-input text-sm text-gray-700 font-mono"
                        />
                    </div>
                )}

                {/* Category & Merchant */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase">通路類型</label>
                        <div className="flex items-center glass-input p-0 overflow-hidden">
                            <div className="pl-3 pr-2 py-2.5 bg-gray-50/50 border-r border-gray-100">
                                <Store className="w-4 h-4 text-gray-400" />
                            </div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as MerchantCategory)}
                                className="flex-1 min-w-0 px-2 py-2.5 bg-transparent border-none text-sm text-gray-700 font-medium appearance-none focus:ring-0 outline-none"
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

                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase">店家 (選填)</label>
                        <input
                            type="text"
                            placeholder="如: 唐吉軻德"
                            value={merchantName}
                            onChange={(e) => setMerchantName(e.target.value)}
                            className="w-full px-3 py-2.5 glass-input text-sm text-gray-700"
                        />
                    </div>
                </div>

                {/* Date & Payment */}
                <div className="bg-white/40 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">消費日期</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent border-none font-medium focus:ring-0 p-0 text-right text-slate-700"
                        />
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200/50">
                        <span className="text-gray-500 font-medium">支付方式</span>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="bg-transparent border-none font-medium appearance-none focus:ring-0 p-0 text-right pr-4 text-slate-700"
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
            </div>

            {/* Results Section */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider animate-fade-in-up delay-300">
                            最佳推薦 (淨賺排序)
                        </h2>
                    </div>

                    {results.map((res, index) => {
                        const card = activeCards.find(c => c.id === res.cardId) || cards.find(c => c.id === res.cardId);
                        if (!card) return null;
                        const isBest = index === 0;

                        return (
                            <div
                                key={res.cardId}
                                className={`glass-card p-5 rounded-2xl transition-all border animate-fade-in-up relative overflow-hidden
                                    ${isBest
                                        ? 'border-rose-200/50 shadow-rose-100/30 shadow-xl scale-[1.01] bg-gradient-to-br from-white via-rose-50/10 to-transparent'
                                        : 'border-white/40 opacity-90'
                                    }
                                `}
                                style={{ animationDelay: `${200 + index * 50}ms` }}
                            >
                                {/* Active Selection Indicator */}
                                {savedId === res.cardId && (
                                    <div className="absolute inset-0 bg-emerald-500/10 z-0 animate-pulse"></div>
                                )}

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {isBest && <Trophy className="w-5 h-5 text-rose-500 fill-rose-100" />}
                                            <div>
                                                <div className={`font-bold text-lg leading-tight ${isBest ? 'text-indigo-900' : 'text-slate-700'}`}>{card.name}</div>
                                                <span className="text-xs text-slate-500">{card.bank}</span>
                                            </div>
                                        </div>

                                        {/* NET REWARD DISPLAY (Big & Clean) */}
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-rose-600 tracking-tight">
                                                <span className="text-lg font-bold mr-0.5">$</span>{res.netReward.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mt-0.5">淨賺 (Net Earn)</div>
                                        </div>
                                    </div>

                                    {/* Breakdown & Cap Info */}
                                    <div className="bg-white/40 rounded-lg p-3 space-y-2">
                                        {/* Primary Stats Row */}
                                        <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100/50">
                                            <div className="space-x-3">
                                                <span className="text-gray-500">總回饋 <b className="text-slate-700">${Math.round(res.totalReward)}</b></span>
                                                {res.transactionFee > 0 && <span className="text-gray-500">手續費 <b className="text-slate-700">-${Math.round(res.transactionFee)}</b></span>}
                                            </div>
                                            <div className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                回饋率 {(res.totalRate * 100).toFixed(1)}%
                                            </div>
                                        </div>

                                        {/* Rule Details with CAP INFO */}
                                        <div className="space-y-1.5 pt-1">
                                            {res.breakdown.map((rule, i) => {
                                                // Fetch active usage for this rule to show remaining cap
                                                const usage = useStore.getState().getRuleUsage(rule.ruleId, date, card.statementDate || 27);
                                                const cap = rule.capLimit || 0;
                                                const remaining = Math.max(0, cap - usage);
                                                const isNearCap = cap > 0 && remaining < (Number(amount) * 0.1); // arbitrary warning threshold

                                                // Get minAmount from the actual rule definition
                                                const program = card.programs[0];
                                                const ruleDefinition = program?.bonusRules.find(r => r.id === rule.ruleId);
                                                const minAmount = ruleDefinition?.minAmount;

                                                return (
                                                    <div key={i} className="flex justify-between items-center text-[11px]">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className="text-slate-600 truncate max-w-[150px]">
                                                                {rule.ruleName} <span className="text-gray-400 font-medium ml-0.5">[{Number((rule.rate * 100).toFixed(1))}%]</span>
                                                            </span>
                                                            {cap > 0 && (
                                                                <span className={`text-[9px] px-1.5 py-0 rounded ${isNearCap ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-100 text-slate-400'}`}>
                                                                    剩 ${remaining.toLocaleString()}
                                                                </span>
                                                            )}
                                                            {minAmount && (
                                                                <span className="text-[9px] px-1.5 py-0 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                                                    ≥${minAmount.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-mono text-slate-700">+{rule.amount.toLocaleString()}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Warnings */}
                                        {res.warnings.length > 0 && (
                                            <div className="mt-2 text-[10px] text-red-500 font-medium bg-red-50 p-1.5 rounded">
                                                ⚠️ {res.warnings.join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Action */}
                                    <button
                                        onClick={() => handleSave(res)}
                                        disabled={savedId !== null}
                                        className={`w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                            ${savedId === res.cardId
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                                : isBest
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                                                    : 'bg-white text-indigo-900 border border-indigo-100 hover:bg-indigo-50'
                                            }
                                            active:scale-[0.98]
                                         `}
                                    >
                                        {savedId === res.cardId ? (
                                            <><span>已儲存</span></>
                                        ) : (
                                            <><span>{isBest ? '紀錄這筆消費' : '紀錄'}</span></>
                                        )}
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
