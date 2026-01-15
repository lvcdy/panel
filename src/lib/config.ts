// DOM Selectors
export const SELECTOR_CATEGORIES = ".category-section";
export const SELECTOR_CATEGORY_CONTENT = ".category-content";
export const SELECTOR_CATEGORY_TOGGLE_BTN = ".category-toggle-btn";
export const SELECTOR_CATEGORY_TOGGLE_ICON = ".category-toggle-icon";
export const SELECTOR_CATEGORY_TOGGLE_LABEL = ".category-toggle-label";
export const SELECTOR_CARD = ".sun-card";
export const SELECTOR_CARD_TEXT = ".ml-4.overflow-hidden";
export const SELECTOR_CATEGORY_TITLE = "h2.text-2xl";

// Search Configuration
export const DEFAULT_SEARCH_URL = "https://www.baidu.com/s?wd=";
export const SEARCH_TIP_SHOW_TIME = 2000;

// Scroll Configuration
export const SCROLL_THRESHOLD = 300;
export const SCROLL_DURATION = 600;

// Cache Configuration
export const CACHE_KEY = "url_status_cache";
export const ICON_CACHE_KEY = "icon_cache";
export const CACHE_DURATION = 3 * 60 * 60 * 1000;

export interface CacheData {
    timestamp: number;
    statuses: Record<string, number | string>;
}

export interface IconCacheData {
    timestamp: number;
    icons: Record<string, string>;
}

