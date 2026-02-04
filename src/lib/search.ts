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

let cachedCategories: NodeListOf<Element> | null = null;
let searchTipTimeout: NodeJS.Timeout | null = null;

const getCategories = () => {
    if (!cachedCategories) {
        cachedCategories = document.querySelectorAll(SELECTOR_CATEGORIES);
    }
    return cachedCategories;
};

const debounce = (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

export const filterLinks = (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Ensure categories are visible when filtering
    toggleCategoryVisibility(true);

    getCategories().forEach((catElement) => {
        const cards = catElement.querySelectorAll(SELECTOR_CARD);
        let hasVisibleCard = false;

        cards.forEach((card: Element) => {
            const cardElement = card as HTMLElement;
            const textDiv = cardElement.querySelector(SELECTOR_CARD_TEXT) as HTMLElement;
            const text = textDiv?.textContent?.toLowerCase() || "";
            const url = cardElement.getAttribute("data-url")?.toLowerCase() || cardElement.getAttribute("href")?.toLowerCase() || "";
            const matches = text.includes(lowerQuery) || url.includes(lowerQuery);

            cardElement.style.display = matches ? "" : "none";
            if (matches) {
                hasVisibleCard = true;
            }
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
    document.querySelectorAll(".engine-item").forEach((item) => {
        (item as HTMLElement).addEventListener("click", (e) => {
            const target = e.currentTarget as HTMLElement;
            const url = target.dataset.url || DEFAULT_SEARCH_URL;
            const iconClass = target.dataset.icon || "";
            onEngineSelect(url, iconClass);
            menu?.classList.add("hidden");
            input?.focus();
        });
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
    // Reset all display styles potentially set by filterLinks
    getCategories().forEach((catElement) => {
        const title = catElement.querySelector(SELECTOR_CATEGORY_TITLE) as HTMLElement;
        if (title) title.style.display = "";

        const cards = catElement.querySelectorAll(SELECTOR_CARD);
        cards.forEach((card) => {
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

    let scrollTimeout: NodeJS.Timeout | null = null;
    window.addEventListener("scroll", () => {
        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
            if (window.scrollY > SCROLL_THRESHOLD) {
                floatingBtn!.style.opacity = "1";
                floatingBtn!.style.pointerEvents = "auto";
            } else {
                floatingBtn!.style.opacity = "0";
                floatingBtn!.style.pointerEvents = "none";
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
