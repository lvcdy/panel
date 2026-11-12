import { corsHeaders, isCrossOriginDenied } from "./cors.js";
import { isValidStatusDomain } from "./ip.js";
import { checkRateLimit } from "./rate-limit.js";

const STATUS_API_URL = "https://isyourwebsitedownrightnow.com/api/status";
// 上游偶发 4s+，需小于前端 7s 请求超时，同时给慢上游留出返回 SLOW 的余量。
const UPSTREAM_TIMEOUT_MS = 4_500;
const ALLOWED_STATUSES = new Set([
  "UP",
  "DOWN",
  "SLOW",
  "RESTRICTED",
  "UNKNOWN",
]);

const baseHeaders = (request, env) => ({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  ...corsHeaders(request, env),
});

const jsonResponse = (body, status, request, env) =>
  new Response(JSON.stringify(body), {
    status,
    headers: baseHeaders(request, env),
  });

const deniedResponse = (request, env) =>
  jsonResponse({ error: "Origin not allowed" }, 403, request, env);

const preflightResponse = (request, env) =>
  new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      ...corsHeaders(request, env),
    },
  });

const rateLimitedResponse = (request, env, retryAfter) =>
  new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      ...baseHeaders(request, env),
      "retry-after": String(retryAfter),
    },
  });

export const sanitizeSiteStatusPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { status: "UNKNOWN" };
  }

  const rawStatus =
    typeof payload.status === "string" ? payload.status.toUpperCase() : "";
  const status = ALLOWED_STATUSES.has(rawStatus) ? rawStatus : "UNKNOWN";

  const result = { status };

  if (
    typeof payload.http_code === "number" &&
    Number.isFinite(payload.http_code) &&
    payload.http_code >= 100 &&
    payload.http_code <= 599
  ) {
    result.http_code = payload.http_code;
  }

  if (
    typeof payload.response_time_ms === "number" &&
    Number.isFinite(payload.response_time_ms) &&
    payload.response_time_ms >= 0 &&
    payload.response_time_ms <= 60_000
  ) {
    result.response_time_ms = Math.round(payload.response_time_ms);
  }

  return result;
};

/**
 * 固定上游状态服务代理。不直接 fetch 用户提供的 URL，
 * 只把经过格式校验的公共域名交给状态服务。
 */
export const handleSiteStatus = async (
  request,
  fetchImpl = fetch,
  env = {},
) => {
  // 默认拒绝：未列入白名单的跨源来源一律不发放 CORS 头。
  if (isCrossOriginDenied(request, env)) {
    return deniedResponse(request, env);
  }

  if (request.method === "OPTIONS") {
    return preflightResponse(request, env);
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...baseHeaders(request, env),
        allow: "GET, OPTIONS",
      },
    });
  }

  const rate = checkRateLimit(request, { route: "site-status", env });
  if (!rate.allowed) {
    return rateLimitedResponse(request, env, rate.retryAfter);
  }

  const url = new URL(request.url);
  const domain = (url.searchParams.get("domain") ?? "").trim();

  if (!isValidStatusDomain(domain)) {
    return jsonResponse({ error: "Invalid domain" }, 400, request, env);
  }

  try {
    const upstreamUrl = new URL(STATUS_API_URL);
    upstreamUrl.searchParams.set("domain", domain);

    const upstream = await fetchImpl(upstreamUrl.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      return jsonResponse(
        { error: "Status service unavailable" },
        502,
        request,
        env,
      );
    }

    let payload;
    try {
      payload = await upstream.json();
    } catch {
      return jsonResponse(
        { error: "Invalid status response" },
        502,
        request,
        env,
      );
    }

    return jsonResponse(sanitizeSiteStatusPayload(payload), 200, request, env);
  } catch {
    return jsonResponse(
      { error: "Status service unavailable" },
      502,
      request,
      env,
    );
  }
};
