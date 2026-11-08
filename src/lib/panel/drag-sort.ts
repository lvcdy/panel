import { showToast } from "../toast";
import {
    getPanelConfig,
    moveCategoryTo,
    moveLinkTo,
    subscribePanelConfig,
} from "./store";
import type { PanelConfig } from "./types";
import { isNavigationEditMode } from "./view";

type DragState =
    | { type: "link"; linkId: string; card: HTMLElement }
    | { type: "category"; categoryId: string; section: HTMLElement };

type LinkDropTarget =
    | {
          type: "link";
          targetCategoryId: string;
          targetLinkId: string;
          after: boolean;
      }
    | { type: "append"; targetCategoryId: string };

type CategoryDropTarget = {
    type: "category";
    targetCategoryId: string;
    after: boolean;
};

type DropTarget = LinkDropTarget | CategoryDropTarget;

interface LinkLocation {
    categoryId: string;
    categoryIndex: number;
    index: number;
}

let initialized = false;
let dragState: DragState | null = null;
let dropTarget: DropTarget | null = null;

const getSearchQuery = (): string =>
    (document.getElementById("searchInput") as HTMLInputElement | null)?.value
        .trim() ?? "";

const findLinkLocation = (
    config: PanelConfig,
    linkId: string,
): LinkLocation | null => {
    for (let categoryIndex = 0; categoryIndex < config.categories.length; categoryIndex += 1) {
        const category = config.categories[categoryIndex];
        if (!category) continue;

        const index = category.links.findIndex((link) => link.id === linkId);
        if (index !== -1) {
            return { categoryId: category.id, categoryIndex, index };
        }
    }

    return null;
};

const clearDropTargets = (): void => {
    document
        .querySelectorAll<HTMLElement>(".edit-card.drop-before, .edit-card.drop-after")
        .forEach((element) => {
            element.classList.remove("drop-before", "drop-after");
        });

    document
        .querySelectorAll<HTMLElement>(".category-section.drop-before, .category-section.drop-after")
        .forEach((element) => {
            element.classList.remove("drop-before", "drop-after");
        });

    document
        .querySelectorAll<HTMLElement>(".category-content.is-link-drop-target")
        .forEach((element) => {
            element.classList.remove("is-link-drop-target");
        });
};

const clearDragVisuals = (): void => {
    clearDropTargets();
    document
        .querySelectorAll<HTMLElement>(".is-dragging, .is-dragging-category")
        .forEach((element) => {
            element.classList.remove("is-dragging", "is-dragging-category");
        });
};

const resetDrag = (): void => {
    dragState = null;
    dropTarget = null;
    clearDragVisuals();
};

const computeLinkTargetIndex = (
    config: PanelConfig,
    linkId: string,
    target: LinkDropTarget,
): number | null => {
    const source = findLinkLocation(config, linkId);
    if (!source) return null;

    const targetCategory = config.categories.find(
        (category) => category.id === target.targetCategoryId,
    );
    if (!targetCategory) return null;

    const sameCategory = source.categoryId === targetCategory.id;
    const targetLengthAfterRemoval = sameCategory
        ? Math.max(0, targetCategory.links.length - 1)
        : targetCategory.links.length;

    if (target.type === "append") {
        return targetLengthAfterRemoval;
    }

    const targetIndex = targetCategory.links.findIndex(
        (link) => link.id === target.targetLinkId,
    );
    if (targetIndex === -1) return null;

    const insertPos = targetIndex + (target.after ? 1 : 0);
    const finalIndex = sameCategory
        ? insertPos - (source.index < insertPos ? 1 : 0)
        : insertPos;

    return Math.max(0, Math.min(finalIndex, targetLengthAfterRemoval));
};

const computeCategoryTargetIndex = (
    config: PanelConfig,
    categoryId: string,
    target: CategoryDropTarget,
): number | null => {
    const sourceIndex = config.categories.findIndex(
        (category) => category.id === categoryId,
    );
    const targetIndex = config.categories.findIndex(
        (category) => category.id === target.targetCategoryId,
    );

    if (sourceIndex === -1 || targetIndex === -1) return null;

    const insertPos = targetIndex + (target.after ? 1 : 0);
    const finalIndex = insertPos - (sourceIndex < insertPos ? 1 : 0);
    const maxIndex = Math.max(0, config.categories.length - 1);

    return Math.max(0, Math.min(finalIndex, maxIndex));
};

const handleDragStart = (event: DragEvent): void => {
    if (!isNavigationEditMode()) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    if (getSearchQuery()) {
        event.preventDefault();
        showToast("请先清除搜索过滤再排序", "info", 3000);
        return;
    }

    const linkHandle = target.closest("[data-drag-handle]");
    const categoryHandle = target.closest("[data-category-drag-handle]");

    if (linkHandle) {
        const card = linkHandle.closest<HTMLElement>(".edit-card");
        const linkId = card?.dataset.linkId;
        if (!card || !linkId) return;

        dragState = { type: "link", linkId, card };
        dropTarget = null;
        card.classList.add("is-dragging");

        if (event.dataTransfer) {
            try {
                event.dataTransfer.effectAllowed = "move";
            } catch {
                // Synthetic drag events may restrict effectAllowed.
            }
            event.dataTransfer.setData("text/plain", linkId);
            event.dataTransfer.setData("application/x-panel-link", linkId);
            try {
                event.dataTransfer.setDragImage(
                    card,
                    Math.min(card.offsetWidth / 2, 120),
                    26,
                );
            } catch {
                // Synthetic drag events may not support setDragImage.
            }
        }
        return;
    }

    if (categoryHandle) {
        const section = categoryHandle.closest<HTMLElement>(".category-section");
        const categoryId = section?.dataset.categoryId;
        if (!section || !categoryId) return;

        dragState = { type: "category", categoryId, section };
        dropTarget = null;
        section.classList.add("is-dragging-category");

        if (event.dataTransfer) {
            try {
                event.dataTransfer.effectAllowed = "move";
            } catch {
                // Synthetic drag events may restrict effectAllowed.
            }
            event.dataTransfer.setData("text/plain", categoryId);
            event.dataTransfer.setData("application/x-panel-category", categoryId);
            const header = section.querySelector<HTMLElement>(".category-header");
            try {
                event.dataTransfer.setDragImage(
                    header ?? section,
                    40,
                    24,
                );
            } catch {
                // Synthetic drag events may not support setDragImage.
            }
        }
    }
};

const handleDragOver = (event: DragEvent): void => {
    if (!dragState) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    clearDropTargets();

    if (dragState.type === "link") {
        const card = target.closest<HTMLElement>(".edit-card");

        if (card) {
            const targetLinkId = card.dataset.linkId;
            const targetCategoryId = card.dataset.categoryId;

            if (
                !targetLinkId ||
                !targetCategoryId ||
                targetLinkId === dragState.linkId
            ) {
                dropTarget = null;
                return;
            }

            const rect = card.getBoundingClientRect();
            const after = event.clientX >= rect.left + rect.width / 2;
            dropTarget = {
                type: "link",
                targetCategoryId,
                targetLinkId,
                after,
            };
            card.classList.add(after ? "drop-after" : "drop-before");
            event.preventDefault();
            if (event.dataTransfer) {
                try {
                    event.dataTransfer.dropEffect = "move";
                } catch {
                    // Synthetic drag events may restrict dropEffect.
                }
            }
            return;
        }

        const section = target.closest<HTMLElement>(".category-section");
        const targetCategoryId = section?.dataset.categoryId;

        if (section && targetCategoryId) {
            dropTarget = { type: "append", targetCategoryId };
            section
                .querySelector<HTMLElement>(".category-content")
                ?.classList.add("is-link-drop-target");
            event.preventDefault();
            if (event.dataTransfer) {
                try {
                    event.dataTransfer.dropEffect = "move";
                } catch {
                    // Synthetic drag events may restrict dropEffect.
                }
            }
            return;
        }

        dropTarget = null;
        return;
    }

    const section = target.closest<HTMLElement>(".category-section");
    const targetCategoryId = section?.dataset.categoryId;

    if (
        !section ||
        !targetCategoryId ||
        targetCategoryId === dragState.categoryId
    ) {
        dropTarget = null;
        return;
    }

    const rect = section.getBoundingClientRect();
    const after = event.clientY >= rect.top + rect.height / 2;
    dropTarget = {
        type: "category",
        targetCategoryId,
        after,
    };
    section.classList.add(after ? "drop-after" : "drop-before");
    event.preventDefault();
    if (event.dataTransfer) {
        try {
            event.dataTransfer.dropEffect = "move";
        } catch {
            // Synthetic drag events may restrict dropEffect.
        }
    }
};

const handleDragLeave = (event: DragEvent): void => {
    const grid = event.currentTarget;
    const related = event.relatedTarget;

    if (grid instanceof Node && related instanceof Node && grid.contains(related)) {
        return;
    }

    clearDropTargets();
    dropTarget = null;
};

const handleDrop = (event: DragEvent): void => {
    if (!dragState || !dropTarget) {
        resetDrag();
        return;
    }

    event.preventDefault();

    const state = dragState;
    const target = dropTarget;
    const config = getPanelConfig();

    try {
        if (state.type === "link") {
            const finalIndex = computeLinkTargetIndex(
                config,
                state.linkId,
                target as LinkDropTarget,
            );

            if (finalIndex === null) {
                showToast("目标位置已变化，请重新拖拽", "error", 4000);
                return;
            }

            const result = moveLinkTo(
                state.linkId,
                target.targetCategoryId,
                finalIndex,
            );

            if (!result.ok) {
                showToast(result.message, "error", 5000);
            }
            return;
        }

        const finalIndex = computeCategoryTargetIndex(
            config,
            state.categoryId,
            target as CategoryDropTarget,
        );

        if (finalIndex === null) {
            showToast("目标位置已变化，请重新拖拽", "error", 4000);
            return;
        }

        const result = moveCategoryTo(state.categoryId, finalIndex);

        if (!result.ok) {
            showToast(result.message, "error", 5000);
        }
    } finally {
        resetDrag();
    }
};

const handleDragEnd = (): void => {
    resetDrag();
};

export const initDragSort = (): void => {
    if (initialized || typeof document === "undefined") return;

    const grid = document.getElementById("linkGrid");
    if (!grid) return;

    initialized = true;

    grid.addEventListener("dragstart", handleDragStart);
    grid.addEventListener("dragover", handleDragOver);
    grid.addEventListener("dragleave", handleDragLeave);
    grid.addEventListener("drop", handleDrop);
    grid.addEventListener("dragend", handleDragEnd);

    subscribePanelConfig((_config, change) => {
        if (
            dragState &&
            change.source === "remote" &&
            change.categoriesChanged
        ) {
            dragState = null;
            dropTarget = null;
            clearDragVisuals();
            showToast(
                "配置已在其他标签页更新，当前拖拽已取消，请重新操作",
                "info",
                4200,
            );
        }
    });
};
