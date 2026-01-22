import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Ionicons from 'react-native-vector-icons/Ionicons'

import HomeStack from '../stack/HomeStack'
import SettingStack from '../stack/SettingStack'
import AppStack from '../stack/AppStack'
import { BottomTabParamList } from '../navigationTypes'

const Tab = createBottomTabNavigator<BottomTabParamList>()

export default function BottomTabNav() {
    const nav = [
        {
            name: 'HomeStack' as const,
            component: HomeStack,
            icon: 'home-outline',
            showHeader: false,
        },
        {
            name: 'AppStack' as const,
            component: AppStack,
            icon: 'apps-outline',
            showHeader: false,
        },
        {
            name: 'SettingStack' as const,
            component: SettingStack,
            icon: 'settings-outline',
            showHeader: false,
        },
    ]

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const currentTab = nav.find(item => item.name === route.name)
                    const iconName = currentTab ? currentTab.icon : 'help-outline'

                    return (
                        <Ionicons
                            name={
                                focused
                                    ? iconName.replace('-outline', '')
                                    : iconName
                            }
                            size={size}
                            color={color}
                        />
                    )
                },
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            {nav.map((item, index) => (
                <Tab.Screen
                    key={index}
                    name={item.name}
                    component={item.component}
                    options={{ headerShown: item.showHeader }}
                />
            ))}
        </Tab.Navigator>
    )
}
