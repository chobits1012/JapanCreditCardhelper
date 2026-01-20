/**
 * useBonusRules Hook
 * 
 * Custom hook for managing BonusRuleState array in CardDataForm.
 * Encapsulates state, CRUD operations, and synchronization logic.
 */

import { useState, useEffect, useCallback } from 'react';
import type { BonusRule } from '../types';
import {
    type BonusRuleState,
    createBonusRuleStatesFromRules,
    createEmptyBonusRuleState,
} from '../utils/bonusRuleHelpers';

interface UseBonusRulesOptions {
    /** Initial bonus rules from an existing card/program */
    initialRules?: BonusRule[];
    /** Dependencies to trigger re-sync (e.g., card ID, rules count) */
    syncDeps?: any[];
}

interface UseBonusRulesReturn {
    /** Current bonus rule states for form binding */
    bonusRules: BonusRuleState[];
    /** Set bonus rules directly (e.g., from template auto-fill) */
    setBonusRules: React.Dispatch<React.SetStateAction<BonusRuleState[]>>;
    /** Add a new empty rule at the top */
    addRule: () => void;
    /** Remove a rule by ID (stores it for undo) */
    removeRule: (id: string) => void;
    /** Update a single field of a rule */
    updateRule: (id: string, field: keyof BonusRuleState, value: any) => void;
    /** Toggle a payment method on/off for a rule */
    toggleRulePaymentMethod: (ruleId: string, method: string) => void;
    /** The last deleted rule (for undo functionality) */
    lastDeletedRule: BonusRuleState | null;
    /** Undo the last delete operation */
    undoLastDelete: () => void;
    /** Clear the deleted rule (e.g., after timeout) */
    clearDeletedRule: () => void;
}

/**
 * Hook for managing bonus rules state in CardDataForm.
 * 
 * @param options - Configuration options
 * @returns Object containing state and handlers
 */
export function useBonusRules(options: UseBonusRulesOptions = {}): UseBonusRulesReturn {
    const { initialRules, syncDeps = [] } = options;

    // Initialize state from initial rules (if editing an existing card)
    const [bonusRules, setBonusRules] = useState<BonusRuleState[]>(() =>
        initialRules ? createBonusRuleStatesFromRules(initialRules) : []
    );

    // Track the last deleted rule for undo functionality
    const [lastDeletedRule, setLastDeletedRule] = useState<BonusRuleState | null>(null);

    // Reinitialize when sync dependencies change (e.g., when initialCard changes)
    useEffect(() => {
        if (initialRules) {
            setBonusRules(createBonusRuleStatesFromRules(initialRules));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, syncDeps);

    // Add a new empty rule at the top of the list
    const addRule = useCallback(() => {
        setBonusRules(prev => [createEmptyBonusRuleState(), ...prev]);
    }, []);

    // Remove a rule by ID and store it for potential undo
    const removeRule = useCallback((id: string) => {
        setBonusRules(prev => {
            const ruleToDelete = prev.find(r => r.id === id);
            if (ruleToDelete) {
                setLastDeletedRule(ruleToDelete);
            }
            return prev.filter(r => r.id !== id);
        });
    }, []);

    // Undo the last delete operation
    const undoLastDelete = useCallback(() => {
        if (lastDeletedRule) {
            setBonusRules(prev => [lastDeletedRule, ...prev]);
            setLastDeletedRule(null);
        }
    }, [lastDeletedRule]);

    // Clear the deleted rule (e.g., after timeout or manual dismiss)
    const clearDeletedRule = useCallback(() => {
        setLastDeletedRule(null);
    }, []);

    // Update a single field of a rule
    const updateRule = useCallback((id: string, field: keyof BonusRuleState, value: any) => {
        setBonusRules(prev => prev.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        ));
    }, []);

    // Toggle a payment method on/off for a rule
    const toggleRulePaymentMethod = useCallback((ruleId: string, method: string) => {
        setBonusRules(prev => prev.map(r => {
            if (r.id === ruleId) {
                const current = r.paymentMethods;
                const next = current.includes(method)
                    ? current.filter(m => m !== method)
                    : [...current, method];
                return { ...r, paymentMethods: next };
            }
            return r;
        }));
    }, []);

    return {
        bonusRules,
        setBonusRules,
        addRule,
        removeRule,
        updateRule,
        toggleRulePaymentMethod,
        lastDeletedRule,
        undoLastDelete,
        clearDeletedRule,
    };
}
