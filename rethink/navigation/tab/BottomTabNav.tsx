import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import HomeStack from '../stack/HomeStack'
import SettingStack from '../stack/SettingStack'
import AppStack from '../stack/AppStack'
import CoachStack from '../stack/CoachStack'
import FocusStack from '../stack/FocusStack'
import { BottomTabParamList } from '../navigationTypes'
import CustomTabBar from './CustomTabBar'
import { useAuth } from '../../context/AuthContext'
import AuthNavigator from '../AuthNavigator'

const Tab = createBottomTabNavigator<BottomTabParamList>()

export default function BottomTabNav() {
  const { isAuthenticated } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="FocusStack"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Each tab reopens on its root screen, so tabs never show another tab's leftover screen.
        popToTopOnBlur: true,
      }}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} />
      <Tab.Screen
        name="CoachStack"
        component={isAuthenticated ? CoachStack : AuthNavigator}
      />
      <Tab.Screen
        name="AppStack"
        component={isAuthenticated ? AppStack : AuthNavigator}
      />
      <Tab.Screen
        name="FocusStack"
        component={isAuthenticated ? FocusStack : AuthNavigator}
      />
      <Tab.Screen
        name="SettingStack"
        component={isAuthenticated ? SettingStack : AuthNavigator}
      />
    </Tab.Navigator>
  )
}
