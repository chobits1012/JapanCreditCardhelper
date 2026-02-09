/**
 * Bonus Presets Data
 * 
 * Built-in bonus promotion presets that users can quickly apply when adding/editing cards.
 * 
 * 此檔案定義內建的加碼優惠預設，方便使用者一鍵帶入。
 * 若需新增或修改預設，只需編輯此檔案即可，不需更動 UI 程式碼。
 * 
 * 【如何新增預設】
 * 1. 在 BONUS_PRESETS 陣列中新增一個物件
 * 2. 填入 id、name、description 和 ruleData
 * 3. ruleData 的欄位說明請參考 BonusRuleState interface
 */

import type { BonusRuleState } from '../utils/bonusRuleHelpers';

/**
 * Bonus preset definition.
 * Contains metadata and the actual rule data to be applied.
 */
export interface BonusPreset {
    /** Unique identifier for the preset */
    id: string;
    /** Display name shown in the picker (e.g., "JCB 春季加碼") */
    name: string;
    /** Short description for context (e.g., "2026/02/02-04/30 回饋10%") */
    description?: string;
    /** The actual rule data to be pre-filled - partial, missing fields will use defaults */
    ruleData: Partial<Omit<BonusRuleState, 'id' | 'createdAt'>>;
}

/**
 * 內建加碼優惠預設列表
 * 
 * 使用者可在編輯卡片時快速帶入這些預設。
 * 若要新增預設，在此陣列中加入新物件即可。
 */
export const BONUS_PRESETS: BonusPreset[] = [
    {
        id: 'jcb-spring-2026',
        name: 'JCB 春季加碼',
        description: '2026/02/01-04/30 累積滿¥100,000 獲得¥10,000 一次性回饋',
        ruleData: {
            name: 'JCB 春季加碼',
            rewardType: 'fixed',                // 固定金額回饋
            rate: '0',                          // 固定金額不使用百分比
            fixedRewardAmount: '10000',         // 固定回饋 ¥10,000
            fixedRewardCurrency: 'JPY',
            startDate: '2026-02-01',
            endDate: '2026-04-30',
            minAmount: '100000',                // 累積門檻 100000 JPY
            minAmountCurrency: 'JPY',
            minAmountType: 'cumulative',        // 累積型門檻
            checkJapan: true,                   // 包含所有日本通路
            requiresRegistration: true,         // 此活動需要登錄
            region: 'japan',
            specificMerchants: '',
            paymentMethods: [],
        }
    },
];

/**
 * Helper function to create a full BonusRuleState from a preset.
 * Generates a new UUID and createdAt timestamp to ensure uniqueness.
 * 
 * @param preset - The preset to convert
 * @returns A complete BonusRuleState ready to be added to the form
 */
export function createBonusRuleStateFromPreset(preset: BonusPreset): BonusRuleState {
    return {
        // Default values (will be overwritten by preset.ruleData if specified)
        id: crypto.randomUUID(),
        name: '',
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
        // Override with preset data
        ...preset.ruleData,
    };
}
