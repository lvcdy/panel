import { HITOKOTO_APIS } from "./config";
import { getPanelSettings, updatePanelSettings } from "./panel/store";
import type { PanelConfig, StoreResult } from "./panel/types";
import { isValidHttpUrl } from "./utils";

const getHitokotoApiList = (): string[] => {
    const customApi = getPanelSettings().hitokotoApi;
    return customApi ? [customApi, ...HITOKOTO_APIS] : [...HITOKOTO_APIS];
};

export const getSavedHitokotoApi = (): string =>
    getPanelSettings().hitokotoApi;

export const setCustomHitokotoApi = (
    url: string,
): StoreResult<PanelConfig> => {
    const normalized = url.trim();

    if (normalized && !isValidHttpUrl(normalized)) {
        return {
            ok: false,
            code: "invalid",
            message: "请输入有效的 http/https 一言 API URL",
        };
    }

    return updatePanelSettings({ hitokotoApi: normalized });
};

export const fetchHitokoto = async (
    inputEl: HTMLInputElement | null,
): Promise<void> => {
    if (!inputEl) return;

    try {
        const apis = getHitokotoApiList();
        const result = await Promise.any(
            apis.map(async (api) => {
                const res = await fetch(api, {
                    signal: AbortSignal.timeout(3000),
                });
                const data = await res.json();
                if (!data?.hitokoto) {
                    throw new Error("No hitokoto");
                }
                return data as { hitokoto: string; from?: string; creator?: string };
            }),
        );
        const author = result.from || result.creator || "未知";
        inputEl.placeholder = `${result.hitokoto} —— 「${author}」`;
    } catch {
        inputEl.placeholder = "永远相信美好的事情即将发生";
    }
};
