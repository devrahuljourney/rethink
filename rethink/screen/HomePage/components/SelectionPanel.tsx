import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppUsageStats } from '../../../types/usage';
import { formatTime } from '../../../utils/timeUtils';
import { Rise, Squish } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';

const MAX_ROWS = 5;

interface Props {
    /** e.g. "2–3 PM" or "Sat 17 Oct". */
    title: string;
    apps: AppUsageStats[];
    loading: boolean;
    onClose: () => void;
    onOpenApp: (packageName: string) => void;
}

/** What happened in the tapped hour or day: total, opens, and the apps behind it. */
const SelectionPanel: React.FC<Props> = ({ title, apps, loading, onClose, onOpenApp }) => {
    const total = apps.reduce((a, x) => a + x.totalTimeInForeground, 0);
    const opens = apps.reduce((a, x) => a + (x.appLaunchCount || 0), 0);
    const max = apps[0]?.totalTimeInForeground || 1;

    return (
        <Rise key={title} distance={10} style={styles.panel}>
            <View style={styles.head}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    {!loading && (
                        <Text style={styles.meta}>
                            {formatTime(total)} on screen · {opens} open{opens === 1 ? '' : 's'}
                        </Text>
                    )}
                </View>
                <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
                    <Ionicons name="close" size={18} color={palette.ink} />
                </Pressable>
            </View>

            {loading ? (
                <ActivityIndicator color={palette.ink} style={{ marginVertical: 18 }} />
            ) : apps.length === 0 ? (
                <Text style={styles.empty}>Phone stayed down. Nothing was used.</Text>
            ) : (
                <View style={styles.rows}>
                    {apps.slice(0, MAX_ROWS).map((a, i) => (
                        <Rise key={a.packageName} delay={60 + i * 50} distance={6}>
                            <Squish onPress={() => onOpenApp(a.packageName)} scaleTo={0.98} accessibilityRole="button" style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.rowTop}>
                                        <Text style={styles.name} numberOfLines={1}>{a.appName}</Text>
                                        <Text style={styles.time}>{formatTime(a.totalTimeInForeground)}</Text>
                                    </View>
                                    <View style={styles.track}>
                                        <View style={[styles.fill, { width: `${(a.totalTimeInForeground / max) * 100}%` }]} />
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color={palette.inkFaint} style={{ marginLeft: 10 }} />
                            </Squish>
                        </Rise>
                    ))}
                    {apps.length > MAX_ROWS && (
                        <Text style={styles.more}>+{apps.length - MAX_ROWS} more apps</Text>
                    )}
                </View>
            )}
        </Rise>
    );
};

const styles = StyleSheet.create({
    panel: {
        marginTop: 16,
        padding: 16,
        borderRadius: 18,
        backgroundColor: palette.card,
        borderWidth: 1.5,
        borderColor: palette.cobalt,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: font.displayBold,
        fontSize: 19,
        color: palette.ink,
    },
    meta: {
        fontFamily: font.mono,
        fontSize: 11,
        color: palette.inkSoft,
        marginTop: 3,
    },
    close: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.line,
    },
    rows: {
        marginTop: 14,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    name: {
        flex: 1,
        fontFamily: font.bodySemi,
        fontSize: 14,
        color: palette.ink,
    },
    time: {
        fontFamily: font.bodyBold,
        fontSize: 14,
        color: palette.ink,
        marginLeft: 8,
    },
    track: {
        height: 5,
        borderRadius: 3,
        backgroundColor: palette.line,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: palette.cobalt,
    },
    more: {
        fontFamily: font.mono,
        fontSize: 11,
        color: palette.inkSoft,
    },
    empty: {
        fontFamily: font.body,
        fontSize: 14,
        color: palette.inkSoft,
        marginTop: 12,
    },
});

export default SelectionPanel;
