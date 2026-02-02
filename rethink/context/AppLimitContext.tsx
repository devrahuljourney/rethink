import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLimit, AppLimitStatus } from '../types/appLimits';
import { calculateLimitStatus, isLimitPaused } from '../utils/limitChecker';
import { useUsage } from './UsageContext';

interface AppLimitContextType {
    limits: AppLimit[];
    limitStatuses: Map<string, AppLimitStatus>;
    addLimit: (limit: Omit<AppLimit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateLimit: (id: string, updates: Partial<AppLimit>) => Promise<void>;
    deleteLimit: (id: string) => Promise<void>;
    pauseLimit: (id: string) => Promise<void>;
    extendLimit: (id: string, minutesToAdd: number) => Promise<void>;
    getLimitStatus: (packageName: string) => AppLimitStatus | null;
    isAppBlocked: (packageName: string) => boolean;
    refreshLimits: () => Promise<void>;
}

const AppLimitContext = createContext<AppLimitContextType | undefined>(undefined);

const STORAGE_KEY = '@app_limits';

export const AppLimitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [limits, setLimits] = useState<AppLimit[]>([]);
    const [limitStatuses, setLimitStatuses] = useState<Map<string, AppLimitStatus>>(new Map());
    const { usageData } = useUsage();

    // Load limits from storage
    useEffect(() => {
        loadLimits();
    }, []);

    // Update limit statuses when usage data changes
    useEffect(() => {
        updateLimitStatuses();
    }, [limits, usageData]);

    const loadLimits = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setLimits(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load limits:', error);
        }
    };

    const saveLimits = async (newLimits: AppLimit[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLimits));
            setLimits(newLimits);
        } catch (error) {
            console.error('Failed to save limits:', error);
        }
    };

    const updateLimitStatuses = () => {
        const newStatuses = new Map<string, AppLimitStatus>();

        limits.forEach(limit => {
            if (!limit.enabled) return;

            // Find current usage for this app
            const appUsage = usageData.find(app => app.packageName === limit.packageName);
            const currentUsageMs = appUsage?.totalTimeInForeground || 0;

            const status = calculateLimitStatus(limit, currentUsageMs);
            newStatuses.set(limit.packageName, status);
        });

        setLimitStatuses(newStatuses);
    };

    const addLimit = async (limitData: Omit<AppLimit, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newLimit: AppLimit = {
            ...limitData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await saveLimits([...limits, newLimit]);
    };

    const updateLimit = async (id: string, updates: Partial<AppLimit>) => {
        const updatedLimits = limits.map(limit =>
            limit.id === id
                ? { ...limit, ...updates, updatedAt: new Date().toISOString() }
                : limit
        );

        await saveLimits(updatedLimits);
    };

    const deleteLimit = async (id: string) => {
        const filteredLimits = limits.filter(limit => limit.id !== id);
        await saveLimits(filteredLimits);
    };

    const pauseLimit = async (id: string) => {
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);

        await updateLimit(id, {
            pausedUntil: tomorrow.toISOString(),
        });
    };

    const extendLimit = async (id: string, minutesToAdd: number) => {
        const limit = limits.find(l => l.id === id);
        if (!limit) return;

        await updateLimit(id, {
            dailyLimitMs: limit.dailyLimitMs + (minutesToAdd * 60000),
        });
    };

    const getLimitStatus = (packageName: string): AppLimitStatus | null => {
        return limitStatuses.get(packageName) || null;
    };

    const isAppBlocked = (packageName: string): boolean => {
        const status = getLimitStatus(packageName);
        return status ? status.isBlocked : false;
    };

    const refreshLimits = async () => {
        await loadLimits();
    };

    return (
        <AppLimitContext.Provider
            value={{
                limits,
                limitStatuses,
                addLimit,
                updateLimit,
                deleteLimit,
                pauseLimit,
                extendLimit,
                getLimitStatus,
                isAppBlocked,
                refreshLimits,
            }}
        >
            {children}
        </AppLimitContext.Provider>
    );
};

export const useAppLimits = () => {
    const context = useContext(AppLimitContext);
    if (!context) {
        throw new Error('useAppLimits must be used within AppLimitProvider');
    }
    return context;
};
