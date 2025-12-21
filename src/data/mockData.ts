import type { CreditCard } from '../types';

export const MOCK_CARDS: CreditCard[] = [
    {
        id: 'fubon-j',
        name: '富邦 J 卡',
        bank: '台北富邦',
        statementDate: 21,
        foreignTxFee: 1.5,
        programs: [
            {
                id: 'fubon-j-2025-h2',
                cardId: 'fubon-j',
                name: '2025 下半年權益',
                startDate: '2025-07-01',
                endDate: '2025-12-31',
                baseRate: 0.01,
                bonusRules: [
                    {
                        id: 'j-japan-general',
                        name: '日本一般消費加碼',
                        rate: 0.02, // Total 3%
                        categories: ['general_japan', 'drugstore', 'electronics', 'department', 'dining', 'convenience'],
                        capAmount: undefined, // 無上限
                    },
                    {
                        id: 'j-japan-bonus-merchant',
                        name: '日本指定通路加碼',
                        rate: 0.03, // Extra 3% -> Total 6%
                        categories: ['convenience', 'drugstore'],
                        specificMerchants: ['Lawson', 'FamilyMart', '7-Eleven', 'Matsumotokiyoshi'],
                        capAmount: 600,
                        requiresRegistration: true,
                    }
                ]
            }
        ]
    },
    {
        id: 'card_jim_he',
        name: '吉鶴卡',
        bank: '聯邦銀行',
        foreignTxFee: 1.5,
        programs: [
            {
                id: 'prog_jim_2024q3',
                cardId: 'card_jim_he',
                name: '2024 下半年權益',
                startDate: '2024-07-01',
                endDate: '2024-12-31',
                baseRate: 0.01, // 國內 1%
                bonusRules: [
                    {
                        id: 'rule_jim_jp_3',
                        name: '日幣消費 3%',
                        rate: 0.03,
                        categories: ['general_japan', 'drugstore', 'electronics', 'convenience', 'department', 'dining'],
                        capAmount: undefined, // 無上限
                        capPeriod: 'monthly'
                    }
                ]
            }
        ]
    },
    {
        id: 'card_esun_kumamon',
        name: '熊本熊卡',
        bank: '玉山銀行',
        foreignTxFee: 1.5,
        supportedPaymentMethods: ['PayPay (玉山Wallet)'], // Explicitly supports E.Sun Wallet PayPay
        programs: [
            {
                id: 'prog_kumamon_2024',
                cardId: 'card_esun_kumamon',
                name: '2024 權益',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                baseRate: 0.01,
                bonusRules: [
                    {
                        id: 'rule_kuma_jp_2',
                        name: '日本消費 2% (免收海外手續費)',
                        rate: 0.02, // 實際上免手續費等於省1.5%，加上回饋2% -> 3.5%? 這裡先單純算回饋率
                        categories: ['general_japan', 'drugstore', 'electronics', 'convenience', 'department', 'dining'],
                        capAmount: undefined,
                        capPeriod: 'monthly'
                    },
                    {
                        id: 'rule_kuma_suica_5',
                        name: '日本指定通路 5%', // BicCamera, Donki etc. 需登錄
                        rate: 0.05,
                        categories: ['drugstore', 'electronics'],
                        specificMerchants: ['Bic Camera', 'Yodobashi', 'Matsumoto Kiyoshi', 'Don Quijote'],
                        capAmount: 500, // 每期上限 500
                        capPeriod: 'monthly'
                    },
                    {
                        id: 'rule_kuma_paypay_7', // Special rule for PayPay
                        name: 'PayPay (玉山Wallet) 7%',
                        rate: 0.07, // Total 7% (including base/handling fee exemptions usually marketed as total benefit)
                        categories: ['general_japan', 'drugstore', 'electronics', 'convenience', 'department', 'dining'],
                        paymentMethods: ['PayPay (玉山Wallet)'],
                        capAmount: 500, // Example cap
                        capPeriod: 'monthly'
                    }
                ]
            }
        ]
    },
    {
        id: 'card_virtual_allplus',
        name: '全支付帳戶',
        bank: '全支付', // Virtual Bank
        foreignTxFee: 0, // No fee for account payment
        supportedPaymentMethods: ['PayPay (全支付)'],
        programs: [
            {
                id: 'prog_allplus_virtual',
                cardId: 'card_virtual_allplus',
                name: '全支付日本活動',
                startDate: '2024-01-01',
                endDate: '2025-12-31',
                baseRate: 0,
                bonusRules: [
                    {
                        id: 'rule_allplus_jp_25',
                        name: '日本 PayPay 25% (全點)',
                        rate: 0.25,
                        categories: ['general_japan', 'drugstore', 'electronics', 'convenience', 'department', 'dining'],
                        paymentMethods: ['PayPay (全支付)'],
                        capAmount: undefined, // Campaign usually has total pool, treating as unlimited for individual now
                        capPeriod: 'campaign'
                    }
                ]
            }
        ]
    },
    {
        id: 'card_virtual_jko',
        name: '街口帳戶',
        bank: '街口支付',
        foreignTxFee: 0,
        supportedPaymentMethods: ['PayPay (街口)'],
        programs: [
            {
                id: 'prog_jko_virtual',
                cardId: 'card_virtual_jko',
                name: '街口日本活動',
                startDate: '2024-01-01',
                endDate: '2025-12-31',
                baseRate: 0,
                bonusRules: [
                    {
                        id: 'rule_jko_jp_generic',
                        name: '日本 PayPay 街口幣回饋',
                        rate: 0.05, // Placeholder conservative rate
                        categories: ['general_japan', 'drugstore', 'electronics', 'convenience', 'department', 'dining'],
                        paymentMethods: ['PayPay (街口)'],
                        capAmount: undefined,
                        capPeriod: 'monthly'
                    }
                ]
            }
        ]
    },
    {
        id: 'cathay-cube',
        name: '國泰 CUBE 卡',
        bank: '國泰世華',
        statementDate: 3,
        foreignTxFee: 1.5,
        programs: [
            {
                id: 'cube-fun-travel',
                cardId: 'cathay-cube',
                name: '趣旅行權益',
                startDate: '2025-01-01',
                endDate: '2026-12-31',
                baseRate: 0.03, // 3%
                bonusRules: []
            }
        ]
    }
];
