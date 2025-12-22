
import type { CreditCard } from '../types';

export const CARD_TEMPLATES: Partial<CreditCard>[] = [
    {
        name: '熊本熊卡',
        bank: '玉山銀行',
        supportedPaymentMethods: ['PayPay (玉山Wallet)'],
        programs: [{
            id: 'template-kumamon-2026',
            cardId: 'template-kumamon',
            name: '旅日與指定通路權益 (2026)',
            startDate: '2025-01-01',
            endDate: '2026-06-30',
            baseRate: 0.025, // 日本消費 2.5%
            note: '日本消費 2.5% (含實體/網購)',
            bonusRules: [
                {
                    id: 'rule-kumamon-suica',
                    name: 'Suica/PASMO 儲值加碼',
                    rate: 0.06, // +6%
                    categories: ['other'], // 交通卡儲值通常歸類為其他或特定
                    specificMerchants: ['Suica', 'PASMO', 'Mobile Suica', 'Mobile PASMO'],
                    capAmount: 500 / 0.06, // 上限 500元 (約刷 8333)
                    requiresRegistration: false
                },
                {
                    id: 'rule-kumamon-store',
                    name: '指定通路加碼 (Bic/唐吉/藥妝)',
                    rate: 0.06, // +6%
                    categories: ['drugstore', 'electronics', 'department'],
                    specificMerchants: ['Bic Camera', 'Don Quijote', 'Matsumoto Kiyoshi', '唐吉軻德', '松本清'],
                    capAmount: 500 / 0.06,
                    requiresRegistration: true
                }
            ]
        }]
    },
    {
        name: '吉鶴卡',
        bank: '聯邦銀行',
        supportedPaymentMethods: [],
        programs: [{
            id: 'template-jiho-2025',
            cardId: 'template-jiho',
            name: '日本消費權益 (2025)',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            baseRate: 0.025, // 日本消費 2.5%
            bonusRules: [
                {
                    id: 'rule-jiho-quicpay',
                    name: 'QuicPay 就是能嗶',
                    rate: 0.015, // +1.5% => 4%
                    categories: [],
                    paymentMethods: ['Apple Pay'],
                    capAmount: 1000,
                    requiresRegistration: false
                },
                {
                    id: 'rule-jiho-store',
                    name: '指定通路加碼 (超商/樂園/藥妝)',
                    rate: 0.03, // +3% => 7% (w/ QuicPay) or 5.5% (w/o)
                    categories: ['convenience', 'department', 'drugstore', 'electronics'],
                    specificMerchants: [
                        '7-ELEVEN', 'FamilyMart', 'LAWSON',
                        'Disney', 'Universal Studios', 'USJ', 'Tokyo Disney',
                        'Aeon', 'Yodobashi', 'Bic Camera', 'Daikoku', 'Matsumoto Kiyoshi'
                    ],
                    capAmount: 600,
                    requiresRegistration: false
                }
            ]
        }]
    },
    {
        name: '富邦 J 卡',
        bank: '台北富邦銀行',
        programs: [{
            id: 'template-fubon-j-2025',
            cardId: 'template-fubon-j',
            name: '日韓旅遊權益 (2025)',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            baseRate: 0.03, // 日韓 3%
            bonusRules: [
                {
                    id: 'rule-fubon-j-local',
                    name: '當地實體消費加碼',
                    rate: 0.03, // +3% => 6%
                    categories: ['general_japan', 'drugstore', 'electronics', 'department', 'convenience', 'dining'],
                    capAmount: 1000,
                    requiresRegistration: true
                },
                {
                    id: 'rule-fubon-j-suica',
                    name: 'Suica/ICOCA 交通卡加碼',
                    rate: 0.07, // +7% -> 10%
                    categories: ['other'],
                    specificMerchants: ['Suica', 'ICOCA', 'PASMO', 'Mobile Suica'],
                    requiresRegistration: true
                }
            ]
        }]
    },
    {
        name: 'CUBE 卡',
        bank: '國泰世華銀行',
        programs: [{
            id: 'template-cube-2025',
            cardId: 'template-cube',
            name: '趣旅行權益 (2025)',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            baseRate: 0.03, // 3%
            bonusRules: [
            ]
        }]
    },
    {
        name: 'MITSUI OUTLET PARK 卡',
        bank: '永豐銀行',
        programs: [{
            id: 'template-sinopac-mitsui-2025',
            cardId: 'template-sinopac-mitsui',
            name: '日韓泰旅遊回饋 (2025)',
            startDate: '2025-07-01', // Article says 2025/7/1 - 12/31. Is there one for current? Let's check or assume generic 2025. Article says "2025年7月1日至2025年12月31日". What about Jan-June?
            // "於2025年1月1日至2025年12月31日期間...指定MITSUI OUTLET PARK...折扣"
            // The 10% seems to be seasonal?. 
            // "每季...累積消費滿新台幣2萬元...享10%刷卡金".
            // Let's assume this starts 2025/01/01 for the sake of the template or set carefully.
            // Actually search result says: "於2025年7月1日至2025年12月31日...". That's clearly H2.
            // For now let's set it as 2025 H2 High Reward. 
            // Or maybe there is H1? Usually these renew. 
            // Let's set start date 2025-01-01 but Note "活動每季登錄".
            endDate: '2025-12-31',
            baseRate: 0.01, // 一般回饋 1%
            bonusRules: [
                {
                    id: 'rule-sinopac-mitsui-foreign',
                    name: '日韓泰滿額加碼 (需登錄)',
                    rate: 0.09, // +9% => 10%
                    categories: ['general_japan', 'dining', 'drugstore', 'electronics', 'department'], // Broadly Japan spending
                    capAmount: 2000 / 0.09, // Cap 2000 reward. 
                    minAmount: 20000,
                    requiresRegistration: true
                },
                {
                    id: 'rule-sinopac-mitsui-outlet',
                    name: '日本三井 Outlet 折扣',
                    rate: 0.0, // Discount is distinct from reward points, usually. But 10% tax free + 10% discount is ~19% off.
                    // Let's just create a dummy "info" rule or skip if it's coupon-based.
                    // User asks for "Card Rights". 
                    // Let's stick to the 10% cashback rule which is the main beef.
                    // Note: This 10% requires 20k spend.
                    categories: ['department'],
                    specificMerchants: ['Mitsui Outlet Park', 'LaLaport', 'MITSUI OUTLET PARK'],
                    requiresRegistration: false
                }
            ]
        }]
    }
];
