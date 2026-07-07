import { ICON_API } from "./config";

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const escapeAttr = escapeHtml;

export const getIconQueryUrl = (url: string) => {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }
  return `${ICON_API}${encodeURIComponent(hostname)}`;
};
