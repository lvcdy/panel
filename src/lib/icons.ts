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
        // Only use cache if it's a data URI (starts with data:image)
        if (img && iconCache[url].startsWith('data:image')) {
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
    const cards = document.querySelectorAll(SELECTOR_CARD);

    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (!url) return;

        const img = card.querySelector("img") as HTMLImageElement;
        if (!img) return;

        const handleLoad = () => {
            if (img.complete && img.naturalWidth > 0) {
                // Convert to Data URL for improved offline/instant loading
                // Note: CORS might block this if the icon API doesn't allow it. 
                // If so, the catch block in convertImageToDataURL handles it gracefully.
                const dataUrl = convertImageToDataURL(img);
                if (dataUrl) {
                    saveIconToCache(url, dataUrl);
                }
            }
        };

        if (img.complete) {
            handleLoad();
        } else {
            img.setAttribute('crossorigin', 'anonymous'); // Try to request CORS access
            img.addEventListener("load", handleLoad, { once: true });
        }
    });
};
