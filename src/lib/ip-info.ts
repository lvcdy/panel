import { getStoredText, setStoredText } from "./storage";

const IP9_API_URL = "/api/ip-info";
const FALLBACK_IP_TEXT = "IP 信息暂不可用";
const IP_INFO_CACHE_KEY = "ip9-info-text" as const;

interface Ip9Info {
    ip?: string;
    country?: string;
    prov?: string;
    city?: string;
    area?: string;
    isp?: string;
}

interface Ip9Response {
    ret?: number;
    data?: Ip9Info;
}

const getText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

const getUniqueParts = (parts: unknown[]) => {
    const seen = new Set<string>();

    return parts
        .map(getText)
        .filter((part) => part && !seen.has(part) && seen.add(part));
};

const formatIpSummary = (info: Ip9Info) => {
    const ip = getText(info.ip);
    const location = getUniqueParts([
        info.country,
        info.prov,
        info.city,
        info.area,
    ]).join(" ");
    const isp = getText(info.isp);

    return [
        ip ? `IP ${ip}` : "",
        location,
        isp,
    ].filter(Boolean).join(" · ") || FALLBACK_IP_TEXT;
};

const showIpText = (ipText: HTMLElement | null, text: string) => {
    if (ipText) {
        ipText.innerText = text;
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
        const res = await fetch(IP9_API_URL, {
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as Ip9Response;
        if (payload.ret !== 200 || !payload.data) {
            throw new Error("IP9 response is unavailable");
        }

        const summary = formatIpSummary(payload.data);
        showIpText(ipText, summary);
        cacheIpText(summary);
    } catch (error) {
        console.debug("获取 IP 信息失败:", error);
        showIpText(ipText, FALLBACK_IP_TEXT);
    }
};
