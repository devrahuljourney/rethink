import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import BackgroundFetch from 'react-native-background-fetch';
import RootNavigator from './navigation/RootNavigator';
import { syncYesterdayUsage } from './services/syncService';
import { palette } from './ui/theme';

export default function App() {
    useEffect(() => {
        // Configure BackgroundFetch
        BackgroundFetch.configure({
            minimumFetchInterval: 15, // minutes
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true,
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        }, async (taskId) => {
            console.log('[BackgroundFetch] event received:', taskId);
            await syncYesterdayUsage();
            BackgroundFetch.finish(taskId);
        }, (error) => {
            console.error('[BackgroundFetch] configure error:', error);
        });

        // Check status
        BackgroundFetch.status((status) => {
            console.log('[BackgroundFetch] status:', status);
        });

        // Also trigger an immediate sync attempt on app start
        syncYesterdayUsage();
    }, []);

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
            <RootNavigator />
        </>
    )
}