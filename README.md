# Panel - 个人导航仪表板 🎯

一个简洁高效的个人导航仪表板，用于快速访问常用网站、工具和服务。基于 Vite 7、TypeScript 和 Tailwind CSS v4 构建的现代化个人导航门户，支持多搜索引擎、实时链接状态检测、IP 地理信息展示等丰富功能。

## ✨ 主要功能

- 🔍 **多搜索引擎快速切换** - 支持 Bing、百度、Google、GitHub、知乎，内置智能防抖搜索（150ms）与实时过滤高亮
- 🧩 **自定义搜索引擎** - 支持在界面中添加/编辑/清除自定义搜索引擎，支持 `{q}` 模板占位符
- 🌐 **分类导航** - 可折叠的分类卡片，支持按名称/URL/分类标题搜索，搜索模式下统一布局
- 🟢 **链接状态检测** - 并发信号量控制（最大 5 并发）实时探测各链接可用性，IntersectionObserver 优先检测可见链接，颜色编码状态指示（可用/限流/禁止/不可达）
- 🎨 **毛玻璃 UI** - 基于 Tailwind CSS v4 的 Glass Morphism 设计，动态背景图片加载与平滑过渡动画
- ⚡ **性能优化** - 图标懒加载与 Canvas 缓存、requestIdleCallback 延迟初始化、事件委托、debounce、WeakMap 文本缓存
- 📱 **响应式布局** - 1-5 列自适应网格，完美适配桌面、平板和手机
- 🌍 **天气胶囊** - 通过浏览器定位自动获取当前位置天气，默认展示北京天气，支持点击刷新
- 🏷️ **服务商检测** - 自动识别阿里云 ESA / Cloudflare Edge 等 CDN 服务商
- 💬 **一言（Hitokoto）** - 随机名言作为搜索框占位符，附作者归属
- ⚙️ **设置面板** - 可调毛玻璃强度与饱和度，支持自定义背景图 URL 与自定义一言 API
- ⌨️ **键盘快捷键** - `/` 聚焦搜索、`Escape` 清除搜索、方向键导航引擎菜单
- ♿ **无障碍支持** - ARIA 标签、键盘导航、`prefers-reduced-motion` 适配

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/lvcdy/panel.git
cd panel

# 安装依赖
pnpm install

# 本地开发（访问 http://localhost:5173）
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
panel/
├── index.html              # Vite HTML 入口
├── public/                  # 静态资源
├── src/
│   ├── data/
│   │   └── links.ts        # 导航链接与搜索引擎配置
│   ├── lib/                # 工具函数库
│   │   ├── background.ts   # 动态背景图片加载与过渡动画
│   │   ├── cache.ts        # 智能缓存（状态 30min TTL / 图标 24h TTL / 2MB 限制）
│   │   ├── category.ts     # 分类折叠/展开动画逻辑
│   │   ├── config.ts       # 全局配置常量与 API 端点
│   │   ├── custom-engine.ts # 自定义搜索引擎配置持久化与 URL 构建
│   │   ├── dom.ts          # DOM 元素选择器封装
│   │   ├── hitokoto.ts     # 一言 API 封装（随机名言）
│   │   ├── icons.ts        # 图标动态获取、Canvas 缓存与回退处理
│   │   ├── ip.ts           # IP 信息获取、隐私脱敏与格式化
│   │   ├── main.ts         # 浏览器工具模块聚合出口
│   │   ├── provider.ts     # CDN 服务商检测（阿里云/Cloudflare）
│   │   ├── search.ts       # 搜索过滤、高亮、引擎切换、键盘交互
│   │   ├── status.ts       # 链接可用性检测（信号量并发控制）
│   │   ├── time.ts         # 实时时钟更新（zh-CN 本地化）
│   │   └── url.ts          # 通用 URL 校验工具
│   ├── main.ts             # Vite 应用渲染与初始化入口
│   └── styles/
│       └── global.css      # 全局样式（毛玻璃、动画、响应式）
├── vite.config.ts          # Vite 配置（Tailwind v4、压缩与资源目录）
└── package.json
```

## ⚙️ 配置指南

### 修改导航链接

编辑 [src/data/links.ts](src/data/links.ts) 文件，修改 `CATEGORIES` 数组：

```typescript
export const CATEGORIES: Category[] = [
  {
    title: "分类名称",
    links: [
      {
        name: "链接名称",
        url: "https://example.com",
        icon: "fas fa-icon-name",
        color: "#3498db",
        useIcon: true  // 可选：true 则自动获取网站 favicon
      }
    ]
  }
];
```

**参数说明：**
- `title` - 分类标题（也参与搜索匹配）
- `links` - 链接数组
  - `name` - 链接显示名称
  - `url` - 链接地址
  - `icon` - [Font Awesome](https://fontawesome.com/icons) 图标类名（作为默认或回退图标）
  - `color` - 十六进制颜色值
  - `useIcon` - 可选，设为 `true` 时自动获取网站 favicon 并缓存

### 配置搜索引擎

在 [src/data/links.ts](src/data/links.ts) 中编辑 `SEARCH_ENGINES` 数组：

```typescript
export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'bing', name: 'Bing', url: 'https://cn.bing.com/search?q=', icon: 'fab fa-microsoft', color: '#00a4ef', placeholder: '🔍 必应一下，你就知道！' },
  { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'fas fa-paw', color: '#2932e1', placeholder: '🐾 百度一下，世界尽在掌握！' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'fab fa-google', color: '#4285f4', placeholder: '🌐 Google it，探索无限可能！' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', icon: 'fab fa-github', color: '#f0f6fc', placeholder: '🐙 在 GitHub 的代码海洋中探险！' },
  { id: 'zhihu', name: '知乎', url: 'https://www.zhihu.com/search?type=content&q=', icon: 'fab fa-zhihu', color: '#0084ff', placeholder: '💡 有问题？知乎上总有答案！' }
];
```

### 全局配置

在 [src/lib/config.ts](src/lib/config.ts) 中可调整：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `CACHE_ENABLED` | `false` | 是否启用 localStorage 缓存 |
| `STATUS_CACHE_TTL` | 30 分钟 | 链接状态缓存过期时间 |
| `ICON_CACHE_TTL` | 24 小时 | 图标缓存过期时间 |
| `ICON_CACHE_MAX_SIZE` | 2 MB | 图标缓存最大占用空间 |
| `SCROLL_THRESHOLD` | 300 px | 回顶按钮出现的滚动阈值 |
| `SEARCH_TIP_SHOW_TIME` | 2000 ms | 搜索提示显示时长 |

### 本地自定义设置（localStorage）

| 键名 | 说明 |
|------|------|
| `custom-search-engine` | 自定义搜索引擎配置（名称/URL/占位符） |
| `custom-bg-url` | 自定义背景图 URL |
| `custom-hitokoto-api` | 自定义一言 API 地址 |
| `card-glass-blur-value` | 毛玻璃强弱值 |
| `card-glass-saturate-value` | 饱和度值 |

### 天气显示

- 自动调用浏览器定位接口获取当前位置，经纬度优先请求天气数据
- 定位失败或未授权时默认展示北京天气
- 点击天气胶囊可重新拉取天气

## 🏗️ 架构亮点

| 模式 | 说明 |
|------|------|
| **信号量并发控制** | 链接状态检测最多 5 个并发请求，避免浏览器连接池耗尽 |
| **IntersectionObserver** | 可见链接优先检测状态，分类/页脚入场动画触发 |
| **WeakMap 文本缓存** | 搜索高亮时保留原始文本，精确还原无残留 |
| **事件委托** | 引擎菜单使用单一事件监听器，减少内存占用 |
| **requestIdleCallback** | 非关键初始化延迟到浏览器空闲时执行 |
| **Canvas 图标缓存** | 动态 favicon 转为 Data URL 存入 localStorage |
| **Debounce 防抖** | 搜索输入 150ms 防抖，减少无效 DOM 操作 |

## 🛠️ 技术栈

| 技术 | 版本 | 描述 |
|------|------|------|
| [Vite](https://vite.dev) | 7.3.2 | 前端开发服务器与生产打包工具 |
| [Tailwind CSS](https://tailwindcss.com) | 4.2.2 | 实用优先的 CSS 框架（Vite 插件集成） |
| [Font Awesome Free](https://fontawesome.com) | 7.2 | 图标库（@fortawesome/fontawesome-free） |
| [TypeScript](https://www.typescriptlang.org) | 6.0.2 | 类型安全的 JavaScript |
| [Lightning CSS](https://lightningcss.dev) | 1.32.0 | 高性能 CSS 编译器 |
| [Terser](https://terser.org) | 5.46 | JavaScript 压缩工具 |

## 📦 npm 脚本

```bash
pnpm dev       # 启动开发服务器（http://localhost:5173）
pnpm build     # 类型检查 + 构建生产版本
pnpm preview   # 预览构建结果
pnpm typecheck # 仅执行 TypeScript 类型检查
```

## 🧹 清理工作区

```bash
# 清理构建产物
rm -rf dist

# 重新生成构建产物（可选）
pnpm build
```

## 🎨 自定义示例

### 添加新分类

1. 打开 [src/data/links.ts](src/data/links.ts)
2. 在 `CATEGORIES` 数组中添加：

```typescript
{
  title: "新分类",
  links: [
    {
      name: "网站名称",
      url: "https://example.com",
      icon: "fas fa-star",
      color: "#f39c12",
      useIcon: true
    }
  ]
}
```

3. 重启开发服务器（`pnpm dev`）

### 修改图标

浏览 [Font Awesome 图标库](https://fontawesome.com/icons) 查找合适的图标，使用对应的类名：
- `fas fa-*` - 实心图标
- `far fa-*` - 线条图标
- `fab fa-*` - 品牌图标

设置 `useIcon: true` 可自动获取网站 favicon，加载失败时回退到 Font Awesome 图标。

## 📱 浏览器兼容性

- ✅ Chrome / Edge（最新版）
- ✅ Firefox（最新版）
- ✅ Safari 14+
- ✅ 移动浏览器（iOS Safari、Chrome Mobile）

> 项目已适配 `prefers-reduced-motion`，为减弱动画偏好的用户提供无障碍体验。

## 🚀 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 访问 [Vercel](https://vercel.com) 导入项目
3. 自动识别 Vite 框架
4. 点击部署完成

### 其他平台

本项目构建输出为纯静态文件，可部署到任何静态托管平台：
- GitHub Pages
- Netlify
- Cloudflare Pages
- 自有服务器（Nginx、Apache 等）

## 📄 项目信息

- **版本**: 1.0.0
- **类型**: 静态网站
- **构建输出**: `./dist/`
- **开发端口**: 5173

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

Created with ❤️ by [lvcdy](https://blog.lvcdy.cn)

---

有任何问题或建议，欢迎提交 Issue 或 Pull Request！
