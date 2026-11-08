import { closeSettingsPanel } from "../settings";
import { showToast } from "../toast";
import { openCategoryDelete } from "./category-delete";
import { openCategoryEditor } from "./category-editor";
import { isConfirmDialogOpen } from "./confirm";
import { isValidIconClass, normalizeIconClass } from "./icon";
import {
    getPanelConfig,
    moveCategory,
    subscribePanelConfig,
} from "./store";

interface CategoryManagerElements {
    modal: HTMLElement;
    overlay: HTMLElement;
    close: HTMLButtonElement;
    list: HTMLElement;
    empty: HTMLElement;
    add: HTMLButtonElement;
    done: HTMLButtonElement;
}

let initialized = false;
let isOpen = false;
let elements: CategoryManagerElements | null = null;
let lastFocused: HTMLElement | null = null;

const getElement = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

const getElements = (): CategoryManagerElements | null => {
    const modal = getElement<HTMLElement>("category-manager-modal");
    const overlay = getElement<HTMLElement>("category-manager-overlay");
    const close = getElement<HTMLButtonElement>("category-manager-close");
    const list = getElement<HTMLElement>("category-manager-list");
    const empty = getElement<HTMLElement>("category-manager-empty");
    const add = getElement<HTMLButtonElement>("category-manager-add");
    const done = getElement<HTMLButtonElement>("category-manager-done");

    if (!modal || !overlay || !close || !list || !empty || !add || !done) {
        return null;
    }

    return { modal, overlay, close, list, empty, add, done };
};

const renderCategoryList = (): void => {
    if (!elements) return;

    const config = getPanelConfig();
    const categories = config.categories;

    elements.list.replaceChildren();
    elements.list.classList.toggle("hidden", categories.length === 0);
    elements.empty.classList.toggle("hidden", categories.length > 0);

    categories.forEach((category, index) => {
        const row = document.createElement("div");
        row.className = "category-manager-row";
        row.setAttribute("role", "listitem");

        const iconWrap = document.createElement("span");
        iconWrap.className = "category-manager-icon";
        const icon = document.createElement("i");
        icon.className =
            category.icon && isValidIconClass(category.icon)
                ? normalizeIconClass(category.icon)
                : "fas fa-folder";
        icon.setAttribute("aria-hidden", "true");
        iconWrap.appendChild(icon);

        const main = document.createElement("div");
        main.className = "category-manager-main";

        const title = document.createElement("div");
        title.className = "category-manager-title";
        title.textContent = category.title;

        const meta = document.createElement("div");
        meta.className = "category-manager-meta";

        const count = document.createElement("span");
        count.textContent = `${category.links.length} 个网站`;

        const status = document.createElement("span");
        const visible = category.visible !== false;
        status.className = `category-status-badge ${
            visible ? "is-visible" : "is-hidden"
        }`;
        status.textContent = visible ? "显示中" : "已隐藏";

        meta.append(count, status);
        main.append(title, meta);

        const actions = document.createElement("div");
        actions.className = "category-manager-row-actions";

        const upButton = document.createElement("button");
        upButton.type = "button";
        upButton.className = "category-manager-action";
        upButton.dataset.categoryAction = "up";
        upButton.dataset.categoryId = category.id;
        upButton.disabled = index === 0;
        upButton.setAttribute("aria-label", `上移分类 ${category.title}`);
        upButton.title = "上移分类";
        const upIcon = document.createElement("i");
        upIcon.className = "fas fa-arrow-up";
        upIcon.setAttribute("aria-hidden", "true");
        upButton.appendChild(upIcon);

        const downButton = document.createElement("button");
        downButton.type = "button";
        downButton.className = "category-manager-action";
        downButton.dataset.categoryAction = "down";
        downButton.dataset.categoryId = category.id;
        downButton.disabled = index === categories.length - 1;
        downButton.setAttribute("aria-label", `下移分类 ${category.title}`);
        downButton.title = "下移分类";
        const downIcon = document.createElement("i");
        downIcon.className = "fas fa-arrow-down";
        downIcon.setAttribute("aria-hidden", "true");
        downButton.appendChild(downIcon);

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "category-manager-action";
        editButton.dataset.categoryAction = "edit";
        editButton.dataset.categoryId = category.id;
        editButton.setAttribute("aria-label", `编辑分类 ${category.title}`);
        editButton.title = "编辑分类";
        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-pen";
        editIcon.setAttribute("aria-hidden", "true");
        editButton.appendChild(editIcon);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className =
            "category-manager-action category-manager-action-danger";
        deleteButton.dataset.categoryAction = "delete";
        deleteButton.dataset.categoryId = category.id;
        deleteButton.setAttribute("aria-label", `删除分类 ${category.title}`);
        deleteButton.title = "删除分类";
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.setAttribute("aria-hidden", "true");
        deleteButton.appendChild(deleteIcon);

        actions.append(upButton, downButton, editButton, deleteButton);
        row.append(iconWrap, main, actions);
        elements?.list.appendChild(row);
    });
};

export const openCategoryManager = (): void => {
    if (!initialized) initCategoryManager();
    if (!elements) return;

    closeSettingsPanel();
    renderCategoryList();

    lastFocused =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    elements.modal.classList.remove("hidden");
    elements.modal.setAttribute("aria-hidden", "false");
    isOpen = true;
    window.setTimeout(() => elements?.add.focus(), 0);
};

const closeCategoryManager = (restoreFocus = true): void => {
    if (!elements || !isOpen) return;

    isOpen = false;
    elements.modal.classList.add("hidden");
    elements.modal.setAttribute("aria-hidden", "true");

    if (restoreFocus) lastFocused?.focus();
    lastFocused = null;
};

const handleListClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;

    const actionElement = event.target.closest<HTMLElement>(
        "[data-category-action]",
    );
    if (!actionElement) return;

    const action = actionElement.dataset.categoryAction;
    const categoryId = actionElement.dataset.categoryId;
    if (!categoryId) return;

    event.preventDefault();
    event.stopPropagation();

    if (action === "up" || action === "down") {
        const result = moveCategory(
            categoryId,
            action === "up" ? -1 : 1,
        );
        if (!result.ok) {
            showToast(result.message, "error", 5000);
        }
        return;
    }

    if (action === "edit") {
        closeCategoryManager(false);
        openCategoryEditor({
            mode: "edit",
            categoryId,
            onClosed: () => openCategoryManager(),
        });
        return;
    }

    if (action === "delete") {
        closeCategoryManager(false);
        openCategoryDelete(categoryId, {
            onClosed: () => openCategoryManager(),
        });
    }
};

export const initCategoryManager = (): void => {
    if (initialized || typeof document === "undefined") return;

    const found = getElements();
    if (!found) return;

    elements = found;
    initialized = true;

    elements.close.addEventListener("click", () => closeCategoryManager());
    elements.done.addEventListener("click", () => closeCategoryManager());
    elements.overlay.addEventListener("click", () => closeCategoryManager());
    elements.list.addEventListener("click", handleListClick);

    elements.add.addEventListener("click", () => {
        closeCategoryManager(false);
        openCategoryEditor({
            mode: "add",
            onClosed: () => openCategoryManager(),
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !isOpen) return;
        if (isConfirmDialogOpen()) return;
        event.preventDefault();
        event.stopPropagation();
        closeCategoryManager();
    });

    subscribePanelConfig((_config, change) => {
        if (isOpen && change.categoriesChanged) {
            renderCategoryList();
        }
    });
};
