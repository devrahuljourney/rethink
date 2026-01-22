import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppScreen from '../../screen/HomePage/AppScreen'
import Setting from '../../screen/HomePage/Setting'

export default function SettingStack() {
    const Stack = createNativeStackNavigator()
  return (
    <Stack.Navigator>
        <Stack.Screen name="Setting" options={{ headerShown: false }} component={Setting} />
    </Stack.Navigator>
  )
}