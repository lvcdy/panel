// Provider detection configuration
interface ProviderConfig {
    name: string;
    url: string;
    headerPatterns: readonly string[];
    serverPatterns: readonly string[];
}

const PROVIDER_CONFIGS = [
    {
        name: "Alibaba Cloud ESA",
        url: "https://www.aliyun.com/",
        headerPatterns: ["ali-ray"],
        serverPatterns: ["esa"],
    },
    {
        name: "Cloudflare Edge",
        url: "https://www.cloudflare.com/",
        headerPatterns: ["cf-ray"],
        serverPatterns: ["cloudflare"],
    },
] as const satisfies readonly ProviderConfig[];

export const detectProvider = (headerKeys: string[], serverHeader: string) => {
    for (const config of PROVIDER_CONFIGS) {
        const matchesHeader = config.headerPatterns.some((p) => headerKeys.includes(p));
        const matchesServer = config.serverPatterns.some((p) => serverHeader.includes(p));

        if (matchesHeader || matchesServer) {
            return { name: config.name, url: config.url };
        }
    }

    return { name: "Global Edge Network", url: "" };
};

let currentProviderUrl = "";

export const updateProviderDisplay = (
    proName: HTMLElement | null,
    proBox: HTMLElement | null,
    providerName: string,
    providerUrl: string
) => {
    if (!proName || !proBox) return;

    proName.innerText = providerName;
    currentProviderUrl = providerUrl;

    if (providerUrl) {
        const openProvider = (e: Event) => {
            e.stopPropagation();
            if (currentProviderUrl) {
                window.open(currentProviderUrl, "_blank", "noopener,noreferrer");
            }
        };
        proBox.addEventListener("click", openProvider);
        proBox.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") {
                e.preventDefault();
                openProvider(e);
            }
        });
    }

    proBox.style.opacity = "1";
    proBox.style.filter = "blur(0px)";
};

export const fetchAndDetectProvider = async (
    proName: HTMLElement | null,
    proBox: HTMLElement | null
) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(window.location.href, {
            method: "HEAD",
            cache: "no-cache",
            signal: controller.signal,
        });

        const serverHeader = (res.headers.get("server") || "").toLowerCase();
        const headerKeys = Array.from(res.headers.keys()).map((k) => k.toLowerCase());

        const provider = detectProvider(headerKeys, serverHeader);
        updateProviderDisplay(proName, proBox, provider.name, provider.url);
    } catch (error) {
        if (proName) proName.innerText = "Edge Service";
    } finally {
        clearTimeout(timeoutId);
    }
};
