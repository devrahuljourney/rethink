import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useReduceMotion } from '../../../ui/motion';
import { palette, font, stroke } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';

const HEIGHT = 140;
const MIN_BAR = 6;

function Column({ ms, max, label, today, index }: { ms: number; max: number; label: string; today: boolean; index: number }) {
    const reduce = useReduceMotion();
    const target = max > 0 ? Math.max(MIN_BAR, (ms / max) * HEIGHT) : MIN_BAR;
    const h = useRef(new Animated.Value(reduce ? target : 0)).current;

    useEffect(() => {
        if (reduce) {
            h.setValue(target);
            return;
        }
        Animated.spring(h, { toValue: target, delay: 150 + index * 60, useNativeDriver: false, speed: 10, bounciness: 7 }).start();
    }, [target, index, reduce, h]);

    return (
        <View style={styles.col}>
            {today && <Text style={styles.todayValue}>{formatTime(ms)}</Text>}
            <Animated.View style={[styles.bar, { height: h, backgroundColor: today ? palette.tomato : palette.card }]} />
            <Text style={[styles.label, today && styles.labelToday]}>{today ? 'Today' : label}</Text>
        </View>
    );
}

/** Seven columns, oldest first; the last one is today and gets the colour. */
const WeekColumns: React.FC<{ days: { label: string; ms: number }[] }> = ({ days }) => {
    const max = Math.max(...days.map(d => d.ms), 1);
    return (
        <View style={styles.row} accessibilityLabel={days.map(d => `${d.label} ${formatTime(d.ms)}`).join(', ')}>
            {days.map((d, i) => (
                <Column key={i} ms={d.ms} max={max} label={d.label} today={i === days.length - 1} index={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: HEIGHT + 56,
    },
    col: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '62%',
        borderWidth: stroke,
        borderColor: palette.ink,
        borderRadius: 10,
    },
    label: {
        fontFamily: font.mono,
        fontSize: 11,
        color: palette.inkSoft,
        marginTop: 8,
    },
    labelToday: {
        color: palette.ink,
    },
    todayValue: {
        fontFamily: font.bodyBold,
        fontSize: 12,
        color: palette.ink,
        marginBottom: 6,
    },
});

export default WeekColumns;
