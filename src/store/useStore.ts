import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreditCard, Transaction } from '../types';
import { MOCK_CARDS } from '../data/mockData';
import { CARD_TEMPLATES } from '../data/cardTemplates';

interface AppState {
    cards: CreditCard[];
    activeCardIds: string[]; // IDs of cards the user owns/enabled
    transactions: Transaction[];
    mode: 'travel' | 'daily'; // Global App Mode
    hasCompletedOnboarding: boolean; // Whether user has completed onboarding

    // Actions
    toggleMode: () => void;
    addTransaction: (t: Transaction) => void;
    addCard: (c: CreditCard) => void;
    updateCard: (c: CreditCard) => void;
    removeCard: (cardId: string) => void;
    toggleCard: (cardId: string) => void;
    removeTransaction: (transactionId: string) => void;
    resetTransactions: () => void;
    completeOnboarding: () => void;

    // Computed helpers
    getRuleUsage: (ruleId: string, date: string, statementDate?: number) => number;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            cards: [], // Start with empty wallet
            activeCardIds: [], // No active cards by default
            transactions: [],
            mode: 'travel', // Default to Travel Mode (Japan)
            hasCompletedOnboarding: false, // Default: show onboarding to new users

            toggleMode: () => set((state) => ({
                mode: state.mode === 'travel' ? 'daily' : 'travel'
            })),

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

            removeCard: (cardId) => set((state) => ({
                cards: state.cards.filter((c) => c.id !== cardId),
                activeCardIds: state.activeCardIds.filter((id) => id !== cardId)
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

            completeOnboarding: () => set({ hasCompletedOnboarding: true }),

            getRuleUsage: (ruleId: string, targetDateStr: string, statementDate: number = 31) => {
                const { transactions, cards } = get();

                // 1. Find the Rule Definition to check its capPeriod
                // We need to search through all cards -> programs -> bonusRules
                let ruleDef: any = null;
                let programDef: any = null;

                for (const card of cards) {
                    for (const prog of card.programs) {
                        const found = prog.bonusRules.find(r => r.id === ruleId);
                        if (found) {
                            ruleDef = found;
                            programDef = prog;
                            break;
                        }
                    }
                    if (ruleDef) break;
                }

                // Parse target date
                const targetDate = new Date(targetDateStr);
                const targetDay = targetDate.getDate();
                const targetYear = targetDate.getFullYear();
                const targetMonth = targetDate.getMonth();

                let start: Date;
                let end: Date;

                // 2. Determine Calculation Period
                if (ruleDef && ruleDef.capPeriod === 'campaign' && programDef) {
                    // Campaign Period: Use Program Start/End Dates
                    start = new Date(programDef.startDate);
                    end = new Date(programDef.endDate);
                } else {
                    // Default / Monthly: Billing Cycle Logic
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
                }

                return transactions.reduce((sum, t) => {
                    const tDate = new Date(t.date);
                    // Check if transaction falls within the determined period
                    if (tDate >= start && tDate <= end) {
                        return sum + (t.ruleUsageMap?.[ruleId] || 0);
                    }
                    return sum;
                }, 0);
            }
        }),
        {
            name: 'credit-card-helper-storage',
            version: 5, // Bump for fresh start
            migrate: (persistedState: any, version) => {
                let state = persistedState;

                // Migration to v2: Dual Base Rates & Region
                if (version === undefined || version < 2) {
                    const existingCards = state.cards || [];
                    const migratedCards = existingCards.map((card: any) => ({
                        ...card,
                        programs: card.programs.map((prog: any) => ({
                            ...prog,
                            // Map old baseRate to baseRateOverseas
                            baseRateOverseas: prog.baseRateOverseas ?? prog.baseRate ?? 0.01,
                            // Default domestic to overseas (safe fallback) or 1%
                            baseRateDomestic: prog.baseRateDomestic ?? prog.baseRate ?? 0.01,
                            // Migrate Rules: Default to 'japan' if not set
                            bonusRules: prog.bonusRules.map((rule: any) => ({
                                ...rule,
                                region: rule.region || 'japan'
                            }))
                        }))
                    }));

                    // Logic to add missing virtual cards if needed
                    const virtualCardIds = ['card_virtual_allplus', 'card_virtual_jko'];
                    const missingCards = MOCK_CARDS.filter(mock =>
                        virtualCardIds.includes(mock.id) &&
                        !migratedCards.some((existing: CreditCard) => existing.id === mock.id)
                    );

                    state = {
                        ...state,
                        cards: [...migratedCards, ...missingCards],
                        mode: state.mode || 'travel'
                    };
                }

                // Migration to v3: Refresh Jihe Card Rules (Add paymentMethod constraints)
                if (version === undefined || version < 3) {
                    const templateJiho = CARD_TEMPLATES.find(t => t.name === '吉鶴卡');
                    if (templateJiho && templateJiho.programs) {
                        const existingCards = state.cards || [];
                        const updatedCards = existingCards.map((card: any) => {
                            if (card.name === '吉鶴卡') {
                                // Refresh programs from template to get new rules (with paymentMethods)
                                return {
                                    ...card,
                                    programs: templateJiho.programs
                                };
                            }
                            return card;
                        });

                        state = {
                            ...state,
                            cards: updatedCards
                        };
                    }
                }

                // Migration to v4: Add onboarding state
                if (version === undefined || version < 4) {
                    state = {
                        ...state,
                        hasCompletedOnboarding: state.hasCompletedOnboarding ?? false
                    };
                }

                return state;
            },
        }
    )
);
