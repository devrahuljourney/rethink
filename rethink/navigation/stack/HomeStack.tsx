import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../../screen/HomePage/Home';

export default function HomeStack() {
    const Stack = createNativeStackNavigator();
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" options={{ headerShown: false }} component={Home} />
        </Stack.Navigator>
    )
}