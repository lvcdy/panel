import { getStoredText, setStoredText } from "./storage";
import { formatIpSummary, FALLBACK_IP_TEXT } from "./ip-utils";
import type { Ip9Data } from "./ip-utils";

const IP_INFO_CACHE_KEY = "ip-info-text-v7" as const;

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

/** Get user's real IP from ipify (browser direct, supports CORS) */
const fetchUserIp = async (): Promise<string> => {
    const res = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`ipify HTTP ${res.status}`);
    const data = (await res.json()) as { ip?: string };
    if (!data.ip) throw new Error("ipify returned no ip");
    return data.ip;
};

export const fetchIpInfo = async (ipText: HTMLElement | null) => {
    const cachedText = getCachedIpText();
    if (cachedText) {
        showIpText(ipText, cachedText);
        return;
    }

    try {
        // 1. Get user's real IP from browser
        const userIp = await fetchUserIp();

        // 2. Send to edge function for ip9.com.cn geolocation lookup
        const res = await fetch(`/api/edge-ip?ip=${encodeURIComponent(userIp)}`, {
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`edge-ip HTTP ${res.status}`);
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
