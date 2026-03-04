import { SELECTOR_CARD } from "./config";
import { getIconCache, setIconCache } from "./cache";

export const loadCachedIcons = () => {
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
    // 批量收集所有图标数据，最终一次写入 localStorage
    const pendingIcons: Record<string, string> = {};
    let pendingCount = 0;
    let totalCount = 0;

    const flushIconCache = () => {
        if (Object.keys(pendingIcons).length === 0) return;
        const existingCache = getIconCache() || {};
        Object.assign(existingCache, pendingIcons);
        setIconCache(existingCache);
    };

    const cards = document.querySelectorAll(SELECTOR_CARD);

    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        const img = card.querySelector("img") as HTMLImageElement;
        if (!url || !img) return;

        totalCount++;

        const collectIcon = () => {
            if (img.complete && img.naturalWidth > 0) {
                const dataUrl = convertImageToDataURL(img);
                if (dataUrl) pendingIcons[url] = dataUrl;
            }
            pendingCount++;
            // 所有图标处理完毕后，一次性写入缓存
            if (pendingCount >= totalCount) {
                flushIconCache();
            }
        };

        if (img.complete) {
            collectIcon();
        } else {
            img.setAttribute("crossorigin", "anonymous");
            img.addEventListener("load", collectIcon, { once: true });
            img.addEventListener("error", () => { pendingCount++; if (pendingCount >= totalCount) flushIconCache(); }, { once: true });
        }
    });

    // 兜底：10 秒后强制写入
    if (totalCount > 0) {
        setTimeout(flushIconCache, 10000);
    }
};
