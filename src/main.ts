import { initSettings } from "./lib/settings";
import { initNetworkInfo } from "./lib/network-info";
import { initCategoryDelete } from "./lib/panel/category-delete";
import { initCategoryEditor } from "./lib/panel/category-editor";
import { initCategoryManager } from "./lib/panel/category-manager";
import { initConfirmDialog } from "./lib/panel/confirm";
import { initDataPanel } from "./lib/panel/data-panel";
import { initDragSort } from "./lib/panel/drag-sort";
import { initNavigationEditor } from "./lib/panel/editor";
import { initSiteEditor } from "./lib/panel/site-editor";
import { initSettingsRuntime } from "./lib/panel/settings-runtime";
import { getStoreInitWarning, initPanelStore } from "./lib/panel/store";
import { initNavigationView } from "./lib/panel/view";
import { initToast, showToast } from "./lib/toast";
import * as UI from "./lib";
import { initSearch } from "./init/search-init";
import {
  initRevealAnimations,
  initLinkIconFallback,
} from "./init/page-effects";

export const initApp = () => {
  // ── 基础初始化 ──
  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  initToast();
  initPanelStore();

  const storeWarning = getStoreInitWarning();
  if (storeWarning) showToast(storeWarning, "error", 6000);

  initSettings();
  initSettingsRuntime();
  initNavigationView();
  initNetworkInfo();
  initConfirmDialog();
  initDataPanel();
  initSiteEditor();
  initNavigationEditor();
  initDragSort();
  initCategoryEditor();
  initCategoryDelete();
  initCategoryManager();

  const els = UI.createElementCache();

  // ── 时钟 ──
  UI.updateTime(els.clock, els.date);
  UI.startClock(els.clock, els.date);

  // ── 天气 ──
  UI.setupWeatherInfoHandler(els.weather, els.weatherBox);

  // ── 搜索 & 自定义引擎 ──
  initSearch(els);

  // ── 浮动按钮 & 分类折叠 ──
  UI.setupFloatingButtonHandler(els.floatingSearchBtn, els.input);
  UI.setupScrollListener(els.floatingSearchBtn);
  UI.setupCategoryCollapse();

  // ── 页面效果 ──
  initRevealAnimations();
  initLinkIconFallback();

  // ── 延迟加载的网络数据 ──
  UI.scheduleInit(() => {
    Promise.all([
      UI.fetchWeatherInfo(els.weather, els.weatherBox),
    ]).catch((err: unknown) => {
      console.error("初始化网络数据失败:", err);
    });
  });

};
