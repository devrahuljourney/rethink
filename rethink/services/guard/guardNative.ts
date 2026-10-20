import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { GuardConfig, GuardEvent } from './types';

/**
 * Typed wrapper around the native GuardModule. All enforcement lives in native code;
 * JS only pushes configuration and reads outcome events.
 */
const { GuardModule } = NativeModules;

const isAvailable = Platform.OS === 'android' && !!GuardModule;
const emitter = isAvailable ? new NativeEventEmitter(GuardModule) : null;

export const guardNative = {
    isAvailable,

    async setConfig(config: GuardConfig): Promise<void> {
        if (!isAvailable) return;
        await GuardModule.setConfig(JSON.stringify(config));
    },

    async drainEvents(): Promise<GuardEvent[]> {
        if (!isAvailable) return [];
        const raw: string = await GuardModule.drainEvents();
        return JSON.parse(raw) as GuardEvent[];
    },

    async isServiceEnabled(): Promise<boolean> {
        if (!isAvailable) return false;
        return GuardModule.isServiceEnabled();
    },

    /** Only call after the user accepted the prominent disclosure. */
    openAccessibilitySettings(): void {
        if (isAvailable) GuardModule.openAccessibilitySettings();
    },

    async isIgnoringBatteryOptimizations(): Promise<boolean> {
        if (!isAvailable) return true;
        return GuardModule.isIgnoringBatteryOptimizations();
    },

    openBatteryOptimizationSettings(): void {
        if (isAvailable) GuardModule.openBatteryOptimizationSettings();
    },

    /** Fires (without payload) whenever native appended outcome events; call drainEvents to read them. */
    onEventsAvailable(listener: () => void): () => void {
        const subscription = emitter?.addListener('GuardEventsAvailable', listener);
        return () => subscription?.remove();
    },
};
