import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import FocusMode from '../../screen/HomePage/FocusMode'
import FocusModeDetail from '../../screen/HomePage/FocusModeDetail'
import { FocusStackParamList } from '../navigationTypes'

const Stack = createNativeStackNavigator<FocusStackParamList>()

export default function FocusStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FocusMode" component={FocusMode} />
      <Stack.Screen name="FocusModeDetail" component={FocusModeDetail} />
    </Stack.Navigator>
  )
}
