import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppScreen from '../../screen/HomePage/AppScreen'
import AppDetails from '../../screen/HomePage/AppDetails'
import { AppStackParamList } from '../navigationTypes'

export default function AppStack() {
  const Stack = createNativeStackNavigator<AppStackParamList>()
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="App" component={AppScreen} />
      <Stack.Screen name="AppDetails" component={AppDetails} />
    </Stack.Navigator>
  )
}