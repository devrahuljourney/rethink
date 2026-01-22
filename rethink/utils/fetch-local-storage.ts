import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocalStorageKey } from "./types";

console.log('Evaluating fetch-local-storage.ts');

export const fetchLocalStorage = async (key: LocalStorageKey) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value;
    } catch (error) {
        console.error("Error in fetchLocalStorage:", error);
        return null;
    }
}

export default fetchLocalStorage;