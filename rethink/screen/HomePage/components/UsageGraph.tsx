import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { color } from '../../../constant/color';

interface GraphData {
    name: string;
    usageTime: number;
}

interface UsageGraphProps {
    data: GraphData[];
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const BAR_HEIGHT = 24;
const BAR_GAP = 12;

const UsageGraph: React.FC<UsageGraphProps> = ({ data }) => {
    const topData = data.slice(0, 5);
    const totalUsage = topData.reduce((acc, curr) => acc + curr.usageTime, 0);
    const maxUsage = Math.max(...topData.map(d => d.usageTime), 1);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Usage Balance</Text>
                <Text style={styles.subtitle}>Top 5 Apps</Text>
            </View>
            <View style={styles.chartContainer}>
                {topData.map((item, index) => {
                    const barWidth = (item.usageTime / maxUsage) * 100;
                    const percentage = totalUsage > 0
                        ? ((item.usageTime / totalUsage) * 100).toFixed(0)
                        : '0';

                    return (
                        <View key={item.name} style={styles.row}>
                            <View style={styles.rowHeader}>
                                <Text style={styles.appName} numberOfLines={1}>
                                    {item.name.split('.').pop()}
                                </Text>
                                <Text style={styles.percentageText}>{percentage}%</Text>
                            </View>
                            <View style={styles.barContainer}>
                                <View style={styles.barBackground}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { width: `${barWidth}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        color: color.white,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        color: color.secondary,
        fontWeight: '600',
    },
    chartContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    row: {
        marginBottom: 16,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    appName: {
        color: color.white,
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    percentageText: {
        color: color.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    barBackground: {
        flex: 1,
        height: 6,
        backgroundColor: '#2A2A2A',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: color.primary,
        borderRadius: 3,
    },
});

export default UsageGraph;
