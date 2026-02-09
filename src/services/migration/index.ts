/**
 * Migration Service
 * 
 * 匯出遷移相關服務。
 */

export { MigrationManager, getMigrationManager, type Migration, type MigrationResult } from './MigrationManager';
export { DATA_VERSIONS, CURRENT_VERSION, VERSION_KEY } from './versions';
export { migration_v3_multi_program } from './migrations/v3_multi_program';
export { migration_v4_fixed_reward } from './migrations/v4_fixed_reward';

import { getMigrationManager } from './MigrationManager';
import { migration_v3_multi_program } from './migrations/v3_multi_program';
import { migration_v4_fixed_reward } from './migrations/v4_fixed_reward';

/**
 * 初始化遷移系統（註冊所有遷移腳本）
 */
export function initMigrationSystem(): void {
    const manager = getMigrationManager();
    manager.register(migration_v3_multi_program);
    manager.register(migration_v4_fixed_reward);
}

/**
 * 執行資料遷移（如需要）
 */
export function runMigrationIfNeeded(storeData: any): { data: any; migrated: boolean } {
    const manager = getMigrationManager();

    if (!manager.needsMigration()) {
        return { data: storeData, migrated: false };
    }

    console.log('[Migration] Starting migration...');
    const result = manager.migrate(storeData);

    if (result.success) {
        console.log(`[Migration] Completed: v${result.fromVersion} → v${result.toVersion}`);
        result.steps.forEach(step => {
            console.log(`  ✓ ${step.name}`);
        });
    } else {
        console.error('[Migration] Failed!');
        result.steps.forEach(step => {
            if (step.success) {
                console.log(`  ✓ ${step.name}`);
            } else {
                console.error(`  ✗ ${step.name}: ${step.error}`);
            }
        });
    }

    return { data: storeData, migrated: result.success };
}
