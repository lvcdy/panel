import { NETWORK_INFO_URL } from "./config";
import { scheduleInit } from "./time";

const NETWORK_INFO_TIMEOUT = 2_500;

type NetworkPlatform = "cloudflare" | "edgeone" | "unknown";

interface NetworkInfo {
    platform: NetworkPlatform;
    clientIp: string | null;
    asn: number | null;
    organization: string | null;
    edgeLocation: string | null;
    location: string | null;
}

interface NetworkElements {
    root: HTMLElement;
    loading: HTMLElement;
    unavailable: HTMLElement;
    refresh: HTMLButtonElement;
    ip: HTMLElement;
    location: HTMLElement;
    organization: HTMLElement;
    asn: HTMLElement;
    edgeLocation: HTMLElement;
    platform: HTMLElement;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const cleanText = (value: unknown, maxLength: number): string | null => {
    if (typeof value !== "string") return null;

    const trimmed = value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim();

    return trimmed ? trimmed.slice(0, maxLength) : null;
};

const isIpLike = (value: string): boolean => {
    if (value.includes(":")) {
        return /^[0-9a-fA-F:]+$/.test(value) && value.length <= 64;
    }

    const parts = value.split(".");
    return (
        parts.length === 4 &&
        parts.every(
            (part) =>
                /^\d{1,3}$/.test(part) &&
                Number(part) >= 0 &&
                Number(part) <= 255,
        )
    );
};

const normalizeInfo = (payload: unknown): NetworkInfo | null => {
    if (!isRecord(payload)) return null;

    const platform: NetworkPlatform =
        payload.platform === "cloudflare" || payload.platform === "edgeone"
            ? payload.platform
            : "unknown";

    const rawIp = cleanText(payload.clientIp, 64);
    const clientIp = rawIp && isIpLike(rawIp) ? rawIp : null;

    const rawAsn = payload.asn;
    const asn =
        typeof rawAsn === "number" &&
        Number.isInteger(rawAsn) &&
        rawAsn > 0
            ? rawAsn
            : null;

    return {
        platform,
        clientIp,
        asn,
        organization: cleanText(payload.organization, 120),
        edgeLocation: cleanText(payload.edgeLocation, 16),
        location: cleanText(payload.location, 160),
    };
};

const getElements = (): NetworkElements | null => {
    const root = document.getElementById("network-info");
    const loading = document.getElementById("network-info-loading");
    const unavailable = document.getElementById("network-info-unavailable");
    const refresh = document.getElementById(
        "network-info-refresh",
    ) as HTMLButtonElement | null;
    const ip = document.getElementById("network-ip");
    const location = document.getElementById("network-location");
    const organization = document.getElementById("network-organization");
    const asn = document.getElementById("network-asn");
    const edgeLocation = document.getElementById("network-edge");
    const platform = document.getElementById("network-platform");

    if (
        !root ||
        !loading ||
        !unavailable ||
        !refresh ||
        !ip ||
        !location ||
        !organization ||
        !asn ||
        !edgeLocation ||
        !platform
    ) {
        return null;
    }

    return {
        root,
        loading,
        unavailable,
        refresh,
        ip,
        location,
        organization,
        asn,
        edgeLocation,
        platform,
    };
};

const setNetworkState = (
    elements: NetworkElements,
    state: "loading" | "success" | "unavailable",
): void => {
    elements.root.dataset.state = state;
    elements.loading.hidden = state !== "loading";
    elements.unavailable.hidden = state !== "unavailable";
    elements.refresh.disabled = state === "loading";
    elements.root.setAttribute("aria-busy", String(state === "loading"));

    if (state !== "success") {
        elements.root
            .querySelectorAll<HTMLElement>("[data-network-item]")
            .forEach((item) => {
                item.hidden = true;
            });
    }
};

const getPlatformLabel = (platform: NetworkPlatform): string => {
    if (platform === "cloudflare") return "Cloudflare";
    if (platform === "edgeone") return "EdgeOne";
    return "未知";
};

const renderNetworkInfo = (
    elements: NetworkElements,
    info: NetworkInfo,
): void => {
    elements.ip.textContent = info.clientIp ?? "未知";
    elements.location.textContent = info.location ?? "未知";
    elements.organization.textContent = info.organization ?? "未知";
    elements.asn.textContent = info.asn ? `AS${info.asn}` : "未知";
    elements.edgeLocation.textContent = info.edgeLocation ?? "未知";
    elements.platform.textContent = getPlatformLabel(info.platform);

    elements.root
        .querySelectorAll<HTMLElement>("[data-network-item]")
        .forEach((item) => {
            item.hidden = false;
        });

    setNetworkState(elements, "success");
};

const fetchNetworkInfo = async (elements: NetworkElements): Promise<void> => {
    setNetworkState(elements, "loading");

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setNetworkState(elements, "unavailable");
        elements.refresh.disabled = false;
        return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
        () => controller.abort(),
        NETWORK_INFO_TIMEOUT,
    );

    try {
        const requestUrl = new URL(NETWORK_INFO_URL, window.location.href);
        const response = await fetch(requestUrl.toString(), {
            cache: "no-store",
            headers: { accept: "application/json" },
            signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const info = normalizeInfo(await response.json());
        if (!info?.clientIp) {
            setNetworkState(elements, "unavailable");
            elements.refresh.disabled = false;
            return;
        }

        renderNetworkInfo(elements, info);
    } catch {
        // 404/500/offline/timeout/malformed JSON all degrade quietly to an
        // unavailable state; the user can retry manually.
        setNetworkState(elements, "unavailable");
        elements.refresh.disabled = false;
    } finally {
        window.clearTimeout(timeoutId);
    }
};

export const initNetworkInfo = (): void => {
    const elements = getElements();
    if (!elements) return;

    let inFlight = false;

    const load = (): void => {
        if (inFlight) return;
        inFlight = true;
        void fetchNetworkInfo(elements).finally(() => {
            inFlight = false;
            elements.refresh.disabled = false;
        });
    };

    elements.refresh.addEventListener("click", load);

    // 页脚位于页面底部，滚动到附近时再请求，避免影响首屏。
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                observer.disconnect();
                load();
            },
            { rootMargin: "200px 0px" },
        );
        observer.observe(elements.root);
        return;
    }

    scheduleInit(load);
};
