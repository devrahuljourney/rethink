import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReduceMotion } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';

const HEIGHT = 64;

const hourName = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

function HourBar({ ms, max, index, active, onPress }: { ms: number | null; max: number; index: number; active: boolean; onPress: () => void }) {
    const reduce = useReduceMotion();
    const target = ms ? Math.max(3, (ms / max) * HEIGHT) : 2;
    const h = useRef(new Animated.Value(reduce ? target : 0)).current;

    useEffect(() => {
        if (reduce) {
            h.setValue(target);
            return;
        }
        h.setValue(0);
        Animated.timing(h, { toValue: target, duration: 420, delay: index * 18, useNativeDriver: false }).start();
    }, [target, index, reduce, h]);

    return (
        <Pressable style={styles.slot} onPress={onPress} disabled={!ms} hitSlop={{ top: 20, bottom: 10 }}>
            <Animated.View
                style={{
                    height: h,
                    width: '70%',
                    borderRadius: 3,
                    backgroundColor: ms === null ? palette.line : active ? palette.tomato : palette.ink,
                    opacity: ms === null ? 1 : active ? 1 : 0.75,
                }}
            />
        </Pressable>
    );
}

/** One day split into 24 hours. Tap a bar to read it; the busiest hour is preselected. */
const HourStrip: React.FC<{ hours: (number | null)[] }> = ({ hours }) => {
    const max = Math.max(...hours.map(h => h ?? 0), 1);
    const peak = hours.reduce<number>((best, h, i) => ((h ?? 0) > (hours[best] ?? 0) ? i : best), 0);
    const [active, setActive] = useState<number>(peak);

    useEffect(() => setActive(peak), [peak]);

    const activeMs = hours[active] ?? 0;
    return (
        <View>
            <Text style={styles.readout}>
                {activeMs > 0 ? (
                    <>
                        <Text style={styles.readoutStrong}>{hourName(active)}</Text>
                        {`  ${formatTime(activeMs)}${active === peak ? ' · busiest hour' : ''}`}
                    </>
                ) : (
                    'Not used this day'
                )}
            </Text>
            <View style={styles.plot}>
                {hours.map((ms, i) => (
                    <HourBar key={i} ms={ms} max={max} index={i} active={i === active} onPress={() => setActive(i)} />
                ))}
            </View>
            <View style={styles.axis}>
                {['12 AM', '6 AM', '12 PM', '6 PM', ''].map((l, i) => (
                    <Text key={i} style={styles.axisLabel}>{l}</Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    readout: {
        fontFamily: font.body,
        fontSize: 13,
        color: palette.inkSoft,
        marginBottom: 10,
    },
    readoutStrong: {
        fontFamily: font.bodyBold,
        color: palette.tomato,
    },
    plot: {
        height: HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderColor: palette.line,
    },
    slot: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    axis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    axisLabel: {
        fontFamily: font.mono,
        fontSize: 10,
        color: palette.inkFaint,
    },
});

export default HourStrip;
