import { SELECTOR_CARD } from "./config";
import { getIconCache, saveIconToCache } from "./cache";

export const loadCachedIcons = () => {
    const iconCache = getIconCache();
    if (!iconCache) return;

    const cards = document.querySelectorAll(SELECTOR_CARD);
    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (!url || !iconCache[url]) return;

        const img = card.querySelector("img") as HTMLImageElement;
        if (img && !img.complete) {
            img.src = iconCache[url];
        }
    });
};

export const setupIconCaching = () => {
    const cards = document.querySelectorAll(SELECTOR_CARD);

    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (!url) return;

        const img = card.querySelector("img") as HTMLImageElement;
        if (!img) return;

        // 监听图片加载完成
        const handleLoad = () => {
            // 简化缓存逻辑，直接保存图片URL而不是转换为canvas
            if (img.src && img.complete && img.naturalWidth > 0) {
                saveIconToCache(url, img.src);
            }
        };

        if (img.complete) {
            handleLoad();
        } else {
            img.addEventListener("load", handleLoad, { once: true });
        }
    });
};
