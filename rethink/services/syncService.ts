import { queryUsage } from './usage/usageNative';
import { getPreviousDayStart, getPreviousDayEnd } from '../utils/timeUtils';
import { getAppCategory } from '../utils/categoryMapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { syncYesterdayUsageAPI } from './usageAPI';

const SYNC_KEY = 'last_usage_sync_date';

export const syncYesterdayUsage = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const lastSync = await AsyncStorage.getItem(SYNC_KEY);

        if (lastSync === today) {
            console.log('SyncService: Already synced today');
            return;
        }

        const startMs = getPreviousDayStart();
        const endMs = getPreviousDayEnd();

        const usageArray = await queryUsage(startMs, endMs);

        // Filter and structure data for LangChain analysis
        const dailySummary = {
            date: new Date(startMs).toISOString().split('T')[0],
            totalUsageMs: 0,
            appBreakdown: [] as any[],
            categorySummaries: {} as Record<string, number>,
            insightData: {
                timestamp: Date.now(),
                deviceType: 'android',
            }
        };

        const processedApps = usageArray
            .filter((app: any) => app.totalTimeInForeground > 0)
            .map((app: any) => {
                const category = getAppCategory(app.packageName);
                const appName = app.appName || app.packageName.split('.').pop();

                dailySummary.totalUsageMs += app.totalTimeInForeground;
                dailySummary.categorySummaries[category] = (dailySummary.categorySummaries[category] || 0) + app.totalTimeInForeground;

                return {
                    name: appName,
                    package: app.packageName,
                    usageMs: app.totalTimeInForeground,
                    launches: app.appLaunchCount || 0,
                    category: category
                };
            })
            .sort((a, b) => b.usageMs - a.usageMs);

        dailySummary.appBreakdown = processedApps;

        console.log(`SyncService: Data prepared for ${dailySummary.date}. Total apps: ${processedApps.length}`);
        console.log(`SyncService: Total screen time: ${(dailySummary.totalUsageMs / 1000 / 60).toFixed(1)} minutes`);

        // API Call to save data via usageAPI service
        const response = await syncYesterdayUsageAPI(dailySummary);

        if (response.success) {
            await AsyncStorage.setItem(SYNC_KEY, today);
            console.log('SyncService: Successfully synced usage for', dailySummary.date);
        } else {
            console.error('SyncService: Sync failed:', response.message);
        }
    } catch (error) {
        // Not logged in yet; sync will run again after login
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.log('SyncService: Skipped, not logged in');
            return;
        }
        console.error('SyncService: Error during sync:', error);
    }
};
