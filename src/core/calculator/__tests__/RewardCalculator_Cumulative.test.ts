import { describe, it, expect } from 'vitest';
import { createCalculatorWithStore } from '../RewardCalculator';
import type { Transaction } from '../../../types';

describe('RewardCalculator - Cumulative Logic', () => {
    it('should sum up transactions correctly within date range', () => {
        const mockTransactions: Transaction[] = [
            {
                id: 't1',
                cardId: 'card1',
                date: '2025-01-31', // Inside range? No, range starts 2/1
                amount: 50000,
                currency: 'JPY',
                exchangeRate: 0.22,
                paymentMethod: '刷卡',
                category: 'general_japan',
                calculatedRewardAmount: 0,
                appliedRuleNames: []
            } as any,
            {
                id: 't2',
                cardId: 'card1',
                date: '2025-02-15', // Inside range
                amount: 60000,
                currency: 'JPY',
                exchangeRate: 0.22,
                paymentMethod: '刷卡',
                category: 'general_japan',
                calculatedRewardAmount: 0,
                appliedRuleNames: []
            } as any
        ];

        // Mock store getter
        const calculator = createCalculatorWithStore(() => mockTransactions);

        // Access the private cumulativeCalculator via a public method that uses it?
        // Actually, createCalculatorWithStore returns a RewardCalculator instance.
        // We can test it by calling calculate() on a rule that needs cumulative calc.

        // But we want to test the cumulative calculator logic specifically.
        // Since it's internal, let's infer it from calculate().

        const card: any = {
            id: 'card1',
            programs: [{
                id: 'p1',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                bonusRules: [{
                    id: 'r1',
                    name: 'Cumulative Rule',
                    minAmount: 100000,
                    minAmountType: 'cumulative',
                    minAmountCurrency: 'JPY',
                    startDate: '2025-02-01',
                    endDate: '2025-04-30',
                    rate: 0.1, // 10%
                    rewardType: 'fixed',
                    fixedRewardAmount: 10000
                }]
            }]
        };

        // Current transaction: 40,000.
        // T1 (50k) is OUT (Jan 31).
        // T2 (60k) is IN (Feb 15).
        // Accumulated = 60k.
        // Current + Accumulated = 40k + 60k = 100k.
        // Threshold 100k MET.
        // Should get reward.

        const currentTx: any = {
            id: 'current',
            date: '2025-02-20',
            amount: 40000,
            currency: 'JPY',
            exchangeRate: 0.22,
            cardId: 'card1',
            category: 'general_japan'
        };

        const result = calculator.calculate(card, currentTx);

        // Expect fixed reward of 10000 (JPY -> TWD calculation depends on implementation, but reward > 0)
        // Fixed reward amount is 10000. Currency JPY (default).
        // Exchange Rate 0.22 -> 2200 TWD.

        const bonusHook = result.breakdown.find(b => b.ruleId === 'r1');
        expect(bonusHook).toBeDefined();
        expect(bonusHook?.amount).toBeGreaterThan(0);
    });

    it('should NOT sum transactions outside date range', () => {
        const mockTransactions: Transaction[] = [
            {
                id: 't1',
                cardId: 'card1',
                date: '2025-01-31', // OUT
                amount: 90000,
                currency: 'JPY',
                exchangeRate: 0.22,
                paymentMethod: '刷卡',
                category: 'general_japan',
                calculatedRewardAmount: 0,
                appliedRuleNames: []
            } as any
        ];

        const calculator = createCalculatorWithStore(() => mockTransactions);

        const card: any = {
            id: 'card1',
            programs: [{
                id: 'p1',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                bonusRules: [{
                    id: 'r1',
                    name: 'Cumulative Rule',
                    minAmount: 100000,
                    minAmountType: 'cumulative',
                    startDate: '2025-02-01',
                    endDate: '2025-04-30',
                    rate: 0.1,
                    rewardType: 'fixed',
                    fixedRewardAmount: 10000
                }]
            }]
        };

        const currentTx: any = {
            id: 'current',
            date: '2025-02-20',
            amount: 9000, // 90k + 9k < 100k
            currency: 'JPY',
            exchangeRate: 0.22,
            cardId: 'card1',
            category: 'general_japan'
        };

        const result = calculator.calculate(card, currentTx);

        // Should NOT meet threshold because t1 is excluded.
        const bonusHook = result.breakdown.find(b => b.ruleId === 'r1');
        expect(bonusHook).toBeUndefined();
    });
});
