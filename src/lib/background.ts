import { BG_URL } from "./config";

export const initBackgroundImage = () => {
    // 复用 <link rel="preload"> 已发起的请求，避免重复下载
    const img = new Image();
    img.decoding = "async";
    img.src = BG_URL;

    const applyBackground = () => {
        document.documentElement.style.setProperty("--bg-url", `url("${BG_URL}")`);
        document.body.classList.add("bg-loaded");
    };

    if (img.complete) {
        applyBackground();
    } else {
        img.onload = applyBackground;
    }
};
