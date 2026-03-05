import {
    CACHE_KEY,
    ICON_CACHE_KEY,
    CACHE_ENABLED,
    CACHE_VERSION,
    STATUS_CACHE_TTL,
    ICON_CACHE_TTL,
    ICON_CACHE_MAX_SIZE,
    type StatusCacheData,
    type StatusCacheEntry,
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

// ── Status cache (per-entry TTL) ──

const readStatusStore = (): StatusCacheData | null => {
    const data = readJSON<StatusCacheData>(CACHE_KEY);
    if (!data || data.version !== CACHE_VERSION) return null;
    return data;
};

/**
 * 获取未过期的状态缓存条目
 * 返回值只包含在 TTL 内的条目，过期条目自动忽略
 */
export const getStatusCache = (): Record<string, number | string> | null => {
    if (!CACHE_ENABLED) return null;

    const store = readStatusStore();
    if (!store) return null;

    const now = Date.now();
    const result: Record<string, number | string> = {};
    let hasAny = false;

    for (const [url, entry] of Object.entries(store.entries)) {
        if (now - entry.ts <= STATUS_CACHE_TTL) {
            result[url] = entry.value;
            hasAny = true;
        }
    }

    return hasAny ? result : null;
};

/**
 * 合并写入状态缓存 — 保留未过期的旧条目，追加/覆盖新条目
 */
export const setStatusCache = (statuses: Record<string, number | string>) => {
    if (!CACHE_ENABLED) return;

    const now = Date.now();
    const existing = readStatusStore();
    const merged: Record<string, StatusCacheEntry> = {};

    // 保留旧缓存中未过期的条目
    if (existing) {
        for (const [url, entry] of Object.entries(existing.entries)) {
            if (now - entry.ts <= STATUS_CACHE_TTL) {
                merged[url] = entry;
            }
        }
    }

    // 写入新条目
    for (const [url, value] of Object.entries(statuses)) {
        merged[url] = { value, ts: now };
    }

    writeJSON(CACHE_KEY, { version: CACHE_VERSION, entries: merged } satisfies StatusCacheData);
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
