import { SELECTOR_CARD } from "./config";
import { getStatusCache, setStatusCache } from "./cache";

export const checkUrlStatus = async (url: string, client: any) => {
    try {
        return await client.network.getNetworkUrlstatus({ url });
    } catch (error) {
        return { status: "error", error };
    }
};

export const updateStatusIndicator = (card: HTMLElement, status: number | string) => {
    const indicator = card.querySelector(".status-indicator") as HTMLElement;
    if (!indicator) return;

    indicator.classList.remove("opacity-50", "bg-gray-400");

    const statusConfig: Record<number, { bg: string; title: string }> = {
        200: { bg: "#4ade80", title: "可用 (200)" },
        429: { bg: "#fbbf24", title: `限流 (${status})` },
        403: { bg: "#fb923c", title: `禁止访问 (${status})` },
    };

    const config = statusConfig[status as number] || {
        bg: "#ef4444",
        title: typeof status === "number" ? `错误 (${status})` : "无法访问",
    };

    indicator.style.backgroundColor = config.bg;
    indicator.style.boxShadow = `0 0 8px ${config.bg}`;
    indicator.title = config.title;
    indicator.classList.add("opacity-100");
};

export const checkAllUrls = async (client: any) => {
    const cards = document.querySelectorAll(SELECTOR_CARD);
    const cachedStatuses = getStatusCache();

    if (cachedStatuses) {
        cards.forEach((card) => {
            const url = (card as HTMLElement).getAttribute("data-url");
            if (url && cachedStatuses[url]) {
                updateStatusIndicator(card as HTMLElement, cachedStatuses[url]);
            }
        });
        return;
    }

    const newStatuses: Record<string, number | string> = {};

    for (const card of cards) {
        const url = (card as HTMLElement).getAttribute("data-url");
        if (!url) continue;

        try {
            const result = await checkUrlStatus(url, client);
            const status = result.status || "error";
            newStatuses[url] = status;
            updateStatusIndicator(card as HTMLElement, status);
        } catch (error) {
            newStatuses[url] = "error";
            updateStatusIndicator(card as HTMLElement, "error");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setStatusCache(newStatuses);
};
