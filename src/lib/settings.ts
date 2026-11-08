import { setCustomBackgroundUrl } from "./background";
import { fetchHitokoto, setCustomHitokotoApi } from "./hitokoto";
import { isConfirmDialogOpen } from "./panel/confirm";
import { getPanelSettings, updatePanelSettings } from "./panel/store";
import type { GlassSettings, PanelSettings } from "./panel/types";
import { showToast } from "./toast";

const SETTING_RANGES = {
    blur: { min: 0, max: 100 },
    saturate: { min: 100, max: 200 },
} as const;

const setValueLabel = (
    value: number,
    unit: string,
    label: HTMLElement | null,
) => {
    if (label) {
        label.textContent = `${value}${unit}`;
    }
};

export const applyGlassSettings = (glass: GlassSettings): void => {
    document.documentElement.style.setProperty(
        "--card-glass-blur-value",
        `${glass.blur}px`,
    );
    document.documentElement.style.setProperty(
        "--card-glass-saturate-value",
        `${glass.saturate}%`,
    );
};

export const syncGlassControls = (glass: GlassSettings): void => {
    const blurSlider = document.getElementById("blur-slider") as HTMLInputElement | null;
    const saturateSlider = document.getElementById(
        "saturate-slider",
    ) as HTMLInputElement | null;

    if (blurSlider) blurSlider.value = String(glass.blur);
    if (saturateSlider) saturateSlider.value = String(glass.saturate);

    setValueLabel(glass.blur, "px", document.getElementById("blur-value"));
    setValueLabel(
        glass.saturate,
        "%",
        document.getElementById("saturate-value"),
    );
};

export const syncSettingsControls = (settings: PanelSettings): void => {
    syncGlassControls(settings.glass);

    const bgUrlInput = document.getElementById("bg-url-input") as HTMLInputElement | null;
    if (bgUrlInput && document.activeElement !== bgUrlInput) {
        bgUrlInput.value = settings.backgroundUrl;
    }

    const hitokotoApiInput = document.getElementById(
        "hitokoto-api-input",
    ) as HTMLInputElement | null;
    if (hitokotoApiInput && document.activeElement !== hitokotoApiInput) {
        hitokotoApiInput.value = settings.hitokotoApi;
    }
};

const createPanelState = () => {
    const toggleBtn = document.getElementById("settings-toggle");
    const closeBtn = document.getElementById("settings-close");
    const panel = document.getElementById("settings-panel");
    const overlay = document.getElementById("settings-overlay");
    const blurSlider = document.getElementById("blur-slider") as HTMLInputElement | null;
    const blurValue = document.getElementById("blur-value");
    const saturateSlider = document.getElementById(
        "saturate-slider",
    ) as HTMLInputElement | null;
    const saturateValue = document.getElementById("saturate-value");
    const bgUrlInput = document.getElementById("bg-url-input") as HTMLInputElement | null;
    const bgApplyBtn = document.getElementById("bg-url-apply");
    const bgResetBtn = document.getElementById("bg-url-reset");
    const hitokotoApiInput = document.getElementById(
        "hitokoto-api-input",
    ) as HTMLInputElement | null;
    const hitokotoApplyBtn = document.getElementById("hitokoto-api-apply");
    const hitokotoResetBtn = document.getElementById("hitokoto-api-reset");
    const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;

    if (
        !toggleBtn ||
        !closeBtn ||
        !panel ||
        !overlay ||
        !blurSlider ||
        !saturateSlider ||
        !bgUrlInput ||
        !hitokotoApiInput ||
        !searchInput
    ) {
        return null;
    }

    return {
        toggleBtn,
        closeBtn,
        panel,
        overlay,
        blurSlider,
        blurValue,
        saturateSlider,
        saturateValue,
        bgUrlInput,
        bgApplyBtn,
        bgResetBtn,
        hitokotoApiInput,
        hitokotoApplyBtn,
        hitokotoResetBtn,
        searchInput,
    };
};

const readSliderValue = (
    input: HTMLInputElement,
    fallback: number,
    range: { readonly min: number; readonly max: number },
): number => {
    const value = Number.parseInt(input.value, 10);
    return Number.isInteger(value) && value >= range.min && value <= range.max
        ? value
        : fallback;
};

const openPanel = (panel: HTMLElement, overlay: HTMLElement, toggleBtn: HTMLElement) => {
    panel.classList.add("active");
    overlay.classList.add("active");
    toggleBtn.classList.add("active");
    toggleBtn.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
};

const closePanel = (panel: HTMLElement, overlay: HTMLElement, toggleBtn: HTMLElement) => {
    panel.classList.remove("active");
    overlay.classList.remove("active");
    toggleBtn.classList.remove("active");
    toggleBtn.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
};

const togglePanel = (panel: HTMLElement, overlay: HTMLElement, toggleBtn: HTMLElement) => {
    if (panel.classList.contains("active")) {
        closePanel(panel, overlay, toggleBtn);
        return;
    }

    openPanel(panel, overlay, toggleBtn);
};

export const closeSettingsPanel = (): void => {
    const state = createPanelState();
    if (!state) return;
    closePanel(state.panel, state.overlay, state.toggleBtn);
};

export const initSettings = () => {
    const state = createPanelState();
    if (!state) return;

    const {
        toggleBtn,
        closeBtn,
        panel,
        overlay,
        blurSlider,
        blurValue,
        saturateSlider,
        saturateValue,
        bgUrlInput,
        bgApplyBtn,
        bgResetBtn,
        hitokotoApiInput,
        hitokotoApplyBtn,
        hitokotoResetBtn,
        searchInput,
    } = state;

    const initialSettings = getPanelSettings();
    syncSettingsControls(initialSettings);
    applyGlassSettings(initialSettings.glass);

    const readGlassFromControls = (): GlassSettings => {
        const stored = getPanelSettings().glass;
        return {
            blur: readSliderValue(blurSlider, stored.blur, SETTING_RANGES.blur),
            saturate: readSliderValue(
                saturateSlider,
                stored.saturate,
                SETTING_RANGES.saturate,
            ),
        };
    };

    const previewGlass = () => {
        const glass = readGlassFromControls();
        applyGlassSettings(glass);
        setValueLabel(glass.blur, "px", blurValue);
        setValueLabel(glass.saturate, "%", saturateValue);
    };

    const commitGlass = () => {
        const glass = readGlassFromControls();
        const result = updatePanelSettings({ glass });

        if (result.ok) return;

        const stored = getPanelSettings().glass;
        syncGlassControls(stored);
        applyGlassSettings(stored);
        showToast(result.message, "error");
    };

    toggleBtn.addEventListener("click", () => {
        togglePanel(panel, overlay, toggleBtn);
    });

    closeBtn.addEventListener("click", () => {
        closePanel(panel, overlay, toggleBtn);
    });

    overlay.addEventListener("click", () => {
        closePanel(panel, overlay, toggleBtn);
    });

    blurSlider.addEventListener("input", previewGlass);
    saturateSlider.addEventListener("input", previewGlass);
    blurSlider.addEventListener("change", commitGlass);
    saturateSlider.addEventListener("change", commitGlass);

    bgApplyBtn?.addEventListener("click", () => {
        const value = bgUrlInput.value.trim();
        const result = setCustomBackgroundUrl(value);

        if (!result.ok) {
            showToast(result.message, "error");
            bgUrlInput.value = getPanelSettings().backgroundUrl;
            return;
        }

        showToast(value ? "背景已更新" : "背景已恢复默认", "success");
    });

    bgResetBtn?.addEventListener("click", () => {
        const result = setCustomBackgroundUrl("");

        if (!result.ok) {
            showToast(result.message, "error");
            return;
        }

        showToast("背景已恢复默认", "success");
    });

    bgUrlInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            (bgApplyBtn as HTMLButtonElement | null)?.click();
        }
    });

    hitokotoApplyBtn?.addEventListener("click", () => {
        const value = hitokotoApiInput.value.trim();
        const unchanged = value === getPanelSettings().hitokotoApi;
        const result = setCustomHitokotoApi(value);

        if (!result.ok) {
            showToast(result.message, "error");
            hitokotoApiInput.value = getPanelSettings().hitokotoApi;
            return;
        }

        showToast(value ? "一言 API 已更新" : "一言 API 已恢复默认", "success");
        if (unchanged) void fetchHitokoto(searchInput);
    });

    hitokotoResetBtn?.addEventListener("click", () => {
        const unchanged = getPanelSettings().hitokotoApi === "";
        const result = setCustomHitokotoApi("");

        if (!result.ok) {
            showToast(result.message, "error");
            return;
        }

        showToast("一言 API 已恢复默认", "success");
        if (unchanged) void fetchHitokoto(searchInput);
    });

    hitokotoApiInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            (hitokotoApplyBtn as HTMLButtonElement | null)?.click();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && panel.classList.contains("active")) {
            // 确认弹窗打开时，Esc 只关闭弹窗，不关闭设置面板。
            if (isConfirmDialogOpen()) return;
            closePanel(panel, overlay, toggleBtn);
        }
    });
};
