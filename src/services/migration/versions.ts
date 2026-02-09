/**
 * 資料版本定義
 * 
 * 每次資料結構變更時，新增版本號並撰寫對應的遷移腳本。
 */

export const DATA_VERSIONS = {
    /** 初始版本 - 基礎資料結構 */
    V1_INITIAL: 1,

    /** 新增累積型回饋支援 */
    V2_CUMULATIVE: 2,

    /** 多 Program 支援 - 完整的 programs 陣列結構 */
    V3_MULTI_PROGRAM: 3,

    /** 固定金額回饋類型支援 - 轉換 JCB 春季加碼規則 */
    V4_FIXED_REWARD: 4,
} as const;

/** 目前資料版本 */
export const CURRENT_VERSION = DATA_VERSIONS.V4_FIXED_REWARD;

/** 儲存版本號的 Key */
export const VERSION_KEY = 'credit-card-store-version';

