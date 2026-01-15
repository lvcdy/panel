import { CACHE_KEY, ICON_CACHE_KEY, CACHE_DURATION, type CacheData, type IconCacheData } from "./config";

const getCacheData = <T extends CacheData | IconCacheData>(key: string): T | null => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const data: T = JSON.parse(cached);
        if (Date.now() - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
};

const setCacheData = <T extends CacheData | IconCacheData>(key: string, data: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // 缓存存储失败，继续执行
    }
};

export const getStatusCache = (): Record<string, number | string> | null => {
    const data = getCacheData<CacheData>(CACHE_KEY);
    return data?.statuses || null;
};

export const setStatusCache = (statuses: Record<string, number | string>) => {
    const data: CacheData = { timestamp: Date.now(), statuses };
    setCacheData(CACHE_KEY, data);
};

export const getIconCache = (): Record<string, string> | null => {
    const data = getCacheData<IconCacheData>(ICON_CACHE_KEY);
    return data?.icons || null;
};

export const setIconCache = (icons: Record<string, string>) => {
    const data: IconCacheData = { timestamp: Date.now(), icons };
    setCacheData(ICON_CACHE_KEY, data);
};

export const saveIconToCache = (url: string, dataUrl: string) => {
    const cache = getIconCache() || {};
    cache[url] = dataUrl;
    setIconCache(cache);
};
