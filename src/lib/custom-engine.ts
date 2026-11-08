import { getPanelSettings, updatePanelSettings } from "./panel/store";
import type {
    PanelConfig,
    PanelCustomSearchEngine,
    StoreResult,
} from "./panel/types";
import { isValidHttpUrl } from "./utils";

export type CustomSearchEngineConfig = PanelCustomSearchEngine;

const normalize = (value: string) => value.trim();

export const isValidSearchEngineUrl = (value: string): boolean =>
    isValidHttpUrl(value);

export const getSavedCustomSearchEngine = (): CustomSearchEngineConfig | null =>
    getPanelSettings().customSearchEngine;

export const setCustomSearchEngine = (
    config: CustomSearchEngineConfig,
): StoreResult<PanelConfig> => {
    const url = normalize(config.url);

    if (!url || !isValidSearchEngineUrl(url)) {
        return {
            ok: false,
            code: "invalid",
            message: "请输入有效的 http/https 搜索引擎 URL",
        };
    }

    return updatePanelSettings({
        customSearchEngine: {
            name: normalize(config.name) || "自定义",
            url,
            placeholder: normalize(config.placeholder) || "🔎 输入关键词开始搜索...",
        },
    });
};

export const clearCustomSearchEngine = (): StoreResult<PanelConfig> =>
    updatePanelSettings({ customSearchEngine: null });

export const buildSearchUrl = (urlTemplate: string, query: string) => {
    const encoded = encodeURIComponent(query);
    return urlTemplate.includes("{q}")
        ? urlTemplate.replaceAll("{q}", encoded)
        : `${urlTemplate}${encoded}`;
};
