import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { CreditCard, MerchantCategory } from '../../types';
import { ChevronLeft, Sparkles, Loader2, Plus, Trash2, Smartphone, CreditCard as CreditCardIcon } from 'lucide-react';
import { format, addYears } from 'date-fns';
import { MockBankService } from '../../services/bankData';
import { CARD_THEMES, getThemeByKeyword } from './cardThemes';
import ConfirmModal from '../ui/ConfirmModal';

interface CardDataFormProps {
    onBack: () => void;
    initialCard?: CreditCard;
}

interface BonusRuleState {
    id: string;
    name: string;
    rate: string;
    capAmount: string;
    capPeriod: 'monthly' | 'campaign';
    checkJapan: boolean;
    requiresRegistration: boolean;
    specificMerchants: string; // comma separated
    region: 'global' | 'japan' | 'taiwan';
    paymentMethods: string[]; // Selected payment methods
}

const PAYMENT_OPTIONS = [
    { id: 'Apple Pay', label: 'Apple Pay', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'Google Pay', label: 'Google Pay', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'QUICPay', label: 'QUICPay', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'Physical Card', label: '實體卡', icon: <CreditCardIcon className="w-3 h-3" /> },
    { id: 'PayPay (玉山Wallet)', label: '玉山 Wallet', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'PayPay (全支付)', label: '全支付', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'PayPay (街口)', label: '街口', icon: <Smartphone className="w-3 h-3" /> },
];

export default function CardDataForm({ onBack, initialCard }: CardDataFormProps) {
    const { addCard, updateCard, removeCard } = useStore();
    const isEditMode = !!initialCard;

    // --- State Initialization ---
    const activeProgram = initialCard?.programs[0];

    // Initialize Bonus Rules
    const initialRules: BonusRuleState[] = activeProgram?.bonusRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        rate: (rule.rate * 100).toString(),
        capAmount: rule.capAmount ? rule.capAmount.toString() : '',
        capPeriod: (rule.capPeriod as 'monthly' | 'campaign') || 'monthly',
        checkJapan: rule.categories.includes('general_japan'),
        region: rule.region || 'japan', // Default to japan for existing rules

        requiresRegistration: rule.requiresRegistration || false,
        specificMerchants: rule.specificMerchants ? rule.specificMerchants.join(', ') : '',
        paymentMethods: rule.paymentMethods || []
    })) || [];

    const [name, setName] = useState(initialCard?.name || '');
    const [bank, setBank] = useState(initialCard?.bank || '');
    // Initialize theme: from card data OR predict from name/bank if editing
    const [colorTheme, setColorTheme] = useState<string>(
        initialCard?.colorTheme || (initialCard ? getThemeByKeyword(initialCard.bank, initialCard.name) : 'matte_black')
    );
    const [statementDate, setStatementDate] = useState(initialCard?.statementDate?.toString() || '27');
    const [foreignTxFee, setForeignTxFee] = useState(initialCard?.foreignTxFee?.toString() || '1.5');

    // Split Base Rates
    const [baseRateOverseas, setBaseRateOverseas] = useState(activeProgram ? (activeProgram.baseRateOverseas * 100).toString() : '1');
    const [baseRateDomestic, setBaseRateDomestic] = useState(activeProgram ? (activeProgram.baseRateDomestic * 100).toString() : '1');

    const [programStartDate, setProgramStartDate] = useState(activeProgram?.startDate || format(new Date(), 'yyyy-MM-dd'));
    const [programEndDate, setProgramEndDate] = useState(activeProgram?.endDate || format(addYears(new Date(), 2), 'yyyy-MM-dd'));
    const [supportedPaymentMethods, setSupportedPaymentMethods] = useState<string[]>(initialCard?.supportedPaymentMethods || []);

    // Bonus Rule State Array
    const [bonusRules, setBonusRules] = useState<BonusRuleState[]>(initialRules);

    // Auto-fill State
    const [isSearching, setIsSearching] = useState(false);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleAutoFill = async () => {
        if (!bank && !name) {
            alert('請至少輸入銀行或卡片名稱關鍵字（如：富邦 J 卡）');
            return;
        }

        setIsSearching(true);
        try {
            const keyword = [bank, name].filter(Boolean).join(' ');
            const template = await MockBankService.fetchCardTemplate(keyword);

            if (template) {
                // Apply template
                if (template.name) setName(template.name);
                if (template.bank) setBank(template.bank);
                // Auto-select theme based on keyword
                setColorTheme(getThemeByKeyword(template.bank || '', template.name || ''));

                const prog = template.programs?.[0];
                if (prog) {
                    setBaseRateOverseas((prog.baseRateOverseas * 100).toString());
                    setBaseRateDomestic((prog.baseRateDomestic * 100).toString());

                    if (prog.bonusRules && prog.bonusRules.length > 0) {
                        const newRules: BonusRuleState[] = prog.bonusRules.map(rule => ({
                            id: crypto.randomUUID(),
                            name: rule.name,
                            rate: (rule.rate * 100).toString(),
                            capAmount: rule.capAmount ? rule.capAmount.toString() : '',
                            capPeriod: (rule.capPeriod as 'monthly' | 'campaign') || 'monthly',
                            checkJapan: rule.categories.includes('general_japan'),
                            requiresRegistration: rule.requiresRegistration || false,
                            specificMerchants: rule.specificMerchants ? rule.specificMerchants.join(', ') : '',
                            region: rule.region || 'japan',
                            paymentMethods: rule.paymentMethods || []
                        }));
                        setBonusRules(newRules);
                    }

                    if (prog.startDate) setProgramStartDate(prog.startDate);
                    if (prog.endDate) setProgramEndDate(prog.endDate);
                }
            } else {
                alert('找不到符合的卡片資料，請嘗試關鍵字（如：富邦 J, CUBE）');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const cardId = initialCard?.id || crypto.randomUUID();
        const programId = activeProgram?.id || crypto.randomUUID();

        // Convert BonusRuleState back to Domain BonusRule
        const domainBonusRules = bonusRules.map(ruleState => ({
            id: ruleState.id,
            name: ruleState.name,
            rate: parseFloat(ruleState.rate) / 100,
            categories: ruleState.checkJapan
                ? ['general_japan', 'drugstore', 'electronics', 'department', 'convenience'] as MerchantCategory[]
                : [],
            capAmount: ruleState.capAmount ? parseInt(ruleState.capAmount) : undefined,
            capPeriod: ruleState.capPeriod,
            requiresRegistration: ruleState.requiresRegistration,
            specificMerchants: ruleState.specificMerchants
                ? ruleState.specificMerchants.split(/[,，]/).map(s => s.trim()).filter(Boolean)
                : undefined,
            region: ruleState.region,
            paymentMethods: ruleState.paymentMethods.length > 0 ? ruleState.paymentMethods : undefined
        }));

        const updatedProgram = {
            id: programId,
            cardId: cardId,
            name: activeProgram?.name || '預設權益',
            startDate: programStartDate,
            endDate: programEndDate,
            baseRateOverseas: parseFloat(baseRateOverseas) / 100,
            baseRateDomestic: parseFloat(baseRateDomestic) / 100,
            bonusRules: domainBonusRules
        };

        const cardData: CreditCard = {
            id: cardId,
            name,
            bank,
            statementDate: parseInt(statementDate) || 27,
            foreignTxFee: parseFloat(foreignTxFee) || 1.5,
            supportedPaymentMethods, // Ensure card level still has these
            colorTheme, // Save selected theme
            programs: [updatedProgram]
        };

        if (isEditMode) {
            updateCard(cardData);
        } else {
            addCard(cardData);
        }
        onBack();
    };

    const addRule = () => {
        setBonusRules([...bonusRules, {
            id: crypto.randomUUID(),
            name: '新加碼活動',
            rate: '3',
            capAmount: '',
            capPeriod: 'monthly',
            checkJapan: false,
            requiresRegistration: false,
            specificMerchants: '',
            region: 'japan',
            paymentMethods: []
        }]);
    };

    const removeRule = (id: string) => {
        setBonusRules(bonusRules.filter(r => r.id !== id));
    };

    const updateRule = (id: string, field: keyof BonusRuleState, value: any) => {
        setBonusRules(bonusRules.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        ));
    };

    const toggleRulePaymentMethod = (ruleId: string, method: string) => {
        setBonusRules(bonusRules.map(r => {
            if (r.id === ruleId) {
                const current = r.paymentMethods;
                const next = current.includes(method)
                    ? current.filter(m => m !== method)
                    : [...current, method];
                return { ...r, paymentMethods: next };
            }
            return r;
        }));
    };

    const handleConfirmDelete = () => {
        if (initialCard) {
            removeCard(initialCard.id);
            onBack();
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
            <header className="flex items-center space-x-2 mb-2">
                <button onClick={onBack} className="p-1 -ml-1 text-gray-500 hover:text-gray-800">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">{isEditMode ? '編輯信用卡' : '新增信用卡'}</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Auto-Fill Banner */}
                {!isEditMode && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                智慧帶入
                            </h3>
                            <p className="text-xs text-indigo-600 mt-0.5">輸入銀行/卡名，自動搜尋權益 (Demo)</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={isSearching}
                            className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm font-bold active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : '搜尋帶入'}
                        </button>
                    </div>
                )}

                {/* Card Level Special Payment Support */}
                <div className={`space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-backwards`}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">此卡片支援的特殊支付 (卡片層級)</label>
                    <div className="bg-white/40 p-4 rounded-xl border border-white/40 space-y-2">
                        <p className="text-[10px] text-gray-400 mb-2">勾選後，當在試算頁面選擇該支付方式時，此卡片才會顯示出來。</p>
                        {['PayPay (玉山Wallet)', 'PayPay (全支付)', 'PayPay (街口)'].map(method => (
                            <label key={method} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={supportedPaymentMethods?.includes(method) || false}
                                    onChange={(e) => {
                                        const current = supportedPaymentMethods || [];
                                        const next = e.target.checked
                                            ? [...current, method]
                                            : current.filter(m => m !== method);
                                        setSupportedPaymentMethods(next);
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 bg-white/70 border-gray-300"
                                />
                                <span className="text-sm text-gray-700 font-medium">{method}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">卡片色系風格</label>
                    <div className="grid grid-cols-4 gap-3">
                        {CARD_THEMES.map(theme => (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => setColorTheme(theme.id)}
                                className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all active:scale-95
                                    ${colorTheme === theme.id
                                        ? 'bg-gray-50 border-gray-300 ring-1 ring-gray-300 shadow-inner'
                                        : 'border-transparent hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div
                                    className="w-10 h-10 rounded-full shadow-sm border border-black/5 relative overflow-hidden transition-transform group-hover:scale-110"
                                    style={{ background: theme.previewColor }}
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/30" />
                                </div>
                                <span className={`text-[10px] font-medium text-center leading-tight
                                    ${colorTheme === theme.id ? 'text-gray-800' : 'text-gray-400'}
                                `}>
                                    {theme.name}
                                </span>

                                {colorTheme === theme.id && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-md ring-1 ring-black/5" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-700">基本資料</h2>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">銀行 / 發卡機構</label>
                        <input
                            required
                            type="text"
                            placeholder="例如：玉山銀行"
                            value={bank}
                            onChange={e => setBank(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">卡片名稱</label>
                        <input
                            required
                            type="text"
                            placeholder="例如：熊本熊卡"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">🇯🇵 海外回饋 (%)</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                value={baseRateOverseas}
                                onChange={e => setBaseRateOverseas(e.target.value)}
                                className="w-full p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">🇹🇼 國內回饋 (%)</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                value={baseRateDomestic}
                                onChange={e => setBaseRateDomestic(e.target.value)}
                                className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">結帳日 (每月幾號)</label>
                        <input
                            required
                            type="number"
                            min="1"
                            max="31"
                            placeholder="例如: 27"
                            value={statementDate}
                            onChange={e => setStatementDate(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">海外手續費 (%)</label>
                        <input
                            required
                            type="number"
                            step="0.1"
                            value={foreignTxFee}
                            onChange={e => setForeignTxFee(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Program Dates */}
                <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                    <h2 className="text-sm font-bold text-gray-700">權益期間</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">開始日期</label>
                            <input
                                type="date"
                                required
                                value={programStartDate}
                                onChange={e => setProgramStartDate(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">結束日期</label>
                            <input
                                type="date"
                                required
                                value={programEndDate}
                                onChange={e => setProgramEndDate(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Bonus Config - Multiple Rules */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">特別加碼活動</label>
                        <button
                            type="button"
                            onClick={addRule}
                            className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800 font-bold px-2 py-1 bg-primary-50 rounded-lg border border-primary-200 transition-all active:scale-95"
                        >
                            <Plus className="w-3 h-3" />
                            新增活動
                        </button>
                    </div>

                    <div className="space-y-4">
                        {bonusRules.map((rule, index) => (
                            <div key={rule.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 relative group">
                                <div className="absolute top-4 right-4 text-gray-300 hover:text-red-500 cursor-pointer transition-colors" onClick={() => removeRule(rule.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">活動 #{index + 1}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">加碼活動名稱</label>
                                        <input
                                            type="text"
                                            value={rule.name}
                                            onChange={e => updateRule(rule.id, 'name', e.target.value)}
                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>

                                    {/* Region Selector */}
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">活動適用地區</label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'japan', label: '🇯🇵 僅限日本', color: 'peer-checked:bg-indigo-600' },
                                                { id: 'taiwan', label: '🇹🇼 僅限台灣', color: 'peer-checked:bg-orange-500' },
                                                { id: 'global', label: '🌍 全球通用', color: 'peer-checked:bg-slate-600' }
                                            ].map((opt) => (
                                                <label key={opt.id} className="flex-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`region-${rule.id}`}
                                                        value={opt.id}
                                                        checked={rule.region === opt.id}
                                                        onChange={(e) => updateRule(rule.id, 'region', e.target.value)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className={`text-center py-2 px-1 rounded-md text-xs font-medium text-gray-500 bg-white border border-gray-200 transition-all ${opt.color} peer-checked:text-white peer-checked:border-transparent peer-checked:shadow-sm`}>
                                                        {opt.label}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">加碼回饋率 (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={rule.rate}
                                                onChange={e => updateRule(rule.id, 'rate', e.target.value)}
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">回饋上限 (選填)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="無上限"
                                                    value={rule.capAmount}
                                                    onChange={e => updateRule(rule.id, 'capAmount', e.target.value)}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                                <select
                                                    value={rule.capPeriod}
                                                    onChange={e => updateRule(rule.id, 'capPeriod', e.target.value)}
                                                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-24 flex-shrink-0"
                                                >
                                                    <option value="monthly">/月</option>
                                                    <option value="campaign">/總</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Payment Method Selector (NEW) --- */}
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                限定支付工具 (選填)
                                            </label>
                                            {rule.paymentMethods.length === 0 && (
                                                <span className="text-[10px] text-gray-400">適用所有支付</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {PAYMENT_OPTIONS.map(opt => {
                                                const isSelected = rule.paymentMethods.includes(opt.id);
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => toggleRulePaymentMethod(rule.id, opt.id)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95 border
                                                            ${isSelected
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                            }
                                                        `}
                                                    >
                                                        {opt.icon}
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    {/* -------------------------------------- */}


                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">指定商店 (選填，逗號分隔)</label>
                                        <input
                                            type="text"
                                            placeholder="例如: 7-11, Disney, Bic Camera"
                                            value={rule.specificMerchants}
                                            onChange={e => updateRule(rule.id, 'specificMerchants', e.target.value)}
                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={rule.checkJapan}
                                                onChange={e => updateRule(rule.id, 'checkJapan', e.target.checked)}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">包含所有日本通路 (實體/藥妝/超商)</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={rule.requiresRegistration}
                                                onChange={e => updateRule(rule.id, 'requiresRegistration', e.target.checked)}
                                                className="rounded text-sakura-500 focus:ring-sakura-500"
                                            />
                                            <span className="text-sm text-gray-700">此活動需要登錄</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {bonusRules.length === 0 && (
                            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
                                尚未新增任何加碼活動
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-gray-200 transition-all active:scale-95"
                    >
                        {isEditMode ? '儲存變更' : '新增卡片'}
                    </button>
                    {isEditMode && (
                        <div className="mt-4 space-y-2">
                            <p className="text-center text-xs text-gray-400">
                                注意：編輯將會覆蓋此卡片目前的預設權益設定
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-3 text-red-500 font-bold text-sm bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                            >
                                刪除此卡片
                            </button>
                        </div>
                    )}
                </div>
            </form>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="確定要刪除嗎？"
                message={`您即將刪除「${name}」。此動作無法復原。`}
                confirmText="確認刪除"
                cancelText="取消"
                isDanger={true}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
