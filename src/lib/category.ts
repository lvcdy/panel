import {
    SELECTOR_CATEGORIES,
    SELECTOR_CATEGORY_TOGGLE_BTN,
    SELECTOR_CATEGORY_TOGGLE_ICON,
    SELECTOR_CATEGORY_TOGGLE_LABEL,
    SELECTOR_LINK_GRID,
} from "./config";

const setCategoryCollapsed = (catElement: Element, collapsed: boolean) => {
    const category = catElement as HTMLElement;
    const toggleBtn = category.querySelector(
        SELECTOR_CATEGORY_TOGGLE_BTN,
    ) as HTMLElement | null;
    const label = category.querySelector(
        SELECTOR_CATEGORY_TOGGLE_LABEL,
    ) as HTMLElement | null;
    const icon = category.querySelector(
        SELECTOR_CATEGORY_TOGGLE_ICON,
    ) as HTMLElement | null;

    category.classList.toggle("category-collapsed", collapsed);
    category.setAttribute("data-collapsed", collapsed ? "true" : "false");

    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    if (label) label.textContent = collapsed ? "展开" : "收起";
    if (icon) icon.style.transform = collapsed ? "rotate(180deg)" : "rotate(0deg)";
};

let initialized = false;

/**
 * 使用事件委托绑定在持久存在的 #linkGrid 上。
 * 导航重渲染后无需重新绑定，也不会产生重复监听。
 */
export const setupCategoryCollapse = () => {
    if (initialized) return;
    initialized = true;

    const handleClick = (event: Event) => {
        if (!(event.target instanceof Element)) return;

        const toggleBtn = event.target.closest(SELECTOR_CATEGORY_TOGGLE_BTN);
        if (!toggleBtn) return;

        const catElement = toggleBtn.closest(SELECTOR_CATEGORIES);
        if (!catElement) return;

        event.stopPropagation();
        const isCollapsed =
            (catElement as HTMLElement).dataset.collapsed === "true";
        setCategoryCollapsed(catElement, !isCollapsed);
    };

    const grid = document.querySelector<HTMLElement>(SELECTOR_LINK_GRID);
    if (grid) {
        grid.addEventListener("click", handleClick);
    } else {
        document.addEventListener("click", handleClick);
    }

    document.querySelectorAll(SELECTOR_CATEGORIES).forEach((catElement) => {
        const collapsed =
            (catElement as HTMLElement).dataset.collapsed === "true";
        setCategoryCollapsed(catElement, collapsed);
    });
};
