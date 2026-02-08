/**
 * Migration System 單元測試
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MigrationManager, type Migration } from '../MigrationManager';
import { migration_v3_multi_program } from '../migrations/v3_multi_program';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        clear: () => { store = {}; },
        removeItem: (key: string) => { delete store[key]; },
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('MigrationManager', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('should return version 1 when no version is stored', () => {
        const manager = new MigrationManager();
        expect(manager.getCurrentVersion()).toBe(1);
    });

    it('should correctly store and retrieve version', () => {
        const manager = new MigrationManager();
        manager.setVersion(3);
        expect(manager.getCurrentVersion()).toBe(3);
    });

    it('should detect when migration is needed', () => {
        const manager = new MigrationManager();
        expect(manager.needsMigration()).toBe(true);
    });

    it('should not need migration when at current version', () => {
        const manager = new MigrationManager();
        manager.setVersion(3);
        expect(manager.needsMigration()).toBe(false);
    });

    it('should execute migrations in order', () => {
        const manager = new MigrationManager();
        const executedVersions: number[] = [];

        const migration2: Migration = {
            version: 2,
            name: 'Migration 2',
            description: 'Test',
            up: (data) => {
                executedVersions.push(2);
                return { ...data, v2: true };
            },
        };

        const migration3: Migration = {
            version: 3,
            name: 'Migration 3',
            description: 'Test',
            up: (data) => {
                executedVersions.push(3);
                return { ...data, v3: true };
            },
        };

        manager.register(migration3);
        manager.register(migration2);

        const result = manager.migrate({});

        expect(executedVersions).toEqual([2, 3]);
        expect(result.success).toBe(true);
        expect(result.fromVersion).toBe(1);
        expect(result.toVersion).toBe(3);
    });

    it('should stop migration on error', () => {
        const manager = new MigrationManager();

        const migration2: Migration = {
            version: 2,
            name: 'Migration 2',
            description: 'Test',
            up: () => { throw new Error('Test error'); },
        };

        const migration3: Migration = {
            version: 3,
            name: 'Migration 3',
            description: 'Test',
            up: (data) => data,
        };

        manager.register(migration2);
        manager.register(migration3);

        const result = manager.migrate({});

        expect(result.success).toBe(false);
        expect(result.steps).toHaveLength(1);
        expect(result.steps[0].success).toBe(false);
    });
});

describe('migration_v3_multi_program', () => {
    it('should add default program to card without programs', () => {
        const storeData = {
            state: {
                cards: [{
                    id: 'card-1',
                    name: 'Test Card',
                    bank: 'Test Bank',
                }],
                transactions: [],
            },
        };

        const result = migration_v3_multi_program.up(storeData);

        expect(result.state.cards[0].programs).toHaveLength(1);
        expect(result.state.cards[0].programs[0].name).toBe('預設權益');
    });

    it('should preserve existing programs', () => {
        const storeData = {
            state: {
                cards: [{
                    id: 'card-1',
                    name: 'Test Card',
                    bank: 'Test Bank',
                    programs: [{
                        id: 'prog-1',
                        cardId: 'card-1',
                        name: 'Existing Program',
                        startDate: '2024-01-01',
                        endDate: '2024-12-31',
                        baseRateOverseas: 0.02,
                        baseRateDomestic: 0.01,
                        bonusRules: [],
                    }],
                }],
                transactions: [],
            },
        };

        const result = migration_v3_multi_program.up(storeData);

        expect(result.state.cards[0].programs).toHaveLength(1);
        expect(result.state.cards[0].programs[0].name).toBe('Existing Program');
    });

    it('should add programId to transactions without one', () => {
        const storeData = {
            state: {
                cards: [{
                    id: 'card-1',
                    name: 'Test Card',
                    bank: 'Test Bank',
                    programs: [{
                        id: 'prog-1',
                        cardId: 'card-1',
                        name: 'Program',
                        startDate: '2024-01-01',
                        endDate: '2024-12-31',
                        baseRateOverseas: 0.01,
                        baseRateDomestic: 0.01,
                        bonusRules: [],
                    }],
                }],
                transactions: [{
                    id: 'tx-1',
                    cardId: 'card-1',
                    date: '2024-06-15',
                    amount: 1000,
                }],
            },
        };

        const result = migration_v3_multi_program.up(storeData);

        expect(result.state.transactions[0].programId).toBe('prog-1');
    });
});
