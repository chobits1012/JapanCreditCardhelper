import { isWithinInterval, parseISO } from 'date-fns';
import type { CreditCard, RewardProgram, Transaction } from '../types';

export interface CalculationResult {
    cardId: string;
    totalReward: number;
    totalRate: number; // e.g. 0.035 for 3.5%
    breakdown: {
        ruleId: string; // Add this
        ruleName: string;
        amount: number;
        rate: number;
        capped: boolean; // true if hit cap
        capLimit?: number; // defined if rule has a cap
    }[];
    warnings: string[];
    transactionFee: number;
    netReward: number;
}

/**
 * Find the active program for a card based on transaction date
 */
export function getActiveProgram(card: CreditCard, date: string): RewardProgram | undefined {
    const targetDate = parseISO(date);
    return card.programs.find(p =>
        isWithinInterval(targetDate, {
            start: parseISO(p.startDate),
            end: parseISO(p.endDate)
        })
    );
}

/**
 * Calculate reward for a single transaction on a specific card
 * usageMap: A map of ruleId -> accumulated reward amount used so far in this period
 */
export function calculateReward(
    card: CreditCard,
    transaction: Transaction,
    usageMap: Record<string, number> = {},
    mode: 'travel' | 'daily' = 'travel' // Default to travel to be safe
): CalculationResult {
    const result: CalculationResult = {
        cardId: card.id,
        totalReward: 0,
        totalRate: 0,
        breakdown: [],
        warnings: [],
        transactionFee: 0,
        netReward: 0,
    };

    let program = getActiveProgram(card, transaction.date);

    // Fallback if no active program found
    if (!program) {
        if (card.programs.length > 0) {
            const target = new Date(transaction.date);

            // 1. Try finding expired program (Latest one)
            const sortedByEnd = [...card.programs].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
            const latestProgram = sortedByEnd[0];

            if (target > new Date(latestProgram.endDate)) {
                program = latestProgram;
                result.warnings.push(`此卡權益已過期 (有效期至 ${latestProgram.endDate} - 可能影響回饋準確度)`);
            }

            // 2. Try finding future program (Earliest one) if still no program found
            if (!program) {
                const sortedByStart = [...card.programs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                const earliestProgram = sortedByStart[0];

                if (target < new Date(earliestProgram.startDate)) {
                    program = earliestProgram;
                    result.warnings.push(`此權益尚未開始 (開始於 ${earliestProgram.startDate} - 可能影響回饋準確度)`);
                }
            }
        }
    }

    if (!program) {
        result.warnings.push('找不到此日期的適用權益');
        return result;
    }

    // 0. Normalize to TWD for Reward Calculation
    // Reward points are usually 1 Point = 1 TWD value. 
    // Caps are in TWD. So we must calculate everything based on TWD value.
    const exchangeRate = transaction.currency === 'JPY' ? transaction.exchangeRate : 1;
    const amountTWD = Math.floor(transaction.amount * exchangeRate);

    // 1. Base Reward
    // Select base rate based on mode
    const applicableBaseRate = mode === 'travel'
        ? (program.baseRateOverseas ?? 0) // Fallback 0 is unlikely due to migration
        : (program.baseRateDomestic ?? 0);

    const baseReward = Math.floor(amountTWD * applicableBaseRate);
    result.breakdown.push({
        ruleId: 'base',
        ruleName: mode === 'travel' ? '海外基礎回饋' : '國內基礎回饋',
        amount: baseReward,
        rate: applicableBaseRate,
        capped: false
    });
    result.totalReward += baseReward;

    // 2. Bonus Rules
    for (const rule of program.bonusRules) {
        // CHECK 0: Individual Rule Date Validation (if specified)
        // If rule has its own startDate/endDate, check if transaction falls within that period
        if (rule.startDate || rule.endDate) {
            const txDate = parseISO(transaction.date);

            if (rule.startDate && txDate < parseISO(rule.startDate)) {
                continue; // Rule not yet active
            }

            if (rule.endDate && txDate > parseISO(rule.endDate)) {
                continue; // Rule has expired
            }
        }

        // Filter by Region Strategy
        // If mode is 'travel' -> Allow 'global' OR 'japan'
        // If mode is 'daily'  -> Allow 'global' OR 'taiwan'
        const ruleRegion = rule.region || 'japan'; // Default to japan for legacy data
        const allowedRegions = mode === 'travel' ? ['global', 'japan'] : ['global', 'taiwan'];

        if (!allowedRegions.includes(ruleRegion)) {
            continue;
        }

        // CHECK 1: Category Match
        // If rule.categories is undefined or empty array => Match ALL categories
        const isCategoryMatch = (!rule.categories || rule.categories.length === 0)
            ? true
            : rule.categories.includes(transaction.category);

        // CHECK 2: Merchant Match
        // If specificMerchants is undefined or empty array => Match ALL merchants
        const isMerchantMatch = (!rule.specificMerchants || rule.specificMerchants.length === 0)
            ? true
            : rule.specificMerchants.some(m => transaction.merchantName.includes(m));

        // CHECK 3: Payment Method Match
        // If paymentMethods is undefined or empty array => Match ALL methods
        const isPaymentMatch = (!rule.paymentMethods || rule.paymentMethods.length === 0)
            ? true
            : rule.paymentMethods.includes(transaction.paymentMethod);

        // CHECK 4: Minimum Amount Match (in TWD)
        // minAmount is stored in TWD, so we need to compare with TWD amount
        const isAmountMatch = rule.minAmount
            ? amountTWD >= rule.minAmount
            : true;

        if (isCategoryMatch && isMerchantMatch && isPaymentMatch && isAmountMatch) {
            // Calculate potential bonus
            let bonusAmount = Math.floor(amountTWD * rule.rate);
            let isCapped = false;

            // Check Cap
            if (rule.capAmount !== undefined) {
                const used = usageMap[rule.id] || 0;
                const remaining = Math.max(0, rule.capAmount - used);

                if (bonusAmount > remaining) {
                    bonusAmount = remaining;
                    isCapped = true;
                    result.warnings.push(`Rule "${rule.name}" hit cap.`);
                }
            }

            if (bonusAmount > 0 || isCapped) {
                result.breakdown.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    amount: bonusAmount,
                    rate: rule.rate,
                    capped: isCapped,
                    capLimit: rule.capAmount
                });
                result.totalReward += bonusAmount;
            }
        }
    }

    // Final totals
    // Total Rate = Total Reward (TWD) / Original Spending Amount (Input Currency) ???
    // No, Total Rate usually means "Effective Return Rate".
    // If I spend 10000 JPY (2200 TWD) and get 66 TWD reward.
    // Return rate = 66 / 2200 = 3%. 
    // NOT 66 / 10000 = 0.66%.
    result.totalRate = amountTWD > 0 ? result.totalReward / amountTWD : 0;

    // Calculate Transaction Fee (1.5% for foreign currency)
    // Mode Logic:
    // Travel Mode: ALWAYS charge fee (conservative assumption for travel)
    // Daily Mode: Charge fee ONLY if currency is not TWD

    let shouldChargeFee = false;

    if (mode === 'travel') {
        shouldChargeFee = true;
    } else {
        shouldChargeFee = transaction.currency !== 'TWD';
    }

    if (shouldChargeFee) {
        const feeRate = (card.foreignTxFee ?? 1.5) / 100; // default 1.5%
        result.transactionFee = Math.floor(amountTWD * feeRate);
    } else {
        result.transactionFee = 0;
    }

    result.netReward = result.totalReward - result.transactionFee;

    return result;
}
