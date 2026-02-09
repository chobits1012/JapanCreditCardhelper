/**
 * RewardCalculator - 重構版計算器
 * 
 * 整合 ProgramMatcher，提供更乾淨的計算介面。
 * 此版本與現有 calculator.ts 並行運作，驗證後再切換。
 */

import { isWithinInterval, parseISO } from 'date-fns';
import type { CreditCard, RewardProgram, BonusRule, Transaction } from '../../types';
import { ProgramMatcher } from './ProgramMatcher';

export interface CalculationResult {
    cardId: string;
    programId: string | null;
    totalReward: number;
    totalRate: number;
    breakdown: RuleBreakdown[];
    warnings: string[];
    transactionFee: number;
    netReward: number;
}

export interface RuleBreakdown {
    ruleId: string;
    ruleName: string;
    amount: number;
    rate: number;
    capped: boolean;
    capLimit?: number;
    usageAmount?: number;
    usageCurrency?: 'TWD' | 'JPY';
}

export type CalculationMode = 'travel' | 'daily';

/**
 * 累積消費計算器（獨立函數，可被外部注入以便測試）
 */
export type CumulativeSpendingCalculator = (
    currentTxId: string,
    startDate: string,
    endDate: string,
    currency: 'TWD' | 'JPY'
) => number;

export class RewardCalculator {
    private cumulativeCalculator?: CumulativeSpendingCalculator;

    constructor(options?: {
        cumulativeCalculator?: CumulativeSpendingCalculator;
    }) {
        this.cumulativeCalculator = options?.cumulativeCalculator;
    }

    /**
     * 計算單筆交易的回饋
     */
    calculate(
        card: CreditCard,
        transaction: Transaction,
        usageMap: Record<string, number> = {},
        mode: CalculationMode = 'travel'
    ): CalculationResult {
        const result: CalculationResult = {
            cardId: card.id,
            programId: null,
            totalReward: 0,
            totalRate: 0,
            breakdown: [],
            warnings: [],
            transactionFee: 0,
            netReward: 0,
        };

        // 1. 使用 ProgramMatcher 找到適用的 Program
        let program = ProgramMatcher.findApplicableProgram(card, transaction.date);

        // Fallback 邏輯：若無適用 Program，嘗試使用最近的
        if (!program && card.programs.length > 0) {
            program = this.findFallbackProgram(card, transaction.date, result);
        }

        if (!program) {
            result.warnings.push('找不到此日期的適用權益');
            return result;
        }

        result.programId = program.id;

        // 2. 貨幣轉換
        const exchangeRate = transaction.currency === 'JPY' ? transaction.exchangeRate : 1;
        const amountTWD = Math.floor(transaction.amount * exchangeRate);

        // 3. 計算基礎回饋
        this.calculateBaseReward(program, amountTWD, mode, result);

        // 4. 計算加碼規則
        this.calculateBonusRules(
            program,
            transaction,
            amountTWD,
            exchangeRate,
            usageMap,
            mode,
            result
        );

        // 5. 計算總回饋率
        result.totalRate = amountTWD > 0 ? result.totalReward / amountTWD : 0;

        // 6. 計算手續費
        this.calculateTransactionFee(card, transaction, amountTWD, mode, result);

        // 7. 計算淨回饋
        result.netReward = result.totalReward - result.transactionFee;

        return result;
    }

    /**
     * 找到 Fallback Program（過期或未來的）
     */
    private findFallbackProgram(
        card: CreditCard,
        txDate: string,
        result: CalculationResult
    ): RewardProgram | null {
        const target = new Date(txDate);

        // 1. 嘗試找過期的 Program（最新的那個）
        const sortedByEnd = [...card.programs].sort(
            (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        );
        const latestProgram = sortedByEnd[0];

        if (target > new Date(latestProgram.endDate)) {
            result.warnings.push(
                `此卡權益已過期 (有效期至 ${latestProgram.endDate} - 可能影響回饋準確度)`
            );
            return latestProgram;
        }

        // 2. 嘗試找未來的 Program（最早的那個）
        const sortedByStart = [...card.programs].sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        const earliestProgram = sortedByStart[0];

        if (target < new Date(earliestProgram.startDate)) {
            result.warnings.push(
                `此權益尚未開始 (開始於 ${earliestProgram.startDate} - 可能影響回饋準確度)`
            );
            return earliestProgram;
        }

        return null;
    }

    /**
     * 計算基礎回饋
     */
    private calculateBaseReward(
        program: RewardProgram,
        amountTWD: number,
        mode: CalculationMode,
        result: CalculationResult
    ): void {
        const applicableBaseRate = mode === 'travel'
            ? (program.baseRateOverseas ?? 0)
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
    }

    /**
     * 計算加碼規則
     */
    private calculateBonusRules(
        program: RewardProgram,
        transaction: Transaction,
        amountTWD: number,
        exchangeRate: number,
        usageMap: Record<string, number>,
        mode: CalculationMode,
        result: CalculationResult
    ): void {
        for (const rule of program.bonusRules) {
            // 檢查規則是否適用
            if (!this.isRuleApplicable(rule, transaction, amountTWD, program, mode)) {
                continue;
            }

            // 計算加碼金額
            let bonusAmount = this.calculateBonusAmount(
                rule,
                transaction,
                amountTWD,
                exchangeRate,
                program,
                usageMap
            );

            // 檢查上限
            const { cappedAmount, isCapped } = this.applyCap(
                rule,
                bonusAmount,
                exchangeRate,
                usageMap,
                result
            );
            bonusAmount = cappedAmount;

            if (bonusAmount > 0 || isCapped) {
                this.addBonusToBreakdown(rule, bonusAmount, exchangeRate, isCapped, result);
            }
        }
    }

    /**
     * 檢查規則是否適用
     */
    private isRuleApplicable(
        rule: BonusRule,
        transaction: Transaction,
        amountTWD: number,
        program: RewardProgram,
        mode: CalculationMode
    ): boolean {
        // 日期檢查
        if (rule.startDate || rule.endDate) {
            const txDate = parseISO(transaction.date);
            if (rule.startDate && txDate < parseISO(rule.startDate)) return false;
            if (rule.endDate && txDate > parseISO(rule.endDate)) return false;
        }

        // 地區檢查
        const ruleRegion = rule.region || 'japan';
        const allowedRegions = mode === 'travel' ? ['global', 'japan'] : ['global', 'taiwan'];
        if (!allowedRegions.includes(ruleRegion)) return false;

        // 通路檢查
        if (rule.categories?.length && !rule.categories.includes(transaction.category)) {
            return false;
        }

        // 店家檢查
        if (rule.specificMerchants?.length) {
            if (!rule.specificMerchants.some(m => transaction.merchantName.includes(m))) {
                return false;
            }
        }

        // 支付方式檢查
        if (rule.paymentMethods?.length && !rule.paymentMethods.includes(transaction.paymentMethod)) {
            return false;
        }

        // 金額門檻檢查
        if (rule.minAmount) {
            if (!this.checkMinAmount(rule, transaction, amountTWD, program)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 檢查最低消費門檻
     */
    private checkMinAmount(
        rule: BonusRule,
        transaction: Transaction,
        amountTWD: number,
        program: RewardProgram
    ): boolean {
        const thresholdType = rule.minAmountType || 'per_transaction';
        const thresholdCurrency = rule.minAmountCurrency || 'TWD';

        if (thresholdType === 'per_transaction') {
            if (thresholdCurrency === 'JPY') {
                return transaction.amount >= rule.minAmount!;
            }
            return amountTWD >= rule.minAmount!;
        }

        // 累積型門檻
        if (!this.cumulativeCalculator) {
            // 沒有累積計算器時，預設通過
            return true;
        }

        const accumulated = this.cumulativeCalculator(
            transaction.id,
            program.startDate,
            program.endDate,
            thresholdCurrency
        );

        const currentAmount = thresholdCurrency === 'JPY'
            ? transaction.amount
            : amountTWD;

        return (accumulated + currentAmount) >= rule.minAmount!;
    }

    /**
     * 計算加碼金額
     */
    private calculateBonusAmount(
        rule: BonusRule,
        transaction: Transaction,
        amountTWD: number,
        exchangeRate: number,
        program: RewardProgram,
        usageMap: Record<string, number>
    ): number {
        // 如果交易金額為 0，不計算任何回饋
        if (amountTWD === 0) {
            return 0;
        }

        const rewardType = rule.rewardType || 'percentage';

        if (rewardType === 'fixed') {
            return this.calculateFixedReward(rule, transaction, amountTWD, exchangeRate, program, usageMap);
        } else {
            return this.calculatePercentageReward(rule, transaction, amountTWD, exchangeRate, program, usageMap);
        }
    }

    /**
     * 計算固定金額回饋（累積達標一次性獎勵）
     * 
     * 邏輯：
     * 1. 檢查累積消費是否達到門檻
     * 2. 如果已經發放過（usageMap 有記錄），不再發放
     * 3. 達標且未發放，則發放固定金額回饋，歸屬於讓累積達標的這筆交易
     */
    private calculateFixedReward(
        rule: BonusRule,
        _transaction: Transaction,
        _amountTWD: number,
        exchangeRate: number,
        _program: RewardProgram,
        usageMap: Record<string, number>
    ): number {
        // 檢查是否已經發放過
        const alreadyGiven = usageMap[rule.id] || 0;
        if (alreadyGiven > 0) {
            // 已達標並發放過，後續交易不再獲得此回饋
            return 0;
        }

        // 固定金額回饋必須有設定金額
        if (!rule.fixedRewardAmount) {
            return 0;
        }

        // 將固定回饋金額轉換為 TWD
        const rewardCurrency = rule.fixedRewardCurrency || 'JPY';
        const rewardTWD = rewardCurrency === 'JPY'
            ? Math.floor(rule.fixedRewardAmount * exchangeRate)
            : rule.fixedRewardAmount;

        // 累積型門檻檢查已在 isRuleApplicable 中完成
        // 如果能走到這裡，表示已達標，發放固定金額回饋
        return rewardTWD;
    }

    /**
     * 計算百分比回饋
     */
    private calculatePercentageReward(
        rule: BonusRule,
        transaction: Transaction,
        amountTWD: number,
        exchangeRate: number,
        program: RewardProgram,
        usageMap: Record<string, number>
    ): number {
        if (rule.minAmountType !== 'cumulative') {
            return Math.floor(amountTWD * rule.rate);
        }

        // 累積型百分比回饋計算
        if (!this.cumulativeCalculator) {
            return Math.floor(amountTWD * rule.rate);
        }

        const thresholdCurrency = rule.minAmountCurrency || 'TWD';
        const accumulated = this.cumulativeCalculator(
            transaction.id,
            program.startDate,
            program.endDate,
            thresholdCurrency
        );

        const currentAmount = thresholdCurrency === 'JPY'
            ? transaction.amount
            : amountTWD;

        // 如果當前交易金額為 0，則累積型規則不應計算任何回饋
        if (currentAmount === 0) {
            return 0;
        }

        const accumulatedTotal = accumulated + currentAmount;
        const accumulatedTotalTWD = thresholdCurrency === 'JPY'
            ? Math.floor(accumulatedTotal * exchangeRate)
            : accumulatedTotal;

        const totalExpectedReward = Math.floor(accumulatedTotalTWD * rule.rate);
        const alreadyGiven = usageMap[rule.id] || 0;

        return Math.max(0, totalExpectedReward - alreadyGiven);
    }

    /**
     * 套用上限
     */
    private applyCap(
        rule: BonusRule,
        bonusAmount: number,
        exchangeRate: number,
        usageMap: Record<string, number>,
        result: CalculationResult
    ): { cappedAmount: number; isCapped: boolean } {
        if (rule.capAmount === undefined) {
            return { cappedAmount: bonusAmount, isCapped: false };
        }

        const capCurrency = rule.capAmountCurrency || 'TWD';
        const used = usageMap[rule.id] || 0;
        const remaining = Math.max(0, rule.capAmount - used);

        const remainingTWD = capCurrency === 'JPY'
            ? Math.floor(remaining * exchangeRate)
            : remaining;

        if (bonusAmount > remainingTWD) {
            result.warnings.push(`規則「${rule.name}」已達上限`);
            return { cappedAmount: remainingTWD, isCapped: true };
        }

        return { cappedAmount: bonusAmount, isCapped: false };
    }

    /**
     * 加入加碼明細
     */
    private addBonusToBreakdown(
        rule: BonusRule,
        bonusAmount: number,
        exchangeRate: number,
        isCapped: boolean,
        result: CalculationResult
    ): void {
        const displayCapLimit = rule.capAmount !== undefined
            ? (rule.capAmountCurrency === 'JPY'
                ? Math.floor(rule.capAmount * exchangeRate)
                : rule.capAmount)
            : undefined;

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

    /**
     * 計算手續費
     */
    private calculateTransactionFee(
        card: CreditCard,
        transaction: Transaction,
        amountTWD: number,
        mode: CalculationMode,
        result: CalculationResult
    ): void {
        const shouldChargeFee = mode === 'travel' || transaction.currency !== 'TWD';

        if (shouldChargeFee) {
            const feeRate = (card.foreignTxFee ?? 1.5) / 100;
            result.transactionFee = Math.floor(amountTWD * feeRate);
        }
    }
}

/**
 * 便利函數：建立帶有 Store 整合的計算器
 */
export function createCalculatorWithStore(
    getTransactions: () => Transaction[]
): RewardCalculator {
    const cumulativeCalculator: CumulativeSpendingCalculator = (
        currentTxId,
        startDate,
        endDate,
        currency
    ) => {
        const transactions = getTransactions();
        const startDateObj = parseISO(startDate);
        const endDateObj = parseISO(endDate);

        return transactions
            .filter(tx => tx.id !== currentTxId)
            .filter(tx => {
                const txDate = parseISO(tx.date);
                return isWithinInterval(txDate, { start: startDateObj, end: endDateObj });
            })
            .reduce((sum, tx) => {
                const amount = currency === 'JPY'
                    ? (tx.currency === 'JPY' ? tx.amount : Math.floor(tx.amount / tx.exchangeRate))
                    : (tx.currency === 'TWD' ? tx.amount : Math.floor(tx.amount * tx.exchangeRate));
                return sum + amount;
            }, 0);
    };

    return new RewardCalculator({ cumulativeCalculator });
}
