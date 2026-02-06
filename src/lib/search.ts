import {
    SELECTOR_CATEGORIES,
    SELECTOR_CARD,
    SELECTOR_CARD_TEXT,
    SELECTOR_CATEGORY_TITLE,
    SEARCH_TIP_SHOW_TIME,
    SCROLL_DURATION,
    SCROLL_THRESHOLD,
    DEFAULT_SEARCH_URL,
    IP_INFO_URL,
} from "./config";

type TimeoutId = ReturnType<typeof setTimeout>;

let cachedCategories: NodeListOf<Element> | null = null;
let searchTipTimeout: TimeoutId | null = null;

const getCategories = () => {
    if (!cachedCategories) {
        cachedCategories = document.querySelectorAll(SELECTOR_CATEGORIES);
    }
    return cachedCategories;
};

const debounce = <T extends (...args: Parameters<T>) => void>(fn: T, delay: number) => {
    let timeoutId: TimeoutId;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

export const filterLinks = (query: string) => {
    const lowerQuery = query.toLowerCase();
    toggleCategoryVisibility(true);

    getCategories().forEach((catElement) => {
        let hasVisibleCard = false;
        catElement.querySelectorAll(SELECTOR_CARD).forEach((card: Element) => {
            const cardEl = card as HTMLElement;
            const textDiv = cardEl.querySelector(SELECTOR_CARD_TEXT) as HTMLElement;
            const text = textDiv?.textContent?.toLowerCase() || "";
            const url = (cardEl.getAttribute("data-url") || cardEl.getAttribute("href") || "").toLowerCase();
            const matches = text.includes(lowerQuery) || url.includes(lowerQuery);

            cardEl.style.display = matches ? "" : "none";
            if (matches) hasVisibleCard = true;
        });

        const title = catElement.querySelector(SELECTOR_CATEGORY_TITLE) as HTMLElement;
        if (title) title.style.display = hasVisibleCard ? "" : "none";
    });
};

export const showSearchTip = (tipElement: HTMLElement | null) => {
    if (!tipElement) return;
    if (searchTipTimeout) clearTimeout(searchTipTimeout);

    tipElement.style.opacity = "1";
    searchTipTimeout = setTimeout(() => {
        tipElement.style.opacity = "0";
    }, SEARCH_TIP_SHOW_TIME);
};

export const setupEngineButtonHandler = (engineBtn: HTMLElement | null, menu: HTMLElement | null) => {
    if (!engineBtn || !menu) return;

    engineBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
    });
};

export const setupEngineItemHandlers = (
    menu: HTMLElement | null,
    input: HTMLInputElement | null,
    onEngineSelect: (url: string, iconClass: string) => void
) => {
    if (!menu) return;

    // 使用事件委托而不是逐个添加监听器
    menu.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest(".engine-item");
        if (!target) return;

        const url = target.dataset.url || DEFAULT_SEARCH_URL;
        const iconClass = target.dataset.icon || "";
        onEngineSelect(url, iconClass);
        menu.classList.add("hidden");
        input?.focus();
    });
};

const toggleCategoryVisibility = (visible: boolean) => {
    getCategories().forEach((catElement) => {
        (catElement as HTMLElement).classList.toggle("hidden-icons", !visible);
    });
};

export const hideAllIcons = () => toggleCategoryVisibility(false);
export const showAllIcons = () => {
    toggleCategoryVisibility(true);
    getCategories().forEach((catElement) => {
        const title = catElement.querySelector(SELECTOR_CATEGORY_TITLE) as HTMLElement;
        if (title) title.style.display = "";
        catElement.querySelectorAll(SELECTOR_CARD).forEach((card) => {
            (card as HTMLElement).style.display = "";
        });
    });
};

export const setupInputHandlers = (
    input: HTMLInputElement | null,
    searchTip: HTMLElement | null,
    onSearch: () => void,
    onFilter: (query: string) => void
) => {
    if (!input) return;

    // Create debounced filter function
    const debouncedFilter = debounce((query: string) => {
        query ? onFilter(query) : showAllIcons();
    }, 150);

    let originalPlaceholder = "";

    input.addEventListener("focus", () => {
        originalPlaceholder = input.placeholder;
        input.placeholder = "";
        input.value = "";
        if (searchTip) searchTip.style.opacity = "0";
        hideAllIcons();
    });

    input.addEventListener("blur", () => {
        // Only show all icons if input is empty, otherwise we want to keep the filtered results
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

export const setupSearchButtonHandler = (searchBtn: HTMLElement | null, onSearch: () => void) => {
    if (!searchBtn) return;
    searchBtn.addEventListener("click", onSearch);
};

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

export const setupScrollListener = (floatingBtn: HTMLElement | null) => {
    if (!floatingBtn) return;

    let isVisible = false;
    let scrollTimeout: TimeoutId | null = null;

    window.addEventListener("scroll", () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            const shouldShow = window.scrollY > SCROLL_THRESHOLD;
            if (shouldShow !== isVisible) {
                isVisible = shouldShow;
                floatingBtn.classList.toggle("opacity-0", !shouldShow);
                floatingBtn.classList.toggle("opacity-100", shouldShow);
                floatingBtn.style.pointerEvents = shouldShow ? "auto" : "none";
            }
            scrollTimeout = null;
        }, 100);
    }, { passive: true });
};

export const setupDocumentClickHandler = (menu: HTMLElement | null) => {
    document.addEventListener("click", () => menu?.classList.add("hidden"));
};

export const setupIPInfoHandler = (ipBox: HTMLElement | null) => {
    if (!ipBox) return;
    ipBox.addEventListener("click", (e) => {
        e.stopPropagation();
        window.open(IP_INFO_URL, "_blank");
    });
};
