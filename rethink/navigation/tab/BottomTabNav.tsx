import { View, Text } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeStack from '../stack/HomeStack';
import SettingStack from '../stack/SettingStack';
import AppStack from '../stack/AppStack';

export default function BottomTabNav() {
    const Tab = createBottomTabNavigator();
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="App" component={AppStack} />

            <Tab.Screen name="Settings" component={SettingStack} />

        </Tab.Navigator>
    )
}