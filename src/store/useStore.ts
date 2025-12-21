import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreditCard, Transaction } from '../types';
import { MOCK_CARDS } from '../data/mockData';

interface AppState {
    cards: CreditCard[];
    activeCardIds: string[]; // IDs of cards the user owns/enabled
    transactions: Transaction[];

    // Actions
    addTransaction: (t: Transaction) => void;
    addCard: (c: CreditCard) => void;
    updateCard: (c: CreditCard) => void;
    toggleCard: (cardId: string) => void;
    removeTransaction: (transactionId: string) => void;
    resetTransactions: () => void;

    // Computed helpers
    getRuleUsage: (ruleId: string, date: string, statementDate?: number) => number;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            cards: MOCK_CARDS,
            activeCardIds: MOCK_CARDS.map(c => c.id), // Default all active
            transactions: [],

            addTransaction: (t) => set((state) => ({
                transactions: [...state.transactions, t]
            })),

            addCard: (newCard) => set((state) => ({
                cards: [...state.cards, newCard],
                activeCardIds: [...state.activeCardIds, newCard.id] // Auto-activate new cards
            })),

            updateCard: (updatedCard) => set((state) => ({
                cards: state.cards.map((c) => c.id === updatedCard.id ? updatedCard : c)
            })),

            toggleCard: (cardId) => set((state) => {
                const isActive = state.activeCardIds.includes(cardId);
                return {
                    activeCardIds: isActive
                        ? state.activeCardIds.filter(id => id !== cardId)
                        : [...state.activeCardIds, cardId]
                };
            }),

            removeTransaction: (transactionId) => set((state) => ({
                transactions: state.transactions.filter(t => t.id !== transactionId)
            })),

            resetTransactions: () => set({ transactions: [] }),

            getRuleUsage: (ruleId: string, targetDateStr: string, statementDate: number = 31) => {
                const { transactions } = get();

                // Parse the target date (when we want to check usage)
                // We use local time concept for simplicity as inputs are "YYYY-MM-DD"
                const targetDate = new Date(targetDateStr);
                const targetDay = targetDate.getDate();
                const targetYear = targetDate.getFullYear();
                const targetMonth = targetDate.getMonth(); // 0-indexed

                let start: Date;
                let end: Date;

                // Billing Cycle Logic
                // If statementDate is 27.
                // Case A: target is 5/15. (15 <= 27). Cycle: 4/28 - 5/27.
                // Case B: target is 5/28. (28 > 27).  Cycle: 5/28 - 6/27.

                if (targetDay > statementDate) {
                    // Current cycle started this month on (statementDate + 1)
                    start = new Date(targetYear, targetMonth, statementDate + 1);
                    // Ends next month on statementDate
                    end = new Date(targetYear, targetMonth + 1, statementDate);
                } else {
                    // Current cycle started last month
                    start = new Date(targetYear, targetMonth - 1, statementDate + 1);
                    // Ends this month on statementDate
                    end = new Date(targetYear, targetMonth, statementDate);
                }

                return transactions.reduce((sum, t) => {
                    const tDate = new Date(t.date);
                    // Check if transaction falls within the billing cycle
                    if (tDate >= start && tDate <= end) {
                        return sum + (t.ruleUsageMap?.[ruleId] || 0);
                    }
                    return sum;
                }, 0);
            }
        }),
        {
            name: 'credit-card-helper-storage',
            version: 1,
            migrate: (persistedState: any, version) => {
                if (version === 0 || version === undefined) {
                    // Migration from v0 to v1:
                    // Ensure all "System Virtual Cards" (e.g. All Plus, JKO) are present.
                    // We DO NOT overwrite user's existing cards, only append missing system ones.

                    const existingCards = persistedState.cards || [];
                    const virtualCardIds = ['card_virtual_allplus', 'card_virtual_jko'];

                    const missingCards = MOCK_CARDS.filter(mock =>
                        virtualCardIds.includes(mock.id) &&
                        !existingCards.some((existing: CreditCard) => existing.id === mock.id)
                    );

                    if (missingCards.length > 0) {
                        return {
                            ...persistedState,
                            cards: [...existingCards, ...missingCards],
                            // Optional: Add them to activeCardIds if you want them enabled by default
                            // activeCardIds: [...(persistedState.activeCardIds || []), ...missingCards.map(c => c.id)] 
                        };
                    }
                }
                return persistedState;
            },
        }
    )
);
