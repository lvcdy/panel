import { SELECTOR_CARD } from "./config";
import { getStatusCache, setStatusCache } from "./cache";

interface UrlStatusResult {
    status: number | string;
}

const STATUS_API_URL = "https://api.lvcdy.cn/uptime?url=";

export const checkUrlStatus = async (url: string): Promise<UrlStatusResult> => {
    try {
        const res = await fetch(`${STATUS_API_URL}${encodeURIComponent(url)}`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            return { status: "error" };
        }
        const data = await res.json();
        return { status: data.code ?? "error" };
    } catch {
        return { status: "error" };
    }
};

export const updateStatusIndicator = (card: HTMLElement, status: number | string) => {
    const indicator = card.querySelector(".status-indicator") as HTMLElement;
    if (!indicator) return;

    indicator.classList.remove("bg-white/20");

    const statusConfig = {
        200: { bg: "#4ade80", title: "可用" },
        429: { bg: "#fbbf24", title: "限流" },
        403: { bg: "#fb923c", title: "禁止访问" },
    } as const;

    const numStatus = Number(status);
    const config = numStatus in statusConfig
        ? statusConfig[numStatus as keyof typeof statusConfig]
        : { bg: "#ef4444", title: "无法访问" };

    indicator.style.backgroundColor = config.bg;
    indicator.style.boxShadow = `0 0 8px ${config.bg}`;
    indicator.dataset.tooltip = config.title;
    indicator.classList.add("opacity-100");
};

export const checkAllUrls = async () => {
    const cards = document.querySelectorAll(SELECTOR_CARD);
    const cachedStatuses = getStatusCache();

    // 预建 URL -> Card 映射，O(1) 查找
    const cardMap = new Map<string, HTMLElement>();
    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (url) cardMap.set(url, card as HTMLElement);
    });

    // 已缓存的条目直接渲染，仅将缺失/过期的 URL 加入待检队列
    const unchecked = new Set<string>();

    for (const [url, card] of cardMap) {
        if (cachedStatuses?.[url]) {
            updateStatusIndicator(card, cachedStatuses[url]);
        } else {
            unchecked.add(url);
        }
    }

    if (unchecked.size === 0) return;

    // 使用 IntersectionObserver 将可视区域内的卡片优先检测
    const visibleUrls = new Set<string>();
    const hiddenUrls = new Set<string>();
    const classifiedUrls = new Set<string>();

    await new Promise<void>((resolve) => {
        let remaining = unchecked.size;
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            observer.disconnect();
            resolve();
        };

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                const url = (entry.target as HTMLElement).getAttribute("data-url");
                if (!url || !unchecked.has(url) || classifiedUrls.has(url)) continue;

                classifiedUrls.add(url);
                (entry.isIntersecting ? visibleUrls : hiddenUrls).add(url);
                remaining--;
            }
            if (remaining <= 0) {
                finish();
            }
        }, { threshold: 0 });

        for (const url of unchecked) {
            const card = cardMap.get(url);
            if (card) observer.observe(card);
        }

        // Fallback: if observer doesn't fire for all cards
        setTimeout(() => {
            if (settled) return;

            for (const url of unchecked) {
                if (!classifiedUrls.has(url)) {
                    hiddenUrls.add(url);
                }
            }
            finish();
        }, 200);
    });

    // 先检测可视区域，再检测不可见的
    const urlsToCheck = [...visibleUrls, ...hiddenUrls];

    // 简洁的并发限制：信号量模式
    const CONCURRENCY = 5;
    const newStatuses: Record<string, number | string> = {};
    let cursor = 0;

    const next = async (): Promise<void> => {
        while (cursor < urlsToCheck.length) {
            const url = urlsToCheck[cursor++];
            try {
                const { status } = await checkUrlStatus(url);
                const value = status || "error";
                newStatuses[url] = value;
                const card = cardMap.get(url);
                if (card) updateStatusIndicator(card, value);
            } catch {
                newStatuses[url] = "error";
            }
        }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, () => next()));

    setStatusCache(newStatuses);
};
