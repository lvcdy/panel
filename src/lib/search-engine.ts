import { DEFAULT_SEARCH_URL } from "./config";

/** 初始化搜索引擎下拉按钮 */
export const setupEngineButtonHandler = (engineBtn: HTMLElement | null, menu: HTMLElement | null) => {
    if (!engineBtn || !menu) return;

    const getEngineItems = () => Array.from(menu.querySelectorAll<HTMLElement>(".engine-item, .engine-action-item"));

    const syncExpanded = () => {
        engineBtn.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
    };

    engineBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
        syncExpanded();
        if (!menu.classList.contains("hidden")) {
            const active = menu.querySelector(".engine-item.active") as HTMLElement
                || menu.querySelector(".engine-item") as HTMLElement;
            active?.focus();
        }
    });

    menu.addEventListener("keydown", (e) => {
        const items = getEngineItems();
        if (items.length === 0) return;

        const current = document.activeElement as HTMLElement;
        const idx = items.indexOf(current);

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                items[(idx + 1) % items.length]?.focus();
                break;
            case "ArrowUp":
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length]?.focus();
                break;
            case "Escape":
                e.preventDefault();
                menu.classList.add("hidden");
                syncExpanded();
                engineBtn.focus();
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (items.includes(current)) {
                    current.click();
                }
                break;
        }
    });
};

/** 初始化搜索引擎选项点击事件 */
export const setupEngineItemHandlers = (
    menu: HTMLElement | null,
    input: HTMLInputElement | null,
    onEngineSelect: (url: string, iconClass: string, color: string, placeholder: string) => void
) => {
    if (!menu) return;

    menu.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest(".engine-item") as HTMLElement | null;
        if (!target) return;

        menu.querySelectorAll(".engine-item").forEach((item) => {
            item.classList.remove("active");
            item.setAttribute("aria-selected", "false");
        });
        target.classList.add("active");
        target.setAttribute("aria-selected", "true");

        const url = target.dataset.url || DEFAULT_SEARCH_URL;
        const iconClass = target.dataset.icon || "";
        const color = target.dataset.color || "";
        const placeholder = target.dataset.placeholder || "";
        onEngineSelect(url, iconClass, color, placeholder);
        menu.classList.add("hidden");
        input?.focus();
    });
};
