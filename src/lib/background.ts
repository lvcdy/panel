import { BG_URL } from "./config";
import { getPanelSettings, updatePanelSettings } from "./panel/store";
import type { PanelConfig, StoreResult } from "./panel/types";
import { isValidHttpUrl } from "./utils";

const resolveBackgroundUrl = (url: string): string => url || BG_URL;

// 连续切换背景时，只允许最后一次请求落地，避免旧图 onload 覆盖新图。
let backgroundGeneration = 0;

const applyBackgroundByUrl = (
    url: string,
    priority: "high" | "low" = "low",
): void => {
    const generation = ++backgroundGeneration;
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = priority;
    img.src = url;

    const applyBackground = () => {
        if (generation !== backgroundGeneration) return;
        document.documentElement.style.setProperty("--bg-url", `url("${img.src}")`);
        document.body.classList.add("bg-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
        applyBackground();
    } else {
        img.onload = applyBackground;
        img.onerror = () => {
            if (generation !== backgroundGeneration) return;
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
