import type { CreditCard } from '../types';

export interface BankUpdateResult {
    hasUpdate: boolean;
    newVersion?: CreditCard;
    message?: string; // e.g., "Found new 2026 Q1 rewards"
}

export interface BankDataService {
    /**
     * Check if there are official updates for a specific card.
     * In a real implementation, this would call a backend API or scraper.
     */
    checkUpdates: (card: CreditCard) => Promise<BankUpdateResult>;

    /**
     * Fetch the latest official list of supported cards.
     */
    getSupportedCards: () => Promise<string[]>; // Returns list of supported card IDs

    /**
     * Simulate fetching card logic for generic auto-fill
     */
    fetchCardTemplate: (keyword: string) => Promise<Partial<CreditCard> | null>;
}

import { CARD_TEMPLATES } from '../data/cardTemplates';

// Mock Implementation stub
export const MockBankService: BankDataService = {
    checkUpdates: async (card) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Logic: specific rule to "find" an update for testing
        // For demonstration, let's pretend 'fubon-j' always has a 'secret' update if not already applied
        if (card.id === 'fubon-j' && !card.name.includes('自動更新')) {
            return {
                hasUpdate: true,
                message: '發現富邦 J 卡 2026 預告權益！',
                // In real world, this would return the full new structure
            };
        }

        return { hasUpdate: false };
    },

    getSupportedCards: async () => {
        return CARD_TEMPLATES.map(c => c.name || '');
    },

    fetchCardTemplate: async (keyword) => {
        await new Promise(resolve => setTimeout(resolve, 600)); // Delay

        const lowerKeyword = keyword.toLowerCase();

        // Find matched template
        const matched = CARD_TEMPLATES.find(t =>
            (t.name && t.name.toLowerCase().includes(lowerKeyword)) ||
            (t.bank && t.bank.toLowerCase().includes(lowerKeyword)) ||
            (lowerKeyword.includes('j') && t.name?.includes('J')) // Special case for "J card" generic search
        );

        if (matched) {
            // Return a deep copy to avoid mutation
            return JSON.parse(JSON.stringify(matched));
        }

        return null;
    }
};
