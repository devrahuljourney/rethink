import React from 'react'
import AppNavigator from './AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { InterventionProvider } from '../context/InterventionContext';
import { UsageProvider } from '../context/UsageContext';
import { AppLimitProvider } from '../context/AppLimitContext';
import { FocusModeProvider } from '../context/FocusModeContext';

import { useGuardSync } from '../utils/useGuardSync';

function RootNavigatorContent() {
    useGuardSync(); // Push limits, focus mode and mindful-pause settings to the native guard

    return (
        <NavigationContainer>
            <AppNavigator />
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