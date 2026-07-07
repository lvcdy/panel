import {
    getSavedBackgroundUrl,
    setCustomBackgroundUrl,
} from "./background";
import { isValidHttpUrl } from "./utils";
import {
    fetchHitokoto,
    getSavedHitokotoApi,
    setCustomHitokotoApi,
} from "./hitokoto";
import { getStoredText, setStoredText } from "./storage";

const STORAGE_KEYS = {
    blur: "card-glass-blur-value",
    saturate: "card-glass-saturate-value",
} as const;

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

const createPanelState = () => {
    const toggleBtn = document.getElementById("settings-toggle");
    const closeBtn = document.getElementById("settings-close");
    const panel = document.getElementById("settings-panel");
    const overlay = document.getElementById("settings-overlay");
    const blurSlider = document.getElementById("blur-slider") as HTMLInputElement | null;
    const blurValue = document.getElementById("blur-value");
    const saturateSlider = document.getElementById("saturate-slider") as HTMLInputElement | null;
    const saturateValue = document.getElementById("saturate-value");
    const bgUrlInput = document.getElementById("bg-url-input") as HTMLInputElement | null;
    const bgApplyBtn = document.getElementById("bg-url-apply");
    const bgResetBtn = document.getElementById("bg-url-reset");
    const hitokotoApiInput = document.getElementById("hitokoto-api-input") as HTMLInputElement | null;
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

const syncBlurSetting = (value: number, blurValue: HTMLElement | null) => {
    document.documentElement.style.setProperty("--card-glass-blur-value", `${value}px`);
    setValueLabel(value, "px", blurValue);
    setStoredText(STORAGE_KEYS.blur, String(value));
};

const syncSaturateSetting = (value: number, saturateValue: HTMLElement | null) => {
    document.documentElement.style.setProperty("--card-glass-saturate-value", `${value}%`);
    setValueLabel(value, "%", saturateValue);
    setStoredText(STORAGE_KEYS.saturate, String(value));
};

const getStoredRangeValue = (
    key: string,
    range: { readonly min: number; readonly max: number },
) => {
    const value = Number.parseInt(getStoredText(key), 10);
    return Number.isInteger(value) && value >= range.min && value <= range.max
        ? value
        : null;
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
    const isActive = panel.classList.contains("active");
    if (isActive) {
        closePanel(panel, overlay, toggleBtn);
        return;
    }

    openPanel(panel, overlay, toggleBtn);
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

    const savedBlur = getStoredRangeValue(STORAGE_KEYS.blur, SETTING_RANGES.blur);
    const savedSaturate = getStoredRangeValue(
        STORAGE_KEYS.saturate,
        SETTING_RANGES.saturate,
    );

    if (savedBlur !== null) {
        blurSlider.value = String(savedBlur);
        syncBlurSetting(savedBlur, blurValue);
    }

    if (savedSaturate !== null) {
        saturateSlider.value = String(savedSaturate);
        syncSaturateSetting(savedSaturate, saturateValue);
    }

    const savedBgUrl = getSavedBackgroundUrl();
    if (savedBgUrl) {
        bgUrlInput.value = savedBgUrl;
    }

    const savedHitokotoApi = getSavedHitokotoApi();
    if (savedHitokotoApi) {
        hitokotoApiInput.value = savedHitokotoApi;
    }

    toggleBtn.addEventListener("click", () => {
        togglePanel(panel, overlay, toggleBtn);
    });

    closeBtn.addEventListener("click", () => {
        closePanel(panel, overlay, toggleBtn);
    });

    overlay.addEventListener("click", () => {
        closePanel(panel, overlay, toggleBtn);
    });

    blurSlider.addEventListener("input", (event) => {
        const value = Number.parseInt((event.target as HTMLInputElement).value, 10);
        syncBlurSetting(value, blurValue);
    });

    saturateSlider.addEventListener("input", (event) => {
        const value = Number.parseInt((event.target as HTMLInputElement).value, 10);
        syncSaturateSetting(value, saturateValue);
    });

    bgApplyBtn?.addEventListener("click", () => {
        const value = bgUrlInput.value.trim();
        if (!value) {
            setCustomBackgroundUrl("");
            return;
        }

        if (!isValidHttpUrl(value)) {
            window.alert("请输入有效的 http/https 图片 URL");
            return;
        }

        setCustomBackgroundUrl(value);
    });

    bgResetBtn?.addEventListener("click", () => {
        bgUrlInput.value = "";
        setCustomBackgroundUrl("");
    });

    bgUrlInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            (bgApplyBtn as HTMLButtonElement | null)?.click();
        }
    });

    hitokotoApplyBtn?.addEventListener("click", async () => {
        const value = hitokotoApiInput.value.trim();
        if (!value) {
            setCustomHitokotoApi("");
            await fetchHitokoto(searchInput);
            return;
        }

        if (!isValidHttpUrl(value)) {
            window.alert("请输入有效的 http/https 一言 API URL");
            return;
        }

        setCustomHitokotoApi(value);
        await fetchHitokoto(searchInput);
    });

    hitokotoResetBtn?.addEventListener("click", async () => {
        hitokotoApiInput.value = "";
        setCustomHitokotoApi("");
        await fetchHitokoto(searchInput);
    });

    hitokotoApiInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            (hitokotoApplyBtn as HTMLButtonElement | null)?.click();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && panel.classList.contains("active")) {
            closePanel(panel, overlay, toggleBtn);
        }
    });
};
