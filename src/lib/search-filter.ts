import {
    SELECTOR_CATEGORIES,
    SELECTOR_CARD,
    SELECTOR_CARD_TEXT,
    SELECTOR_CATEGORY_TITLE,
} from "./config";

type TimeoutId = ReturnType<typeof setTimeout>;

let cachedCategories: NodeListOf<Element> | null = null;
let cachedNavContainer: HTMLElement | null = null;
let cachedSearchFeedback: HTMLElement | null = null;

// 保存原始文本以便还原高亮
const originalTexts = new WeakMap<HTMLElement, string>();

// 保存分类标题原始文本以便还原计数徽章
const originalCatTitles = new WeakMap<HTMLElement, string>();

const getCategories = () => {
    if (!cachedCategories) {
        cachedCategories = document.querySelectorAll(SELECTOR_CATEGORIES);
    }
    return cachedCategories;
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
        if (idx > cursor) {
            el.appendChild(document.createTextNode(original.slice(cursor, idx)));
        }
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = original.slice(idx, idx + query.length);
        el.appendChild(mark);
        cursor = idx + query.length;
    }
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
    if (!cachedSearchFeedback) {
        cachedSearchFeedback = document.getElementById("searchFeedback");
    }
    const feedback = cachedSearchFeedback;
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
const getNavContainer = () => {
    if (!cachedNavContainer) {
        cachedNavContainer = document.querySelector<HTMLElement>("nav[aria-label]");
    }
    return cachedNavContainer;
};

/** 搜索模式下强制所有 section 可见（跳过未触发 IntersectionObserver 的 reveal 动画） */
const forceRevealAll = () => {
    getCategories().forEach((cat) => {
        const el = cat as HTMLElement;
        if (!el.classList.contains("revealed")) {
            el.classList.add("revealed");
        }
    });
};

/** 过滤并高亮搜索结果 */
export const filterLinks = (query: string) => {
    if (!query) {
        showAllIcons();
        return;
    }

    const lowerQuery = query.toLowerCase();

    getNavContainer()?.classList.add("is-searching");
    forceRevealAll();

    let totalMatches = 0;

    getCategories().forEach((catElement) => {
        let matchCount = 0;
        const catTitle = catElement.querySelector(SELECTOR_CATEGORY_TITLE) as HTMLElement | null;

        catElement.querySelectorAll(SELECTOR_CARD).forEach((card: Element) => {
            const cardEl = card as HTMLElement;
            const li = cardEl.closest("li");
            const textDiv = cardEl.querySelector<HTMLElement>(SELECTOR_CARD_TEXT);
            const text = (textDiv ? (originalTexts.get(textDiv) ?? textDiv.textContent ?? "") : "").toLowerCase();
            const url = (cardEl.getAttribute("data-url") || cardEl.getAttribute("href") || "").toLowerCase();
            const matches = text.includes(lowerQuery) || url.includes(lowerQuery);

            li?.classList.toggle("search-hidden-item", !matches);
            if (textDiv) {
                highlightText(textDiv, matches ? query : "");
            }
            if (matches) {
                matchCount++;
                totalMatches++;
            }
        });

        // 更新分类标题旁的结果计数
        if (catTitle) {
            if (!originalCatTitles.has(catElement as HTMLElement)) {
                originalCatTitles.set(catElement as HTMLElement, catTitle.textContent || "");
            }
            const existing = catTitle.querySelector(".search-category-count");
            if (existing) {
                existing.textContent = `${matchCount} 个结果`;
            } else {
                const countBadge = document.createElement("span");
                countBadge.className = "search-category-count";
                countBadge.textContent = `${matchCount} 个结果`;
                catTitle.appendChild(countBadge);
            }
        }

        (catElement as HTMLElement).classList.toggle("search-no-results", matchCount === 0);
    });

    updateSearchFeedback(totalMatches, query);
};

/** 恢复所有图标显示并清除搜索状态 */
export const showAllIcons = () => {
    clearAllHighlights();
    getNavContainer()?.classList.remove("is-searching");
    getCategories().forEach((catElement) => {
        (catElement as HTMLElement).classList.remove("search-no-results");
        catElement.querySelectorAll("li").forEach((li) => {
            li.classList.remove("search-hidden-item");
        });
        // 还原分类标题文本
        const catTitle = catElement.querySelector(SELECTOR_CATEGORY_TITLE) as HTMLElement | null;
        if (catTitle) {
            const original = originalCatTitles.get(catElement as HTMLElement);
            if (original !== undefined) {
                catTitle.textContent = original;
                originalCatTitles.delete(catElement as HTMLElement);
            }
        }
    });
    updateSearchFeedback(0, "");
};
