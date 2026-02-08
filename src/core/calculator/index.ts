/**
 * Core Calculator Module
 * 
 * 匯出核心計算邏輯，這些類別應該是零 UI 依賴的純邏輯。
 */

export { ProgramMatcher } from './ProgramMatcher';
export {
    RewardCalculator,
    createCalculatorWithStore,
    type CalculationResult,
    type RuleBreakdown,
    type CalculationMode,
    type CumulativeSpendingCalculator
} from './RewardCalculator';
