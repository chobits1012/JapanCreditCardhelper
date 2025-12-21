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
        return ['fubon-j', 'federal-gilgo', 'cathay-cube'];
    },

    fetchCardTemplate: async (keyword) => {
        await new Promise(resolve => setTimeout(resolve, 600)); // Delay

        if (keyword.includes('富邦') || keyword.includes('J') || keyword.toLowerCase().includes('j')) {
            return {
                name: '富邦 J 卡',
                bank: '台北富邦銀行',
                programs: [{
                    id: 'temp-prog-j',
                    cardId: 'temp',
                    name: '日韓旅遊回饋',
                    startDate: '2025-01-01',
                    endDate: '2025-06-30',
                    baseRate: 0.01,
                    bonusRules: [{
                        id: 'temp-rule-j',
                        name: '日韓實體消費',
                        rate: 0.03,
                        categories: ['general_japan'],
                        capAmount: undefined,
                        requiresRegistration: true
                    }]
                }]
            };
        }

        if (keyword.includes('CUBE') || keyword.includes('國泰')) {
            return {
                name: 'CUBE 卡',
                bank: '國泰世華銀行',
                programs: [{
                    id: 'temp-prog-cube',
                    cardId: 'temp',
                    name: '趣旅行權益',
                    startDate: '2025-01-01',
                    endDate: '2025-12-31',
                    baseRate: 0.003,
                    bonusRules: [{
                        id: 'temp-rule-cube',
                        name: '指定旅遊通路',
                        rate: 0.03,
                        categories: ['general_japan', 'hotel', 'airline'],
                        capAmount: undefined,
                        requiresRegistration: false
                    }]
                }]
            };
        }

        return null;
    }
};
