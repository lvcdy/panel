// DOM Selectors
export const SELECTOR_CATEGORIES = ".category-section";
export const SELECTOR_CATEGORY_CONTENT = ".category-content";
export const SELECTOR_CATEGORY_TOGGLE_BTN = ".category-toggle-btn";
export const SELECTOR_CATEGORY_TOGGLE_ICON = ".category-toggle-icon";
export const SELECTOR_CATEGORY_TOGGLE_LABEL = ".category-toggle-label";
export const SELECTOR_CARD = ".sun-card";
export const SELECTOR_CARD_TEXT = ".ml-4.overflow-hidden";
export const SELECTOR_CATEGORY_TITLE = "h2.text-2xl";

export const ICON_API = "https://api.afmax.cn/so/ico/index.php?r=";
export const BG_URL = "https://t.alcy.cc/ycy";

// Search & API Configuration
export const DEFAULT_SEARCH_URL = "https://cn.bing.com/search?q=";
export const IP_INFO_URL = "https://ip.xxir.com/";
export const IP_API_PRIMARY = "https://ipapi.xxlb.org/";
export const HITOKOTO_APIS = [
    "https://api.lvcdy.cn/hitokoto",
];

export const SEARCH_TIP_SHOW_TIME = 2000;

// Scroll Configuration
export const SCROLL_THRESHOLD = 300;
export const SCROLL_DURATION = 600;

// Cache Configuration
export const CACHE_KEY = "url_status_cache";
export const ICON_CACHE_KEY = "icon_cache";
// Cache duration: 1 hour
export const CACHE_DURATION = 60 * 60 * 1000;

export interface CacheData {
    timestamp: number;
    statuses: Record<string, number | string>;
}

export interface IconCacheData {
    timestamp: number;
    icons: Record<string, string>;
}

