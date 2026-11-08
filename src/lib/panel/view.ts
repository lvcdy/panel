import { initLinkIconFallback, revealAllSections } from "../../init/page-effects";
import { SELECTOR_LINK_GRID_CONTENT } from "../config";
import { filterLinks, resetSearchCaches, showAllIcons } from "../search-filter";
import { setupSiteStatusBadges } from "../site-status";
import { renderNavigationHtml } from "./render";
import {
    getPanelConfig,
    subscribePanelConfig,
    wasPanelConfigStored,
} from "./store";

interface RenderNavigationOptions {
    captureCollapsed?: boolean;
}

let initialized = false;
let editMode = false;
let collapsedCategoryIds = new Set<string>();

const getContent = (): HTMLElement | null =>
    document.querySelector<HTMLElement>(SELECTOR_LINK_GRID_CONTENT);

const getSearchQuery = (): string =>
    (document.getElementById("searchInput") as HTMLInputElement | null)?.value.trim() ??
    "";

const captureCollapsedCategoryIds = (): Set<string> => {
    const ids = new Set<string>();

    document
        .querySelectorAll<HTMLElement>('[data-category-id][data-collapsed="true"]')
        .forEach((element) => {
            const id = element.dataset.categoryId;
            if (id) ids.add(id);
        });

    return ids;
};

/**
 * 用 Panel Store 中的数据重建导航。
 * 重渲染后统一刷新搜索缓存、折叠、图标降级、状态检测与揭示状态。
 */
export const renderPanelNavigation = (
    options: RenderNavigationOptions = {},
): void => {
    const content = getContent();
    if (!content) {
        document.documentElement.removeAttribute("data-panel-config-pending");
        return;
    }

    const shouldCapture = options.captureCollapsed ?? true;
    if (!editMode && shouldCapture) {
        collapsedCategoryIds = captureCollapsedCategoryIds();
    }

    const config = getPanelConfig();
    content.innerHTML = renderNavigationHtml(config, {
        editMode,
        collapsedCategoryIds,
        animated: false,
        categoryManagement: editMode,
        sorting: editMode,
    });

    resetSearchCaches();
    revealAllSections();
    initLinkIconFallback();
    setupSiteStatusBadges();

    const query = getSearchQuery();
    if (query) {
        filterLinks(query);
    } else {
        showAllIcons();
    }

    document.documentElement.removeAttribute("data-panel-config-pending");
};

export const initNavigationView = (): void => {
    if (initialized) return;
    initialized = true;

    subscribePanelConfig((_config, change) => {
        if (change.categoriesChanged) {
            renderPanelNavigation();
        }
    });

    if (wasPanelConfigStored()) {
        renderPanelNavigation({ captureCollapsed: false });
    } else {
        document.documentElement.removeAttribute("data-panel-config-pending");
    }
};

export const setNavigationEditMode = (value: boolean): void => {
    if (editMode === value) return;

    if (value) {
        collapsedCategoryIds = captureCollapsedCategoryIds();
    }

    editMode = value;
    renderPanelNavigation({ captureCollapsed: false });
};

export const isNavigationEditMode = (): boolean => editMode;
