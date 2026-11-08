import { getStoredText, trySetStoredText } from "../storage";
import {
    clonePanelConfig,
    cloneSettings,
    createDefaultPanelConfig,
} from "./defaults";
import { createUserCategoryId, createUserLinkId } from "./ids";
import { clearLegacyKeys, readLegacySettings } from "./legacy";
import {
    PANEL_CONFIG_STORAGE_KEY,
    type CategoryDeleteMode,
    type CategoryInput,
    type CategoryPatch,
    type LinkInput,
    type LinkPatch,
    type PanelCategory,
    type PanelConfig,
    type PanelLink,
    type PanelSettings,
    type PanelStoreListener,
    type StoreChange,
    type StoreErrorCode,
    type StoreFailure,
    type StoreResult,
} from "./types";
import { migratePanelConfig, validatePanelConfig } from "./validate";

let currentConfig: PanelConfig | null = null;
let initialized = false;
let initWarning: string | null = null;
let pendingLegacyCleanup = false;
let storedConfigLoaded = false;

const listeners = new Set<PanelStoreListener>();

const makeFailure = (
    code: StoreErrorCode,
    message: string,
    details?: string[],
): StoreFailure => ({
    ok: false,
    code,
    message,
    ...(details && details.length > 0 ? { details } : {}),
});

const parseStoredConfig = (raw: string): StoreResult<PanelConfig> => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return makeFailure("invalid", "本地配置 JSON 解析失败", ["JSON.parse 失败"]);
    }

    const validation = validatePanelConfig(migratePanelConfig(parsed));
    if (!validation.ok) {
        return makeFailure("invalid", "本地配置校验失败", validation.errors);
    }

    return { ok: true, value: validation.value };
};

const ensureConfig = (): PanelConfig => {
    if (!currentConfig) {
        if (!initialized) initPanelStore();
        if (!currentConfig) {
            currentConfig = createDefaultPanelConfig(readLegacySettings());
        }
    }

    return currentConfig;
};

const persistConfig = (config: PanelConfig): StoreResult<void> => {
    let raw: string;

    try {
        raw = JSON.stringify(config);
    } catch {
        return makeFailure("invalid", "配置无法序列化，修改未保存");
    }

    const stored = trySetStoredText(PANEL_CONFIG_STORAGE_KEY, raw);

    if (stored.ok) return { ok: true, value: undefined };

    if (stored.error === "quota-exceeded") {
        return makeFailure(
            "quota-exceeded",
            "浏览器存储空间不足，配置未保存。请清理浏览器数据后重试。",
        );
    }

    if (stored.error === "unavailable") {
        return makeFailure(
            "storage-unavailable",
            "浏览器本地存储不可用，配置未保存。请检查隐私模式或浏览器存储设置。",
        );
    }

    return makeFailure("storage-error", "写入本地存储失败，配置未保存");
};

const notifyChange = (
    previous: PanelConfig,
    next: PanelConfig,
    source: "local" | "remote",
): void => {
    const change: StoreChange = {
        source,
        categoriesChanged:
            JSON.stringify(previous.categories) !== JSON.stringify(next.categories),
        settingsChanged:
            JSON.stringify(previous.settings) !== JSON.stringify(next.settings),
    };

    if (!change.categoriesChanged && !change.settingsChanged) return;

    listeners.forEach((listener) => {
        try {
            listener(clonePanelConfig(next), change);
        } catch (error) {
            console.error("Panel 配置订阅者执行失败:", error);
        }
    });
};

/** 仅在持久化成功后调用 */
const commitConfig = (next: PanelConfig, source: "local" | "remote"): void => {
    const previous = currentConfig;
    currentConfig = next;

    if (source === "local" && pendingLegacyCleanup) {
        clearLegacyKeys();
        pendingLegacyCleanup = false;
    }

    if (previous) notifyChange(previous, next, source);
};

const handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== PANEL_CONFIG_STORAGE_KEY) return;

    if (event.newValue === null) {
        const previous = currentConfig;
        const fallback = createDefaultPanelConfig(readLegacySettings());
        currentConfig = fallback;
        pendingLegacyCleanup = true;
        storedConfigLoaded = false;
        if (previous) notifyChange(previous, fallback, "remote");
        return;
    }

    const parsed = parseStoredConfig(event.newValue);
    if (!parsed.ok) {
        console.warn("忽略其他标签页写入的无效 Panel 配置:", parsed.details);
        return;
    }

    const previous = currentConfig;
    currentConfig = parsed.value;
    storedConfigLoaded = true;
    if (previous) notifyChange(previous, parsed.value, "remote");
};

export const initPanelStore = (): void => {
    if (initialized || typeof window === "undefined") return;
    initialized = true;

    const raw = getStoredText(PANEL_CONFIG_STORAGE_KEY);

    if (raw) {
        const parsed = parseStoredConfig(raw);
        if (parsed.ok) {
            currentConfig = parsed.value;
            storedConfigLoaded = true;
        } else {
            currentConfig = createDefaultPanelConfig(readLegacySettings());
            initWarning =
                "本地配置读取失败，已临时使用默认配置；原始数据未被覆盖。";
            pendingLegacyCleanup = true;
            console.warn("Panel 配置读取失败:", parsed.details);
        }
    } else {
        currentConfig = createDefaultPanelConfig(readLegacySettings());
        pendingLegacyCleanup = true;
    }

    window.addEventListener("storage", handleStorageEvent);
};

export const getStoreInitWarning = (): string | null => initWarning;

/** 首次加载时是否真的从 localStorage 还原了有效配置 */
export const wasPanelConfigStored = (): boolean => storedConfigLoaded;

export const getPanelConfig = (): PanelConfig =>
    clonePanelConfig(ensureConfig());

export const getPanelSettings = (): PanelSettings =>
    cloneSettings(ensureConfig().settings);

export const subscribePanelConfig = (
    listener: PanelStoreListener,
): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/**
 * 唯一写入口。顺序固定：
 * 校验 → 持久化 → 更新内存 → 通知订阅者（页面渲染）。
 */
export const updatePanelConfig = (
    mutator: (draft: PanelConfig) => void,
): StoreResult<PanelConfig> => {
    const draft = clonePanelConfig(ensureConfig());

    try {
        mutator(draft);
    } catch (error) {
        return makeFailure(
            "invalid",
            "配置修改失败，修改未保存",
            [error instanceof Error ? error.message : String(error)],
        );
    }

    const validation = validatePanelConfig(draft);
    if (!validation.ok) {
        return makeFailure("invalid", "配置校验失败，修改未保存", validation.errors);
    }

    const persisted = persistConfig(validation.value);
    if (!persisted.ok) return persisted;

    commitConfig(validation.value, "local");
    return { ok: true, value: clonePanelConfig(validation.value) };
};

export const replacePanelConfig = (candidate: unknown): StoreResult<PanelConfig> => {
    const validation = validatePanelConfig(migratePanelConfig(candidate));
    if (!validation.ok) {
        return makeFailure("invalid", "配置校验失败，未导入", validation.errors);
    }

    const persisted = persistConfig(validation.value);
    if (!persisted.ok) return persisted;

    commitConfig(validation.value, "local");
    return { ok: true, value: clonePanelConfig(validation.value) };
};

/**
 * 原子替换导航数据，保留写入时刻 Store 中的个性化设置。
 * 用于“导入导航配置”，避免使用校验阶段的旧设置快照。
 */
export const replaceNavigation = (
    categories: PanelCategory[],
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        draft.categories = clonePanelConfig(categories);
    });

export const updatePanelSettings = (
    patch: Partial<PanelSettings>,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        draft.settings = {
            glass: { ...draft.settings.glass, ...(patch.glass ?? {}) },
            backgroundUrl: patch.backgroundUrl ?? draft.settings.backgroundUrl,
            hitokotoApi: patch.hitokotoApi ?? draft.settings.hitokotoApi,
            customSearchEngine:
                patch.customSearchEngine === undefined
                    ? draft.settings.customSearchEngine
                    : patch.customSearchEngine,
            theme: patch.theme ?? draft.settings.theme,
        };
    });

interface LinkLocation {
    category: PanelCategory;
    link: PanelLink;
    index: number;
}

const findLinkLocation = (
    config: PanelConfig,
    linkId: string,
): LinkLocation | null => {
    for (const category of config.categories) {
        const index = category.links.findIndex((link) => link.id === linkId);
        if (index === -1) continue;

        const link = category.links[index];
        if (link) return { category, link, index };
    }

    return null;
};

const collectLinkIds = (config: PanelConfig): Set<string> =>
    new Set(
        config.categories.flatMap((category) =>
            category.links.map((link) => link.id),
        ),
    );

const applyLinkPatch = (link: PanelLink, patch: LinkPatch): void => {
    if (patch.name !== undefined) link.name = patch.name;
    if (patch.url !== undefined) link.url = patch.url;
    if (patch.description !== undefined) link.description = patch.description;
    if (patch.icon !== undefined) link.icon = patch.icon;
    if (patch.color !== undefined) link.color = patch.color;
    if (patch.useIcon !== undefined) link.useIcon = patch.useIcon;
    if (patch.status !== undefined) link.status = patch.status;
    if (patch.tags !== undefined) link.tags = [...patch.tags];
    if (patch.favorite !== undefined) link.favorite = patch.favorite;
    if (patch.openInNewTab !== undefined) link.openInNewTab = patch.openInNewTab;
    if (patch.visible !== undefined) link.visible = patch.visible;
};

const normalizeCategoryTitle = (value: string): string =>
    value.trim().toLowerCase();

export const addCategory = (
    input: CategoryInput,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const title = input.title.trim();
        const normalized = normalizeCategoryTitle(title);

        if (
            draft.categories.some(
                (category) =>
                    normalizeCategoryTitle(category.title) === normalized,
            )
        ) {
            throw new Error("分类名称已存在");
        }

        const usedIds = new Set(draft.categories.map((category) => category.id));
        draft.categories.push({
            id: createUserCategoryId(usedIds),
            title,
            ...(input.icon ? { icon: input.icon } : {}),
            visible: input.visible ?? true,
            links: [],
        });
    });

export const updateCategory = (
    categoryId: string,
    patch: CategoryPatch,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const category = draft.categories.find((item) => item.id === categoryId);
        if (!category) throw new Error("分类不存在");

        if (patch.title !== undefined) {
            const title = patch.title.trim();
            const normalized = normalizeCategoryTitle(title);

            if (
                draft.categories.some(
                    (item) =>
                        item.id !== categoryId &&
                        normalizeCategoryTitle(item.title) === normalized,
                )
            ) {
                throw new Error("分类名称已存在");
            }

            category.title = title;
        }

        if (patch.visible !== undefined) category.visible = patch.visible;
        if (patch.icon !== undefined) {
            if (patch.icon.trim()) category.icon = patch.icon;
            else delete category.icon;
        }
    });

export const deleteCategory = (
    categoryId: string,
    mode: CategoryDeleteMode,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const index = draft.categories.findIndex(
            (category) => category.id === categoryId,
        );
        if (index === -1) throw new Error("分类不存在");

        const category = draft.categories[index];
        if (!category) throw new Error("分类不存在");

        if (mode.mode === "move") {
            if (mode.targetCategoryId === categoryId) {
                throw new Error("不能把网站移动到正在删除的分类");
            }

            const target = draft.categories.find(
                (item) => item.id === mode.targetCategoryId,
            );
            if (!target) throw new Error("目标分类不存在");

            target.links.push(...category.links);
        }

        draft.categories.splice(index, 1);
    });

export const moveCategory = (
    categoryId: string,
    direction: -1 | 1,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const index = draft.categories.findIndex(
            (category) => category.id === categoryId,
        );
        if (index === -1) throw new Error("分类不存在");

        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= draft.categories.length) return;

        const current = draft.categories[index];
        const target = draft.categories[targetIndex];
        if (!current || !target) return;

        draft.categories[index] = target;
        draft.categories[targetIndex] = current;
    });

/**
 * 拖拽排序专用：targetIndex 是“移除源分类后”分类数组中的最终插入下标。
 * 只调整分类顺序，不修改分类内网站、ID、显隐或个性化设置。
 */
export const moveCategoryTo = (
    categoryId: string,
    targetIndex: number,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const index = draft.categories.findIndex(
            (category) => category.id === categoryId,
        );
        if (index === -1) throw new Error("分类不存在");

        const category = draft.categories[index];
        if (!category) throw new Error("分类不存在");

        draft.categories.splice(index, 1);
        const insertAt = Math.max(
            0,
            Math.min(Math.trunc(targetIndex), draft.categories.length),
        );
        draft.categories.splice(insertAt, 0, category);
    });

export const addLink = (
    categoryId: string,
    input: LinkInput,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const category = draft.categories.find((item) => item.id === categoryId);
        if (!category) throw new Error("分类不存在");

        const usedIds = collectLinkIds(draft);
        category.links.push({
            id: createUserLinkId(usedIds),
            name: input.name,
            url: input.url,
            description: input.description ?? "",
            icon: input.icon ?? "fas fa-link",
            color: input.color ?? "#ffffff",
            useIcon: input.useIcon ?? true,
            status: input.status ?? true,
            tags: [...(input.tags ?? [])],
            favorite: input.favorite ?? false,
            openInNewTab: input.openInNewTab ?? true,
            visible: input.visible ?? true,
        });
    });

export const updateLink = (
    linkId: string,
    patch: LinkPatch,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const location = findLinkLocation(draft, linkId);
        if (!location) throw new Error("网站不存在");

        applyLinkPatch(location.link, patch);

        if (
            patch.categoryId !== undefined &&
            patch.categoryId !== location.category.id
        ) {
            const target = draft.categories.find(
                (category) => category.id === patch.categoryId,
            );
            if (!target) throw new Error("目标分类不存在");

            location.category.links.splice(location.index, 1);
            target.links.push(location.link);
        }
    });

export const deleteLink = (linkId: string): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const location = findLinkLocation(draft, linkId);
        if (!location) throw new Error("网站不存在");

        location.category.links.splice(location.index, 1);
    });

export const moveLink = (
    linkId: string,
    targetCategoryId: string,
    targetIndex: number,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const location = findLinkLocation(draft, linkId);
        if (!location) throw new Error("网站不存在");

        const target = draft.categories.find(
            (category) => category.id === targetCategoryId,
        );
        if (!target) throw new Error("目标分类不存在");

        if (target.id === location.category.id) {
            location.category.links.splice(location.index, 1);
            const adjusted =
                location.index < targetIndex ? targetIndex - 1 : targetIndex;
            const insertAt = Math.max(
                0,
                Math.min(adjusted, target.links.length),
            );
            target.links.splice(insertAt, 0, location.link);
            return;
        }

        location.category.links.splice(location.index, 1);
        const insertAt = Math.max(0, Math.min(targetIndex, target.links.length));
        target.links.splice(insertAt, 0, location.link);
    });

/**
 * 拖拽排序专用：targetIndex 是“移除源网站后”目标分类数组中的最终插入下标。
 * 跨分类时目标数组未受移除影响；同分类时调用方需按最终数组计算。
 */
export const moveLinkTo = (
    linkId: string,
    targetCategoryId: string,
    targetIndex: number,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const location = findLinkLocation(draft, linkId);
        if (!location) throw new Error("网站不存在");

        const target = draft.categories.find(
            (category) => category.id === targetCategoryId,
        );
        if (!target) throw new Error("目标分类不存在");

        location.category.links.splice(location.index, 1);
        const insertAt = Math.max(
            0,
            Math.min(Math.trunc(targetIndex), target.links.length),
        );
        target.links.splice(insertAt, 0, location.link);
    });

export const moveLinkBy = (
    linkId: string,
    direction: -1 | 1,
): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        const location = findLinkLocation(draft, linkId);
        if (!location) throw new Error("网站不存在");

        const targetIndex = location.index + direction;
        if (targetIndex < 0 || targetIndex >= location.category.links.length) {
            return;
        }

        const current = location.category.links[location.index];
        const target = location.category.links[targetIndex];
        if (!current || !target) return;

        location.category.links[location.index] = target;
        location.category.links[targetIndex] = current;
    });

export const resetNavigation = (): StoreResult<PanelConfig> =>
    updatePanelConfig((draft) => {
        draft.categories = createDefaultPanelConfig(draft.settings).categories;
    });

export const resetAllSettings = (): StoreResult<PanelConfig> =>
    replacePanelConfig(createDefaultPanelConfig());
