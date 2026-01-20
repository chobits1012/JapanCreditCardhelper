/**
 * CardPresetPicker Component
 * 
 * 預設卡片選擇器 - 讓使用者快速選擇並新增預設的日本旅遊信用卡
 * 響應式設計，支援手機端與電腦端
 */

import { X, CreditCard as CreditCardIcon, Sparkles } from 'lucide-react';
import { JAPAN_TRAVEL_CARD_PRESETS } from '../../data/cardTemplates';
import { CARD_THEMES } from './cardThemes';
import type { CreditCard } from '../../types';

interface CardPresetPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCard: (cardTemplate: Partial<CreditCard>) => void;
}

/**
 * 計算卡片的日本消費最高回饋率
 */
function getMaxJapanRate(card: Partial<CreditCard>): string {
    const program = card.programs?.[0];
    if (!program) return '0';

    const baseRate = (program.baseRateOverseas || 0) * 100;
    const bonusRates = program.bonusRules?.map(r => r.rate * 100) || [];
    const maxBonus = bonusRates.length > 0 ? Math.max(...bonusRates) : 0;

    return (baseRate + maxBonus).toFixed(1);
}

/**
 * 取得卡片簡要說明
 */
function getCardDescription(card: Partial<CreditCard>): string {
    const program = card.programs?.[0];
    if (!program) return '';

    const rulesCount = program.bonusRules?.length || 0;
    const endDate = program.endDate?.slice(0, 7).replace('-', '/');

    return `${rulesCount} 個加碼活動 · 至 ${endDate}`;
}

export default function CardPresetPicker({ isOpen, onClose, onSelectCard }: CardPresetPickerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-300 relative z-10 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">
                                預設卡片
                            </h3>
                            <p className="text-xs text-gray-500">
                                一鍵新增熱門日本旅遊卡
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Card List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
                    {JAPAN_TRAVEL_CARD_PRESETS.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">
                            尚無預設卡片可選擇
                        </p>
                    ) : (
                        JAPAN_TRAVEL_CARD_PRESETS.map((card, index) => {
                            const theme = CARD_THEMES.find(t => t.id === card.colorTheme);
                            const maxRate = getMaxJapanRate(card);
                            const description = getCardDescription(card);

                            return (
                                <button
                                    key={`preset-${index}`}
                                    type="button"
                                    onClick={() => onSelectCard(card)}
                                    className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all active:scale-[0.98] group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Card Preview */}
                                        <div
                                            className={`w-14 h-9 rounded-lg shadow-md flex items-center justify-center relative overflow-hidden shrink-0 ${theme?.class || 'bg-gray-400'}`}
                                        >
                                            {/* Glass reflection effect */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20" />
                                            <CreditCardIcon className="w-5 h-5 text-white/80 relative z-10" />
                                        </div>

                                        {/* Card Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">
                                                    {card.name}
                                                </p>
                                                <span className="shrink-0 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                                    🇯🇵 {maxRate}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {card.bank}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1 truncate">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 pb-safe">
                    <p className="text-xs text-gray-400 text-center">
                        選擇後將自動新增至您的錢包
                    </p>
                </div>
            </div>
        </div>
    );
}
