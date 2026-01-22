import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNav from './tab/BottomTabNav'
import Splash from '../splash/Splash';
import { RootStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="MainTab" component={BottomTabNav} />
        </Stack.Navigator>
    )
}