import React from 'react'
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { color } from '../../constant/color'


export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index

          const icon =
            route.name === 'HomeStack'
              ? 'home'
              : route.name === 'AppStack'
              ? 'apps'
              : 'settings'

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
              style={[
                styles.tab,
                focused && styles.activeTab,
              ]}
            >
              <Ionicons
                name={focused ? icon : `${icon}-outline`}
                size={22}
                color={focused ? color.black : color.white}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },

  container: {
    flexDirection: 'row',
    padding: 8,
    gap: 10,
    borderRadius: 22,
    backgroundColor: color.secondary,

    shadowColor: color.secondary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },

  tab: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.black,
  },

  activeTab: {
    backgroundColor: color.primary,

    shadowColor: color.primary,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
})
