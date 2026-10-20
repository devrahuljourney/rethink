import { useCallback, useEffect, useState } from 'react';
import { queryUsage } from '../services/usage/usageNative';
import { getStartOfDay } from './timeUtils';

const HOUR = 60 * 60 * 1000;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_DAYS = 30;

export interface DayTotal {
    /** Local midnight of the day. */
    start: number;
    label: string;
    ms: number;
}

export interface DayRhythm {
    /** Screen time per clock hour today; null for hours that haven't happened yet. */
    hours: (number | null)[];
    /** Last 30 days, oldest first; the final entry is today so far. */
    month: DayTotal[];
    /** The last 7 entries of `month`. */
    week: DayTotal[];
    /** App opens today. */
    opens: number;
}

const sumWindow = async (start: number, end: number) => {
    const apps = await queryUsage(start, end);
    return apps.reduce((acc, a) => acc + a.totalTimeInForeground, 0);
};

// Midnight `n` days before `todayStart`, robust to DST (a day isn't always 24h).
const daysBefore = (todayStart: number, n: number) => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - n);
    return d.getTime();
};

/** Today by hour and the last 30 days by day. Independent of the range the rest of the app shows. */
export function useDayRhythm() {
    const [data, setData] = useState<DayRhythm | null>(null);

    const load = useCallback(async () => {
        try {
            const now = Date.now();
            const todayStart = getStartOfDay();

            const hourJobs = Array.from({ length: 24 }, (_, h) => {
                const start = todayStart + h * HOUR;
                if (start > now) return Promise.resolve(null);
                return sumWindow(start, Math.min(start + HOUR - 1, now));
            });
            const pastStarts = Array.from({ length: MONTH_DAYS - 1 }, (_, i) => daysBefore(todayStart, MONTH_DAYS - 1 - i));
            const dayJobs = pastStarts.map((start, i) => {
                const next = i + 1 < pastStarts.length ? pastStarts[i + 1] : todayStart;
                return sumWindow(start, next - 1);
            });

            const [hours, pastDays, todayApps] = await Promise.all([
                Promise.all(hourJobs),
                Promise.all(dayJobs),
                queryUsage(todayStart, now),
            ]);
            const opens = todayApps.reduce((acc, a) => acc + (a.appLaunchCount || 0), 0);
            const todayMs = hours.reduce<number>((acc, h) => acc + (h ?? 0), 0);

            const month: DayTotal[] = [...pastStarts, todayStart].map((start, i) => ({
                start,
                label: DAY_LABELS[new Date(start).getDay()],
                ms: i < pastDays.length ? pastDays[i] : todayMs,
            }));
            setData({ hours, month, week: month.slice(-7), opens });
        } catch (error) {
            console.error('Failed to load day rhythm:', error);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { rhythm: data, reloadRhythm: load };
}
