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

/** 启动时钟，使用递归 setTimeout 精确每秒更新，避免后台标签页浪费资源 */
export const startClock = (
    clockEl: HTMLElement | null,
    dateEl: HTMLElement | null,
) => {
    let timerId = 0;

    const tick = () => {
        updateTime(clockEl, dateEl);
        timerId = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };

    const start = () => {
        if (!timerId) tick();
    };

    const stop = () => {
        if (timerId) {
            clearTimeout(timerId);
            timerId = 0;
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
