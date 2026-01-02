import { useState } from 'react';
import { Plus, Trash2, CreditCard as CardIcon, ChevronRight, LayoutList, LayoutGrid, Layers } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CardDataForm from './CardDataForm';
import CardDetailView from './CardDetailView';
import ConfirmModal from '../ui/ConfirmModal';
import type { CreditCard } from '../../types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

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
    layoutId?: string;
    transition?: any;
}

const CreditCardListItem = ({ card, isActive, displayRate, gradientClass, onClick, onToggle, onDeleteRequest, layoutId, transition }: CreditCardListItemProps) => {
    return (
        <motion.div
            layoutId={layoutId}
            className="w-full h-48 overflow-hidden rounded-3xl relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={transition || { duration: 0.3 }}
        >
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
                        <motion.div layout className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <motion.div layout className="absolute top-20 -left-10 w-32 h-32 bg-black/5 rounded-full blur-xl" />

                        {/* Top Row */}
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <CardLogo />
                                <div>
                                    <motion.h3 layout="position" className="text-white font-bold text-lg leading-tight tracking-wide shadow-black/10 drop-shadow-md">
                                        {card.name}
                                    </motion.h3>
                                    <p className="text-white/80 text-[10px] font-medium tracking-wider uppercase">
                                        {card.bank}
                                    </p>
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <motion.button
                                layout
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle();
                                }}
                                whileTap={{ scale: 0.9 }}
                                className={`w-10 h-6 rounded-full p-1 flex items-center active:rotate-3 ease-out
                                    ${isActive ? 'bg-white/90 justify-end shadow-md' : 'bg-black/20 justify-start'}
                                `}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={`w-4 h-4 rounded-full shadow-sm ${isActive ? 'bg-indigo-600' : 'bg-white/50'}`}
                                />
                            </motion.button>
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
        </motion.div>
    );
};

export default function MyCardsPage() {
    const { cards, activeCardIds, toggleCard, removeCard } = useStore();

    // View States
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stack'>('list');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

    // Stack Focus State
    const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

    // --- Transition Helpers ---
    const handleOpenDetail = (card: CreditCard) => {
        setSelectedCard(card);
    };

    const handleCloseDetail = () => {
        setSelectedCard(null);
        setIsEditing(false);
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

    // Slower, floatier spring for visible "fly out" effect
    const stackTransition: any = { type: "spring", stiffness: 260, damping: 20 };

    return (
        <LayoutGroup>
            <div className="max-w-md mx-auto p-4 pb-24 min-h-screen relative overflow-hidden">
                {/* Header Area */}
                <motion.div
                    animate={{ opacity: focusedCardId ? 0 : 1, pointerEvents: focusedCardId ? 'none' : 'auto' }}
                    className="flex items-center justify-between mb-6 pt-2"
                >
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

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsAdding(true)}
                            className="flex items-center justify-center w-8 h-8 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-200"
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Content Area Based on View Mode */}
                <motion.div
                    layout
                    className={`
                    ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 pb-20' : ''}
                    ${viewMode === 'stack' ? 'relative pb-32 space-y-0 min-h-[500px]' : ''}
                    ${viewMode === 'list' ? 'space-y-5 pb-20' : ''}
                    ${focusedCardId ? 'blur-sm pointer-events-none' : ''} 
                `}
                >
                    {cards.map((card, index) => {
                        const isActive = activeCardIds.includes(card.id);
                        const gradientClass = getCardStyle(card.bank, card.name);

                        // Ensure reward calculation logic matches
                        const programs = card.programs || [];
                        const currentProgram = programs[0];
                        const baseRate = currentProgram ? currentProgram.baseRateOverseas : 0;
                        const maxBonus = currentProgram ? Math.max(0, ...currentProgram.bonusRules.filter(r => r.region === 'japan' || !r.region).map(r => r.rate)) : 0;
                        const totalMaxRate = baseRate + maxBonus;
                        const displayRate = (totalMaxRate * 100).toFixed(1);

                        // --- GRID VIEW ---
                        if (viewMode === 'grid') {
                            return (
                                <motion.div
                                    layoutId={`card-${card.id}`}
                                    key={card.id}
                                    onClick={() => handleOpenDetail(card)}
                                    className={`aspect-[4/3] rounded-2xl p-4 relative overflow-hidden cursor-pointer shadow-sm
                                    ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                                `}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <motion.div layout className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />

                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start">
                                            <CardLogo />
                                            {/* Status Dot */}
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'bg-slate-400/50'}`}></div>
                                        </div>
                                        <div>
                                            <motion.h3 layout="position" className="text-white font-bold text-sm leading-tight shadow-black/10 drop-shadow-md line-clamp-2 mb-1">
                                                {card.name}
                                            </motion.h3>
                                            <motion.div layout className="inline-block px-1.5 py-0.5 bg-white/20 backdrop-blur-md rounded border border-white/10">
                                                <span className="text-[10px] font-bold text-white">🇯🇵 {displayRate}%</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                    {/* Header Toggle Overlay for Grid */}
                                    <div className="absolute top-2 right-2 z-20" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => toggleCard(card.id)}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-white/50'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-white/50'}`} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        }

                        // --- STACK VIEW ---
                        if (viewMode === 'stack') {
                            // Only render if NOT focused (or maybe render invisible placeholder to keep layout?)
                            // If focused, the Overlay takes over layoutId.
                            // However, framer motion needs the item to disappear from here for the layoutId transition to fly to overlay.
                            // So if focusedCardId === card.id, we hide it or don't render it?
                            // Actually, if we use AnimatePresence + layoutId, it should just morph.
                            // But both exist? One in list, one in overlay.
                            // We will use standard layoutId. 
                            const isFocused = focusedCardId === card.id;

                            return (
                                <motion.div
                                    layoutId={`card-${card.id}`}
                                    key={card.id}
                                    onClick={() => handleStackClick(card)}
                                    className={`h-48 rounded-3xl relative cursor-pointer shadow-[0_-5px_15px_rgba(0,0,0,0.1)] border-t border-white/20
                                    ${index !== 0 ? '-mt-32' : ''}
                                    ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                                    ${isFocused ? 'opacity-0' : 'opacity-100'} 
                                `}
                                    style={{ zIndex: index }}
                                    whileHover={{ y: -10 }}
                                    transition={stackTransition}
                                >
                                    <div className="p-5 h-full relative overflow-hidden rounded-3xl pointer-events-none">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="flex items-center gap-3">
                                                <CardLogo />
                                                <motion.h3 layout="position" className="text-white font-bold text-lg shadow-black/10 drop-shadow-md">{card.name}</motion.h3>
                                            </div>
                                            <motion.div layout className={`px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-black/10'}`}>
                                                <span className="text-[10px] font-bold text-white">🇯🇵 {displayRate}%</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }

                        // --- LIST VIEW (Default) ---
                        return (
                            <CreditCardListItem
                                key={card.id}
                                layoutId={`card-${card.id}`}
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
                </motion.div>

                {/* --- Stack Focus Overlay --- */}
                <AnimatePresence>
                    {viewMode === 'stack' && focusedCard && (
                        <div className="fixed inset-0 z-40 flex items-center justify-center p-6 h-full">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setFocusedCardId(null)}
                            />

                            {/* Focused Card */}
                            <div className="relative z-50 w-full max-w-sm">
                                <CreditCardListItem
                                    layoutId={`card-${focusedCard.id}`}
                                    card={focusedCard}
                                    isActive={activeCardIds.includes(focusedCard.id)}
                                    displayRate={(focusedCard.programs?.[0] ? ((focusedCard.programs[0].baseRateOverseas || 0) + (Math.max(0, ...focusedCard.programs[0].bonusRules.filter((r: unknown) => (r as any).region === 'japan' || !(r as any).region).map((r: any) => r.rate)) || 0)) * 100 : 0).toFixed(1)}
                                    gradientClass={getCardStyle(focusedCard.bank, focusedCard.name)}
                                    onClick={() => handleOpenDetail(focusedCard)}
                                    onToggle={() => toggleCard(focusedCard.id)}
                                    onDeleteRequest={() => setCardToDelete(focusedCard)}
                                    transition={stackTransition}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-6 text-center text-white/70 text-sm font-medium"
                                >
                                    點擊卡片查看詳情，或點擊背景返回
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- Draggable Slide-Up Detail View --- */}
                <AnimatePresence>
                    {selectedCard && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-40"
                                onClick={handleCloseDetail}
                            />

                            {/* Sheet */}
                            <motion.div
                                className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                drag="y"
                                dragConstraints={{ top: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 100 || info.velocity.y > 500) {
                                        handleCloseDetail();
                                    }
                                }}
                            >
                                {/* Drag Handle */}
                                <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing bg-white">
                                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-white overscroll-contain">
                                    <CardDetailView
                                        card={selectedCard}
                                        onBack={handleCloseDetail} // Back button is redundant in draggable sheet but good to keep
                                        onEdit={() => setIsEditing(true)}
                                    />

                                    {/* Delete Button Area */}
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
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

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
        </LayoutGroup>
    );
}
