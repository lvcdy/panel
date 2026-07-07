import { ICON_API } from "./config";

/** 判断字符串是否为合法 http/https URL */
export const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/** HTML 转义（防 XSS） */
export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** 属性值转义（与 escapeHtml 相同逻辑） */
export const escapeAttr = escapeHtml;

/** 根据网站 URL 生成 favicon 图标请求地址 */
export const getIconQueryUrl = (url: string) => {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }
  return `${ICON_API}${encodeURIComponent(hostname)}`;
};
