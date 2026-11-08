import { CATEGORIES, type Category } from "../../data/links";
import { createStableCategoryId, createStableLinkId } from "./ids";
import {
    PANEL_SCHEMA_VERSION,
    type PanelCategory,
    type PanelConfig,
    type PanelLink,
    type PanelSettings,
} from "./types";

export const DEFAULT_SETTINGS: PanelSettings = {
    glass: {
        blur: 18,
        saturate: 165,
    },
    backgroundUrl: "",
    hitokotoApi: "",
    customSearchEngine: null,
    theme: "dark",
};

export const cloneSettings = (settings: PanelSettings): PanelSettings => ({
    glass: { ...settings.glass },
    backgroundUrl: settings.backgroundUrl,
    hitokotoApi: settings.hitokotoApi,
    customSearchEngine: settings.customSearchEngine
        ? { ...settings.customSearchEngine }
        : null,
    theme: settings.theme,
});

export const clonePanelConfig = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as unknown as T;

/** 从现有 links.ts 生成默认配置；ID 基于标题/URL，顺序调整不会影响稳定性 */
export const createDefaultPanelConfig = (
    settings: PanelSettings = DEFAULT_SETTINGS,
): PanelConfig => {
    const usedCategoryIds = new Set<string>();
    const usedLinkIds = new Set<string>();
    const defaultCategories: readonly Category[] = CATEGORIES;

    const categories: PanelCategory[] = defaultCategories.map((category) => {
        const categoryId = createStableCategoryId(category.title, usedCategoryIds);

        const links: PanelLink[] = category.links.map((link) => ({
            id: createStableLinkId(category.title, link.url, usedLinkIds),
            name: link.name,
            url: link.url,
            description: link.description ?? "",
            icon: link.icon,
            color: link.color,
            ...(typeof link.useIcon === "boolean" ? { useIcon: link.useIcon } : {}),
            ...(typeof link.status === "boolean" ? { status: link.status } : {}),
            tags: [...(link.tags ?? [])],
            favorite: link.favorite ?? false,
            openInNewTab: link.openInNewTab ?? true,
            visible: link.visible ?? true,
        }));

        return {
            id: categoryId,
            title: category.title,
            ...(category.icon ? { icon: category.icon } : {}),
            visible: category.visible ?? true,
            links,
        };
    });

    return {
        schemaVersion: PANEL_SCHEMA_VERSION,
        categories,
        settings: cloneSettings(settings),
    };
};
