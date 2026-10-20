import React from 'react'
import AppNavigator from './AppNavigator';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { palette } from '../ui/theme';
import { AuthProvider } from '../context/AuthContext';
import { InterventionProvider } from '../context/InterventionContext';
import { UsageProvider } from '../context/UsageContext';
import { AppLimitProvider } from '../context/AppLimitContext';
import { FocusModeProvider } from '../context/FocusModeContext';

import { useGuardSync } from '../utils/useGuardSync';

const navTheme: Theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: palette.paper, card: palette.paper, text: palette.ink, border: palette.ink, primary: palette.cobalt },
};

function RootNavigatorContent() {
    useGuardSync(); // Push limits, focus mode and mindful-pause settings to the native guard

    return (
        <NavigationContainer theme={navTheme}>
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