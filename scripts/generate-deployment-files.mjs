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
];

await writeFile(
    resolve(distDir, "_headers"),
    `${headers.join("\n")}\n`,
    "utf8",
);

console.log("Generated dist/_routes.json and dist/_headers");
