/**
 * RewardCalculator 單元測試
 */

import { describe, it, expect } from 'vitest';
import { RewardCalculator } from '../RewardCalculator';
import type { CreditCard, RewardProgram, Transaction, BonusRule } from '../../../types';

// 測試用 Helper 函數
const createRule = (overrides: Partial<BonusRule> = {}): BonusRule => ({
    id: 'rule-1',
    name: 'Test Rule',
    rate: 0.05,
    categories: [],
    ...overrides,
});

const createProgram = (overrides: Partial<RewardProgram> = {}): RewardProgram => ({
    id: 'prog-1',
    cardId: 'card-1',
    name: 'Test Program',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    baseRateOverseas: 0.01,
    baseRateDomestic: 0.005,
    bonusRules: [],
    ...overrides,
});

const createCard = (programs: RewardProgram[] = []): CreditCard => ({
    id: 'card-1',
    name: 'Test Card',
    bank: 'Test Bank',
    foreignTxFee: 1.5,
    programs,
});

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'tx-1',
    date: '2024-06-15',
    amount: 10000,
    currency: 'JPY',
    exchangeRate: 0.22,
    merchantName: 'Test Store',
    category: 'general_japan',
    paymentMethod: '刷卡',
    cardId: 'card-1',
    programId: 'prog-1',
    calculatedRewardAmount: 0,
    appliedRuleNames: [],
    ...overrides,
});

describe('RewardCalculator', () => {
    describe('Basic Calculation', () => {
        it('should calculate base reward for travel mode', () => {
            const program = createProgram({ baseRateOverseas: 0.01 });
            const card = createCard([program]);
            const tx = createTransaction({ amount: 10000, exchangeRate: 0.22 });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // 10000 JPY * 0.22 = 2200 TWD, 2200 * 0.01 = 22 TWD
            expect(result.totalReward).toBe(22);
            expect(result.breakdown[0].ruleName).toBe('海外基礎回饋');
        });

        it('should calculate base reward for daily mode', () => {
            const program = createProgram({ baseRateDomestic: 0.005 });
            const card = createCard([program]);
            const tx = createTransaction({
                amount: 1000,
                currency: 'TWD',
                exchangeRate: 1
            });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'daily');

            // 1000 TWD * 0.005 = 5 TWD
            expect(result.totalReward).toBe(5);
            expect(result.breakdown[0].ruleName).toBe('國內基礎回饋');
        });
    });

    describe('Bonus Rules', () => {
        it('should apply bonus rule when all conditions match', () => {
            const rule = createRule({
                rate: 0.05,
                categories: ['general_japan'],
                region: 'japan'
            });
            const program = createProgram({
                baseRateOverseas: 0.01,
                bonusRules: [rule]
            });
            const card = createCard([program]);
            const tx = createTransaction({ category: 'general_japan' });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // Base: 22 TWD + Bonus: 2200 * 0.05 = 110 TWD
            expect(result.totalReward).toBe(22 + 110);
            expect(result.breakdown).toHaveLength(2);
        });

        it('should skip rule when category does not match', () => {
            const rule = createRule({
                rate: 0.05,
                categories: ['drugstore']
            });
            const program = createProgram({ bonusRules: [rule] });
            const card = createCard([program]);
            const tx = createTransaction({ category: 'general_japan' });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // Only base reward
            expect(result.breakdown).toHaveLength(1);
        });

        it('should skip rule when region does not match mode', () => {
            const rule = createRule({
                rate: 0.05,
                region: 'taiwan'
            });
            const program = createProgram({ bonusRules: [rule] });
            const card = createCard([program]);
            const tx = createTransaction();

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // Taiwan rule should not apply in travel mode
            expect(result.breakdown).toHaveLength(1);
        });
    });

    describe('Cap Handling', () => {
        it('should cap bonus when limit reached', () => {
            const rule = createRule({
                rate: 0.10,
                capAmount: 100,
                capAmountCurrency: 'TWD',
            });
            const program = createProgram({
                baseRateOverseas: 0,
                bonusRules: [rule]
            });
            const card = createCard([program]);
            const tx = createTransaction({ amount: 10000, exchangeRate: 0.22 });

            const calculator = new RewardCalculator();
            // Already used 50 TWD of cap
            const result = calculator.calculate(card, tx, { [rule.id]: 50 }, 'travel');

            // Potential: 2200 * 0.10 = 220, but cap remaining is 50
            expect(result.breakdown[1].amount).toBe(50);
            expect(result.breakdown[1].capped).toBe(true);
        });

        it('should not cap when within limit', () => {
            const rule = createRule({
                rate: 0.05,
                capAmount: 1000,
                capAmountCurrency: 'TWD',
            });
            const program = createProgram({
                baseRateOverseas: 0,
                bonusRules: [rule]
            });
            const card = createCard([program]);
            const tx = createTransaction({ amount: 10000, exchangeRate: 0.22 });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // 2200 * 0.05 = 110, well under 1000 cap
            expect(result.breakdown[1].amount).toBe(110);
            expect(result.breakdown[1].capped).toBe(false);
        });
    });

    describe('Transaction Fee', () => {
        it('should charge fee in travel mode', () => {
            const program = createProgram();
            const card = createCard([program]);
            const tx = createTransaction();

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // 2200 TWD * 1.5% = 33 TWD
            expect(result.transactionFee).toBe(33);
        });

        it('should not charge fee for TWD in daily mode', () => {
            const program = createProgram();
            const card = createCard([program]);
            const tx = createTransaction({
                amount: 1000,
                currency: 'TWD',
                exchangeRate: 1
            });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'daily');

            expect(result.transactionFee).toBe(0);
        });
    });

    describe('Program Matching', () => {
        it('should warn when no program found', () => {
            const card = createCard([]);
            const tx = createTransaction();

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            expect(result.warnings).toContain('找不到此日期的適用權益');
            expect(result.totalReward).toBe(0);
        });

        it('should use fallback program when date is after all programs', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2024-06-30'
            });
            const card = createCard([program]);
            const tx = createTransaction({ date: '2024-12-01' });

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            expect(result.warnings.some(w => w.includes('已過期'))).toBe(true);
            expect(result.programId).toBe(program.id);
        });
    });

    describe('Minimum Amount', () => {
        it('should skip rule when below minimum amount (per transaction)', () => {
            const rule = createRule({
                rate: 0.10,
                minAmount: 5000,
                minAmountCurrency: 'TWD',
                minAmountType: 'per_transaction'
            });
            const program = createProgram({
                baseRateOverseas: 0.01,
                bonusRules: [rule]
            });
            const card = createCard([program]);
            const tx = createTransaction({ amount: 10000, exchangeRate: 0.22 }); // 2200 TWD

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // 2200 TWD < 5000 TWD threshold, bonus should not apply
            expect(result.breakdown).toHaveLength(1); // Only base
        });

        it('should apply rule when above minimum amount', () => {
            const rule = createRule({
                rate: 0.10,
                minAmount: 1000,
                minAmountCurrency: 'TWD',
                minAmountType: 'per_transaction'
            });
            const program = createProgram({
                baseRateOverseas: 0.01,
                bonusRules: [rule]
            });
            const card = createCard([program]);
            const tx = createTransaction({ amount: 10000, exchangeRate: 0.22 }); // 2200 TWD

            const calculator = new RewardCalculator();
            const result = calculator.calculate(card, tx, {}, 'travel');

            // 2200 TWD > 1000 TWD threshold, bonus should apply
            expect(result.breakdown).toHaveLength(2);
        });
    });
});
