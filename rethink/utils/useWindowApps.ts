import { useEffect, useState } from 'react';
import { queryUsage } from '../services/usage/usageNative';
import { AppUsageStats } from '../types/usage';

export interface TimeWindow {
    start: number;
    end: number;
}

/** Per-app usage for an arbitrary window (an hour, a day), most-used first. `null` window = nothing loaded. */
export function useWindowApps(win: TimeWindow | null) {
    const [apps, setApps] = useState<AppUsageStats[]>([]);
    const [loading, setLoading] = useState(false);
    const start = win?.start;
    const end = win?.end;

    useEffect(() => {
        if (start === undefined || end === undefined) {
            setApps([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        queryUsage(start, end)
            .then(list => {
                if (cancelled) return;
                setApps(
                    list
                        .filter(a => a.totalTimeInForeground > 0)
                        .map(a => ({
                            ...a,
                            appName: a.appName || a.packageName.split('.').pop()?.replace(/^[a-z]/, L => L.toUpperCase()) || 'Unknown',
                        }))
                        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground),
                );
            })
            .catch(e => console.error('Failed to load window usage:', e))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [start, end]);

    return { apps, loading };
}
