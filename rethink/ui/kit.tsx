import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TextProps,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { palette, font, radius, stroke, Tone, toneBg, toneInk } from './theme'
import { PopIn, useReduceMotion } from './motion'

// ---- Text ----------------------------------------------------------------------------------------

type Variant = 'hero' | 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'label'

export function Txt({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[type[v], style]} />
}

export const type = StyleSheet.create({
  hero: { fontFamily: font.display, fontSize: 56, lineHeight: 58, color: palette.ink, letterSpacing: -1.5 },
  display: { fontFamily: font.display, fontSize: 38, lineHeight: 42, color: palette.ink, letterSpacing: -1 },
  h1: { fontFamily: font.display, fontSize: 28, lineHeight: 32, color: palette.ink, letterSpacing: -0.5 },
  h2: { fontFamily: font.displayBold, fontSize: 21, lineHeight: 26, color: palette.ink, letterSpacing: -0.3 },
  h3: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 21, color: palette.ink },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: palette.inkSoft },
  bodyStrong: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 22, color: palette.ink },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: palette.inkSoft },
  label: { fontFamily: font.mono, fontSize: 11, lineHeight: 14, color: palette.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase' },
})

// ---- Layout --------------------------------------------------------------------------------------

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  )
}

export function Card({
  children,
  tone = 'card',
  style,
  padded = true,
}: {
  children: React.ReactNode
  tone?: Tone
  style?: StyleProp<ViewStyle>
  padded?: boolean
}) {
  return <View style={[styles.card, { backgroundColor: toneBg(tone) }, padded && styles.cardPad, style]}>{children}</View>
}

// Mono caption above a block, like the labels on a spec sheet.
export function SectionLabel({ children, right, style }: { children: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <Txt v="label">{children}</Txt>
      {right}
    </View>
  )
}

// ---- Stickers & chips ----------------------------------------------------------------------------

export function Sticker({
  text,
  tone = 'sun',
  tilt = -4,
  icon,
  delay = 250,
  style,
}: {
  text: string
  tone?: Tone
  tilt?: number
  icon?: string
  delay?: number
  style?: StyleProp<ViewStyle>
}) {
  const ink = toneInk(tone)
  return (
    <PopIn tilt={tilt} delay={delay} style={[{ alignSelf: 'flex-start' }, style]}>
      <View style={[styles.sticker, { backgroundColor: toneBg(tone) }]}>
        {icon && <Ionicons name={icon} size={12} color={ink} style={{ marginRight: 4 }} />}
        <Text style={[styles.stickerText, { color: ink }]}>{text}</Text>
      </View>
    </PopIn>
  )
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'ink',
  style,
}: {
  label: string
  active?: boolean
  onPress?: () => void
  tone?: Tone
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && { backgroundColor: toneBg(tone) }, style]}
    >
      <Text style={[styles.chipText, active && { color: toneInk(tone) }]}>{label}</Text>
    </Pressable>
  )
}

export function IconTile({
  icon,
  tone = 'sun',
  size = 44,
  style,
}: {
  icon: string
  tone?: Tone
  size?: number
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View
      style={[
        styles.iconTile,
        { width: size, height: size, borderRadius: size * 0.32, backgroundColor: toneBg(tone) },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.48} color={toneInk(tone)} />
    </View>
  )
}

// ---- Buttons -------------------------------------------------------------------------------------

const SHADOW = 4

// Chunky button with a hard ink shadow that collapses when pressed.
export function PopButton({
  title,
  onPress,
  tone = 'ink',
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  title: string
  onPress?: () => void
  tone?: Tone
  icon?: string
  loading?: boolean
  disabled?: boolean
  small?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const ink = toneInk(tone)
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={[{ paddingRight: SHADOW, paddingBottom: SHADOW, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.popShadow,
              // An ink button would vanish into an ink shadow, so it casts tomato instead.
              { borderRadius: small ? radius.sm + 2 : radius.md, backgroundColor: tone === 'ink' ? palette.tomato : palette.ink },
            ]}
          />
          <View
            style={[
              styles.popFace,
              small && styles.popFaceSmall,
              { backgroundColor: toneBg(tone) },
              pressed && { transform: [{ translateX: SHADOW }, { translateY: SHADOW }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={ink} />
            ) : (
              <>
                <Text style={[small ? styles.popTextSmall : styles.popText, { color: ink }]}>{title}</Text>
                {icon && <Ionicons name={icon} size={small ? 15 : 18} color={ink} style={{ marginLeft: 8 }} />}
              </>
            )}
          </View>
        </>
      )}
    </Pressable>
  )
}

export function RoundButton({
  icon,
  onPress,
  tone = 'card',
  label,
  style,
}: {
  icon: string
  onPress?: () => void
  tone?: Tone
  label: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.round, { backgroundColor: toneBg(tone) }, pressed && { transform: [{ scale: 0.92 }] }, style]}
    >
      <Ionicons name={icon} size={20} color={toneInk(tone)} />
    </Pressable>
  )
}

// Back button + title row used on pushed screens.
export function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.topBar}>
      <RoundButton icon="arrow-back" label="Go back" onPress={onBack} />
      <Txt v="h2" style={styles.topBarTitle} numberOfLines={1}>
        {title}
      </Txt>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  )
}

// ---- Inputs --------------------------------------------------------------------------------------

export function Field({
  icon,
  right,
  style,
  inputStyle,
  ...input
}: TextInputProps & { icon?: string; right?: React.ReactNode; style?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle> }) {
  const editable = input.editable !== false
  return (
    <View style={[styles.field, !editable && styles.fieldDisabled, style]}>
      {icon && <Ionicons name={icon} size={19} color={palette.inkSoft} style={{ marginRight: 10 }} />}
      <TextInput
        placeholderTextColor={palette.inkFaint}
        selectionColor={palette.cobalt}
        {...input}
        style={[styles.fieldInput, !editable && { color: palette.inkSoft }, inputStyle]}
      />
      {right}
    </View>
  )
}

export function Toggle({
  value,
  onValueChange,
  tone = 'mint',
  label,
}: {
  value: boolean
  onValueChange: (v: boolean) => void
  tone?: Tone
  label?: string
}) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current
  useEffect(() => {
    Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }, [value, x])

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[styles.toggle, { backgroundColor: value ? toneBg(tone) : palette.card }]}
    >
      <Animated.View
        style={[styles.knob, { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) }] }]}
      />
    </Pressable>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  style?: StyleProp<ViewStyle>
}) {
  const reduce = useReduceMotion()
  const [width, setWidth] = React.useState(0)
  const index = Math.max(0, options.findIndex(o => o.value === value))
  const x = useRef(new Animated.Value(index)).current
  const segW = width / options.length

  useEffect(() => {
    if (reduce) x.setValue(index)
    else Animated.spring(x, { toValue: index, useNativeDriver: true, speed: 16, bounciness: 8 }).start()
  }, [index, reduce, x])

  return (
    <View style={[styles.segmented, style]} onLayout={e => setWidth(e.nativeEvent.layout.width - 8)}>
      {width > 0 && (
        <Animated.View
          style={[
            styles.segmentPill,
            { width: segW, transform: [{ translateX: Animated.multiply(x, segW) }] },
          ]}
        />
      )}
      {options.map(o => {
        const active = o.value === value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.segment}
          >
            <Text style={[styles.segmentText, active && { color: palette.card }]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function Meter({ pct, tone = 'mint', height = 14 }: { pct: number; tone?: Tone; height?: number }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <View style={[styles.meter, { height, borderRadius: height / 2 }]}>
      {clamped > 0 && (
        <View
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: toneBg(tone),
            borderRightWidth: clamped < 100 ? stroke : 0,
            borderColor: palette.ink,
          }}
        />
      )}
    </View>
  )
}

// ---- Styles --------------------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  card: { borderWidth: stroke, borderColor: palette.ink, borderRadius: radius.lg },
  cardPad: { padding: 18 },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },

  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: stroke,
    borderColor: palette.ink,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stickerText: { fontFamily: font.display, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },

  chip: {
    borderWidth: stroke,
    borderColor: palette.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: palette.card,
  },
  chipText: { fontFamily: font.bodyBold, fontSize: 13, color: palette.ink },

  iconTile: { borderWidth: stroke, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },

  popShadow: {
    position: 'absolute',
    left: SHADOW,
    top: SHADOW,
    right: 0,
    bottom: 0,
  },
  popFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 22,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: palette.ink,
  },
  popFaceSmall: { height: 40, paddingHorizontal: 14, borderRadius: radius.sm + 2 },
  popText: { fontFamily: font.display, fontSize: 17, letterSpacing: 0.2 },
  popTextSmall: { fontFamily: font.bodyBold, fontSize: 14 },

  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: stroke,
    borderColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarTitle: { flex: 1, marginHorizontal: 14 },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: palette.ink,
    backgroundColor: palette.card,
  },
  fieldDisabled: { backgroundColor: palette.paper, borderStyle: 'dashed' },
  fieldInput: { flex: 1, fontFamily: font.bodySemi, fontSize: 16, color: palette.ink, paddingVertical: 0 },

  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    borderWidth: stroke,
    borderColor: palette.ink,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.ink,
  },

  segmented: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    padding: 4,
  },
  segmentPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.ink,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  segmentText: { fontFamily: font.bodyBold, fontSize: 14, color: palette.ink },

  meter: {
    width: '100%',
    borderWidth: stroke,
    borderColor: palette.ink,
    backgroundColor: palette.card,
    overflow: 'hidden',
  },
})
