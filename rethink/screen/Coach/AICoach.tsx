import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { getInsightsAPI } from '../../services/coachAPI';
import { useNavigation } from '@react-navigation/native';
import { Screen, Txt, Card, Sticker, PopButton } from '../../ui/kit';
import { Rise } from '../../ui/motion';
import { palette, font, stroke, TAB_BAR_SPACE } from '../../ui/theme';

const CHART_WIDTH = Dimensions.get('window').width - 40 - 36 - stroke * 2 - 34;
const BAR_COLORS = [palette.lilac, palette.tomato, palette.sun, palette.mint, palette.cobalt];

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
                setError("The coach came back empty-handed.");
            }
        } catch (err) {
            console.error(err);
            setError("Couldn't reach the coach. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (actionType: 'FOCUS_MODE' | 'APP_LIMITS') => {
        if (actionType === 'FOCUS_MODE') {
            navigation.navigate('FocusStack');
        } else if (actionType === 'APP_LIMITS') {
            navigation.navigate('AppStack', { screen: 'App' });
        }
    };

    const renderChart = () => {
        if (!data?.graphData || data.graphData.length === 0) return null;

        const maxVal = Math.max(...data.graphData.map(d => d.value), 1);

        const chartData = data.graphData.map((item, i) => ({
            value: item.value,
            label: item.label || 'Other',
            frontColor: BAR_COLORS[i % BAR_COLORS.length],
            topLabelComponent: () => (
                <Text style={styles.barTop}>{item.value}m</Text>
            )
        }));

        return (
            <Rise delay={320} style={styles.block}>
                <Txt v="h2" style={{ marginBottom: 12 }}>Minutes by kind of app</Txt>
                <BarChart
                        data={chartData}
                        width={CHART_WIDTH}
                        adjustToWidth
                        disableScroll
                        height={160}
                        barWidth={30}
                        initialSpacing={8}
                        noOfSections={4}
                        maxValue={maxVal * 1.25}
                        barBorderRadius={6}
                        barBorderWidth={stroke}
                        barBorderColor={palette.ink}
                        yAxisThickness={0}
                        xAxisThickness={stroke}
                        xAxisColor={palette.ink}
                        yAxisLabelWidth={34}
                        hideRules
                        isAnimated
                        yAxisTextStyle={styles.axisText}
                        xAxisLabelTextStyle={[styles.axisText, { textAlign: 'center' }]}
                    />
            </Rise>
        );
    };

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={fetchInsights}
                        colors={[palette.ink]}
                        tintColor={palette.ink}
                        progressBackgroundColor={palette.lilac}
                    />
                }
            >
                <View style={styles.titleRow}>
                    <Txt v="display">Coach</Txt>
                    <Sticker text="real life first" tone="lilac" tilt={-5} style={{ marginLeft: 12 }} />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={palette.ink} />
                        <Txt style={{ marginTop: 12 }}>Looking over your week…</Txt>
                    </View>
                ) : error ? (
                    <Card style={styles.errorCard}>
                        <Txt v="h2">{error}</Txt>
                        <PopButton title="Try again" tone="lilac" icon="refresh" onPress={fetchInsights} style={{ marginTop: 18 }} />
                    </Card>
                ) : data ? (
                    <>
                        <Rise delay={60} style={styles.block}>
                            <Txt v="label">Today's note</Txt>
                            <Text style={styles.greetingText}>{data.greeting}</Text>
                        </Rise>

                        <Rise delay={140} style={[styles.block, styles.impact]}>
                            <Txt v="label">Off the screen, that's</Txt>
                            <Text style={styles.impactText}>{data.realLifeImpact}</Text>
                        </Rise>

                        <Rise delay={220} style={[styles.block, { marginTop: 14 }]}>
                            <Card tone="sun" style={{ paddingTop: 28 }}>
                                <Txt v="h1">{data.missionOfTheDay.title}</Txt>
                                <Txt style={styles.missionText}>{data.missionOfTheDay.description}</Txt>

                                {data.missionOfTheDay.actionButtonText ? (
                                    <PopButton
                                        title={data.missionOfTheDay.actionButtonText}
                                        tone="ink"
                                        icon="arrow-forward"
                                        onPress={() => handleAction(data.missionOfTheDay.actionType)}
                                        style={{ marginTop: 18 }}
                                    />
                                ) : null}
                            </Card>
                            <Sticker text="today's mission" tone="tomato" tilt={-4} delay={600} style={styles.missionSticker} />
                        </Rise>

                        {renderChart()}
                    </>
                ) : null}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: TAB_BAR_SPACE,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    center: {
        alignItems: 'center',
        marginTop: 80,
    },
    errorCard: {
        padding: 22,
    },
    block: {
        marginBottom: 30,
    },
    greetingText: {
        fontFamily: font.display,
        fontSize: 28,
        lineHeight: 34,
        letterSpacing: -0.5,
        color: palette.ink,
        marginTop: 8,
    },
    impact: {
        borderLeftWidth: 4,
        borderColor: palette.cobalt,
        paddingLeft: 14,
    },
    impactText: {
        fontFamily: font.bodySemi,
        fontSize: 17,
        lineHeight: 25,
        color: palette.ink,
        marginTop: 6,
    },
    missionSticker: {
        position: 'absolute',
        top: -12,
        left: 14,
    },
    missionText: {
        color: palette.ink,
        marginTop: 6,
    },
    barTop: {
        fontFamily: font.mono,
        color: palette.ink,
        fontSize: 10,
        marginBottom: 4,
    },
    axisText: {
        fontFamily: font.mono,
        color: palette.inkSoft,
        fontSize: 10,
    },
});
