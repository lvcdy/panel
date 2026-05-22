type StorageScope = "local" | "session";

const getStorage = (scope: StorageScope) => {
    if (typeof window === "undefined") return null;

    try {
        return scope === "local" ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
};

export const getStoredText = (key: string, scope: StorageScope = "local") => {
    try {
        return getStorage(scope)?.getItem(key)?.trim() || "";
    } catch {
        return "";
    }
};

export const getStoredJson = <T>(key: string, scope: StorageScope = "local") => {
    const raw = getStoredText(key, scope);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

export const setStoredText = (
    key: string,
    value: string,
    scope: StorageScope = "local",
) => {
    try {
        const storage = getStorage(scope);
        if (!storage) return false;

        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

export const setStoredJson = (
    key: string,
    value: unknown,
    scope: StorageScope = "local",
) => setStoredText(key, JSON.stringify(value), scope);

export const removeStoredValue = (key: string, scope: StorageScope = "local") => {
    try {
        getStorage(scope)?.removeItem(key);
    } catch {
        // Keep page interactions working when browser storage is unavailable.
    }
};
