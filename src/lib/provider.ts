// Provider detection configuration
interface ProviderConfig {
    name: string;
    url: string;
    headerPatterns: readonly string[];
    serverPatterns: readonly string[];
    logo: string; // inline SVG string
}

// ── Provider SVG Logos (16×16 viewBox, brand color preferred) ──
const LOGOS = {
    // Alibaba Cloud
    alicloud: '<svg class="provider-logo" viewBox="0 0 1024 1024" fill="#FF6A00"><path d="M225.9 145.1H798c27 0 48.9 21.9 48.9 48.9v78.6L722 325.8l-17.5-62.2H319.5l-17.5 62.2-124.9-53.2v-78.6c0-27 21.9-48.8 48.8-48.8zM798 879H225.9c-27 0-48.9-21.9-48.9-48.9v-78.6L302 698.3l17.5 62.2h385.1l17.5-62.2 124.9 53.2v78.6c0 26.9-21.9 48.9-48.9 48.9zM608.7 512l124.5-53V345.2l-195.5 83.3h-51.4l-195.5-83.3V459l124.5 53-124.5 53v113.8l195.5-83.3h51.4l195.5 83.3V565.9z"/></svg>',
    // Cloudflare
    cloudflare: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#F38020"><path d="M16.51 15.14c.17-.66.1-1.27-.2-1.7a1.28 1.28 0 0 0-1.07-.52l-8.8-.12c-.07 0-.12-.03-.15-.08a.18.18 0 0 1 0-.17.22.22 0 0 1 .2-.14l8.9-.13c1.04-.05 2.16-.9 2.56-1.96l.5-1.33a.32.32 0 0 0 .01-.2 5.77 5.77 0 0 0-11.12-.85A3.42 3.42 0 0 0 4.7 9.34 2.74 2.74 0 0 0 5 14.93l11.07.15a.22.22 0 0 0 .21-.14l.24-.8z"/><path d="M19.34 10.14a.08.08 0 0 0-.08.01.18.18 0 0 0-.08.12l-.13.73c-.17.66-.1 1.27.2 1.7.26.37.68.58 1.15.6l1.83.13c.07 0 .12.03.15.08a.18.18 0 0 1 0 .17.22.22 0 0 1-.2.14l-1.93.12a2.46 2.46 0 0 0-2.25 1.96l-.14.65a.11.11 0 0 0 .05.13c.04.03.08.04.12.04h6.13A6.04 6.04 0 0 0 19.34 10.14z"/></svg>',
    // AWS CloudFront
    aws: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#FF9900"><path d="M6.76 13.13c0 .18.02.36.07.49l.4.87a.55.55 0 0 1 .08.27c0 .12-.07.23-.22.35l-.72.48a.54.54 0 0 1-.3.1c-.12 0-.24-.06-.36-.17a3.7 3.7 0 0 1-.43-.56 9.3 9.3 0 0 1-.37-.7c-.93 1.1-2.1 1.64-3.51 1.64-1 0-1.8-.29-2.39-.86A2.99 2.99 0 0 1-1.9 13c0-1.08.38-1.96 1.15-2.63.77-.66 1.79-1 3.07-1a8.5 8.5 0 0 1 1.34.1c.46.08.94.2 1.44.35v-.93c0-.79-.16-1.34-.48-1.66-.33-.33-.89-.49-1.69-.49-.36 0-.74.04-1.12.13-.38.09-.75.2-1.12.35a2.97 2.97 0 0 1-.37.14.65.65 0 0 1-.17.03c-.15 0-.22-.11-.22-.33V6.3a1.23 1.23 0 0 1 .07-.35c.04-.1.12-.2.24-.28.38-.2.84-.36 1.37-.5a6.7 6.7 0 0 1 1.7-.2c1.29 0 2.24.3 2.85.88.6.59.9 1.48.9 2.68v3.53zM1.42 14.41c.43 0 .87-.08 1.34-.24.46-.16.87-.45 1.22-.85.21-.25.37-.53.46-.84.1-.31.14-.68.14-1.11v-.53c-.37-.12-.76-.2-1.18-.27-.42-.06-.83-.09-1.23-.09-.84 0-1.45.16-1.85.49-.4.33-.6.79-.6 1.39 0 .56.14.98.44 1.27.29.3.71.44 1.26.44zM10.53 15.4a.56.56 0 0 1-.32-.07.47.47 0 0 1-.15-.28l-1.67-5.49a2.18 2.18 0 0 1-.07-.3c0-.12.06-.18.18-.18h.87c.17 0 .28.02.34.07.06.05.1.14.13.28l1.2 4.7 1.1-4.7a.52.52 0 0 1 .14-.28.6.6 0 0 1 .35-.07h.71c.17 0 .29.02.35.07a.47.47 0 0 1 .14.28l1.12 4.76 1.23-4.76c.04-.14.08-.23.14-.28a.6.6 0 0 1 .34-.07h.83c.12 0 .18.06.18.18 0 .04 0 .08-.02.12a1.1 1.1 0 0 1-.05.19l-1.72 5.49a.52.52 0 0 1-.15.28.55.55 0 0 1-.32.07h-.76c-.17 0-.29-.03-.35-.08a.48.48 0 0 1-.14-.29L13.3 10.3l-1.1 4.6c-.03.15-.08.24-.14.29a.56.56 0 0 1-.35.08h-.76zm8.6.3a5.86 5.86 0 0 1-1.56-.2.85.85 0 0 1-.31-.17.42.42 0 0 1-.06-.23v-.56c0-.22.08-.33.24-.33a.6.6 0 0 1 .18.03l.25.08c.34.12.66.2.93.26.28.05.55.08.81.08.43 0 .76-.09 1-.28.24-.18.36-.45.36-.8 0-.23-.07-.43-.22-.59-.15-.16-.43-.3-.83-.44l-1.2-.37c-.6-.19-1.04-.47-1.32-.84a2 2 0 0 1-.42-1.23c0-.36.08-.67.23-.94.16-.27.37-.5.63-.68.26-.19.56-.33.9-.42a3.97 3.97 0 0 1 1.59-.08c.28.03.53.08.76.15.22.07.41.15.57.23.15.1.27.18.34.27.08.09.12.18.12.28v.52c0 .22-.09.33-.24.33a1.09 1.09 0 0 1-.4-.12 4.83 4.83 0 0 0-1.6-.28c-.39 0-.69.07-.9.2-.22.14-.33.36-.33.66 0 .24.08.44.25.6.16.16.47.32.91.47l1.17.37c.59.19 1.02.45 1.28.79.26.34.39.73.39 1.16 0 .37-.08.7-.23.99-.16.28-.37.53-.64.73-.27.2-.59.35-.95.46-.38.1-.78.16-1.21.16z"/></svg>',
    // Vercel
    vercel: '<svg class="provider-logo" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L24 22H0L12 1z"/></svg>',
    // Netlify
    netlify: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#00C7B7"><path d="M16.93 11.01l-3.3-1.6v-.06l5.78-2.26.02.02-2.5 3.9zm-5.87 1.48l3.63 1.76-6.2 2.42 2.57-4.18zm9.06-7L17.4 8.83l-4.16-2.03 3.21-5.03 4.67 3.72zm-4.83 7.14v4.15l-2.46.94 2.46-5.09zm-6.28 6.4l6.93-2.65v.03l-6.32 6.5-.61-3.88zm10.74-8.42l.3.4-4.74 1.85v-.05l4.44-2.2zm.58 1.08l.01 5.56-2.42-3zM7.4 22.07L.38 15l3.56-1.39 8.5 5.09-5.04 3.37zm-.6-5.63L1.22 13.2l13.44-5.25-1.88 3.08-5.98 5.41zm6.72-8.53l-2.63 4.12-1.06.01-4-2.64L10.01.61l3.51 7.3zM5.35 14.3L.7 12.5 5.2 4.15l.16 10.15z"/></svg>',
    // Fastly
    fastly: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#FF282D"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm4.92 17.77H7.08v-1.85h3.7V8.08H7.08V6.23h9.84v1.85h-3.7v7.84h3.7v1.85z"/></svg>',
    // Akamai
    akamai: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#0096D6"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm.18 3.04c4.06 0 7.46 2.52 8.73 6.06-1.2-.52-3.91-1.42-5.97-1.42-2.71 0-4.69 1.45-4.69 3.47 0 2.01 1.58 3.29 3.79 3.29 1.53 0 3.07-.55 4.34-1.4l.44 1.26c-1.63 1.11-3.45 1.65-5.22 1.65-3.27 0-5.67-2-5.67-4.68 0-2.98 2.77-5.36 6.65-5.36 1.55 0 3.19.36 4.3.82l-.43 1.22a11.56 11.56 0 0 0-3.67-.67c-2.66 0-4.44 1.42-4.44 3.27 0 1.25.92 2.68 3.25 2.68 1.52 0 3.3-.72 4.44-1.59.08.25.13.51.14.77-1.45 1.17-3.44 1.97-5.34 1.97-3.1 0-4.93-1.72-4.93-3.88 0-3.39 3.3-5.99 7.38-5.99.8 0 1.6.08 2.35.24-.62-.31-2.03-.78-3.55-.78-4.49 0-8.05 3.14-8.05 7.81 0 3.49 2.53 7 7.14 7a9 9 0 0 0 4.87-1.53l.53 1.07A9.93 9.93 0 0 1 12.18 21C7.19 21 3.15 17.22 3.15 12.22 3.14 6.66 7.09 3.04 12.18 3.04z"/></svg>',
    // Google Cloud
    gcp: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#1A73E8"><path d="M12.19 2.39a9.63 9.63 0 0 1 7.59 5.15l-2.69 2.08a6.07 6.07 0 0 0-10.28 1.84L4.12 9.38a9.6 9.6 0 0 1 8.07-6.99zM4.12 9.38a9.6 9.6 0 0 0-.49 6.58l2.69-2.08A6.1 6.1 0 0 1 6.8 11.46L4.12 9.38zm2.19 4.5L3.62 15.96a9.61 9.61 0 0 0 8.37 5.63l-.01-3.43a6.1 6.1 0 0 1-5.67-4.28zM11.99 18.16l.01 3.43a9.61 9.61 0 0 0 7.78-4.48l-2.69-2.07a6.08 6.08 0 0 1-5.1 3.12zm7.79-4.48l2.69 2.07A9.6 9.6 0 0 0 21.59 12a9.5 9.5 0 0 0-.83-3.46l-2.69 2.08a6.03 6.03 0 0 1 1.71 3.06z"/></svg>',
    // Azure / Microsoft
    azure: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#0078D4"><path d="M13.05 4.24L7.56 18.5l-4.07.04 4.24-8.43-1.7-5.87h7.02zm.83.06l3.54 10.2-7.15 3.93 10.23.07-6.62-14.2z"/></svg>',
    // Tencent EdgeOne
    edgeone: '<img class="provider-logo" src="/icons/tencent-edgeone.png" alt="" decoding="async" />',
    // Baidu Cloud
    baidu: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#2932E1"><path d="M5.93 12.73c-1.54.01-3.58 1.7-3.58 4.28 0 2.59 2.35 4.56 5.07 4.56s4.2-.85 5.74-1.73c1.54-.88 3.34-.63 3.34-.63s2.67-.08 4.01-1.78c1.88-2.38.75-4.83.75-4.83s-.95-1.83-3.05-2.47c-2.09-.64-3.63.54-3.63.54s-1.76 1.15-3.5.72c-1.74-.43-1.98-2.38-1.98-2.38s.1-2.21-1.38-3.22c-1.48-1.01-3.33-.14-3.33-.14s-2.15 1.06-1.32 3.82c.83 2.75 2.86 3.26 2.86 3.26zm3.04-8.83c0-1.97-1.14-3.57-2.55-3.57S3.88 1.93 3.88 3.9c0 1.97 1.14 3.57 2.55 3.57s2.54-1.6 2.54-3.57zm5.59-.84c-1.53 0-2.78 1.65-2.78 3.68s1.25 3.68 2.78 3.68c1.54 0 2.78-1.65 2.78-3.68s-1.24-3.68-2.78-3.68zm5.62 3.02c-1.32 0-2.39 1.36-2.39 3.04 0 1.68 1.07 3.04 2.39 3.04 1.32 0 2.39-1.36 2.39-3.04 0-1.68-1.07-3.04-2.39-3.04z"/></svg>',
    // Huawei Cloud
    huawei: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#C7000B"><path d="M6.01 5.56c-1.15 1.08-2.75 3.63-2.43 5.39.22 1.16.88 1.97 2.44 3.07l4.22 2.88.12-.02-3.56-5.67c-.87-1.35-1.13-2.44-1.13-3.33.01-1.04.38-1.7.34-2.32zm11.98 0c.04.62.33 1.28.34 2.32 0 .89-.26 1.98-1.13 3.33l-3.56 5.67.12.02 4.22-2.88c1.56-1.1 2.22-1.91 2.44-3.07.32-1.76-1.28-4.31-2.43-5.39zm-6 3.68a.5.5 0 0 0-.44.26l-3.66 5.99a.42.42 0 0 0 .12.57l3.85 2.66a.5.5 0 0 0 .28.09.5.5 0 0 0 .28-.09l3.85-2.66a.42.42 0 0 0 .12-.57l-3.66-5.99a.5.5 0 0 0-.44-.26h-.3zm-5.56 8.18a.41.41 0 0 0-.24.07l-2.91 2.02a.41.41 0 0 0 .1.72l3.86 1.38a.44.44 0 0 0 .54-.29c.04-.12.03-.25-.04-.37l-1.06-3.39a.43.43 0 0 0-.25-.14zm11.14 0a.43.43 0 0 0-.26.14l-1.06 3.39a.42.42 0 0 0-.04.37.44.44 0 0 0 .54.29l3.86-1.38a.41.41 0 0 0 .1-.72l-2.91-2.02a.41.41 0 0 0-.23-.07z"/></svg>',
    // Qiniu (七牛)
    qiniu: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#00A7E1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5h-9v-2h9v2zm0-3.5h-9v-2h9v2zm0-3.5h-9V7.5h9v2z"/></svg>',
    // Upyun (又拍云)
    upyun: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#2D8CFF"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.35 14.15c-1 .85-2.3 1.35-3.75 1.35-3.04 0-5.5-2.46-5.5-5.5s2.46-5.5 5.5-5.5a5.49 5.49 0 0 1 4.82 2.85l-1.73 1a3.49 3.49 0 0 0-3.09-1.85 3.5 3.5 0 0 0 0 7c1.24 0 2.32-.65 2.94-1.63H12.5v-2h5.6a5.49 5.49 0 0 1-2.75 4.28z"/></svg>',
    // ChinaNetCenter / Wangsu (网宿)
    wangsu: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#00A0E9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
    // Bunny CDN
    bunny: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#FF8A00"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 4c.83 0 1.5.9 1.5 2s-.67 2-1.5 2-1.5-.9-1.5-2 .67-2 1.5-2zm4 0c.83 0 1.5.9 1.5 2s-.67 2-1.5 2-1.5-.9-1.5-2 .67-2 1.5-2zm-2 12c-2.76 0-5-1.79-5-4h10c0 2.21-2.24 4-5 4z"/></svg>',
    // Nginx
    nginx: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#009639"><path d="M12 0L1.605 6v12L12 24l10.395-6V6L12 0zm6 16.59c0 .705-.646 1.29-1.529 1.29-.631 0-1.351-.255-1.801-.81l-6-7.141v6.66c0 .721-.57 1.29-1.274 1.29H7.32c-.721 0-1.29-.585-1.29-1.29V7.41c0-.705.63-1.29 1.5-1.29.646 0 1.38.255 1.83.81l5.97 7.141V7.41c0-.721.585-1.29 1.29-1.29h.075c.72 0 1.29.585 1.29 1.29v9.18z"/></svg>',
    // Apache
    apache: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#D22128"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.71 14.6L5.7 12l4.6-4.6 1.41 1.41L8.51 12l3.19 3.19-1.41 1.41zm5.42 0l-1.41-1.41L17.49 12l-3.19-3.19 1.41-1.41L20.3 12l-4.6 4.6z"/></svg>',
    // KeyCDN
    keycdn: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#1F6BFF"><path d="M10.5 2a5.5 5.5 0 0 0-4.96 7.87L2 13.41V17h3.59l.83-.83-.83-.83L6.41 14.5l.83.83.83-.83-.83-.83L8.07 12.84l.83.83.83-.83-1.86-1.86A5.48 5.48 0 0 0 16 5.5 5.5 5.5 0 0 0 10.5 2zm2 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
    // StackPath
    stackpath: '<svg class="provider-logo" viewBox="0 0 24 24" fill="#FBB03B"><path d="M2 4v4.8l10 5.7 10-5.7V4L12 9.7 2 4zm0 7.3V16l10 5.7V16L2 11.3zm20 0L12 16v5.7L22 16v-4.7z"/></svg>',
    // GitHub Pages
    github: '<svg class="provider-logo" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    // Default
    globe: '<svg class="provider-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
} as const;

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

let currentProviderUrl = "";

export const updateProviderDisplay = (
    proName: HTMLElement | null,
    proBox: HTMLElement | null,
    providerName: string,
    providerUrl: string,
    providerLogo?: string
) => {
    if (!proName || !proBox) return;

    proName.innerText = providerName;
    currentProviderUrl = providerUrl;

    // Replace the Font Awesome icon with the provider SVG logo
    if (providerLogo) {
        const iconEl = proBox.querySelector(".capsule-icon");
        if (iconEl) {
            const logoWrapper = document.createElement("span");
            logoWrapper.className = "capsule-icon";
            logoWrapper.setAttribute("aria-hidden", "true");
            logoWrapper.innerHTML = providerLogo;
            iconEl.replaceWith(logoWrapper);
        }
    }

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
        updateProviderDisplay(proName, proBox, provider.name, provider.url, provider.logo);
    } catch (error) {
        if (proName) proName.innerText = "Edge Service";
    } finally {
        clearTimeout(timeoutId);
    }
};
