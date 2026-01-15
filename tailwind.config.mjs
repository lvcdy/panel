/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px', // 配合 Layout.astro 中的全屏蒙版使用
      },
      // 自定义缩放与过渡，让 sun-card 的悬停更灵动
      scale: {
        '102': '1.02',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ['MiSans', 'Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
      // 增加自定义阴影，让 glass 效果更深邃
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  // 建议保持 plugins 为空以维持构建速度，Astro 5 本身已足够快
  plugins: [],
};