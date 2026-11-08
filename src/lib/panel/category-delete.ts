import { showToast } from "../toast";
import { isConfirmDialogOpen, openConfirmDialog } from "./confirm";
import { deleteCategory, getPanelConfig, subscribePanelConfig } from "./store";
import type { PanelCategory } from "./types";

interface CategoryDeleteElements {
    modal: HTMLElement;
    overlay: HTMLElement;
    close: HTMLButtonElement;
    message: HTMLElement;
    name: HTMLElement;
    count: HTMLElement;
    links: HTMLUListElement;
    moveRadio: HTMLInputElement;
    allRadio: HTMLInputElement;
    moveOption: HTMLElement;
    allOption: HTMLElement;
    target: HTMLSelectElement;
    moveHint: HTMLElement;
    warning: HTMLElement;
    allCount: HTMLElement;
    error: HTMLElement;
    cancel: HTMLButtonElement;
    confirm: HTMLButtonElement;
}

export interface OpenCategoryDeleteOptions {
    onClosed?: () => void;
}

let initialized = false;
let isOpen = false;
let elements: CategoryDeleteElements | null = null;
let currentCategoryId: string | null = null;
let onClosed: (() => void) | null = null;
let lastFocused: HTMLElement | null = null;

const getElement = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

const getElements = (): CategoryDeleteElements | null => {
    const modal = getElement<HTMLElement>("category-delete-modal");
    const overlay = getElement<HTMLElement>("category-delete-overlay");
    const close = getElement<HTMLButtonElement>("category-delete-close");
    const message = getElement<HTMLElement>("category-delete-message");
    const name = getElement<HTMLElement>("category-delete-name");
    const count = getElement<HTMLElement>("category-delete-count");
    const links = getElement<HTMLUListElement>("category-delete-links");
    const moveRadio = getElement<HTMLInputElement>("category-delete-move-radio");
    const allRadio = getElement<HTMLInputElement>("category-delete-all-radio");
    const moveOption = getElement<HTMLElement>("category-delete-move-option");
    const allOption = getElement<HTMLElement>("category-delete-all-option");
    const target = getElement<HTMLSelectElement>("category-delete-target");
    const moveHint = getElement<HTMLElement>("category-delete-move-hint");
    const warning = getElement<HTMLElement>("category-delete-warning");
    const allCount = getElement<HTMLElement>("category-delete-all-count");
    const error = getElement<HTMLElement>("category-delete-error");
    const cancel = getElement<HTMLButtonElement>("category-delete-cancel");
    const confirm = getElement<HTMLButtonElement>("category-delete-confirm");

    if (
        !modal ||
        !overlay ||
        !close ||
        !message ||
        !name ||
        !count ||
        !links ||
        !moveRadio ||
        !allRadio ||
        !moveOption ||
        !allOption ||
        !target ||
        !moveHint ||
        !warning ||
        !allCount ||
        !error ||
        !cancel ||
        !confirm
    ) {
        return null;
    }

    return {
        modal,
        overlay,
        close,
        message,
        name,
        count,
        links,
        moveRadio,
        allRadio,
        moveOption,
        allOption,
        target,
        moveHint,
        warning,
        allCount,
        error,
        cancel,
        confirm,
    };
};

const setError = (message: string): void => {
    if (elements) elements.error.textContent = message;
};

const clearError = (): void => {
    setError("");
};

const updateUi = (): void => {
    if (!elements) return;

    const moveMode = elements.moveRadio.checked && !elements.moveRadio.disabled;

    elements.moveOption.classList.toggle("is-selected", moveMode);
    elements.allOption.classList.toggle("is-selected", !moveMode);
    elements.target.disabled = !moveMode;
    elements.target.classList.toggle("is-disabled", !moveMode);
    elements.warning.classList.toggle("hidden", moveMode);

    elements.confirm.textContent = moveMode
        ? "移动并删除"
        : "删除分类及网站";
    elements.confirm.classList.toggle("panel-btn-danger", !moveMode);
    elements.confirm.classList.toggle("panel-btn-primary", moveMode);

    clearError();
};

const hideModal = (restoreFocus: boolean): void => {
    if (!elements) return;

    isOpen = false;
    currentCategoryId = null;
    elements.modal.classList.add("hidden");
    elements.modal.setAttribute("aria-hidden", "true");
    clearError();

    if (restoreFocus) lastFocused?.focus();
    lastFocused = null;
};

const closeAndNotify = (restoreFocus = true): void => {
    const callback = onClosed;
    onClosed = null;
    hideModal(restoreFocus);
    callback?.();
};

const populateLinks = (category: PanelCategory): void => {
    if (!elements) return;

    elements.links.replaceChildren();

    category.links.forEach((link) => {
        const item = document.createElement("li");
        item.className = "category-delete-link-item";

        const name = document.createElement("span");
        name.className = "category-delete-link-name";
        name.textContent = link.name;

        const url = document.createElement("span");
        url.className = "category-delete-link-url";
        url.textContent = link.url;

        item.append(name, url);
        elements?.links.appendChild(item);
    });
};

const populateTargets = (
    targets: readonly PanelCategory[],
    selectedId: string,
): void => {
    if (!elements) return;

    elements.target.replaceChildren();

    targets.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent =
            category.visible === false
                ? `${category.title}（已隐藏）`
                : category.title;
        elements?.target.appendChild(option);
    });

    if (targets.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "没有其他可用分类";
        option.disabled = true;
        elements.target.appendChild(option);
        elements.target.disabled = true;
        elements.moveRadio.disabled = true;
        elements.moveOption.classList.add("is-disabled");
        elements.allRadio.checked = true;
    } else {
        elements.moveRadio.disabled = false;
        elements.moveRadio.checked = true;
        elements.allRadio.checked = false;
        elements.moveOption.classList.remove("is-disabled");
        elements.target.value = selectedId;
        elements.target.disabled = false;
    }
};

const deleteEmptyCategory = async (
    category: PanelCategory,
    callback: (() => void) | undefined,
): Promise<void> => {
    const confirmed = await openConfirmDialog({
        title: "删除分类",
        message: "确定删除这个分类吗？该分类内没有网站。",
        details: [{ label: "分类名称", value: category.title }],
        confirmLabel: "删除",
        danger: true,
    });

    if (!confirmed) {
        callback?.();
        return;
    }

    const result = deleteCategory(category.id, { mode: "delete" });

    if (!result.ok) {
        showToast(result.message, "error", 5000);
        callback?.();
        return;
    }

    showToast("分类已删除", "success");
    callback?.();
};

export const openCategoryDelete = (
    categoryId: string,
    options: OpenCategoryDeleteOptions = {},
): void => {
    if (!initialized) initCategoryDelete();

    const config = getPanelConfig();
    const category = config.categories.find((item) => item.id === categoryId);

    if (!category) {
        showToast("分类不存在，可能已在其他标签页删除", "error");
        options.onClosed?.();
        return;
    }

    if (category.links.length === 0) {
        void deleteEmptyCategory(category, options.onClosed);
        return;
    }

    if (!elements) return;

    const targets = config.categories.filter((item) => item.id !== category.id);
    const count = category.links.length;

    clearError();
    currentCategoryId = category.id;
    onClosed = options.onClosed ?? null;

    elements.message.textContent = `该分类内还有 ${count} 个网站，请选择处理方式。`;
    elements.name.textContent = category.title;
    elements.count.textContent = `${count} 个`;
    elements.allCount.textContent = String(count);
    elements.moveHint.textContent =
        targets.length > 0
            ? "网站会按原顺序追加到目标分类。"
            : "没有其他分类可以接收这些网站，只能一并删除。";

    populateLinks(category);
    populateTargets(targets, targets[0]?.id ?? "");
    updateUi();

    lastFocused =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    elements.modal.classList.remove("hidden");
    elements.modal.setAttribute("aria-hidden", "false");
    isOpen = true;
    window.setTimeout(() => elements?.cancel.focus(), 0);
};

const handleConfirm = async (): Promise<void> => {
    if (!elements || !isOpen || !currentCategoryId) return;

    clearError();

    const config = getPanelConfig();
    const category = config.categories.find(
        (item) => item.id === currentCategoryId,
    );

    if (!category) {
        setError("分类不存在，可能已在其他标签页删除");
        closeAndNotify(false);
        return;
    }

    const count = category.links.length;

    if (elements.moveRadio.checked && !elements.moveRadio.disabled) {
        const targetId = elements.target.value;
        const target = config.categories.find(
            (item) => item.id === targetId && item.id !== category.id,
        );

        if (!target) {
            setError("请选择有效的目标分类");
            return;
        }

        const result = deleteCategory(category.id, {
            mode: "move",
            targetCategoryId: target.id,
        });

        if (!result.ok) {
            const detail = result.details?.[0];
            setError(detail ? `${result.message}：${detail}` : result.message);
            showToast(result.message, "error", 5000);
            return;
        }

        closeAndNotify(false);
        showToast(
            `已移动 ${count} 个网站到“${target.title}”并删除分类`,
            "success",
            4200,
        );
        return;
    }

    const confirmed = await openConfirmDialog({
        title: "确认删除分类及网站",
        message: `确定删除“${category.title}”及其中 ${count} 个网站吗？此操作无法自动撤销。`,
        confirmLabel: "全部删除",
        danger: true,
    });

    if (!confirmed) return;

    const result = deleteCategory(category.id, { mode: "delete" });

    if (!result.ok) {
        const detail = result.details?.[0];
        setError(detail ? `${result.message}：${detail}` : result.message);
        showToast(result.message, "error", 5000);
        return;
    }

    closeAndNotify(false);
    showToast(`已删除分类及 ${count} 个网站`, "success", 4200);
};

export const initCategoryDelete = (): void => {
    if (initialized || typeof document === "undefined") return;

    const found = getElements();
    if (!found) return;

    elements = found;
    initialized = true;

    elements.cancel.addEventListener("click", () => closeAndNotify());
    elements.close.addEventListener("click", () => closeAndNotify());
    elements.overlay.addEventListener("click", () => closeAndNotify());
    elements.moveRadio.addEventListener("change", updateUi);
    elements.allRadio.addEventListener("change", updateUi);
    elements.target.addEventListener("change", clearError);
    elements.confirm.addEventListener("click", () => {
        void handleConfirm();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !isOpen) return;
        if (isConfirmDialogOpen()) return;
        event.preventDefault();
        event.stopPropagation();
        closeAndNotify();
    });

    subscribePanelConfig((_config, change) => {
        if (isOpen && change.source === "remote" && change.categoriesChanged) {
            closeAndNotify(false);
            showToast(
                "配置已在其他标签页更新，请重新操作",
                "info",
                4000,
            );
        }
    });
};
