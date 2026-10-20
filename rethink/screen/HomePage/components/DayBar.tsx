import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GrowSlice, Rise, Squish } from '../../../ui/motion';
import { palette, font, Tone, toneBg } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';

export interface Slice {
    key: string;
    label: string;
    ms: number;
}

const TONES: Tone[] = ['tomato', 'cobalt', 'sun', 'mint', 'lilac'];
const MAX_SLICES = 4;

/**
 * One bar for the whole period, cut into slices by app (or kind of app),
 * with a plain legend underneath. Remount it (change `key`) to replay the animation.
 */
const DayBar: React.FC<{ slices: Slice[]; onPressRow?: (key: string) => void }> = ({ slices, onPressRow }) => {
    const total = slices.reduce((sum, s) => sum + s.ms, 0);
    if (total <= 0) return null;

    const top = slices.slice(0, MAX_SLICES);
    const restMs = total - top.reduce((sum, s) => sum + s.ms, 0);
    const rows = restMs > 0 ? [...top, { key: '__rest', label: 'Everything else', ms: restMs }] : top;

    const toneFor = (i: number, key: string) => (key === '__rest' ? palette.card : toneBg(TONES[i % TONES.length]));

    return (
        <View>
            <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {rows.map((r, i) => (
                    <GrowSlice
                        key={r.key}
                        pct={(r.ms / total) * 100}
                        delay={120 + i * 90}
                        style={[
                            styles.slice,
                            { backgroundColor: r.key === '__rest' ? palette.line : toneFor(i, r.key) },
                            i < rows.length - 1 && styles.sliceGap,
                        ]}
                    />
                ))}
            </View>

            <View style={styles.legend}>
                {rows.map((r, i) => (
                    <Rise key={r.key} delay={260 + i * 70} distance={10}>
                        <Squish
                            onPress={onPressRow ? () => onPressRow(r.key) : undefined}
                            disabled={!onPressRow}
                            scaleTo={0.98}
                            accessibilityRole="button"
                            style={styles.row}
                        >
                            <View style={[styles.dot, { backgroundColor: r.key === '__rest' ? palette.line : toneFor(i, r.key) }]} />
                            <Text style={styles.name} numberOfLines={1}>{r.label}</Text>
                            <Text style={styles.pct}>{Math.round((r.ms / total) * 100)}%</Text>
                            <Text style={styles.time}>{formatTime(r.ms)}</Text>
                            {onPressRow && <Ionicons name="chevron-forward" size={14} color={palette.inkFaint} style={{ marginLeft: 6 }} />}
                        </Squish>
                    </Rise>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        height: 14,
        borderRadius: 7,
        overflow: 'hidden',
    },
    slice: {
        height: '100%',
        borderRadius: 7,
    },
    sliceGap: {
        marginRight: 3,
    },
    legend: {
        marginTop: 18,
        gap: 13,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    name: {
        flex: 1,
        fontFamily: font.bodySemi,
        fontSize: 15,
        color: palette.ink,
        textTransform: 'capitalize',
    },
    pct: {
        fontFamily: font.mono,
        fontSize: 12,
        color: palette.inkFaint,
        marginRight: 12,
    },
    time: {
        fontFamily: font.bodyBold,
        fontSize: 15,
        color: palette.ink,
        minWidth: 64,
        textAlign: 'right',
    },
});

export default DayBar;
