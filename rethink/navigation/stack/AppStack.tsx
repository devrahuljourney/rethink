import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppScreen from '../../screen/HomePage/AppScreen'

export default function AppStack() {
    const Stack = createNativeStackNavigator()
  return (
    <Stack.Navigator>
        <Stack.Screen name="App" options={{ headerShown: false }} component={AppScreen} />
    </Stack.Navigator>
  )
}