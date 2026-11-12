import {
    SELECTOR_CATEGORIES,
    SELECTOR_CARD,
    SELECTOR_CARD_TEXT,
    SELECTOR_CATEGORY_TITLE,
    SELECTOR_SEARCH_EMPTY_STATE,
} from "./config";

const SELECTOR_CARD_TAG = "[data-card-tag]";
const SELECTOR_CARD_DESC = "[data-card-desc]";
const SELECTOR_CATEGORY_TITLE_TEXT = "[data-category-title-text]";

let cachedCategories: NodeListOf<Element> | null = null;
let cachedNavContainer: HTMLElement | null = null;
let cachedSearchFeedback: HTMLElement | null = null;
let cachedSearchEmptyState: HTMLElement | null = null;

/** 导航重渲染后清除所有 DOM 缓存，避免继续操作已移除的节点 */
export const resetSearchCaches = (): void => {
    cachedCategories = null;
    cachedNavContainer = null;
    cachedSearchFeedback = null;
    cachedSearchEmptyState = null;
};

/** 保存原始文本，用于清除高亮或重新计算匹配区间 */
const originalTexts = new WeakMap<HTMLElement, string>();

const getCategories = () => {
    if (!cachedCategories) {
        cachedCategories = document.querySelectorAll(SELECTOR_CATEGORIES);
    }
    return cachedCategories;
};

const getNavContainer = () => {
    if (!cachedNavContainer) {
        cachedNavContainer = document.querySelector<HTMLElement>("nav[aria-label]");
    }
    return cachedNavContainer;
};

const getSearchEmptyState = (): HTMLElement | null => {
    if (!cachedSearchEmptyState) {
        cachedSearchEmptyState = document.querySelector<HTMLElement>(
            SELECTOR_SEARCH_EMPTY_STATE,
        );
    }
    return cachedSearchEmptyState;
};

const parseTerms = (query: string): string[] => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return Array.from(new Set(normalized.split(/\s+/).filter(Boolean)));
};

const ensureOriginalText = (element: HTMLElement): string => {
    if (!originalTexts.has(element)) {
        originalTexts.set(element, element.textContent ?? "");
    }

    return originalTexts.get(element) ?? "";
};

const restoreElementText = (element: HTMLElement): void => {
    const original = originalTexts.get(element);
    if (original !== undefined) {
        element.textContent = original;
    }
};

const setPlainText = (element: HTMLElement, text: string): void => {
    originalTexts.set(element, text);
    element.textContent = text;
};

interface MatchInterval {
    start: number;
    end: number;
}

/** 使用字符串 indexOf 而非正则，天然避免关键词中的正则特殊字符问题 */
const collectIntervals = (text: string, terms: readonly string[]): MatchInterval[] => {
    const lowerText = text.toLowerCase();
    const intervals: MatchInterval[] = [];

    terms.forEach((term) => {
        if (!term) return;

        let cursor = 0;
        while (cursor <= lowerText.length) {
            const index = lowerText.indexOf(term, cursor);
            if (index === -1) break;

            intervals.push({ start: index, end: index + term.length });
            cursor = index + Math.max(term.length, 1);
        }
    });

    if (intervals.length === 0) return [];

    intervals.sort((a, b) => a.start - b.start || a.end - b.end);

    const merged: MatchInterval[] = [];
    intervals.forEach((interval) => {
        const last = merged[merged.length - 1];
        if (last && interval.start <= last.end) {
            last.end = Math.max(last.end, interval.end);
            return;
        }
        merged.push({ ...interval });
    });

    return merged;
};

/** 只使用 textContent 与文本节点，不把用户数据拼进 innerHTML */
const highlightElement = (element: HTMLElement, terms: readonly string[]): void => {
    const original = ensureOriginalText(element);

    element.replaceChildren();

    const intervals = collectIntervals(original, terms);
    if (intervals.length === 0) {
        element.textContent = original;
        return;
    }

    let cursor = 0;
    intervals.forEach(({ start, end }) => {
        if (start > cursor) {
            element.appendChild(
                document.createTextNode(original.slice(cursor, start)),
            );
        }

        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = original.slice(start, end);
        element.appendChild(mark);

        cursor = end;
    });

    if (cursor < original.length) {
        element.appendChild(document.createTextNode(original.slice(cursor)));
    }
};

const getCardSearchText = (card: HTMLElement): string => {
    const data = card.dataset.searchText;
    if (data) return data.toLowerCase();

    const name = card.querySelector(SELECTOR_CARD_TEXT)?.textContent ?? "";
    const url = card.getAttribute("data-url") ?? card.getAttribute("href") ?? "";
    return `${name} ${url}`.toLowerCase();
};

const getCategorySearchTitle = (
    category: Element,
    titleText: HTMLElement | null,
): string =>
    (
        (category as HTMLElement).dataset.categoryTitle ??
        titleText?.textContent ??
        ""
    ).toLowerCase();

const cardMatches = (
    searchText: string,
    categoryTitle: string,
    terms: readonly string[],
): boolean =>
    terms.every(
        (term) =>
            searchText.includes(term) || categoryTitle.includes(term),
    );

const buildDescriptionSnippet = (
    description: string,
    terms: readonly string[],
): string | null => {
    if (!description) return null;

    const lowerDescription = description.toLowerCase();
    let matchIndex = -1;
    let matchLength = 0;

    terms.forEach((term) => {
        const index = lowerDescription.indexOf(term);
        if (index === -1) return;
        if (matchIndex === -1 || index < matchIndex) {
            matchIndex = index;
            matchLength = term.length;
        }
    });

    if (matchIndex === -1) return null;

    const start = Math.max(0, matchIndex - 18);
    const end = Math.min(
        description.length,
        matchIndex + matchLength + 34,
    );

    return `${start > 0 ? "…" : ""}${description.slice(start, end)}${
        end < description.length ? "…" : ""
    }`;
};

const clearCardDetails = (card: HTMLElement): void => {
    card.querySelectorAll<HTMLElement>(SELECTOR_CARD_TAG).forEach((chip) => {
        restoreElementText(chip);
        chip.hidden = true;
    });

    const descriptionChip = card.querySelector<HTMLElement>(SELECTOR_CARD_DESC);
    if (descriptionChip) {
        descriptionChip.hidden = true;
        descriptionChip.textContent = "";
        descriptionChip.removeAttribute("title");
        originalTexts.delete(descriptionChip);
    }
};

/** 卡片正文只展示一个匹配详情：优先命中的标签，其次描述片段 */
const updateCardDetails = (card: HTMLElement, terms: readonly string[]): void => {
    let shownTag: HTMLElement | null = null;

    card.querySelectorAll<HTMLElement>(SELECTOR_CARD_TAG).forEach((chip) => {
        const chipText = ensureOriginalText(chip).toLowerCase();
        const matches = terms.some((term) => chipText.includes(term));

        if (matches && !shownTag) {
            shownTag = chip;
            chip.hidden = false;
            highlightElement(chip, terms);
            return;
        }

        restoreElementText(chip);
        chip.hidden = true;
    });

    const descriptionChip = card.querySelector<HTMLElement>(SELECTOR_CARD_DESC);
    if (!descriptionChip) return;

    if (shownTag) {
        descriptionChip.hidden = true;
        descriptionChip.textContent = "";
        descriptionChip.removeAttribute("title");
        originalTexts.delete(descriptionChip);
        return;
    }

    const description = card.getAttribute("data-description") ?? "";
    const snippet = buildDescriptionSnippet(description, terms);

    if (!snippet) {
        descriptionChip.hidden = true;
        descriptionChip.textContent = "";
        descriptionChip.removeAttribute("title");
        originalTexts.delete(descriptionChip);
        return;
    }

    setPlainText(descriptionChip, snippet);
    descriptionChip.title = description;
    descriptionChip.hidden = false;
    highlightElement(descriptionChip, terms);
};

const setCategoryCount = (
    titleElement: HTMLElement,
    count: number,
): void => {
    const existing = titleElement.querySelector<HTMLElement>(
        ".search-category-count",
    );

    if (existing) {
        existing.textContent = `${count} 个结果`;
        return;
    }

    const badge = document.createElement("span");
    badge.className = "search-category-count";
    badge.textContent = `${count} 个结果`;
    titleElement.appendChild(badge);
};

const clearAllHighlights = (): void => {
    getCategories().forEach((category) => {
        category.querySelectorAll<HTMLElement>(SELECTOR_CARD_TEXT).forEach((element) => {
            restoreElementText(element);
        });

        category
            .querySelectorAll<HTMLElement>(SELECTOR_CATEGORY_TITLE_TEXT)
            .forEach((element) => {
                restoreElementText(element);
            });

        category.querySelectorAll<HTMLElement>(SELECTOR_CARD_TAG).forEach((chip) => {
            restoreElementText(chip);
            chip.hidden = true;
        });

        category.querySelectorAll<HTMLElement>(SELECTOR_CARD_DESC).forEach((chip) => {
            chip.hidden = true;
            chip.textContent = "";
            chip.removeAttribute("title");
            originalTexts.delete(chip);
        });

        category.querySelectorAll(".search-category-count").forEach((badge) => {
            badge.remove();
        });
    });
};

const updateSearchFeedback = (matchCount: number, query: string): void => {
    if (!cachedSearchFeedback) {
        cachedSearchFeedback = document.getElementById("searchFeedback");
    }

    const feedback = cachedSearchFeedback;
    const emptyState = getSearchEmptyState();

    if (!query) {
        feedback?.classList.add("hidden");
        emptyState?.classList.add("hidden");
        return;
    }

    if (feedback) {
        feedback.classList.remove("hidden", "text-white/50", "text-white/40");
        if (matchCount > 0) {
            feedback.textContent = `找到 ${matchCount} 个匹配结果`;
            feedback.classList.add("text-white/50");
        } else {
            feedback.textContent = "未找到匹配结果，回车可使用搜索引擎搜索";
            feedback.classList.add("text-white/40");
        }
    }

    if (emptyState) {
        const isEmpty = matchCount === 0;
        emptyState.classList.toggle("hidden", !isEmpty);

        if (isEmpty) {
            const title = emptyState.querySelector<HTMLElement>(
                "#searchEmptyTitle",
            );
            if (title) {
                title.textContent = `没有找到与“${query}”相关的网站`;
            }
        }
    }
};

/** 搜索模式下强制所有 section 可见（跳过未触发 IntersectionObserver 的 reveal 动画） */
const forceRevealAll = (): void => {
    getCategories().forEach((category) => {
        const element = category as HTMLElement;
        if (!element.classList.contains("revealed")) {
            element.classList.add("revealed");
        }
    });
};

/** 过滤并高亮搜索结果 */
export const filterLinks = (query: string): void => {
    const trimmedQuery = query.trim();
    const terms = parseTerms(trimmedQuery);

    if (terms.length === 0) {
        showAllIcons();
        return;
    }

    getNavContainer()?.classList.add("is-searching");
    forceRevealAll();

    let totalMatches = 0;

    getCategories().forEach((catElement) => {
        let matchCount = 0;
        const categoryTitleElement = catElement.querySelector<HTMLElement>(
            SELECTOR_CATEGORY_TITLE,
        );
        const titleTextElement =
            categoryTitleElement?.querySelector<HTMLElement>(
                SELECTOR_CATEGORY_TITLE_TEXT,
            ) ?? categoryTitleElement;
        const categoryTitle = getCategorySearchTitle(
            catElement,
            titleTextElement,
        );

        catElement.querySelectorAll(SELECTOR_CARD).forEach((card) => {
            const cardElement = card as HTMLElement;
            const li = cardElement.closest("li");
            const searchText = getCardSearchText(cardElement);
            const matches = cardMatches(searchText, categoryTitle, terms);

            li?.classList.toggle("search-hidden-item", !matches);

            const nameElement = cardElement.querySelector<HTMLElement>(
                SELECTOR_CARD_TEXT,
            );
            if (nameElement) {
                highlightElement(nameElement, matches ? terms : []);
            }

            if (matches) {
                matchCount += 1;
                totalMatches += 1;
                updateCardDetails(cardElement, terms);
            } else {
                clearCardDetails(cardElement);
            }
        });

        if (titleTextElement) {
            highlightElement(titleTextElement, terms);
        }

        if (categoryTitleElement) {
            setCategoryCount(categoryTitleElement, matchCount);
        }

        (catElement as HTMLElement).classList.toggle(
            "search-no-results",
            matchCount === 0,
        );
    });

    updateSearchFeedback(totalMatches, trimmedQuery);
};

/** 恢复所有图标显示并清除搜索状态 */
export const showAllIcons = (): void => {
    clearAllHighlights();
    getNavContainer()?.classList.remove("is-searching");

    getCategories().forEach((catElement) => {
        (catElement as HTMLElement).classList.remove("search-no-results");

        catElement.querySelectorAll("li").forEach((li) => {
            li.classList.remove("search-hidden-item");
        });

        const categoryTitleElement = catElement.querySelector<HTMLElement>(
            SELECTOR_CATEGORY_TITLE,
        );
        categoryTitleElement
            ?.querySelectorAll(".search-category-count")
            .forEach((badge) => badge.remove());
    });

    updateSearchFeedback(0, "");
};
