import { NativeModules, Platform } from 'react-native';

const { AppEventModule } = NativeModules;

class PermissionManager {
    /**
     * Checks if the Accessibility Service is connected.
     */
    static async checkAccessibilityPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        try {
            return await AppEventModule.isServiceConnected();
        } catch (error) {
            console.error('PermissionManager: Error checking accessibility permission:', error);
            return false;
        }
    }

    /**
     * Opens the Accessibility Settings screen.
     */
    static requestAccessibilityPermission(): void {
        if (Platform.OS !== 'android') return;
        try {
            AppEventModule.openAccessibilitySettings();
        } catch (error) {
            console.error('PermissionManager: Error opening accessibility settings:', error);
        }
    }

    /**
     * Checks if the app has permission to draw over other apps.
     */
    static async checkOverlayPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        try {
            return await AppEventModule.hasOverlayPermission();
        } catch (error) {
            console.error('PermissionManager: Error checking overlay permission:', error);
            return false;
        }
    }

    /**
     * Opens the Overlay Settings screen.
     */
    static requestOverlayPermission(): void {
        if (Platform.OS !== 'android') return;
        try {
            AppEventModule.openOverlaySettings();
        } catch (error) {
            console.error('PermissionManager: Error opening overlay settings:', error);
        }
    }

    /**
     * Checks all required permissions for Smart Intervention.
     */
    static async checkAllPermissions(): Promise<boolean> {
        const hasAccessibility = await this.checkAccessibilityPermission();
        const hasOverlay = await this.checkOverlayPermission();
        return hasAccessibility && hasOverlay;
    }
}

export default PermissionManager;
