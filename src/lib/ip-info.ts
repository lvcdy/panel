import { getStoredText, setStoredText } from "./storage";

const PUBLIC_IP_API_URL = "https://ipinfo.io/json";
const FALLBACK_IP_TEXT = "IP 信息暂不可用";
const IP_INFO_CACHE_KEY = "ip-info-text-v4" as const;

interface IpInfoData {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    org?: string;
}

const getText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

const getUniqueParts = (parts: unknown[]) => {
    const seen = new Set<string>();

    return parts
        .map(getText)
        .filter((part) => part && !seen.has(part) && seen.add(part));
};

const formatIpSummary = (info: IpInfoData) => {
    const ip = getText(info.ip);
    const location = getUniqueParts([
        info.country,
        info.region,
        info.city,
    ]).join(" ");
    const isp = getText(info.org);

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
        const res = await fetch(PUBLIC_IP_API_URL, {
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as IpInfoData;

        if (!payload.ip) {
            throw new Error("IP response is unavailable");
        }

        const summary = formatIpSummary(payload);
        showIpText(ipText, summary);
        cacheIpText(summary);
    } catch (error) {
        console.debug("获取 IP 信息失败:", error);
        showIpText(ipText, FALLBACK_IP_TEXT);
    }
};
