import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNav from './tab/BottomTabNav'
import Splash from '../splash/Splash';
import AuthNavigator from './AuthNavigator';
import { RootStackParamList } from './navigationTypes';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { isLoading } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isLoading ? (
                <Stack.Screen name="Splash" component={Splash} />
            ) : (
                <>
                    <Stack.Screen name="MainTab" component={BottomTabNav} />
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                </>
            )}
        </Stack.Navigator>
    )
}