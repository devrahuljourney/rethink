import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { color } from '../../constant/color';
import UsageBarChart from './components/UsageBarChart';
import InterventionToggle from './components/InterventionToggle';
import { queryAndAggregateUsageStats } from '@brighthustle/react-native-usage-stats-manager';
import { getStartOfDay, formatTime } from '../../utils/timeUtils';
import InsightCard from './components/InsightCard';
import LinearGradient from 'react-native-linear-gradient';

const AppDetails = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { packageName } = route.params;

    const [isInterventionEnabled, setIsInterventionEnabled] = useState(false);
    const [usageHistory, setUsageHistory] = useState<{ value: number; label: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayUsage, setTodayUsage] = useState<number>(0);

    useEffect(() => {
        fetchHistory();
    }, [packageName]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const history = [];
            const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date();

            // We'll fetch for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const start = getStartOfDay(date);
                const end = i === 0 ? Date.now() : start + 24 * 60 * 60 * 1000 - 1;

                const stats = await queryAndAggregateUsageStats(start, end);
                const appStats = (stats as any)[packageName];
                const usageMs = appStats ? appStats.totalTimeInForeground : 0;

                const dayIndex = date.getDay();
                history.push({
                    value: parseFloat((usageMs / (1000 * 60 * 60)).toFixed(1)), // Hours
                    label: labels[dayIndex]
                });

                if (i === 0) setTodayUsage(usageMs);
            }
            setUsageHistory(history);
        } catch (error) {
            console.error('Failed to fetch app history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={color.white} />
                </TouchableOpacity>
                <Text style={styles.title}>App Details</Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.appHeader}>
                    <LinearGradient
                        colors={[color.primary, '#6C47FF']}
                        style={styles.iconPlaceholder}
                    >
                        <Text style={styles.iconText}>{packageName.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={styles.appInfo}>
                        <Text style={styles.appName}>{packageName.split('.').pop()}</Text>
                        <Text style={styles.packageName} numberOfLines={1}>{packageName}</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={color.primary} size="large" />
                        <Text style={styles.loadingText}>Analyzing usage patterns...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.todayStats}>
                            <Text style={styles.statLabel}>Today's Usage</Text>
                            <Text style={styles.statValue}>{formatTime(todayUsage)}</Text>
                        </View>

                        <UsageBarChart
                            data={usageHistory}
                            title="Weekly Usage (hours)"
                        />

                        <InterventionToggle
                            isEnabled={isInterventionEnabled}
                            onToggle={(val) => setIsInterventionEnabled(val)}
                        />

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Premium Insights</Text>
                            <View style={styles.premiumBadge}>
                                <Text style={styles.premiumBadgeText}>PRO</Text>
                            </View>
                        </View>

                        <InsightCard
                            icon="flash-outline"
                            title="Focus Score"
                            value={todayUsage > 1000 * 60 * 60 ? "32/100" : "82/100"}
                            subtitle={todayUsage > 1000 * 60 * 60 ? "Heavy usage detected. Take a break!" : "Great job staying focused today!"}
                            type={todayUsage > 1000 * 60 * 60 ? "negative" : "positive"}
                        />

                        <InsightCard
                            icon="time-outline"
                            title="Peak Usage"
                            value="8:00 PM - 10:00 PM"
                            subtitle="Dopamine seeking behavior detected in evenings."
                            type="neutral"
                        />

                        <InsightCard
                            icon="trending-down-outline"
                            title="Digital Fatigue"
                            value="Low"
                            subtitle="Usage is well distributed throughout the day."
                            type="positive"
                        />

                        <View style={styles.tipCard}>
                            <Ionicons name="bulb-outline" size={24} color={color.primary} />
                            <Text style={styles.tipText}>
                                Enabling Smart Intervention helps you stay mindful of your digital wellbeing.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.black,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        color: color.white,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    iconPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 10,
        shadowColor: color.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconText: {
        color: color.white,
        fontSize: 32,
        fontWeight: '800',
    },
    appName: {
        color: color.white,
        fontSize: 24,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    packageName: {
        color: color.secondary,
        fontSize: 14,
        marginTop: 4,
    },
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    appInfo: {
        flex: 1,
        marginLeft: 16,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
    },
    loadingText: {
        color: color.secondary,
        marginTop: 16,
        fontSize: 14,
    },
    todayStats: {
        marginHorizontal: 24,
        marginBottom: 24,
        backgroundColor: '#1E1E1E',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        alignItems: 'center',
    },
    statLabel: {
        color: color.secondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    statValue: {
        color: color.white,
        fontSize: 32,
        fontWeight: '800',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        marginTop: 8,
        marginBottom: 40,
        backgroundColor: 'rgba(52, 199, 89, 0.05)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.1)',
    },
    tipText: {
        color: color.secondary,
        fontSize: 13,
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        color: color.white,
        fontSize: 18,
        fontWeight: '700',
        marginRight: 8,
    },
    premiumBadge: {
        backgroundColor: 'rgba(167, 139, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 255, 0.4)',
    },
    premiumBadgeText: {
        color: '#A78BFF',
        fontSize: 10,
        fontWeight: '800',
    },
});

export default AppDetails;
