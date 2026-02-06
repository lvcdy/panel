import { SELECTOR_CARD } from "./config";
import { getIconCache, saveIconToCache } from "./cache";

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
    document.querySelectorAll(SELECTOR_CARD).forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        const img = card.querySelector("img") as HTMLImageElement;
        if (!url || !img) return;

        const saveIcon = () => {
            if (img.complete && img.naturalWidth > 0) {
                const dataUrl = convertImageToDataURL(img);
                if (dataUrl) saveIconToCache(url, dataUrl);
            }
        };

        if (img.complete) {
            saveIcon();
        } else {
            img.setAttribute("crossorigin", "anonymous");
            img.addEventListener("load", saveIcon, { once: true });
        }
    });
};
