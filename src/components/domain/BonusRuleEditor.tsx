/**
 * BonusRuleEditor Component
 * 
 * A form component for editing a single bonus rule.
 * Each rule is collapsible - collapsed by default, showing only a summary header.
 */

import { useState } from 'react';
import { Trash2, Smartphone, CreditCard as CreditCardIcon, ChevronDown } from 'lucide-react';
import type { BonusRuleState } from '../../utils/bonusRuleHelpers';

const PAYMENT_OPTIONS = [
    { id: 'Apple Pay', label: 'Apple Pay', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'Google Pay', label: 'Google Pay', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'QUICPay', label: 'QUICPay', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'Physical Card', label: '實體卡', icon: <CreditCardIcon className="w-3 h-3" /> },
    { id: 'PayPay (玉山Wallet)', label: '玉山 Wallet', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'PayPay (全支付)', label: '全支付', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'PayPay (街口)', label: '街口', icon: <Smartphone className="w-3 h-3" /> },
];

interface BonusRuleEditorProps {
    rule: BonusRuleState;
    index: number;
    onUpdate: (field: keyof BonusRuleState, value: any) => void;
    onRemove: () => void;
    onTogglePaymentMethod: (method: string) => void;
}

export default function BonusRuleEditor({
    rule,
    index,
    onUpdate,
    onRemove,
    onTogglePaymentMethod,
}: BonusRuleEditorProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        setShowDeleteConfirm(false);
        onRemove();
    };

    // Generate summary for collapsed view
    const getSummary = () => {
        const parts: string[] = [];
        if (rule.rate) parts.push(`${rule.rate}%`);
        if (rule.capAmount) parts.push(`上限 ${rule.capAmountCurrency === 'JPY' ? '¥' : '$'}${rule.capAmount}`);
        if (rule.region === 'japan') parts.push('🇯🇵');
        if (rule.region === 'taiwan') parts.push('🇹🇼');
        if (rule.region === 'global') parts.push('🌍');
        return parts.join(' · ') || '點擊編輯';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Collapsible Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpanded ? 'bg-green-500' : 'bg-amber-400'}`} />
                    <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                            {rule.name || `活動 #${index}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{getSummary()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                        onClick={handleRemoveClick}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="mx-3 mb-3 bg-red-50 rounded-lg border border-red-100 p-3 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-sm font-medium text-gray-800 text-center mb-3">
                        確定要刪除「{rule.name || '此活動'}」嗎？
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="py-2 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            確認刪除
                        </button>
                    </div>
                </div>
            )}

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Rule Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">加碼活動名稱</label>
                        <input
                            type="text"
                            value={rule.name}
                            onChange={e => onUpdate('name', e.target.value)}
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
                                        onChange={(e) => onUpdate('region', e.target.value)}
                                        className="peer sr-only"
                                    />
                                    <div className={`text-center py-2 px-1 rounded-md text-xs font-medium text-gray-500 bg-white border border-gray-200 transition-all ${opt.color} peer-checked:text-white peer-checked:border-transparent peer-checked:shadow-sm`}>
                                        {opt.label}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Rate and Cap Amount */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">回饋率 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={rule.rate}
                                onChange={e => onUpdate('rate', e.target.value)}
                                className="w-20 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">上限</label>
                            <input
                                type="number"
                                placeholder="無上限"
                                value={rule.capAmount}
                                onChange={e => onUpdate('capAmount', e.target.value)}
                                className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">幣別</label>
                            <select
                                value={rule.capAmountCurrency}
                                onChange={e => onUpdate('capAmountCurrency', e.target.value)}
                                className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="TWD">TWD</option>
                                <option value="JPY">JPY</option>
                            </select>
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">週期</label>
                            <select
                                value={rule.capPeriod}
                                onChange={e => onUpdate('capPeriod', e.target.value)}
                                className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="monthly">/月</option>
                                <option value="campaign">/總</option>
                            </select>
                        </div>
                    </div>

                    {/* Minimum Transaction Amount */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">消費門檻 (選填)</label>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="number"
                                placeholder="無門檻"
                                value={rule.minAmount}
                                onChange={e => onUpdate('minAmount', e.target.value)}
                                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <select
                                value={rule.minAmountCurrency}
                                onChange={e => onUpdate('minAmountCurrency', e.target.value)}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-20 flex-shrink-0"
                            >
                                <option value="TWD">TWD</option>
                                <option value="JPY">JPY</option>
                            </select>
                        </div>

                        {rule.minAmount && (
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 mt-2">
                                <div className="flex gap-2">
                                    {[
                                        { id: 'per_transaction', label: '單筆門檻', description: '每筆交易需達此金額' },
                                        { id: 'cumulative', label: '累積門檻', description: '活動期間累計達標後開始回饋' }
                                    ].map((opt) => (
                                        <label key={opt.id} className="flex-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`minAmountType-${rule.id}`}
                                                value={opt.id}
                                                checked={rule.minAmountType === opt.id}
                                                onChange={(e) => onUpdate('minAmountType', e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="text-center py-2 px-2 rounded-md text-[11px] font-medium text-gray-600 bg-white border border-blue-200 transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 peer-checked:shadow-sm">
                                                <div className="font-bold">{opt.label}</div>
                                                <div className="text-[9px] opacity-80 mt-0.5">{opt.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            💡 {rule.minAmountType === 'cumulative'
                                ? '累積型門檻：整個活動期間總消費達標後，後續交易才享有回饋'
                                : '單筆門檻：每筆消費需達此金額才享有回饋'}
                        </p>
                    </div>

                    {/* Payment Method Selector */}
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
                                        onClick={() => onTogglePaymentMethod(opt.id)}
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

                    {/* Specific Merchants */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">指定商店 (選填，逗號分隔)</label>
                        <input
                            type="text"
                            placeholder="例如: 7-11, Disney, Bic Camera"
                            value={rule.specificMerchants}
                            onChange={e => onUpdate('specificMerchants', e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Individual Rule Date Range */}
                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <label className="text-[10px] font-bold text-blue-600 uppercase">
                                    🗓️ 個別活動期限 (選填)
                                </label>
                                <p className="text-[10px] text-blue-500 mt-0.5">
                                    未設定時將使用上方「權益期間」的整體期限
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div>
                                <label className="block text-[10px] font-medium text-gray-500 mb-1">開始日期</label>
                                <input
                                    type="date"
                                    value={rule.startDate}
                                    onChange={e => onUpdate('startDate', e.target.value)}
                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-gray-500 mb-1">結束日期</label>
                                <input
                                    type="date"
                                    value={rule.endDate}
                                    onChange={e => onUpdate('endDate', e.target.value)}
                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="pt-2 space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={rule.checkJapan}
                                onChange={e => onUpdate('checkJapan', e.target.checked)}
                                className="rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">包含所有日本通路 (實體/藥妝/超商)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={rule.requiresRegistration}
                                onChange={e => onUpdate('requiresRegistration', e.target.checked)}
                                className="rounded text-sakura-500 focus:ring-sakura-500"
                            />
                            <span className="text-sm text-gray-700">此活動需要登錄</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
