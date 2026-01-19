// 商家類別枚舉
export type MerchantCategory =
    | 'general_japan' // 日本一般實體
    | 'drugstore'     // 藥妝店
    | 'electronics'   // 家電量販 (Bic Camera, Yodobashi)
    | 'convenience'   // 便利商店
    | 'department'    // 百貨公司
    | 'airline'       // 航空機票 (New)
    | 'hotel'         // 飯店住宿 (New)
    | 'dining'        // 餐飲
    | 'online'        // 網購
    | 'other';        // 其他

// 回饋類型
export type RewardType = 'cash' | 'points' | 'miles';

// 加碼規則詳情
export interface BonusRule {
    id: string;
    name: string; // 例如: "日韓實體消費加碼"
    rate: number; // 回饋率 (例如 0.03 代表 3%)
    region?: 'global' | 'japan' | 'taiwan'; // 適用地區 (New)

    // 適用條件
    categories: MerchantCategory[]; // 適用通路
    specificMerchants?: string[];   // 特定店家 (例如 ["Don Quijote"])
    paymentMethods?: string[];      // 限制支付方式 (例如 ["Apple Pay", "QUICPay"])
    minAmount?: number;             // 最低消費門檻
    requiresRegistration?: boolean; // 是否需要登錄 (New)
    note?: string;                  // 備註 (New)

    // 上限設定
    capAmount?: number;             // 回饋上限金額 (undefined 代表無上限)
    capPeriod?: 'monthly' | 'campaign' | 'annual'; // 上限週期 (New: campaign = 活動期間總上限)

    // 狀態追蹤 (Runtime calculated - NOT persisted in rule definition)
    // currentUsage is tracked separately in UserActivity state
}

// 回饋計畫 (一張卡在特定期間的規則集合)
export interface RewardProgram {
    id: string;
    cardId: string;
    name: string; // 例如: "2024 下半年權益"
    startDate: string; // ISO Date
    endDate: string;   // ISO Date

    baseRateOverseas: number;  // 海外/日本回饋 (Renamed from baseRate)
    baseRateDomestic: number;  // 國內/台灣回饋 (New)
    bonusRules: BonusRule[]; // 加碼規則列表

    note?: string; // 備註 (例如: "需登錄", "需綁定帳戶")
}

// 信用卡本體
export interface CreditCard {
    id: string;
    name: string;       // 例如: "吉鶴卡"
    bank: string;       // 例如: "聯邦銀行"
    statementDate?: number; // 結帳日 (1-31)
    foreignTxFee?: number; // 海外交易手續費 (%) default 1.5
    imageUrl?: string;  // 卡面圖片
    colorTheme?: string; // 卡片色系主題 ID (e.g., 'midnight_navy')
    supportedPaymentMethods?: string[]; // 支援的特殊支付方式 (e.g. ['PayPay (玉山Wallet)'])
    programs: RewardProgram[]; // 這張卡的各期權益
}

export interface Transaction {
    id: string;
    date: string;          // 消費日期 ISO string
    amount: number;        // 金額
    currency: 'TWD' | 'JPY';
    exchangeRate: number;  // 匯率 (JPY to TWD)

    merchantName: string;  // 店名
    category: MerchantCategory; // 通路類別
    paymentMethod: string; // 刷卡/Apple Pay...

    cardId: string;        // 使用哪張卡
    programId: string;     // 適用當時的哪個權益計畫

    // 計算結果快照 (避免規則變更後歷史帳務變動)
    calculatedRewardAmount: number;
    appliedRuleNames: string[];
    ruleUsageMap?: Record<string, number>; // ruleId -> amount contributed by this transaction
}

