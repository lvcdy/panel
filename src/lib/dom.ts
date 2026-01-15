const qs = <T extends HTMLElement>(selector: string) =>
    document.querySelector(selector) as T | null;

export const createElementCache = () => ({
    clock: qs<HTMLElement>("#clock"),
    date: qs<HTMLElement>("#date"),
    ip: qs<HTMLElement>("#ip-address"),
    ipBox: qs<HTMLElement>("#ip-info"),
    input: qs<HTMLInputElement>("#searchInput"),
    engineBtn: qs<HTMLElement>("#engineBtn"),
    menu: qs<HTMLElement>("#engineMenu"),
    icon: qs<HTMLElement>("#currentIcon"),
    searchBtn: qs<HTMLElement>("#searchBtn"),
    searchTip: qs<HTMLElement>("#searchTip"),
    floatingSearchBtn: qs<HTMLElement>("#floatingSearchBtn"),
});
