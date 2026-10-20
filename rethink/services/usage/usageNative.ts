import { NativeModules, Platform } from 'react-native';
import type { AppUsageStats } from '../../types/usage';

const { UsageModule } = NativeModules;

/**
 * Per-app screen time for [startMs, endMs], computed natively from raw usage events so it
 * matches Digital Wellbeing. `totalTimeInForeground` is in milliseconds.
 */
export const queryUsage = async (startMs: number, endMs: number): Promise<AppUsageStats[]> => {
    if (Platform.OS !== 'android') return [];
    if (!UsageModule) {
        // A JS bundle newer than the installed native build: fail loudly instead of reporting 0.
        throw new Error('UsageModule is not installed. Rebuild the app (npx react-native run-android).');
    }
    const apps: Omit<AppUsageStats, 'isSystem'>[] = await UsageModule.queryUsage(startMs, endMs);
    return apps.map(app => ({ ...app, isSystem: false }));
};
