/**
 * 跨域访问默认拒绝（Saltzer & Schroeder：默认拒绝、完全仲裁）。
 *
 * 同源请求不需要 CORS 头，浏览器会直接放行；只有显式列入
 * `PANEL_ALLOWED_ORIGINS`（逗号分隔的完整 origin，如
 * `https://panel.example.com`）的跨源来源才会获得 CORS 响应头。
 * 未配置该变量时，任何跨源请求都拿不到 CORS 头，浏览器侧即被拒绝。
 */

const ORIGIN_PATTERN = /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i;

export const parseAllowedOrigins = (value) => {
  if (typeof value !== "string") return new Set();

  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => ORIGIN_PATTERN.test(item)),
  );
};

/** 请求是否来自未被授权的跨源来源（浏览器跨源请求必带 Origin，同源/非浏览器不带）。 */
export const isCrossOriginDenied = (request, env = {}) => {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  // 同源请求即使带了 Origin 头（少数 fetch 场景）也应放行。
  try {
    if (origin === new URL(request.url).origin) return false;
  } catch {
    // request.url 异常时按跨源处理。
  }

  return !parseAllowedOrigins(env.PANEL_ALLOWED_ORIGINS).has(origin);
};

/** 生成需要附加到任意响应上的 CORS 头（未授权时不返回 allow-origin）。 */
export const corsHeaders = (request, env = {}) => {
  const headers = { vary: "origin" };
  const origin = request.headers.get("origin");

  if (
    origin &&
    parseAllowedOrigins(env.PANEL_ALLOWED_ORIGINS).has(origin)
  ) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "GET, OPTIONS";
    headers["access-control-allow-headers"] = "accept";
    headers["access-control-max-age"] = "600";
  }

  return headers;
};
