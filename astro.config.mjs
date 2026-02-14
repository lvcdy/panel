import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],

  output: 'static',

  build: {
    format: 'file',
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
});
