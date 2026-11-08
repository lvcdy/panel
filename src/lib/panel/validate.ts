import { isValidHttpUrl } from "../utils";
import { DEFAULT_SETTINGS, cloneSettings } from "./defaults";
import { createStableCategoryId, createStableLinkId } from "./ids";
import {
    PANEL_SCHEMA_VERSION,
    type PanelCategory,
    type PanelConfig,
    type PanelCustomSearchEngine,
    type PanelLink,
    type PanelSettings,
} from "./types";

export interface ValidationSuccess {
    readonly ok: true;
    readonly value: PanelConfig;
}

export interface ValidationFailure {
    readonly ok: false;
    readonly errors: string[];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const ICON_PATTERN = /^[A-Za-z0-9 _-]{1,100}$/;
const COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const MAX_CATEGORIES = 200;
const MAX_LINKS_PER_CATEGORY = 1000;
const MAX_TOTAL_LINKS = 5000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;
const MAX_URL_LENGTH = 2048;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const failure = (errors: string[]): ValidationFailure => ({ ok: false, errors });

const readBoolean = (
    value: unknown,
    fallback: boolean,
    path: string,
    errors: string[],
): boolean => {
    if (value === undefined) return fallback;

    if (typeof value !== "boolean") {
        errors.push(`${path} 必须是布尔值`);
        return fallback;
    }

    return value;
};

const readOptionalBoolean = (
    value: unknown,
    path: string,
    errors: string[],
): boolean | undefined => {
    if (value === undefined) return undefined;

    if (typeof value !== "boolean") {
        errors.push(`${path} 必须是布尔值`);
        return undefined;
    }

    return value;
};

const readInteger = (
    value: unknown,
    fallback: number,
    min: number,
    max: number,
    path: string,
    errors: string[],
): number => {
    if (value === undefined) return fallback;

    if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < min ||
        value > max
    ) {
        errors.push(`${path} 必须是 ${min}-${max} 之间的整数`);
        return fallback;
    }

    return value;
};

const readHttpUrl = (
    value: unknown,
    path: string,
    errors: string[],
    required: boolean,
): string => {
    if (value === undefined || value === null) {
        if (required) errors.push(`${path} 不能为空`);
        return "";
    }

    if (typeof value !== "string") {
        errors.push(`${path} 必须是字符串`);
        return "";
    }

    const trimmed = value.trim();
    if (!trimmed) {
        if (required) errors.push(`${path} 不能为空`);
        return "";
    }

    if (trimmed.length > MAX_URL_LENGTH) {
        errors.push(`${path} 不能超过 ${MAX_URL_LENGTH} 个字符`);
        return "";
    }

    if (!isValidHttpUrl(trimmed)) {
        errors.push(`${path} 必须是合法的 http/https URL`);
        return "";
    }

    return trimmed;
};

const readOptionalIcon = (
    value: unknown,
    path: string,
    errors: string[],
): string | undefined => {
    if (value === undefined) return undefined;

    if (typeof value !== "string") {
        errors.push(`${path} 必须是字符串`);
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (!ICON_PATTERN.test(trimmed)) {
        errors.push(`${path} 包含非法字符`);
        return undefined;
    }

    return trimmed;
};

const readColor = (value: unknown, path: string, errors: string[]): string => {
    if (value === undefined) return "#ffffff";

    if (typeof value !== "string" || !COLOR_PATTERN.test(value.trim())) {
        errors.push(`${path} 必须是合法的十六进制颜色`);
        return "#ffffff";
    }

    return value.trim().toLowerCase();
};

const readTags = (value: unknown, path: string, errors: string[]): string[] => {
    if (value === undefined) return [];

    if (!Array.isArray(value)) {
        errors.push(`${path} 必须是字符串数组`);
        return [];
    }

    if (value.length > MAX_TAGS) {
        errors.push(`${path} 最多允许 ${MAX_TAGS} 个标签`);
        return [];
    }

    const tags: string[] = [];

    for (const tag of value) {
        if (typeof tag !== "string") {
            errors.push(`${path} 只能包含字符串`);
            continue;
        }

        const trimmed = tag.trim();
        if (!trimmed) continue;

        if (trimmed.length > MAX_TAG_LENGTH) {
            errors.push(`${path} 的单个标签不能超过 ${MAX_TAG_LENGTH} 个字符`);
            continue;
        }

        if (!tags.includes(trimmed)) tags.push(trimmed);
    }

    return tags;
};

const readDescription = (
    value: unknown,
    path: string,
    errors: string[],
): string => {
    if (value === undefined) return "";

    if (typeof value !== "string") {
        errors.push(`${path} 必须是字符串`);
        return "";
    }

    const trimmed = value.trim();
    if (trimmed.length > 500) {
        errors.push(`${path} 不能超过 500 个字符`);
    }

    return trimmed;
};

const resolveId = (
    raw: unknown,
    fallback: () => string,
    used: Set<string>,
): string => {
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (ID_PATTERN.test(trimmed) && !used.has(trimmed)) {
            used.add(trimmed);
            return trimmed;
        }
    }

    return fallback();
};

export const normalizeCustomSearchEngine = (
    raw: unknown,
    path: string,
    errors: string[],
): PanelCustomSearchEngine | null => {
    if (raw === undefined || raw === null) return null;

    if (!isRecord(raw)) {
        errors.push(`${path} 必须是对象或 null`);
        return null;
    }

    const url = readHttpUrl(raw.url, `${path}.url`, errors, true);
    if (!url) return null;

    let name = "自定义";
    if (raw.name !== undefined) {
        if (typeof raw.name !== "string") {
            errors.push(`${path}.name 必须是字符串`);
        } else {
            const trimmed = raw.name.trim();
            if (trimmed.length > 60) {
                errors.push(`${path}.name 不能超过 60 个字符`);
            } else if (trimmed) {
                name = trimmed;
            }
        }
    }

    let placeholder = "🔎 输入关键词开始搜索...";
    if (raw.placeholder !== undefined) {
        if (typeof raw.placeholder !== "string") {
            errors.push(`${path}.placeholder 必须是字符串`);
        } else {
            const trimmed = raw.placeholder.trim();
            if (trimmed.length > 200) {
                errors.push(`${path}.placeholder 不能超过 200 个字符`);
            } else if (trimmed) {
                placeholder = trimmed;
            }
        }
    }

    return { name, url, placeholder };
};

const validateSettings = (raw: unknown, errors: string[]): PanelSettings => {
    const defaults = cloneSettings(DEFAULT_SETTINGS);

    if (raw === undefined) return defaults;

    if (!isRecord(raw)) {
        errors.push("settings 必须是对象");
        return defaults;
    }

    let blur = defaults.glass.blur;
    let saturate = defaults.glass.saturate;

    if (raw.glass !== undefined) {
        if (!isRecord(raw.glass)) {
            errors.push("settings.glass 必须是对象");
        } else {
            blur = readInteger(
                raw.glass.blur,
                blur,
                0,
                100,
                "settings.glass.blur",
                errors,
            );
            saturate = readInteger(
                raw.glass.saturate,
                saturate,
                100,
                200,
                "settings.glass.saturate",
                errors,
            );
        }
    }

    const backgroundUrl = readHttpUrl(
        raw.backgroundUrl,
        "settings.backgroundUrl",
        errors,
        false,
    );
    const hitokotoApi = readHttpUrl(
        raw.hitokotoApi,
        "settings.hitokotoApi",
        errors,
        false,
    );
    const customSearchEngine = normalizeCustomSearchEngine(
        raw.customSearchEngine,
        "settings.customSearchEngine",
        errors,
    );

    if (raw.theme !== undefined && raw.theme !== "dark") {
        errors.push("settings.theme 目前仅支持 dark");
    }

    return {
        glass: { blur, saturate },
        backgroundUrl,
        hitokotoApi,
        customSearchEngine,
        theme: "dark",
    };
};

const validateLink = (
    raw: unknown,
    path: string,
    categoryTitle: string,
    usedLinkIds: Set<string>,
    errors: string[],
): PanelLink | null => {
    if (!isRecord(raw)) {
        errors.push(`${path} 必须是对象`);
        return null;
    }

    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) {
        errors.push(`${path}.name 不能为空`);
        return null;
    }

    if (name.length > 100) {
        errors.push(`${path}.name 不能超过 100 个字符`);
        return null;
    }

    const url = readHttpUrl(raw.url, `${path}.url`, errors, true);
    if (!url) return null;

    const id = resolveId(
        raw.id,
        () => createStableLinkId(categoryTitle, url, usedLinkIds),
        usedLinkIds,
    );
    const description = readDescription(raw.description, `${path}.description`, errors);
    const icon = readOptionalIcon(raw.icon, `${path}.icon`, errors) ?? "fas fa-link";
    const color = readColor(raw.color, `${path}.color`, errors);
    const tags = readTags(raw.tags, `${path}.tags`, errors);
    const useIcon = readOptionalBoolean(raw.useIcon, `${path}.useIcon`, errors);
    const status = readOptionalBoolean(raw.status, `${path}.status`, errors);
    const favorite = readBoolean(raw.favorite, false, `${path}.favorite`, errors);
    const openInNewTab = readBoolean(
        raw.openInNewTab,
        true,
        `${path}.openInNewTab`,
        errors,
    );
    const visible = readBoolean(raw.visible, true, `${path}.visible`, errors);

    return {
        id,
        name,
        url,
        description,
        icon,
        color,
        ...(useIcon !== undefined ? { useIcon } : {}),
        ...(status !== undefined ? { status } : {}),
        tags,
        favorite,
        openInNewTab,
        visible,
    };
};

const validateCategory = (
    raw: unknown,
    index: number,
    usedCategoryIds: Set<string>,
    usedLinkIds: Set<string>,
    errors: string[],
): PanelCategory | null => {
    const path = `categories[${index}]`;

    if (!isRecord(raw)) {
        errors.push(`${path} 必须是对象`);
        return null;
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) {
        errors.push(`${path}.title 不能为空`);
        return null;
    }

    if (title.length > 60) {
        errors.push(`${path}.title 不能超过 60 个字符`);
        return null;
    }

    const id = resolveId(
        raw.id,
        () => createStableCategoryId(title, usedCategoryIds),
        usedCategoryIds,
    );
    const icon = readOptionalIcon(raw.icon, `${path}.icon`, errors);
    const visible = readBoolean(raw.visible, true, `${path}.visible`, errors);

    if (!Array.isArray(raw.links)) {
        errors.push(`${path}.links 必须是数组`);
        return null;
    }

    if (raw.links.length > MAX_LINKS_PER_CATEGORY) {
        errors.push(`${path}.links 数量超过上限（${MAX_LINKS_PER_CATEGORY}）`);
    }

    const links: PanelLink[] = [];
    raw.links.forEach((linkRaw, linkIndex) => {
        const link = validateLink(
            linkRaw,
            `${path}.links[${linkIndex}]`,
            title,
            usedLinkIds,
            errors,
        );
        if (link) links.push(link);
    });

    return {
        id,
        title,
        ...(icon ? { icon } : {}),
        visible,
        links,
    };
};

/**
 * 深度校验并归一化配置。
 * 所有非法字段都会被记录为错误，调用方据此拒绝整份数据。
 */
export const validatePanelConfig = (input: unknown): ValidationResult => {
    if (!isRecord(input)) {
        return failure(["配置必须是 JSON 对象"]);
    }

    const version = input.schemaVersion;
    if (typeof version !== "number" || !Number.isInteger(version)) {
        return failure(["缺少或无效的 schemaVersion"]);
    }

    if (version > PANEL_SCHEMA_VERSION) {
        return failure([
            `配置版本过新（${version}），当前仅支持 ${PANEL_SCHEMA_VERSION}`,
        ]);
    }

    if (version !== PANEL_SCHEMA_VERSION) {
        return failure([`不支持的配置版本：${version}`]);
    }

    if (!Array.isArray(input.categories)) {
        return failure(["categories 必须是数组"]);
    }

    if (input.categories.length > MAX_CATEGORIES) {
        return failure([`分类数量超过上限（${MAX_CATEGORIES}）`]);
    }

    const errors: string[] = [];
    const usedCategoryIds = new Set<string>();
    const usedLinkIds = new Set<string>();
    const categories: PanelCategory[] = [];

    input.categories.forEach((raw, index) => {
        const category = validateCategory(
            raw,
            index,
            usedCategoryIds,
            usedLinkIds,
            errors,
        );
        if (category) categories.push(category);
    });

    const totalLinks = categories.reduce(
        (total, category) => total + category.links.length,
        0,
    );
    if (totalLinks > MAX_TOTAL_LINKS) {
        errors.push(`网站总数超过上限（${MAX_TOTAL_LINKS}）`);
    }

    const settings = validateSettings(input.settings, errors);

    if (errors.length > 0) return failure(errors);

    return {
        ok: true,
        value: {
            schemaVersion: PANEL_SCHEMA_VERSION,
            categories,
            settings,
        },
    };
};

/**
 * 预留迁移入口。未来 schemaVersion 升级时在此按版本逐级转换，
 * 然后再交给 validatePanelConfig。
 */
export const migratePanelConfig = (input: unknown): unknown => input;
