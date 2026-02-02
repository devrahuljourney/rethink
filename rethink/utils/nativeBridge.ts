import { NativeModules } from 'react-native';

const { AppEventModule } = NativeModules;

/**
 * Syncs the list of blocked application packages to the native Android service.
 * This ensures that blocking is enforced immediately without waiting for a roundtrip to JS.
 * 
 * @param packageNames Array of package names to block
 */
export const syncBlockedAppsToNative = (packageNames: string[]) => {
    if (AppEventModule && AppEventModule.updateBlockedApps) {
        AppEventModule.updateBlockedApps(packageNames);
    }
};

/**
 * Triggers a manual block for an app.
 * Used for interventions where we want to show the overlay even if not "hard blocked".
 */
export const triggerAppBlock = (packageName: string) => {
    if (AppEventModule && AppEventModule.blockApp) {
        AppEventModule.blockApp(packageName);
    }
};

export default {
    syncBlockedAppsToNative,
    triggerAppBlock,
};
