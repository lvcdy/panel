import { normalizePublicIp, sanitizeText } from "./ip.js";

const IP9_API_URL = "https://ip9.com.cn/get";
const IP_LOOKUP_TIMEOUT_MS = 1_500;

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
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
  const cf = request.cf;
  if (!cf || typeof cf !== "object") return null;

  const headers = request.headers;
  const clientIp = normalizePublicIp(headers.get("cf-connecting-ip"));

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

export const handleNetworkInfo = async (request, fetchImpl = fetch) => {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "allow": "GET",
        "cache-control": "private, no-store",
        "access-control-allow-origin": "*",
      },
    });
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
      // 只信任平台注入的 EdgeOne 客户端 IP，不使用可被调用方伪造的 X-Forwarded-For。
      const eoClientIp = normalizePublicIp(
        request.headers.get("eo-connecting-ip"),
      );

      if (eoClientIp) {
        const ip9 = await lookupIp9(eoClientIp, fetchImpl);
        info = {
          platform: "edgeone",
          clientIp: eoClientIp,
          asn: null,
          organization: ip9?.organization ?? null,
          edgeLocation: null,
          location: ip9?.location ?? null,
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

  return jsonResponse({
    platform: info.platform,
    clientIp: info.clientIp,
    asn: info.asn,
    organization: info.organization,
    edgeLocation: info.edgeLocation,
    location: info.location,
    availableFields,
    updatedAt: new Date().toISOString(),
  });
};
