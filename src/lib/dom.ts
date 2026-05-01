const qs = <T extends HTMLElement>(selector: string): T | null =>
    document.querySelector(selector) as T | null;

// 使用对象字面量表达式创建缓存，支持更好的类型推断
export const createElementCache = () => ({
    clock: qs<HTMLElement>("#clock"),
    date: qs<HTMLElement>("#date"),
    weather: qs<HTMLElement>("#weather-text"),
    weatherBox: qs<HTMLElement>("#weather-info"),
    input: qs<HTMLInputElement>("#searchInput"),
    engineBtn: qs<HTMLElement>("#engineBtn"),
    menu: qs<HTMLElement>("#engineMenu"),
    icon: qs<HTMLElement>("#currentIcon"),
    proName: qs<HTMLElement>("#pro-name"),
    proBox: qs<HTMLElement>("#pro-info"),
    searchBtn: qs<HTMLElement>("#searchBtn"),
    searchTip: qs<HTMLElement>("#searchTip"),
    floatingSearchBtn: qs<HTMLElement>("#floatingSearchBtn"),
} as const);
