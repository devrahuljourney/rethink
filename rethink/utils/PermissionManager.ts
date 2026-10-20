import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { guardNative } from '../services/guard/guardNative';

const DISCLOSURE_CONSENT_KEY = '@accessibility_disclosure_accepted';

class PermissionManager {
    /** True when the guard accessibility service is enabled in system settings. */
    static async checkAccessibilityPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        try {
            return await guardNative.isServiceEnabled();
        } catch (error) {
            console.error('PermissionManager: Error checking accessibility permission:', error);
            return false;
        }
    }

    /**
     * Play policy: the prominent disclosure must be accepted before we send the user to
     * accessibility settings. Callers show <AccessibilityDisclosure /> first.
     */
    static async hasAcceptedDisclosure(): Promise<boolean> {
        return (await AsyncStorage.getItem(DISCLOSURE_CONSENT_KEY)) === 'true';
    }

    static async acceptDisclosure(): Promise<void> {
        await AsyncStorage.setItem(DISCLOSURE_CONSENT_KEY, 'true');
    }

    /** Opens accessibility settings. Must only be called after the disclosure was accepted. */
    static async requestAccessibilityPermission(): Promise<void> {
        if (Platform.OS !== 'android') return;
        if (!(await this.hasAcceptedDisclosure())) {
            console.warn('PermissionManager: disclosure not accepted, not opening accessibility settings');
            return;
        }
        guardNative.openAccessibilitySettings();
    }

    static async checkBatteryOptimizationExempt(): Promise<boolean> {
        return guardNative.isIgnoringBatteryOptimizations();
    }

    static requestBatteryOptimizationExemption(): void {
        guardNative.openBatteryOptimizationSettings();
    }
}

export default PermissionManager;
