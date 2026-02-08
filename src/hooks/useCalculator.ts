/**
 * useCalculator - 橋接 Hook
 * 
 * 提供新版 RewardCalculator 的 React Hook 介面。
 * 內部整合 Store，自動處理累積消費計算。
 */

import { useMemo, useCallback } from 'react';
import { RewardCalculator, createCalculatorWithStore, type CalculationResult, type CalculationMode } from '../core/calculator';
import { useStore } from '../store/useStore';
import type { CreditCard, Transaction } from '../types';

export interface UseCalculatorReturn {
    /**
     * 計算單筆交易的回饋
     */
    calculate: (
        card: CreditCard,
        transaction: Transaction,
        usageMap?: Record<string, number>,
        mode?: CalculationMode
    ) => CalculationResult;

    /**
     * 計算試算交易（不需要完整 Transaction 物件）
     */
    calculateSimulation: (
        card: CreditCard,
        amount: number,
        currency: 'TWD' | 'JPY',
        exchangeRate: number,
        category: string,
        mode?: CalculationMode
    ) => CalculationResult;

    /**
     * 取得指定卡片的規則使用量
     */
    getRuleUsage: (cardId: string) => Record<string, number>;
}

export function useCalculator(): UseCalculatorReturn {
    const transactions = useStore(state => state.transactions);

    // 建立帶有 Store 整合的計算器
    const calculator = useMemo(() => {
        return createCalculatorWithStore(() => transactions);
    }, [transactions]);

    // 計算完整交易
    const calculate = useCallback((
        card: CreditCard,
        transaction: Transaction,
        usageMap: Record<string, number> = {},
        mode: CalculationMode = 'travel'
    ): CalculationResult => {
        return calculator.calculate(card, transaction, usageMap, mode);
    }, [calculator]);

    // 計算試算（建立臨時 Transaction）
    const calculateSimulation = useCallback((
        card: CreditCard,
        amount: number,
        currency: 'TWD' | 'JPY',
        exchangeRate: number,
        category: string,
        mode: CalculationMode = 'travel'
    ): CalculationResult => {
        const tempTransaction: Transaction = {
            id: `simulation-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount,
            currency,
            exchangeRate,
            merchantName: '試算',
            category: category as Transaction['category'],
            paymentMethod: '刷卡',
            cardId: card.id,
            programId: card.programs[0]?.id || '',
            calculatedRewardAmount: 0,
            appliedRuleNames: [],
        };

        // 取得使用量
        const usageMap = getRuleUsageInternal(card.id, transactions);

        return calculator.calculate(card, tempTransaction, usageMap, mode);
    }, [calculator, transactions]);

    // 內部函數：計算規則使用量
    const getRuleUsageInternal = (
        cardId: string,
        txList: Transaction[]
    ): Record<string, number> => {
        const usageMap: Record<string, number> = {};

        txList
            .filter(tx => tx.cardId === cardId)
            .forEach(tx => {
                if (tx.ruleUsageMap) {
                    Object.entries(tx.ruleUsageMap).forEach(([ruleId, usage]) => {
                        usageMap[ruleId] = (usageMap[ruleId] || 0) + usage;
                    });
                }
            });

        return usageMap;
    };

    // 取得規則使用量
    const getRuleUsage = useCallback((cardId: string): Record<string, number> => {
        return getRuleUsageInternal(cardId, transactions);
    }, [transactions]);

    return {
        calculate,
        calculateSimulation,
        getRuleUsage,
    };
}

/**
 * 獨立函數版本（不使用 Hook，用於 Store 或其他非 React 場景）
 */
export function createCalculator(): RewardCalculator {
    const { transactions } = useStore.getState();
    return createCalculatorWithStore(() => transactions);
}
