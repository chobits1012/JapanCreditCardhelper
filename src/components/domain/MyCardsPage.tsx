import { useState } from 'react';
import { Plus, Trash2, LayoutList, LayoutGrid, Layers } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CardDataForm from './CardDataForm';
import CardDetailView from './CardDetailView';
import ConfirmModal from '../ui/ConfirmModal';
import CreditCardListItem, { CardLogo } from './CreditCardListItem';
import CardGridItem from './CardGridItem';
import { getCardStyle, getDisplayRate } from './cardHelpers';
import type { CreditCard } from '../../types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

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
        if (focusedCardId === card.id) {
            handleOpenDetail(card);
        } else {
            setFocusedCardId(card.id);
        }
    };

    const handleCollapseStack = () => {
        setFocusedCardId(null);
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

    // Much slower, "cinematic" spring for maximum visibility
    // Unified Elegant Transition for all view modes
    // Slower, smoother spring physics to match the premium feel
    const elegantTransition: any = { type: "spring", stiffness: 120, damping: 20, mass: 1 };

    return (
        <LayoutGroup>
            <div className="max-w-md mx-auto p-4 pb-24 min-h-screen relative overflow-hidden flex flex-col">
                {/* Header Area */}
                <motion.div
                    layout
                    transition={elegantTransition}
                    className="flex items-center justify-between mb-6 pt-2 shrink-0 z-50 relative"
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
                                onClick={() => { setViewMode('list'); setFocusedCardId(null); }}
                                className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setViewMode('grid'); setFocusedCardId(null); }}
                                className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setViewMode('stack'); setFocusedCardId(null); }}
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
                    transition={elegantTransition}
                    className={`flex-1 relative
                    ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 pb-20 content-start' : ''}
                    ${viewMode === 'list' ? 'space-y-5 pb-20' : ''}
                    ${viewMode === 'stack' ? 'flex flex-col' : ''}
                `}
                >
                    <AnimatePresence mode="popLayout">
                        {cards.map((card, index) => {
                            const isActive = activeCardIds.includes(card.id);
                            const gradientClass = getCardStyle(card);
                            const displayRate = getDisplayRate(card);

                            // --- GRID VIEW ---
                            if (viewMode === 'grid') {
                                return (
                                    <CardGridItem
                                        key={card.id}
                                        layoutId={`card-${card.id}`}
                                        card={card}
                                        isActive={isActive}
                                        displayRate={displayRate}
                                        gradientClass={gradientClass}
                                        onClick={() => handleOpenDetail(card)}
                                        onToggle={() => toggleCard(card.id)}
                                    />
                                );
                            }

                            // --- STACK VIEW ---
                            if (viewMode === 'stack') {
                                // Logic to calculate relative rank for gap-less stacking
                                // Rank = Position among [NON-FOCUSED] cards
                                // We filter out the focused card, find index of current card
                                const nonFocusedCards = cards.filter(c => c.id !== focusedCardId);
                                const stackIndex = nonFocusedCards.findIndex(c => c.id === card.id);
                                const isFocused = focusedCardId === card.id;
                                const hasFocus = !!focusedCardId;

                                // STACK STATE B: FOCUSED MODE
                                if (hasFocus) {
                                    if (isFocused) {
                                        // Render the FOCUSED card at the top (full List Item style)
                                        return (
                                            <CreditCardListItem
                                                key={card.id}
                                                layoutId={`card-${card.id}`}
                                                card={card}
                                                isActive={isActive}
                                                displayRate={displayRate}
                                                gradientClass={gradientClass}
                                                onClick={() => handleStackClick(card)}
                                                onToggle={() => toggleCard(card.id)}
                                                onDeleteRequest={() => setCardToDelete(card)}
                                                transition={elegantTransition}
                                                className="shadow-2xl z-40 mb-auto" // mb-auto pushes it to top
                                            />
                                        );
                                    } else {
                                        // Render NON-FOCUSED cards collapsed at bottom
                                        // Use relative `stackIndex` instead of absolute `index`
                                        // INVERT offset: Higher index (Front) should be LOWER (smaller bottom value)
                                        // This ensures we see the HEADERS (Top Edge) peaking out, not footers.
                                        const distinctStackSize = nonFocusedCards.length;
                                        const reverseIndex = distinctStackSize - 1 - stackIndex;

                                        return (
                                            <motion.div
                                                layoutId={`card-${card.id}`}
                                                key={card.id}
                                                onClick={handleCollapseStack} // Click any bottom card to un-focus
                                                className={`h-12 w-full rounded-t-xl absolute bottom-0 left-0 right-0 cursor-pointer border-t border-white/10 shadow-lg mx-auto max-w-[95%]
                                             ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                                         `}
                                                style={{
                                                    zIndex: stackIndex, // Keep Z-index natural (Front covers Back)
                                                    bottom: (reverseIndex * 4) + 'px', // Invert offset for Header visibility
                                                    scale: 0.9 + (stackIndex * 0.01), // Scale: Front is bigger? Or Back is bigger?
                                                    // Usually Front (Lower) is bigger. Back (Higher) is smaller.
                                                    // If stackIndex 0 is Back. It should be smallest.
                                                }}
                                                transition={elegantTransition}
                                            >
                                                {/* Minimal Content */}
                                                <div className="w-full h-1 bg-white/20 mx-auto mt-2 rounded-full w-1/4" />
                                            </motion.div>
                                        );
                                    }
                                }

                                // STACK STATE A: FAN MODE (Default)
                                return (
                                    <motion.div
                                        layoutId={`card-${card.id}`}
                                        key={card.id}
                                        onClick={() => handleStackClick(card)}
                                        className={`h-48 rounded-3xl relative cursor-pointer shadow-[0_-5px_15px_rgba(0,0,0,0.1)] border-t border-white/20 w-full
                                    ${index !== 0 ? '-mt-32' : ''}
                                    ${isActive ? gradientClass : 'bg-slate-200 grayscale-[0.8] opacity-80'}
                                `}
                                        style={{ zIndex: index }}
                                        whileHover={{ y: -10 }}
                                        transition={elegantTransition}
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
                    </AnimatePresence >

                    {viewMode === 'list' && (
                        <div className="pt-8 text-center pb-20">
                            <p className="text-xs text-slate-400 font-medium">左右滑動卡片可進行刪除</p>
                        </div>
                    )}
                </motion.div >



                {/* --- Draggable Slide-Up Detail View --- */}
                <AnimatePresence>
                    {
                        selectedCard && (() => {
                            // Get the latest card data from store to reflect any edits
                            const latestCard = cards.find(c => c.id === selectedCard.id) || selectedCard;

                            return (
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
                                                card={latestCard}
                                                onBack={handleCloseDetail} // Back button is redundant in draggable sheet but good to keep
                                                onEdit={() => setIsEditing(true)}
                                                gradientClass={getCardStyle(latestCard)}
                                            />

                                            {/* Delete Button Area */}
                                            <div className="p-6 pb-24 border-t border-gray-100 bg-gray-50/50">
                                                <button
                                                    onClick={() => setCardToDelete(latestCard)}
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
                            );
                        })()
                    }
                </AnimatePresence >

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
            </div >
        </LayoutGroup >
    );
}
