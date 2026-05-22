import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      "/api/ip-info": {
        target: "https://ip9.com.cn",
        changeOrigin: true,
        rewrite: () => "/get",
      },
      "/api/edge-ip": {
        target: "https://ip9.com.cn",
        changeOrigin: true,
        rewrite: () => "/get",
      },
      "/api/site-status": {
        target: "https://isyourwebsitedownrightnow.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/site-status/, "/api/status"),
      },
    },
  },
  build: {
    assetsDir: "_assets",
  },
});
