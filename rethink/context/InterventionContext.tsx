import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PermissionManager from '../utils/PermissionManager';

const { AppEventModule } = NativeModules;
const eventEmitter = AppEventModule ? new NativeEventEmitter(AppEventModule) : null;

interface InterventionContextType {
    isInterventionEnabled: boolean;
    setIsInterventionEnabled: (enabled: boolean) => void;
    monitoredApps: string[];
    setMonitoredApps: (apps: string[]) => void;
    isIntervening: boolean;
    currentTriggerApp: string | null;
    resetIntervention: () => void;
}

const InterventionContext = createContext<InterventionContextType | undefined>(undefined);

const STORAGE_KEYS = {
    IS_ENABLED: '@intervention_enabled',
    MONITORED_APPS: '@monitored_apps',
};

export const MONITORED_APPS_DEFAULT = [
    'com.google.android.youtube',
    'com.google.android.apps.photos',
    'com.instagram.android',
    'com.facebook.katana',
    'com.zhiliaoapp.musically', // TikTok
];

export const InterventionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInterventionEnabled, setIsInterventionEnabledState] = useState(false);
    const [monitoredApps, setMonitoredAppsState] = useState<string[]>(MONITORED_APPS_DEFAULT);
    const [isIntervening, setIsIntervening] = useState(false);
    const [currentTriggerApp, setCurrentTriggerApp] = useState<string | null>(null);

    // Load persisted state
    useEffect(() => {
        const loadState = async () => {
            try {
                const enabled = await AsyncStorage.getItem(STORAGE_KEYS.IS_ENABLED);
                if (enabled !== null) {
                    setIsInterventionEnabledState(enabled === 'true');
                }

                const apps = await AsyncStorage.getItem(STORAGE_KEYS.MONITORED_APPS);
                if (apps !== null) {
                    setMonitoredAppsState(JSON.parse(apps));
                }

                // Check if we were launched due to an intervention
                if (AppEventModule && AppEventModule.getInitialTriggerApp) {
                    const initialApp = await AppEventModule.getInitialTriggerApp();
                    if (initialApp) {
                        console.log('Context: Detected initial intervention for:', initialApp);
                        setCurrentTriggerApp(initialApp);
                        setIsIntervening(true);
                    }
                }
            } catch (error) {
                console.error('InterventionContext: Error loading state:', error);
            }
        };
        loadState();
    }, []);

    const setIsInterventionEnabled = async (enabled: boolean) => {
        setIsInterventionEnabledState(enabled);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.IS_ENABLED, String(enabled));
        } catch (error) {
            console.error('InterventionContext: Error saving enabled state:', error);
        }
    };

    const setMonitoredApps = async (apps: string[]) => {
        setMonitoredAppsState(apps);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.MONITORED_APPS, JSON.stringify(apps));
        } catch (error) {
            console.error('InterventionContext: Error saving monitored apps:', error);
        }
    };

    const resetIntervention = useCallback(() => {
        setIsIntervening(false);
        setCurrentTriggerApp(null);
    }, []);

    const handleAppForegroundChange = useCallback((packageName: string) => {
        if (!isInterventionEnabled) return;

        // If we are currently in Rethink, don't trigger anything but also don't reset
        if (packageName === 'com.rethink') {
            console.log('Context: App is in Rethink, skipping triggering');
            return;
        }

        // Check if the foreground app is in the monitored list
        if (monitoredApps.includes(packageName)) {
            // Avoid double triggering for the same app if we are already intervening
            if (isIntervening && currentTriggerApp === packageName) return;

            console.log(`Intervention triggered for: ${packageName}`);
            setCurrentTriggerApp(packageName);
            setIsIntervening(true);

            if (AppEventModule) {
                AppEventModule.blockApp(packageName);
            }
        } else {
            // If the user switched to a DIFFERENT, un-monitored app, reset the flag
            // This ensures that if they open YouTube again later, it triggers.
            if (isIntervening) {
                console.log(`Context: User moved to non-monitored app (${packageName}), resetting intervention flag.`);
                resetIntervention();
            }
        }
    }, [isInterventionEnabled, monitoredApps, isIntervening, currentTriggerApp, resetIntervention]);

    useEffect(() => {
        if (Platform.OS !== 'android' || !eventEmitter) return;

        const subscription = eventEmitter.addListener(
            'APP_FOREGROUND_CHANGED',
            handleAppForegroundChange
        );

        return () => {
            subscription.remove();
        };
    }, [handleAppForegroundChange]);

    return (
        <InterventionContext.Provider
            value={{
                isInterventionEnabled,
                setIsInterventionEnabled,
                monitoredApps,
                setMonitoredApps,
                isIntervening,
                currentTriggerApp,
                resetIntervention,
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
