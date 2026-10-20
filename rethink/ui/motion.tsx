import React, { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native'

// ---- Reduce motion -------------------------------------------------------------------------------

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {})
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce)
    return () => sub.remove()
  }, [])
  return reduce
}

// ---- Entrances -----------------------------------------------------------------------------------

/** Rises and fades in after `delay` ms. Stagger siblings by passing increasing delays. */
export function Rise({
  children,
  delay = 0,
  distance = 18,
  style,
}: {
  children: React.ReactNode
  delay?: number
  distance?: number
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const t = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduce) {
      t.setValue(1)
      return
    }
    Animated.spring(t, { toValue: 1, delay, useNativeDriver: true, speed: 8, bounciness: 2 }).start()
  }, [reduce, delay, t])

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

/** Sticker-style entrance: scales up from nothing and swings into its tilt. */
export function PopIn({
  children,
  delay = 0,
  tilt = -4,
  style,
}: {
  children: React.ReactNode
  delay?: number
  tilt?: number
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const t = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduce) {
      t.setValue(1)
      return
    }
    t.setValue(0)
    Animated.spring(t, { toValue: 1, delay, useNativeDriver: true, speed: 7, bounciness: 14 }).start()
  }, [reduce, delay, t])

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { scale: t },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${tilt * 4}deg`, `${tilt}deg`] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

// ---- Numbers -------------------------------------------------------------------------------------

/** Counts from the previous value to `value`, formatting each frame. */
export function CountUp({
  value,
  format,
  duration = 900,
  style,
}: {
  value: number
  format: (n: number) => string
  duration?: number
  style?: StyleProp<TextStyle>
}) {
  const reduce = useReduceMotion()
  const anim = useRef(new Animated.Value(0)).current
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      anim.setValue(value)
      setShown(value)
      return
    }
    const id = anim.addListener(({ value: v }) => setShown(v))
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
    return () => anim.removeListener(id)
  }, [value, duration, reduce, anim])

  return <Text style={style}>{format(shown)}</Text>
}

// ---- Growth --------------------------------------------------------------------------------------

/** A flex slice that grows from zero to `pct` percent of its row's width. */
export function GrowSlice({
  pct,
  delay = 0,
  style,
}: {
  pct: number
  delay?: number
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const w = useRef(new Animated.Value(reduce ? pct : 0)).current

  useEffect(() => {
    if (reduce) {
      w.setValue(pct)
      return
    }
    Animated.timing(w, {
      toValue: pct,
      duration: 700,
      delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start()
  }, [pct, delay, reduce, w])

  return (
    <Animated.View
      style={[style, { width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}
    />
  )
}

// ---- Loops ---------------------------------------------------------------------------------------

/** Slow breathing pulse, for "this is live" dots. */
export function Pulse({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion()
  const t = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduce) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [reduce, t])

  return (
    <Animated.View
      style={[style, { transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }] }]}
    >
      {children}
    </Animated.View>
  )
}

// ---- Touch ---------------------------------------------------------------------------------------

/** Pressable that squishes on touch and springs back. */
export function Squish({
  children,
  style,
  scaleTo = 0.96,
  ...rest
}: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const s = useRef(new Animated.Value(1)).current
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 10 }).start()

  return (
    <Pressable {...rest} onPressIn={(e) => { to(scaleTo); rest.onPressIn?.(e) }} onPressOut={(e) => { to(1); rest.onPressOut?.(e) }}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  )
}

// ---- Poster pieces -------------------------------------------------------------------------------

/** Drops in from above and swings into its tilt, like a card tossed onto a table. */
export function Drop({
  children,
  delay = 0,
  tilt = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  tilt?: number
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const t = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduce) {
      t.setValue(1)
      return
    }
    Animated.spring(t, { toValue: 1, delay, useNativeDriver: true, speed: 6, bounciness: 9 }).start()
  }, [reduce, delay, t])

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${tilt * 4 + (tilt >= 0 ? 8 : -8)}deg`, `${tilt}deg`] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

/** Endless gentle bob, so resting cards feel alive. `phase` (0–1) offsets neighbours. */
export function Float({
  children,
  amplitude = 4,
  duration = 3200,
  phase = 0,
  style,
}: {
  children: React.ReactNode
  amplitude?: number
  duration?: number
  phase?: number
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const t = useRef(new Animated.Value(phase)).current

  useEffect(() => {
    if (reduce) return
    const half = duration / 2
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: half * (1 - phase) + 1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: phase, duration: half * phase + 1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [reduce, duration, phase, t])

  return (
    <Animated.View
      style={[style, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] }) }] }]}
    >
      {children}
    </Animated.View>
  )
}

/** Highlighter stroke that sweeps in left-to-right behind its sibling content. */
export function HighlightSweep({
  color,
  delay = 0,
  style,
}: {
  color: string
  delay?: number
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const t = useRef(new Animated.Value(reduce ? 1 : 0)).current

  useEffect(() => {
    if (reduce) {
      t.setValue(1)
      return
    }
    t.setValue(0)
    Animated.timing(t, { toValue: 1, duration: 650, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [reduce, delay, t])

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', backgroundColor: color, transformOrigin: 'left center' },
        style,
        { transform: [{ scaleX: t }] },
      ]}
    />
  )
}
