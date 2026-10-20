import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GateSettings } from '../services/guard/types';

/**
 * User settings for the mindful gate. Enforcement happens natively (see android/.../guard);
 * this context only owns what the user chose. useGuardSync pushes it to native.
 */
interface InterventionContextType {
    isLoaded: boolean;
    isInterventionEnabled: boolean;
    setIsInterventionEnabled: (enabled: boolean) => void;
    monitoredApps: string[];
    setMonitoredApps: (apps: string[]) => void;
    isMonitored: (packageName: string) => boolean;
    setAppMonitored: (packageName: string, monitored: boolean) => void;
    gateSettings: GateSettings;
    updateGateSettings: (updates: Partial<GateSettings>) => void;
}

const InterventionContext = createContext<InterventionContextType | undefined>(undefined);

const STORAGE_KEYS = {
    IS_ENABLED: '@intervention_enabled',
    MONITORED_APPS: '@monitored_apps',
    GATE_SETTINGS: '@gate_settings',
};

export const MONITORED_APPS_DEFAULT = [
    'com.google.android.youtube',
    'com.instagram.android',
    'com.facebook.katana',
    'com.zhiliaoapp.musically', // TikTok
    'com.twitter.android',
    'com.snapchat.android',
    'com.reddit.frontpage',
];

export const GATE_SETTINGS_DEFAULT: GateSettings = {
    breathSeconds: 8,
    graceSeconds: 60,
    askSessionLength: true,
};

const persist = (key: string, value: unknown) =>
    AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)).catch(error =>
        console.error(`InterventionContext: failed to save ${key}`, error),
    );

export const InterventionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInterventionEnabled, setEnabledState] = useState(false);
    const [monitoredApps, setMonitoredState] = useState<string[]>(MONITORED_APPS_DEFAULT);
    const [gateSettings, setGateSettingsState] = useState<GateSettings>(GATE_SETTINGS_DEFAULT);

    useEffect(() => {
        (async () => {
            try {
                const [[, enabled], [, apps], [, gate]] = await AsyncStorage.multiGet([
                    STORAGE_KEYS.IS_ENABLED,
                    STORAGE_KEYS.MONITORED_APPS,
                    STORAGE_KEYS.GATE_SETTINGS,
                ]);
                if (enabled !== null) setEnabledState(enabled === 'true');
                if (apps !== null) setMonitoredState(JSON.parse(apps));
                if (gate !== null) setGateSettingsState({ ...GATE_SETTINGS_DEFAULT, ...JSON.parse(gate) });
            } catch (error) {
                console.error('InterventionContext: Error loading state:', error);
            } finally {
                setIsLoaded(true);
            }
        })();
    }, []);

    const setIsInterventionEnabled = useCallback((enabled: boolean) => {
        setEnabledState(enabled);
        persist(STORAGE_KEYS.IS_ENABLED, String(enabled));
    }, []);

    const setMonitoredApps = useCallback((apps: string[]) => {
        setMonitoredState(apps);
        persist(STORAGE_KEYS.MONITORED_APPS, apps);
    }, []);

    const setAppMonitored = useCallback((packageName: string, monitored: boolean) => {
        setMonitoredState(current => {
            const next = monitored
                ? Array.from(new Set([...current, packageName]))
                : current.filter(pkg => pkg !== packageName);
            persist(STORAGE_KEYS.MONITORED_APPS, next);
            return next;
        });
    }, []);

    const isMonitored = useCallback(
        (packageName: string) => monitoredApps.includes(packageName),
        [monitoredApps],
    );

    const updateGateSettings = useCallback((updates: Partial<GateSettings>) => {
        setGateSettingsState(current => {
            const next = { ...current, ...updates };
            persist(STORAGE_KEYS.GATE_SETTINGS, next);
            return next;
        });
    }, []);

    return (
        <InterventionContext.Provider
            value={{
                isLoaded,
                isInterventionEnabled,
                setIsInterventionEnabled,
                monitoredApps,
                setMonitoredApps,
                isMonitored,
                setAppMonitored,
                gateSettings,
                updateGateSettings,
            }}
        >
            {children}
        </InterventionContext.Provider>
    );
};

export const useIntervention = () => {
    const context = useContext(InterventionContext);
    if (context === undefined) {
        throw new Error('useIntervention must be used within an InterventionProvider');
    }
    return context;
};
