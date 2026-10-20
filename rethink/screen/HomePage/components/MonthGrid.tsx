import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReduceMotion } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';
import { DayTotal } from '../../../utils/useDayRhythm';

const GAP = 6;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Cell({ day, size, intensity, isToday, order, selected, dimmed, onPress }: {
    day: DayTotal; size: number; intensity: number; isToday: boolean; order: number;
    selected: boolean; dimmed: boolean; onPress?: () => void;
}) {
    const reduce = useReduceMotion();
    const t = useRef(new Animated.Value(reduce ? 1 : 0)).current;

    useEffect(() => {
        if (reduce) {
            t.setValue(1);
            return;
        }
        t.setValue(0);
        Animated.timing(t, {
            toValue: 1,
            duration: 380,
            delay: 120 + order * 32,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
        }).start();
    }, [order, reduce, t]);

    // Darker = more screen time. Text flips to light on the dark end.
    const dark = intensity > 0.55;
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${new Date(day.start).toDateString()}, ${formatTime(day.ms)}`}
        >
        <Animated.View
            style={[
                styles.cell,
                {
                    width: size,
                    height: size,
                    backgroundColor: intensity > 0 ? `rgba(27, 26, 31, ${0.1 + intensity * 0.9})` : palette.line,
                    opacity: t,
                    transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                },
                isToday && styles.today,
                selected && styles.selected,
                dimmed && { opacity: 0.35 },
            ]}
        >
            <Text style={[styles.dayNum, { color: dark ? palette.card : palette.ink }]}>{new Date(day.start).getDate()}</Text>
        </Animated.View>
        </Pressable>
    );
}

/** The last 30 days as a calendar heatmap, Monday-first. Today wears a tomato ring. */
const MonthGrid: React.FC<{
    month: DayTotal[];
    width: number;
    /** `start` of the highlighted day, or null. */
    selected?: number | null;
    onSelect?: (start: number | null) => void;
}> = ({ month, width, selected = null, onSelect }) => {
    const size = Math.floor((width - GAP * 6) / 7);
    const max = Math.max(...month.map(d => d.ms), 1);
    const lead = (new Date(month[0].start).getDay() + 6) % 7; // blanks before the first day so columns line up

    const cells: (DayTotal | null)[] = [...Array(lead).fill(null), ...month];

    return (
        <View accessibilityLabel={`Last 30 days, busiest ${formatTime(max)}`}>
            <View style={styles.row}>
                {WEEKDAYS.map((d, i) => (
                    <Text key={i} style={[styles.weekday, { width: size }]}>{d}</Text>
                ))}
            </View>
            <View style={styles.grid}>
                {cells.map((day, i) => {
                    if (!day) return <View key={`b${i}`} style={{ width: size, height: size }} />;
                    const col = i % 7;
                    const row = Math.floor(i / 7);
                    return (
                        <Cell
                            key={day.start}
                            day={day}
                            size={size}
                            intensity={day.ms / max}
                            isToday={i === cells.length - 1}
                            order={row + col}
                            selected={selected === day.start}
                            dimmed={selected !== null && selected !== day.start}
                            onPress={onSelect ? () => onSelect(selected === day.start ? null : day.start) : undefined}
                        />
                    );
                })}
            </View>
            <View style={styles.legend}>
                <Text style={styles.legendText}>less</Text>
                {[0.1, 0.35, 0.6, 0.85, 1].map(a => (
                    <View key={a} style={[styles.legendSwatch, { backgroundColor: `rgba(27, 26, 31, ${a})` }]} />
                ))}
                <Text style={styles.legendText}>more</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: GAP,
        marginBottom: 8,
    },
    weekday: {
        textAlign: 'center',
        fontFamily: font.mono,
        fontSize: 10,
        color: palette.inkFaint,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
    },
    cell: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    today: {
        borderWidth: 2.5,
        borderColor: palette.tomato,
    },
    selected: {
        borderWidth: 3,
        borderColor: palette.cobalt,
        transform: [{ scale: 1.08 }],
    },
    dayNum: {
        fontFamily: font.mono,
        fontSize: 11,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginTop: 12,
    },
    legendSwatch: {
        width: 12,
        height: 12,
        borderRadius: 3,
    },
    legendText: {
        fontFamily: font.mono,
        fontSize: 10,
        color: palette.inkSoft,
        marginHorizontal: 4,
    },
});

export default MonthGrid;
