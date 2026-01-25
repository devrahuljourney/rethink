import { View, Text } from 'react-native'
import React from 'react'
import { AuthStackParamList } from './navigationTypes';
import Login from '../screen/Auth/Login';
import Signup from '../screen/Auth/Signup';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<AuthStackParamList>();
export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
    </Stack.Navigator>
  )
}