export interface ConfirmDetail {
    label: string;
    value: string;
}

export interface ConfirmOptions {
    title: string;
    message: string;
    details?: ConfirmDetail[];
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

let initialized = false;
let active = false;
let resolver: ((value: boolean) => void) | null = null;
let lastFocused: HTMLElement | null = null;

const getModal = (): HTMLElement | null =>
    document.getElementById("panel-confirm-modal");

const finish = (value: boolean): void => {
    const modal = getModal();
    if (!modal || !active) return;

    active = false;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    const resolve = resolver;
    resolver = null;

    lastFocused?.focus();
    lastFocused = null;

    resolve?.(value);
};

export const isConfirmDialogOpen = (): boolean => active;

export const initConfirmDialog = (): void => {
    if (initialized || typeof document === "undefined") return;
    initialized = true;

    const modal = getModal();
    if (!modal) return;

    document.getElementById("panel-confirm-cancel")?.addEventListener("click", () => {
        finish(false);
    });
    document.getElementById("panel-confirm-close")?.addEventListener("click", () => {
        finish(false);
    });
    document.getElementById("panel-confirm-overlay")?.addEventListener("click", () => {
        finish(false);
    });
    document.getElementById("panel-confirm-accept")?.addEventListener("click", () => {
        finish(true);
    });

    modal.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;

        const focusables = Array.from(
            modal.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
        ).filter((element) => element.offsetParent !== null);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && active) {
            event.preventDefault();
            event.stopPropagation();
            finish(false);
        }
    });
};

export const openConfirmDialog = (options: ConfirmOptions): Promise<boolean> => {
    initConfirmDialog();

    const modal = getModal();
    if (!modal) return Promise.resolve(false);

    if (active) finish(false);

    lastFocused =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    const title = document.getElementById("panel-confirm-title");
    const message = document.getElementById("panel-confirm-message");
    const details = document.getElementById("panel-confirm-details");
    const accept = document.getElementById(
        "panel-confirm-accept",
    ) as HTMLButtonElement | null;
    const cancel = document.getElementById(
        "panel-confirm-cancel",
    ) as HTMLButtonElement | null;

    if (title) title.textContent = options.title;
    if (message) message.textContent = options.message;

    if (details) {
        details.replaceChildren();
        const rows = options.details ?? [];

        rows.forEach((detail) => {
            const row = document.createElement("div");
            row.className = "panel-confirm-detail";

            const label = document.createElement("span");
            label.className = "panel-confirm-detail-label";
            label.textContent = detail.label;

            const value = document.createElement("span");
            value.className = "panel-confirm-detail-value";
            value.textContent = detail.value;

            row.append(label, value);
            details.appendChild(row);
        });

        details.classList.toggle("hidden", rows.length === 0);
    }

    if (accept) {
        accept.textContent = options.confirmLabel ?? "确认";
        accept.classList.toggle("panel-btn-danger", Boolean(options.danger));
        accept.classList.toggle("panel-btn-primary", !options.danger);
    }

    if (cancel) cancel.textContent = options.cancelLabel ?? "取消";

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    active = true;

    return new Promise<boolean>((resolve) => {
        resolver = resolve;
        window.setTimeout(() => cancel?.focus(), 0);
    });
};
