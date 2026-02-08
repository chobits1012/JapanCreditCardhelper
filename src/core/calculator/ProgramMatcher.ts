/**
 * ProgramMatcher - 根據交易日期找到適用的 RewardProgram
 * 
 * 此類別負責：
 * 1. 根據日期匹配正確的權益計畫
 * 2. 驗證權益計畫是否有重疊
 * 3. 提供計畫期間的工具函數
 */

import type { CreditCard, RewardProgram } from '../../types';

export class ProgramMatcher {
    /**
     * 找到適用於指定日期的 Program
     * @param card 信用卡
     * @param transactionDate 交易日期 (ISO Date string: YYYY-MM-DD)
     * @returns 適用的 Program，若無則返回 null
     */
    static findApplicableProgram(
        card: CreditCard,
        transactionDate: string
    ): RewardProgram | null {
        if (!card.programs || card.programs.length === 0) {
            return null;
        }

        const txDate = new Date(transactionDate);

        // 按開始日期排序（最新的優先）
        const sortedPrograms = [...card.programs].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        return sortedPrograms.find(program => {
            const startDate = new Date(program.startDate);
            const endDate = new Date(program.endDate);

            // 設定日期為當天開始和結束
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            txDate.setHours(12, 0, 0, 0);

            return txDate >= startDate && txDate <= endDate;
        }) || null;
    }

    /**
     * 取得所有目前有效的 Programs（根據當前日期）
     * @param card 信用卡
     * @param referenceDate 參考日期（預設為今天）
     */
    static getActivePrograms(
        card: CreditCard,
        referenceDate: Date = new Date()
    ): RewardProgram[] {
        if (!card.programs || card.programs.length === 0) {
            return [];
        }

        return card.programs.filter(program => {
            const startDate = new Date(program.startDate);
            const endDate = new Date(program.endDate);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            referenceDate.setHours(12, 0, 0, 0);

            return referenceDate >= startDate && referenceDate <= endDate;
        });
    }

    /**
     * 檢查兩個 Program 是否有期間重疊
     */
    static hasOverlap(p1: RewardProgram, p2: RewardProgram): boolean {
        const start1 = new Date(p1.startDate);
        const end1 = new Date(p1.endDate);
        const start2 = new Date(p2.startDate);
        const end2 = new Date(p2.endDate);

        // 設定時間邊界
        start1.setHours(0, 0, 0, 0);
        end1.setHours(23, 59, 59, 999);
        start2.setHours(0, 0, 0, 0);
        end2.setHours(23, 59, 59, 999);

        return start1 <= end2 && start2 <= end1;
    }

    /**
     * 驗證卡片的所有 Programs 是否有效（無重疊）
     */
    static validatePrograms(card: CreditCard): {
        valid: boolean;
        conflicts?: Array<{ p1: string; p2: string }>;
    } {
        if (!card.programs || card.programs.length < 2) {
            return { valid: true };
        }

        const conflicts: Array<{ p1: string; p2: string }> = [];

        for (let i = 0; i < card.programs.length; i++) {
            for (let j = i + 1; j < card.programs.length; j++) {
                if (this.hasOverlap(card.programs[i], card.programs[j])) {
                    conflicts.push({
                        p1: card.programs[i].name,
                        p2: card.programs[j].name,
                    });
                }
            }
        }

        return {
            valid: conflicts.length === 0,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
        };
    }

    /**
     * 取得 Program 剩餘天數
     */
    static getRemainingDays(program: RewardProgram): number {
        const today = new Date();
        const endDate = new Date(program.endDate);

        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(0, diffDays);
    }

    /**
     * 檢查 Program 是否已過期
     */
    static isExpired(program: RewardProgram): boolean {
        const today = new Date();
        const endDate = new Date(program.endDate);

        today.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return today > endDate;
    }

    /**
     * 檢查 Program 是否尚未開始
     */
    static isUpcoming(program: RewardProgram): boolean {
        const today = new Date();
        const startDate = new Date(program.startDate);

        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        return today < startDate;
    }
}
