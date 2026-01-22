import { LOCAL_STORAGE } from "../constant/localStorage";

export type LocalStorageKey =
    typeof LOCAL_STORAGE[keyof typeof LOCAL_STORAGE];
