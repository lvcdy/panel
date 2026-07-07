import { getStoredText, setStoredText } from "./storage";
import { formatIpSummary, FALLBACK_IP_TEXT } from "./ip-utils";
import type { Ip9Data } from "./ip-utils";

const IP_PROXY_URL = "/api/edge-ip";
const IP_INFO_CACHE_KEY = "ip-info-text-v6" as const;

interface EdgeIpResponse {
    ret: number;
    user?: Ip9Data;
    edge?: Ip9Data;
    error?: string;
}

const showIpText = (ipText: HTMLElement | null, text: string) => {
    if (ipText) {
        ipText.textContent = text;
    }
};

const getCachedIpText = () => {
    return getStoredText(IP_INFO_CACHE_KEY, "session");
};

const cacheIpText = (text: string) => {
    setStoredText(IP_INFO_CACHE_KEY, text, "session");
};

export const fetchIpInfo = async (ipText: HTMLElement | null) => {
    const cachedText = getCachedIpText();
    if (cachedText) {
        showIpText(ipText, cachedText);
        return;
    }

    try {
        const res = await fetch(IP_PROXY_URL, {
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as EdgeIpResponse;
        if (payload.ret !== 200 || !payload.user) {
            throw new Error(payload.error || "API unavailable");
        }
        const summary = formatIpSummary(payload.user);
        showIpText(ipText, summary);
        cacheIpText(summary);
    } catch (error) {
        console.debug("获取 IP 信息失败:", error);
        showIpText(ipText, FALLBACK_IP_TEXT);
    }
};
