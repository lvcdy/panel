import { corsHeaders, isCrossOriginDenied } from "./cors.js";
import { normalizePublicIp, sanitizeText } from "./ip.js";
import { checkRateLimit } from "./rate-limit.js";

const IP9_API_URL = "https://ip9.com.cn/get";
const IP_LOOKUP_TIMEOUT_MS = 1_500;

const baseHeaders = (request, env) => ({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "private, no-store",
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
      "cache-control": "private, no-store",
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

const uniqueParts = (parts) => {
  const seen = new Set();
  const result = [];

  parts.forEach((part) => {
    if (!part || seen.has(part)) return;
    seen.add(part);
    result.push(part);
  });

  return result;
};

const buildLocation = (parts) => {
  const location = uniqueParts(parts.filter(Boolean)).join(" · ");
  return location || null;
};

const toAsn = (value) => {
  const number =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);

  return Number.isInteger(number) && number > 0 && number < 2 ** 32
    ? number
    : null;
};

const countryName = (code) => {
  const normalized = sanitizeText(code, 8);
  if (!normalized) return null;

  try {
    if (typeof Intl !== "undefined" && "DisplayNames" in Intl) {
      const names = new Intl.DisplayNames(["zh-CN"], { type: "region" });
      const name = names.of(normalized.toUpperCase());
      if (name && name !== normalized) return name;
    }
  } catch {
    // Fall through to the raw country code.
  }

  return normalized;
};

const getCloudflareFields = (request) => {
  const headers = request.headers;
  const clientIp = normalizePublicIp(headers.get("cf-connecting-ip"));

  // EdgeOne Makers 的 V8 运行时也会提供 request.cf 兼容对象（字段为空），
  // 因此不能仅凭 request.cf 存在就判定为 Cloudflare，必须以平台注入的
  // cf-connecting-ip 头为准。
  if (!clientIp) return null;

  const cf = request.cf && typeof request.cf === "object" ? request.cf : {};

  const asn = toAsn(cf.asn);
  const organization = sanitizeText(cf.asOrganization, 120);
  const edgeLocation = sanitizeText(cf.colo, 8)?.toUpperCase() ?? null;
  const location = buildLocation([
    countryName(cf.country),
    sanitizeText(cf.region, 80),
    sanitizeText(cf.city, 80),
  ]);

  return {
    platform: "cloudflare",
    clientIp,
    asn,
    organization,
    edgeLocation,
    location,
  };
};

/**
 * EdgeOne Edge Functions 通过 request.eo 暴露客户端信息：
 * - request.eo.clientIp：访客公网 IP
 * - request.eo.geo：countryName / regionName / cityName 等地理信息
 * 同时保留旧版 eo-connecting-ip 头的兜底，兼容不同接入方式。
 */
const getEdgeOneFields = (request) => {
  const eo =
    request.eo && typeof request.eo === "object" ? request.eo : null;
  const headerIp = normalizePublicIp(
    request.headers.get("eo-connecting-ip"),
  );
  const clientIp = normalizePublicIp(eo?.clientIp) ?? headerIp;

  if (!eo && !headerIp) return null;

  const geo =
    eo?.geo && typeof eo.geo === "object" ? eo.geo : {};

  return {
    clientIp,
    location: buildLocation([
      sanitizeText(geo.countryName, 80),
      sanitizeText(geo.regionName, 80),
      sanitizeText(geo.cityName, 80),
    ]),
  };
};

const lookupIp9 = async (clientIp, fetchImpl) => {
  try {
    const url = new URL(IP9_API_URL);
    url.searchParams.set("ip", clientIp);

    const response = await fetchImpl(url.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(IP_LOOKUP_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const payload = await response.json();
    if (!payload || typeof payload !== "object") return null;

    const data = payload.data;
    if (!data || typeof data !== "object") return null;

    return {
      organization: sanitizeText(data.isp, 120),
      location: buildLocation([
        sanitizeText(data.country, 40),
        sanitizeText(data.prov, 60),
        sanitizeText(data.city, 60),
        sanitizeText(data.area, 60),
      ]),
    };
  } catch {
    return null;
  }
};

export const handleNetworkInfo = async (
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

  const rate = checkRateLimit(request, { route: "network-info", env });
  if (!rate.allowed) {
    return rateLimitedResponse(request, env, rate.retryAfter);
  }

  let info = {
    platform: "unknown",
    clientIp: null,
    asn: null,
    organization: null,
    edgeLocation: null,
    location: null,
  };

  try {
    const cloudflare = getCloudflareFields(request);
    if (cloudflare) {
      info = cloudflare;
    } else {
      const edgeone = getEdgeOneFields(request);

      if (edgeone?.clientIp) {
        // 边缘函数拿到的 clientIp/geo 已由平台注入；ip9 仅用于补充运营商信息。
        const ip9 = await lookupIp9(edgeone.clientIp, fetchImpl);
        info = {
          platform: "edgeone",
          clientIp: edgeone.clientIp,
          asn: null,
          organization: ip9?.organization ?? null,
          edgeLocation: null,
          location: edgeone.location ?? ip9?.location ?? null,
        };
      } else if (edgeone) {
        // 能识别为 EdgeOne 但拿不到客户端 IP：保留平台信息便于排查。
        info = {
          platform: "edgeone",
          clientIp: null,
          asn: null,
          organization: null,
          edgeLocation: null,
          location: edgeone.location,
        };
      }
    }
  } catch {
    info = {
      platform: "unknown",
      clientIp: null,
      asn: null,
      organization: null,
      edgeLocation: null,
      location: null,
    };
  }

  const availableFields = [
    "clientIp",
    "asn",
    "organization",
    "edgeLocation",
    "location",
  ].filter((field) => info[field] !== null);

  return jsonResponse(
    {
      platform: info.platform,
      clientIp: info.clientIp,
      asn: info.asn,
      organization: info.organization,
      edgeLocation: info.edgeLocation,
      location: info.location,
      availableFields,
      updatedAt: new Date().toISOString(),
    },
    200,
    request,
    env,
  );
};
