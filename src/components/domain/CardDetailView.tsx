import { ChevronLeft, Calendar, Info, CreditCard as CardIcon } from 'lucide-react';
import type { CreditCard } from '../../types';

interface CardDetailViewProps {
    card: CreditCard;
    onBack: () => void;
    onEdit: () => void;
    gradientClass?: string;
}

export default function CardDetailView({ card, onBack, onEdit, gradientClass }: CardDetailViewProps) {
    // Determine active program (simplified: take the first one or logic to find current)
    // Active logic could be improved: take the first one or logic to find current)
    // For MVP, likely the first one or we filter by date. 
    // Given the Add form creates only one program, we can just map all programs.
    const activeProgram = card.programs[0];

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-20 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <button onClick={onBack} className="p-1 -ml-1 text-gray-500 hover:text-gray-800">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">{card.name}</h1>
                </div>
                <button
                    onClick={onEdit}
                    className="text-xs px-3 py-1.5 bg-gray-100 font-bold text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    編輯
                </button>
            </header>

            {/* Card Visual / Header */}
            <div className={`rounded-2xl p-6 text-white shadow-lg shadow-gray-300 ${gradientClass || 'bg-gradient-to-br from-gray-800 to-gray-900'}`}>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-gray-400 text-xs font-medium tracking-wider mb-1">{card.bank}</p>
                        <h2 className="text-2xl font-bold">{card.name}</h2>
                    </div>
                    <CardIcon className="w-8 h-8 opacity-50" />
                </div>
                <div className="flex items-end justify-between">
                    <div className="flex space-x-2">
                        <div className="px-2 py-1 bg-white/20 rounded text-xs backdrop-blur-sm">
                            海外 {activeProgram?.bonusRules.find(r => r.name.includes('其實這不好抓')) ? '?' : '高回饋'}
                        </div>
                    </div>
                    <p className="font-mono text-sm opacity-60">**** **** **** 8888</p>
                </div>
            </div>

            {/* Programs Info */}
            <div className="space-y-6">
                {card.programs.map((program) => (
                    <div key={program.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2"></span>
                                {program.name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                                <Calendar className="w-3 h-3 mr-1" />
                                {program.startDate.replace(/-/g, '/')} - {program.endDate.replace(/-/g, '/')}
                            </div>
                        </div>

                        {/* Base Rate */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs font-medium text-gray-500 mb-1 block">🇯🇵 海外回饋</span>
                                <span className="text-xl font-bold text-indigo-600">{(program.baseRateOverseas * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 mb-1 block">🇹🇼 國內回饋</span>
                                <span className="text-xl font-bold text-orange-500">{(program.baseRateDomestic * 100).toFixed(1)}%</span>
                            </div>
                            <div className="col-span-2 text-[10px] text-gray-300 pt-2 border-t border-gray-50">
                                適用於無特殊加碼之一般通路
                            </div>
                        </div>

                        {/* Bonus Rules */}
                        {program.bonusRules.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-500 ml-1">加碼活動</h4>
                                {program.bonusRules.map(rule => (
                                    <div key={rule.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            <Info className="w-16 h-16" />
                                        </div>

                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h5 className="font-bold text-gray-800">{rule.name}</h5>
                                                        {rule.region === 'japan' && <span className="text-[10px] px-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded">🇯🇵 日本</span>}
                                                        {rule.region === 'taiwan' && <span className="text-[10px] px-1 bg-orange-50 text-orange-600 border border-orange-100 rounded">🇹🇼 台灣</span>}
                                                        {rule.region === 'global' && <span className="text-[10px] px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded">🌍 全球</span>}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {rule.categories.map(cat => (
                                                            <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                                                                {getCategoryName(cat)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-bold text-orange-500">{(rule.rate * 100).toFixed(1)}%</span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                                                <div className="flex justify-between text-xs text-gray-500 items-center">
                                                    <div className="flex items-center space-x-2">
                                                        <span>回饋上限</span>
                                                        <span className="font-medium text-gray-700">
                                                            {rule.capAmount ? `${rule.capAmountCurrency === 'JPY' ? '¥' : '$'}${rule.capAmount.toLocaleString()} ${rule.capAmountCurrency || 'TWD'}` : '無上限'}
                                                        </span>
                                                    </div>
                                                    {rule.requiresRegistration && (
                                                        <span className="text-[10px] items-center flex bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 font-medium">
                                                            需登錄
                                                        </span>
                                                    )}
                                                </div>
                                                {rule.minAmount && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-gray-500">單筆門檻</span>
                                                        <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                            ≥ {rule.minAmountCurrency === 'JPY' ? '¥' : '$'}{rule.minAmount.toLocaleString()} {rule.minAmountCurrency || 'TWD'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getCategoryName(cat: string): string {
    const map: Record<string, string> = {
        'general_japan': '日本一般',
        'drugstore': '藥妝店',
        'electronics': '電器行',
        'convenience': '便利商店',
        'department': '百貨公司',
        'dining': '餐廳',
        'online': '網購',
        'other': '其他'
    };
    return map[cat] || cat;
}
