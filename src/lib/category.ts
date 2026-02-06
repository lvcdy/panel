import {
    SELECTOR_CATEGORIES,
    SELECTOR_CATEGORY_TOGGLE_BTN,
    SELECTOR_CATEGORY_TOGGLE_ICON,
    SELECTOR_CATEGORY_TOGGLE_LABEL,
} from "./config";

const setCategoryCollapsed = (catElement: Element, collapsed: boolean) => {
    const category = catElement as HTMLElement;
    const toggleBtn = category.querySelector(SELECTOR_CATEGORY_TOGGLE_BTN) as HTMLElement | null;
    const label = category.querySelector(SELECTOR_CATEGORY_TOGGLE_LABEL) as HTMLElement | null;
    const icon = category.querySelector(SELECTOR_CATEGORY_TOGGLE_ICON) as HTMLElement | null;

    category.classList.toggle("category-collapsed", collapsed);
    category.setAttribute("data-collapsed", collapsed ? "true" : "false");

    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    if (label) label.textContent = collapsed ? "展开" : "收起";
    if (icon) icon.style.transform = collapsed ? "rotate(-90deg)" : "none";
};

export const setupCategoryCollapse = () => {
    document.querySelectorAll(SELECTOR_CATEGORIES).forEach((catElement) => {
        const toggleBtn = catElement.querySelector(SELECTOR_CATEGORY_TOGGLE_BTN);
        if (!toggleBtn) return;

        setCategoryCollapsed(catElement, false);
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isCollapsed = (catElement as HTMLElement).dataset.collapsed === "true";
            setCategoryCollapsed(catElement, !isCollapsed);
        });
    });
};
