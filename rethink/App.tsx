import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { LOCAL_STORAGE } from './constant/localStorage';
import { fetchLocalStorage } from './utils/fetch-local-storage';

export default function App() {
    const [isSplashScreen, setIsSplashScreen] = useState(false);

    useEffect(() => {
        const checkSplashScreen = async () => {
            const value = await fetchLocalStorage(LOCAL_STORAGE.IS_SPLASH_SCREEN);
            if (value) {
                setIsSplashScreen(true);
            }
        };
        checkSplashScreen();
    }, []);

    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    )
}