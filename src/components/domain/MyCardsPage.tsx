import { useState } from 'react';
import { Plus, Trash2, CreditCard as CardIcon, ChevronRight, LayoutList, LayoutGrid, Layers } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CardDataForm from './CardDataForm';
import CardDetailView from './CardDetailView';
import ConfirmModal from '../ui/ConfirmModal';
import type { CreditCard } from '../../types';

// Helper to get card style based on bank/name
const getCardStyle = (bank: string, name: string) => {
    const text = (bank + name).toLowerCase();
    if (text.includes('富邦') || text.includes('fubon')) return 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow-blue-200';
    if (text.includes('聯邦') || text.includes('吉鶴')) return 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-200';
    if (text.includes('玉山') || text.includes('熊本')) return 'bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-200';
    if (text.includes('國泰') || text.includes('cube')) return 'bg-gradient-to-br from-slate-700 to-slate-500 shadow-slate-200';
    if (text.includes('街口') || text.includes('jko')) return 'bg-gradient-to-br from-red-600 to-red-500 shadow-red-200';
    if (text.includes('全支付')) return 'bg-gradient-to-br from-indigo-600 to-purple-500 shadow-indigo-200';
    return 'bg-gradient-to-br from-slate-800 to-zinc-700 shadow-gray-300';
};

// Helper: Card Logo / Icon
const CardLogo = () => {
    return (
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <CardIcon className="w-4 h-4 text-white" />
        </div>
    );
};

// --- Reusable List Card Component ---
interface CreditCardListItemProps {
    card: CreditCard;
    isActive: boolean;
    displayRate: string;
    gradientClass: string;
    onClick: () => void;
    onToggle: () => void;
    onDeleteRequest: () => void;
}

const CreditCardListItem = ({ card, isActive, displayRate, gradientClass, onClick, onToggle, onDeleteRequest }: CreditCardListItemProps) => {
    return (
        <div className="w-full h-48 overflow-hidden rounded-3xl relative group">
            <div className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 h-full items-center">
                {/* Main Card Content - Snap Center */}
                <div className="min-w-full h-full snap-center pl-0.5 pr-0.5 py-1">
                    <div
                        onClick={onClick}
                        className={`w-full h-full rounded-2xl p-5 relative overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg
                            ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                        `}
                    >
                        {/* Decorative Circles */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute top-20 -left-10 w-32 h-32 bg-black/5 rounded-full blur-xl"></div>

                        {/* Top Row */}
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <CardLogo />
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight tracking-wide shadow-black/10 drop-shadow-md">
                                        {card.name}
                                    </h3>
                                    <p className="text-white/80 text-[10px] font-medium tracking-wider uppercase">
                                        {card.bank}
                                    </p>
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle();
                                }}
                                className={`w-10 h-6 rounded-full p-1 transition-all duration-300 flex items-center active:scale-90 active:rotate-3 ease-out
                                    ${isActive ? 'bg-white/90 justify-end shadow-md' : 'bg-black/20 justify-start'}
                                `}
                            >
                                <div className={`w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 scale-100' : 'bg-white/50 scale-90'}`}></div>
                            </button>
                        </div>

                        {/* Middle/Bottom Info */}
                        <div className="relative z-10 mt-auto">
                            <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/60 text-[10px] font-mono tracking-widest">**** **** ****</span>
                                        <span className="text-white/90 text-xs font-mono font-bold tracking-widest">8888</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md border border-white/10">
                                            <span className="text-[10px] font-bold text-white">🇯🇵 最高 {displayRate}%</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-black/10 backdrop-blur-md rounded-md border border-white/5">
                                            <span className="text-[10px] text-white/80">手續費 {card.foreignTxFee}%</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm group-active:scale-95">
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Button - Snap Center (Revealed on swipe) */}
                <div className="min-w-[80px] h-[90%] snap-center flex items-center justify-center pl-3 pr-1">
                    <button
                        onClick={onDeleteRequest}
                        className="w-full h-full bg-red-50 text-red-500 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all border border-red-100 shadow-sm"
                    >
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-[10px] font-bold tracking-wide">刪除卡片</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function MyCardsPage() {
    const { cards, activeCardIds, toggleCard, removeCard } = useStore();

    // View States
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stack'>('list');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Stack Focus State
    const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

    // --- Transition Helpers ---
    const handleOpenDetail = (card: CreditCard) => {
        // If in stack mode and we are focusing, clicking opens detail.
        // Or if in List/Grid mode.
        setSelectedCard(card);
        setTimeout(() => setIsDetailOpen(true), 10);
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        setTimeout(() => {
            setSelectedCard(null);
            setIsEditing(false);
        }, 300);
    };

    const handleStackClick = (card: CreditCard) => {
        setFocusedCardId(card.id);
    };

    // --------------------------

    if (isAdding) {
        return <CardDataForm onBack={() => setIsAdding(false)} />;
    }

    if (isEditing && selectedCard) {
        return <CardDataForm
            initialCard={selectedCard}
            onBack={() => setIsEditing(false)}
        />;
    }

    // Prepare focused card data if any
    const focusedCard = cards.find(c => c.id === focusedCardId);

    return (
        <div className="max-w-md mx-auto p-4 pb-24 min-h-screen relative overflow-hidden">
            {/* Header Area */}
            <div className={`flex items-center justify-between mb-6 pt-2 transition-opacity duration-300 ${focusedCardId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">我的錢包</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        {cards.length} 張卡片
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-full">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('stack')}
                            className={`p-1.5 rounded-full transition-all ${viewMode === 'stack' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center justify-center w-8 h-8 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-200 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area Based on View Mode */}
            <div className={`
                ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 pb-20' : ''}
                ${viewMode === 'stack' ? 'relative pb-32 space-y-0 min-h-[500px]' : ''}
                ${viewMode === 'list' ? 'space-y-5 pb-20' : ''}
                ${focusedCardId ? 'blur-sm pointer-events-none' : ''} 
                transition-all duration-300
            `}>
                {cards.map((card, index) => {
                    const isActive = activeCardIds.includes(card.id);
                    const gradientClass = getCardStyle(card.bank, card.name);

                    const programs = card.programs || [];
                    const currentProgram = programs[0];
                    // Calculate max potential rate: Base Rate + Max individual bonus rate (assuming bonuses are additive "extra" rates)
                    // If bonuses are total rates, this logic might need adjustment, but "stacking" usually implies adding.
                    // However, to be safe and cover "Total Rate" scenarios entered by user, let's assume specific rules might be higher than base.
                    // User Request "疊加起來最高的" -> likely means Base + Max Bonus.
                    const baseRate = currentProgram ? currentProgram.baseRateOverseas : 0;
                    const maxBonus = currentProgram ? Math.max(0, ...currentProgram.bonusRules.filter(r => r.region === 'japan' || !r.region).map(r => r.rate)) : 0;
                    const totalMaxRate = baseRate + maxBonus;
                    const displayRate = (totalMaxRate * 100).toFixed(1);

                    // --- GRID VIEW ---
                    if (viewMode === 'grid') {
                        return (
                            <div
                                key={card.id}
                                onClick={() => handleOpenDetail(card)} // Grid directly opens detail for now, unless we want focus too?
                                className={`aspect-[4/3] rounded-2xl p-4 relative overflow-hidden cursor-pointer shadow-sm transition-all active:scale-95
                                    ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                                `}
                            >
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start">
                                        <CardLogo />
                                        {/* Status Dot */}
                                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'bg-slate-400/50'}`}></div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm leading-tight shadow-black/10 drop-shadow-md line-clamp-2 mb-1">
                                            {card.name}
                                        </h3>
                                        <div className="inline-block px-1.5 py-0.5 bg-white/20 backdrop-blur-md rounded border border-white/10">
                                            <span className="text-[10px] font-bold text-white">🇯🇵 {displayRate}%</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Header Toggle Overlay for Grid (Optional, if user wants direct toggle) */}
                                <div className="absolute top-2 right-2 z-20" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => toggleCard(card.id)}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-white/50'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-white/50'}`} />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // --- STACK VIEW ---
                    if (viewMode === 'stack') {
                        return (
                            <div
                                key={card.id}
                                onClick={() => handleStackClick(card)}
                                className={`h-48 rounded-3xl relative transition-transform duration-300 hover:-translate-y-4 cursor-pointer shadow-[0_-5px_15px_rgba(0,0,0,0.1)] border-t border-white/20
                                    ${index !== 0 ? '-mt-32' : ''}
                                    ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                                `}
                                style={{ zIndex: index }}
                            >
                                <div className="p-5 h-full relative overflow-hidden rounded-3xl pointer-events-none">
                                    {/* pointer-events-none on inner lets click bubble to parent */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-3">
                                            <CardLogo />
                                            <h3 className="text-white font-bold text-lg shadow-black/10 drop-shadow-md">{card.name}</h3>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-black/10'}`}>
                                            <span className="text-[10px] font-bold text-white">🇯🇵 {displayRate}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // --- LIST VIEW (Default) ---
                    return (
                        <CreditCardListItem
                            key={card.id}
                            card={card}
                            isActive={isActive}
                            displayRate={displayRate}
                            gradientClass={gradientClass}
                            onClick={() => handleOpenDetail(card)}
                            onToggle={() => toggleCard(card.id)}
                            onDeleteRequest={() => setCardToDelete(card)}
                        />
                    );
                })}

                {viewMode === 'list' && (
                    <div className="pt-8 text-center pb-20">
                        <p className="text-xs text-slate-400 font-medium">左右滑動卡片可進行刪除</p>
                    </div>
                )}
            </div>

            {/* --- Stack Focus Overlay --- */}
            {viewMode === 'stack' && focusedCard && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setFocusedCardId(null)}
                    ></div>

                    {/* Focused Card */}
                    <div className="relative z-50 w-full max-w-sm animate-in zoom-in-95 duration-200 fade-in">
                        <CreditCardListItem
                            card={focusedCard}
                            isActive={activeCardIds.includes(focusedCard.id)}
                            displayRate={(focusedCard.programs?.[0] ? Math.max(focusedCard.programs[0].baseRateOverseas, ...focusedCard.programs[0].bonusRules.filter((r: unknown) => (r as any).region === 'japan' || !(r as any).region).map((r: any) => r.rate)) : 0 * 100).toFixed(1)}
                            gradientClass={getCardStyle(focusedCard.bank, focusedCard.name)}
                            onClick={() => handleOpenDetail(focusedCard)}
                            onToggle={() => toggleCard(focusedCard.id)}
                            onDeleteRequest={() => setCardToDelete(focusedCard)}
                        />
                        <div className="mt-6 text-center text-white/70 text-sm font-medium">
                            點擊卡片查看詳情，或點擊背景返回
                        </div>
                    </div>
                </div>
            )}

            {/* --- Slide-Up Detail View Container --- */}
            {selectedCard && (
                <div className={`fixed inset-0 z-50 flex flex-col bg-white transition-transform duration-300 ease-out transform ${isDetailOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex-1 overflow-y-auto">
                        <CardDetailView
                            card={selectedCard}
                            onBack={handleCloseDetail}
                            onEdit={() => setIsEditing(true)}
                        />
                        {/* Delete Button Area - Added for convenience in all modes */}
                        <div className="p-6 pb-24 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => setCardToDelete(selectedCard)}
                                className="w-full py-3 bg-white border border-red-200 text-red-500 rounded-xl font-bold shadow-sm active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                刪除此卡片
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-3">
                                刪除後將無法復原卡片資料與規則
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop for detail view */}
            {selectedCard && (
                <div
                    className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isDetailOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCloseDetail}
                />
            )}

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
                        if (focusedCardId === cardToDelete.id) {
                            setFocusedCardId(null);
                        }
                        if (selectedCard?.id === cardToDelete.id) {
                            handleCloseDetail();
                        }
                    }
                }}
                onCancel={() => setCardToDelete(null)}
            />
        </div>
    );
}
