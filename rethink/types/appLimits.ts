export enum AppCategory {
    SOCIAL = 'Social',
    ENTERTAINMENT = 'Entertainment',
    PRODUCTIVITY = 'Productivity',
    EDUCATION = 'Education',
    COMMUNICATION = 'Communication',
    GAMES = 'Games',
    SHOPPING = 'Shopping',
    NEWS = 'News',
    HEALTH = 'Health',
    FINANCE = 'Finance',
    UTILITIES = 'Utilities',
    OTHER = 'Other',
}

export interface AppLimit {
    id: string;
    packageName: string;
    appName?: string;
    dailyLimitMs: number; // Daily limit in milliseconds
    warningThresholdMs: number; // Warning threshold (e.g., 5 min before limit)
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    pausedUntil?: string; // Timestamp when pause expires
}

export interface AppLimitStatus {
    packageName: string;
    currentUsageMs: number; // Current usage today
    limitMs: number; // Configured limit
    remainingMs: number; // Time remaining
    percentageUsed: number; // 0-100
    isWarning: boolean; // True if within warning threshold
    isBlocked: boolean; // True if limit exceeded
    isPaused: boolean; // True if limit is paused for today
}

export interface FocusSchedule {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    days: number[]; // 0-6 (Sunday-Saturday)
}

export interface FocusMode {
    id: string;
    userId: string;
    enabled: boolean;
    schedules: FocusSchedule[];
    blockedApps: string[]; // Package names
    whitelistedApps: string[]; // Package names (allowed during focus)
    name?: string; // e.g., "Work Mode", "Sleep Mode"
    createdAt: string;
    updatedAt: string;
}

export interface FocusModeStatus {
    isActive: boolean;
    currentMode?: FocusMode;
    blockedApps: string[];
    reason?: string; // e.g., "Work Mode active until 5:00 PM"
}

export interface CategoryStats {
    category: AppCategory;
    totalUsageMs: number;
    appCount: number;
    percentageOfTotal: number;
    topApps: Array<{
        packageName: string;
        appName?: string;
        usageMs: number;
    }>;
}
