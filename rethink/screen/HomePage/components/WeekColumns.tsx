import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReduceMotion } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';

const HEIGHT = 140;
const MIN_BAR = 6;

export interface ColumnDay {
    label: string;
    ms: number;
    isToday?: boolean;
}

function Column({ day, max, index, selected, onPress }: {
    day: ColumnDay; max: number; index: number; selected: boolean; onPress: () => void;
}) {
    const reduce = useReduceMotion();
    const target = max > 0 ? Math.max(MIN_BAR, (day.ms / max) * HEIGHT) : MIN_BAR;
    const h = useRef(new Animated.Value(reduce ? target : 0)).current;

    useEffect(() => {
        if (reduce) {
            h.setValue(target);
            return;
        }
        Animated.spring(h, { toValue: target, delay: 120 + index * 55, useNativeDriver: false, speed: 10, bounciness: 4 }).start();
    }, [target, index, reduce, h]);

    return (
        <Pressable
            style={styles.col}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${day.isToday ? 'Today' : day.label}, ${formatTime(day.ms)}`}
        >
            <Text style={[styles.value, { opacity: selected ? 1 : 0 }]}>{formatTime(day.ms)}</Text>
            <Animated.View
                style={[
                    styles.bar,
                    { height: h, backgroundColor: selected ? palette.tomato : palette.ink, opacity: selected ? 1 : 0.8 },
                ]}
            />
            <Text style={[styles.label, selected && styles.labelOn]}>{day.isToday ? 'Today' : day.label}</Text>
        </Pressable>
    );
}

/** Seven tappable columns, oldest first. The selected day is tomato and shows its value. */
const WeekColumns: React.FC<{ days: ColumnDay[]; selected: number; onSelect: (index: number) => void }> = ({
    days,
    selected,
    onSelect,
}) => {
    const max = Math.max(...days.map(d => d.ms), 1);
    return (
        <View style={styles.row}>
            {days.map((d, i) => (
                <Column key={i} day={d} max={max} index={i} selected={i === selected} onPress={() => onSelect(i)} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: HEIGHT + 60,
    },
    col: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
    },
    bar: {
        width: 18,
        borderRadius: 9,
    },
    value: {
        fontFamily: font.bodyBold,
        fontSize: 11,
        color: palette.tomato,
        marginBottom: 6,
    },
    label: {
        fontFamily: font.mono,
        fontSize: 11,
        color: palette.inkFaint,
        marginTop: 8,
    },
    labelOn: {
        color: palette.ink,
    },
});

export default WeekColumns;
