import { BG_URL } from "./config";

export const initBackgroundImage = () => {
    const img = new Image();
    img.decoding = "async";
    img.src = BG_URL;

    const applyBackground = () => {
        // Use the actual loaded image src to set the background
        document.documentElement.style.setProperty("--bg-url", `url("${img.src}")`);
        document.body.classList.add("bg-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
        applyBackground();
    } else {
        img.onload = applyBackground;
        img.onerror = () => {
            // Fallback: set background directly via URL (CSS bg-image has looser CORS)
            document.documentElement.style.setProperty("--bg-url", `url("${BG_URL}")`);
            document.body.classList.add("bg-loaded");
        };
    }
};
