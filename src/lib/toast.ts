export type ToastType = "success" | "error" | "info";

const CONTAINER_ID = "toast-container";
const MAX_TOASTS = 4;

const getContainer = (): HTMLElement | null => {
    if (typeof document === "undefined") return null;

    const existing = document.getElementById(CONTAINER_ID);
    if (existing) return existing;

    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
    return container;
};

export const initToast = (): void => {
    getContainer();
};

export const showToast = (
    message: string,
    type: ToastType = "info",
    duration = 3200,
): void => {
    const container = getContainer();
    if (!container) return;

    while (container.children.length >= MAX_TOASTS) {
        container.firstElementChild?.remove();
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const icon = document.createElement("i");
    icon.className =
        type === "success"
            ? "fas fa-circle-check toast-icon"
            : type === "error"
              ? "fas fa-circle-exclamation toast-icon"
              : "fas fa-circle-info toast-icon";
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "toast-text";
    text.textContent = message;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "关闭提示");

    const closeIcon = document.createElement("i");
    closeIcon.className = "fas fa-times";
    closeIcon.setAttribute("aria-hidden", "true");
    close.appendChild(closeIcon);

    let removed = false;
    const remove = (): void => {
        if (removed) return;
        removed = true;
        toast.classList.remove("show");
        window.setTimeout(() => toast.remove(), 200);
    };

    close.addEventListener("click", remove);
    toast.append(icon, text, close);
    container.appendChild(toast);

    window.requestAnimationFrame(() => toast.classList.add("show"));

    if (duration > 0) {
        window.setTimeout(remove, duration);
    }
};
