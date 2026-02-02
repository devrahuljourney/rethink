import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusMode, FocusModeStatus, FocusSchedule } from '../types/appLimits';
import { isWithinSchedule } from '../utils/limitChecker';

interface FocusModeContextType {
    focusModes: FocusMode[];
    activeFocusMode: FocusMode | null;
    focusStatus: FocusModeStatus;
    addFocusMode: (mode: Omit<FocusMode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateFocusMode: (id: string, updates: Partial<FocusMode>) => Promise<void>;
    deleteFocusMode: (id: string) => Promise<void>;
    toggleFocusMode: (id: string, enabled: boolean) => Promise<void>;
    isAppBlockedByFocus: (packageName: string) => boolean;
    refreshFocusModes: () => Promise<void>;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

const STORAGE_KEY = '@focus_modes';

export const FocusModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [focusModes, setFocusModes] = useState<FocusMode[]>([]);
    const [activeFocusMode, setActiveFocusMode] = useState<FocusMode | null>(null);
    const [focusStatus, setFocusStatus] = useState<FocusModeStatus>({
        isActive: false,
        blockedApps: [],
    });

    // Load focus modes from storage
    useEffect(() => {
        loadFocusModes();
    }, []);

    // Check active focus mode every minute
    useEffect(() => {
        checkActiveFocusMode();
        const interval = setInterval(checkActiveFocusMode, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [focusModes]);

    const loadFocusModes = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setFocusModes(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load focus modes:', error);
        }
    };

    const saveFocusModes = async (newModes: FocusMode[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newModes));
            setFocusModes(newModes);
        } catch (error) {
            console.error('Failed to save focus modes:', error);
        }
    };

    const checkActiveFocusMode = () => {
        // Find the first enabled focus mode that's currently active
        const activeMode = focusModes.find(mode => {
            if (!mode.enabled) return false;

            // Check if any schedule is currently active
            return mode.schedules.some(schedule => {
                if (!schedule.enabled) return false;
                return isWithinSchedule(schedule.startTime, schedule.endTime, schedule.days);
            });
        });

        setActiveFocusMode(activeMode || null);

        if (activeMode) {
            setFocusStatus({
                isActive: true,
                currentMode: activeMode,
                blockedApps: activeMode.blockedApps,
                reason: `${activeMode.name || 'Focus Mode'} is active`,
            });
        } else {
            setFocusStatus({
                isActive: false,
                blockedApps: [],
            });
        }
    };

    const addFocusMode = async (modeData: Omit<FocusMode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        const newMode: FocusMode = {
            ...modeData,
            id: Date.now().toString(),
            userId: 'local', // Will be replaced with actual user ID when backend is integrated
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await saveFocusModes([...focusModes, newMode]);
    };

    const updateFocusMode = async (id: string, updates: Partial<FocusMode>) => {
        const updatedModes = focusModes.map(mode =>
            mode.id === id
                ? { ...mode, ...updates, updatedAt: new Date().toISOString() }
                : mode
        );

        await saveFocusModes(updatedModes);
    };

    const deleteFocusMode = async (id: string) => {
        const filteredModes = focusModes.filter(mode => mode.id !== id);
        await saveFocusModes(filteredModes);
    };

    const toggleFocusMode = async (id: string, enabled: boolean) => {
        await updateFocusMode(id, { enabled });
    };

    const isAppBlockedByFocus = (packageName: string): boolean => {
        if (!focusStatus.isActive || !activeFocusMode) return false;

        // Check if app is whitelisted (allowed during focus)
        if (activeFocusMode.whitelistedApps.includes(packageName)) {
            return false;
        }

        // Check if app is in blocked list
        return activeFocusMode.blockedApps.includes(packageName);
    };

    const refreshFocusModes = async () => {
        await loadFocusModes();
    };

    return (
        <FocusModeContext.Provider
            value={{
                focusModes,
                activeFocusMode,
                focusStatus,
                addFocusMode,
                updateFocusMode,
                deleteFocusMode,
                toggleFocusMode,
                isAppBlockedByFocus,
                refreshFocusModes,
            }}
        >
            {children}
        </FocusModeContext.Provider>
    );
};

export const useFocusMode = () => {
    const context = useContext(FocusModeContext);
    if (!context) {
        throw new Error('useFocusMode must be used within FocusModeProvider');
    }
    return context;
};
