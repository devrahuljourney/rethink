import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant/color';
import { AppUsageStats } from '../../../types/usage';
import { formatTime } from '../../../utils/timeUtils';

interface AppUsageItemProps {
    item: AppUsageStats;
    onPress?: () => void;
}

const AppUsageItem: React.FC<AppUsageItemProps> = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View style={styles.itemIconContainer}>
                <Text style={styles.itemIconText}>
                    {(item.appName || item.packageName.split('.').pop())?.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.packageName} numberOfLines={1}>
                    {item.appName || item.packageName.split('.').pop()}
                </Text>
                <View style={styles.itemSubInfo}>
                    <Ionicons name="repeat-outline" size={12} color={color.secondary} />
                    <Text style={styles.launchText}>{item.appLaunchCount || 0} launches</Text>
                </View>
            </View>
            <View style={styles.itemStats}>
                <Text style={styles.usageTime}>
                    {formatTime(item.totalTimeInForeground)}
                </Text>
                {onPress && (
                    <Ionicons name="chevron-forward" size={14} color="#444" style={{ marginTop: 4 }} />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    itemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemIconText: {
        color: color.white,
        fontSize: 18,
        fontWeight: '700',
    },
    itemInfo: {
        flex: 1,
    },
    itemSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    packageName: {
        fontSize: 16,
        color: color.white,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    launchText: {
        fontSize: 12,
        color: color.secondary,
        marginLeft: 4,
    },
    itemStats: {
        marginLeft: 16,
        alignItems: 'flex-end',
    },
    usageTime: {
        fontSize: 17,
        color: color.primary,
        fontWeight: '800',
    },
});

export default AppUsageItem;
