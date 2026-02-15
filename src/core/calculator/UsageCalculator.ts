import { startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { BonusRule, RewardProgram, Transaction, BillingCycleType } from '../../types';

export class UsageCalculator {
    /**
     * 計算特定規則在指定期間內的累積使用量
     */
    static calculateRuleUsage(
        transactions: Transaction[],
        ruleId: string,
        cardId: string,
        periodStart: Date,
        periodEnd: Date,
        ruleName?: string // Optional for legacy fallback
    ): number {
        return transactions.reduce((sum, t) => {
            // Only count transactions for the specified card
            if (t.cardId !== cardId) return sum;

            // Ensure we compare apples to apples (dates)
            // Fix: Use string comparison for dates to avoid timezone issues
            // parseISO returns local date for YYYY-MM-DD, isWithinInterval handles it correctly IF start/end are also local
            const tDate = parseISO(t.date);

            // Allow transaction on the exact start/end boundaries
            if (isWithinInterval(tDate, { start: periodStart, end: periodEnd })) {
                // 1. Priority: Use ruleUsageMap (New System)
                if (t.ruleUsageMap && typeof t.ruleUsageMap[ruleId] === 'number') {
                    return sum + t.ruleUsageMap[ruleId];
                }

                // 2. Fallback: Use appliedRuleNames (Legacy System)
                // If ruleName is provided and present in appliedRuleNames, assume full amount usage
                if (ruleName && t.appliedRuleNames?.includes(ruleName)) {
                    return sum + t.amount;
                }

                return sum;
            }
            return sum;
        }, 0);
    }

    /**
     * 根據規則設定計算開始與結束日期
     */
    static getUsagePeriod(
        targetDateStr: string,
        rule: BonusRule,
        program: RewardProgram,
        statementDate: number = 27,
        billingCycleType: BillingCycleType = 'calendar'
    ): { start: Date; end: Date } {
        const targetDate = parseISO(targetDateStr);

        // 1. Campaign Period (Priority)
        // 活動週期：直接使用 Program 的起訖日
        if (rule.capPeriod === 'campaign') {
            return {
                start: startOfDay(parseISO(program.startDate)),
                end: endOfDay(parseISO(program.endDate))
            };
        }

        // 2. Calendar Month
        // 自然月：當月1號 ~ 當月最後一天
        if (billingCycleType === 'calendar') {
            return {
                start: startOfMonth(targetDate),
                end: endOfMonth(targetDate)
            };
        }

        // 3. Statement Billing Cycle
        // 結帳週期
        const targetDay = targetDate.getDate();
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();

        let start: Date;
        let end: Date;

        if (targetDay > statementDate) {
            // 例：結帳日27，目標日28 -> 週期為 本月28 ~ 下月27
            // Logic match: Current cycle started this month on (statementDate + 1)
            start = new Date(targetYear, targetMonth, statementDate + 1);
            // Ends next month on statementDate
            end = new Date(targetYear, targetMonth + 1, statementDate);
        } else {
            // 例：結帳日27，目標日15 -> 週期為 上月28 ~ 本月27
            // Logic match: Current cycle started last month
            start = new Date(targetYear, targetMonth - 1, statementDate + 1);
            // Ends this month on statementDate
            end = new Date(targetYear, targetMonth, statementDate);
        }

        return {
            start: startOfDay(start),
            end: endOfDay(end)
        };
    }
}
