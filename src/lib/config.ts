// DOM Selectors
export const SELECTOR_CATEGORIES = ".category-section" as const;
export const SELECTOR_CATEGORY_TOGGLE_BTN = ".category-toggle-btn" as const;
export const SELECTOR_CATEGORY_TOGGLE_ICON = ".category-toggle-icon" as const;
export const SELECTOR_CATEGORY_TOGGLE_LABEL = ".category-toggle-label" as const;
export const SELECTOR_CARD = ".sun-card" as const;
export const SELECTOR_CARD_TEXT = "[data-card-text]" as const;
export const SELECTOR_CATEGORY_TITLE = ".category-title" as const;

export const ICON_API = "https://api.lvcdy.cn/favicon?url=" as const;
export const BG_URL = "https://t.alcy.cc/ycy" as const;

// Search & API Configuration
export const DEFAULT_SEARCH_URL = "https://cn.bing.com/search?q=" as const;
export const IP_INFO_URL = "https://ip.xxir.com/" as const;
export const IP_API_PRIMARY = "https://ipapi.xxlb.org/" as const;
export const WEATHER_API_URL = "https://api.seniverse.com/v3/weather/now.json" as const;
export const WEATHER_API_KEY = "SUnfUoGPmINHHfYrc" as const;
export const WEATHER_DEFAULT_LOCATION = "beijing" as const;
export const WEATHER_DEFAULT_LABEL = "北京" as const;
export const HITOKOTO_APIS = [
    "https://api.lvcdy.cn/hitokoto",
] as const satisfies readonly string[];

export const GOOGLE_SVG_ICON = '<svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';

export const SEARCH_TIP_SHOW_TIME = 2000 as const;

// Scroll Configuration
export const SCROLL_THRESHOLD = 300 as const;
export const SCROLL_DURATION = 600 as const;

// Cache Configuration
export const CACHE_KEY = "url_status_cache" as const;
export const ICON_CACHE_KEY = "icon_cache" as const;
export const CACHE_ENABLED = false as const;
export const CACHE_VERSION = 1 as const;
// Status cache: individual entry TTL (30 minutes)
export const STATUS_CACHE_TTL = 1800000 as const;
// Icon cache: longer TTL (24 hours)
export const ICON_CACHE_TTL = 86400000 as const;
// Icon cache max size in bytes (~2MB to stay safe within 5MB localStorage limit)
export const ICON_CACHE_MAX_SIZE = 2097152 as const; // 2MB

export interface StatusCacheEntry {
    value: number | string;
    ts: number;
}

export interface StatusCacheData {
    version: number;
    entries: Record<string, StatusCacheEntry>;
}

export interface IconCacheData {
    version: number;
    timestamp: number;
    icons: Record<string, string>;
}

