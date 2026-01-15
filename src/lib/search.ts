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

export const filterLinks = (query: string) => {
    const categories = document.querySelectorAll(SELECTOR_CATEGORIES);
    categories.forEach((catElement) => {
        const cards = catElement.querySelectorAll(SELECTOR_CARD);
        let hasVisibleCard = false;

        cards.forEach((card: Element) => {
            const cardElement = card as HTMLElement;
            const textDiv = cardElement.querySelector(SELECTOR_CARD_TEXT) as HTMLElement;
            const text = textDiv?.textContent?.toLowerCase() || "";
            const url = cardElement.getAttribute("href")?.toLowerCase() || "";
            const matches = text.includes(query.toLowerCase()) || url.includes(query.toLowerCase());

            if (matches) {
                cardElement.style.display = "";
                hasVisibleCard = true;
            } else {
                cardElement.style.display = "none";
            }
        });

        const title = catElement.querySelector(SELECTOR_CATEGORY_TITLE) as HTMLElement;
        if (title) title.style.display = hasVisibleCard ? "" : "none";
    });
};

export const showSearchTip = (tipElement: HTMLElement | null) => {
    if (!tipElement) return;
    tipElement.style.opacity = "1";
    setTimeout(() => {
        tipElement.style.opacity = "0";
    }, SEARCH_TIP_SHOW_TIME);
};

export const setupEngineButtonHandler = (engineBtn: HTMLElement | null, menu: HTMLElement | null) => {
    if (!engineBtn) return;
    engineBtn.onclick = (e) => {
        e.stopPropagation();
        menu?.classList.toggle("hidden");
    };
};

export const setupEngineItemHandlers = (
    menu: HTMLElement | null,
    input: HTMLInputElement | null,
    onEngineSelect: (url: string, iconClass: string) => void
) => {
    document.querySelectorAll(".engine-item").forEach((item) => {
        (item as HTMLElement).onclick = (e) => {
            const target = e.currentTarget as HTMLElement;
            const url = target.dataset.url || DEFAULT_SEARCH_URL;
            const iconClass = target.dataset.icon || "";
            onEngineSelect(url, iconClass);
            menu?.classList.add("hidden");
            input?.focus();
        };
    });
};

export const hideAllIcons = () => {
    const categories = document.querySelectorAll(SELECTOR_CATEGORIES);
    categories.forEach((catElement) => {
        (catElement as HTMLElement).classList.add("hidden-icons");
    });
};

export const showAllIcons = () => {
    const categories = document.querySelectorAll(SELECTOR_CATEGORIES);
    categories.forEach((catElement) => {
        (catElement as HTMLElement).classList.remove("hidden-icons");
    });
};

export const setupInputHandlers = (
    input: HTMLInputElement | null,
    searchTip: HTMLElement | null,
    onSearch: () => void,
    onFilter: (query: string) => void,
    onReset: () => void
) => {
    if (!input) return;

    let originalPlaceholder = "";
    const searchContainer = document.querySelector(".search-container") as HTMLElement | null;

    input.onfocus = () => {
        originalPlaceholder = input.placeholder;
        input.placeholder = "请输入搜索内容";
        if (searchTip) searchTip.style.opacity = "0";
        searchContainer?.classList.add("focused");
        hideAllIcons();
    };

    input.onblur = () => {
        input.placeholder = originalPlaceholder;
        searchContainer?.classList.remove("focused");
        if (!input.value.trim()) {
            showAllIcons();
        }
    };

    input.oninput = () => {
        const query = input.value.trim();
        query ? onFilter(query) : hideAllIcons();
    };

    input.onkeydown = (e) => {
        if (e.key === "Enter") onSearch();
        if (e.key === "Escape") {
            input.value = "";
            showAllIcons();
            input.blur();
        }
    };
};

export const setupSearchButtonHandler = (searchBtn: HTMLElement | null, onSearch: () => void) => {
    if (!searchBtn) return;
    searchBtn.onclick = onSearch;
};

export const setupFloatingButtonHandler = (
    floatingBtn: HTMLElement | null,
    input: HTMLInputElement | null
) => {
    if (!floatingBtn) return;
    floatingBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => input?.focus(), SCROLL_DURATION);
    };
};

export const setupScrollListener = (floatingBtn: HTMLElement | null) => {
    window.addEventListener("scroll", () => {
        if (!floatingBtn) return;
        if (window.scrollY > SCROLL_THRESHOLD) {
            floatingBtn.style.opacity = "1";
            floatingBtn.style.pointerEvents = "auto";
        } else {
            floatingBtn.style.opacity = "0";
            floatingBtn.style.pointerEvents = "none";
        }
    });
};

export const setupDocumentClickHandler = (menu: HTMLElement | null) => {
    document.onclick = () => menu?.classList.add("hidden");
};

export const setupIPInfoHandler = (ipBox: HTMLElement | null) => {
    if (!ipBox) return;
    ipBox.onclick = (e) => {
        e.stopPropagation();
        window.open(IP_INFO_URL, "_blank");
    };
};
