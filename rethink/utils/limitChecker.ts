import { AppLimit, AppLimitStatus } from '../types/appLimits';

/**
 * Checks if an app limit is currently paused
 */
export function isLimitPaused(limit: AppLimit): boolean {
    if (!limit.pausedUntil) return false;

    const pausedUntil = new Date(limit.pausedUntil);
    const now = new Date();

    return now < pausedUntil;
}

/**
 * Calculates the limit status for an app
 */
export function calculateLimitStatus(
    limit: AppLimit,
    currentUsageMs: number
): AppLimitStatus {
    const isPaused = isLimitPaused(limit);
    const remainingMs = Math.max(0, limit.dailyLimitMs - currentUsageMs);
    const percentageUsed = Math.min(100, (currentUsageMs / limit.dailyLimitMs) * 100);
    const isWarning = !isPaused && remainingMs <= limit.warningThresholdMs && remainingMs > 0;
    const isBlocked = !isPaused && currentUsageMs >= limit.dailyLimitMs;

    return {
        packageName: limit.packageName,
        currentUsageMs,
        limitMs: limit.dailyLimitMs,
        remainingMs,
        percentageUsed,
        isWarning,
        isBlocked,
        isPaused,
    };
}

/**
 * Formats remaining time in a human-readable way
 */
export function formatRemainingTime(ms: number): string {
    if (ms <= 0) return 'Time\'s up!';

    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m left`;
    }

    return `${minutes}m left`;
}

/**
 * Pauses a limit until end of day
 */
export function pauseLimitUntilEndOfDay(limit: AppLimit): AppLimit {
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);

    return {
        ...limit,
        pausedUntil: tomorrow.toISOString(),
    };
}

/**
 * Extends a limit by specified minutes
 */
export function extendLimit(limit: AppLimit, minutesToAdd: number): AppLimit {
    return {
        ...limit,
        dailyLimitMs: limit.dailyLimitMs + (minutesToAdd * 60000),
    };
}

/**
 * Checks if current time is within a schedule
 */
export function isWithinSchedule(
    startTime: string, // HH:mm
    endTime: string, // HH:mm
    days: number[] // 0-6
): boolean {
    const now = new Date();
    const currentDay = now.getDay();

    // Check if today is in the schedule
    if (!days.includes(currentDay)) {
        return false;
    }

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight schedules (e.g., 22:00 - 06:00)
    if (endMinutes < startMinutes) {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
