/**
 * CreditCardListItem Component
 * 
 * A card component for displaying credit cards in list/stack view modes.
 * Extracted from MyCardsPage for better maintainability.
 */

import { Trash2, CreditCard as CardIcon, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CreditCard } from '../../types';

// Helper: Card Logo / Icon
export const CardLogo = () => {
    return (
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <CardIcon className="w-4 h-4 text-white" />
        </div>
    );
};

export interface CreditCardListItemProps {
    card: CreditCard;
    isActive: boolean;
    displayRate: string;
    gradientClass: string;
    onClick: () => void;
    onToggle: () => void;
    onDeleteRequest: () => void;
    layoutId?: string;
    transition?: any;
    /** For stack mode focus specific styles */
    className?: string;
}

export default function CreditCardListItem({
    card,
    isActive,
    displayRate,
    gradientClass,
    onClick,
    onToggle,
    onDeleteRequest,
    layoutId,
    transition,
    className
}: CreditCardListItemProps) {
    return (
        <motion.div
            layoutId={layoutId}
            layout
            className={`w-full h-48 overflow-hidden rounded-3xl relative group ${className || ''}`}
            transition={transition || { type: "spring", stiffness: 260, damping: 20 }}
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
}
