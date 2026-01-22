export interface AppUsageStats {
    packageName: string;
    totalTimeInForeground: number;
    lastTimeUsed: number;
    appLaunchCount: number;
    isSystem: boolean;
    appName?: string;
}

export type FilterRange = 'DAILY' | 'WEEKLY' | 'MONTHLY';
