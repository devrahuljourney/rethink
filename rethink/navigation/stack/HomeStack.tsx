import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../../screen/HomePage/Home';

export default function HomeStack() {
    const stack = createNativeStackNavigator();
    return (
        <stack.Navigator>
            <stack.Screen name="Home" component={Home} />
        </stack.Navigator>
    )
}