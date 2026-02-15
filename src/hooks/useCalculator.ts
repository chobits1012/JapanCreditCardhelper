/**
 * useCalculator - 橋接 Hook
 * 
 * 提供新版 RewardCalculator 的 React Hook 介面。
 * 內部整合 Store，自動處理累積消費計算。
 * 
 * [Feature Flag]: ?use_legacy=true
 * 允許透過 URL 參數強制切換回舊版計算核心 (src/services/calculator.ts)
 */

import { useMemo, useCallback } from 'react';
import { RewardCalculator, createCalculatorWithStore, type CalculationResult, type CalculationMode } from '../core/calculator';
import { calculateReward as calculateRewardLegacy } from '../services/calculator'; // Legacy Core
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
     * 重新計算交易 (用於儲存或更新)
     * 這是為了統一 "試算" 與 "儲存" 的邏輯來源
     */
    recalculate: (
        card: CreditCard,
        transaction: Transaction,
        usageMap?: Record<string, number>,
        mode?: CalculationMode
    ) => Transaction;

    /**
     * 取得指定卡片的規則使用量
     */
    getRuleUsage: (cardId: string) => Record<string, number>;

    /**
     * 目前是否使用舊版核心
     */
    isLegacyMode: boolean;
}

export function useCalculator(): UseCalculatorReturn {
    const transactions = useStore(state => state.transactions);

    // Feature Flag: Check URL for ?use_legacy=true
    const isLegacyMode = useMemo(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('use_legacy') === 'true';
        }
        return false;
    }, []);

    // 建立帶有 Store 整合的計算器 (New Core)
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
        if (isLegacyMode) {
            // Legacy Core Output needs simple mapping to match New Core Interface
            const legacyResult = calculateRewardLegacy(card, transaction, usageMap, mode);
            return {
                ...legacyResult,
                programId: null, // Legacy doesn't return programId
                breakdown: legacyResult.breakdown.map(b => ({
                    ...b,
                    // Legacy breakdown matches new breakdown structure mostly, 
                    // ensure compatibility if types differ slightly
                }))
            } as CalculationResult;
        }

        // New Core
        return calculator.calculate(card, transaction, usageMap, mode);
    }, [calculator, isLegacyMode]);

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

        return calculate(card, tempTransaction, usageMap, mode);
    }, [calculate, transactions]);

    // 重新計算交易 (用於儲存)
    const recalculate = useCallback((
        card: CreditCard,
        transaction: Transaction,
        usageMap: Record<string, number> = {},
        mode: CalculationMode = 'travel'
    ): Transaction => {
        // 先計算結果
        const result = calculate(card, transaction, usageMap, mode);

        // 產生 ruleUsageMap for Transaction
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
            programId: result.programId || card.programs[0]?.id || '', // Fallback for legacy
            calculatedRewardAmount: result.totalReward,
            appliedRuleNames: result.breakdown.map(b => b.ruleName),
            ruleUsageMap
        };
    }, [calculate]);

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
        recalculate,
        getRuleUsage,
        isLegacyMode
    };
}

/**
 * 獨立函數版本（不使用 Hook，用於 Store 或其他非 React 場景）
 */
export function createCalculator(): RewardCalculator {
    const { transactions } = useStore.getState();
    return createCalculatorWithStore(() => transactions);
}
