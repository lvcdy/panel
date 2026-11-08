import {
    escapeAttr,
    escapeHtml,
    getIconQueryUrl,
    isValidHttpUrl,
} from "../utils";
import type { PanelCategory, PanelConfig, PanelLink } from "./types";

export interface NavigationRenderOptions {
    editMode?: boolean;
    collapsedCategoryIds?: ReadonlySet<string>;
    animated?: boolean;
    /** 阶段 6 才启用拖拽/上下移动按钮 */
    sorting?: boolean;
    /** 阶段 5 才启用分类编辑、删除、排序按钮 */
    categoryManagement?: boolean;
}

const ICON_PATTERN = /^[A-Za-z0-9 _-]{1,100}$/;
const COLOR_PATTERN =
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const safeIcon = (value: string): string =>
    ICON_PATTERN.test(value) ? value : "fas fa-link";

const safeColor = (value: string): string =>
    COLOR_PATTERN.test(value) ? value : "#ffffff";

const safeUrl = (value: string): string =>
    isValidHttpUrl(value) ? value : "#";

const renderCardIcon = (link: PanelLink): string => {
    const color = escapeAttr(safeColor(link.color));
    const icon = escapeAttr(safeIcon(link.icon));

    if (link.useIcon === false) {
        return `<div class="card-icon w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden text-base"><div class="flex w-full h-full items-center justify-center" style="color:${color}" aria-hidden="true"><i class="${icon}"></i></div></div>`;
    }

    const iconUrl = escapeAttr(getIconQueryUrl(link.url));

    return `<div class="card-icon w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden text-base"><img src="${iconUrl}" alt="" loading="lazy" decoding="async" fetchpriority="low" class="icon-img w-6 h-6 object-contain transition-opacity opacity-0" data-fallback-icon /><div class="hidden w-full h-full items-center justify-center" style="color:${color}" aria-hidden="true"><i class="${icon}"></i></div></div>`;
};

const renderStatusBadge = (url: string): string => {
    const safeHref = escapeAttr(safeUrl(url));

    return `<span class="site-status-badge" data-site-status data-site-url="${safeHref}" data-state="checking" aria-label="正在检查网站状态" title="正在检查网站状态"><span class="site-status-dot" aria-hidden="true"></span><span data-site-status-label>检测中</span></span>`;
};

const renderFavorite = (link: PanelLink): string =>
    link.favorite
        ? `<i class="fas fa-star card-favorite" title="已收藏" aria-label="已收藏"></i>`
        : "";

const renderEditBadge = (): string =>
    `<span class="edit-badge">已隐藏</span>`;

const actionButton = (
    action: string,
    icon: string,
    label: string,
    dataAttribute: string,
    id: string,
    disabled = false,
): string => {
    const idAttr = escapeAttr(id);
    const disabledAttr = disabled ? ` disabled aria-disabled="true"` : "";
    return `<button type="button" class="edit-action-btn" data-action="${action}" ${dataAttribute}="${idAttr}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"${disabledAttr}><i class="fas ${icon}" aria-hidden="true"></i></button>`;
};

const renderLinkActions = (
    link: PanelLink,
    sorting: boolean,
    canMoveUp: boolean,
    canMoveDown: boolean,
): string => {
    const actions = [
        actionButton("edit-link", "fa-pen", "编辑网站", "data-link-id", link.id),
    ];

    if (sorting) {
        actions.push(
            actionButton(
                "move-link-up",
                "fa-arrow-up",
                "上移",
                "data-link-id",
                link.id,
                !canMoveUp,
            ),
            actionButton(
                "move-link-down",
                "fa-arrow-down",
                "下移",
                "data-link-id",
                link.id,
                !canMoveDown,
            ),
        );
    }

    actions.push(
        actionButton("delete-link", "fa-trash", "删除网站", "data-link-id", link.id),
    );

    return `<span class="edit-card-actions">${actions.join("")}</span>`;
};

const renderCategoryActions = (
    category: PanelCategory,
    management: boolean,
): string => {
    const actions = [
        actionButton("add-link", "fa-plus", "添加网站", "data-category-id", category.id),
    ];

    if (management) {
        actions.push(
            actionButton("edit-category", "fa-pen", "编辑分类", "data-category-id", category.id),
            actionButton("delete-category", "fa-trash", "删除分类", "data-category-id", category.id),
        );
    }

    return `<span class="category-header-actions">${actions.join("")}</span>`;
};

const renderToggleButton = (category: PanelCategory, collapsed: boolean): string => {
    const contentId = escapeAttr(`category-content-${category.id}`);

    return `<button type="button" class="category-toggle-btn group/toggle inline-flex items-center gap-1.5 text-xs tracking-wide text-white/40 hover:text-white/80 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer" aria-expanded="${collapsed ? "false" : "true"}" aria-controls="${contentId}"><span class="category-toggle-label opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-200">${collapsed ? "展开" : "收起"}</span><i class="fas fa-chevron-down category-toggle-icon text-[0.65rem] transition-transform duration-300" style="transform: rotate(${collapsed ? 180 : 0}deg)" aria-hidden="true"></i></button>`;
};

const renderLink = (
    link: PanelLink,
    category: PanelCategory,
    index: number,
    editMode: boolean,
    animated: boolean,
    sorting: boolean,
    canMoveUp: boolean,
    canMoveDown: boolean,
): string => {
    const color = escapeAttr(safeColor(link.color));
    const url = escapeAttr(safeUrl(link.url));
    const name = escapeHtml(link.name);
    const categoryId = escapeAttr(category.id);
    const linkId = escapeAttr(link.id);
    const style = animated
        ? `--card-color: ${color}; animation-delay: ${index * 50 + 100}ms`
        : `--card-color: ${color}`;
    const animationClass = animated ? " animate-fade-in-up" : "";
    const hiddenBadge = editMode && !link.visible ? renderEditBadge() : "";
    const searchText = [link.name, link.url, link.description, ...link.tags]
        .join(" ")
        .toLowerCase();
    const titleParts = [link.name];
    if (link.description) titleParts.push(link.description);
    if (link.tags.length > 0) {
        titleParts.push(link.tags.map((tag) => `#${tag}`).join(" "));
    }
    const title = escapeAttr(titleParts.join(" · "));
    const tooltip = escapeAttr(`访问 ${link.name}`);
    const searchAttr = escapeAttr(searchText);
    const descriptionAttr = escapeAttr(link.description);
    const favorite = renderFavorite(link);
    const tagChips = link.tags
        .map(
            (tag) =>
                `<span class="card-search-tag" data-card-tag hidden>#${escapeHtml(tag)}</span>`,
        )
        .join("");
    const searchDetails = `<span class="card-search-details" data-search-details>${tagChips}<span class="card-search-desc" data-card-desc hidden></span></span>`;

    if (editMode) {
        const dragHandle = sorting
            ? `<span class="edit-drag-handle" draggable="true" data-drag-handle aria-hidden="true" title="拖拽排序"><i class="fas fa-grip-vertical"></i></span>`
            : "";
        const dropMarker = sorting
            ? `<span class="drop-marker" aria-hidden="true"></span>`
            : "";
        const categoryBadge = `<span class="edit-category-badge" title="${escapeAttr(`所属分类：${category.title}`)}">${escapeHtml(category.title)}</span>`;

        return `<li data-link-id="${linkId}" data-category-id="${categoryId}"><div class="sun-card glass edit-card flex items-center gap-3 p-3 rounded-xl group relative h-full${link.visible ? "" : " edit-hidden-link"}" data-link-id="${linkId}" data-category-id="${categoryId}" data-url="${url}" data-search-text="${searchAttr}" data-description="${descriptionAttr}" title="${title}">${dragHandle}${renderCardIcon(link)}<span data-card-text class="flex-1 min-w-0 text-white/85 font-semibold text-sm truncate transition-colors duration-200 group-hover:text-white">${name}</span>${categoryBadge}${favorite}${hiddenBadge}${renderLinkActions(link, sorting, canMoveUp, canMoveDown)}${dropMarker}</div></li>`;
    }

    const targetAttrs = link.openInNewTab
        ? ` target="_blank" rel="noopener noreferrer"`
        : "";
    const statusBadge = link.status !== false ? renderStatusBadge(link.url) : "";

    return `<li data-link-id="${linkId}" data-category-id="${categoryId}"><a href="${url}"${targetAttrs} class="sun-card glass flex items-center gap-3 p-3 rounded-xl group relative${animationClass} h-full" style="${style}" data-url="${url}" data-link-id="${linkId}" data-category-id="${categoryId}" data-tooltip="${tooltip}" data-search-text="${searchAttr}" data-description="${descriptionAttr}" title="${title}">${renderCardIcon(link)}<span data-card-text class="flex-1 min-w-0 text-white/85 font-semibold text-sm truncate transition-colors duration-200 group-hover:text-white">${name}</span>${favorite}${searchDetails}${statusBadge}</a></li>`;
};

const renderAddLinkTile = (category: PanelCategory): string => {
    const categoryId = escapeAttr(category.id);
    return `<li class="add-link-tile"><button type="button" class="add-link-btn" data-action="add-link" data-category-id="${categoryId}"><i class="fas fa-plus" aria-hidden="true"></i><span>添加网站</span></button></li>`;
};

const renderCategory = (
    category: PanelCategory,
    options: Required<NavigationRenderOptions>,
): string => {
    const collapsed = options.editMode
        ? false
        : options.collapsedCategoryIds.has(category.id);
    const links = options.editMode
        ? category.links
        : category.links.filter((link) => link.visible !== false);
    const categoryId = escapeAttr(category.id);
    const title = escapeHtml(category.title);
    const contentId = escapeAttr(`category-content-${category.id}`);
    const titleId = escapeAttr(`category-title-${category.id}`);
    const sectionClasses = ["mb-6", "category-section"];
    if (options.animated) sectionClasses.push("will-reveal");
    if (collapsed) sectionClasses.push("category-collapsed");
    if (options.editMode && !category.visible) {
        sectionClasses.push("edit-hidden-category");
    }

    const categoryIcon = category.icon
        ? `<i class="${escapeAttr(safeIcon(category.icon))} category-icon" aria-hidden="true"></i>`
        : "";
    const categoryDragHandle =
        options.editMode && options.sorting
            ? `<span class="edit-drag-handle category-drag-handle" draggable="true" data-category-drag-handle aria-hidden="true" title="拖拽分类"><i class="fas fa-grip-vertical"></i></span>`
            : "";
    const hiddenBadge =
        options.editMode && !category.visible ? renderEditBadge() : "";
    const actions = options.editMode
        ? renderCategoryActions(category, options.categoryManagement)
        : "";
    const toggle = renderToggleButton(category, collapsed);
    const linkHtml = links
        .map((link, index) =>
            renderLink(
                link,
                category,
                index,
                options.editMode,
                options.animated,
                options.sorting,
                index > 0,
                index < links.length - 1,
            ),
        )
        .join("");
    const addTile = options.editMode ? renderAddLinkTile(category) : "";

    return `<section class="${sectionClasses.join(" ")}" data-collapsed="${collapsed ? "true" : "false"}" data-category-id="${categoryId}" data-category-title="${escapeAttr(category.title)}" aria-labelledby="${titleId}"><h2 id="${titleId}" class="text-xl font-bold mb-3 pl-2 drop-shadow-md category-header flex flex-wrap items-center justify-between gap-3"><span class="category-heading flex items-center gap-2 min-w-0">${categoryDragHandle}${categoryIcon}${hiddenBadge}<span class="category-title" data-category-title><span data-category-title-text>${title}</span></span></span><span class="category-header-end flex items-center gap-1 flex-wrap justify-end">${actions}${toggle}</span></h2><div class="category-wrapper grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"><ul id="${contentId}" class="category-content list-none p-0 m-0" data-category-content="${categoryId}">${linkHtml}${addTile}</ul></div></section>`;
};

const renderNavigationEmptyState = (editMode: boolean): string => {
    const title = editMode ? "还没有分类" : "还没有可显示的导航";
    const hint = editMode
        ? "当前没有分类，暂时无法添加网站。"
        : "打开右上角设置，进入编辑模式添加网站或分类。";

    return `<div class="navigation-empty-state"><i class="fas fa-compass" aria-hidden="true"></i><p>${title}</p><p class="navigation-empty-hint">${hint}</p></div>`;
};

export const renderNavigationHtml = (
    config: PanelConfig,
    options: NavigationRenderOptions = {},
): string => {
    const resolved: Required<NavigationRenderOptions> = {
        editMode: options.editMode ?? false,
        collapsedCategoryIds: options.collapsedCategoryIds ?? new Set<string>(),
        animated: options.animated ?? true,
        sorting: options.sorting ?? false,
        categoryManagement: options.categoryManagement ?? false,
    };

    const categories = resolved.editMode
        ? config.categories
        : config.categories.filter((category) => category.visible !== false);

    if (categories.length === 0) {
        return renderNavigationEmptyState(resolved.editMode);
    }

    return categories
        .map((category) => renderCategory(category, resolved))
        .join("");
};
