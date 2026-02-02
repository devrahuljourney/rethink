import { useEffect, useMemo } from 'react';
import { useAppLimits } from '../context/AppLimitContext';
import { useFocusMode } from '../context/FocusModeContext';
import { syncBlockedAppsToNative } from './nativeBridge';

/**
 * Hook to synchronize blocked apps from all contexts (Limits, Focus Mode) to the native service.
 */
export const useBlockingSync = () => {
    const { limitStatuses } = useAppLimits();
    const { focusStatus } = useFocusMode();

    const blockedPackages = useMemo(() => {
        const blockedSet = new Set<string>();

        // 1. Add apps blocked by time limits
        limitStatuses.forEach((status, packageName) => {
            if (status.isBlocked) {
                blockedSet.add(packageName);
            }
        });

        // 2. Add apps blocked by focus mode
        if (focusStatus.isActive) {
            focusStatus.blockedApps.forEach(packageName => {
                blockedSet.add(packageName);
            });
        }

        return Array.from(blockedSet);
    }, [limitStatuses, focusStatus]);

    useEffect(() => {
        syncBlockedAppsToNative(blockedPackages);
    }, [blockedPackages]);

    return blockedPackages;
};
