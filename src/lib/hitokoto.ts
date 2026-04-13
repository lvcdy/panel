import { HITOKOTO_APIS } from "./config";

export const CUSTOM_HITOKOTO_API_KEY = "custom-hitokoto-api" as const;

const getHitokotoApiList = (): string[] => {
    const customApi = localStorage.getItem(CUSTOM_HITOKOTO_API_KEY)?.trim();
    return customApi ? [customApi, ...HITOKOTO_APIS] : [...HITOKOTO_APIS];
};

export const getSavedHitokotoApi = (): string => {
    return localStorage.getItem(CUSTOM_HITOKOTO_API_KEY)?.trim() || "";
};

export const setCustomHitokotoApi = (url: string) => {
    const normalized = url.trim();
    if (normalized) {
        localStorage.setItem(CUSTOM_HITOKOTO_API_KEY, normalized);
        return;
    }

    localStorage.removeItem(CUSTOM_HITOKOTO_API_KEY);
};

export const fetchHitokoto = async (inputEl: HTMLInputElement | null) => {
    if (!inputEl) return;

    try {
        for (const api of getHitokotoApiList()) {
            try {
                const res = await fetch(api, {
                    signal: AbortSignal.timeout(3000),
                });
                const data = await res.json();
                if (data?.hitokoto) {
                    const author = data.from || data.creator || "未知";
                    inputEl.placeholder = `${data.hitokoto} —— 「${author}」`;
                    return;
                }
            } catch (error) {
                console.warn(`一言 API (${api}) 请求失败:`, error);
                continue;
            }
        }
        inputEl.placeholder = "永远相信美好的事情即将发生";
    } catch (error) {
        console.warn("获取一言失败:", error);
        inputEl.placeholder = "永远相信美好的事情即将发生";
    }
};
