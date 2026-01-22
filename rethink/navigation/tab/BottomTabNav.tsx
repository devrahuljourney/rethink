import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import HomeStack from '../stack/HomeStack'
import SettingStack from '../stack/SettingStack'
import AppStack from '../stack/AppStack'
import { BottomTabParamList } from '../navigationTypes'
import CustomTabBar from './CustomTabBar'

const Tab = createBottomTabNavigator<BottomTabParamList>()

export default function BottomTabNav() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} />
      <Tab.Screen name="AppStack" component={AppStack} />
      <Tab.Screen name="SettingStack" component={SettingStack} />
    </Tab.Navigator>
  )
}
