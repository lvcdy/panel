export const updateTime = (clockEl: HTMLElement | null, dateEl: HTMLElement | null) => {
    const now = new Date();
    if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
    }
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
            weekday: "long",
        });
    }
};

/** 启动时钟，使用 RAF + 页面可见性控制，避免后台标签页浪费资源 */
export const startClock = (
    clockEl: HTMLElement | null,
    dateEl: HTMLElement | null,
) => {
    let lastSecond = -1;
    let rafId = 0;

    const tick = () => {
        const now = new Date();
        const sec = now.getSeconds();
        if (sec !== lastSecond) {
            lastSecond = sec;
            updateTime(clockEl, dateEl);
        }
        rafId = requestAnimationFrame(tick);
    };

    const start = () => {
        if (!rafId) {
            lastSecond = -1;
            rafId = requestAnimationFrame(tick);
        }
    };

    const stop = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
    };

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    });

    start();
};

export const scheduleInit = (cb: () => void) => {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(cb, { timeout: 1200 });
    } else {
        setTimeout(cb, 200);
    }
};
