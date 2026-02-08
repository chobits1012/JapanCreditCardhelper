import { Plus, Bookmark, Trash2 } from 'lucide-react';

import { BONUS_PRESETS } from '../../data/bonusPresets';
import BonusRuleEditor from './BonusRuleEditor';
import type { BonusRuleState } from '../../utils/bonusRuleHelpers';

interface ProgramEditorProps {
    program: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        baseRateOverseas: string;
        baseRateDomestic: string;
    };
    bonusRules: BonusRuleState[];
    isExpanded: boolean;
    canDelete: boolean;
    onUpdateProgram: (field: string, value: string) => void;
    onAddRule: () => void;
    onRemoveRule: (ruleId: string) => void;
    onUpdateRule: (ruleId: string, field: string, value: string | string[] | boolean) => void;
    onToggleRulePaymentMethod: (ruleId: string, method: string) => void;
    onApplyPreset: (presetId: string) => void;
    onDelete: () => void;
    onToggleExpand: () => void;
}

export default function ProgramEditor({
    program,
    bonusRules,
    isExpanded,
    canDelete,
    onUpdateProgram,
    onAddRule,
    onRemoveRule,
    onUpdateRule,
    onToggleRulePaymentMethod,
    onApplyPreset,
    onDelete,
    onToggleExpand
}: ProgramEditorProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Program Header - Always Visible */}
            <button
                type="button"
                onClick={onToggleExpand}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isExpanded ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="text-left">
                        <p className="font-bold text-gray-800">{program.name || '預設權益'}</p>
                        <p className="text-xs text-gray-500">
                            {program.startDate} ~ {program.endDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                        🇯🇵 {program.baseRateOverseas}% / 🇹🇼 {program.baseRateDomestic}%
                    </span>
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Program Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">權益名稱</label>
                        <input
                            type="text"
                            placeholder="例如：2024 下半年權益"
                            value={program.name}
                            onChange={e => onUpdateProgram('name', e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">開始日期</label>
                            <input
                                type="date"
                                value={program.startDate}
                                onChange={e => onUpdateProgram('startDate', e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">結束日期</label>
                            <input
                                type="date"
                                value={program.endDate}
                                onChange={e => onUpdateProgram('endDate', e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Base Rates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">🇯🇵 海外回饋 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={program.baseRateOverseas}
                                onChange={e => onUpdateProgram('baseRateOverseas', e.target.value)}
                                className="w-full p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">🇹🇼 國內回饋 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={program.baseRateDomestic}
                                onChange={e => onUpdateProgram('baseRateDomestic', e.target.value)}
                                className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Bonus Rules Section */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">特別加碼活動</label>
                            <div className="flex gap-2">
                                <div className="relative group">
                                    <button
                                        type="button"
                                        className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-800 font-bold px-2 py-1 bg-amber-50 rounded-lg border border-amber-200 transition-all active:scale-95"
                                    >
                                        <Bookmark className="w-3 h-3" />
                                        預設
                                    </button>
                                    {/* Preset Dropdown */}
                                    <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-10 min-w-[180px]">
                                        {BONUS_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => onApplyPreset(preset.id)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                <p className="font-medium text-gray-800">{preset.name}</p>
                                                {preset.description && (
                                                    <p className="text-xs text-gray-500">{preset.description}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onAddRule}
                                    className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800 font-bold px-2 py-1 bg-primary-50 rounded-lg border border-primary-200 transition-all active:scale-95"
                                >
                                    <Plus className="w-3 h-3" />
                                    新增
                                </button>
                            </div>
                        </div>

                        {bonusRules.map((rule, index) => (
                            <BonusRuleEditor
                                key={rule.id}
                                rule={rule}
                                index={index + 1}
                                onUpdate={(field, value) => onUpdateRule(rule.id, field, value)}
                                onRemove={() => onRemoveRule(rule.id)}
                                onTogglePaymentMethod={(method) => onToggleRulePaymentMethod(rule.id, method)}
                            />
                        ))}

                        {bonusRules.length === 0 && (
                            <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
                                尚未新增任何加碼活動
                            </div>
                        )}
                    </div>

                    {/* Delete Program Button */}
                    {canDelete && (
                        <div className="pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onDelete}
                                className="w-full py-2 text-red-500 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                刪除此權益期間
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
