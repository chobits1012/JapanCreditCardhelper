import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { CreditCard, MerchantCategory } from '../../types';
import { ChevronLeft } from 'lucide-react';
import { format, addYears } from 'date-fns';

interface AddCardFormProps {
    onBack: () => void;
}

export default function AddCardForm({ onBack }: AddCardFormProps) {
    const { addCard } = useStore();

    // Form State
    const [name, setName] = useState('');
    const [bank, setBank] = useState('');
    const [baseRate, setBaseRate] = useState('1'); // %

    // Bonus Rule State
    const [hasBonus, setHasBonus] = useState(false);
    const [bonusName, setBonusName] = useState('一般加碼');
    const [bonusRate, setBonusRate] = useState('3'); // %
    const [capAmount, setCapAmount] = useState<string>(''); // Empty = No cap
    const [checkJapan, setCheckJapan] = useState(true);
    const [checkRegistration, setCheckRegistration] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Construct CreditCard Object
        const newCardId = crypto.randomUUID();
        const now = new Date();

        const newCard: CreditCard = {
            id: newCardId,
            name,
            bank,
            programs: [{
                id: crypto.randomUUID(),
                cardId: newCardId,
                name: '預設權益',
                startDate: format(now, 'yyyy-MM-dd'),
                endDate: format(addYears(now, 2), 'yyyy-MM-dd'), // Valid for 2 years
                baseRate: parseFloat(baseRate) / 100,
                bonusRules: hasBonus ? [{
                    id: crypto.randomUUID(),
                    name: bonusName, // e.g. "日本消費 3%"
                    rate: parseFloat(bonusRate) / 100,
                    categories: checkJapan ? ['general_japan', 'drugstore', 'electronics', 'department', 'convenience'] as MerchantCategory[] : [],
                    capAmount: capAmount ? parseInt(capAmount) : undefined,
                    requiresRegistration: checkRegistration,
                }] : []
            }]
        };

        addCard(newCard);
        onBack();
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6">
            <header className="flex items-center space-x-2 mb-2">
                <button onClick={onBack} className="p-1 -ml-1 text-gray-500 hover:text-gray-800">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">新增信用卡</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">基礎回饋率 (%)</label>
                        <input
                            required
                            type="number"
                            step="0.1"
                            value={baseRate}
                            onChange={e => setBaseRate(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Bonus Config */}
                <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-700">特別加碼 (選填)</h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={hasBonus} onChange={e => setHasBonus(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {hasBonus && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">加碼活動名稱</label>
                                <input
                                    type="text"
                                    value={bonusName}
                                    onChange={e => setBonusName(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">加碼回饋率 (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={bonusRate}
                                        onChange={e => setBonusRate(e.target.value)}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">回饋上限 (選填)</label>
                                    <input
                                        type="number"
                                        placeholder="無上限"
                                        value={capAmount}
                                        onChange={e => setCapAmount(e.target.value)}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={checkJapan}
                                        onChange={e => setCheckJapan(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">包含所有日本通路 (實體/藥妝/超商)</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={checkRegistration}
                                        onChange={e => setCheckRegistration(e.target.checked)}
                                        className="rounded text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">此活動需要登錄</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    新增卡片
                </button>
            </form>
        </div>
    );
}
