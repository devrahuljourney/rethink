import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { color } from '../../../constant/color';

interface BarData {
    value: number;
    label: string;
    frontColor?: string;
}

interface UsageBarChartProps {
    data: BarData[];
    title: string;
}

const UsageBarChart: React.FC<UsageBarChartProps> = ({ data, title }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.chartWrapper}>
                <BarChart
                    data={data}
                    barWidth={30}
                    noOfSections={3}
                    barBorderRadius={6}
                    frontColor={color.primary}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    yAxisTextStyle={styles.axisText}
                    xAxisLabelTextStyle={styles.axisText}
                    hideRules
                    isAnimated
                    animationDuration={500}
                    spacing={20}
                    backgroundColor="transparent"
                    height={150}
                    width={Dimensions.get('window').width - 100}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    title: {
        color: color.white,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 20,
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    axisText: {
        color: color.secondary,
        fontSize: 10,
    },
});

export default UsageBarChart;
