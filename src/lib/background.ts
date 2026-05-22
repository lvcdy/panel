import { BG_URL } from "./config";
import { getStoredText, removeStoredValue, setStoredText } from "./storage";

export const CUSTOM_BG_URL_KEY = "custom-bg-url" as const;

const getCurrentBackgroundUrl = (): string => {
    const savedUrl = getStoredText(CUSTOM_BG_URL_KEY);
    return savedUrl || BG_URL;
};

const applyBackgroundByUrl = (url: string) => {
    const img = new Image();
    img.decoding = "async";
    img.src = url;

    const applyBackground = () => {
        document.documentElement.style.setProperty("--bg-url", `url("${img.src}")`);
        document.body.classList.add("bg-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
        applyBackground();
    } else {
        img.onload = applyBackground;
        img.onerror = () => {
            document.documentElement.style.setProperty("--bg-url", `url("${url}")`);
            document.body.classList.add("bg-loaded");
        };
    }
};

export const getSavedBackgroundUrl = (): string => {
    return getStoredText(CUSTOM_BG_URL_KEY);
};

export const setCustomBackgroundUrl = (url: string) => {
    const normalized = url.trim();
    if (normalized) {
        setStoredText(CUSTOM_BG_URL_KEY, normalized);
        applyBackgroundByUrl(normalized);
        return;
    }

    removeStoredValue(CUSTOM_BG_URL_KEY);
    applyBackgroundByUrl(BG_URL);
};

export const initBackgroundImage = () => {
    applyBackgroundByUrl(getCurrentBackgroundUrl());
};
