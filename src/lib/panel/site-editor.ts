import { closeSettingsPanel } from "../settings";
import { showToast } from "../toast";
import { getIconQueryUrl, isValidHttpUrl } from "../utils";
import { isValidIconClass, normalizeIconClass } from "./icon";
import {
    addLink,
    getPanelConfig,
    subscribePanelConfig,
    updateLink,
} from "./store";
import type { LinkInput, PanelCategory, PanelConfig, PanelLink } from "./types";

const COLOR_PATTERN =
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const HEX6_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;
const DEFAULT_ICON = "fas fa-link";
const DEFAULT_COLOR = "#ffffff";

interface SiteEditorElements {
    modal: HTMLElement;
    overlay: HTMLElement;
    close: HTMLButtonElement;
    form: HTMLFormElement;
    idInput: HTMLInputElement;
    title: HTMLHeadingElement;
    nameInput: HTMLInputElement;
    nameError: HTMLElement;
    urlInput: HTMLInputElement;
    urlError: HTMLElement;
    descriptionInput: HTMLTextAreaElement;
    descriptionError: HTMLElement;
    iconInput: HTMLInputElement;
    iconError: HTMLElement;
    colorInput: HTMLInputElement;
    colorText: HTMLInputElement;
    colorError: HTMLElement;
    categorySelect: HTMLSelectElement;
    categoryError: HTMLElement;
    tagsInput: HTMLInputElement;
    tagsError: HTMLElement;
    favoriteInput: HTMLInputElement;
    visibleInput: HTMLInputElement;
    newTabInput: HTMLInputElement;
    useIconInput: HTMLInputElement;
    statusInput: HTMLInputElement;
    preview: HTMLElement;
    previewImg: HTMLImageElement;
    previewIcon: HTMLElement;
    formError: HTMLElement;
    cancel: HTMLButtonElement;
    save: HTMLButtonElement;
}

type EditorMode = "add" | "edit";

interface OpenSiteEditorOptions {
    mode: EditorMode;
    categoryId?: string;
    linkId?: string;
}

interface FoundLink {
    category: PanelCategory;
    link: PanelLink;
}

let initialized = false;
let isOpen = false;
let elements: SiteEditorElements | null = null;
let mode: EditorMode = "add";
let editingLinkId: string | null = null;
let lastFocused: HTMLElement | null = null;

const getElement = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

const getElements = (): SiteEditorElements | null => {
    const modal = getElement<HTMLElement>("site-editor-modal");
    const overlay = getElement<HTMLElement>("site-editor-overlay");
    const close = getElement<HTMLButtonElement>("site-editor-close");
    const form = getElement<HTMLFormElement>("site-editor-form");
    const idInput = getElement<HTMLInputElement>("site-editor-id");
    const title = getElement<HTMLHeadingElement>("site-editor-title");
    const nameInput = getElement<HTMLInputElement>("site-name-input");
    const nameError = getElement<HTMLElement>("site-name-error");
    const urlInput = getElement<HTMLInputElement>("site-url-input");
    const urlError = getElement<HTMLElement>("site-url-error");
    const descriptionInput = getElement<HTMLTextAreaElement>("site-description-input");
    const descriptionError = getElement<HTMLElement>("site-description-error");
    const iconInput = getElement<HTMLInputElement>("site-icon-input");
    const iconError = getElement<HTMLElement>("site-icon-error");
    const colorInput = getElement<HTMLInputElement>("site-color-input");
    const colorText = getElement<HTMLInputElement>("site-color-text");
    const colorError = getElement<HTMLElement>("site-color-error");
    const categorySelect = getElement<HTMLSelectElement>("site-category-select");
    const categoryError = getElement<HTMLElement>("site-category-error");
    const tagsInput = getElement<HTMLInputElement>("site-tags-input");
    const tagsError = getElement<HTMLElement>("site-tags-error");
    const favoriteInput = getElement<HTMLInputElement>("site-favorite-input");
    const visibleInput = getElement<HTMLInputElement>("site-visible-input");
    const newTabInput = getElement<HTMLInputElement>("site-new-tab-input");
    const useIconInput = getElement<HTMLInputElement>("site-use-icon-input");
    const statusInput = getElement<HTMLInputElement>("site-status-input");
    const preview = getElement<HTMLElement>("site-icon-preview");
    const previewImg = getElement<HTMLImageElement>("site-icon-preview-img");
    const previewIcon = getElement<HTMLElement>("site-icon-preview-i");
    const formError = getElement<HTMLElement>("site-form-error");
    const cancel = getElement<HTMLButtonElement>("site-editor-cancel");
    const save = getElement<HTMLButtonElement>("site-editor-save");

    if (
        !modal ||
        !overlay ||
        !close ||
        !form ||
        !idInput ||
        !title ||
        !nameInput ||
        !nameError ||
        !urlInput ||
        !urlError ||
        !descriptionInput ||
        !descriptionError ||
        !iconInput ||
        !iconError ||
        !colorInput ||
        !colorText ||
        !colorError ||
        !categorySelect ||
        !categoryError ||
        !tagsInput ||
        !tagsError ||
        !favoriteInput ||
        !visibleInput ||
        !newTabInput ||
        !useIconInput ||
        !statusInput ||
        !preview ||
        !previewImg ||
        !previewIcon ||
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
        urlInput,
        urlError,
        descriptionInput,
        descriptionError,
        iconInput,
        iconError,
        colorInput,
        colorText,
        colorError,
        categorySelect,
        categoryError,
        tagsInput,
        tagsError,
        favoriteInput,
        visibleInput,
        newTabInput,
        useIconInput,
        statusInput,
        preview,
        previewImg,
        previewIcon,
        formError,
        cancel,
        save,
    };
};

const findLink = (config: PanelConfig, linkId: string): FoundLink | null => {
    for (const category of config.categories) {
        const link = category.links.find((item) => item.id === linkId);
        if (link) return { category, link };
    }

    return null;
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

const clearFieldError = (
    errorElement: HTMLElement,
    input: HTMLElement | null,
): void => {
    setFieldError(errorElement, input, "");
};

const clearAllErrors = (): void => {
    if (!elements) return;
    setFieldError(elements.nameError, elements.nameInput, "");
    setFieldError(elements.urlError, elements.urlInput, "");
    setFieldError(
        elements.descriptionError,
        elements.descriptionInput,
        "",
    );
    setFieldError(elements.iconError, elements.iconInput, "");
    setFieldError(elements.colorError, elements.colorText, "");
    setFieldError(
        elements.categoryError,
        elements.categorySelect,
        "",
    );
    setFieldError(elements.tagsError, elements.tagsInput, "");
    elements.formError.textContent = "";
};

const parseTags = (value: string): string[] => {
    const tags: string[] = [];

    value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => {
            if (!tags.includes(tag)) tags.push(tag);
        });

    return tags;
};

const updatePreview = (): void => {
    if (!elements) return;

    const iconValue = normalizeIconClass(elements.iconInput.value);
    const iconClass = iconValue || DEFAULT_ICON;
    const colorValue = elements.colorText.value.trim();
    const color = COLOR_PATTERN.test(colorValue)
        ? colorValue.toLowerCase()
        : DEFAULT_COLOR;

    elements.previewIcon.className = iconClass;
    elements.previewIcon.style.color = color;
    elements.preview.style.backgroundColor = `color-mix(in srgb, ${color} 12%, transparent)`;
    elements.preview.style.borderColor = `color-mix(in srgb, ${color} 28%, transparent)`;

    const urlValue = elements.urlInput.value.trim();
    const shouldShowFavicon =
        elements.useIconInput.checked && isValidHttpUrl(urlValue);

    if (!shouldShowFavicon) {
        elements.previewImg.onload = null;
        elements.previewImg.onerror = null;
        elements.previewImg.removeAttribute("src");
        elements.previewImg.dataset.src = "";
        elements.previewImg.classList.add("hidden");
        elements.previewIcon.classList.remove("hidden");
        return;
    }

    const src = getIconQueryUrl(urlValue);
    if (elements.previewImg.dataset.src === src) return;

    elements.previewImg.dataset.src = src;
    elements.previewImg.classList.add("hidden");
    elements.previewIcon.classList.remove("hidden");
    elements.previewImg.onload = () => {
        elements?.previewImg.classList.remove("hidden");
        elements?.previewIcon.classList.add("hidden");
    };
    elements.previewImg.onerror = () => {
        elements?.previewImg.classList.add("hidden");
        elements?.previewIcon.classList.remove("hidden");
    };
    elements.previewImg.src = src;
};

const populateCategorySelect = (
    config: PanelConfig,
    selectedCategoryId: string,
): void => {
    if (!elements) return;

    elements.categorySelect.replaceChildren();

    config.categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent =
            category.visible === false
                ? `${category.title}（已隐藏）`
                : category.title;
        elements?.categorySelect.appendChild(option);
    });

    if (config.categories.some((category) => category.id === selectedCategoryId)) {
        elements.categorySelect.value = selectedCategoryId;
    }
};

const fillFormForAdd = (categoryId: string): void => {
    if (!elements) return;

    elements.idInput.value = "";
    elements.nameInput.value = "";
    elements.urlInput.value = "";
    elements.descriptionInput.value = "";
    elements.iconInput.value = "";
    elements.colorInput.value = DEFAULT_COLOR;
    elements.colorText.value = DEFAULT_COLOR;
    elements.tagsInput.value = "";
    elements.favoriteInput.checked = false;
    elements.visibleInput.checked = true;
    elements.newTabInput.checked = true;
    elements.useIconInput.checked = true;
    elements.statusInput.checked = true;
    elements.categorySelect.value = categoryId;
};

const fillFormForEdit = (category: PanelCategory, link: PanelLink): void => {
    if (!elements) return;

    elements.idInput.value = link.id;
    elements.nameInput.value = link.name;
    elements.urlInput.value = link.url;
    elements.descriptionInput.value = link.description;
    elements.iconInput.value = link.icon;
    elements.colorInput.value = HEX6_PATTERN.test(link.color)
        ? link.color
        : DEFAULT_COLOR;
    elements.colorText.value = link.color;
    elements.tagsInput.value = link.tags.join(", ");
    elements.favoriteInput.checked = link.favorite;
    elements.visibleInput.checked = link.visible !== false;
    elements.newTabInput.checked = link.openInNewTab !== false;
    elements.useIconInput.checked = link.useIcon !== false;
    elements.statusInput.checked = link.status !== false;
    elements.categorySelect.value = category.id;
};

const validateForm = (
    config: PanelConfig,
): { ok: true; input: LinkInput; categoryId: string } | { ok: false } => {
    if (!elements) return { ok: false };

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

    const name = elements.nameInput.value.trim();
    if (!name) {
        invalidate(elements.nameError, elements.nameInput, "请输入网站名称");
    } else if (name.length > 100) {
        invalidate(
            elements.nameError,
            elements.nameInput,
            "网站名称不能超过 100 个字符",
        );
    }

    const url = elements.urlInput.value.trim();
    if (!url) {
        invalidate(elements.urlError, elements.urlInput, "请输入网站 URL");
    } else if (url.length > 2048) {
        invalidate(
            elements.urlError,
            elements.urlInput,
            "URL 不能超过 2048 个字符",
        );
    } else if (!isValidHttpUrl(url)) {
        invalidate(
            elements.urlError,
            elements.urlInput,
            "请输入有效的 http/https URL",
        );
    }

    const categoryId = elements.categorySelect.value;
    if (!config.categories.some((category) => category.id === categoryId)) {
        invalidate(
            elements.categoryError,
            elements.categorySelect,
            "请选择有效的分类",
        );
    }

    const description = elements.descriptionInput.value.trim();
    if (description.length > 500) {
        invalidate(
            elements.descriptionError,
            elements.descriptionInput,
            "网站描述不能超过 500 个字符",
        );
    }

    const iconValue = normalizeIconClass(elements.iconInput.value);
    const icon = iconValue || DEFAULT_ICON;
    if (iconValue && !isValidIconClass(iconValue)) {
        invalidate(
            elements.iconError,
            elements.iconInput,
            "请输入 Font Awesome 类名，例如 fas fa-globe",
        );
    }

    const colorValue = elements.colorText.value.trim();
    const color = colorValue || DEFAULT_COLOR;
    if (!COLOR_PATTERN.test(color)) {
        invalidate(
            elements.colorError,
            elements.colorText,
            "请输入合法的十六进制颜色，例如 #4d6bfe",
        );
    }

    const tags = parseTags(elements.tagsInput.value);
    if (tags.length > MAX_TAGS) {
        invalidate(
            elements.tagsError,
            elements.tagsInput,
            `最多允许 ${MAX_TAGS} 个标签`,
        );
    } else {
        const longTag = tags.find((tag) => tag.length > MAX_TAG_LENGTH);
        if (longTag) {
            invalidate(
                elements.tagsError,
                elements.tagsInput,
                `单个标签不能超过 ${MAX_TAG_LENGTH} 个字符`,
            );
        }
    }

    if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
        return { ok: false };
    }

    return {
        ok: true,
        categoryId,
        input: {
            name,
            url,
            description,
            icon,
            color: color.toLowerCase(),
            tags,
            favorite: elements.favoriteInput.checked,
            visible: elements.visibleInput.checked,
            openInNewTab: elements.newTabInput.checked,
            useIcon: elements.useIconInput.checked,
            status: elements.statusInput.checked,
        },
    };
};

const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!elements || !isOpen) return;

    const config = getPanelConfig();
    const parsed = validateForm(config);
    if (!parsed.ok) return;

    elements.save.disabled = true;

    try {
        const result =
            mode === "edit" && editingLinkId
                ? updateLink(editingLinkId, {
                      ...parsed.input,
                      categoryId: parsed.categoryId,
                  })
                : addLink(parsed.categoryId, parsed.input);

        if (!result.ok) {
            const detail = result.details?.[0];
            elements.formError.textContent = detail
                ? `${result.message}：${detail}`
                : result.message;
            showToast(result.message, "error", 5000);
            return;
        }

        const wasEditing = mode === "edit";
        closeSiteEditor(false);
        showToast(wasEditing ? "网站已更新" : "网站已添加", "success");
    } finally {
        if (elements) elements.save.disabled = false;
    }
};

export const openSiteEditor = (options: OpenSiteEditorOptions): void => {
    if (!initialized) initSiteEditor();
    if (!elements) return;

    const config = getPanelConfig();
    if (config.categories.length === 0) {
        showToast("当前没有分类，无法添加网站", "error");
        return;
    }

    closeSettingsPanel();
    clearAllErrors();

    mode = options.mode;
    editingLinkId = options.mode === "edit" ? options.linkId ?? null : null;

    if (mode === "edit") {
        if (!editingLinkId) return;
        const found = findLink(config, editingLinkId);
        if (!found) {
            showToast("网站不存在，可能已在其他标签页删除", "error");
            return;
        }

        elements.title.textContent = "编辑网站";
        elements.save.textContent = "保存";
        populateCategorySelect(config, found.category.id);
        fillFormForEdit(found.category, found.link);
    } else {
        const selectedCategoryId =
            options.categoryId &&
            config.categories.some(
                (category) => category.id === options.categoryId,
            )
                ? options.categoryId
                : (config.categories.find(
                      (category) => category.visible !== false,
                  ) ?? config.categories[0])?.id;

        if (!selectedCategoryId) {
            showToast("当前没有可用分类", "error");
            return;
        }

        elements.title.textContent = "添加网站";
        elements.save.textContent = "添加";
        populateCategorySelect(config, selectedCategoryId);
        fillFormForAdd(selectedCategoryId);
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

export const closeSiteEditor = (restoreFocus = true): void => {
    if (!elements || !isOpen) return;

    isOpen = false;
    mode = "add";
    editingLinkId = null;
    elements.modal.classList.add("hidden");
    elements.modal.setAttribute("aria-hidden", "true");
    clearAllErrors();

    if (restoreFocus) lastFocused?.focus();
    lastFocused = null;
};

export const isSiteEditorOpen = (): boolean => isOpen;

export const initSiteEditor = (): void => {
    if (initialized || typeof document === "undefined") return;

    const found = getElements();
    if (!found) return;

    elements = found;
    initialized = true;

    elements.form.addEventListener("submit", handleSubmit);
    elements.cancel.addEventListener("click", () => closeSiteEditor());
    elements.close.addEventListener("click", () => closeSiteEditor());
    elements.overlay.addEventListener("click", () => closeSiteEditor());

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            closeSiteEditor();
        }
    });

    elements.iconInput.addEventListener("input", updatePreview);
    elements.urlInput.addEventListener("input", updatePreview);
    elements.useIconInput.addEventListener("change", updatePreview);

    elements.colorInput.addEventListener("input", () => {
        if (!elements) return;
        elements.colorText.value = elements.colorInput.value;
        clearFieldError(elements.colorError, elements.colorText);
        updatePreview();
    });

    elements.colorText.addEventListener("input", () => {
        if (!elements) return;
        const value = elements.colorText.value.trim();
        if (HEX6_PATTERN.test(value)) {
            elements.colorInput.value = value.toLowerCase();
        }
        updatePreview();
    });

    elements.colorText.addEventListener("blur", () => {
        if (!elements) return;
        const value = elements.colorText.value.trim();
        if (!value) return;

        if (COLOR_PATTERN.test(value)) {
            elements.colorText.value = value.toLowerCase();
            if (HEX6_PATTERN.test(value)) {
                elements.colorInput.value = value.toLowerCase();
            }
            clearFieldError(elements.colorError, elements.colorText);
        } else {
            setFieldError(
                elements.colorError,
                elements.colorText,
                "请输入合法的十六进制颜色，例如 #4d6bfe",
            );
        }
        updatePreview();
    });

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
                "请输入 Font Awesome 类名，例如 fas fa-globe",
            );
        } else {
            clearFieldError(elements.iconError, elements.iconInput);
        }
        updatePreview();
    });

    subscribePanelConfig((_config, change) => {
        if (isOpen && change.source === "remote") {
            closeSiteEditor();
            showToast(
                "配置已在其他标签页更新，请重新打开编辑",
                "info",
                4000,
            );
        }
    });
};
