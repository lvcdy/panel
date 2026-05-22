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
    },
  },
  build: {
    assetsDir: "_assets",
  },
});
