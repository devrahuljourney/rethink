import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import WeekColumns from './components/WeekColumns';
import InterventionToggle from './components/InterventionToggle';
import { queryUsage } from '../../services/usage/usageNative';
import { getStartOfDay, formatTime } from '../../utils/timeUtils';
import { useAppLimits } from '../../context/AppLimitContext';
import { useUsage } from '../../context/UsageContext';
import { getCategoryIcon, getCategoryTone } from '../../utils/categoryMapper';
import { Screen, TopBar, Txt, Sticker, IconTile, PopButton, Meter } from '../../ui/kit';
import { CountUp, Rise } from '../../ui/motion';
import { palette, font, stroke, TAB_BAR_SPACE } from '../../ui/theme';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DayUsage = { label: string; ms: number };

const AppDetails = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { packageName } = route.params;

    const { getLimitStatus } = useAppLimits();
    const { getAppCategory, usageData } = useUsage();

    const [week, setWeek] = useState<DayUsage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [packageName]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const history: DayUsage[] = [];
            const today = new Date();

            // Last 7 days, oldest first; the final entry is today so far.
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const start = getStartOfDay(date);
                const end = i === 0 ? Date.now() : start + 24 * 60 * 60 * 1000 - 1;

                const stats = await queryUsage(start, end);
                const appStats = stats.find(app => app.packageName === packageName);
                history.push({
                    label: DAY_LABELS[date.getDay()],
                    ms: appStats ? appStats.totalTimeInForeground : 0,
                });
            }
            setWeek(history);
        } catch (error) {
            console.error('Failed to fetch app history:', error);
        } finally {
            setLoading(false);
        }
    };

    const category = getAppCategory(packageName);
    const appName = usageData.find(a => a.packageName === packageName)?.appName || packageName.split('.').pop();
    const status = getLimitStatus(packageName);

    const todayMs = week[week.length - 1]?.ms ?? 0;
    const weekTotal = week.reduce((sum, d) => sum + d.ms, 0);
    const previous = week.slice(0, -1);
    const usualMs = previous.length ? previous.reduce((sum, d) => sum + d.ms, 0) / previous.length : 0;
    const busiest = week.reduce<DayUsage | null>((top, d) => (!top || d.ms > top.ms ? d : top), null);

    const renderTodaySticker = () => {
        if (usualMs <= 0) return null;
        const diff = ((todayMs - usualMs) / usualMs) * 100;
        if (Math.abs(diff) < 5) return <Sticker text="about usual" tone="lilac" tilt={-4} delay={450} />;
        return diff > 0
            ? <Sticker text={`${diff.toFixed(0)}% over usual`} icon="arrow-up" tone="tomato" tilt={-4} delay={450} />
            : <Sticker text={`${Math.abs(diff).toFixed(0)}% under usual`} icon="arrow-down" tone="mint" tilt={-4} delay={450} />;
    };

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

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={palette.ink} size="large" />
                        <Txt style={{ marginTop: 12 }}>Counting the last 7 days…</Txt>
                    </View>
                ) : (
                    <>
                        <View style={[styles.section, { marginTop: 8 }]}>
                            <Rise delay={60}>
                                <Txt v="label">Today so far</Txt>
                            </Rise>
                            <Rise delay={100}>
                                <CountUp value={todayMs} format={n => formatTime(n)} style={styles.todayValue} />
                            </Rise>
                            {renderTodaySticker()}
                        </View>

                        <Rise delay={180} style={styles.section}>
                            <Txt v="h2" style={styles.sectionTitle}>Last 7 days</Txt>
                            <WeekColumns days={week} />
                        </Rise>

                        <Rise delay={240} style={styles.section}>
                            <View style={styles.stats}>
                                <View style={styles.stat}>
                                    <Txt v="label">Daily average</Txt>
                                    <Text style={styles.statValue}>{formatTime(weekTotal / 7)}</Text>
                                </View>
                                {busiest && busiest.ms > 0 && (
                                    <View style={styles.stat}>
                                        <Txt v="label">Heaviest day</Txt>
                                        <Text style={styles.statValue}>{busiest.label}</Text>
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
        marginBottom: 6,
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
