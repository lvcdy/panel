import { applyBackgroundSetting, initBackgroundImage } from "../background";
import { fetchHitokoto } from "../hitokoto";
import {
    applyGlassSettings,
    syncSettingsControls,
} from "../settings";
import { scheduleInit } from "../time";
import { getPanelSettings, subscribePanelConfig } from "./store";
import type { PanelSettings } from "./types";

const getSearchInput = (): HTMLInputElement | null =>
    document.getElementById("searchInput") as HTMLInputElement | null;

const settingsEqual = (a: PanelSettings, b: PanelSettings): boolean =>
    JSON.stringify(a) === JSON.stringify(b);

const engineEqual = (
    a: PanelSettings["customSearchEngine"],
    b: PanelSettings["customSearchEngine"],
): boolean => JSON.stringify(a) === JSON.stringify(b);

let initialized = false;

/** 把 Panel Store 中的显示设置投射到现有 UI，并监听后续变化 */
export const initSettingsRuntime = (): void => {
    if (initialized) return;
    initialized = true;

    let previous = getPanelSettings();

    applyGlassSettings(previous.glass);
    syncSettingsControls(previous);
    initBackgroundImage();
    window.dispatchEvent(new CustomEvent("custom-search-engine:updated"));

    scheduleInit(() => {
        void fetchHitokoto(getSearchInput());
    });

    subscribePanelConfig((config, change) => {
        if (!change.settingsChanged) return;

        const next = config.settings;
        if (settingsEqual(previous, next)) return;

        if (JSON.stringify(previous.glass) !== JSON.stringify(next.glass)) {
            applyGlassSettings(next.glass);
        }

        if (previous.backgroundUrl !== next.backgroundUrl) {
            applyBackgroundSetting(next.backgroundUrl);
        }

        if (previous.hitokotoApi !== next.hitokotoApi) {
            void fetchHitokoto(getSearchInput());
        }

        if (!engineEqual(previous.customSearchEngine, next.customSearchEngine)) {
            window.dispatchEvent(new CustomEvent("custom-search-engine:updated"));
        }

        syncSettingsControls(next);
        previous = next;
    });
};
