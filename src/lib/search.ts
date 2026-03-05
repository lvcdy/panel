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

// 保存原始文本以便还原高亮
const originalTexts = new WeakMap<HTMLElement, string>();

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

/** 高亮匹配文本 */
const highlightText = (el: HTMLElement, query: string) => {
    if (!originalTexts.has(el)) {
        originalTexts.set(el, el.textContent || "");
    }
    const original = originalTexts.get(el) || "";
    if (!query) {
        el.textContent = original;
        return;
    }
    const lowerOriginal = original.toLowerCase();
    const lowerQuery = query.toLowerCase();
    el.innerHTML = "";
    let cursor = 0;
    let idx: number;
    while ((idx = lowerOriginal.indexOf(lowerQuery, cursor)) !== -1) {
        // 匹配前的文本
        if (idx > cursor) {
            el.appendChild(document.createTextNode(original.slice(cursor, idx)));
        }
        // 高亮匹配文本（保留原始大小写）
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = original.slice(idx, idx + query.length);
        el.appendChild(mark);
        cursor = idx + query.length;
    }
    // 剩余文本
    if (cursor < original.length) {
        el.appendChild(document.createTextNode(original.slice(cursor)));
    }
};

/** 清除所有高亮 */
const clearAllHighlights = () => {
    getCategories().forEach((catElement) => {
        catElement.querySelectorAll(SELECTOR_CARD_TEXT).forEach((textEl) => {
            const el = textEl as HTMLElement;
            const original = originalTexts.get(el);
            if (original !== undefined) {
                el.textContent = original;
            }
        });
    });
};

/** 更新搜索结果计数提示 */
const updateSearchFeedback = (matchCount: number, query: string) => {
    const feedback = document.getElementById("searchFeedback");
    if (!feedback) return;

    if (!query) {
        feedback.classList.add("hidden");
        return;
    }

    feedback.classList.remove("hidden");
    if (matchCount > 0) {
        feedback.textContent = `找到 ${matchCount} 个匹配结果`;
        feedback.className = "search-feedback text-white/50";
    } else {
        feedback.textContent = "未找到匹配结果，回车可使用搜索引擎搜索";
        feedback.className = "search-feedback text-white/40";
    }
};

/** 获取链接导航容器 */
const getNavContainer = () => document.querySelector<HTMLElement>("nav[aria-label]");

/** 搜索模式下强制所有 section 可见（跳过未触发 IntersectionObserver 的 reveal 动画） */
const forceRevealAll = () => {
    getCategories().forEach((cat) => {
        (cat as HTMLElement).classList.add("revealed");
    });
};

export const filterLinks = (query: string) => {
    const lowerQuery = query.toLowerCase();
    toggleCategoryVisibility(true);

    // 进入搜索模式：统一布局
    getNavContainer()?.classList.add("is-searching");
    forceRevealAll();

    let totalMatches = 0;

    getCategories().forEach((catElement) => {
        let hasVisibleCard = false;
        const catTitle = catElement.querySelector(SELECTOR_CATEGORY_TITLE);
        const catTitleText = catTitle?.textContent?.toLowerCase() || "";
        // 如果分类名匹配，所有卡片都显示
        const categoryMatches = catTitleText.includes(lowerQuery);

        catElement.querySelectorAll(SELECTOR_CARD).forEach((card: Element) => {
            const cardEl = card as HTMLElement;
            const li = cardEl.closest("li");
            const textDiv = cardEl.querySelector(SELECTOR_CARD_TEXT) as HTMLElement;
            // 优先从缓存读取原始文本，避免读到高亮残留
            const text = (originalTexts.get(textDiv) ?? textDiv?.textContent ?? "").toLowerCase();
            const url = (cardEl.getAttribute("data-url") || cardEl.getAttribute("href") || "").toLowerCase();
            const matches = categoryMatches || text.includes(lowerQuery) || url.includes(lowerQuery);

            // 直接控制 li 显隐，不依赖 CSS :has()
            li?.classList.toggle("search-hidden-item", !matches);
            if (textDiv) {
                highlightText(textDiv, matches && !categoryMatches ? query : "");
            }
            if (matches) {
                hasVisibleCard = true;
                totalMatches++;
            }
        });

        const sectionEl = catElement as HTMLElement;
        sectionEl.classList.toggle("search-no-results", !hasVisibleCard);
    });

    updateSearchFeedback(totalMatches, query);
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

    const syncExpanded = () => {
        engineBtn.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
    };

    engineBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
        syncExpanded();
        // Focus first/active item when opening
        if (!menu.classList.contains("hidden")) {
            const active = menu.querySelector(".engine-item.active") as HTMLElement
                || menu.querySelector(".engine-item") as HTMLElement;
            active?.focus();
        }
    });

    // Keyboard navigation within the menu
    menu.addEventListener("keydown", (e) => {
        const items = Array.from(menu.querySelectorAll(".engine-item")) as HTMLElement[];
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
                current?.click();
                break;
        }
    });
};

export const setupEngineItemHandlers = (
    menu: HTMLElement | null,
    input: HTMLInputElement | null,
    onEngineSelect: (url: string, iconClass: string, color: string) => void
) => {
    if (!menu) return;

    // 使用事件委托而不是逐个添加监听器
    menu.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest(".engine-item") as HTMLElement | null;
        if (!target) return;

        // Update active state
        menu.querySelectorAll(".engine-item").forEach((item) => {
            item.classList.remove("active");
            item.setAttribute("aria-selected", "false");
        });
        target.classList.add("active");
        target.setAttribute("aria-selected", "true");

        const url = target.dataset.url || DEFAULT_SEARCH_URL;
        const iconClass = target.dataset.icon || "";
        const color = target.dataset.color || "";
        onEngineSelect(url, iconClass, color);
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
    clearAllHighlights();
    // 退出搜索模式
    getNavContainer()?.classList.remove("is-searching");
    getCategories().forEach((catElement) => {
        (catElement as HTMLElement).classList.remove("search-no-results");
        catElement.querySelectorAll("li").forEach((li) => {
            li.classList.remove("search-hidden-item");
        });
    });
    updateSearchFeedback(0, "");
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
        input.placeholder = "输入关键词搜索站内链接…";
        if (searchTip) searchTip.style.opacity = "0";
        // 不再在 focus 时隐藏所有卡片，仅当已有输入内容时才过滤
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
    document.addEventListener("click", () => {
        menu?.classList.add("hidden");
        document.getElementById("engineBtn")?.setAttribute("aria-expanded", "false");
    });
};

export const setupIPInfoHandler = (ipBox: HTMLElement | null) => {
    if (!ipBox) return;
    const openIpInfo = (e: Event) => {
        e.stopPropagation();
        window.open(IP_INFO_URL, "_blank", "noopener,noreferrer");
    };
    ipBox.addEventListener("click", openIpInfo);
    ipBox.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") {
            e.preventDefault();
            openIpInfo(e);
        }
    });
};
