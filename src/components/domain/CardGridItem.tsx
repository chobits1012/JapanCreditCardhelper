/**
 * CardGridItem Component
 * 
 * A compact card component for displaying credit cards in grid view mode.
 * Extracted from MyCardsPage for better maintainability.
 */

import { motion } from 'framer-motion';
import type { CreditCard } from '../../types';
import { CardLogo } from './CreditCardListItem';

export interface CardGridItemProps {
    card: CreditCard;
    isActive: boolean;
    displayRate: string;
    gradientClass: string;
    onClick: () => void;
    onToggle: () => void;
    layoutId?: string;
}

export default function CardGridItem({
    card,
    isActive,
    displayRate,
    gradientClass,
    onClick,
    onToggle,
    layoutId
}: CardGridItemProps) {
    return (
        <motion.div
            layoutId={layoutId}
            key={card.id}
            onClick={onClick}
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
                    onClick={onToggle}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-white/50'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-white/50'}`} />
                </button>
            </div>
        </motion.div>
    );
}
