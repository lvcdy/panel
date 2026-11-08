import { isValidStatusDomain } from "./ip.js";

const STATUS_API_URL = "https://isyourwebsitedownrightnow.com/api/status";
const UPSTREAM_TIMEOUT_MS = 5_000;
const ALLOWED_STATUSES = new Set([
  "UP",
  "DOWN",
  "SLOW",
  "RESTRICTED",
  "UNKNOWN",
]);

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
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
export const handleSiteStatus = async (request, fetchImpl = fetch) => {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "allow": "GET",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  }

  const url = new URL(request.url);
  const domain = (url.searchParams.get("domain") ?? "").trim();

  if (!isValidStatusDomain(domain)) {
    return jsonResponse({ error: "Invalid domain" }, 400);
  }

  try {
    const upstreamUrl = new URL(STATUS_API_URL);
    upstreamUrl.searchParams.set("domain", domain);

    const upstream = await fetchImpl(upstreamUrl.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      return jsonResponse({ error: "Status service unavailable" }, 502);
    }

    let payload;
    try {
      payload = await upstream.json();
    } catch {
      return jsonResponse({ error: "Invalid status response" }, 502);
    }

    return jsonResponse(sanitizeSiteStatusPayload(payload));
  } catch {
    return jsonResponse({ error: "Status service unavailable" }, 502);
  }
};
