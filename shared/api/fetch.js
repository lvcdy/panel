/**
 * 带超时的 fetch。
 *
 * 不用 `AbortSignal.timeout()`：部分边缘运行时（如 EdgeOne 的 V8 环境）
 * 并未提供该静态方法，直接调用会在 fetch 之前抛 TypeError，被上层
 * catch 成 502/空结果。AbortController + setTimeout 是各运行时都支持的写法。
 */
export const fetchWithTimeout = async (
  fetchImpl,
  url,
  init = {},
  timeoutMs = 5_000,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};
