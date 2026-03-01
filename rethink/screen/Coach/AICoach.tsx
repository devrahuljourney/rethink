import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getInsightsAPI } from '../../services/coachAPI';
import { color } from '../../constant/color';
import { useNavigation } from '@react-navigation/native';

interface InsightData {
    greeting: string;
    realLifeImpact: string;
    missionOfTheDay: {
        title: string;
        description: string;
        actionButtonText: string;
        actionType: 'FOCUS_MODE' | 'APP_LIMITS';
    };
    graphData: { label: string; value: number }[];
}

export default function AICoach() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<InsightData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getInsightsAPI();

            if (res && res.success && res.data) {
                setData(res.data as InsightData);
            } else {
                setError("Failed to fetch insights.");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while fetching insights.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (actionType: 'FOCUS_MODE' | 'APP_LIMITS') => {
        if (actionType === 'FOCUS_MODE') {
            navigation.navigate('AppStack', { screen: 'FocusMode' });
        } else if (actionType === 'APP_LIMITS') {
            navigation.navigate('AppStack');
        }
    };

    const renderChart = () => {
        if (!data?.graphData || data.graphData.length === 0) return null;

        const maxVal = Math.max(...data.graphData.map(d => d.value));

        const chartData = data.graphData.map(item => ({
            value: item.value,
            label: item.label || 'Other',
            frontColor: color.primary || '#177AD5',
            topLabelComponent: () => (
                <Text style={{ color: color.white, fontSize: 10, marginBottom: 4 }}>{item.value}m</Text>
            )
        }));

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="bar-chart" size={20} color={color.primary} style={styles.iconStyle} />
                    <Text style={styles.cardTitle}>Usage Breakdown (mins)</Text>
                </View>
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <BarChart
                        data={chartData}
                        barWidth={32}
                        spacing={24}
                        noOfSections={4}
                        maxValue={maxVal + (maxVal * 0.2)}
                        barBorderRadius={6}
                        yAxisThickness={0}
                        xAxisThickness={0}
                        hideRules
                        isAnimated
                        yAxisTextStyle={{ color: color.secondary, fontSize: 11 }}
                        xAxisLabelTextStyle={{ color: color.secondary, fontSize: 11, textAlign: 'center' }}
                    />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>ReThink Coach</Text>
                    <Text style={styles.headerSubtitle}>Real Life Over Screen Time</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={color.primary || '#FFF'} />
                        <Text style={styles.loadingText}>Coaching your next move...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : data ? (
                    <>
                        <View style={[styles.card, styles.greetingCard]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="chatbubbles" size={20} color={color.primary} style={styles.iconStyle} />
                                <Text style={styles.cardTitle}>Daily Briefing</Text>
                            </View>
                            <Text style={styles.greetingText}>{data.greeting}</Text>
                        </View>

                        <View style={[styles.card, styles.impactCard]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="earth" size={20} color={color.white} style={styles.iconStyle} />
                                <Text style={[styles.cardTitle, { color: color.white }]}>Real Life Impact</Text>
                            </View>
                            <Text style={[styles.text, { color: 'rgba(255,255,255,0.9)' }]}>{data.realLifeImpact}</Text>
                        </View>

                        <View style={[styles.card, styles.missionCard]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="flag" size={20} color={color.primary} style={styles.iconStyle} />
                                <Text style={styles.cardTitle}>Mission of the Day</Text>
                            </View>
                            <Text style={styles.missionTitle}>{data.missionOfTheDay.title}</Text>
                            <Text style={styles.text}>{data.missionOfTheDay.description}</Text>

                            {data.missionOfTheDay.actionButtonText && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleAction(data.missionOfTheDay.actionType)}
                                >
                                    <Text style={styles.actionButtonText}>{data.missionOfTheDay.actionButtonText}</Text>
                                    <Ionicons name="arrow-forward" size={18} color={color.black} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {renderChart()}
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: color.black || '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: 'column',
    },
    headerTitle: {
        fontSize: 28,
        color: color.white || '#FFF',
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: color.primary || '#177AD5',
        fontWeight: '700',
        marginTop: -2,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    container: {
        padding: 20,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 14,
        fontSize: 16,
        color: color.secondary || '#888',
        fontWeight: '600'
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    greetingCard: {
        borderTopWidth: 4,
        borderTopColor: color.primary,
    },
    impactCard: {
        borderColor: 'rgba(23, 122, 213, 0.4)',
        backgroundColor: 'rgba(23, 122, 213, 0.08)',
    },
    missionCard: {
        borderColor: 'rgba(52, 199, 89, 0.4)',
        backgroundColor: 'rgba(52, 199, 89, 0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconStyle: {
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: color.white || '#FFF',
    },
    greetingText: {
        fontSize: 18,
        color: color.white || '#FFF',
        fontWeight: '600',
        lineHeight: 26,
    },
    missionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: color.white || '#FFF',
        marginBottom: 8,
    },
    text: {
        fontSize: 15,
        color: color.secondary || '#BBB',
        lineHeight: 24,
    },
    actionButton: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.primary || '#177AD5',
        paddingVertical: 14,
        borderRadius: 16,
    },
    actionButtonText: {
        color: color.black || '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});
