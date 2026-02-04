import { SELECTOR_CARD } from "./config";
import { getStatusCache, setStatusCache } from "./cache";
import { getClient } from "./uapi";

export const checkUrlStatus = async (url: string) => {
    try {
        const client = await getClient();
        return await client.network.getNetworkUrlstatus({ url });
    } catch {
        return { status: "error" };
    }
};

export const updateStatusIndicator = (card: HTMLElement, status: number | string) => {
    const indicator = card.querySelector(".status-indicator") as HTMLElement;
    if (!indicator) return;

    indicator.classList.remove("opacity-50", "bg-gray-400");

    const statusConfig: Record<number, { bg: string; title: string }> = {
        200: { bg: "#4ade80", title: "可用" },
        429: { bg: "#fbbf24", title: "限流" },
        403: { bg: "#fb923c", title: "禁止访问" },
    };

    const config = statusConfig[status as number] || {
        bg: "#ef4444",
        title: "无法访问",
    };

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

    const urls = Array.from(cards).map((card) => (card as HTMLElement).getAttribute("data-url")).filter(Boolean);

    const newStatuses: Record<string, number | string> = {};
    const CONCURRENCY_LIMIT = 5;
    const results: Promise<void>[] = [];
    const pool: Promise<void>[] = [];

    for (const url of urls) {
        if (!url) continue;

        const p = (async () => {
            try {
                const result = await checkUrlStatus(url);
                const status = result.status || "error";
                newStatuses[url] = status;
                const card = Array.from(cards).find((c) => (c as HTMLElement).getAttribute("data-url") === url);
                if (card) updateStatusIndicator(card as HTMLElement, status);
            } catch {
                newStatuses[url] = "error";
            }
        })();

        results.push(p);

        if (CONCURRENCY_LIMIT <= urls.length) {
            const e = p.then(() => {
                pool.splice(pool.indexOf(e), 1);
            });
            pool.push(e);
            if (pool.length >= CONCURRENCY_LIMIT) {
                await Promise.race(pool);
            }
        }
    }

    await Promise.all(results);

    setStatusCache(newStatuses);
};
