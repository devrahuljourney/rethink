import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color } from '../../../constant/color';

interface GraphData {
    name: string;
    launches: number;
}

interface LaunchGraphProps {
    data: GraphData[];
}

const LaunchGraph: React.FC<LaunchGraphProps> = ({ data }) => {
    const topData = data.slice(0, 5);
    const maxLaunches = Math.max(...topData.map(d => d.launches), 1);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>App Launches</Text>
                <Text style={styles.subtitle}>Top 5 Most Opened</Text>
            </View>
            <View style={styles.chartContainer}>
                {topData.map((item, index) => {
                    const barWidth = (item.launches / maxLaunches) * 100;

                    return (
                        <View key={item.name} style={styles.row}>
                            <View style={styles.rowHeader}>
                                <Text style={styles.appName} numberOfLines={1}>
                                    {item.name.split('.').pop()}
                                </Text>
                                <Text style={styles.launchText}>{item.launches} launches</Text>
                            </View>
                            <View style={styles.barContainer}>
                                <View style={styles.barBackground}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { width: `${barWidth}%`, backgroundColor: '#A78BFF' }
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
    launchText: {
        color: '#A78BFF',
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
        borderRadius: 3,
    },
});

export default LaunchGraph;
