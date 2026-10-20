import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import WeekColumns from './components/WeekColumns';
import HourStrip from './components/HourStrip';
import InterventionToggle from './components/InterventionToggle';
import { queryUsage } from '../../services/usage/usageNative';
import { getStartOfDay, formatTime } from '../../utils/timeUtils';
import { useAppLimits } from '../../context/AppLimitContext';
import { useUsage } from '../../context/UsageContext';
import { getCategoryIcon, getCategoryTone } from '../../utils/categoryMapper';
import { Screen, TopBar, Txt, IconTile, PopButton, Meter } from '../../ui/kit';
import { CountUp, Rise } from '../../ui/motion';
import { palette, font, stroke, TAB_BAR_SPACE } from '../../ui/theme';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_MS = 60 * 60 * 1000;
// Android keeps detailed usage events for a limited time, so don't page back forever.
const MAX_WEEKS_BACK = 4;

type DayUsage = { start: number; label: string; ms: number; opens: number; isToday: boolean };

const shiftDays = (start: number, n: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + n);
    return d.getTime();
};

const shortDate = (start: number) => new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const AppDetails = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { packageName } = route.params;

    const { getLimitStatus } = useAppLimits();
    const { getAppCategory, usageData } = useUsage();

    const [weeksBack, setWeeksBack] = useState(0);
    const [week, setWeek] = useState<DayUsage[]>([]);
    const [selected, setSelected] = useState(6);
    const [hours, setHours] = useState<(number | null)[] | null>(null);
    const [loading, setLoading] = useState(true);

    // Seven days ending today (or 7·weeksBack days earlier), oldest first.
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const now = Date.now();
                const todayStart = getStartOfDay();
                const days = await Promise.all(
                    Array.from({ length: 7 }, async (_, i) => {
                        const start = shiftDays(todayStart, i - 6 - weeksBack * 7);
                        const end = Math.min(shiftDays(start, 1) - 1, now);
                        const app = (await queryUsage(start, end)).find(a => a.packageName === packageName);
                        return {
                            start,
                            label: DAY_LABELS[new Date(start).getDay()],
                            ms: app?.totalTimeInForeground ?? 0,
                            opens: app?.appLaunchCount ?? 0,
                            isToday: start === todayStart,
                        };
                    }),
                );
                if (!cancelled) {
                    setWeek(days);
                    setSelected(6);
                }
            } catch (error) {
                console.error('Failed to fetch app history:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [packageName, weeksBack]);

    // The selected day, hour by hour.
    const day = week[selected];
    const dayStart = day?.start;
    useEffect(() => {
        if (dayStart === undefined) return;
        let cancelled = false;
        setHours(null);
        const now = Date.now();
        Promise.all(
            Array.from({ length: 24 }, async (_, h) => {
                const start = dayStart + h * HOUR_MS;
                if (start > now) return null;
                const app = (await queryUsage(start, Math.min(start + HOUR_MS - 1, now))).find(a => a.packageName === packageName);
                return app?.totalTimeInForeground ?? 0;
            }),
        )
            .then(result => !cancelled && setHours(result))
            .catch(e => console.error('Failed to fetch hourly usage:', e));
        return () => {
            cancelled = true;
        };
    }, [dayStart, packageName]);

    const category = getAppCategory(packageName);
    const appName = usageData.find(a => a.packageName === packageName)?.appName || packageName.split('.').pop();
    const status = getLimitStatus(packageName);

    const weekTotal = week.reduce((sum, d) => sum + d.ms, 0);
    const others = week.filter((_, i) => i !== selected);
    const usualMs = others.length ? others.reduce((sum, d) => sum + d.ms, 0) / others.length : 0;
    const busiest = week.reduce<DayUsage | null>((top, d) => (!top || d.ms > top.ms ? d : top), null);

    const vsUsual = (() => {
        if (!day || usualMs <= 0) return null;
        const diff = ((day.ms - usualMs) / usualMs) * 100;
        if (Math.abs(diff) < 5) return { text: 'about usual for this week', color: palette.inkSoft };
        return diff > 0
            ? { text: `${diff.toFixed(0)}% over the week's usual`, color: palette.tomato }
            : { text: `${Math.abs(diff).toFixed(0)}% under the week's usual`, color: '#1F8A62' };
    })();

    const dayTitle = day
        ? day.isToday
            ? 'Today so far'
            : new Date(day.start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
        : '';

    return (
        <Screen>
            <TopBar title="" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
                <Rise style={styles.appHeader}>
                    <IconTile icon={getCategoryIcon(category)} tone={getCategoryTone(category)} size={64} />
                    <View style={styles.appInfo}>
                        <Txt v="h1" style={styles.appName} numberOfLines={2}>{appName}</Txt>
                        <Text style={styles.packageName} numberOfLines={1}>{category} · {packageName}</Text>
                    </View>
                </Rise>

                {loading && week.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={palette.ink} size="large" />
                        <Txt style={{ marginTop: 12 }}>Counting the last 7 days…</Txt>
                    </View>
                ) : (
                    <>
                        {day && (
                            <View style={[styles.section, { marginTop: 8 }]}>
                                <Rise key={`t-${day.start}`} delay={40}>
                                    <Txt v="label">{dayTitle}</Txt>
                                </Rise>
                                <Rise key={`v-${day.start}`} delay={80}>
                                    <CountUp value={day.ms} format={n => formatTime(n)} style={styles.todayValue} />
                                    <Text style={styles.dayLine}>
                                        <Text style={styles.dayStrong}>{day.opens}</Text> open{day.opens === 1 ? '' : 's'}
                                        {vsUsual ? (
                                            <>
                                                {'  ·  '}
                                                <Text style={{ color: vsUsual.color }}>{vsUsual.text}</Text>
                                            </>
                                        ) : null}
                                    </Text>
                                </Rise>
                            </View>
                        )}

                        <Rise delay={160} style={styles.section}>
                            <View style={styles.weekHead}>
                                <Pressable
                                    onPress={() => setWeeksBack(w => Math.min(MAX_WEEKS_BACK, w + 1))}
                                    disabled={weeksBack >= MAX_WEEKS_BACK}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Earlier week"
                                    style={[styles.pager, weeksBack >= MAX_WEEKS_BACK && styles.pagerOff]}
                                >
                                    <Ionicons name="chevron-back" size={18} color={palette.ink} />
                                </Pressable>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.weekTitle}>
                                        {weeksBack === 0 ? 'Last 7 days' : `${weeksBack} week${weeksBack > 1 ? 's' : ''} ago`}
                                    </Text>
                                    {week.length > 0 && (
                                        <Text style={styles.weekRange}>
                                            {shortDate(week[0].start)} – {shortDate(week[6].start)}
                                        </Text>
                                    )}
                                </View>
                                <Pressable
                                    onPress={() => setWeeksBack(w => Math.max(0, w - 1))}
                                    disabled={weeksBack === 0}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Later week"
                                    style={[styles.pager, weeksBack === 0 && styles.pagerOff]}
                                >
                                    <Ionicons name="chevron-forward" size={18} color={palette.ink} />
                                </Pressable>
                            </View>
                            <View style={{ opacity: loading ? 0.4 : 1 }}>
                                <WeekColumns days={week} selected={selected} onSelect={setSelected} />
                            </View>
                            <Text style={styles.hint}>Tap a day to see it hour by hour</Text>
                        </Rise>

                        <Rise delay={220} style={styles.section}>
                            <Txt v="h2" style={styles.sectionTitle}>When you used it</Txt>
                            {hours ? <HourStrip hours={hours} /> : <ActivityIndicator color={palette.ink} style={{ marginVertical: 30 }} />}
                        </Rise>

                        <Rise delay={260} style={styles.section}>
                            <View style={styles.stats}>
                                <View style={styles.stat}>
                                    <Txt v="label">Daily average</Txt>
                                    <Text style={styles.statValue}>{formatTime(weekTotal / 7)}</Text>
                                    <Txt v="small">over these 7 days</Txt>
                                </View>
                                {busiest && busiest.ms > 0 && (
                                    <View style={styles.stat}>
                                        <Txt v="label">Heaviest day</Txt>
                                        <Text style={styles.statValue}>{busiest.isToday ? 'Today' : busiest.label}</Text>
                                        <Txt v="small">{formatTime(busiest.ms)}</Txt>
                                    </View>
                                )}
                            </View>
                        </Rise>

                        <Rise delay={300} style={styles.section}>
                            <View style={styles.limitHeader}>
                                <Txt v="h2">Daily limit</Txt>
                                <PopButton
                                    small
                                    tone={status ? 'card' : 'mint'}
                                    title={status ? 'Change' : 'Set a limit'}
                                    onPress={() => navigation.navigate('AppLimits', { packageName })}
                                />
                            </View>
                            {status ? (
                                <>
                                    <Meter pct={status.percentageUsed} tone={status.isWarning ? 'tomato' : 'mint'} height={16} />
                                    <View style={styles.limitInfoRow}>
                                        <Text style={styles.mono}>{Math.round(status.percentageUsed)}% used</Text>
                                        <Text style={styles.mono}>limit {formatTime(status.limitMs)}</Text>
                                    </View>
                                </>
                            ) : (
                                <Txt>No limit yet. Set one and Rethink steps in once the time is up.</Txt>
                            )}
                        </Rise>

                        <Rise delay={360}>
                            <InterventionToggle packageName={packageName} />
                        </Rise>
                    </>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    appInfo: {
        flex: 1,
        marginLeft: 16,
    },
    appName: {
        textTransform: 'capitalize',
    },
    packageName: {
        fontFamily: font.mono,
        fontSize: 11,
        color: palette.inkSoft,
        marginTop: 2,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 34,
    },
    sectionTitle: {
        marginBottom: 14,
    },
    dayLine: {
        fontFamily: font.body,
        fontSize: 14,
        color: palette.inkSoft,
    },
    dayStrong: {
        fontFamily: font.bodyBold,
        color: palette.ink,
    },
    weekHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    weekTitle: {
        fontFamily: font.displayBold,
        fontSize: 19,
        color: palette.ink,
    },
    weekRange: {
        fontFamily: font.mono,
        fontSize: 11,
        color: palette.inkSoft,
        marginTop: 2,
    },
    pager: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.line,
    },
    pagerOff: {
        opacity: 0.3,
    },
    hint: {
        fontFamily: font.body,
        fontSize: 12,
        color: palette.inkFaint,
        textAlign: 'center',
        marginTop: 10,
    },
    todayValue: {
        fontFamily: font.display,
        fontSize: 72,
        lineHeight: 78,
        letterSpacing: -2.5,
        color: palette.ink,
        marginTop: 4,
        marginBottom: 8,
    },
    stats: {
        flexDirection: 'row',
        gap: 20,
    },
    stat: {
        flex: 1,
        paddingTop: 12,
        borderTopWidth: stroke,
        borderColor: palette.ink,
    },
    statValue: {
        fontFamily: font.display,
        fontSize: 30,
        lineHeight: 36,
        color: palette.ink,
        marginTop: 4,
    },
    limitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    limitInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    mono: {
        fontFamily: font.mono,
        fontSize: 12,
        color: palette.ink,
    },
});

export default AppDetails;
