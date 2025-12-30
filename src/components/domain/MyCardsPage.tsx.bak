import { useState } from 'react';
import { CreditCard as CardIcon, Plus, Info, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CardDataForm from './CardDataForm';
import CardDetailView from './CardDetailView';
import ConfirmModal from '../ui/ConfirmModal';
import type { CreditCard } from '../../types';

export default function MyCardsPage() {
    const { cards, activeCardIds, toggleCard, removeCard } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
    const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

    const [isEditing, setIsEditing] = useState(false);

    if (isAdding) {
        return <CardDataForm onBack={() => setIsAdding(false)} />;
    }

    if (isEditing && selectedCard) {
        return <CardDataForm
            initialCard={selectedCard}
            onBack={() => {
                setIsEditing(false);
                setSelectedCard(null); // Go back to list
            }}
        />;
    }

    if (selectedCard) {
        return <CardDetailView
            card={selectedCard}
            onBack={() => setSelectedCard(null)}
            onEdit={() => setIsEditing(true)}
        />;
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
            <header className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-gray-800">卡片管理</h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>新增卡片</span>
                </button>
            </header>
            <p className="text-sm text-gray-500">勾選您擁有的信用卡，試算時將只顯示這些卡片。</p>

            <div className="space-y-4">
                {cards.map(card => {
                    const isActive = activeCardIds.includes(card.id);
                    return (
                        <div key={card.id} className="w-full overflow-hidden rounded-2xl relative group">
                            <div className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
                                {/* Main Card Content - Snap Center */}
                                <div className="min-w-full snap-center pl-1">
                                    <div
                                        className={`relative p-4 rounded-2xl border transition-all flex items-center justify-between
                                 ${isActive
                                                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                                : 'border-gray-200 glass-card opacity-80 hover:opacity-100'
                                            }`}
                                    >
                                        {/* Click area for details */}
                                        <div
                                            className="flex-1 flex items-center space-x-4 cursor-pointer"
                                            onClick={() => setSelectedCard(card)}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <CardIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{card.name}</h3>
                                                <p className="text-xs text-gray-400 flex items-center">
                                                    {card.bank}
                                                    <Info className="w-3 h-3 ml-1 opacity-50" />
                                                </p>
                                            </div>
                                        </div>

                                        {/* Toggle switch area */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCard(card.id);
                                            }}
                                            className={`h-full pl-4 border-l border-gray-100 flex items-center cursor-pointer hover:opacity-70`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                       ${isActive ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                    `}>
                                                {isActive && (
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button - Snap Center (Revealed on swipe) */}
                                <div className="min-w-[80px] snap-center flex items-center justify-center pl-2">
                                    <button
                                        onClick={() => setCardToDelete(card)}
                                        className="w-full h-full bg-red-50 text-red-500 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all border border-red-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">刪除</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <ConfirmModal
                isOpen={!!cardToDelete}
                title="確定要刪除嗎？"
                message={`您即將刪除「${cardToDelete?.name}」。此動作無法復原。`}
                confirmText="確認刪除"
                cancelText="取消"
                isDanger={true}
                onConfirm={() => {
                    if (cardToDelete) {
                        removeCard(cardToDelete.id);
                        setCardToDelete(null);
                    }
                }}
                onCancel={() => setCardToDelete(null)}
            />
        </div>
    );
}
