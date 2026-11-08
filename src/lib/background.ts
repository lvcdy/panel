import { BG_URL } from "./config";
import { getPanelSettings, updatePanelSettings } from "./panel/store";
import type { PanelConfig, StoreResult } from "./panel/types";
import { isValidHttpUrl } from "./utils";

const resolveBackgroundUrl = (url: string): string => url || BG_URL;

const applyBackgroundByUrl = (
    url: string,
    priority: "high" | "low" = "low",
): void => {
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = priority;
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

export const getSavedBackgroundUrl = (): string =>
    getPanelSettings().backgroundUrl;

export const applyBackgroundSetting = (
    url: string,
    priority: "high" | "low" = "low",
): void => {
    applyBackgroundByUrl(resolveBackgroundUrl(url), priority);
};

export const setCustomBackgroundUrl = (
    url: string,
): StoreResult<PanelConfig> => {
    const normalized = url.trim();

    if (normalized && !isValidHttpUrl(normalized)) {
        return {
            ok: false,
            code: "invalid",
            message: "请输入有效的 http/https 图片 URL",
        };
    }

    return updatePanelSettings({ backgroundUrl: normalized });
};

export const initBackgroundImage = (): void => {
    applyBackgroundSetting(getSavedBackgroundUrl(), "high");
};
