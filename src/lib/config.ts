// DOM Selectors
export const SELECTOR_CATEGORIES = ".category-section" as const;
export const SELECTOR_CATEGORY_CONTENT = ".category-content" as const;
export const SELECTOR_CATEGORY_TOGGLE_BTN = ".category-toggle-btn" as const;
export const SELECTOR_CATEGORY_TOGGLE_ICON = ".category-toggle-icon" as const;
export const SELECTOR_CATEGORY_TOGGLE_LABEL = ".category-toggle-label" as const;
export const SELECTOR_CARD = ".sun-card" as const;
export const SELECTOR_CARD_TEXT = ".ml-4.overflow-hidden" as const;
export const SELECTOR_CATEGORY_TITLE = "h2.text-2xl" as const;

export const ICON_API = "https://api.lvcdy.cn/favicon?url=" as const;
export const BG_URL = "https://t.alcy.cc/ycy" as const;

// Search & API Configuration
export const DEFAULT_SEARCH_URL = "https://cn.bing.com/search?q=" as const;
export const IP_INFO_URL = "https://ip.xxir.com/" as const;
export const IP_API_PRIMARY = "https://ipapi.xxlb.org/" as const;
export const HITOKOTO_APIS = [
    "https://api.lvcdy.cn/hitokoto",
] as const satisfies readonly string[];

export const SEARCH_TIP_SHOW_TIME = 2000 as const;

// Scroll Configuration
export const SCROLL_THRESHOLD = 300 as const;
export const SCROLL_DURATION = 600 as const;

// Cache Configuration
export const CACHE_KEY = "url_status_cache" as const;
export const ICON_CACHE_KEY = "icon_cache" as const;
export const CACHE_ENABLED = false as const;
// Cache duration: 1 hour
export const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export interface CacheData {
    timestamp: number;
    statuses: Record<string, number | string>;
}

export interface IconCacheData {
    timestamp: number;
    icons: Record<string, string>;
}

