/**
 * ProgramMatcher 單元測試
 */

import { describe, it, expect } from 'vitest';
import { ProgramMatcher } from '../ProgramMatcher';
import type { CreditCard, RewardProgram } from '../../../types';

// 測試用 helper 函數
const createProgram = (overrides: Partial<RewardProgram> = {}): RewardProgram => ({
    id: 'prog-1',
    cardId: 'card-1',
    name: 'Test Program',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    baseRateOverseas: 0.01,
    baseRateDomestic: 0.01,
    bonusRules: [],
    ...overrides,
});

const createCard = (programs: RewardProgram[] = []): CreditCard => ({
    id: 'card-1',
    name: 'Test Card',
    bank: 'Test Bank',
    programs,
});

describe('ProgramMatcher', () => {
    describe('findApplicableProgram', () => {
        it('should return null when card has no programs', () => {
            const card = createCard([]);
            const result = ProgramMatcher.findApplicableProgram(card, '2024-03-15');
            expect(result).toBeNull();
        });

        it('should find a program that covers the transaction date', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            });
            const card = createCard([program]);

            const result = ProgramMatcher.findApplicableProgram(card, '2024-03-15');
            expect(result).toEqual(program);
        });

        it('should return null when transaction date is before any program', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            });
            const card = createCard([program]);

            const result = ProgramMatcher.findApplicableProgram(card, '2023-12-31');
            expect(result).toBeNull();
        });

        it('should return null when transaction date is after all programs', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            });
            const card = createCard([program]);

            const result = ProgramMatcher.findApplicableProgram(card, '2024-07-01');
            expect(result).toBeNull();
        });

        it('should include transactions on the start date', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            });
            const card = createCard([program]);

            const result = ProgramMatcher.findApplicableProgram(card, '2024-01-01');
            expect(result).toEqual(program);
        });

        it('should include transactions on the end date', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            });
            const card = createCard([program]);

            const result = ProgramMatcher.findApplicableProgram(card, '2024-06-30');
            expect(result).toEqual(program);
        });

        it('should select the correct program from multiple non-overlapping programs', () => {
            const springProgram = createProgram({
                id: 'spring',
                name: 'Spring Bonus',
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            });
            const fallProgram = createProgram({
                id: 'fall',
                name: 'Fall Bonus',
                startDate: '2024-07-01',
                endDate: '2024-12-31',
            });
            const card = createCard([springProgram, fallProgram]);

            const springResult = ProgramMatcher.findApplicableProgram(card, '2024-03-15');
            expect(springResult?.id).toBe('spring');

            const fallResult = ProgramMatcher.findApplicableProgram(card, '2024-09-15');
            expect(fallResult?.id).toBe('fall');
        });
    });

    describe('hasOverlap', () => {
        it('should return true for completely overlapping programs', () => {
            const p1 = createProgram({ startDate: '2024-01-01', endDate: '2024-06-30' });
            const p2 = createProgram({ startDate: '2024-03-01', endDate: '2024-04-30' });

            expect(ProgramMatcher.hasOverlap(p1, p2)).toBe(true);
        });

        it('should return true for partially overlapping programs', () => {
            const p1 = createProgram({ startDate: '2024-01-01', endDate: '2024-06-30' });
            const p2 = createProgram({ startDate: '2024-05-01', endDate: '2024-12-31' });

            expect(ProgramMatcher.hasOverlap(p1, p2)).toBe(true);
        });

        it('should return false for non-overlapping programs', () => {
            const p1 = createProgram({ startDate: '2024-01-01', endDate: '2024-06-30' });
            const p2 = createProgram({ startDate: '2024-07-01', endDate: '2024-12-31' });

            expect(ProgramMatcher.hasOverlap(p1, p2)).toBe(false);
        });

        it('should return true for programs that touch at boundaries (same day end/start)', () => {
            const p1 = createProgram({ startDate: '2024-01-01', endDate: '2024-06-30' });
            const p2 = createProgram({ startDate: '2024-06-30', endDate: '2024-12-31' });

            expect(ProgramMatcher.hasOverlap(p1, p2)).toBe(true);
        });
    });

    describe('validatePrograms', () => {
        it('should return valid for a card with no programs', () => {
            const card = createCard([]);
            const result = ProgramMatcher.validatePrograms(card);
            expect(result.valid).toBe(true);
            expect(result.conflicts).toBeUndefined();
        });

        it('should return valid for a card with one program', () => {
            const card = createCard([createProgram()]);
            const result = ProgramMatcher.validatePrograms(card);
            expect(result.valid).toBe(true);
        });

        it('should return valid for non-overlapping programs', () => {
            const card = createCard([
                createProgram({ id: 'p1', name: 'P1', startDate: '2024-01-01', endDate: '2024-06-30' }),
                createProgram({ id: 'p2', name: 'P2', startDate: '2024-07-01', endDate: '2024-12-31' }),
            ]);
            const result = ProgramMatcher.validatePrograms(card);
            expect(result.valid).toBe(true);
        });

        it('should return invalid with conflicts for overlapping programs', () => {
            const card = createCard([
                createProgram({ id: 'p1', name: 'Spring', startDate: '2024-01-01', endDate: '2024-06-30' }),
                createProgram({ id: 'p2', name: 'Special', startDate: '2024-05-01', endDate: '2024-08-31' }),
            ]);
            const result = ProgramMatcher.validatePrograms(card);
            expect(result.valid).toBe(false);
            expect(result.conflicts).toHaveLength(1);
            expect(result.conflicts?.[0]).toEqual({ p1: 'Spring', p2: 'Special' });
        });
    });

    describe('getRemainingDays', () => {
        it('should return 0 for an expired program', () => {
            const program = createProgram({
                startDate: '2020-01-01',
                endDate: '2020-06-30',
            });
            const days = ProgramMatcher.getRemainingDays(program);
            expect(days).toBe(0);
        });
    });

    describe('isExpired', () => {
        it('should return true for a program that ended in the past', () => {
            const program = createProgram({
                startDate: '2020-01-01',
                endDate: '2020-06-30',
            });
            expect(ProgramMatcher.isExpired(program)).toBe(true);
        });

        it('should return false for a program ending in the future', () => {
            const program = createProgram({
                startDate: '2024-01-01',
                endDate: '2030-12-31',
            });
            expect(ProgramMatcher.isExpired(program)).toBe(false);
        });
    });

    describe('isUpcoming', () => {
        it('should return true for a program starting in the future', () => {
            const program = createProgram({
                startDate: '2030-01-01',
                endDate: '2030-12-31',
            });
            expect(ProgramMatcher.isUpcoming(program)).toBe(true);
        });

        it('should return false for a program that has already started', () => {
            const program = createProgram({
                startDate: '2020-01-01',
                endDate: '2030-12-31',
            });
            expect(ProgramMatcher.isUpcoming(program)).toBe(false);
        });
    });
});
