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
        id: 'federal-gilgo',
        name: '聯邦吉鶴卡',
        bank: '聯邦銀行',
        statementDate: 27,
        foreignTxFee: 1.5,
        programs: [
            {
                id: 'gilgo-2025',
                cardId: 'federal-gilgo',
                name: '2025 權益',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                baseRate: 0.01,
                bonusRules: [
                    {
                        id: 'gilgo-japan',
                        name: '日本消費加碼',
                        rate: 0.025, // Total 3.5%
                        categories: ['general_japan', 'drugstore', 'electronics', 'department', 'dining', 'convenience'],
                    },
                    {
                        id: 'gilgo-quicpay',
                        name: 'QUICPay 加碼',
                        rate: 0.015, // Extra 1.5% -> Total 5%
                        categories: ['general_japan', 'drugstore', 'electronics', 'department', 'dining', 'convenience'],
                        paymentMethods: ['QUICPay'],
                        capAmount: 1000,
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
