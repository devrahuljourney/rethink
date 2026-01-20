import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppScreen from '../../screen/HomePage/AppScreen'
import Setting from '../../screen/HomePage/Setting'

export default function SettingStack() {
    const stack = createNativeStackNavigator()
  return (
    <stack.Navigator>
        <stack.Screen name="Setting" component={Setting} />
    </stack.Navigator>
  )
}