import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppUsageStats } from '../../../types/usage';
import { formatTime } from '../../../utils/timeUtils';

import { useAppLimits } from '../../../context/AppLimitContext';
import { useUsage } from '../../../context/UsageContext';
import { getCategoryIcon, getCategoryTone } from '../../../utils/categoryMapper';
import { IconTile, Meter } from '../../../ui/kit';
import { Rise, Squish } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';

interface AppUsageItemProps {
    item: AppUsageStats;
    onPress?: () => void;
    /** Position in the list; staggers the entrance of the first screenful. */
    index?: number;
}

const AppUsageItem: React.FC<AppUsageItemProps> = ({ item, onPress, index = 0 }) => {
    const { getLimitStatus } = useAppLimits();
    const { getAppCategory } = useUsage();

    const limitStatus = getLimitStatus(item.packageName);
    const category = getAppCategory(item.packageName);
    const launches = item.appLaunchCount || 0;

    return (
        <Rise delay={Math.min(index, 8) * 45} distance={12}>
            <Squish onPress={onPress} disabled={!onPress} accessibilityRole="button" scaleTo={0.98} style={styles.row}>
                <IconTile icon={getCategoryIcon(category)} tone={getCategoryTone(category)} size={42} />
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {item.appName || item.packageName.split('.').pop()}
                    </Text>
                    {limitStatus ? (
                        <View style={styles.limitRow}>
                            <View style={{ width: 90 }}>
                                <Meter
                                    pct={limitStatus.percentageUsed}
                                    tone={limitStatus.isWarning ? 'tomato' : 'mint'}
                                    height={8}
                                />
                            </View>
                            <Text style={styles.meta}>{Math.round(limitStatus.percentageUsed)}% of limit</Text>
                        </View>
                    ) : (
                        <Text style={styles.meta}>
                            opened {launches} time{launches === 1 ? '' : 's'}
                        </Text>
                    )}
                </View>
                <Text style={styles.time}>{formatTime(item.totalTimeInForeground)}</Text>
                {onPress && <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} style={{ marginLeft: 6 }} />}
            </Squish>
        </Rise>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth * 2,
        borderBottomColor: palette.line,
    },
    info: {
        flex: 1,
        marginHorizontal: 14,
    },
    name: {
        fontFamily: font.bodyBold,
        fontSize: 16,
        color: palette.ink,
        textTransform: 'capitalize',
    },
    limitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 8,
    },
    meta: {
        fontFamily: font.body,
        fontSize: 13,
        color: palette.inkSoft,
        marginTop: 2,
    },
    time: {
        fontFamily: font.displayBold,
        fontSize: 17,
        color: palette.ink,
    },
});

export default AppUsageItem;
