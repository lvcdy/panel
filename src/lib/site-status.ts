import { SITE_STATUS_URL } from "./config";
import { getStoredJson, setStoredJson } from "./storage";

const SITE_STATUS_TIMEOUT = 2_000;
const SITE_STATUS_CONCURRENCY = 4;
const SITE_STATUS_CACHE_KEY = "site-status-cache" as const;
const SITE_STATUS_CACHE_TTL = 10 * 60 * 1000;
const SITE_STATUS_FALLBACK_TTL = 60 * 1000;

type SiteStatusValue = "UP" | "DOWN" | "SLOW" | "RESTRICTED" | "UNKNOWN";
type SiteStatusState = Lowercase<SiteStatusValue>;

interface SiteStatusView {
    state: SiteStatusState;
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

const VALID_STATES = new Set<SiteStatusState>([
    "up",
    "down",
    "slow",
    "restricted",
    "unknown",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const readInitialCache = (): Record<string, StoredSiteStatus> => {
    const raw = getStoredJson<unknown>(SITE_STATUS_CACHE_KEY, "session");
    if (!isRecord(raw)) return {};

    const cache: Record<string, StoredSiteStatus> = {};

    Object.entries(raw).forEach(([domain, value]) => {
        if (!isRecord(value)) return;

        const timestamp = value.timestamp;
        const status = value.status;
        if (typeof timestamp !== "number" || !isRecord(status)) return;

        const state = status.state;
        const label = status.label;
        const detail = status.detail;

        if (
            typeof state !== "string" ||
            !VALID_STATES.has(state as SiteStatusState) ||
            typeof label !== "string" ||
            typeof detail !== "string"
        ) {
            return;
        }

        cache[domain] = {
            timestamp,
            status: {
                state: state as SiteStatusState,
                label,
                detail,
            },
        };
    });

    return cache;
};

const pendingStatusChecks = new Map<string, Promise<SiteStatusView>>();
const storedStatusCache = readInitialCache();
const queuedDomains = new Map<string, {
    resolve: (status: SiteStatusView) => void;
    reject: (reason?: unknown) => void;
}>();
const statusQueue: string[] = [];
const activeControllers = new Set<AbortController>();

let activeChecks = 0;
let badgeObserver: IntersectionObserver | null = null;
let siteStatusApiUnavailable = false;

const markApiUnavailable = (): void => {
    if (siteStatusApiUnavailable) return;
    siteStatusApiUnavailable = true;

    activeControllers.forEach((controller) => controller.abort());
    activeControllers.clear();

    const queued = Array.from(queuedDomains.values());
    queuedDomains.clear();
    statusQueue.length = 0;
    queued.forEach((entry) => entry.resolve(fallbackStatus));
};

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
    return Object.prototype.hasOwnProperty.call(statusCopy, status)
        ? (status as SiteStatusValue)
        : "UNKNOWN";
};

const formatDetail = (
    status: SiteStatusValue,
    httpCode?: number,
    responseTime?: number,
): string => {
    const parts: string[] = [];

    if (typeof httpCode === "number") {
        parts.push(`HTTP ${httpCode}`);
    }

    if (typeof responseTime === "number") {
        parts.push(`${Math.round(responseTime)}ms`);
    }

    return parts.length > 0 ? parts.join(" · ") : statusCopy[status];
};

const fetchSiteStatus = async (domain: string): Promise<SiteStatusView> => {
    if (siteStatusApiUnavailable) return fallbackStatus;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        markApiUnavailable();
        return fallbackStatus;
    }

    const controller = new AbortController();
    activeControllers.add(controller);
    const timeoutId = window.setTimeout(
        () => controller.abort(),
        SITE_STATUS_TIMEOUT,
    );

    try {
        const requestUrl = new URL(SITE_STATUS_URL, window.location.href);
        requestUrl.searchParams.set("domain", domain);

        const response = await fetch(requestUrl.toString(), {
            cache: "no-store",
            headers: { accept: "application/json" },
            signal: controller.signal,
        });

        // A 400 is a per-domain validation failure; it must not disable the
        // API for other domains. 404/5xx and network failures are global.
        if (response.status === 400) {
            return fallbackStatus;
        }

        if (!response.ok) {
            markApiUnavailable();
            return fallbackStatus;
        }

        let payload: unknown;
        try {
            payload = await response.json();
        } catch {
            markApiUnavailable();
            return fallbackStatus;
        }

        if (!isRecord(payload) || typeof payload.status !== "string") {
            markApiUnavailable();
            return fallbackStatus;
        }

        const status = normalizeStatus(payload.status);
        const httpCode =
            typeof payload.http_code === "number" &&
            Number.isFinite(payload.http_code)
                ? payload.http_code
                : undefined;
        const responseTime =
            typeof payload.response_time_ms === "number" &&
            Number.isFinite(payload.response_time_ms)
                ? payload.response_time_ms
                : undefined;

        return {
            state: status.toLowerCase() as SiteStatusState,
            label: statusCopy[status],
            detail: formatDetail(status, httpCode, responseTime),
        };
    } catch {
        // Timeout, offline, CORS, missing Functions, or an aborted request:
        // stop the rest of the queue instead of hammering 30+ domains.
        markApiUnavailable();
        return fallbackStatus;
    } finally {
        window.clearTimeout(timeoutId);
        activeControllers.delete(controller);
    }
};

const getStoredStatus = (domain: string) => {
    const stored = storedStatusCache[domain];
    if (!stored) return null;

    const ttl =
        stored.status.state === "unknown"
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
    if (siteStatusApiUnavailable) return;

    while (
        activeChecks < SITE_STATUS_CONCURRENCY &&
        statusQueue.length > 0
    ) {
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

const queueSiteStatus = (domain: string) => {
    if (siteStatusApiUnavailable) {
        return Promise.resolve(fallbackStatus);
    }

    return new Promise<SiteStatusView>((resolve, reject) => {
        queuedDomains.set(domain, { resolve, reject });
        statusQueue.push(domain);
        drainStatusQueue();
    });
};

const getSiteStatus = (domain: string) => {
    const stored = getStoredStatus(domain);
    if (stored) {
        return Promise.resolve(stored);
    }

    if (siteStatusApiUnavailable) {
        return Promise.resolve(fallbackStatus);
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
    badgeObserver?.disconnect();
    badgeObserver = null;

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

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        markApiUnavailable();
    }

    if (siteStatusApiUnavailable) {
        badges.forEach(loadBadge);
        return;
    }

    if (!("IntersectionObserver" in window)) {
        badges.forEach(loadBadge);
        return;
    }

    badgeObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const badge = entry.target as HTMLElement;
                badgeObserver?.unobserve(badge);
                loadBadge(badge);
            });
        },
        { rootMargin: "720px 0px" },
    );

    badges.forEach((badge) => badgeObserver?.observe(badge));
};
