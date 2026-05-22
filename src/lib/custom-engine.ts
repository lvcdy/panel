import { isValidHttpUrl } from "./url";
import {
    getStoredJson,
    removeStoredValue,
    setStoredJson,
} from "./storage";

export const CUSTOM_SEARCH_ENGINE_KEY = "custom-search-engine" as const;

export interface CustomSearchEngineConfig {
    name: string;
    url: string;
    placeholder: string;
}

const normalize = (value: string) => value.trim();

export const isValidSearchEngineUrl = (value: string): boolean => {
    return isValidHttpUrl(value);
};

export const getSavedCustomSearchEngine = (): CustomSearchEngineConfig | null => {
    const parsed = getStoredJson<Partial<CustomSearchEngineConfig>>(
        CUSTOM_SEARCH_ENGINE_KEY,
    );
    if (!parsed) return null;

    const name = normalize(parsed.name || "");
    const url = normalize(parsed.url || "");
    const placeholder = normalize(parsed.placeholder || "");

    if (!url || !isValidSearchEngineUrl(url)) return null;

    return {
        name: name || "自定义",
        url,
        placeholder: placeholder || "🔎 输入关键词开始搜索...",
    };
};

export const setCustomSearchEngine = (config: CustomSearchEngineConfig) => {
    const normalized: CustomSearchEngineConfig = {
        name: normalize(config.name) || "自定义",
        url: normalize(config.url),
        placeholder: normalize(config.placeholder) || "🔎 输入关键词开始搜索...",
    };

    setStoredJson(CUSTOM_SEARCH_ENGINE_KEY, normalized);
};

export const clearCustomSearchEngine = () => {
    removeStoredValue(CUSTOM_SEARCH_ENGINE_KEY);
};

export const buildSearchUrl = (urlTemplate: string, query: string) => {
    const encoded = encodeURIComponent(query);
    return urlTemplate.includes("{q}")
        ? urlTemplate.replaceAll("{q}", encoded)
        : `${urlTemplate}${encoded}`;
};
