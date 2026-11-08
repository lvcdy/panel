const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 稳定的 32 位 FNV-1a 哈希，用于从内容生成默认数据 ID */
export const hashString = (value: string): string => {
    let hash = FNV_OFFSET_BASIS;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, FNV_PRIME);
    }

    return (hash >>> 0).toString(36);
};

const randomToken = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const uniqueId = (base: string, used: Set<string>): string => {
    let candidate = base;
    let suffix = 2;

    while (used.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }

    used.add(candidate);
    return candidate;
};

/**
 * 默认分类 ID 基于标题生成，不依赖数组下标。
 * 调整默认数据顺序不会改变已有 ID。
 */
export const createStableCategoryId = (title: string, used: Set<string>): string =>
    uniqueId(`cat-${hashString(title)}`, used);

/** 默认网站 ID 基于“分类标题 + URL”生成，同样不依赖下标 */
export const createStableLinkId = (
    categoryTitle: string,
    url: string,
    used: Set<string>,
): string => uniqueId(`link-${hashString(`${categoryTitle}|${url}`)}`, used);

export const createUserCategoryId = (used: Set<string>): string =>
    uniqueId(`cat-${randomToken()}`, used);

export const createUserLinkId = (used: Set<string>): string =>
    uniqueId(`link-${randomToken()}`, used);
