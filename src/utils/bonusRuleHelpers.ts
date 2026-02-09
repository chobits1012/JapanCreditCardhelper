/**
 * BonusRule State Helpers
 * 
 * Utility functions for converting between domain BonusRule and form state (BonusRuleState).
 * This file centralizes the conversion logic that was previously duplicated in CardDataForm.tsx.
 */

import type { BonusRule, MerchantCategory } from '../types';

/**
 * Form state representation of a BonusRule.
 * Uses string values for form inputs (rate, amounts) and adds UI-specific fields.
 */
export interface BonusRuleState {
    id: string;
    name: string;

    // === 回饋類型 ===
    rewardType: 'percentage' | 'fixed';     // 百分比回饋 或 固定金額回饋

    // === 百分比回饋參數 ===
    rate: string;                           // String for form input (e.g., "3" for 3%)
    capAmount: string;                      // String for form input
    capAmountCurrency: 'TWD' | 'JPY';
    capPeriod: 'monthly' | 'campaign';

    // === 固定金額回饋參數 ===
    fixedRewardAmount: string;              // 固定回饋金額（表單用字串）
    fixedRewardCurrency: 'TWD' | 'JPY';     // 固定回饋幣別

    // === 其他欄位 ===
    checkJapan: boolean;                    // Checkbox for "includes all Japan channels"
    requiresRegistration: boolean;
    specificMerchants: string;              // Comma-separated string for form input
    region: 'global' | 'japan' | 'taiwan';
    paymentMethods: string[];               // Selected payment methods
    minAmount: string;                      // String for form input
    minAmountCurrency: 'TWD' | 'JPY';
    minAmountType: 'per_transaction' | 'cumulative'; // Threshold type
    startDate: string;                      // Individual rule start date (ISO)
    endDate: string;                        // Individual rule end date (ISO)
    createdAt: number;                      // Timestamp for display ordering (UI only)
}

/**
 * Convert a domain BonusRule to form state (BonusRuleState).
 * 
 * @param rule - The domain BonusRule object
 * @param displayIndex - Index used for sorting (createdAt), typically the array index
 * @returns BonusRuleState ready for form binding
 */
export function createBonusRuleStateFromRule(rule: BonusRule, displayIndex: number): BonusRuleState {
    return {
        id: rule.id,
        name: rule.name,
        rewardType: rule.rewardType || 'percentage',
        rate: (rule.rate * 100).toString(),
        capAmount: rule.capAmount ? rule.capAmount.toString() : '',
        capAmountCurrency: rule.capAmountCurrency || 'TWD',
        capPeriod: (rule.capPeriod as 'monthly' | 'campaign') || 'monthly',
        fixedRewardAmount: rule.fixedRewardAmount ? rule.fixedRewardAmount.toString() : '',
        fixedRewardCurrency: rule.fixedRewardCurrency || 'JPY',
        checkJapan: rule.categories.includes('general_japan'),
        region: rule.region || 'japan',
        requiresRegistration: rule.requiresRegistration || false,
        specificMerchants: rule.specificMerchants ? rule.specificMerchants.join(', ') : '',
        paymentMethods: rule.paymentMethods || [],
        minAmount: rule.minAmount ? rule.minAmount.toString() : '',
        minAmountCurrency: rule.minAmountCurrency || 'TWD',
        minAmountType: rule.minAmountType || 'per_transaction',
        startDate: rule.startDate || '',
        endDate: rule.endDate || '',
        createdAt: displayIndex,
    };
}

/**
 * Create an empty BonusRuleState for adding a new rule.
 * Uses Date.now() for createdAt to ensure it sorts correctly when new rules are added at the top.
 * 
 * @returns A new BonusRuleState with default values
 */
export function createEmptyBonusRuleState(): BonusRuleState {
    return {
        id: crypto.randomUUID(),
        name: '新加碼活動',
        rewardType: 'percentage',
        rate: '3',
        capAmount: '',
        capAmountCurrency: 'TWD',
        capPeriod: 'monthly',
        fixedRewardAmount: '',
        fixedRewardCurrency: 'JPY',
        checkJapan: false,
        requiresRegistration: false,
        specificMerchants: '',
        region: 'japan',
        paymentMethods: [],
        minAmount: '',
        minAmountCurrency: 'TWD',
        minAmountType: 'per_transaction',
        startDate: '',
        endDate: '',
        createdAt: Date.now(),
    };
}

/**
 * Convert form state (BonusRuleState) back to domain BonusRule format.
 * 
 * @param ruleState - The form state to convert
 * @returns A BonusRule object ready for persistence
 */
export function convertToDomainBonusRule(ruleState: BonusRuleState): BonusRule {
    const isFixed = ruleState.rewardType === 'fixed';

    return {
        id: ruleState.id,
        name: ruleState.name,
        rewardType: ruleState.rewardType,
        rate: isFixed ? 0 : parseFloat(ruleState.rate) / 100, // 固定金額類型不使用 rate，但欄位必須有值
        fixedRewardAmount: isFixed && ruleState.fixedRewardAmount
            ? parseInt(ruleState.fixedRewardAmount)
            : undefined,
        fixedRewardCurrency: isFixed && ruleState.fixedRewardAmount
            ? ruleState.fixedRewardCurrency
            : undefined,
        categories: ruleState.checkJapan
            ? ['general_japan', 'drugstore', 'electronics', 'department', 'convenience'] as MerchantCategory[]
            : [],
        capAmount: !isFixed && ruleState.capAmount ? parseInt(ruleState.capAmount) : undefined,
        capAmountCurrency: !isFixed && ruleState.capAmount ? ruleState.capAmountCurrency : undefined,
        capPeriod: ruleState.capPeriod,
        requiresRegistration: ruleState.requiresRegistration,
        specificMerchants: ruleState.specificMerchants
            ? ruleState.specificMerchants.split(/[,，]/).map(s => s.trim()).filter(Boolean)
            : undefined,
        region: ruleState.region,
        paymentMethods: ruleState.paymentMethods.length > 0 ? ruleState.paymentMethods : undefined,
        minAmount: ruleState.minAmount ? parseInt(ruleState.minAmount) : undefined,
        minAmountCurrency: ruleState.minAmount ? ruleState.minAmountCurrency : undefined,
        minAmountType: ruleState.minAmount ? ruleState.minAmountType : undefined,
        startDate: ruleState.startDate || undefined,
        endDate: ruleState.endDate || undefined,
    };
}

/**
 * Convert an array of BonusRules to BonusRuleStates.
 * 
 * @param rules - Array of domain BonusRule objects
 * @returns Array of BonusRuleState objects for form binding
 */
export function createBonusRuleStatesFromRules(rules: BonusRule[]): BonusRuleState[] {
    return rules.map((rule, index) => createBonusRuleStateFromRule(rule, index));
}

/**
 * Convert an array of BonusRuleStates back to domain format, sorted by createdAt.
 * 
 * @param ruleStates - Array of form states
 * @returns Array of BonusRule objects, sorted chronologically
 */
export function convertToDomainBonusRules(ruleStates: BonusRuleState[]): BonusRule[] {
    // Sort by createdAt to maintain chronological order when saving
    const sorted = [...ruleStates].sort((a, b) => a.createdAt - b.createdAt);
    return sorted.map(convertToDomainBonusRule);
}
