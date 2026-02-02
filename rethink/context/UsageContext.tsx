import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { queryAndAggregateUsageStats, checkForPermission } from '@brighthustle/react-native-usage-stats-manager';
import { AppUsageStats, FilterRange } from '../types/usage';
import { getStartOfDay, getPreviousDayStart, getPreviousDayEnd } from '../utils/timeUtils';

interface UsageContextType {
    usageData: AppUsageStats[];
    totalTodayMs: number;
    todayLauches: number;
    usageComparison: number; // Percentage change vs yesterday
    activeRange: FilterRange;
    setActiveRange: (range: FilterRange) => void;
    refreshUsage: () => Promise<void>;
    isLoading: boolean;
    hasPermission: boolean | null;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

 // Comprehensive filter for system/common apps
const BLACKLISTED_PACKAGES = [
    'com.android.launcher',
    'com.google.android.googlequicksearchbox',
    'com.android.systemui',
    'com.android.vending',
    'com.google.android.gms',
    'android',
    'com.miui.home',
    'com.miui.securitycenter',
    'com.android.incallui',
    'com.google.android.deskclock',
    'com.android.phone',
    'com.sec.android.app.launcher',
    'com.google.android.apps.nexuslauncher',
    'com.huawei.android.launcher',
];

const BLACKLISTED_PREFIXES = [
    'com.android.providers.',
    'com.google.android.apps.internal.',
    'com.xiaomi.',
    'com.miui.',
    'com.samsung.',
];

const FRIENDLY_NAME_MAP: Record<string, string> = {
    'com.google.android.youtube': 'YouTube',
    'com.google.android.apps.photos': 'Photos',
    'com.instagram.android': 'Instagram',
    'com.facebook.katana': 'Facebook',
    'com.zhiliaoapp.musically': 'TikTok',
    'com.whatsapp': 'WhatsApp',
    'com.twitter.android': 'X (Twitter)',
    'com.linkedin.android': 'LinkedIn',
    'com.spotify.music': 'Spotify',
    'com.netflix.mediaclient': 'Netflix',
    'com.amazon.mShop.android.shopping': 'Amazon',
};

const getFriendlyName = (packageName: string, appName?: string) => {
    if (FRIENDLY_NAME_MAP[packageName]) return FRIENDLY_NAME_MAP[packageName];
    if (appName && !appName.includes('.')) return appName;

    // Clean up package name as fallback
    const parts = packageName.split('.');
    const lastPart = parts[parts.length - 1];

    // Common cleanup
    return lastPart
        .replace(/_/g, ' ')
        .replace(/^[a-z]/, (L) => L.toUpperCase())
        .replace(/([A-Z])/g, ' $1')
        .trim();
};

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [usageData, setUsageData] = useState<AppUsageStats[]>([]);
    const [totalTodayMs, setTotalTodayMs] = useState(0);
    const [todayLauches, setTodayLauches] = useState(0);
    const [usageComparison, setUsageComparison] = useState(0);
    const [activeRange, setActiveRange] = useState<FilterRange>('DAILY');
    const [isLoading, setIsLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const fetchUsage = useCallback(async () => {
        if (Platform.OS !== 'android') return;

        setIsLoading(true);
        try {
            const isGranted = await checkForPermission();
            setHasPermission(isGranted);
            if (!isGranted) return;

            const now = Date.now();
            const todayStart = getStartOfDay();

            // 1. Fetch Today's Detailed Stats
            let startMs = todayStart;
            if (activeRange === 'WEEKLY') {
                startMs = todayStart - 6 * 24 * 60 * 60 * 1000;
            } else if (activeRange === 'MONTHLY') {
                startMs = todayStart - 29 * 24 * 60 * 60 * 1000;
            }

            const rawResult = await queryAndAggregateUsageStats(startMs, now);
            const usageArray: AppUsageStats[] = Object.values(rawResult as any);

            const filtered = usageArray
                .filter(app => (
                    app.totalTimeInForeground > 0 &&
                    !app.isSystem &&
                    !BLACKLISTED_PACKAGES.includes(app.packageName)
                ))
                .map(app => ({
                    ...app,
                    appName: app.appName || app.packageName.split('.').pop()?.replace(/^[a-z]/, (L) => L.toUpperCase()) || 'Unknown'
                }))
                .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);

            setUsageData(filtered);

            // 2. Calculate Totals from Filtered Data (matching the list exactly)
            const rangeTotalMs = filtered.reduce((acc, curr) => acc + curr.totalTimeInForeground, 0);
            const rangeTotalLaunches = filtered.reduce((acc, curr) => acc + (curr.appLaunchCount || 0), 0);

            setTotalTodayMs(rangeTotalMs);
            setTodayLauches(rangeTotalLaunches);

            // 3. Fetch Yesterday's Stats for Comparison (Always Daily comparison for better addictive hook)
            const yesterdayStart = getPreviousDayStart();
            const yesterdayEnd = getPreviousDayEnd();
            const yesterdayResult = await queryAndAggregateUsageStats(yesterdayStart, yesterdayEnd);
            const yesterdayArray: AppUsageStats[] = Object.values(yesterdayResult as any);
            const totalYesterday = yesterdayArray
                .filter(app => !BLACKLISTED_PACKAGES.includes(app.packageName))
                .reduce((acc, curr) => acc + curr.totalTimeInForeground, 0);

            // Fetch absolute today total for comparison
            const absoluteTodayResult = activeRange === 'DAILY' ? rawResult : await queryAndAggregateUsageStats(todayStart, now);
            const absoluteTodayArray: AppUsageStats[] = Object.values(absoluteTodayResult as any);
            const absoluteTodayTotal = absoluteTodayArray
                .filter(app => !BLACKLISTED_PACKAGES.includes(app.packageName))
                .reduce((acc, curr) => acc + curr.totalTimeInForeground, 0);

            if (totalYesterday > 0) {
                const percentChange = ((absoluteTodayTotal - totalYesterday) / totalYesterday) * 100;
                setUsageComparison(percentChange);
            } else {
                setUsageComparison(0);
            }

        } catch (error) {
            console.error('UsageContext: Error fetching usage:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeRange]);

    useEffect(() => {
        fetchUsage();

        const subscription = import('react-native').then(({ AppState }) => AppState.addEventListener('change', (state) => {
            if (state === 'active') fetchUsage();
        }));

        return () => {
            subscription.then(sub => sub.remove());
        };
    }, [fetchUsage]);

    return (
        <UsageContext.Provider
            value={{
                usageData,
                totalTodayMs,
                todayLauches,
                usageComparison,
                activeRange,
                setActiveRange,
                refreshUsage: fetchUsage,
                isLoading,
                hasPermission,
            }}
        >
            {children}
        </UsageContext.Provider>
    );
};

export const useUsage = () => {
    const context = useContext(UsageContext);
    if (context === undefined) {
        throw new Error('useUsage must be used within a UsageProvider');
    }
    return context;
};
