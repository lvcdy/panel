import {
    ICON_CACHE_KEY,
    CACHE_ENABLED,
    CACHE_VERSION,
    ICON_CACHE_TTL,
    ICON_CACHE_MAX_SIZE,
    type IconCacheData,
} from "./config";

// ── Helpers ──

const readJSON = <T>(key: string): T | null => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

const writeJSON = (key: string, data: unknown): boolean => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch {
        // QuotaExceededError — 空间不足
        return false;
    }
};

// ── Icon cache ──

export const getIconCache = (): Record<string, string> | null => {
    if (!CACHE_ENABLED) return null;

    const data = readJSON<IconCacheData>(ICON_CACHE_KEY);
    if (!data || data.version !== CACHE_VERSION) return null;
    if (Date.now() - data.timestamp > ICON_CACHE_TTL) {
        localStorage.removeItem(ICON_CACHE_KEY);
        return null;
    }
    return data.icons;
};

/**
 * 写入图标缓存，超过容量限制时自动放弃写入
 */
export const setIconCache = (icons: Record<string, string>) => {
    if (!CACHE_ENABLED) return;

    const payload: IconCacheData = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        icons,
    };

    const serialized = JSON.stringify(payload);
    if (serialized.length > ICON_CACHE_MAX_SIZE) {
        // 超过大小限制，只保留前 N 个条目
        const entries = Object.entries(icons);
        const trimmed: Record<string, string> = {};
        let size = 100; // 预留 JSON 结构开销
        for (const [url, dataUrl] of entries) {
            const entrySize = url.length + dataUrl.length + 10;
            if (size + entrySize > ICON_CACHE_MAX_SIZE) break;
            trimmed[url] = dataUrl;
            size += entrySize;
        }
        payload.icons = trimmed;
    }

    writeJSON(ICON_CACHE_KEY, payload);
};
