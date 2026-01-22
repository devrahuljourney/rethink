import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { color } from '../../../constant/color';

export type FilterRange = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface FilterTabsProps {
    activeRange: FilterRange;
    onRangeChange: (range: FilterRange) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeRange, onRangeChange }) => {
    const ranges: FilterRange[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

    return (
        <View style={styles.container}>
            <View style={styles.pillContainer}>
                {ranges.map((range) => (
                    <TouchableOpacity
                        key={range}
                        style={[
                            styles.tab,
                            activeRange === range && styles.activeTab
                        ]}
                        onPress={() => onRangeChange(range)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.tabText,
                            activeRange === range && styles.activeTabText
                        ]}>
                            {range.charAt(0) + range.slice(1).toLowerCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 20,
    },
    pillContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        borderRadius: 99,
        padding: 4,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 99,
    },
    activeTab: {
        backgroundColor: color.primary,
        shadowColor: color.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    tabText: {
        color: color.secondary,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    activeTabText: {
        color: color.black,
    },
});

export default FilterTabs;
