import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReduceMotion } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';

const shortTime = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.round((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h${m >= 30 ? '+' : ''}` : `${m}m`;
};

function Bar({ ms, max, index, today, height, barWidth, showValue, selected, dimmed, onPress, label: dayName }: {
    ms: number; max: number; index: number; today: boolean; height: number; barWidth: number; showValue: boolean;
    selected: boolean; dimmed: boolean; onPress?: () => void; label: string;
}) {
    const reduce = useReduceMotion();
    const target = Math.max(4, (ms / max) * height);
    const h = useRef(new Animated.Value(reduce ? target : 0)).current;
    const label = useRef(new Animated.Value(reduce ? 1 : 0)).current;

    useEffect(() => {
        if (reduce) {
            h.setValue(target);
            label.setValue(1);
            return;
        }
        h.setValue(0);
        label.setValue(0);
        Animated.sequence([
            Animated.delay(150 + index * 70),
            Animated.spring(h, { toValue: target, useNativeDriver: false, speed: 9, bounciness: 4 }),
        ]).start();
        Animated.timing(label, { toValue: 1, duration: 300, delay: 450 + index * 70, useNativeDriver: false }).start();
    }, [target, index, reduce, h, label]);

    const color = selected ? palette.cobalt : today ? palette.tomato : palette.ink;
    return (
        <Pressable
            style={styles.barCol}
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole="button"
            accessibilityLabel={`${dayName}, ${formatTime(ms)}`}
            accessibilityState={{ selected }}
        >
            {(showValue || selected) && (
                <Animated.Text
                    style={[styles.value, today && styles.valueToday, selected && styles.valueSelected, { opacity: selected ? 1 : label }]}
                >
                    {shortTime(ms)}
                </Animated.Text>
            )}
            <Animated.View
                style={{
                    height: h,
                    width: barWidth,
                    borderRadius: barWidth / 2,
                    backgroundColor: color,
                    opacity: dimmed ? 0.2 : 1,
                }}
            />
        </Pressable>
    );
}

/** Seven columns with a dashed average line; today is the tomato one. */
const WeekStrip: React.FC<{
    week: { label: string; ms: number }[];
    height?: number;
    barWidth?: number;
    showValues?: boolean;
    /** Index of the highlighted day, or null. */
    selected?: number | null;
    /** Tap a bar to select it (tapping it again clears). */
    onSelect?: (index: number | null) => void;
}> = ({ week, height = 96, barWidth = 12, showValues = false, selected = null, onSelect }) => {
    const max = Math.max(...week.map(d => d.ms), 1);
    const past = week.slice(0, -1);
    const avg = past.length ? past.reduce((a, d) => a + d.ms, 0) / past.length : 0;
    const extra = showValues || onSelect ? 20 : 0;

    return (
        <View accessibilityLabel={week.map(d => `${d.label} ${formatTime(d.ms)}`).join(', ')}>
            <View style={[styles.plot, { height: height + extra }]}>
                {avg > 0 && <View style={[styles.avgLine, { bottom: (avg / max) * height }]} />}
                {week.map((d, i) => (
                    <Bar
                        key={i}
                        ms={d.ms}
                        max={max}
                        index={i}
                        today={i === week.length - 1}
                        height={height}
                        barWidth={barWidth}
                        showValue={showValues}
                        selected={selected === i}
                        dimmed={selected !== null && selected !== i}
                        label={i === week.length - 1 ? 'Today' : d.label}
                        onPress={onSelect ? () => onSelect(selected === i ? null : i) : undefined}
                    />
                ))}
            </View>
            <View style={styles.labels}>
                {week.map((d, i) => (
                    <Text key={i} style={[styles.label, i === week.length - 1 && styles.labelToday, selected === i && styles.labelSelected]}>
                        {i === week.length - 1 ? 'Today' : d.label}
                    </Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    plot: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    barCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    value: {
        fontFamily: font.mono,
        fontSize: 10,
        color: palette.inkSoft,
        marginBottom: 6,
    },
    valueToday: {
        color: palette.tomato,
    },
    valueSelected: {
        color: palette.cobalt,
        fontFamily: font.bodyBold,
    },
    avgLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: palette.inkFaint,
    },
    labels: {
        flexDirection: 'row',
        marginTop: 8,
    },
    label: {
        flex: 1,
        textAlign: 'center',
        fontFamily: font.mono,
        fontSize: 10,
        color: palette.inkFaint,
    },
    labelToday: {
        color: palette.ink,
    },
    labelSelected: {
        color: palette.cobalt,
    },
});

export default WeekStrip;
