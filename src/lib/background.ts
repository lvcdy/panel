import { BG_URL } from "./config";

export const initBackgroundImage = () => {
    const img = new Image();
    img.fetchPriority = "high";
    img.decoding = "async";
    img.src = BG_URL;

    img.onload = () => {
        document.documentElement.style.setProperty("--bg-url", `url("${BG_URL}")`);
        document.body.classList.add("bg-loaded");
    };
};
