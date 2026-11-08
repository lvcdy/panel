import assert from "node:assert/strict";
import {
    isIpLiteral,
    isValidStatusDomain,
    normalizePublicIp,
    sanitizeText,
} from "./shared/api/ip.js";
import {
    handleNetworkInfo,
} from "./shared/api/network-info.js";
import {
    handleSiteStatus,
    sanitizeSiteStatusPayload,
} from "./shared/api/site-status.js";
import {
    joinApiEndpoint,
    normalizeApiBase,
    normalizeBasePath,
} from "./shared/paths.js";

// ── Path normalization ──
assert.equal(normalizeBasePath(undefined), "/");
assert.equal(normalizeBasePath("/panel"), "/panel/");
assert.equal(normalizeBasePath("/panel//"), "/panel/");
assert.equal(normalizeBasePath("panel/"), "/panel/");
assert.equal(normalizeBasePath("/a/../b/"), "/");
assert.equal(normalizeBasePath("https://example.com/panel/"), "/");
assert.equal(normalizeBasePath("/panel?x=1"), "/");
assert.equal(normalizeBasePath("/panel/子"), "/");

assert.equal(normalizeApiBase(undefined), "/api/");
assert.equal(normalizeApiBase("/custom/api"), "/custom/api/");
assert.equal(normalizeApiBase("https://api.example.com/v1"), "https://api.example.com/v1/");
assert.equal(normalizeApiBase("https://api.example.com"), "https://api.example.com/");
assert.equal(normalizeApiBase("https://user:pass@api.example.com/v1"), "/api/");
assert.equal(normalizeApiBase("/a/../b"), "/api/");
assert.equal(joinApiEndpoint("/api/", "site-status"), "/api/site-status");
assert.equal(joinApiEndpoint("https://api.example.com/v1/", "/network-info"), "https://api.example.com/v1/network-info");

// ── Domain / IP validation ──
for (const domain of [
    "example.com",
    "sub.example.co.uk",
    "GITHUB.COM",
    "example.com.",
    "xn--fiqs8s.example",
]) {
    assert.equal(isValidStatusDomain(domain), true, domain);
}

for (const domain of [
    "",
    "localhost",
    "foo.local",
    "foo.internal",
    "example",
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "[::1]",
    "::1",
    "bad_domain.com",
    "-bad.com",
    "bad-.com",
    "example.123",
    "0x7f.1",
    "example.com:80",
    "user@example.com",
    "a..b.com",
    "example.com/path",
]) {
    assert.equal(isValidStatusDomain(domain), false, domain);
}

assert.equal(isIpLiteral("1.1.1.1"), true);
assert.equal(isIpLiteral("::1"), true);
assert.equal(isIpLiteral("example.com"), false);

for (const ip of ["1.1.1.1", "8.8.8.8", "2001:4860:4860::8888", "2606:4700:4700::1111"]) {
    assert.equal(normalizePublicIp(ip), ip.toLowerCase(), ip);
}

for (const ip of [
    "10.0.0.1",
    "127.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "198.51.100.1",
    "203.0.113.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "2001:db8::1",
    "2002::1",
    "not-an-ip",
]) {
    assert.equal(normalizePublicIp(ip), null, ip);
}

assert.equal(normalizePublicIp("[2001:4860:4860::8888]"), "2001:4860:4860::8888");
assert.equal(sanitizeText("  hello\u0000 world  "), "hello world");
assert.equal(sanitizeText(42), null);

// ── Status payload sanitization ──
assert.deepEqual(
    sanitizeSiteStatusPayload({
        status: "up",
        http_code: 200,
        response_time_ms: 123.6,
        secret: "do-not-leak",
    }),
    { status: "UP", http_code: 200, response_time_ms: 124 },
);
assert.deepEqual(sanitizeSiteStatusPayload({ status: "something" }), {
    status: "UNKNOWN",
});
assert.deepEqual(
    sanitizeSiteStatusPayload({ status: "DOWN", http_code: 999, response_time_ms: -1 }),
    { status: "DOWN" },
);
assert.deepEqual(sanitizeSiteStatusPayload(null), { status: "UNKNOWN" });

// ── Site status handler ──
let upstreamCalls = 0;
const okFetch = async (url) => {
    upstreamCalls += 1;
    assert.match(url, /domain=example\.com/);
    return new Response(
        JSON.stringify({
            status: "UP",
            http_code: 200,
            response_time_ms: 88,
            leaked: "secret",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
};

const statusResponse = await handleSiteStatus(
    new Request("https://panel.example/api/site-status?domain=example.com"),
    okFetch,
);
assert.equal(statusResponse.status, 200);
assert.equal(statusResponse.headers.get("cache-control"), "no-store");
assert.match(statusResponse.headers.get("content-type"), /application\/json/);
assert.deepEqual(await statusResponse.json(), {
    status: "UP",
    http_code: 200,
    response_time_ms: 88,
});
assert.equal(upstreamCalls, 1);

let invalidFetchCalled = false;
const invalidResponse = await handleSiteStatus(
    new Request("https://panel.example/api/site-status?domain=localhost"),
    async () => {
        invalidFetchCalled = true;
        return new Response("{}");
    },
);
assert.equal(invalidResponse.status, 400);
assert.equal(invalidFetchCalled, false);

const postResponse = await handleSiteStatus(
    new Request("https://panel.example/api/site-status?domain=example.com", {
        method: "POST",
    }),
    okFetch,
);
assert.equal(postResponse.status, 405);
assert.equal(postResponse.headers.get("allow"), "GET");

const upstream500 = await handleSiteStatus(
    new Request("https://panel.example/api/site-status?domain=example.com"),
    async () => new Response("nope", { status: 500 }),
);
assert.equal(upstream500.status, 502);

const upstreamBadJson = await handleSiteStatus(
    new Request("https://panel.example/api/site-status?domain=example.com"),
    async () => new Response("<html>not json</html>", { status: 200 }),
);
assert.equal(upstreamBadJson.status, 502);

const upstreamThrows = await handleSiteStatus(
    new Request("https://panel.example/api/site-status?domain=example.com"),
    async () => {
        throw new Error("timeout");
    },
);
assert.equal(upstreamThrows.status, 502);

// ── Network info: Cloudflare ──
const cfRequest = new Request("https://panel.example/api/network-info", {
    headers: { "cf-connecting-ip": "1.1.1.1" },
});
Object.defineProperty(cfRequest, "cf", {
    value: {
        asn: 13335,
        asOrganization: "Cloudflare, Inc.",
        colo: "HKG",
        country: "HK",
        region: "Hong Kong",
        city: "Hong Kong",
    },
});
const cfResponse = await handleNetworkInfo(cfRequest, async () => {
    throw new Error("should not call ip9 for Cloudflare");
});
assert.equal(cfResponse.status, 200);
assert.equal(cfResponse.headers.get("cache-control"), "private, no-store");
assert.match(cfResponse.headers.get("content-type"), /application\/json/);
const cfData = await cfResponse.json();
assert.equal(cfData.platform, "cloudflare");
assert.equal(cfData.clientIp, "1.1.1.1");
assert.equal(cfData.asn, 13335);
assert.equal(cfData.organization, "Cloudflare, Inc.");
assert.equal(cfData.edgeLocation, "HKG");
assert.ok(cfData.location);
assert.ok(cfData.availableFields.includes("clientIp"));
assert.equal(cfData.availableFields.includes("asn"), true);
assert.equal(typeof cfData.updatedAt, "string");

// Private client IP must not be exposed as public.
const privateCfRequest = new Request("https://panel.example/api/network-info", {
    headers: { "cf-connecting-ip": "10.0.0.1" },
});
Object.defineProperty(privateCfRequest, "cf", { value: { colo: "HKG" } });
const privateCfData = await (
    await handleNetworkInfo(privateCfRequest, async () => new Response("{}"))
).json();
assert.equal(privateCfData.platform, "cloudflare");
assert.equal(privateCfData.clientIp, null);
assert.equal(privateCfData.availableFields.includes("clientIp"), false);

// ── Network info: EdgeOne ──
let ip9Lookups = 0;
const eoRequest = new Request("https://panel.example/api/network-info", {
    headers: {
        "eo-connecting-ip": "8.8.8.8",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    },
});
const eoResponse = await handleNetworkInfo(eoRequest, async (url) => {
    ip9Lookups += 1;
    assert.match(url, /ip=8\.8\.8\.8/);
    return new Response(
        JSON.stringify({
            ret: 200,
            data: {
                ip: "8.8.8.8",
                country: "美国",
                prov: "加利福尼亚",
                city: "山景城",
                area: "",
                isp: "Google LLC",
            },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
});
const eoData = await eoResponse.json();
assert.equal(eoData.platform, "edgeone");
assert.equal(eoData.clientIp, "8.8.8.8");
assert.equal(eoData.organization, "Google LLC");
assert.equal(eoData.asn, null);
assert.equal(eoData.edgeLocation, null);
assert.equal(eoData.location, "美国 · 加利福尼亚 · 山景城");
assert.equal(ip9Lookups, 1);

// Do not trust X-Forwarded-For.
const xffOnly = new Request("https://panel.example/api/network-info", {
    headers: { "x-forwarded-for": "1.2.3.4" },
});
const xffData = await (await handleNetworkInfo(xffOnly, async () => new Response("{}"))).json();
assert.equal(xffData.platform, "unknown");
assert.equal(xffData.clientIp, null);

// ip9 failure still returns the EdgeOne client IP with null enrichment.
const failingIp9 = new Request("https://panel.example/api/network-info", {
    headers: { "eo-connecting-ip": "8.8.4.4" },
});
const failingIp9Data = await (
    await handleNetworkInfo(failingIp9, async () => {
        throw new Error("ip9 down");
    })
).json();
assert.equal(failingIp9Data.platform, "edgeone");
assert.equal(failingIp9Data.clientIp, "8.8.4.4");
assert.equal(failingIp9Data.organization, null);

// Method restriction and malformed requests.
const networkPost = await handleNetworkInfo(
    new Request("https://panel.example/api/network-info", { method: "POST" }),
    async () => new Response("{}"),
);
assert.equal(networkPost.status, 405);

// EdgeOne legacy adapters load and expose the expected route.
const edgeSiteStatus = await import("./edge-functions/api/site-status.js");
const edgeNetworkInfo = await import("./edge-functions/api/network-info.js");
assert.equal(typeof edgeSiteStatus.onRequestGet, "function");
assert.equal(typeof edgeNetworkInfo.onRequestGet, "function");

console.log("stage8 shared API tests passed");
