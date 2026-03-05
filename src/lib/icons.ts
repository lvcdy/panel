import { SELECTOR_CARD, CACHE_ENABLED } from "./config";
import { getIconCache, setIconCache } from "./cache";

export const loadCachedIcons = () => {
    if (!CACHE_ENABLED) return;

    const iconCache = getIconCache();
    if (!iconCache) return;

    document.querySelectorAll(SELECTOR_CARD).forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        const img = card.querySelector("img") as HTMLImageElement;
        if (url && iconCache[url] && img) {
            img.src = iconCache[url];
        }
    });
};

const convertImageToDataURL = (img: HTMLImageElement): string | null => {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL("image/png");
    } catch {
        return null;
    }
};

export const setupIconCaching = () => {
    if (!CACHE_ENABLED) return;

    const pendingIcons: Record<string, string> = {};
    let settled = 0;
    let total = 0;
    let flushed = false;

    const flush = () => {
        if (flushed) return;
        flushed = true;
        if (Object.keys(pendingIcons).length === 0) return;
        const existing = getIconCache() || {};
        Object.assign(existing, pendingIcons);
        setIconCache(existing);
    };

    const cards = document.querySelectorAll(SELECTOR_CARD);

    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        const img = card.querySelector("img") as HTMLImageElement;
        if (!url || !img) return;

        total++;

        const collect = () => {
            if (img.complete && img.naturalWidth > 0) {
                const dataUrl = convertImageToDataURL(img);
                if (dataUrl) pendingIcons[url] = dataUrl;
            }
            settled++;
            if (settled >= total) flush();
        };

        if (img.complete) {
            collect();
        } else {
            img.addEventListener("load", collect, { once: true });
            img.addEventListener("error", () => { settled++; if (settled >= total) flush(); }, { once: true });
        }
    });

    // 兜底：10 秒后强制写入
    if (total > 0) {
        setTimeout(flush, 10000);
    }
};
