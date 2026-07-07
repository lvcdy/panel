import { initBackgroundImage } from "./lib/background";
import { initSettings } from "./lib/settings";
import * as UI from "./lib";
import { initSearch } from "./init/search-init";
import {
  initRevealAnimations,
  initTooltipPositioning,
  initLinkIconFallback,
} from "./init/page-effects";

export const initApp = () => {
  // ── 基础初始化 ──
  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  initSettings();
  initBackgroundImage();

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
  UI.setupSiteStatusBadges();

  // ── 页面效果 ──
  initRevealAnimations();
  initTooltipPositioning();
  initLinkIconFallback();

  // ── 延迟加载的网络数据 ──
  UI.scheduleInit(() => {
    Promise.all([
      UI.fetchWeatherInfo(els.weather, els.weatherBox),
    ]).catch((err: unknown) => {
      console.error("初始化网络数据失败:", err);
    });
  });

  UI.scheduleInit(() => {
    UI.fetchHitokoto(els.input);
  });
};
