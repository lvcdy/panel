import { showToast } from "../toast";
import { isConfirmDialogOpen } from "./confirm";
import { isValidIconClass, normalizeIconClass } from "./icon";
import {
    addCategory,
    getPanelConfig,
    subscribePanelConfig,
    updateCategory,
} from "./store";
import type { PanelConfig } from "./types";

interface CategoryEditorElements {
    modal: HTMLElement;
    overlay: HTMLElement;
    close: HTMLButtonElement;
    form: HTMLFormElement;
    idInput: HTMLInputElement;
    title: HTMLHeadingElement;
    nameInput: HTMLInputElement;
    nameError: HTMLElement;
    iconInput: HTMLInputElement;
    iconError: HTMLElement;
    previewIcon: HTMLElement;
    visibleInput: HTMLInputElement;
    formError: HTMLElement;
    cancel: HTMLButtonElement;
    save: HTMLButtonElement;
}

export interface OpenCategoryEditorOptions {
    mode: "add" | "edit";
    categoryId?: string;
    onClosed?: () => void;
}

let initialized = false;
let isOpen = false;
let elements: CategoryEditorElements | null = null;
let mode: "add" | "edit" = "add";
let editingCategoryId: string | null = null;
let onClosed: (() => void) | null = null;
let lastFocused: HTMLElement | null = null;

const getElement = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

const getElements = (): CategoryEditorElements | null => {
    const modal = getElement<HTMLElement>("category-editor-modal");
    const overlay = getElement<HTMLElement>("category-editor-overlay");
    const close = getElement<HTMLButtonElement>("category-editor-close");
    const form = getElement<HTMLFormElement>("category-editor-form");
    const idInput = getElement<HTMLInputElement>("category-editor-id");
    const title = getElement<HTMLHeadingElement>("category-editor-title");
    const nameInput = getElement<HTMLInputElement>("category-name-input");
    const nameError = getElement<HTMLElement>("category-name-error");
    const iconInput = getElement<HTMLInputElement>("category-icon-input");
    const iconError = getElement<HTMLElement>("category-icon-error");
    const previewIcon = getElement<HTMLElement>("category-icon-preview-i");
    const visibleInput = getElement<HTMLInputElement>("category-visible-input");
    const formError = getElement<HTMLElement>("category-form-error");
    const cancel = getElement<HTMLButtonElement>("category-editor-cancel");
    const save = getElement<HTMLButtonElement>("category-editor-save");

    if (
        !modal ||
        !overlay ||
        !close ||
        !form ||
        !idInput ||
        !title ||
        !nameInput ||
        !nameError ||
        !iconInput ||
        !iconError ||
        !previewIcon ||
        !visibleInput ||
        !formError ||
        !cancel ||
        !save
    ) {
        return null;
    }

    return {
        modal,
        overlay,
        close,
        form,
        idInput,
        title,
        nameInput,
        nameError,
        iconInput,
        iconError,
        previewIcon,
        visibleInput,
        formError,
        cancel,
        save,
    };
};

const setFieldError = (
    errorElement: HTMLElement,
    input: HTMLElement | null,
    message: string,
): void => {
    errorElement.textContent = message;
    if (input) {
        if (message) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
    }
};

const clearAllErrors = (): void => {
    if (!elements) return;
    setFieldError(elements.nameError, elements.nameInput, "");
    setFieldError(elements.iconError, elements.iconInput, "");
    elements.formError.textContent = "";
};

const updatePreview = (): void => {
    if (!elements) return;

    const value = normalizeIconClass(elements.iconInput.value);

    if (value && isValidIconClass(value)) {
        elements.previewIcon.className = value;
        elements.previewIcon.style.opacity = "1";
    } else {
        elements.previewIcon.className = "fas fa-folder";
        elements.previewIcon.style.opacity = "0.35";
    }
};

const hideEditor = (restoreFocus: boolean): void => {
    if (!elements) return;

    isOpen = false;
    mode = "add";
    editingCategoryId = null;
    elements.modal.classList.add("hidden");
    elements.modal.setAttribute("aria-hidden", "true");
    clearAllErrors();

    if (restoreFocus) lastFocused?.focus();
    lastFocused = null;
};

const closeAndNotify = (restoreFocus = true): void => {
    const callback = onClosed;
    onClosed = null;
    hideEditor(restoreFocus);
    callback?.();
};

const validateForm = (
    config: PanelConfig,
): { title: string; icon: string; visible: boolean } | null => {
    if (!elements) return null;

    clearAllErrors();

    let firstInvalid: HTMLElement | null = null;
    const invalidate = (
        errorElement: HTMLElement,
        input: HTMLElement,
        message: string,
    ) => {
        setFieldError(errorElement, input, message);
        if (!firstInvalid) firstInvalid = input;
    };

    const title = elements.nameInput.value.trim();
    if (!title) {
        invalidate(elements.nameError, elements.nameInput, "请输入分类名称");
    } else if (title.length > 60) {
        invalidate(
            elements.nameError,
            elements.nameInput,
            "分类名称不能超过 60 个字符",
        );
    } else if (
        config.categories.some(
            (category) =>
                category.id !== editingCategoryId &&
                category.title.trim().toLowerCase() === title.toLowerCase(),
        )
    ) {
        invalidate(
            elements.nameError,
            elements.nameInput,
            "分类名称已存在",
        );
    }

    const icon = normalizeIconClass(elements.iconInput.value);
    if (icon && !isValidIconClass(icon)) {
        invalidate(
            elements.iconError,
            elements.iconInput,
            "请输入 Font Awesome 类名，例如 fas fa-folder",
        );
    }

    if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
        return null;
    }

    return {
        title,
        icon,
        visible: elements.visibleInput.checked,
    };
};

const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!elements || !isOpen) return;

    const config = getPanelConfig();
    const parsed = validateForm(config);
    if (!parsed) return;

    elements.save.disabled = true;

    try {
        const result =
            mode === "edit" && editingCategoryId
                ? updateCategory(editingCategoryId, parsed)
                : addCategory(parsed);

        if (!result.ok) {
            const detail = result.details?.[0];
            elements.formError.textContent = detail
                ? `${result.message}：${detail}`
                : result.message;
            showToast(result.message, "error", 5000);
            return;
        }

        const wasEditing = mode === "edit";
        closeAndNotify(false);
        showToast(wasEditing ? "分类已更新" : "分类已新增", "success");
    } finally {
        if (elements) elements.save.disabled = false;
    }
};

export const openCategoryEditor = (
    options: OpenCategoryEditorOptions,
): void => {
    if (!initialized) initCategoryEditor();
    if (!elements) return;

    const config = getPanelConfig();
    const category =
        options.mode === "edit" && options.categoryId
            ? config.categories.find((item) => item.id === options.categoryId)
            : null;

    if (options.mode === "edit" && !category) {
        showToast("分类不存在，可能已在其他标签页删除", "error");
        options.onClosed?.();
        return;
    }

    clearAllErrors();
    mode = options.mode;
    editingCategoryId = category?.id ?? null;
    onClosed = options.onClosed ?? null;

    if (mode === "edit" && category) {
        elements.title.textContent = "编辑分类";
        elements.save.textContent = "保存";
        elements.idInput.value = category.id;
        elements.nameInput.value = category.title;
        elements.iconInput.value = category.icon ?? "";
        elements.visibleInput.checked = category.visible !== false;
    } else {
        elements.title.textContent = "新增分类";
        elements.save.textContent = "新增";
        elements.idInput.value = "";
        elements.nameInput.value = "";
        elements.iconInput.value = "";
        elements.visibleInput.checked = true;
    }

    lastFocused =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    elements.modal.classList.remove("hidden");
    elements.modal.setAttribute("aria-hidden", "false");
    isOpen = true;
    updatePreview();
    window.setTimeout(() => elements?.nameInput.focus(), 0);
};

export const initCategoryEditor = (): void => {
    if (initialized || typeof document === "undefined") return;

    const found = getElements();
    if (!found) return;

    elements = found;
    initialized = true;

    elements.form.addEventListener("submit", handleSubmit);
    elements.cancel.addEventListener("click", () => closeAndNotify());
    elements.close.addEventListener("click", () => closeAndNotify());
    elements.overlay.addEventListener("click", () => closeAndNotify());

    document.addEventListener("keydown", (event) => {
        if (event.defaultPrevented) return;
        if (event.key === "Escape" && isOpen && !isConfirmDialogOpen()) {
            event.preventDefault();
            event.stopPropagation();
            closeAndNotify();
        }
    });

    elements.iconInput.addEventListener("input", updatePreview);

    elements.iconInput.addEventListener("blur", () => {
        if (!elements) return;
        const value = normalizeIconClass(elements.iconInput.value);

        if (value) {
            elements.iconInput.value = value;
        }

        if (value && !isValidIconClass(value)) {
            setFieldError(
                elements.iconError,
                elements.iconInput,
                "请输入 Font Awesome 类名，例如 fas fa-folder",
            );
        } else {
            setFieldError(elements.iconError, elements.iconInput, "");
        }

        updatePreview();
    });

    subscribePanelConfig((_config, change) => {
        if (isOpen && change.source === "remote" && change.categoriesChanged) {
            closeAndNotify(false);
            showToast(
                "配置已在其他标签页更新，请重新编辑分类",
                "info",
                4000,
            );
        }
    });
};
