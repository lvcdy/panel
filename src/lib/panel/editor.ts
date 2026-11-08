import { closeSettingsPanel } from "../settings";
import { showToast } from "../toast";
import { openCategoryDelete } from "./category-delete";
import { openCategoryEditor } from "./category-editor";
import { openCategoryManager } from "./category-manager";
import { openConfirmDialog } from "./confirm";
import { closeSiteEditor, openSiteEditor } from "./site-editor";
import {
    deleteLink,
    getPanelConfig,
    moveLinkBy,
} from "./store";
import { isNavigationEditMode, setNavigationEditMode } from "./view";

let initialized = false;
let toolbar: HTMLElement | null = null;

const setToolbarVisible = (visible: boolean): void => {
    toolbar?.classList.toggle("hidden", !visible);
    toolbar?.setAttribute("aria-hidden", String(!visible));
    document.body.classList.toggle("panel-edit-mode", visible);
};

const getSearchQuery = (): string =>
    (document.getElementById("searchInput") as HTMLInputElement | null)?.value.trim() ??
    "";

const enterEditMode = (): void => {
    closeSettingsPanel();

    if (isNavigationEditMode()) return;

    closeSiteEditor(false);

    const searchInput = document.getElementById(
        "searchInput",
    ) as HTMLInputElement | null;
    const hadSearch = Boolean(searchInput?.value.trim());
    if (searchInput && hadSearch) searchInput.value = "";

    setNavigationEditMode(true);
    setToolbarVisible(true);
    showToast(
        hadSearch ? "已清除搜索过滤并进入编辑模式" : "已进入编辑模式",
        "info",
        2400,
    );
};

const exitEditMode = (): void => {
    if (!isNavigationEditMode()) {
        setToolbarVisible(false);
        return;
    }

    closeSiteEditor(false);
    setNavigationEditMode(false);
    setToolbarVisible(false);
    showToast("已退出编辑模式", "success", 2200);
};

const findLinkName = (linkId: string): { name: string; category: string } | null => {
    const config = getPanelConfig();

    for (const category of config.categories) {
        const link = category.links.find((item) => item.id === linkId);
        if (link) return { name: link.name, category: category.title };
    }

    return null;
};

const deleteLinkWithConfirm = async (linkId: string): Promise<void> => {
    const found = findLinkName(linkId);
    if (!found) {
        showToast("网站不存在，可能已在其他标签页删除", "error");
        return;
    }

    const confirmed = await openConfirmDialog({
        title: "删除网站",
        message: "确定删除这个网站吗？删除后将从导航中移除。",
        details: [
            { label: "网站", value: found.name },
            { label: "分类", value: found.category },
        ],
        confirmLabel: "删除",
        danger: true,
    });

    if (!confirmed) return;

    const result = deleteLink(linkId);
    if (!result.ok) {
        showToast(result.message, "error", 5000);
        return;
    }

    showToast("网站已删除", "success");
};

const addSiteFromToolbar = (): void => {
    const config = getPanelConfig();
    const category =
        config.categories.find((item) => item.visible !== false) ??
        config.categories[0];

    if (!category) {
        showToast("当前没有分类，无法添加网站", "error");
        return;
    }

    openSiteEditor({ mode: "add", categoryId: category.id });
};

const handleGridClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    if (!isNavigationEditMode()) return;

    const actionElement = event.target.closest<HTMLElement>("[data-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.action;

    if (action === "edit-link") {
        event.preventDefault();
        event.stopPropagation();
        const linkId = actionElement.dataset.linkId;
        if (linkId) openSiteEditor({ mode: "edit", linkId });
        return;
    }

    if (action === "move-link-up" || action === "move-link-down") {
        event.preventDefault();
        event.stopPropagation();

        if (getSearchQuery()) {
            showToast("请先清除搜索过滤再排序", "info", 3000);
            return;
        }

        const linkId = actionElement.dataset.linkId;
        if (!linkId) return;

        const result = moveLinkBy(
            linkId,
            action === "move-link-up" ? -1 : 1,
        );
        if (!result.ok) {
            showToast(result.message, "error", 5000);
        }
        return;
    }

    if (action === "delete-link") {
        event.preventDefault();
        event.stopPropagation();
        const linkId = actionElement.dataset.linkId;
        if (linkId) void deleteLinkWithConfirm(linkId);
        return;
    }

    if (action === "add-link") {
        event.preventDefault();
        event.stopPropagation();
        const categoryId = actionElement.dataset.categoryId;
        if (categoryId) openSiteEditor({ mode: "add", categoryId });
        return;
    }

    if (action === "edit-category") {
        event.preventDefault();
        event.stopPropagation();
        const categoryId = actionElement.dataset.categoryId;
        if (categoryId) openCategoryEditor({ mode: "edit", categoryId });
        return;
    }

    if (action === "delete-category") {
        event.preventDefault();
        event.stopPropagation();
        const categoryId = actionElement.dataset.categoryId;
        if (categoryId) openCategoryDelete(categoryId);
    }
};

export const initNavigationEditor = (): void => {
    if (initialized || typeof document === "undefined") return;

    const grid = document.getElementById("linkGrid");
    toolbar = document.getElementById("panel-edit-toolbar");

    if (!grid || !toolbar) return;

    initialized = true;

    const openButton = document.getElementById("open-edit-mode-btn");
    const addButton = document.getElementById("panel-add-site-btn");
    const manageButton = document.getElementById("panel-manage-categories-btn");
    const exitButton = document.getElementById("panel-exit-edit-btn");

    openButton?.addEventListener("click", enterEditMode);
    addButton?.addEventListener("click", addSiteFromToolbar);
    manageButton?.addEventListener("click", () => openCategoryManager());
    exitButton?.addEventListener("click", exitEditMode);
    grid.addEventListener("click", handleGridClick);

    setToolbarVisible(false);
};
