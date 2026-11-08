/**
 * 允许 Font Awesome 的样式前缀 + 一个或多个 fa-* 类名。
 * 用于表单侧校验，保证只写入合法的类名；渲染层仍会再次转义。
 */
export const FA_ICON_PATTERN =
    /^(?:(?:fas|far|fab|fa-solid|fa-regular|fa-brands)\s+)?(?:fa-[a-z0-9-]+\s*)+$/i;

export const normalizeIconClass = (value: string): string =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

export const isValidIconClass = (value: string): boolean =>
    FA_ICON_PATTERN.test(normalizeIconClass(value));
