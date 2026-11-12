import { normalizePublicIp } from "./ip.js";

/**
 * 轻量速率限制（纵深防御的一部分，不替代平台 WAF）。
 *
 * 按「路由 + 平台注入的客户端 IP」做固定窗口计数。Edge 运行时每个 isolate
 * 各有一份内存，因此它是尽力而为的；真正的容量防护由 Cloudflare / EdgeOne
 * 的 WAF 速率规则承担。未获得平台 IP 头时统一落到 anonymous 桶，宁可误伤
 * 也不让匿名请求绕过限制。
 */

export const DEFAULT_RATE_LIMIT_MAX = 120;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 5_000;

const buckets = new Map();

/** 仅用于测试：清空计数避免用例互相影响。 */
export const resetRateLimitState = () => {
  buckets.clear();
};

const readPositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max
    ? parsed
    : fallback;
};

const clientKey = (request) => {
  const headers = request.headers;
  const ip =
    normalizePublicIp(headers.get("cf-connecting-ip")) ??
    normalizePublicIp(headers.get("eo-connecting-ip"));

  return ip ?? "anonymous";
};

const pruneExpired = (now) => {
  if (buckets.size <= MAX_BUCKETS) return;

  buckets.forEach((entry, key) => {
    if (now - entry.start >= DEFAULT_RATE_LIMIT_WINDOW_MS) buckets.delete(key);
  });
};

/**
 * @returns {{allowed: boolean, remaining: number, retryAfter: number}}
 */
export const checkRateLimit = (request, options = {}) => {
  const {
    route = "default",
    env = {},
    now = Date.now(),
  } = options;

  const limit = readPositiveInt(
    env.PANEL_RATE_LIMIT_MAX,
    DEFAULT_RATE_LIMIT_MAX,
    10_000,
  );
  const windowMs = readPositiveInt(
    env.PANEL_RATE_LIMIT_WINDOW_MS,
    DEFAULT_RATE_LIMIT_WINDOW_MS,
    60 * 60 * 1000,
  );

  pruneExpired(now);

  const key = `${route}:${clientKey(request)}`;
  const entry = buckets.get(key);

  if (!entry || now - entry.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count <= limit) {
    return { allowed: true, remaining: limit - entry.count, retryAfter: 0 };
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfter: Math.max(1, Math.ceil((windowMs - (now - entry.start)) / 1000)),
  };
};
