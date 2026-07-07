/** 页面级效果初始化：滚动揭示、Tooltip 定位、链接图标降级 */

/** 初始化滚动揭示动画（IntersectionObserver，批量 rAF 更新） */
export const initRevealAnimations = () => {
  const revealSections = document.querySelectorAll<HTMLElement>(".will-reveal");

  if (!("IntersectionObserver" in window)) {
    revealSections.forEach((section) => section.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      // 收集本次批次中需要揭示的元素
      const toReveal: HTMLElement[] = [];
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        toReveal.push(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
      // 批量写入 DOM，减少回流次数
      if (toReveal.length > 0) {
        requestAnimationFrame(() => {
          for (const el of toReveal) el.classList.add("revealed");
        });
      }
    },
    { threshold: 0.05, rootMargin: "0px 0px 80px 0px" },
  );
  revealSections.forEach((section) => observer.observe(section));
};

/** 初始化 Tooltip 位置修正（靠近顶部时向下显示） */
export const initTooltipPositioning = () => {
  document.addEventListener("mouseover", (event) => {
    const target = (event.target as HTMLElement).closest?.<HTMLElement>("[data-tooltip]");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.top < 80) {
      target.setAttribute("data-tooltip-pos", "bottom");
    } else {
      target.removeAttribute("data-tooltip-pos");
    }
  });
};

/** 初始化链接图标加载与降级显示 */
export const initLinkIconFallback = () => {
  const revealLinkIcon = (img: HTMLImageElement) => {
    img.style.opacity = "1";
  };

  const showFallbackIcon = (img: HTMLImageElement) => {
    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) {
      fallback.classList.add("flex");
      fallback.classList.remove("hidden");
    }
    img.style.display = "none";
  };

  document.querySelectorAll<HTMLImageElement>("img[data-fallback-icon]").forEach((img) => {
    if (img.complete) {
      if (img.naturalWidth > 0) {
        revealLinkIcon(img);
      } else {
        showFallbackIcon(img);
      }
      return;
    }
    img.addEventListener("load", () => revealLinkIcon(img), { once: true });
    img.addEventListener("error", () => showFallbackIcon(img), { once: true });
  });
};
