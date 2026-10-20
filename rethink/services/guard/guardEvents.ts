import AsyncStorage from '@react-native-async-storage/async-storage';
import { guardNative } from './guardNative';
import type { GuardEvent } from './types';

const STORAGE_KEY = '@guard_events';
const MAX_STORED = 2000;

/**
 * Moves outcome events from the native queue into JS storage, where stats screens
 * (and, in P1, backend sync for the coach) read them.
 */
export const collectGuardEvents = async (): Promise<GuardEvent[]> => {
    const fresh = await guardNative.drainEvents();
    if (!fresh.length) return [];
    const stored = await getGuardEvents();
    const merged = [...stored, ...fresh].slice(-MAX_STORED);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return fresh;
};

export const getGuardEvents = async (): Promise<GuardEvent[]> => {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as GuardEvent[]) : [];
    } catch {
        return [];
    }
};
