import { useEffect, useMemo } from 'react';
import { useAppLimits } from '../context/AppLimitContext';
import { useFocusMode } from '../context/FocusModeContext';
import { useIntervention } from '../context/InterventionContext';
import { syncBlockedAppsToNative } from './nativeBridge';

/**
 * Hook to synchronize blocked apps from all contexts (Limits, Focus Mode, Interventions) to the native service.
 */
export const useBlockingSync = () => {
    const { limitStatuses } = useAppLimits();
    const { focusStatus } = useFocusMode();
    const { monitoredApps, isInterventionEnabled } = useIntervention();

    const blockedPackages = useMemo(() => {
        const blockedSet = new Set<string>();

        // 1. Add apps blocked by time limits
        limitStatuses.forEach((status: any, packageName: string) => {
            if (status.isBlocked) {
                blockedSet.add(packageName);
            }
        });

        // 2. Add apps blocked by focus mode
        if (focusStatus.isActive) {
            focusStatus.blockedApps.forEach((packageName: string) => {
                blockedSet.add(packageName);
            });
        }

        // 3. Add apps monitored for interventions (Take a Breath)
        if (isInterventionEnabled) {
            monitoredApps.forEach((packageName: string) => {
                blockedSet.add(packageName);
            });
        }

        return Array.from(blockedSet);
    }, [limitStatuses, focusStatus, monitoredApps, isInterventionEnabled]);

    useEffect(() => {
        syncBlockedAppsToNative(blockedPackages);
    }, [blockedPackages]);

    return blockedPackages;
};
