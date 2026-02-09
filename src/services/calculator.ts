import { isWithinInterval, parseISO } from 'date-fns';
import type { CreditCard, RewardProgram, Transaction } from '../types';
import { useStore } from '../store/useStore';

export interface CalculationResult {
    cardId: string;
    totalReward: number;
    totalRate: number; // e.g. 0.035 for 3.5%
    breakdown: {
        ruleId: string;
        ruleName: string;
        amount: number; // Reward value (always TWD)
        rate: number;
        capped: boolean; // true if hit cap
        capLimit?: number; // defined if rule has a cap
        usageAmount?: number; // Usage amount in rule's currency
        usageCurrency?: 'TWD' | 'JPY'; // Currency for usage tracking
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
 * Calculate cumulative spending for a specific rule within its active period (excluding current transaction)
 * Used for cumulative threshold rules (e.g., "spend 100k JPY total to trigger bonus")
 * 
 * @param currentTxId - Current transaction ID to exclude from calculation
 * @param cardId - Card ID to filter transactions for
 * @param startDate - Start of the calculation period
 * @param endDate - End of the calculation period
 * @param currency - Currency to sum in ('TWD' or 'JPY')
 * @returns Total spending in the specified currency
 */
export function calculateCumulativeSpending(
    currentTxId: string,
    cardId: string,
    startDate: string,
    endDate: string,
    currency: 'TWD' | 'JPY'
): number {
    const { transactions } = useStore.getState();
    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);

    return transactions
        .filter(tx => tx.id !== currentTxId) // Exclude current transaction
        .filter(tx => tx.cardId === cardId) // Only count transactions for this card
        .filter(tx => {
            const txDate = parseISO(tx.date);
            return isWithinInterval(txDate, { start: startDateObj, end: endDateObj });
        })
        .reduce((sum, tx) => {
            // Convert to target currency for summation
            const amount = currency === 'JPY'
                ? (tx.currency === 'JPY' ? tx.amount : Math.floor(tx.amount / tx.exchangeRate))
                : (tx.currency === 'TWD' ? tx.amount : Math.floor(tx.amount * tx.exchangeRate));
            return sum + amount;
        }, 0);
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

        // CHECK 4: Minimum Amount Match (Currency-Aware & Cumulative Support)
        // Compare transaction amount with rule's minimum threshold
        // - If minAmountCurrency is 'JPY': Convert TWD back to JPY for comparison
        // - If minAmountCurrency is 'TWD' or undefined: Direct TWD comparison (default)
        // - If minAmountType is 'cumulative': Check total spending across period
        let isAmountMatch = true;
        if (rule.minAmount) {
            const thresholdType = rule.minAmountType || 'per_transaction';
            const thresholdCurrency = rule.minAmountCurrency || 'TWD';

            if (thresholdType === 'per_transaction') {
                // Original logic: Single transaction threshold
                if (thresholdCurrency === 'JPY') {
                    const amountJPY = Math.floor(transaction.amount);
                    isAmountMatch = amountJPY >= rule.minAmount;
                } else {
                    isAmountMatch = amountTWD >= rule.minAmount;
                }
            } else {
                // New logic: Cumulative threshold
                // Calculate accumulated spending (excluding this transaction)
                const accumulated = calculateCumulativeSpending(
                    transaction.id,
                    card.id,
                    program.startDate,
                    program.endDate,
                    thresholdCurrency
                );

                // Get current transaction amount in threshold currency
                const currentAmount = thresholdCurrency === 'JPY'
                    ? Math.floor(transaction.amount)
                    : amountTWD;

                // Trigger bonus only if accumulated + current >= threshold
                isAmountMatch = (accumulated + currentAmount) >= rule.minAmount;
            }
        }

        if (isCategoryMatch && isMerchantMatch && isPaymentMatch && isAmountMatch) {
            // Calculate potential bonus
            let bonusAmount;

            // 如果交易金額為 0，不計算任何回饋
            if (amountTWD === 0) {
                bonusAmount = 0;
            } else {
                const rewardType = rule.rewardType || 'percentage';

                if (rewardType === 'fixed') {
                    // 固定金額回饋（累積達標一次性獎勵）
                    const alreadyGiven = usageMap[rule.id] || 0;
                    if (alreadyGiven > 0) {
                        // 已發放過，不再發放
                        bonusAmount = 0;
                    } else if (rule.fixedRewardAmount) {
                        // 將固定回饋金額轉換為 TWD
                        const rewardCurrency = rule.fixedRewardCurrency || 'JPY';
                        bonusAmount = rewardCurrency === 'JPY'
                            ? Math.floor(rule.fixedRewardAmount * exchangeRate)
                            : rule.fixedRewardAmount;
                    } else {
                        bonusAmount = 0;
                    }
                } else if (rule.minAmountType === 'cumulative') {
                    // 累積型百分比回饋
                    const thresholdCurrency = rule.minAmountCurrency || 'TWD';

                    // Get accumulated spending (excluding current transaction)
                    const accumulated = calculateCumulativeSpending(
                        transaction.id,
                        card.id,
                        program.startDate,
                        program.endDate,
                        thresholdCurrency
                    );

                    // Get current transaction amount in threshold currency
                    const currentAmount = thresholdCurrency === 'JPY'
                        ? Math.floor(transaction.amount)
                        : amountTWD;

                    // 如果當前交易金額為 0，累積型規則不應計算任何回饋
                    if (currentAmount === 0) {
                        bonusAmount = 0;
                    } else {
                        // Total accumulated spending (including current transaction)
                        const accumulatedTotal = accumulated + currentAmount;

                        // Convert accumulated total to TWD for reward calculation
                        const accumulatedTotalTWD = thresholdCurrency === 'JPY'
                            ? Math.floor(accumulatedTotal * exchangeRate)
                            : accumulatedTotal;

                        // Calculate total expected reward from accumulated spending
                        const totalExpectedReward = Math.floor(accumulatedTotalTWD * rule.rate);

                        // Subtract already-given rewards to get this transaction's bonus
                        const alreadyGiven = usageMap[rule.id] || 0;
                        bonusAmount = Math.max(0, totalExpectedReward - alreadyGiven);
                    }
                } else {
                    // Per-transaction bonus: Use current transaction amount (original logic)
                    bonusAmount = Math.floor(amountTWD * rule.rate);
                }
            }

            let isCapped = false;

            // Check Cap (Currency-Aware)
            // Now that we track usage in original currency, we need to compare in the same currency
            if (rule.capAmount !== undefined) {
                const capCurrency = rule.capAmountCurrency || 'TWD';
                const used = usageMap[rule.id] || 0;

                // Compare in the rule's original currency
                const remaining = Math.max(0, rule.capAmount - used);

                // Convert remaining to TWD for comparison with bonusAmount
                const remainingTWD = capCurrency === 'JPY'
                    ? Math.floor(remaining * exchangeRate)
                    : remaining;

                if (bonusAmount > remainingTWD) {
                    bonusAmount = remainingTWD;
                    isCapped = true;
                    result.warnings.push(`Rule "${rule.name}" hit cap.`);
                }
            }


            if (bonusAmount > 0 || isCapped) {
                // Calculate displayed cap limit (in TWD for consistency)
                const displayCapLimit = rule.capAmount !== undefined
                    ? (rule.capAmountCurrency === 'JPY'
                        ? Math.floor(rule.capAmount * exchangeRate)
                        : rule.capAmount)
                    : undefined;

                // Calculate usage in rule's original currency
                const usageCurrency = rule.capAmountCurrency || 'TWD';
                const usageAmount = usageCurrency === 'JPY'
                    ? Math.floor(bonusAmount / exchangeRate)
                    : bonusAmount;

                result.breakdown.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    amount: bonusAmount,
                    rate: rule.rate,
                    capped: isCapped,
                    capLimit: displayCapLimit,
                    usageAmount,
                    usageCurrency
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

/**
 * Recalculate a transaction based on current card rules
 */
export function recalculateTransaction(
    card: CreditCard,
    transaction: Omit<Transaction, 'calculatedRewardAmount' | 'appliedRuleNames' | 'ruleUsageMap'>,
    usageMap: Record<string, number> = {},
    mode: 'travel' | 'daily' = 'travel'
): Transaction {
    const result = calculateReward(card, transaction as Transaction, usageMap, mode);

    // Filter breakdown to get ruleUsageMap
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
        calculatedRewardAmount: result.totalReward,
        appliedRuleNames: result.breakdown.map(b => b.ruleName),
        ruleUsageMap
    } as Transaction;
}

/**
 * Recalculate all transactions for a specific card.
 * This is needed when cumulative thresholds are involved and one transaction is modified.
 * Transactions are recalculated in date order to ensure cumulative totals are correct.
 * 
 * @param card - The card to recalculate transactions for
 * @param transactions - All transactions (will be filtered by cardId)
 * @param mode - Calculation mode
 * @returns Updated transactions array (only for this card)
 */
export function recalculateCardTransactions(
    card: CreditCard,
    transactions: Transaction[],
    mode: 'travel' | 'daily' = 'travel'
): Transaction[] {
    // Filter and sort transactions by date
    const cardTransactions = transactions
        .filter(tx => tx.cardId === card.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Recalculate each transaction in order
    // The usageMap is built incrementally as we process each transaction
    const usageMap: Record<string, number> = {};

    return cardTransactions.map(tx => {
        // Create base transaction data
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

        // Recalculate this transaction with current usageMap
        const result = recalculateTransaction(card, baseTx, { ...usageMap }, mode);

        // Update usageMap with this transaction's contribution
        if (result.ruleUsageMap) {
            Object.entries(result.ruleUsageMap).forEach(([ruleId, amount]) => {
                usageMap[ruleId] = (usageMap[ruleId] || 0) + amount;
            });
        }

        return result;
    });
}
