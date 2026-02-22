import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  output: 'static',

  build: {
    format: 'file',
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
});
