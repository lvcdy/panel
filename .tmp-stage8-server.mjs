import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const port = Number(process.env.PORT || 4330);
const modes = new Set(["good", "missing", "error", "invalid", "slow"]);
let mode = "good";
const stats = {
    siteStatusRequests: 0,
    networkInfoRequests: 0,
    domains: {},
};

const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
};

const sendJson = (res, status, body, extra = {}) => {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    Object.entries(extra).forEach(([key, value]) => res.setHeader(key, value));
    res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/__mode") {
        const next = url.searchParams.get("value") ?? "good";
        if (modes.has(next)) mode = next;
        sendJson(res, 200, { mode });
        return;
    }

    if (url.pathname === "/__stats") {
        sendJson(res, 200, { mode, ...stats });
        return;
    }

    if (url.pathname === "/__reset") {
        stats.siteStatusRequests = 0;
        stats.networkInfoRequests = 0;
        stats.domains = {};
        sendJson(res, 200, { mode, ...stats });
        return;
    }

    if (url.pathname === "/api/site-status") {
        stats.siteStatusRequests += 1;
        const domain = url.searchParams.get("domain") ?? "";
        stats.domains[domain] = (stats.domains[domain] ?? 0) + 1;

        if (mode === "missing") {
            res.statusCode = 404;
            res.setHeader("content-type", "text/plain");
            res.end("not found");
            return;
        }

        if (mode === "error") {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain");
            res.end("server error");
            return;
        }

        if (mode === "invalid") {
            res.statusCode = 200;
            res.setHeader("content-type", "text/html");
            res.end("<html>not json</html>");
            return;
        }

        const respond = () => {
            sendJson(res, 200, {
                status: "UP",
                http_code: 200,
                response_time_ms: 118,
            });
        };

        if (mode === "slow") setTimeout(respond, 3000);
        else respond();
        return;
    }

    if (url.pathname === "/api/network-info") {
        stats.networkInfoRequests += 1;

        if (mode === "missing") {
            res.statusCode = 404;
            res.setHeader("content-type", "text/plain");
            res.end("not found");
            return;
        }

        if (mode === "error") {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain");
            res.end("server error");
            return;
        }

        if (mode === "invalid") {
            res.statusCode = 200;
            res.setHeader("content-type", "text/html");
            res.end("<html>not json</html>");
            return;
        }

        const respond = () => {
            sendJson(
                res,
                200,
                {
                    platform: "cloudflare",
                    clientIp: "1.1.1.1",
                    asn: 13335,
                    organization: "Cloudflare, Inc.",
                    edgeLocation: "HKG",
                    location: "中国香港 · 香港",
                    availableFields: [
                        "clientIp",
                        "asn",
                        "organization",
                        "edgeLocation",
                        "location",
                    ],
                    updatedAt: new Date().toISOString(),
                },
                { "cache-control": "private, no-store" },
            );
        };

        if (mode === "slow") setTimeout(respond, 3000);
        else respond();
        return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/" || pathname === "/index.html") {
        pathname = "/index.html";
    } else if (pathname === "/panel" || pathname === "/panel/") {
        pathname = "/index.html";
    } else if (pathname.startsWith("/panel/")) {
        pathname = pathname.slice("/panel".length);
    }

    const filePath = path.join(root, pathname);
    if (!filePath.startsWith(root)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.statusCode = 404;
            res.setHeader("content-type", "text/plain");
            res.end("Not found");
            return;
        }

        res.statusCode = 200;
        res.setHeader(
            "content-type",
            mime[path.extname(filePath)] ?? "application/octet-stream",
        );
        res.end(data);
    });
});

server.listen(port, "127.0.0.1", () => {
    console.log(`stage8 mock server on http://127.0.0.1:${port}`);
});
