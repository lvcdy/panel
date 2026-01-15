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
        if (img && !img.complete) img.src = iconCache[url];
    });
};

export const setupIconCaching = () => {
    const cards = document.querySelectorAll(SELECTOR_CARD);

    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (!url) return;

        const img = card.querySelector("img") as HTMLImageElement;
        if (!img) return;

        const originalOnload = img.onload;
        img.onload = ((ev: Event) => {
            if (originalOnload) originalOnload.call(img, ev);

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (ctx && img.naturalWidth > 0) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                try {
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL("image/png");
                    saveIconToCache(url, dataUrl);
                } catch { }
            }
        }) as any;
    });
};
