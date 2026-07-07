import {
  buildSearchUrl,
  clearCustomSearchEngine,
  getSavedCustomSearchEngine,
  setCustomSearchEngine,
} from "../lib/custom-engine";
import { GOOGLE_SVG_ICON, DEFAULT_SEARCH_URL } from "../lib/config";
import { isValidHttpUrl } from "../lib/utils";
import * as UI from "../lib";

/** 初始化搜索引擎选择、自定义引擎模态框、搜索输入 */
export const initSearch = (els: ReturnType<typeof UI.createElementCache>) => {
  const customEngineItem = document.getElementById("custom-engine-item");
  const customEngineName = document.getElementById("custom-engine-menu-name");
  const addCustomEngineBtn = document.getElementById("add-custom-engine-btn");
  const addCustomEngineLabel = document.getElementById("add-custom-engine-label");
  const customEngineModal = document.getElementById("custom-engine-modal");
  const customEngineModalOverlay = document.getElementById("custom-engine-modal-overlay");
  const customEngineModalClose = document.getElementById("custom-engine-modal-close");
  const customEngineNameInput = document.getElementById("custom-engine-name-input") as HTMLInputElement | null;
  const customEngineUrlInput = document.getElementById("custom-engine-url-input") as HTMLInputElement | null;
  const customEnginePlaceholderInput = document.getElementById("custom-engine-placeholder-input") as HTMLInputElement | null;
  const customEngineSaveBtn = document.getElementById("custom-engine-save-btn");
  const customEngineClearBtn = document.getElementById("custom-engine-clear-btn");

  let searchUrl: string = DEFAULT_SEARCH_URL;

  const applyEngineVisual = (iconClass: string, color: string, placeholder: string) => {
    if (placeholder) UI.setEnginePlaceholder(placeholder);
    if (!els.icon) return;

    if (iconClass === "fab fa-google") {
      els.icon.className = "";
      els.icon.style.color = "";
      els.icon.innerHTML = GOOGLE_SVG_ICON;
      return;
    }

    els.icon.innerHTML = "";
    els.icon.className = `${iconClass} text-xl transition-all`;
    els.icon.style.color = color;
  };

  const syncCustomEngineItem = () => {
    if (!customEngineItem || !els.menu) return;

    const config = getSavedCustomSearchEngine();

    if (!config) {
      const isActive = customEngineItem.classList.contains("active");
      customEngineItem.classList.add("hidden");
      (customEngineItem as HTMLElement).dataset.url = "";
      (customEngineItem as HTMLElement).dataset.placeholder = "";
      if (customEngineName) customEngineName.textContent = "自定义";
      if (addCustomEngineLabel) addCustomEngineLabel.textContent = "添加搜索引擎";

      if (isActive) {
        const firstEngine = els.menu.querySelector(".engine-item:not(.hidden)") as HTMLElement | null;
        firstEngine?.click();
      }
      return;
    }

    customEngineItem.classList.remove("hidden");
    (customEngineItem as HTMLElement).dataset.url = config.url;
    (customEngineItem as HTMLElement).dataset.placeholder = config.placeholder;
    if (customEngineName) customEngineName.textContent = config.name;
    if (addCustomEngineLabel) addCustomEngineLabel.textContent = "编辑搜索引擎";
  };

  const openCustomEngineModal = () => {
    const config = getSavedCustomSearchEngine();
    if (customEngineNameInput) customEngineNameInput.value = config?.name || "";
    if (customEngineUrlInput) customEngineUrlInput.value = config?.url || "";
    if (customEnginePlaceholderInput) customEnginePlaceholderInput.value = config?.placeholder || "";

    if (customEngineModal) {
      customEngineModal.classList.remove("hidden");
      customEngineModal.setAttribute("aria-hidden", "false");
    }
    customEngineUrlInput?.focus();
  };

  const closeCustomEngineModal = () => {
    if (customEngineModal) {
      customEngineModal.classList.add("hidden");
      customEngineModal.setAttribute("aria-hidden", "true");
    }
  };

  const emitCustomEngineUpdated = () => {
    window.dispatchEvent(new CustomEvent("custom-search-engine:updated"));
  };

  const doSearch = () => {
    if (els.input?.value.trim()) {
      window.open(
        buildSearchUrl(searchUrl, els.input.value.trim()),
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      UI.showSearchTip(els.searchTip);
    }
  };

  // ── 自定义引擎模态框 ──
  syncCustomEngineItem();
  window.addEventListener("custom-search-engine:updated", syncCustomEngineItem);

  addCustomEngineBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    els.menu?.classList.add("hidden");
    els.engineBtn?.setAttribute("aria-expanded", "false");
    openCustomEngineModal();
  });

  customEngineModalClose?.addEventListener("click", closeCustomEngineModal);
  customEngineModalOverlay?.addEventListener("click", closeCustomEngineModal);

  customEngineSaveBtn?.addEventListener("click", () => {
    const name = customEngineNameInput?.value.trim() || "";
    const url = customEngineUrlInput?.value.trim() || "";
    const placeholder = customEnginePlaceholderInput?.value.trim() || "";

    if (!url) {
      window.alert("请输入自定义搜索引擎 URL");
      return;
    }

    if (!isValidHttpUrl(url)) {
      window.alert("请输入有效的 http/https 搜索引擎 URL");
      return;
    }

    setCustomSearchEngine({
      name: name || "自定义",
      url,
      placeholder: placeholder || "🔎 输入关键词开始搜索...",
    });

    emitCustomEngineUpdated();
    closeCustomEngineModal();
  });

  customEngineClearBtn?.addEventListener("click", () => {
    clearCustomSearchEngine();
    emitCustomEngineUpdated();
    closeCustomEngineModal();
  });

  [customEngineNameInput, customEngineUrlInput, customEnginePlaceholderInput].forEach((el) => {
    el?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        customEngineSaveBtn?.click();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeCustomEngineModal();
      }
    });
  });

  // ── 搜索引擎选择 & 输入 ──
  UI.setupEngineButtonHandler(els.engineBtn, els.menu);
  UI.setupEngineItemHandlers(
    els.menu,
    els.input,
    (url: string, iconClass: string, color: string, placeholder: string) => {
      searchUrl = url;
      applyEngineVisual(iconClass, color, placeholder);
    },
  );

  UI.setupInputHandlers(
    els.input,
    els.searchTip,
    () => doSearch(),
    (query) => UI.filterLinks(query),
  );

  UI.setupSearchButtonHandler(els.searchBtn, () => doSearch());
  UI.setupDocumentClickHandler(els.menu);

  // ── 全局键盘快捷键 ──
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement === document.body) {
      event.preventDefault();
      els.input?.focus();
    }
  });
};
