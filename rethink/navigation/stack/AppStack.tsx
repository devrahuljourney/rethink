import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppScreen from '../../screen/HomePage/AppScreen'

export default function AppStack() {
    const stack = createNativeStackNavigator()
  return (
    <stack.Navigator>
        <stack.Screen name="App" component={AppScreen} />
    </stack.Navigator>
  )
}