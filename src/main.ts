import "./styles/global.css";

import { CATEGORIES, SEARCH_ENGINES, type LinkItem } from "./data/links";
import { initBackgroundImage } from "./lib/background";
import {
  buildSearchUrl,
  clearCustomSearchEngine,
  getSavedCustomSearchEngine,
  setCustomSearchEngine,
} from "./lib/custom-engine";
import { GOOGLE_SVG_ICON, ICON_API } from "./lib/config";
import { fetchAndDetectProvider } from "./lib/provider";
import { initSettings } from "./lib/settings";
import { isValidHttpUrl } from "./lib/url";
import * as UI from "./lib/main";

const profileConfig = { name: "与众不同的糖" } as const;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeAttr = escapeHtml;

const renderHeader = () => `
  <header class="mt-10 sm:mt-14 text-center select-none">
    <h1 class="sr-only">Panel</h1>
    <div
      id="clock"
      class="text-6xl font-bold tracking-tight drop-shadow-2xl animate-fade-in-up"
      aria-label="当前时间"
      role="timer"
    >
      --:--:--
    </div>
    <p
      id="date"
      class="text-lg font-medium opacity-90 mt-0.5 animate-fade-in-up"
      style="animation-delay: 120ms"
    >
      载入中...
    </p>
    <div
      id="weather-info"
      class="mt-3 info-capsule"
      role="button"
      tabindex="0"
      aria-label="点击刷新天气"
    >
      <i class="fas fa-cloud-sun capsule-icon" aria-hidden="true"></i>
      <span class="capsule-dot" aria-hidden="true"></span>
      <span id="weather-text" class="capsule-text">正在同步天气数据...</span>
    </div>
  </header>
`;

const renderEngineIcon = (engineId: string, icon: string, color: string) => {
  if (engineId === "google") {
    return GOOGLE_SVG_ICON;
  }

  return `
    <i
      class="${escapeAttr(icon)} text-sm"
      style="color: ${escapeAttr(color)}"
      aria-hidden="true"
    ></i>
  `;
};

const renderSearchEngineItem = (
  engine: (typeof SEARCH_ENGINES)[number],
  index: number,
) => `
  <div
    class="engine-item group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-white/80${index === 0 ? " active" : ""}"
    data-url="${escapeAttr(engine.url)}"
    data-icon="${escapeAttr(engine.icon)}"
    data-color="${escapeAttr(engine.color)}"
    data-placeholder="${escapeAttr(engine.placeholder)}"
    role="option"
    tabindex="0"
    aria-selected="${index === 0 ? "true" : "false"}"
  >
    <span
      class="engine-icon-wrap w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200"
      style="background: ${escapeAttr(engine.color)}15"
    >
      ${renderEngineIcon(engine.id, engine.icon, engine.color)}
    </span>
    <span class="flex-1 truncate">${escapeHtml(engine.name)}</span>
    <i
      class="fas fa-check text-[10px] opacity-0 transition-opacity duration-150 engine-check"
      aria-hidden="true"
    ></i>
  </div>
`;

const renderSearch = () => `
  <search
    class="mt-6 sm:mt-8 w-full max-w-[680px] px-4 sm:px-6 relative animate-fade-in-up z-20"
    style="animation-delay: 200ms"
  >
    <div
      class="search-container flex items-center h-12 rounded-full px-1.5"
      role="search"
    >
      <button
        type="button"
        id="engineBtn"
        class="search-engine-btn w-10 h-10 flex items-center justify-center rounded-full cursor-pointer shrink-0"
        aria-label="选择搜索引擎"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <i
          id="currentIcon"
          class="fab fa-microsoft text-lg transition-all"
          style="color: #00a4ef"
          aria-hidden="true"
        ></i>
      </button>
      <div class="search-divider"></div>
      <input
        type="search"
        id="searchInput"
        placeholder="搜索一下..."
        class="bg-transparent flex-grow h-full px-3 outline-none placeholder-white/30 text-sm font-medium tracking-wide"
        autocomplete="off"
        aria-label="搜索"
      />
      <button
        type="button"
        id="searchBtn"
        class="search-go-btn w-10 h-10 flex items-center justify-center rounded-full cursor-pointer shrink-0"
        aria-label="执行搜索"
      >
        <i class="fas fa-arrow-right text-sm" aria-hidden="true"></i>
      </button>
    </div>
    <div
      id="searchTip"
      class="mt-2.5 text-center text-red-400/80 text-xs opacity-0 transition-opacity duration-300"
      role="alert"
      aria-live="polite"
    >
      请输入搜索内容
    </div>
    <div id="searchFeedback" class="search-feedback hidden" aria-live="polite"></div>
    <div
      id="engineMenu"
      class="engine-menu absolute top-full left-4 sm:left-6 w-52 rounded-2xl hidden flex-col z-50 overflow-hidden mt-3 p-1.5"
      role="listbox"
      aria-label="搜索引擎列表"
    >
      ${SEARCH_ENGINES.map(renderSearchEngineItem).join("")}
      <div
        id="custom-engine-item"
        class="engine-item group relative hidden items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-white/80"
        data-custom-engine="true"
        data-url=""
        data-icon="fas fa-magnifying-glass"
        data-color="#f59e0b"
        data-placeholder="🔎 输入关键词开始搜索..."
        role="option"
        tabindex="0"
        aria-selected="false"
      >
        <span
          class="engine-icon-wrap w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200"
          style="background: #f59e0b15"
        >
          <i
            class="fas fa-magnifying-glass text-sm"
            style="color: #f59e0b"
            aria-hidden="true"
          ></i>
        </span>
        <span id="custom-engine-menu-name" class="flex-1 truncate">自定义</span>
        <i
          class="fas fa-check text-[10px] opacity-0 transition-opacity duration-150 engine-check"
          aria-hidden="true"
        ></i>
      </div>
      <button
        id="add-custom-engine-btn"
        type="button"
        class="engine-action-item mt-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors"
        aria-label="添加搜索引擎"
      >
        <span
          class="engine-icon-wrap w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200"
          style="background: rgba(255, 255, 255, 0.1)"
        >
          <i class="fas fa-plus text-sm" aria-hidden="true"></i>
        </span>
        <span id="add-custom-engine-label" class="flex-1 text-left">添加搜索引擎</span>
        <i
          class="fas fa-chevron-right text-[10px] opacity-70"
          aria-hidden="true"
        ></i>
      </button>
    </div>

    <div
      id="custom-engine-modal"
      class="fixed inset-0 z-50 hidden"
      aria-hidden="true"
    >
      <div
        id="custom-engine-modal-overlay"
        class="absolute inset-0 bg-transparent"
      ></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div
          class="w-full max-w-md rounded-2xl border border-white/15 bg-black/65 backdrop-blur-xl p-5 shadow-2xl"
          role="dialog"
          aria-labelledby="custom-engine-modal-title"
        >
          <div class="flex items-center justify-between mb-4">
            <h3
              id="custom-engine-modal-title"
              class="text-base font-semibold text-white"
            >
              配置搜索引擎
            </h3>
            <button
              id="custom-engine-modal-close"
              type="button"
              class="h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="关闭"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <div class="flex flex-col gap-3">
            <input
              id="custom-engine-name-input"
              type="text"
              class="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/40"
              placeholder="引擎名称（可选）"
            />
            <input
              id="custom-engine-url-input"
              type="url"
              class="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/40"
              placeholder="https://example.com/search?q= 或 https://example.com/search?q={q}"
            />
            <input
              id="custom-engine-placeholder-input"
              type="text"
              class="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/40"
              placeholder="搜索框提示语（可选）"
            />
          </div>

          <div class="mt-4 flex gap-2">
            <button
              id="custom-engine-save-btn"
              type="button"
              class="flex-1 h-9 rounded-lg border border-white/20 bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors"
            >
              保存
            </button>
            <button
              id="custom-engine-clear-btn"
              type="button"
              class="h-9 px-3 rounded-lg border border-white/20 bg-white/5 text-white/90 text-sm hover:bg-white/10 transition-colors"
            >
              恢复默认
            </button>
          </div>
        </div>
      </div>
    </div>
  </search>
`;

const renderLinkIcon = (link: LinkItem) => {
  const fallbackIcon = `
    <div
      class="${link.useIcon === false ? "flex" : "hidden"} w-full h-full items-center justify-center"
      style="color:${escapeAttr(link.color)}"
      aria-hidden="true"
    >
      <i class="${escapeAttr(link.icon)}"></i>
    </div>
  `;

  if (link.useIcon === false) {
    return fallbackIcon;
  }

  return `
    <img
      src="${escapeAttr(ICON_API + link.url)}"
      alt="${escapeAttr(`${link.name} 图标`)}"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      crossorigin="anonymous"
      class="icon-img w-6 h-6 object-contain transition-opacity opacity-0"
      data-fallback-icon
    />
    ${fallbackIcon}
  `;
};

const renderLinkCard = (link: LinkItem, index: number) => `
  <li>
    <a
      href="${escapeAttr(link.url)}"
      target="_blank"
      rel="noopener noreferrer"
      class="sun-card glass flex items-center gap-3 p-3 rounded-xl group relative animate-fade-in-up h-full"
      style="--card-color: ${escapeAttr(link.color)}; animation-delay: ${index * 50 + 100}ms"
      data-url="${escapeAttr(link.url)}"
      data-tooltip="访问 ${escapeAttr(link.name)}"
    >
      <div class="card-icon w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden text-base">
        ${renderLinkIcon(link)}
      </div>
      <span
        data-card-text
        class="flex-1 min-w-0 text-white/85 font-semibold text-sm truncate transition-colors duration-200 group-hover:text-white"
      >
        ${escapeHtml(link.name)}
      </span>
      <span
        class="status-indicator absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white/20 transition-all"
        data-tooltip="检测中..."
        aria-hidden="true"
      ></span>
    </a>
  </li>
`;

const renderLinkList = () => `
  <nav
    class="w-full max-w-[1500px] px-4 sm:px-10 mt-8 flex-grow"
    aria-label="链接导航"
  >
    ${CATEGORIES.map(
      (category, categoryIndex) => `
        <section
          class="mb-6 category-section will-reveal"
          data-collapsed="false"
          aria-labelledby="category-${categoryIndex}"
        >
          <h2
            id="category-${categoryIndex}"
            class="text-xl font-bold mb-3 pl-2 drop-shadow-md category-header flex items-center justify-between gap-3"
          >
            <span class="category-title">${escapeHtml(category.title)}</span>
            <button
              type="button"
              class="category-toggle-btn group/toggle inline-flex items-center gap-1.5 text-xs tracking-wide text-white/40 hover:text-white/80 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-expanded="true"
              aria-controls="category-content-${categoryIndex}"
            >
              <span class="category-toggle-label opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-200">
                收起
              </span>
              <i
                class="fas fa-chevron-down category-toggle-icon text-[0.65rem] transition-transform duration-300"
                aria-hidden="true"
              ></i>
            </button>
          </h2>
          <div class="category-wrapper grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <ul
              id="category-content-${categoryIndex}"
              class="category-content list-none p-0 m-0"
            >
              ${category.links.map(renderLinkCard).join("")}
            </ul>
          </div>
        </section>
      `,
    ).join("")}
  </nav>
`;

const renderFooter = () => `
  <div
    class="border-t border-white/10 my-5 border-dashed mx-4 sm:mx-10 lg:mx-32 will-reveal"
  >
    <div class="animate-fade-in-up"></div>
  </div>

  <footer
    class="mb-8 flex flex-col items-center justify-center px-4 sm:px-6 py-5 select-none will-reveal"
  >
    <div
      class="text-white/60 text-[11px] sm:text-xs text-center leading-relaxed [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] animate-fade-in-up"
    >
      <div class="mb-1">
        &copy; <span id="footerYear"></span>
        <a
          href="https://blog.lvcdy.cn"
          target="_blank"
          rel="noopener noreferrer"
          class="font-bold text-white/80 hover:text-white hover:underline transition-colors"
        >
          ${escapeHtml(profileConfig.name)}
        </a>. All Rights Reserved.
      </div>

      <div class="mb-3 opacity-80">
        Powered by
        <a
          class="text-white hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
          href="https://vite.dev"
        >Vite</a>
        &
        <a
          class="text-white hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/lvcdy/panel"
        >Panel</a>
      </div>

      <div class="flex flex-col items-center gap-y-1.5 mb-4 text-white/50">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-white transition-all flex items-center gap-1.5"
        >
          <img
            src="https://ywtb.mps.gov.cn/authservice/images/foot-icp.png"
            class="w-3 h-3 brightness-110 opacity-80"
            alt="ICP"
            loading="lazy"
          />
          <span>辽 ICP 备 2025051495 号-2</span>
        </a>
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=21070002000117"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-white transition-all flex items-center gap-1.5"
        >
          <img
            src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png"
            class="w-3 h-3 brightness-110 opacity-80"
            alt="GWA"
            loading="lazy"
          />
          <span>辽公网安备 21070002000117 号</span>
        </a>
      </div>

      <div
        id="pro-info"
        class="info-capsule"
        role="button"
        tabindex="0"
        aria-label="点击查看服务提供商详情"
      >
        <i class="fas fa-server capsule-icon" aria-hidden="true"></i>
        <span class="capsule-dot" aria-hidden="true"></span>
        <span id="pro-name" class="capsule-text">正在同步服务数据...</span>
      </div>
    </div>
  </footer>
`;

const renderSettings = () => `
  <div class="settings-container">
    <button
      id="settings-toggle"
      class="settings-btn"
      aria-label="打开设置"
      aria-expanded="false"
      aria-controls="settings-panel"
    >
      <i class="fas fa-gear" aria-hidden="true"></i>
    </button>

    <div
      id="settings-panel"
      class="settings-panel"
      role="dialog"
      aria-labelledby="settings-title"
      aria-hidden="true"
    >
      <div class="settings-content">
        <div class="settings-header">
          <h2 id="settings-title" class="settings-title">设置</h2>
          <button
            id="settings-close"
            class="settings-close-btn"
            aria-label="关闭设置"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div class="settings-body">
          <div class="setting-item">
            <label for="blur-slider" class="setting-label">毛玻璃强弱</label>
            <div class="slider-container">
              <input
                id="blur-slider"
                type="range"
                min="0"
                max="100"
                value="18"
                class="blur-slider"
                aria-label="调节毛玻璃强弱"
              />
              <span id="blur-value" class="blur-value">18px</span>
            </div>
            <div class="slider-description">
              <span>弱</span>
              <span>强</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="saturate-slider" class="setting-label">饱和度</label>
            <div class="slider-container">
              <input
                id="saturate-slider"
                type="range"
                min="100"
                max="200"
                value="165"
                class="saturate-slider"
                aria-label="调节饱和度"
              />
              <span id="saturate-value" class="saturate-value">165%</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="bg-url-input" class="setting-label">
              自定义背景图 URL
            </label>
            <input
              id="bg-url-input"
              type="url"
              class="bg-url-input"
              placeholder="https://example.com/background.jpg"
              aria-label="输入自定义背景图 URL"
            />
            <div class="bg-actions">
              <button id="bg-url-apply" type="button" class="bg-action-btn">
                应用
              </button>
              <button
                id="bg-url-reset"
                type="button"
                class="bg-action-btn bg-action-btn-secondary"
              >
                恢复默认
              </button>
            </div>
          </div>

          <div class="setting-item">
            <label for="hitokoto-api-input" class="setting-label">
              自定义一言 API
            </label>
            <input
              id="hitokoto-api-input"
              type="url"
              class="bg-url-input"
              placeholder="https://example.com/hitokoto"
              aria-label="输入自定义一言 API"
            />
            <div class="bg-actions">
              <button id="hitokoto-api-apply" type="button" class="bg-action-btn">
                应用
              </button>
              <button
                id="hitokoto-api-reset"
                type="button"
                class="bg-action-btn bg-action-btn-secondary"
              >
                恢复默认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="settings-overlay" class="settings-overlay" aria-hidden="true"></div>
  </div>
`;

const renderFloatingControl = () => `
  <button
    type="button"
    id="floatingSearchBtn"
    class="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer opacity-0 transition-all duration-300 hover:bg-white/25 hover:scale-110 active:scale-95 z-40 shadow-2xl floating-action-btn"
    aria-label="返回顶部并聚焦搜索框"
    style="pointer-events: none;"
  >
    <svg
      class="w-5 h-5 sm:w-6 sm:h-6 text-white/90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="16" y1="16" x2="20" y2="20"></line>
      <polyline points="8.5 12.5, 11 9.5, 13.5 12.5"></polyline>
    </svg>
  </button>
`;

const renderApp = () => `
  <main class="flex flex-col items-center min-h-screen relative z-10 text-white">
    ${renderHeader()}
    ${renderSearch()}
    ${renderLinkList()}
    ${renderFooter()}
  </main>
  ${renderSettings()}
  ${renderFloatingControl()}
`;

const initApp = () => {
  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = renderApp();
  document.getElementById("footerYear")!.textContent = String(
    new Date().getFullYear(),
  );

  initSettings();
  initBackgroundImage();

  const els = UI.createElementCache();
  const customEngineItem = document.getElementById(
    "custom-engine-item",
  ) as HTMLElement | null;
  const customEngineName = document.getElementById(
    "custom-engine-menu-name",
  ) as HTMLElement | null;
  const addCustomEngineBtn = document.getElementById(
    "add-custom-engine-btn",
  ) as HTMLButtonElement | null;
  const addCustomEngineLabel = document.getElementById(
    "add-custom-engine-label",
  ) as HTMLElement | null;
  const customEngineModal = document.getElementById(
    "custom-engine-modal",
  ) as HTMLElement | null;
  const customEngineModalOverlay = document.getElementById(
    "custom-engine-modal-overlay",
  ) as HTMLElement | null;
  const customEngineModalClose = document.getElementById(
    "custom-engine-modal-close",
  ) as HTMLButtonElement | null;
  const customEngineNameInput = document.getElementById(
    "custom-engine-name-input",
  ) as HTMLInputElement | null;
  const customEngineUrlInput = document.getElementById(
    "custom-engine-url-input",
  ) as HTMLInputElement | null;
  const customEnginePlaceholderInput = document.getElementById(
    "custom-engine-placeholder-input",
  ) as HTMLInputElement | null;
  const customEngineSaveBtn = document.getElementById(
    "custom-engine-save-btn",
  ) as HTMLButtonElement | null;
  const customEngineClearBtn = document.getElementById(
    "custom-engine-clear-btn",
  ) as HTMLButtonElement | null;
  let searchUrl: string = UI.DEFAULT_SEARCH_URL;

  const applyEngineVisual = (
    iconClass: string,
    color: string,
    placeholder: string,
  ) => {
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
      customEngineItem.dataset.url = "";
      customEngineItem.dataset.placeholder = "";
      if (customEngineName) {
        customEngineName.textContent = "自定义";
      }
      if (addCustomEngineLabel) {
        addCustomEngineLabel.textContent = "添加搜索引擎";
      }

      if (isActive) {
        const firstEngine = els.menu.querySelector(
          ".engine-item:not(.hidden)",
        ) as HTMLElement | null;
        firstEngine?.click();
      }
      return;
    }

    customEngineItem.classList.remove("hidden");
    customEngineItem.dataset.url = config.url;
    customEngineItem.dataset.placeholder = config.placeholder;
    if (customEngineName) {
      customEngineName.textContent = config.name;
    }
    if (addCustomEngineLabel) {
      addCustomEngineLabel.textContent = "编辑搜索引擎";
    }
  };

  const openCustomEngineModal = () => {
    const config = getSavedCustomSearchEngine();
    if (customEngineNameInput) {
      customEngineNameInput.value = config?.name || "";
    }
    if (customEngineUrlInput) {
      customEngineUrlInput.value = config?.url || "";
    }
    if (customEnginePlaceholderInput) {
      customEnginePlaceholderInput.value = config?.placeholder || "";
    }

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

  UI.setupWeatherInfoHandler(els.weather, els.weatherBox);

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

  UI.updateTime(els.clock, els.date);
  setInterval(() => UI.updateTime(els.clock, els.date), 1000);

  syncCustomEngineItem();
  window.addEventListener(
    "custom-search-engine:updated",
    syncCustomEngineItem,
  );

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

  [
    customEngineNameInput,
    customEngineUrlInput,
    customEnginePlaceholderInput,
  ].forEach((el) => {
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
  UI.setupFloatingButtonHandler(els.floatingSearchBtn, els.input);
  UI.setupScrollListener(els.floatingSearchBtn);
  UI.setupDocumentClickHandler(els.menu);
  UI.setupCategoryCollapse();

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement === document.body) {
      event.preventDefault();
      els.input?.focus();
    }
  });

  document.querySelectorAll<HTMLElement>(".will-reveal").forEach((section) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 80px 0px" },
    );
    observer.observe(section);
  });

  document.addEventListener("mouseover", (event) => {
    const target = (event.target as HTMLElement).closest?.<HTMLElement>(
      "[data-tooltip]",
    );
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.top < 80) {
      target.setAttribute("data-tooltip-pos", "bottom");
    } else {
      target.removeAttribute("data-tooltip-pos");
    }
  });

  document
    .querySelectorAll<HTMLImageElement>("img[data-fallback-icon]")
    .forEach((img) => {
      img.addEventListener(
        "load",
        () => {
          img.style.opacity = "1";
        },
        { once: true },
      );
      img.addEventListener(
        "error",
        () => {
          const fallback = img.nextElementSibling as HTMLElement | null;
          if (fallback) {
            fallback.classList.add("flex");
            fallback.classList.remove("hidden");
          }
          img.style.display = "none";
        },
        { once: true },
      );
    });

  UI.loadCachedIcons();
  UI.setupIconCaching();

  UI.scheduleInit(() => {
    Promise.all([
      UI.fetchWeatherInfo(els.weather, els.weatherBox),
      fetchAndDetectProvider(els.proName, els.proBox),
    ]).catch((err: unknown) => {
      console.error("初始化网络数据失败:", err);
    });
  });

  UI.scheduleInit(() => {
    UI.fetchHitokoto(els.input);
  });

  UI.scheduleInit(() => {
    UI.checkAllUrls();
  });
};

initApp();
