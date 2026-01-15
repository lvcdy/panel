import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],

  output: 'static',

  build: {
    format: 'file',
    inlineStylesheets: 'always',
    assets: '_assets'
  },

  vite: {
    build: {
      cssMinify: 'lightningcss',
      minify: 'terser',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['uapi-sdk-typescript']
          }
        }
      }
    },
    ssr: {
      external: ['uapi-sdk-typescript']
    }
  }
});
