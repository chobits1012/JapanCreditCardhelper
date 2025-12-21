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
    usageMap: Record<string, number> = {}
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

    const program = getActiveProgram(card, transaction.date);
    if (!program) {
        // Check for specific expiry or future start to give better warnings
        if (card.programs.length > 0) {
            // Sort by endDate to find the latest
            const sortedByEnd = [...card.programs].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
            const latestProgram = sortedByEnd[0];
            const target = new Date(transaction.date);

            if (target > new Date(latestProgram.endDate)) {
                result.warnings.push(`此卡權益已過期 (有效期至 ${latestProgram.endDate})`);
                return result;
            }

            // Sort by startDate to find earliest
            const sortedByStart = [...card.programs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            const earliestProgram = sortedByStart[0];

            if (target < new Date(earliestProgram.startDate)) {
                result.warnings.push(`此權益尚未開始 (開始於 ${earliestProgram.startDate})`);
                return result;
            }
        }

        result.warnings.push('找不到此日期的適用權益');
        return result;
    }

    // 0. Normalize to TWD for Reward Calculation
    // Reward points are usually 1 Point = 1 TWD value. 
    // Caps are in TWD. So we must calculate everything based on TWD value.
    const exchangeRate = transaction.currency === 'JPY' ? transaction.exchangeRate : 1;
    const amountTWD = Math.floor(transaction.amount * exchangeRate);

    // 1. Base Reward
    // Usually base reward has no cap or very high cap, we assume no cap for MVP base logic unless specified
    const baseReward = Math.floor(amountTWD * program.baseRate);
    result.breakdown.push({
        ruleId: 'base',
        ruleName: 'Base Reward',
        amount: baseReward,
        rate: program.baseRate,
        capped: false
    });
    result.totalReward += baseReward;

    // 2. Bonus Rules
    for (const rule of program.bonusRules) {
        const isCategoryMatch = rule.categories.includes(transaction.category);
        const isMerchantMatch = rule.specificMerchants
            ? rule.specificMerchants.some(m => transaction.merchantName.includes(m))
            : true; // If no specific merchants listed, it's a category-wide rule (or matches per category logic)

        // Refined logic: If specificMerchants is defined, it MUST match. 
        // If not defined, we rely on Category. 
        // However, usually "Category Match" OR "Merchant Match" depends on rule.
        // Let's assume: matches Category AND matches Merchant (if specified).

        // Also check Payment Method
        const isPaymentMatch = rule.paymentMethods
            ? rule.paymentMethods.includes(transaction.paymentMethod)
            : true;

        // Check Min Amount
        const isAmountMatch = rule.minAmount
            ? transaction.amount >= rule.minAmount
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
    // Fee is calculated on the TWD amount on the statement.
    if (transaction.currency !== 'TWD') {
        const feeRate = (card.foreignTxFee ?? 1.5) / 100; // default 1.5%
        result.transactionFee = Math.floor(amountTWD * feeRate);
    } else {
        result.transactionFee = 0;
    }

    result.netReward = result.totalReward - result.transactionFee;

    return result;
}
