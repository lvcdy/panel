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

export type StorageWriteError = "unavailable" | "quota-exceeded" | "unknown";

export interface StorageWriteResult {
    readonly ok: boolean;
    readonly error?: StorageWriteError;
}

/** 写入并返回可区分的错误，供配置仓库提示用户使用 */
export const trySetStoredText = (
    key: string,
    value: string,
    scope: StorageScope = "local",
): StorageWriteResult => {
    const storage = getStorage(scope);
    if (!storage) {
        return { ok: false, error: "unavailable" };
    }

    try {
        storage.setItem(key, value);
        return { ok: true };
    } catch (error) {
        if (
            error instanceof DOMException &&
            (error.name === "QuotaExceededError" ||
                error.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
            return { ok: false, error: "quota-exceeded" };
        }

        return { ok: false, error: "unknown" };
    }
};

export const setStoredText = (
    key: string,
    value: string,
    scope: StorageScope = "local",
) => trySetStoredText(key, value, scope).ok;

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
