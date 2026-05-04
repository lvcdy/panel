import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    assetsDir: "_assets",
    cssMinify: "lightningcss",
    minify: "terser",
  },
});
