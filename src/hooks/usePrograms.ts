import { useState, useCallback, useEffect } from 'react';
import type { RewardProgram } from '../types';
import { format, addYears } from 'date-fns';
import type { BonusRuleState } from '../utils/bonusRuleHelpers';
import { createBonusRuleStatesFromRules, convertToDomainBonusRules } from '../utils/bonusRuleHelpers';
import { createBonusRuleStateFromPreset, BONUS_PRESETS } from '../data/bonusPresets';

// Form state for a program
export interface ProgramFormState {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    baseRateOverseas: string;
    baseRateDomestic: string;
    bonusRules: BonusRuleState[];
}

interface UseProgramsOptions {
    initialPrograms?: RewardProgram[];
    cardId?: string;
}

export function usePrograms({ initialPrograms, cardId }: UseProgramsOptions = {}) {
    // Convert domain programs to form state
    const initializeProgramFormStates = useCallback((programs?: RewardProgram[]): ProgramFormState[] => {
        if (!programs || programs.length === 0) {
            // Create default program
            return [{
                id: crypto.randomUUID(),
                name: '預設權益',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(addYears(new Date(), 2), 'yyyy-MM-dd'),
                baseRateOverseas: '1',
                baseRateDomestic: '1',
                bonusRules: []
            }];
        }

        return programs.map(prog => ({
            id: prog.id,
            name: prog.name,
            startDate: prog.startDate,
            endDate: prog.endDate,
            baseRateOverseas: (prog.baseRateOverseas * 100).toString(),
            baseRateDomestic: (prog.baseRateDomestic * 100).toString(),
            bonusRules: createBonusRuleStatesFromRules(prog.bonusRules)
        }));
    }, []);

    const [programs, setPrograms] = useState<ProgramFormState[]>(() =>
        initializeProgramFormStates(initialPrograms)
    );
    const [expandedProgramId, setExpandedProgramId] = useState<string | null>(
        programs[0]?.id || null
    );

    // Sync with initialPrograms changes (e.g., when editing a different card)
    useEffect(() => {
        if (cardId) {
            const newStates = initializeProgramFormStates(initialPrograms);
            setPrograms(newStates);
            setExpandedProgramId(newStates[0]?.id || null);
        }
    }, [cardId, initialPrograms?.length, initializeProgramFormStates]);

    // Add a new program
    const addProgram = useCallback(() => {
        const newProgram: ProgramFormState = {
            id: crypto.randomUUID(),
            name: '新權益期間',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
            baseRateOverseas: '1',
            baseRateDomestic: '1',
            bonusRules: []
        };
        setPrograms(prev => [...prev, newProgram]);
        setExpandedProgramId(newProgram.id);
    }, []);

    // Remove a program
    const removeProgram = useCallback((programId: string) => {
        setPrograms(prev => {
            const filtered = prev.filter(p => p.id !== programId);
            // Ensure at least one program exists
            if (filtered.length === 0) {
                return prev;
            }
            return filtered;
        });
        setExpandedProgramId(prev => prev === programId ? programs[0]?.id || null : prev);
    }, [programs]);

    // Update a program field
    const updateProgram = useCallback((programId: string, field: string, value: string) => {
        setPrograms(prev => prev.map(p =>
            p.id === programId ? { ...p, [field]: value } : p
        ));
    }, []);

    // Toggle expanded state
    const toggleExpanded = useCallback((programId: string) => {
        setExpandedProgramId(prev => prev === programId ? null : programId);
    }, []);

    // Bonus rule operations for a specific program
    const addBonusRule = useCallback((programId: string) => {
        const newRule: BonusRuleState = {
            id: crypto.randomUUID(),
            name: '',
            rate: '3',
            capAmount: '',
            capAmountCurrency: 'TWD',
            capPeriod: 'monthly',
            checkJapan: false,
            requiresRegistration: false,
            specificMerchants: '',
            region: 'japan',
            paymentMethods: [],
            minAmount: '',
            minAmountCurrency: 'TWD',
            minAmountType: 'per_transaction',
            startDate: '',
            endDate: '',
            createdAt: Date.now()
        };
        setPrograms(prev => prev.map(p =>
            p.id === programId
                ? { ...p, bonusRules: [newRule, ...p.bonusRules] }
                : p
        ));
    }, []);

    const removeBonusRule = useCallback((programId: string, ruleId: string) => {
        setPrograms(prev => prev.map(p =>
            p.id === programId
                ? { ...p, bonusRules: p.bonusRules.filter(r => r.id !== ruleId) }
                : p
        ));
    }, []);

    const updateBonusRule = useCallback((
        programId: string,
        ruleId: string,
        field: string,
        value: string | string[] | boolean
    ) => {
        setPrograms(prev => prev.map(p =>
            p.id === programId
                ? {
                    ...p,
                    bonusRules: p.bonusRules.map(r =>
                        r.id === ruleId ? { ...r, [field]: value } : r
                    )
                }
                : p
        ));
    }, []);

    const toggleBonusRulePaymentMethod = useCallback((programId: string, ruleId: string, method: string) => {
        setPrograms(prev => prev.map(p => {
            if (p.id !== programId) return p;
            return {
                ...p,
                bonusRules: p.bonusRules.map(r => {
                    if (r.id !== ruleId) return r;
                    const current = r.paymentMethods || [];
                    const newMethods = current.includes(method)
                        ? current.filter(m => m !== method)
                        : [...current, method];
                    return { ...r, paymentMethods: newMethods };
                })
            };
        }));
    }, []);

    const applyPreset = useCallback((programId: string, presetId: string) => {
        const preset = BONUS_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        const newRule = createBonusRuleStateFromPreset(preset);
        setPrograms(prev => prev.map(p =>
            p.id === programId
                ? { ...p, bonusRules: [newRule, ...p.bonusRules] }
                : p
        ));
    }, []);

    // Convert form states back to domain programs
    const toDomainPrograms = useCallback((newCardId: string): RewardProgram[] => {
        return programs.map(p => ({
            id: p.id,
            cardId: newCardId,
            name: p.name,
            startDate: p.startDate,
            endDate: p.endDate,
            baseRateOverseas: parseFloat(p.baseRateOverseas) / 100,
            baseRateDomestic: parseFloat(p.baseRateDomestic) / 100,
            bonusRules: convertToDomainBonusRules(p.bonusRules)
        }));
    }, [programs]);

    return {
        programs,
        setPrograms,
        expandedProgramId,
        addProgram,
        removeProgram,
        updateProgram,
        toggleExpanded,
        addBonusRule,
        removeBonusRule,
        updateBonusRule,
        toggleBonusRulePaymentMethod,
        applyPreset,
        toDomainPrograms
    };
}
