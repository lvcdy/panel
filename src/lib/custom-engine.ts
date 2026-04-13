import { isValidHttpUrl } from "./url";

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
    try {
        const raw = localStorage.getItem(CUSTOM_SEARCH_ENGINE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<CustomSearchEngineConfig>;
        const name = normalize(parsed.name || "");
        const url = normalize(parsed.url || "");
        const placeholder = normalize(parsed.placeholder || "");

        if (!url || !isValidSearchEngineUrl(url)) return null;

        return {
            name: name || "自定义",
            url,
            placeholder: placeholder || "🔎 输入关键词开始搜索...",
        };
    } catch {
        return null;
    }
};

export const setCustomSearchEngine = (config: CustomSearchEngineConfig) => {
    const normalized: CustomSearchEngineConfig = {
        name: normalize(config.name) || "自定义",
        url: normalize(config.url),
        placeholder: normalize(config.placeholder) || "🔎 输入关键词开始搜索...",
    };

    localStorage.setItem(CUSTOM_SEARCH_ENGINE_KEY, JSON.stringify(normalized));
};

export const clearCustomSearchEngine = () => {
    localStorage.removeItem(CUSTOM_SEARCH_ENGINE_KEY);
};

export const buildSearchUrl = (urlTemplate: string, query: string) => {
    const encoded = encodeURIComponent(query);
    return urlTemplate.includes("{q}")
        ? urlTemplate.replaceAll("{q}", encoded)
        : `${urlTemplate}${encoded}`;
};