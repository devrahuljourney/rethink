import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { guardNative } from '../services/guard/guardNative';

/**
 * Whether the native guard can enforce anything. Re-checked whenever the app returns to the
 * foreground, e.g. after the user toggled the service in system settings.
 */
export const useGuardStatus = () => {
    const [isServiceEnabled, setIsServiceEnabled] = useState<boolean | null>(null);

    const refresh = useCallback(async () => {
        setIsServiceEnabled(await guardNative.isServiceEnabled());
    }, []);

    useEffect(() => {
        refresh();
        const subscription = AppState.addEventListener('change', state => state === 'active' && refresh());
        return () => subscription.remove();
    }, [refresh]);

    return { isServiceEnabled, refresh };
};
