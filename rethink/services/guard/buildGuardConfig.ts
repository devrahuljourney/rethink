import type { GateSettings, GuardConfig, GuardRule } from './types';

interface GuardInputs {
    interventionEnabled: boolean;
    monitoredApps: string[];
    limitBlockedApps: string[];
    focusBlockedApps: string[];
    gate: GateSettings;
}

/**
 * Pure mapping from app state to the native guard config. Each feature contributes
 * its own rule; native evaluates hard blocks before interventions.
 */
export const buildGuardConfig = ({
    interventionEnabled,
    monitoredApps,
    limitBlockedApps,
    focusBlockedApps,
    gate,
}: GuardInputs): GuardConfig => {
    const rules: GuardRule[] = [];

    if (limitBlockedApps.length) {
        rules.push({ id: 'limits', type: 'block', reason: 'limit', packages: limitBlockedApps });
    }
    if (focusBlockedApps.length) {
        rules.push({ id: 'focus', type: 'block', reason: 'focus', packages: focusBlockedApps });
    }
    if (interventionEnabled && monitoredApps.length) {
        rules.push({ id: 'intervention', type: 'intervention', packages: monitoredApps });
    }

    return { rules, gate };
};
