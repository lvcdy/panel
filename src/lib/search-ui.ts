import {
    SEARCH_TIP_SHOW_TIME,
    SCROLL_DURATION,
    SCROLL_THRESHOLD,
} from "./config";
import { showAllIcons } from "./search-filter";

type TimeoutId = ReturnType<typeof setTimeout>;

let searchTipTimeout: TimeoutId | null = null;

export const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, delay: number) => {
    let timeoutId: TimeoutId;
    return (...args: Args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/** 显示搜索提示（自动隐藏） */
export const showSearchTip = (tipElement: HTMLElement | null) => {
    if (!tipElement) return;
    if (searchTipTimeout) clearTimeout(searchTipTimeout);

    tipElement.style.opacity = "1";
    searchTipTimeout = setTimeout(() => {
        tipElement.style.opacity = "0";
    }, SEARCH_TIP_SHOW_TIME);
};

let currentEnginePlaceholder = "🔍 必应一下，你就知道！";

/** 更新搜索引擎对应的输入框提示语 */
export const setEnginePlaceholder = (placeholder: string) => {
    currentEnginePlaceholder = placeholder;
};

/** 初始化搜索输入框事件（聚焦、输入、键盘） */
export const setupInputHandlers = (
    input: HTMLInputElement | null,
    searchTip: HTMLElement | null,
    onSearch: () => void,
    onFilter: (query: string) => void
) => {
    if (!input) return;

    const debouncedFilter = debounce((query: string) => {
        query ? onFilter(query) : showAllIcons();
    }, 150);

    let originalPlaceholder = "";

    input.addEventListener("focus", () => {
        originalPlaceholder = input.placeholder;
        input.placeholder = currentEnginePlaceholder;
        if (searchTip) searchTip.style.opacity = "0";
        if (input.value.trim()) {
            debouncedFilter(input.value.trim());
        }
    });

    input.addEventListener("blur", () => {
        if (!input.value.trim()) {
            input.placeholder = originalPlaceholder;
            showAllIcons();
        }
    });

    input.addEventListener("input", () => {
        const query = input.value.trim();
        debouncedFilter(query);
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") onSearch();
        if (e.key === "Escape") {
            input.value = "";
            showAllIcons();
            input.blur();
        }
    });
};

/** 初始化搜索按钮点击事件 */
export const setupSearchButtonHandler = (searchBtn: HTMLElement | null, onSearch: () => void) => {
    if (!searchBtn) return;
    searchBtn.addEventListener("click", onSearch);
};

/** 初始化浮动搜索按钮（点击回到顶部并聚焦） */
export const setupFloatingButtonHandler = (
    floatingBtn: HTMLElement | null,
    input: HTMLInputElement | null
) => {
    if (!floatingBtn) return;

    floatingBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => input?.focus(), SCROLL_DURATION);
    });
};

/** 初始化滚动监听（控制浮动按钮显示/隐藏） */
export const setupScrollListener = (floatingBtn: HTMLElement | null) => {
    if (!floatingBtn) return;

    let isVisible = false;
    let ticking = false;

    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const shouldShow = window.scrollY > SCROLL_THRESHOLD;
            if (shouldShow !== isVisible) {
                isVisible = shouldShow;
                floatingBtn.classList.toggle("opacity-0", !shouldShow);
                floatingBtn.classList.toggle("opacity-100", shouldShow);
                floatingBtn.style.pointerEvents = shouldShow ? "auto" : "none";
            }
            ticking = false;
        });
    }, { passive: true });
};

/** 初始化全局点击事件（关闭引擎菜单） */
export const setupDocumentClickHandler = (menu: HTMLElement | null) => {
    document.addEventListener("click", () => {
        menu?.classList.add("hidden");
        document.getElementById("engineBtn")?.setAttribute("aria-expanded", "false");
    });
};
