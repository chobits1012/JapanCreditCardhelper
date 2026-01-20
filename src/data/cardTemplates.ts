/**
 * Card Templates Data
 * 
 * 信用卡預設模板，包含各銀行的日本旅遊信用卡權益。
 * 使用者可透過「預設卡片」功能一鍵新增這些卡片。
 * 
 * 最後更新: 2026/01/20 (2026年上半年權益)
 */

import type { CreditCard } from '../types';

/**
 * 2026年上半年五大旅日神卡預設
 * - 富邦 J 卡: 日韓泰 6% + 交通卡 10%
 * - 聯邦吉鶴卡: 2.5% + Apple Pay 加碼 (最高 11%)
 * - 玉山熊本熊卡: 2.5% + 指定商店 8.5%
 * - 玉山 Unicard: UP選日本 4.5%
 * - 台新 Richart 卡: 玩旅刷海外 3.3%
 */
export const CARD_TEMPLATES: Partial<CreditCard>[] = [
    // ============================================
    // 富邦 J 卡 (2026 H1)
    // ============================================
    {
        name: '富邦 J 卡',
        bank: '台北富邦銀行',
        colorTheme: 'midnight_navy',
        foreignTxFee: 1.5,
        supportedPaymentMethods: [],
        programs: [{
            id: 'template-fubon-j-2026h1',
            cardId: 'template-fubon-j',
            name: '日韓泰旅遊權益 (2026 H1)',
            startDate: '2026-01-01',
            endDate: '2026-03-31',
            baseRateOverseas: 0.03, // 日韓泰 3%
            baseRateDomestic: 0.01,
            note: '日韓泰一般消費 3%，無上限',
            bonusRules: [
                {
                    id: 'rule-fubon-j-local-2026',
                    name: '日韓泰當地實體消費加碼',
                    rate: 0.03, // +3% => 6%
                    categories: ['general_japan', 'drugstore', 'electronics', 'department', 'convenience', 'dining'],
                    region: 'japan',
                    capAmount: 1000, // 每季上限 1000 元
                    capPeriod: 'monthly',
                    minAmount: 1000, // 單筆滿 1000 元
                    requiresRegistration: true,
                    startDate: '2026-01-01',
                    endDate: '2026-03-31',
                },
                {
                    id: 'rule-fubon-j-suica-2026',
                    name: 'Apple Pay 交通卡儲值加碼',
                    rate: 0.07, // +7% => 10%
                    categories: ['other'],
                    specificMerchants: ['Suica', 'ICOCA', 'PASMO', 'Mobile Suica'],
                    paymentMethods: ['Apple Pay'],
                    region: 'japan',
                    capAmount: 200,
                    capPeriod: 'monthly',
                    minAmount: 2000,
                    requiresRegistration: true,
                    startDate: '2026-01-01',
                    endDate: '2026-03-31',
                    note: '每季限量 30,000 名',
                }
            ]
        }]
    },

    // ============================================
    // 聯邦吉鶴卡 (2026 H1)
    // ============================================
    {
        name: '吉鶴卡',
        bank: '聯邦銀行',
        colorTheme: 'burgundy_wine',
        foreignTxFee: 1.5,
        supportedPaymentMethods: [],
        programs: [{
            id: 'template-jiho-2026h1',
            cardId: 'template-jiho',
            name: '日本消費權益 (2026 H1)',
            startDate: '2026-01-01',
            endDate: '2026-06-30',
            baseRateOverseas: 0.025, // 日幣一般消費 2.5%
            baseRateDomestic: 0.01,
            note: '日幣消費 2.5%，無上限',
            bonusRules: [
                {
                    id: 'rule-jiho-applepay-2026',
                    name: 'Apple Pay 感應支付加碼',
                    rate: 0.015, // +1.5%
                    categories: ['general_japan', 'drugstore', 'electronics', 'department', 'convenience', 'dining'],
                    paymentMethods: ['Apple Pay'],
                    region: 'japan',
                    capAmount: 600,
                    capPeriod: 'monthly',
                    minAmount: 100, // 單筆滿 100 元
                    requiresRegistration: true,
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                    note: '活動期間僅需登錄一次',
                },
                {
                    id: 'rule-jiho-applepay-high-2026',
                    name: 'Apple Pay 滿額再加碼',
                    rate: 0.01, // +1%
                    categories: ['general_japan'],
                    paymentMethods: ['Apple Pay'],
                    region: 'japan',
                    capAmount: 200,
                    capPeriod: 'monthly',
                    requiresRegistration: false,
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                    note: '前期帳單達 NT$30,000',
                },
                {
                    id: 'rule-jiho-top11-2026',
                    name: '11大熱門商店加碼',
                    rate: 0.03, // +3%
                    categories: ['convenience', 'department', 'drugstore', 'electronics'],
                    specificMerchants: [
                        '7-ELEVEN', 'LAWSON', 'FamilyMart',
                        'Tokyo Disney', 'USJ', 'Universal Studios',
                        'Bic Camera', 'Yodobashi', 'Don Quijote', '唐吉軻德'
                    ],
                    region: 'japan',
                    capAmount: 600,
                    capPeriod: 'campaign', // 活動期間上限
                    requiresRegistration: false,
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                }
            ]
        }]
    },

    // ============================================
    // 玉山熊本熊卡 (2026 H1)
    // ============================================
    {
        name: '熊本熊卡',
        bank: '玉山銀行',
        colorTheme: 'emerald_forest',
        foreignTxFee: 1.5,
        supportedPaymentMethods: ['PayPay (玉山Wallet)'],
        programs: [{
            id: 'template-kumamon-2026h1',
            cardId: 'template-kumamon',
            name: '旅日與指定通路權益 (2026 H1)',
            startDate: '2026-01-01',
            endDate: '2026-06-30',
            baseRateOverseas: 0.025, // 日本消費 2.5%
            baseRateDomestic: 0.01,
            note: '日本消費 2.5%，無上限 (含實體/網購)',
            bonusRules: [
                {
                    id: 'rule-kumamon-store-2026',
                    name: '指定日本商店加碼',
                    rate: 0.06, // +6% => 8.5%
                    categories: ['drugstore', 'electronics', 'department', 'dining'],
                    specificMerchants: [
                        '松本清', 'Matsumoto Kiyoshi', '三井購物園區', 'UNIQLO', 'GU',
                        '星野集團', 'OTS租車', 'ORIX租車',
                        '敘敘苑', '一蘭拉麵', '鳥貴族',
                        'Tokyo Disney', '東京迪士尼', 'USJ', '環球影城', '豪斯登堡'
                    ],
                    region: 'japan',
                    capAmount: 500,
                    capPeriod: 'monthly',
                    requiresRegistration: true,
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                },
                {
                    id: 'rule-kumamon-paypay-2026',
                    name: 'PayPay 消費加碼 (玉山Wallet)',
                    rate: 0.035, // 3.5%
                    categories: ['general_japan'],
                    paymentMethods: ['PayPay (玉山Wallet)'],
                    region: 'japan',
                    capAmount: 100,
                    capPeriod: 'monthly',
                    requiresRegistration: false,
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                    note: '另可免收 1.5% 海外手續費',
                }
            ]
        }]
    },

    // ============================================
    // 玉山 Unicard (2026 H1) - 新增
    // ============================================
    {
        name: 'Unicard',
        bank: '玉山銀行',
        colorTheme: 'emerald_forest',
        foreignTxFee: 1.5,
        supportedPaymentMethods: [],
        programs: [{
            id: 'template-unicard-2026h1',
            cardId: 'template-unicard',
            name: 'UP選日本權益 (2026 H1)',
            startDate: '2026-01-01',
            endDate: '2026-06-30',
            baseRateOverseas: 0.01, // 基本 1%
            baseRateDomestic: 0.01,
            note: 'UP選方案：日本加碼特店最高 4.5%',
            bonusRules: [
                {
                    id: 'rule-unicard-up-japan-2026',
                    name: 'UP選 日本特店加碼',
                    rate: 0.035, // +3.5% => 4.5%
                    categories: ['general_japan', 'drugstore', 'electronics', 'department', 'convenience', 'dining'],
                    region: 'japan',
                    capAmount: 5000, // 每月上限 5000 點
                    capPeriod: 'monthly',
                    requiresRegistration: false,
                    startDate: '2026-01-01',
                    endDate: '2026-06-30',
                    note: 'UP選月費 149 點，需將日本設為加碼特店',
                },
                {
                    id: 'rule-unicard-q1-bonus-2026',
                    name: 'Q1 日本滿額加碼',
                    rate: 0.015, // 最高 +1.5%
                    categories: ['general_japan'],
                    region: 'japan',
                    capAmount: 6000,
                    capPeriod: 'campaign',
                    minAmount: 300000, // 累積滿 30 萬
                    requiresRegistration: true,
                    startDate: '2025-12-29',
                    endDate: '2026-03-31',
                    note: '累積 10萬+0.5%、20萬+1%、30萬+1.5%',
                }
            ]
        }]
    },

    // ============================================
    // 台新 Richart 卡 (2026 H1) - 新增
    // ============================================
    {
        name: 'Richart 卡',
        bank: '台新銀行',
        colorTheme: 'slate_blue',
        foreignTxFee: 1.5,
        supportedPaymentMethods: [],
        programs: [{
            id: 'template-richart-2026h1',
            cardId: 'template-richart',
            name: '玩旅刷海外權益 (2026 H1)',
            startDate: '2026-01-01',
            endDate: '2026-06-30',
            baseRateOverseas: 0.033, // 玩旅刷 3.3%
            baseRateDomestic: 0.01,
            note: '切換「玩旅刷」方案，海外消費最高 3.3%',
            bonusRules: [
                {
                    id: 'rule-richart-bonus-2026q1',
                    name: '海外消費限時加碼',
                    rate: 0.033, // +3.3% => 6.6%
                    categories: ['general_japan', 'drugstore', 'electronics', 'department', 'convenience', 'dining'],
                    region: 'japan',
                    requiresRegistration: true,
                    startDate: '2026-01-15',
                    endDate: '2026-03-01',
                    note: '限量回饋',
                }
            ]
        }]
    },

    // ============================================
    // 以下保留舊有模板
    // ============================================
    {
        name: 'CUBE 卡',
        bank: '國泰世華銀行',
        colorTheme: 'graphite_grey',
        programs: [{
            id: 'template-cube-2025',
            cardId: 'template-cube',
            name: '趣旅行權益 (2025)',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            baseRateOverseas: 0.03, // 3%
            baseRateDomestic: 0.01,
            bonusRules: []
        }]
    },
    {
        name: 'MITSUI OUTLET PARK 卡',
        bank: '永豐銀行',
        colorTheme: 'matte_black',
        programs: [{
            id: 'template-sinopac-mitsui-2025',
            cardId: 'template-sinopac-mitsui',
            name: '日韓泰旅遊回饋 (2025)',
            startDate: '2025-07-01',
            endDate: '2025-12-31',
            baseRateOverseas: 0.01,
            baseRateDomestic: 0.01,
            bonusRules: [
                {
                    id: 'rule-sinopac-mitsui-foreign',
                    name: '日韓泰滿額加碼 (需登錄)',
                    rate: 0.09, // +9% => 10%
                    categories: ['general_japan', 'dining', 'drugstore', 'electronics', 'department'],
                    capAmount: 2000 / 0.09,
                    minAmount: 20000,
                    requiresRegistration: true
                },
                {
                    id: 'rule-sinopac-mitsui-outlet',
                    name: '日本三井 Outlet 折扣',
                    rate: 0.0,
                    categories: ['department'],
                    specificMerchants: ['Mitsui Outlet Park', 'LaLaport', 'MITSUI OUTLET PARK'],
                    requiresRegistration: false
                }
            ]
        }]
    }
];

/**
 * 取得五大旅日神卡模板 (用於預設卡片選擇器)
 * 只回傳 2026 H1 版本的五張卡片
 */
export const JAPAN_TRAVEL_CARD_PRESETS = CARD_TEMPLATES.slice(0, 5);
