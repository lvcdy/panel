import { SELECTOR_CARD } from "./config";
import { getStatusCache, setStatusCache } from "./cache";

interface UrlStatusResult {
    status: number | string;
}

export const checkUrlStatus = async (url: string): Promise<UrlStatusResult> => {
    try {
        const res = await fetch(`https://api.veyn.cn/uptime?url=${encodeURIComponent(url)}`, {
            signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        return { status: data.code ?? "error" };
    } catch {
        return { status: "error" };
    }
};

export const updateStatusIndicator = (card: HTMLElement, status: number | string) => {
    const indicator = card.querySelector(".status-indicator") as HTMLElement;
    if (!indicator) return;

    indicator.classList.remove("opacity-50", "bg-gray-400");

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
    indicator.title = config.title;
    indicator.classList.add("opacity-100");
};

export const checkAllUrls = async () => {
    const cards = document.querySelectorAll(SELECTOR_CARD);
    const cachedStatuses = getStatusCache();

    // 使用缓存的状态，加快加载速度
    if (cachedStatuses) {
        cards.forEach((card) => {
            const url = (card as HTMLElement).getAttribute("data-url");
            if (url && cachedStatuses[url]) {
                updateStatusIndicator(card as HTMLElement, cachedStatuses[url]);
            }
        });
        return;
    }

    // 预建 URL -> Card 映射，O(1) 查找代替 O(n) 遍历
    const cardMap = new Map<string, HTMLElement>();
    cards.forEach((card) => {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (url) cardMap.set(url, card as HTMLElement);
    });

    const urls = Array.from(cardMap.keys());
    const newStatuses: Record<string, number | string> = {};
    const CONCURRENCY_LIMIT = 5;
    const results: Promise<void>[] = [];
    const pool: Promise<void>[] = [];

    for (const url of urls) {
        const p = (async () => {
            try {
                const result = await checkUrlStatus(url);
                const status = result.status || "error";
                newStatuses[url] = status;
                const card = cardMap.get(url);
                if (card) updateStatusIndicator(card, status);
            } catch {
                newStatuses[url] = "error";
            }
        })();

        results.push(p);

        const e = p.then(() => {
            pool.splice(pool.indexOf(e), 1);
        });
        pool.push(e);
        if (pool.length >= CONCURRENCY_LIMIT) {
            await Promise.race(pool);
        }
    }

    await Promise.all(results);

    setStatusCache(newStatuses);
};
