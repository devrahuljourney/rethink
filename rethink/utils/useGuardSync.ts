import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useAppLimits } from '../context/AppLimitContext';
import { useFocusMode } from '../context/FocusModeContext';
import { useIntervention } from '../context/InterventionContext';
import { buildGuardConfig } from '../services/guard/buildGuardConfig';
import { collectGuardEvents } from '../services/guard/guardEvents';
import { guardNative } from '../services/guard/guardNative';

/**
 * Keeps the native guard in sync with limits, focus modes and intervention settings,
 * and collects outcome events whenever native reports some or the app comes to the front.
 */
export const useGuardSync = () => {
    const { limitStatuses } = useAppLimits();
    const { focusStatus } = useFocusMode();
    const { isLoaded, isInterventionEnabled, monitoredApps, gateSettings } = useIntervention();

    const config = useMemo(() => {
        const limitBlockedApps: string[] = [];
        limitStatuses.forEach((status, packageName) => {
            if (status.isBlocked) limitBlockedApps.push(packageName);
        });
        return buildGuardConfig({
            interventionEnabled: isInterventionEnabled,
            monitoredApps,
            limitBlockedApps,
            focusBlockedApps: focusStatus.isActive ? focusStatus.blockedApps : [],
            gate: gateSettings,
        });
    }, [limitStatuses, focusStatus, isInterventionEnabled, monitoredApps, gateSettings]);

    useEffect(() => {
        // Don't overwrite the persisted native config with defaults before settings load.
        if (!isLoaded) return;
        guardNative.setConfig(config).catch(error => console.error('useGuardSync: setConfig failed', error));
    }, [config, isLoaded]);

    useEffect(() => {
        const collect = () => {
            collectGuardEvents().catch(error => console.error('useGuardSync: collect failed', error));
        };
        collect();
        const unsubscribeNative = guardNative.onEventsAvailable(collect);
        const appState = AppState.addEventListener('change', state => state === 'active' && collect());
        return () => {
            unsubscribeNative();
            appState.remove();
        };
    }, []);

    return config;
};
