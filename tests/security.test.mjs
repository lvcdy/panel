import assert from "node:assert/strict";
import test from "node:test";
import {
  handleNetworkInfo,
} from "../shared/api/network-info.js";
import {
  handleSiteStatus,
  sanitizeSiteStatusPayload,
} from "../shared/api/site-status.js";
import { corsHeaders, isCrossOriginDenied } from "../shared/api/cors.js";
import { isValidStatusDomain, normalizePublicIp } from "../shared/api/ip.js";
import {
  checkRateLimit,
  resetRateLimitState,
} from "../shared/api/rate-limit.js";

const API_ORIGIN = "https://dash.example.net";

const makeRequest = (path, init = {}) =>
  new Request(`https://panel.example.com${path}`, init);

const withPlatform = (request, key, value) => {
  Object.defineProperty(request, key, {
    value,
    configurable: true,
    enumerable: true,
  });
  return request;
};

test("默认拒绝：未配置白名单时不向任何跨源来源发放 CORS 头", async () => {
  const request = makeRequest("/api/network-info", {
    headers: { origin: "https://evil.example" },
  });

  assert.equal(isCrossOriginDenied(request, {}), true);
  assert.equal(corsHeaders(request, {})["access-control-allow-origin"], undefined);

  const response = await handleNetworkInfo(request);
  assert.equal(response.status, 403);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    null,
  );
});

test("显式白名单内的跨源来源获得 CORS 头与 200", async () => {
  const env = { PANEL_ALLOWED_ORIGINS: API_ORIGIN };
  const request = makeRequest("/api/network-info", {
    headers: { origin: API_ORIGIN },
  });

  assert.equal(isCrossOriginDenied(request, env), false);

  const response = await handleNetworkInfo(request, fetch, env);
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    API_ORIGIN,
  );
  assert.equal(response.headers.get("vary"), "origin");
});

test("OPTIONS 预检：白名单内返回 204，白名单外返回 403", async () => {
  const env = { PANEL_ALLOWED_ORIGINS: API_ORIGIN };

  const allowed = await handleSiteStatus(
    makeRequest("/api/site-status", {
      method: "OPTIONS",
      headers: { origin: API_ORIGIN },
    }),
    fetch,
    env,
  );
  assert.equal(allowed.status, 204);

  const denied = await handleSiteStatus(
    makeRequest("/api/site-status", {
      method: "OPTIONS",
      headers: { origin: "https://evil.example" },
    }),
    fetch,
    env,
  );
  assert.equal(denied.status, 403);
});

test("默认拒绝：未登记的方法返回 405，且响应不泄露内部细节", async () => {
  const response = await handleNetworkInfo(
    makeRequest("/api/network-info", { method: "POST" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, OPTIONS");

  const payload = await response.json();
  assert.deepEqual(payload, { error: "Method not allowed" });
});

test("速率限制：超过窗口上限返回 429 与 Retry-After", async () => {
  resetRateLimitState();
  const env = { PANEL_ALLOWED_ORIGINS: API_ORIGIN, PANEL_RATE_LIMIT_MAX: "2" };
  const make = () =>
    makeRequest("/api/network-info", { headers: { origin: API_ORIGIN } });

  assert.equal((await handleNetworkInfo(make(), fetch, env)).status, 200);
  assert.equal((await handleNetworkInfo(make(), fetch, env)).status, 200);

  const limited = await handleNetworkInfo(make(), fetch, env);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) >= 1);

  const direct = checkRateLimit(make(), { route: "network-info", env });
  assert.equal(direct.allowed, false);

  resetRateLimitState();
});

test("输入按允许列表校验：域名/IP/私网地址被拒绝", async () => {
  assert.equal(isValidStatusDomain("example.com"), true);
  assert.equal(isValidStatusDomain("sub.example.co.uk"), true);
  assert.equal(isValidStatusDomain("127.0.0.1"), false);
  assert.equal(isValidStatusDomain("localhost"), false);
  assert.equal(isValidStatusDomain("example.com:8080"), false);
  assert.equal(isValidStatusDomain("http://example.com/"), false);

  assert.equal(normalizePublicIp("1.1.1.1"), "1.1.1.1");
  assert.equal(normalizePublicIp("10.0.0.1"), null);
  assert.equal(normalizePublicIp("192.168.1.1"), null);
  assert.equal(normalizePublicIp("::1"), null);

  const response = await handleSiteStatus(
    makeRequest("/api/site-status?domain=localhost"),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid domain" });
});

test("下游响应按白名单过滤：非法状态与越界字段被丢弃", () => {
  assert.deepEqual(sanitizeSiteStatusPayload(null), { status: "UNKNOWN" });
  assert.deepEqual(
    sanitizeSiteStatusPayload({
      status: "DOWN",
      http_code: 503,
      response_time_ms: 12.6,
    }),
    { status: "DOWN", http_code: 503, response_time_ms: 13 },
  );
  assert.deepEqual(
    sanitizeSiteStatusPayload({
      status: "HACKED",
      http_code: 999,
      response_time_ms: -1,
    }),
    { status: "UNKNOWN" },
  );
});

test("同源请求即使带 Origin 头也放行（不依赖跨源白名单）", async () => {
  const request = makeRequest("/api/network-info", {
    headers: { origin: "https://panel.example.com" },
  });

  assert.equal(isCrossOriginDenied(request, {}), false);
  const response = await handleNetworkInfo(request);
  assert.equal(response.status, 200);
});

test("EdgeOne：request.cf 空兼容对象不再误判为 Cloudflare", async () => {
  const request = withPlatform(makeRequest("/api/network-info"), "cf", {});
  withPlatform(request, "eo", {
    clientIp: "1.1.1.1",
    geo: { countryName: "中国", regionName: "广东", cityName: "深圳" },
  });

  const upstream = async () =>
    new Response(
      JSON.stringify({
        data: { isp: "Example ISP", country: "中国", prov: "广东", city: "深圳" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  const response = await handleNetworkInfo(request, upstream);
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.platform, "edgeone");
  assert.equal(payload.clientIp, "1.1.1.1");
  assert.equal(payload.organization, "Example ISP");
  assert.match(payload.location, /中国/);
  assert.ok(payload.availableFields.includes("clientIp"));
});

test("EdgeOne：仅 eo-connecting-ip 头时也能识别", async () => {
  const request = makeRequest("/api/network-info", {
    headers: { "eo-connecting-ip": "1.1.1.1" },
  });

  const response = await handleNetworkInfo(request, async () => {
    throw new Error("offline");
  });

  const payload = await response.json();
  assert.equal(payload.platform, "edgeone");
  assert.equal(payload.clientIp, "1.1.1.1");
});

test("Cloudflare：cf-connecting-ip 与 request.cf 字段正确映射", async () => {
  const request = withPlatform(
    makeRequest("/api/network-info", {
      headers: { "cf-connecting-ip": "1.1.1.1" },
    }),
    "cf",
    {
      asn: 13335,
      asOrganization: "Cloudflare, Inc.",
      colo: "hkg",
      country: "JP",
      region: "Tokyo",
      city: "Tokyo",
    },
  );

  const response = await handleNetworkInfo(request);
  const payload = await response.json();

  assert.equal(payload.platform, "cloudflare");
  assert.equal(payload.clientIp, "1.1.1.1");
  assert.equal(payload.asn, 13335);
  assert.equal(payload.edgeLocation, "HKG");
  assert.equal(payload.organization, "Cloudflare, Inc.");
  assert.match(payload.location, /日本/);
});

test("只有空 request.cf、没有平台头时返回 unknown（回归：曾误报 cloudflare）", async () => {
  const request = withPlatform(makeRequest("/api/network-info"), "cf", {});

  const response = await handleNetworkInfo(request);
  const payload = await response.json();

  assert.equal(payload.platform, "unknown");
  assert.equal(payload.clientIp, null);
  assert.deepEqual(payload.availableFields, []);
});
