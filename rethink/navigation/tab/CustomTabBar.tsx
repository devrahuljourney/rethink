import React, { useEffect, useRef, useState } from 'react'
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette, font, Tone, toneBg, toneInk } from '../../ui/theme'
import { useReduceMotion } from '../../ui/motion'

// Each section owns a colour; the bubble takes it on as it slides over.
const TABS: Record<string, { icon: string; label: string; tone: Tone }> = {
  HomeStack: { icon: 'home', label: 'Today', tone: 'sun' },
  CoachStack: { icon: 'chatbubble-ellipses', label: 'Coach', tone: 'lilac' },
  AppStack: { icon: 'grid', label: 'Apps', tone: 'mint' },
  FocusStack: { icon: 'moon', label: 'Focus', tone: 'tomato' },
  SettingStack: { icon: 'person', label: 'You', tone: 'peach' },
}

const BAR_PAD = 6

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()
  const [width, setWidth] = useState(0)
  const x = useRef(new Animated.Value(state.index)).current
  const squash = useRef(new Animated.Value(1)).current

  const tabW = width / state.routes.length
  const active = TABS[state.routes[state.index].name] ?? TABS.HomeStack

  useEffect(() => {
    if (reduce) {
      x.setValue(state.index)
      return
    }
    // Slide over with a little stretch on the way.
    Animated.parallel([
      Animated.spring(x, { toValue: state.index, useNativeDriver: true, speed: 14, bounciness: 9 }),
      Animated.sequence([
        Animated.timing(squash, { toValue: 1.25, duration: 110, useNativeDriver: true }),
        Animated.spring(squash, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
      ]),
    ]).start()
  }, [state.index, reduce, x, squash])

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} onLayout={e => setWidth(e.nativeEvent.layout.width - BAR_PAD * 2)}>
        {width > 0 && (
          <Animated.View
            style={[
              styles.bubble,
              {
                width: tabW,
                backgroundColor: toneBg(active.tone),
                transform: [{ translateX: Animated.multiply(x, tabW) }, { scaleX: squash }],
              },
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const tab = TABS[route.name] ?? { icon: 'ellipse', label: route.name, tone: 'sun' as Tone }
          const ink = focused ? toneInk(tab.tone) : palette.card

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              style={styles.tab}
            >
              <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={21} color={ink} />
              <Text style={[styles.label, { color: ink, opacity: focused ? 1 : 0.7 }]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: 'row',
    padding: BAR_PAD,
    borderRadius: 32,
    backgroundColor: palette.ink,
  },
  bubble: {
    position: 'absolute',
    top: BAR_PAD,
    bottom: BAR_PAD,
    left: BAR_PAD,
    borderRadius: 26,
  },
  tab: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: font.bodyBold,
    fontSize: 11,
    marginTop: 3,
  },
})
