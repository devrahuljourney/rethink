import React from 'react'
import AppNavigator from './AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { InterventionProvider, useIntervention } from '../context/InterventionContext';
import InterventionOverlay from '../screen/Intervention/InterventionOverlay';

function RootNavigatorContent() {
    const { isIntervening } = useIntervention();

    return (
        <NavigationContainer>
            <AppNavigator />
            {isIntervening && <InterventionOverlay />}
        </NavigationContainer>
    );
}

export default function RootNavigator() {
    return (
        <AuthProvider>
            <InterventionProvider>
                <RootNavigatorContent />
            </InterventionProvider>
        </AuthProvider>
    )
}