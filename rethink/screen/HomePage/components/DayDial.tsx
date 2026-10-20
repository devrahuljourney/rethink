import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { CountUp, useReduceMotion } from '../../../ui/motion';
import { palette, font } from '../../../ui/theme';
import { formatTime } from '../../../utils/timeUtils';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HOUR_MS = 60 * 60 * 1000;
const LABELS: Record<number, string> = { 0: '00', 6: '06', 12: '12', 18: '18' };

interface Props {
    hours: (number | null)[];
    size: number;
    /** Line under the total, e.g. "50% more than yesterday". */
    caption?: string;
    captionColor?: string;
    /** Highlighted hour (0–23), or null for the whole day. */
    selected?: number | null;
    /** Tap on an hour's bar selects it; tap in the middle clears. */
    onSelect?: (hour: number | null) => void;
}

export const hourRange = (h: number) => {
    const fmt = (x: number) => `${x % 12 === 0 ? 12 : x % 12}`;
    const ampm = (x: number) => (x % 24 < 12 ? 'AM' : 'PM');
    return `${fmt(h)}${ampm(h) === ampm(h + 1) ? '' : ` ${ampm(h)}`}–${fmt(h + 1)} ${ampm(h + 1)}`;
};

/**
 * Today as a clock face: one bar per hour, midnight at the top, length = minutes used in that hour.
 * The busiest hour is tomato, the current time is a blue dot on the inner track.
 */
const DayDial: React.FC<Props> = ({ hours, size, caption, captionColor = palette.inkSoft, selected = null, onSelect }) => {
    const reduce = useReduceMotion();
    const sweep = useRef(new Animated.Value(reduce ? 1 : 0)).current;
    const pulse = useRef(new Animated.Value(0)).current;
    const hand = useRef(new Animated.Value(reduce ? 1 : 0)).current;

    const c = size / 2;
    const inner = size * 0.28;
    const maxLen = size * 0.13;
    const barWidth = ((2 * Math.PI * inner) / 24) * 0.3;
    const busiest = Math.max(...hours.map(h => h ?? 0), 1);

    const total = hours.reduce<number>((acc, h) => acc + (h ?? 0), 0);
    const peak = useMemo(() => {
        let best = -1;
        hours.forEach((h, i) => {
            if (h !== null && h > 0 && (best < 0 || h > (hours[best] ?? 0))) best = i;
        });
        return best;
    }, [hours]);

    useEffect(() => {
        if (reduce) {
            sweep.setValue(1);
            return;
        }
        sweep.setValue(0);
        hand.setValue(0);
        Animated.timing(sweep, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
        // Same curve on the native thread, so the radar hand stays smooth while bars render.
        Animated.timing(hand, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: false }),
                Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: false }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [hours, reduce, sweep, pulse, hand]);

    const polar = (angle: number, r: number) => ({ x: c + r * Math.cos(angle), y: c + r * Math.sin(angle) });
    const angleFor = (hour: number) => (hour / 24) * 2 * Math.PI - Math.PI / 2;

    // Work out which hour a tap landed on from its angle around the centre.
    const handlePress = (e: GestureResponderEvent) => {
        if (!onSelect) return;
        const dx = e.nativeEvent.locationX - c;
        const dy = e.nativeEvent.locationY - c;
        if (Math.hypot(dx, dy) < inner - 14) {
            onSelect(null);
            return;
        }
        let a = Math.atan2(dy, dx) + Math.PI / 2;
        if (a < 0) a += 2 * Math.PI;
        const h = Math.floor((a / (2 * Math.PI)) * 24) % 24;
        if (hours[h] === null) return;
        onSelect(h === selected ? null : h);
    };

    const now = new Date();
    const nowAngle = angleFor(now.getHours() + now.getMinutes() / 60);
    const nowPos = polar(nowAngle, inner - 12);

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Inner track the bars grow out of. */}
                <Circle cx={c} cy={c} r={inner - 12} stroke={palette.line} strokeWidth={1.5} fill="none" />

                {hours.map((ms, h) => {
                    const a = angleFor(h + 0.5);
                    const start = polar(a, inner);
                    if (ms === null) {
                        // Hours still to come: a faint dot.
                        return <Circle key={h} cx={start.x} cy={start.y} r={barWidth / 2.6} fill={palette.line} />;
                    }
                    const len = Math.max(barWidth * 0.2, Math.min(1, ms / HOUR_MS) * maxLen);
                    const end = polar(a, inner + len);
                    // Each bar grows as the radar hand passes its hour: a clockwise sweep.
                    const t0 = (h / 24) * 0.9;
                    const grow = sweep.interpolate({ inputRange: [t0, t0 + 0.1], outputRange: [0, 1], extrapolate: 'clamp' });
                    return (
                        <AnimatedLine
                            key={h}
                            x1={start.x}
                            y1={start.y}
                            x2={grow.interpolate({ inputRange: [0, 1], outputRange: [start.x, end.x] })}
                            y2={grow.interpolate({ inputRange: [0, 1], outputRange: [start.y, end.y] })}
                            stroke={h === selected ? palette.cobalt : h === peak ? palette.tomato : palette.ink}
                            // Light hours fade back so the heavy ones carry the shape; with a selection, everything else steps back.
                            strokeOpacity={
                                selected !== null
                                    ? h === selected ? 1 : 0.15
                                    : h === peak ? 1 : 0.25 + 0.75 * Math.min(1, ms / busiest)
                            }
                            strokeWidth={barWidth}
                            strokeLinecap="round"
                        />
                    );
                })}

                {[0, 6, 12, 18].map(h => {
                    const p = polar(angleFor(h), inner + maxLen + 14);
                    return (
                        <SvgText
                            key={h}
                            x={p.x}
                            y={p.y + 4}
                            fontSize={10}
                            fontFamily={font.mono}
                            fill={palette.inkFaint}
                            textAnchor="middle"
                        >
                            {LABELS[h]}
                        </SvgText>
                    );
                })}

                <AnimatedCircle
                    cx={nowPos.x}
                    cy={nowPos.y}
                    r={pulse.interpolate({ inputRange: [0, 1], outputRange: [7, 10] })}
                    fill={palette.cobalt}
                    opacity={0.18}
                />
                <Circle cx={nowPos.x} cy={nowPos.y} r={4.5} fill={palette.cobalt} />
            </Svg>

            {/* Radar hand: one lap from midnight, just ahead of the bars, then gone. */}
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: hand.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.9, 0.6, 0] }),
                        transform: [{ rotate: hand.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
                    },
                ]}
            >
                <View
                    style={{
                        position: 'absolute',
                        left: c - 1,
                        top: c - (inner + maxLen),
                        width: 2,
                        height: inner + maxLen - (inner - 12),
                        borderRadius: 1,
                        backgroundColor: palette.tomato,
                    }}
                />
            </Animated.View>

            <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
                {selected !== null ? (
                    <>
                        <Text style={[styles.label, { color: palette.cobalt }]}>{hourRange(selected).toUpperCase()}</Text>
                        <Text style={styles.total}>{formatTime(hours[selected] ?? 0)}</Text>
                        <Text style={styles.caption}>tap middle for whole day</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>TODAY</Text>
                        <CountUp value={total} format={n => formatTime(n)} style={styles.total} duration={1200} />
                        {caption ? <Text style={[styles.caption, { color: captionColor }]}>{caption}</Text> : null}
                    </>
                )}
            </View>

            {onSelect && (
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={handlePress}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Today by hour. Tap an hour to see its apps."
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontFamily: font.mono,
        fontSize: 11,
        letterSpacing: 1,
        color: palette.inkSoft,
    },
    total: {
        fontFamily: font.display,
        fontSize: 36,
        lineHeight: 42,
        letterSpacing: -1.5,
        color: palette.ink,
        marginTop: 2,
    },
    caption: {
        fontFamily: font.bodySemi,
        fontSize: 11,
        marginTop: 2,
        color: palette.inkSoft,
    },
});

export default DayDial;
