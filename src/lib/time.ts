export const updateTime = (clockEl: HTMLElement | null, dateEl: HTMLElement | null) => {
    const now = new Date();
    if (clockEl) {
        clockEl.innerText = now.toLocaleTimeString("zh-CN", { hour12: false });
    }
    if (dateEl) {
        dateEl.innerText = now.toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
            weekday: "long",
        });
    }
};

export const scheduleInit = (cb: () => void) => {
    const ric = (window as any).requestIdleCallback;
    if (ric) {
        ric(cb, { timeout: 1200 });
    } else {
        setTimeout(cb, 200);
    }
};
