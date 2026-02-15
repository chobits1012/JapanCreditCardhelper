/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * V4 遷移腳本：固定金額回饋類型支援
 * 
 * 此遷移確保所有 BonusRule 都有 rewardType 欄位，
 * 並將符合條件的 JCB 春季加碼規則轉換為固定金額回饋類型。
 * 
 * 【遷移邏輯】
 * 1. 為所有沒有 rewardType 的規則設定預設值 'percentage'
 * 2. 識別 JCB 春季加碼規則（根據名稱 + 累積門檻特徵）
 * 3. 將符合條件的規則轉換為 fixed 類型
 * 
 * 【安全措施】
 * - 只修改符合特定條件的規則
 * - 記錄所有變更以便調試
 * - 保留原有規則的所有其他屬性
 */

import type { Migration } from '../MigrationManager';
import { DATA_VERSIONS } from '../versions';

interface BonusRuleLegacy {
    id: string;
    name: string;
    rate: number;
    minAmount?: number;
    minAmountCurrency?: 'TWD' | 'JPY';
    minAmountType?: 'per_transaction' | 'cumulative';
    capAmount?: number;
    capAmountCurrency?: 'TWD' | 'JPY';
    rewardType?: 'percentage' | 'fixed';
    fixedRewardAmount?: number;
    fixedRewardCurrency?: 'TWD' | 'JPY';
    [key: string]: any;
}

/**
 * 檢查規則是否為需要轉換的 JCB 春季加碼
 */
function isJcbSpringBonus(rule: BonusRuleLegacy): boolean {
    // 條件1: 名稱包含 "JCB" 和 "春季" 或 "加碼"
    const nameMatch = Boolean(rule.name) &&
        rule.name.includes('JCB') &&
        (rule.name.includes('春季') || rule.name.includes('加碼'));

    // 條件2: 累積型門檻設定為 100000 JPY
    const thresholdMatch =
        rule.minAmountType === 'cumulative' &&
        rule.minAmountCurrency === 'JPY' &&
        rule.minAmount === 100000;

    // 條件3: 尚未轉換為 fixed 類型
    const notYetConverted = rule.rewardType !== 'fixed';

    return nameMatch && thresholdMatch && notYetConverted;
}

/**
 * 轉換 JCB 春季加碼規則為固定金額類型
 */
function convertToFixedReward(rule: BonusRuleLegacy): BonusRuleLegacy {
    console.log(`[Migration V4] Converting JCB rule: ${rule.name}`);

    return {
        ...rule,
        rewardType: 'fixed',
        rate: 0, // 固定金額不使用 rate
        fixedRewardAmount: 10000, // ¥10,000 固定回饋
        fixedRewardCurrency: 'JPY',
        // 移除不適用於 fixed 類型的上限設定
        capAmount: undefined,
        capAmountCurrency: undefined,
    };
}

/**
 * 確保規則有 rewardType 欄位（向後相容）
 */
function ensureRewardType(rule: BonusRuleLegacy): BonusRuleLegacy {
    if (!rule.rewardType) {
        return {
            ...rule,
            rewardType: 'percentage',
        };
    }
    return rule;
}

export const migration_v4_fixed_reward: Migration = {
    version: DATA_VERSIONS.V4_FIXED_REWARD,
    name: 'Fixed Reward Type Support',
    description: '新增固定金額回饋類型，並轉換 JCB 春季加碼規則',

    up: (storeData: any) => {
        if (!storeData?.state?.cards) {
            return storeData;
        }

        const { cards } = storeData.state;
        let convertedCount = 0;
        let processedRulesCount = 0;

        // 處理每張卡片的每個 program 的每個 rule
        const migratedCards = cards.map((card: any) => {
            if (!card.programs) return card;

            return {
                ...card,
                programs: card.programs.map((program: any) => {
                    if (!program.bonusRules) return program;

                    return {
                        ...program,
                        bonusRules: program.bonusRules.map((rule: BonusRuleLegacy) => {
                            processedRulesCount++;

                            // 先檢查是否為 JCB 春季加碼
                            if (isJcbSpringBonus(rule)) {
                                convertedCount++;
                                return convertToFixedReward(rule);
                            }

                            // 否則只確保有 rewardType
                            return ensureRewardType(rule);
                        }),
                    };
                }),
            };
        });

        console.log(`[Migration V4] Processed ${processedRulesCount} rules, converted ${convertedCount} JCB rules`);

        return {
            ...storeData,
            state: {
                ...storeData.state,
                cards: migratedCards,
            },
        };
    },
};
