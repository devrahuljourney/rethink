import { NativeModules } from 'react-native';

const { AppEventModule } = NativeModules;

/**
 * Headless JS task that runs when an app foreground change is detected 
 * while the Rethink app is not in the foreground.
 */
const AppMonitorTask = async (taskData: { packageName: string }) => {
    const { packageName } = taskData;
    console.log('[HeadlessTask] Foreground app changed to:', packageName);

    // Here we could check against a persistent list of monitored apps (e.g. from AsyncStorage)
    // For now, let's keep it simple. If we want to trigger the intervention:

    // NOTE: Headless JS cannot directly modify React Context or show UI components.
    // Instead, it should use NativeModules to bring the app to the foreground
    // which will then trigger the UI intervention via the regular event listener.

    const MONITORED_APPS = [
        'com.google.android.youtube',
        'com.google.android.apps.photos',
        'com.instagram.android',
        'com.facebook.katana',
        'com.zhiliaoapp.musically',
    ];

    if (MONITORED_APPS.includes(packageName)) {
        console.log('[HeadlessTask] Monitored app detected, bringing Rethink to foreground.');
        if (AppEventModule) {
            // blockApp basically starts MainActivity with a flag
            AppEventModule.blockApp(packageName);
        }
    }
};

export default AppMonitorTask;
