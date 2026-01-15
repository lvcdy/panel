import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // 集成 Tailwind
  integrations: [tailwind()],
  
  // 部署模式：static（静态）是最佳选择，生成的 HTML 页面在边缘节点分发极快
  output: 'static',

  // Astro 5 核心性能优化
  build: {
    format: 'file',        // 生成目录结构：index.html
    inlineStylesheets: 'always' // 自动内联 CSS，消除首屏 FOUC（样式闪烁）
  },

  // 实验性功能：Astro 5 建议开启，提升开发服务器响应速度
  experimental: {
    clientPrerender: true,
  },

  // Vite 6 构建优化
  vite: {
    build: {
      cssMinify: 'lightningcss', // 使用 Rust 编写的超快 CSS 压缩工具
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        // 确保 SDK 的 CommonJS 模块在构建时能被正确处理
        output: {
          manualChunks: {
            vendor: ['uapi-sdk-typescript']
          }
        }
      }
    },
    // 解决某些 SDK 依赖在 SSR 阶段可能触发的错误
    ssr: {
      external: ['uapi-sdk-typescript']
    }
  }
});