import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { CreditCard, BillingCycleType } from '../../types';
import { ChevronLeft, Sparkles, Loader2, Plus } from 'lucide-react';

import { MockBankService } from '../../services/bankData';
import { CARD_THEMES, getThemeByKeyword } from './cardThemes';
import ConfirmModal from '../ui/ConfirmModal';
import ProgramEditor from './ProgramEditor';
import { usePrograms, type ProgramFormState } from '../../hooks/usePrograms';
import { createBonusRuleStatesFromRules } from '../../utils/bonusRuleHelpers';

interface CardDataFormProps {
    onBack: () => void;
    initialCard?: CreditCard;
}

export default function CardDataForm({ onBack, initialCard }: CardDataFormProps) {
    const { addCard, updateCard, removeCard } = useStore();
    const isEditMode = !!initialCard;

    // Multi-Program Management
    const {
        programs,
        setPrograms,
        expandedProgramId,
        addProgram,
        removeProgram,
        updateProgram,
        toggleExpanded,
        addBonusRule,
        removeBonusRule,
        updateBonusRule,
        toggleBonusRulePaymentMethod,
        applyPreset,
        toDomainPrograms
    } = usePrograms({
        initialPrograms: initialCard?.programs,
        cardId: initialCard?.id
    });

    // Card Form State
    const [name, setName] = useState(initialCard?.name || '');
    const [bank, setBank] = useState(initialCard?.bank || '');
    const [colorTheme, setColorTheme] = useState<string>(
        initialCard?.colorTheme || (initialCard ? getThemeByKeyword(initialCard.bank, initialCard.name) : 'matte_black')
    );
    const [statementDate, setStatementDate] = useState(initialCard?.statementDate?.toString() || '27');
    const [billingCycleType, setBillingCycleType] = useState<BillingCycleType>(initialCard?.billingCycleType || 'calendar');
    const [foreignTxFee, setForeignTxFee] = useState(initialCard?.foreignTxFee?.toString() || '1.5');
    const [supportedPaymentMethods, setSupportedPaymentMethods] = useState<string[]>(initialCard?.supportedPaymentMethods || []);

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
                if (template.name) setName(template.name);
                if (template.bank) setBank(template.bank);
                setColorTheme(getThemeByKeyword(template.bank || '', template.name || ''));

                // Convert template programs to form state
                if (template.programs && template.programs.length > 0) {
                    const newPrograms: ProgramFormState[] = template.programs.map(prog => ({
                        id: crypto.randomUUID(),
                        name: prog.name,
                        startDate: prog.startDate,
                        endDate: prog.endDate,
                        baseRateOverseas: (prog.baseRateOverseas * 100).toString(),
                        baseRateDomestic: (prog.baseRateDomestic * 100).toString(),
                        bonusRules: createBonusRuleStatesFromRules(prog.bonusRules).map(r => ({
                            ...r,
                            id: crypto.randomUUID()
                        }))
                    }));
                    setPrograms(newPrograms);
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

        const cardData: CreditCard = {
            id: cardId,
            name,
            bank,
            statementDate: parseInt(statementDate) || 27,
            billingCycleType,
            foreignTxFee: parseFloat(foreignTxFee) || 1.5,
            supportedPaymentMethods,
            colorTheme,
            programs: toDomainPrograms(cardId)
        };

        if (isEditMode) {
            updateCard(cardData);
        } else {
            addCard(cardData);
        }
        onBack();
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
                <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">此卡片支援的特殊支付</label>
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
                            <label className="block text-xs font-medium text-gray-500 mb-1">回饋計算週期</label>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycleType('calendar')}
                                    className={`flex-1 py-2 text-xs font-medium transition-all ${billingCycleType === 'calendar'
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    自然月
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycleType('statement')}
                                    className={`flex-1 py-2 text-xs font-medium transition-all ${billingCycleType === 'statement'
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    結帳月
                                </button>
                            </div>
                        </div>
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

                {/* Programs Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">權益期間</label>
                        <button
                            type="button"
                            onClick={addProgram}
                            className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800 font-bold px-2 py-1 bg-primary-50 rounded-lg border border-primary-200 transition-all active:scale-95"
                        >
                            <Plus className="w-3 h-3" />
                            新增期間
                        </button>
                    </div>

                    <div className="space-y-3">
                        {programs.map(program => (
                            <ProgramEditor
                                key={program.id}
                                program={program}
                                bonusRules={program.bonusRules}
                                isExpanded={expandedProgramId === program.id}
                                canDelete={programs.length > 1}
                                onUpdateProgram={(field, value) => updateProgram(program.id, field, value)}
                                onAddRule={() => addBonusRule(program.id)}
                                onRemoveRule={(ruleId) => removeBonusRule(program.id, ruleId)}
                                onUpdateRule={(ruleId, field, value) => updateBonusRule(program.id, ruleId, field, value)}
                                onToggleRulePaymentMethod={(ruleId, method) => toggleBonusRulePaymentMethod(program.id, ruleId, method)}
                                onApplyPreset={(presetId) => applyPreset(program.id, presetId)}
                                onDelete={() => removeProgram(program.id)}
                                onToggleExpand={() => toggleExpanded(program.id)}
                            />
                        ))}
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
