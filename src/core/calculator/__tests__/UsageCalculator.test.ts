import { describe, it, expect } from 'vitest';
import { UsageCalculator } from '../UsageCalculator';
import type { BonusRule, RewardProgram, Transaction } from '../../../types';
import { parseISO } from 'date-fns';

describe('UsageCalculator', () => {
    describe('calculateRuleUsage', () => {
        const mockTransactions: Transaction[] = [
            {
                id: 't1',
                date: '2024-01-15',
                cardId: 'card1',
                amount: 1000,
                ruleUsageMap: { 'rule1': 100 },
            } as any,
            {
                id: 't2',
                date: '2024-01-20',
                cardId: 'card1',
                amount: 2000,
                ruleUsageMap: { 'rule1': 200 },
            } as any,
            {
                id: 't3',
                date: '2024-02-01', // Out of range
                cardId: 'card1',
                amount: 3000,
                ruleUsageMap: { 'rule1': 300 },
            } as any,
            {
                id: 't4',
                date: '2024-01-15',
                cardId: 'card2', // Wrong card
                amount: 1000,
                ruleUsageMap: { 'rule1': 100 },
            } as any,
        ];

        it('should sum usage for specific rule within period and card', () => {
            const start = parseISO('2024-01-01');
            const end = parseISO('2024-01-31');

            const usage = UsageCalculator.calculateRuleUsage(
                mockTransactions,
                'rule1',
                'card1',
                start,
                end
            );

            expect(usage).toBe(300); // 100 + 200
        });

        it('should return 0 if no matching transactions', () => {
            const start = parseISO('2024-03-01');
            const end = parseISO('2024-03-31');

            const usage = UsageCalculator.calculateRuleUsage(
                mockTransactions,
                'rule1',
                'card1',
                start,
                end
            );

            expect(usage).toBe(0);
        });
    });

    describe('getUsagePeriod', () => {
        const mockProgram = {
            startDate: '2024-01-01',
            endDate: '2024-06-30'
        } as RewardProgram;

        it('should return campaign period if rule is campaign-based', () => {
            const rule = { capPeriod: 'campaign' } as BonusRule;
            const { start, end } = UsageCalculator.getUsagePeriod(
                '2024-02-15',
                rule,
                mockProgram
            );

            // Check Start Date
            expect(start.getFullYear()).toBe(2024);
            expect(start.getMonth()).toBe(0); // Jan
            expect(start.getDate()).toBe(1);

            // Check End Date
            expect(end.getFullYear()).toBe(2024);
            expect(end.getMonth()).toBe(5); // June
            expect(end.getDate()).toBe(30);
        });

        it('should return calendar month period', () => {
            const rule = { capPeriod: 'monthly' } as BonusRule;
            const targetDate = '2024-02-15';

            const { start, end } = UsageCalculator.getUsagePeriod(
                targetDate,
                rule,
                mockProgram,
                27,
                'calendar'
            );

            // Start of Feb
            expect(start.getFullYear()).toBe(2024);
            expect(start.getMonth()).toBe(1); // Feb
            expect(start.getDate()).toBe(1);

            // End of Feb (Leap Year)
            expect(end.getFullYear()).toBe(2024);
            expect(end.getMonth()).toBe(1); // Feb
            expect(end.getDate()).toBe(29);
        });

        it('should return statement period (current month cycle)', () => {
            // Case: Statement Date 27, Target Date 28 (Cycle started this month)
            // Cycle: 2024-02-28 ~ 2024-03-27
            const rule = { capPeriod: 'monthly' } as BonusRule;
            const targetDate = '2024-02-28';

            const { start, end } = UsageCalculator.getUsagePeriod(
                targetDate,
                rule,
                mockProgram,
                27,
                'statement'
            );

            expect(start.getDate()).toBe(28);
            expect(start.getMonth()).toBe(1); // Feb (0-indexed)

            expect(end.getDate()).toBe(27);
            expect(end.getMonth()).toBe(2); // Mar (0-indexed)
        });

        it('should return statement period (previous month cycle)', () => {
            // Case: Statement Date 27, Target Date 15 (Cycle started last month)
            // Cycle: 2024-01-28 ~ 2024-02-27
            const rule = { capPeriod: 'monthly' } as BonusRule;
            const targetDate = '2024-02-15';

            const { start, end } = UsageCalculator.getUsagePeriod(
                targetDate,
                rule,
                mockProgram,
                27,
                'statement'
            );

            expect(start.getDate()).toBe(28);
            expect(start.getMonth()).toBe(0); // Jan

            expect(end.getDate()).toBe(27);
            expect(end.getMonth()).toBe(1); // Feb
        });
    });
});
