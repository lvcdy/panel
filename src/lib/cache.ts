import { CACHE_KEY, ICON_CACHE_KEY, CACHE_DURATION, type CacheData, type IconCacheData } from "./config";

export const getStatusCache = (): Record<string, number | string> | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: CacheData = JSON.parse(cached);
        const now = Date.now();

        if (now - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return data.statuses;
    } catch {
        return null;
    }
};

export const setStatusCache = (statuses: Record<string, number | string>) => {
    try {
        const data: CacheData = { timestamp: Date.now(), statuses };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn("无法保存缓存:", error);
    }
};

export const getIconCache = (): Record<string, string> | null => {
    try {
        const cached = localStorage.getItem(ICON_CACHE_KEY);
        if (!cached) return null;

        const data: IconCacheData = JSON.parse(cached);
        const now = Date.now();

        if (now - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem(ICON_CACHE_KEY);
            return null;
        }

        return data.icons;
    } catch {
        return null;
    }
};

export const setIconCache = (icons: Record<string, string>) => {
    try {
        const data: IconCacheData = { timestamp: Date.now(), icons };
        localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn("无法保存图标缓存:", error);
    }
};

export const saveIconToCache = (url: string, dataUrl: string) => {
    try {
        const cache = getIconCache() || {};
        cache[url] = dataUrl;
        setIconCache(cache);
    } catch (error) {
        console.warn("保存图标失败:", error);
    }
};
