import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { NavigationContainer } from '@react-navigation/native';

export default function RootNavigator() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    useEffect(() => {
        setIsAuthenticated(true)
    } , [])

    return <NavigationContainer>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
}