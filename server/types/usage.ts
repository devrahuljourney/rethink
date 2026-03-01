export interface AppUsageDetail {
    name: string;
    package: string;
    usageMs: number;
    launches: number;
    category: string;
}

export interface DailyUsageSync {
    date: string;
    totalUsageMs: number;
    appBreakdown: AppUsageDetail[];
    categorySummaries: Record<string, number>;
    insightData: {
        timestamp: number;
        deviceType: string;
    };
}
