import { getStoredJson, setStoredJson } from "./storage";

const SITE_STATUS_URL = "/api/site-status";
const SITE_STATUS_TIMEOUT = 10_000;
const SITE_STATUS_CONCURRENCY = 4;
const SITE_STATUS_RETRY_DELAY = 3_000;
const SITE_STATUS_MAX_RETRIES = 1;
const SITE_STATUS_CACHE_KEY = "site-status-cache" as const;
const SITE_STATUS_CACHE_TTL = 10 * 60 * 1000;
const SITE_STATUS_FALLBACK_TTL = 60 * 1000;

type SiteStatusValue = "UP" | "DOWN" | "SLOW" | "RESTRICTED" | "UNKNOWN";

interface SiteStatusResponse {
    status?: string;
    http_code?: number;
    response_time_ms?: number;
}

interface SiteStatusView {
    state: Lowercase<SiteStatusValue>;
    label: string;
    detail: string;
}

interface StoredSiteStatus {
    status: SiteStatusView;
    timestamp: number;
}

const fallbackStatus: SiteStatusView = {
    state: "unknown",
    label: "待确认",
    detail: "状态暂不可用",
};

const statusCopy: Record<SiteStatusValue, string> = {
    UP: "在线",
    DOWN: "离线",
    SLOW: "缓慢",
    RESTRICTED: "受限",
    UNKNOWN: "待确认",
};

const pendingStatusChecks = new Map<string, Promise<SiteStatusView>>();
const storedStatusCache = getStoredJson<Record<string, StoredSiteStatus>>(
    SITE_STATUS_CACHE_KEY,
    "session",
) || {};
const queuedDomains = new Map<string, {
    resolve: (status: SiteStatusView) => void;
    reject: (reason?: unknown) => void;
}>();
const statusQueue: string[] = [];

let activeChecks = 0;

const getDomain = (value: string) => {
    try {
        return new URL(value).hostname;
    } catch {
        return "";
    }
};

const normalizeStatus = (value: unknown): SiteStatusValue => {
    if (typeof value !== "string") return "UNKNOWN";

    const status = value.toUpperCase();
    return status in statusCopy ? (status as SiteStatusValue) : "UNKNOWN";
};

const formatDetail = (status: SiteStatusValue, payload: SiteStatusResponse) => {
    const parts: string[] = [];

    if (typeof payload.http_code === "number") {
        parts.push(`HTTP ${payload.http_code}`);
    }

    if (typeof payload.response_time_ms === "number") {
        parts.push(`${Math.round(payload.response_time_ms)}ms`);
    }

    return parts.length > 0 ? parts.join(" · ") : statusCopy[status];
};

const fetchSiteStatus = async (domain: string, retries = 0): Promise<SiteStatusView> => {
    try {
        const query = new URLSearchParams({ domain });
        const response = await fetch(`${SITE_STATUS_URL}?${query}`, {
            signal: AbortSignal.timeout(SITE_STATUS_TIMEOUT),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as SiteStatusResponse;
        const status = normalizeStatus(payload.status);

        return {
            state: status.toLowerCase() as Lowercase<SiteStatusValue>,
            label: statusCopy[status],
            detail: formatDetail(status, payload),
        };
    } catch (error) {
        if (!(error instanceof DOMException && error.name === "TimeoutError")) {
            console.debug(`网站状态获取失败 (${domain}):`, error);
        }

        // Retry once after a short delay for network/timeout errors
        if (retries < SITE_STATUS_MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, SITE_STATUS_RETRY_DELAY));
            return fetchSiteStatus(domain, retries + 1);
        }

        return fallbackStatus;
    }
};

const getStoredStatus = (domain: string) => {
    const stored = storedStatusCache[domain];
    if (!stored) {
        return null;
    }

    const ttl = stored.status.state === "unknown"
        ? SITE_STATUS_FALLBACK_TTL
        : SITE_STATUS_CACHE_TTL;

    if (Date.now() - stored.timestamp > ttl) {
        return null;
    }

    return stored.status;
};

const setStoredStatus = (domain: string, status: SiteStatusView) => {
    storedStatusCache[domain] = {
        status,
        timestamp: Date.now(),
    };

    setStoredJson(SITE_STATUS_CACHE_KEY, storedStatusCache, "session");
};

const drainStatusQueue = () => {
    while (activeChecks < SITE_STATUS_CONCURRENCY && statusQueue.length > 0) {
        const domain = statusQueue.shift();
        if (!domain) return;

        const queued = queuedDomains.get(domain);
        if (!queued) continue;

        activeChecks++;
        void fetchSiteStatus(domain)
            .then((status) => {
                setStoredStatus(domain, status);
                queued.resolve(status);
            })
            .catch(queued.reject)
            .finally(() => {
                activeChecks--;
                queuedDomains.delete(domain);
                drainStatusQueue();
            });
    }
};

const queueSiteStatus = (domain: string) =>
    new Promise<SiteStatusView>((resolve, reject) => {
        queuedDomains.set(domain, { resolve, reject });
        statusQueue.push(domain);
        drainStatusQueue();
    });

const getSiteStatus = (domain: string) => {
    const stored = getStoredStatus(domain);
    if (stored) {
        return Promise.resolve(stored);
    }

    const pending = pendingStatusChecks.get(domain);
    if (pending) {
        return pending;
    }

    const check = queueSiteStatus(domain).finally(() => {
        pendingStatusChecks.delete(domain);
    });
    pendingStatusChecks.set(domain, check);
    return check;
};

const updateStatusBadge = (badge: HTMLElement, status: SiteStatusView) => {
    badge.dataset.state = status.state;

    const label = badge.querySelector<HTMLElement>("[data-site-status-label]");
    if (label) {
        label.textContent = status.label;
    }

    badge.title = status.detail;
    badge.setAttribute("aria-label", `网站状态：${status.label}，${status.detail}`);
};

export const setupSiteStatusBadges = () => {
    const badges = document.querySelectorAll<HTMLElement>("[data-site-status]");

    const loadBadge = (badge: HTMLElement) => {
        const domain = getDomain(badge.dataset.siteUrl || "");
        if (!domain) {
            updateStatusBadge(badge, fallbackStatus);
            return;
        }

        void getSiteStatus(domain).then((status) => {
            updateStatusBadge(badge, status);
        });
    };

    if (!("IntersectionObserver" in window)) {
        badges.forEach(loadBadge);
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const badge = entry.target as HTMLElement;
                observer.unobserve(badge);
                loadBadge(badge);
            });
        },
        { rootMargin: "720px 0px" },
    );

    badges.forEach((badge) => observer.observe(badge));
};
