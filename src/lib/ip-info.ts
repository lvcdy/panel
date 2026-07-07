import { getStoredText, setStoredText } from "./storage";

const IP_PROXY_URL = "/api/ip-info";
const FALLBACK_IP_TEXT = "IP 信息暂不可用";
const IP_INFO_CACHE_KEY = "ip-info-text-v6" as const;

interface Ip9Data {
    ip?: string;
    country?: string;
    prov?: string;
    city?: string;
    area?: string;
    isp?: string;
}

interface Ip9Response {
    ret?: number;
    data?: Ip9Data;
    error?: string;
}

const getText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

const getUniqueParts = (parts: unknown[]) => {
    const seen = new Set<string>();

    return parts
        .map(getText)
        .filter((part) => part && !seen.has(part) && seen.add(part));
};

const formatIpSummary = (info: Ip9Response) => {
    const d = info.data;
    if (!d) return FALLBACK_IP_TEXT;

    const ip = getText(d.ip);
    const location = getUniqueParts([
        d.country,
        d.prov,
        d.city,
        d.area,
    ]).join(" ");
    const isp = getText(d.isp);

    return [
        ip ? `IP ${ip}` : "",
        location,
        isp,
    ].filter(Boolean).join(" · ") || FALLBACK_IP_TEXT;
};

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
            headers: { accept: "application/json" },
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as Ip9Response;

        if (payload.ret !== 200 || !payload.data?.ip) {
            throw new Error(payload.error || "IP9 API response unavailable");
        }

        const summary = formatIpSummary(payload);
        showIpText(ipText, summary);
        cacheIpText(summary);
    } catch (error) {
        console.debug("获取 IP 信息失败:", error);
        showIpText(ipText, FALLBACK_IP_TEXT);
    }
};
