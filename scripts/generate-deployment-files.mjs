import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
    joinApiEndpoint,
    normalizeApiBase,
    normalizeBasePath,
} from "../shared/paths.js";

const siteBase = normalizeBasePath(process.env.PANEL_BASE);
const apiBase = normalizeApiBase(
    process.env.PANEL_API_BASE ??
        process.env.PUBLIC_PANEL_API_BASE ??
        "/api/",
);
const apiIsAbsolute = /^https?:\/\//i.test(apiBase);

const distDir = resolve("dist");
await mkdir(distDir, { recursive: true });

// 只放行两个已知的 API 端点进入函数；其余路径走静态资源。
const include = apiIsAbsolute
    ? []
    : [
          joinApiEndpoint(apiBase, "site-status"),
          joinApiEndpoint(apiBase, "network-info"),
      ];

await writeFile(
    resolve(distDir, "_routes.json"),
    `${JSON.stringify({ version: 1, include, exclude: [] }, null, 2)}\n`,
    "utf8",
);

// 安全响应头（纵深防御）：CSP 收紧脚本/对象/框架来源；
// HSTS/Referrer-Policy/Permissions-Policy 限制浏览器能力与信息泄露。
const securityHeaders = [
    "  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: DENY",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()",
    "  Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "  Cross-Origin-Opener-Policy: same-origin",
];

const headers = [
    `${siteBase}_astro/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    `${siteBase}icons/*`,
    "  Cache-Control: public, max-age=604800",
    `${siteBase}favicon.svg`,
    "  Cache-Control: public, max-age=86400",
    ...(apiIsAbsolute
        ? []
        : [`${apiBase}*`, "  Cache-Control: private, no-store"]),
    "/*",
    "  Cache-Control: public, max-age=0, must-revalidate",
    ...securityHeaders,
];

await writeFile(
    resolve(distDir, "_headers"),
    `${headers.join("\n")}\n`,
    "utf8",
);

console.log("Generated dist/_routes.json and dist/_headers (with security headers)");
