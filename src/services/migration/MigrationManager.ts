/**
 * Migration Manager
 * 
 * 負責管理資料遷移流程，確保 App 升級時資料結構能正確遷移。
 */

import { CURRENT_VERSION, VERSION_KEY } from './versions';

export interface Migration {
    version: number;
    name: string;
    description: string;
    up: (data: any) => any;
}

export interface MigrationResult {
    fromVersion: number;
    toVersion: number;
    steps: MigrationStepResult[];
    success: boolean;
}

export interface MigrationStepResult {
    version: number;
    name: string;
    success: boolean;
    error?: string;
}

export class MigrationManager {
    private migrations: Migration[] = [];

    /**
     * 註冊遷移腳本
     */
    register(migration: Migration): void {
        this.migrations.push(migration);
        // 依版本號排序
        this.migrations.sort((a, b) => a.version - b.version);
    }

    /**
     * 取得目前儲存的資料版本
     */
    getCurrentVersion(): number {
        try {
            const stored = localStorage.getItem(VERSION_KEY);
            if (stored) {
                return parseInt(stored, 10);
            }
        } catch {
            // localStorage 不可用
        }
        // 預設為版本 1（假設既有資料是 v1）
        return 1;
    }

    /**
     * 設定資料版本
     */
    setVersion(version: number): void {
        try {
            localStorage.setItem(VERSION_KEY, version.toString());
        } catch {
            console.error('Failed to save version to localStorage');
        }
    }

    /**
     * 執行遷移
     */
    migrate(storeData: any): MigrationResult {
        const fromVersion = this.getCurrentVersion();
        const result: MigrationResult = {
            fromVersion,
            toVersion: fromVersion,
            steps: [],
            success: true,
        };

        // 若已是最新版本，直接返回
        if (fromVersion >= CURRENT_VERSION) {
            result.toVersion = CURRENT_VERSION;
            return result;
        }

        let currentData = storeData;

        // 依序執行遷移
        for (const migration of this.migrations) {
            if (migration.version > fromVersion && migration.version <= CURRENT_VERSION) {
                console.log(`[Migration] Running: ${migration.name}`);

                try {
                    currentData = migration.up(currentData);
                    result.steps.push({
                        version: migration.version,
                        name: migration.name,
                        success: true,
                    });
                    result.toVersion = migration.version;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[Migration] Failed: ${migration.name}`, error);
                    result.steps.push({
                        version: migration.version,
                        name: migration.name,
                        success: false,
                        error: errorMessage,
                    });
                    result.success = false;
                    break; // 停止後續遷移
                }
            }
        }

        // 更新版本號
        if (result.success) {
            this.setVersion(CURRENT_VERSION);
            result.toVersion = CURRENT_VERSION;
        }

        return result;
    }

    /**
     * 檢查是否需要遷移
     */
    needsMigration(): boolean {
        return this.getCurrentVersion() < CURRENT_VERSION;
    }

    /**
     * 取得待執行的遷移清單
     */
    getPendingMigrations(): Migration[] {
        const currentVersion = this.getCurrentVersion();
        return this.migrations.filter(
            m => m.version > currentVersion && m.version <= CURRENT_VERSION
        );
    }
}

// 單例
let instance: MigrationManager | null = null;

export function getMigrationManager(): MigrationManager {
    if (!instance) {
        instance = new MigrationManager();
    }
    return instance;
}
