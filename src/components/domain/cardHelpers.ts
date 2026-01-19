/**
 * Card Helper Functions
 * 
 * Utility functions for credit card styling and calculations.
 * Extracted from MyCardsPage for better maintainability and reusability.
 */

import type { CreditCard } from '../../types';
import { CARD_THEMES, getThemeByKeyword } from './cardThemes';

/**
 * Get the gradient class for a card based on theme or bank/name matching
 */
export const getCardStyle = (card: CreditCard): string => {
    // 1. Use manual theme if set
    if (card.colorTheme) {
        const theme = CARD_THEMES.find(t => t.id === card.colorTheme);
        if (theme) return theme.class;
    }

    // 2. Fallback to keyword matching
    const themeId = getThemeByKeyword(card.bank, card.name);
    const theme = CARD_THEMES.find(t => t.id === themeId);
    return theme ? theme.class : CARD_THEMES.find(t => t.id === 'matte_black')!.class;
};

/**
 * Calculate the display rate for Japan rewards
 * Returns a formatted percentage string (e.g., "3.5")
 */
export const getDisplayRate = (card: CreditCard): string => {
    const programs = card.programs || [];
    const currentProgram = programs[0];
    const baseRate = currentProgram ? currentProgram.baseRateOverseas : 0;
    const maxBonus = currentProgram
        ? Math.max(0, ...currentProgram.bonusRules.filter(r => r.region === 'japan' || !r.region).map(r => r.rate))
        : 0;
    const totalMaxRate = baseRate + maxBonus;
    return (totalMaxRate * 100).toFixed(1);
};
