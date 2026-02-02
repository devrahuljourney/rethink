import React from 'react'
import AppNavigator from './AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { InterventionProvider, useIntervention } from '../context/InterventionContext';
import { UsageProvider } from '../context/UsageContext';
import { AppLimitProvider } from '../context/AppLimitContext';
import { FocusModeProvider } from '../context/FocusModeContext';
import InterventionOverlay from '../screen/Intervention/InterventionOverlay';

import { useBlockingSync } from '../utils/useBlockingSync';

function RootNavigatorContent() {
    const { isIntervening } = useIntervention();
    useBlockingSync(); // Synchronize blocked apps to native

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
            <UsageProvider>
                <AppLimitProvider>
                    <FocusModeProvider>
                        <InterventionProvider>
                            <RootNavigatorContent />
                        </InterventionProvider>
                    </FocusModeProvider>
                </AppLimitProvider>
            </UsageProvider>
        </AuthProvider>
    )
}