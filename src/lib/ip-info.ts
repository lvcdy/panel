import { getStoredText, setStoredText } from "./storage";
import { formatIpSummary, fetchIp9, FALLBACK_IP_TEXT, type Ip9Response } from "./ip-utils";

const IP_PROXY_URL = "/api/ip-info";
const IP_INFO_CACHE_KEY = "ip-info-text-v6" as const;

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
        const payload = await fetchIp9(IP_PROXY_URL, 5000);
        const summary = formatIpSummary(payload.data!);
        showIpText(ipText, summary);
        cacheIpText(summary);
    } catch (error) {
        console.debug("获取 IP 信息失败:", error);
        showIpText(ipText, FALLBACK_IP_TEXT);
    }
};
