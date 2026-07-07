import { LOGOS } from "./logos";
import { formatEdgeNode, type Ip9Data } from "./ip-utils";

// Provider detection configuration
interface ProviderConfig {
    name: string;
    url: string;
    headerPatterns: readonly string[];
    serverPatterns: readonly string[];
    logo: string; // inline SVG string
}

const PROVIDER_CONFIGS: readonly ProviderConfig[] = [
    // ── 国内 CDN ──
    {
        name: "Alibaba Cloud ESA",
        url: "https://www.aliyun.com/",
        headerPatterns: ["ali-ray", "eagleid", "x-oss-request-id"],
        serverPatterns: ["esa", "tengine", "aliyun"],
        logo: LOGOS.alicloud,
    },
    {
        name: "Tencent EdgeOne",
        url: "https://edgeone.ai/",
        headerPatterns: ["eo-log-uuid", "eo-cache-status", "x-nws-log-uuid", "x-cache-lookup"],
        serverPatterns: ["edgeone", "tencentedgeone", "tencent", "stgw"],
        logo: LOGOS.edgeone,
    },
    {
        name: "Baidu Cloud CDN",
        url: "https://cloud.baidu.com/",
        headerPatterns: ["x-bce-request-id"],
        serverPatterns: ["baiducdn", "bfe", "baishan"],
        logo: LOGOS.baidu,
    },
    {
        name: "Huawei Cloud CDN",
        url: "https://www.huaweicloud.com/",
        headerPatterns: ["x-hwc", "x-hw"],
        serverPatterns: ["hwcdn", "huawei"],
        logo: LOGOS.huawei,
    },
    {
        name: "Qiniu CDN",
        url: "https://www.qiniu.com/",
        headerPatterns: ["x-qnm-cache", "x-qiniu-zone"],
        serverPatterns: ["qiniu"],
        logo: LOGOS.qiniu,
    },
    {
        name: "Upyun CDN",
        url: "https://www.upyun.com/",
        headerPatterns: ["x-upyun-request-id", "x-source"],
        serverPatterns: ["marco", "upyun"],
        logo: LOGOS.upyun,
    },
    {
        name: "Wangsu CDN",
        url: "https://www.wangsu.com/",
        headerPatterns: ["x-ws-request-id", "x-cnc"],
        serverPatterns: ["wangsu", "chinanetcenter", "cnc"],
        logo: LOGOS.wangsu,
    },
    // ── 国际 CDN ──
    {
        name: "Cloudflare Edge",
        url: "https://www.cloudflare.com/",
        headerPatterns: ["cf-ray", "cf-cache-status"],
        serverPatterns: ["cloudflare"],
        logo: LOGOS.cloudflare,
    },
    {
        name: "AWS CloudFront",
        url: "https://aws.amazon.com/cloudfront/",
        headerPatterns: ["x-amz-cf-id", "x-amz-cf-pop"],
        serverPatterns: ["cloudfront", "amazons3"],
        logo: LOGOS.aws,
    },
    {
        name: "Google Cloud CDN",
        url: "https://cloud.google.com/cdn",
        headerPatterns: ["x-goog-generation", "x-guploader-uploadid"],
        serverPatterns: ["gws", "gse", "google"],
        logo: LOGOS.gcp,
    },
    {
        name: "Azure Front Door",
        url: "https://azure.microsoft.com/",
        headerPatterns: ["x-azure-ref", "x-fd-int-roxy-purgeid", "x-msedge-ref"],
        serverPatterns: ["microsoft", "azure"],
        logo: LOGOS.azure,
    },
    {
        name: "Vercel Edge",
        url: "https://vercel.com/",
        headerPatterns: ["x-vercel-id", "x-vercel-cache"],
        serverPatterns: ["vercel"],
        logo: LOGOS.vercel,
    },
    {
        name: "Netlify Edge",
        url: "https://www.netlify.com/",
        headerPatterns: ["x-nf-request-id"],
        serverPatterns: ["netlify"],
        logo: LOGOS.netlify,
    },
    {
        name: "Fastly Edge",
        url: "https://www.fastly.com/",
        headerPatterns: ["x-served-by", "x-fastly-request-id", "x-cache-hits"],
        serverPatterns: ["fastly"],
        logo: LOGOS.fastly,
    },
    {
        name: "Akamai Edge",
        url: "https://www.akamai.com/",
        headerPatterns: ["x-akamai-transformed", "x-akamai-request-id"],
        serverPatterns: ["akamaighost", "akamai"],
        logo: LOGOS.akamai,
    },
    {
        name: "Bunny CDN",
        url: "https://bunny.net/",
        headerPatterns: ["cdn-pullzone", "cdn-requestid", "cdn-uid"],
        serverPatterns: ["bunnycdn", "bunny"],
        logo: LOGOS.bunny,
    },
    {
        name: "KeyCDN",
        url: "https://www.keycdn.com/",
        headerPatterns: ["x-pull", "x-edge-location"],
        serverPatterns: ["keycdn"],
        logo: LOGOS.keycdn,
    },
    {
        name: "StackPath CDN",
        url: "https://www.stackpath.com/",
        headerPatterns: ["x-hw", "x-sp-url"],
        serverPatterns: ["stackpath", "highwinds", "netdna"],
        logo: LOGOS.stackpath,
    },
    // ── Hosting ──
    {
        name: "GitHub Pages",
        url: "https://pages.github.com/",
        headerPatterns: ["x-github-request-id"],
        serverPatterns: ["github.com"],
        logo: LOGOS.github,
    },
    // ── Web Server ──
    {
        name: "Nginx",
        url: "https://nginx.org/",
        headerPatterns: [],
        serverPatterns: ["nginx"],
        logo: LOGOS.nginx,
    },
    {
        name: "Apache",
        url: "https://httpd.apache.org/",
        headerPatterns: [],
        serverPatterns: ["apache"],
        logo: LOGOS.apache,
    },
];

const DEFAULT_PROVIDER = {
    name: "Global Edge Network",
    url: "",
    logo: LOGOS.globe,
};

export const detectProvider = (headerKeys: string[], serverHeader: string) => {
    for (const config of PROVIDER_CONFIGS) {
        const matchesHeader = config.headerPatterns.some((p) => headerKeys.includes(p));
        const matchesServer = config.serverPatterns.some((p) => serverHeader.includes(p));

        if (matchesHeader || matchesServer) {
            return { name: config.name, url: config.url, logo: config.logo };
        }
    }

    return DEFAULT_PROVIDER;
};

interface EdgeNodeInfo {
    ip: string;
    location: string;
}

export const updateProviderDisplay = (
    proName: HTMLElement | null,
    proNode: HTMLElement | null,
    proIp: HTMLElement | null,
    proBox: HTMLElement | null,
    providerName: string,
    edgeNode?: EdgeNodeInfo | null
) => {
    if (!proName || !proBox) return;

    proName.textContent = providerName;
    if (proNode) {
        proNode.textContent = edgeNode?.location ? `${edgeNode.location}节点` : "";
        proNode.hidden = !edgeNode?.location;
    }
    if (proIp) {
        proIp.textContent = edgeNode?.ip || "";
        proIp.hidden = !edgeNode?.ip;
    }

    proBox.style.opacity = "1";
    proBox.style.filter = "blur(0px)";
};

export const fetchAndDetectProvider = async (
    proName: HTMLElement | null,
    proNode: HTMLElement | null,
    proIp: HTMLElement | null,
    proBox: HTMLElement | null
) => {
    const signal = AbortSignal.timeout(5000);

    try {
        const edgeIpRequest = fetch("/api/edge-ip", {
            cache: "no-cache",
            signal,
        }).then(async (response) => {
            if (!response.ok) return null;

            const payload = await response.json();
            return payload.ret === 200 ? formatEdgeNode(payload.edge) : null;
        }).catch(() => null);

        const [res, edgeIp] = await Promise.all([
            fetch(window.location.href, {
                method: "HEAD",
                cache: "no-cache",
                signal,
            }),
            edgeIpRequest,
        ]);

        const serverHeader = (res.headers.get("server") || "").toLowerCase();
        const headerKeys = Array.from(res.headers.keys()).map((k) => k.toLowerCase());

        const provider = detectProvider(headerKeys, serverHeader);
        updateProviderDisplay(proName, proNode, proIp, proBox, provider.name, edgeIp);
    } catch (error) {
        if (proName) proName.textContent = "Edge Service";
    }
};
