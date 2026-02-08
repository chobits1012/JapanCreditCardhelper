/**
 * V3 遷移腳本：多 Program 支援
 * 
 * 確保所有卡片都有有效的 programs 陣列結構。
 */

import type { Migration } from '../MigrationManager';
import { DATA_VERSIONS } from '../versions';

export const migration_v3_multi_program: Migration = {
    version: DATA_VERSIONS.V3_MULTI_PROGRAM,
    name: 'Multi-Program Support',
    description: '確保所有卡片都有完整的 programs 陣列結構',

    up: (storeData: any) => {
        if (!storeData?.state?.cards) {
            return storeData;
        }

        const { cards, transactions } = storeData.state;

        // 處理每張卡片
        const migratedCards = cards.map((card: any) => {
            // 確保 programs 是陣列
            if (!card.programs) {
                card.programs = [];
            }

            // 如果沒有任何 program，建立預設的
            if (card.programs.length === 0) {
                card.programs = [{
                    id: crypto.randomUUID(),
                    cardId: card.id,
                    name: '預設權益',
                    startDate: '2024-01-01',
                    endDate: '2025-12-31',
                    baseRateOverseas: 0.01,
                    baseRateDomestic: 0.01,
                    bonusRules: [],
                }];
            }

            // 確保每個 program 都有必要的欄位
            card.programs = card.programs.map((program: any) => ({
                id: program.id || crypto.randomUUID(),
                cardId: card.id,
                name: program.name || '未命名權益',
                startDate: program.startDate || '2024-01-01',
                endDate: program.endDate || '2025-12-31',
                baseRateOverseas: program.baseRateOverseas ?? program.baseRate ?? 0.01,
                baseRateDomestic: program.baseRateDomestic ?? 0.01,
                bonusRules: program.bonusRules || [],
                note: program.note,
            }));

            return card;
        });

        // 處理交易：確保都有 programId
        const migratedTransactions = transactions?.map((tx: any) => {
            if (tx.programId) return tx;

            // 找到對應的卡片
            const card = migratedCards.find((c: any) => c.id === tx.cardId);
            if (!card || !card.programs.length) return tx;

            // 嘗試根據日期匹配 program
            const txDate = new Date(tx.date);
            const matchedProgram = card.programs.find((p: any) => {
                const start = new Date(p.startDate);
                const end = new Date(p.endDate);
                return txDate >= start && txDate <= end;
            });

            return {
                ...tx,
                programId: matchedProgram?.id || card.programs[0].id,
            };
        }) || [];

        return {
            ...storeData,
            state: {
                ...storeData.state,
                cards: migratedCards,
                transactions: migratedTransactions,
            },
        };
    },
};
