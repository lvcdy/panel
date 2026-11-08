import { getStoredJson, getStoredText, removeStoredValue } from "../storage";
import { isValidHttpUrl } from "../utils";
import { DEFAULT_SETTINGS, cloneSettings } from "./defaults";
import type { PanelSettings } from "./types";
import { normalizeCustomSearchEngine } from "./validate";

/** 旧版分散存储键：仅在首次迁移时读取，之后以 panel-config 为唯一来源 */
export const LEGACY_STORAGE_KEYS = {
    blur: "card-glass-blur-value",
    saturate: "card-glass-saturate-value",
    backgroundUrl: "custom-bg-url",
    hitokotoApi: "custom-hitokoto-api",
    customSearchEngine: "custom-search-engine",
} as const;

const readRangeValue = (
    key: string,
    min: number,
    max: number,
): number | null => {
    const value = Number.parseInt(getStoredText(key), 10);
    return Number.isInteger(value) && value >= min && value <= max ? value : null;
};

const readOptionalUrl = (key: string): string => {
    const value = getStoredText(key);
    return value && isValidHttpUrl(value) ? value : "";
};

/**
 * 在没有 panel-config 时，把旧版独立存储的设置合并进内存配置。
 * 这里只读不写，避免初始化阶段覆盖用户数据。
 */
export const readLegacySettings = (): PanelSettings => {
    const settings = cloneSettings(DEFAULT_SETTINGS);

    const blur = readRangeValue(LEGACY_STORAGE_KEYS.blur, 0, 100);
    if (blur !== null) settings.glass.blur = blur;

    const saturate = readRangeValue(LEGACY_STORAGE_KEYS.saturate, 100, 200);
    if (saturate !== null) settings.glass.saturate = saturate;

    settings.backgroundUrl = readOptionalUrl(LEGACY_STORAGE_KEYS.backgroundUrl);
    settings.hitokotoApi = readOptionalUrl(LEGACY_STORAGE_KEYS.hitokotoApi);

    const engineErrors: string[] = [];
    settings.customSearchEngine = normalizeCustomSearchEngine(
        getStoredJson<unknown>(LEGACY_STORAGE_KEYS.customSearchEngine),
        "customSearchEngine",
        engineErrors,
    );

    return settings;
};

/** 首次成功写入 panel-config 后清理旧键，避免出现第二个数据源 */
export const clearLegacyKeys = (): void => {
    Object.values(LEGACY_STORAGE_KEYS).forEach((key) => {
        removeStoredValue(key);
    });
};
