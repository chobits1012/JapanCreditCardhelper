import { createCalculatorWithStore, type CalculationResult as CoreResult, type CalculationMode } from '../core/calculator';
import type { CreditCard, Transaction, RewardProgram } from '../types';
import { ProgramMatcher } from '../core/calculator/ProgramMatcher';
import { useStore } from '../store/useStore';

/**
 * Re-export CalculationResult to match legacy interface
 * The core result is compatible with legacy result, so we can just use it.
 */
export type CalculationResult = CoreResult;

/**
 * @deprecated Use ProgramMatcher.findApplicableProgram instead.
 */
export function getActiveProgram(card: CreditCard, date: string): RewardProgram | undefined {
    return ProgramMatcher.findApplicableProgram(card, date) || undefined;
}

/**
 * @deprecated Internal logic moved to RewardCalculator.
 */
export function calculateCumulativeSpending(
    _currentTxId: string,
    _cardId: string,
    _startDate: string,
    _endDate: string,
    _currency: 'TWD' | 'JPY'
): number {
    return 0;
}

/**
 * Calculate reward for a single transaction on a specific card
 * Wrapper around RewardCalculator.calculate
 */
export function calculateReward(
    card: CreditCard,
    transaction: Transaction,
    usageMap: Record<string, number> = {},
    mode: 'travel' | 'daily' = 'travel'
): CalculationResult {
    // Create instance (uses store state for cumulative logic)
    const calculator = createCalculatorWithStore(() => useStore.getState().transactions);

    return calculator.calculate(card, transaction, usageMap, mode as CalculationMode);
}

export function recalculateTransaction(
    card: CreditCard,
    transaction: Omit<Transaction, 'calculatedRewardAmount' | 'appliedRuleNames' | 'ruleUsageMap'>,
    usageMap: Record<string, number> = {},
    mode: 'travel' | 'daily' = 'travel'
): Transaction {
    const result = calculateReward(card, transaction as Transaction, usageMap, mode);

    // Map result to Transaction structure
    // New core result.breakdown has ruleId, ruleName, amount, usageAmount.
    // ruleUsageMap construction logic is same.

    const ruleUsageMap: Record<string, number> = {};
    result.breakdown.forEach(item => {
        if (item.ruleId !== 'base') {
            const usage = item.usageAmount ?? item.amount;
            ruleUsageMap[item.ruleId] = (ruleUsageMap[item.ruleId] || 0) + usage;
        }
    });

    return {
        ...transaction,
        cardId: card.id,
        programId: result.programId ?? card.programs[0]?.id ?? '', // Use result.programId
        calculatedRewardAmount: result.totalReward,
        appliedRuleNames: result.breakdown.map(b => b.ruleName),
        ruleUsageMap
    } as Transaction;
}

export function recalculateCardTransactions(
    card: CreditCard,
    transactions: Transaction[],
    mode: 'travel' | 'daily' = 'travel'
): Transaction[] {
    const cardTransactions = transactions
        .filter(tx => tx.cardId === card.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const usageMap: Record<string, number> = {};

    return cardTransactions.map(tx => {
        const baseTx: Omit<Transaction, 'calculatedRewardAmount' | 'appliedRuleNames' | 'ruleUsageMap'> = {
            id: tx.id,
            date: tx.date,
            amount: tx.amount,
            currency: tx.currency,
            exchangeRate: tx.exchangeRate,
            merchantName: tx.merchantName,
            category: tx.category,
            paymentMethod: tx.paymentMethod,
            cardId: tx.cardId,
            programId: tx.programId,
        };

        const result = recalculateTransaction(card, baseTx, { ...usageMap }, mode);

        if (result.ruleUsageMap) {
            Object.entries(result.ruleUsageMap).forEach(([ruleId, amount]) => {
                usageMap[ruleId] = (usageMap[ruleId] || 0) + amount;
            });
        }

        return result;
    });
}
