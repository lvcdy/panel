// Shared IP9 API utilities for server and client

// ── Types ──

export interface Ip9Data {
  ip?: string;
  country?: string;
  prov?: string;
  city?: string;
  area?: string;
  isp?: string;
}

export interface Ip9Response {
  ret?: number;
  data?: Ip9Data;
  error?: string;
}

// ── Text helpers ──

export const getText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const getUniqueParts = (parts: unknown[]): string[] => {
  const seen = new Set<string>();
  return parts
    .map(getText)
    .filter((part) => part && !seen.has(part) && seen.add(part));
};

// ── Formatting ──

export const FALLBACK_IP_TEXT = "IP 信息暂不可用";

/** Format IP9 data into a readable summary like "IP 1.2.3.4 · 中国 辽宁 锦州 · 中国联通" */
export const formatIpSummary = (data: Ip9Data): string => {
  const ip = getText(data.ip);
  const location = getUniqueParts([data.country, data.prov, data.city, data.area]).join(" ");
  const isp = getText(data.isp);

  return [ip ? `IP ${ip}` : "", location, isp].filter(Boolean).join(" · ") || FALLBACK_IP_TEXT;
};

/** Format IP9 data into an edge node info object */
export const formatEdgeNode = (data?: Ip9Data): { ip: string; location: string } | null => {
  const ip = getText(data?.ip);
  if (!ip || ip === "unknown") return null;

  const location = getUniqueParts([data?.country, data?.prov, data?.city, data?.area]).join(" ");
  return { ip, location };
};

// ── Fetch helpers ──

/** Fetch from IP9 API and validate the response */
export const fetchIp9 = async (url: string, timeout = 5000): Promise<Ip9Response> => {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    throw new Error(`IP9 request failed: HTTP ${res.status}`);
  }

  const payload = (await res.json()) as Ip9Response;
  if (payload.ret !== 200 || !payload.data) {
    throw new Error(payload.error || "IP9 API response unavailable");
  }

  return payload;
};
