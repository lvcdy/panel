# Panel - 个人导航仪表板 🎯

一个简洁高效的个人导航仪表板，用于快速访问常用网站、工具和服务。基于 Astro 7、TypeScript 和 Tailwind CSS v4 构建的**纯静态**导航门户：页面在构建期渲染成静态 HTML，浏览器端用原生 TypeScript 接管交互，配置保存在 `localStorage`，另有两个边缘函数负责 IP 与站点状态代理。

## ✨ 主要功能

- 🔍 **多搜索引擎快速切换** - 内置 Bing、百度、Google、GitHub、知乎，150ms 防抖搜索、实时过滤与高亮
- 🧩 **自定义搜索引擎** - 界面内添加/编辑/清除自定义引擎，URL 支持 `{q}` 占位符
- 🌐 **分类导航** - 可折叠分类卡片，支持按名称/URL/描述/标签/分类标题搜索
- 🎨 **毛玻璃 UI** - Tailwind CSS v4 玻璃拟态，动态背景图平滑过渡，模糊/饱和度可调
- 🛠️ **可视化编辑器** - 编辑模式下新增/编辑/删除网站、拖拽排序、隐藏网站，管理分类（含移动或级联删除），导出/导入 JSON 备份，恢复默认
- ⚡ **性能优化** - 图标懒加载、可见区域优先状态检测、`requestIdleCallback` 延迟初始化、事件委托、debounce、WeakMap 文本缓存
- 📱 **响应式布局** - 1-5 列自适应网格，适配桌面、平板和手机
- 🌍 **天气胶囊** - 浏览器定位获取当地天气，失败时回退北京，点击刷新
- 🏷️ **服务商检测** - 识别 Cloudflare / EdgeOne 边缘节点与访客 IP（页脚区域懒加载）
- 💬 **一言（Hitokoto）** - 随机名言作为搜索框提示，可自定义 API
- ⚙️ **设置面板** - 毛玻璃强度/饱和度、背景图 URL、一言 API、备份导入导出
- ⌨️ **键盘快捷键** - `/` 聚焦搜索、`Escape` 清除搜索、方向键导航引擎菜单
- ♿ **无障碍支持** - ARIA 标签、键盘导航、`prefers-reduced-motion` 适配

## 🚀 快速开始

### 环境要求

- Node.js 20.19+ 或 22.12+
- pnpm 12+（仓库通过 `packageManager: pnpm@12.0.0-rc.3` 固定版本，推荐 `corepack enable`）

### 安装和运行

```bash
git clone https://github.com/lvcdy/panel.git
cd panel

pnpm install

pnpm dev        # 本地开发（http://localhost:4321）
pnpm build      # 生产构建（输出 dist/）
pnpm preview    # 预览构建结果
pnpm typecheck  # astro check 类型检查
```

## 📁 项目结构

```text
panel/
├── src/
│   ├── main.ts                     # 浏览器端入口：initApp() 装配全部交互
│   ├── pages/
│   │   ├── index.astro             # 首页：页面骨架 + 浮层组件
│   │   └── 404.astro
│   ├── layouts/
│   │   └── Layout.astro            # html 骨架、深色 meta、首屏防闪、背景预加载
│   ├── components/                 # 14 个 Astro 组件（静态结构 + id 契约，无内联脚本）
│   ├── init/
│   │   ├── search-init.ts          # 搜索交互装配（引擎 / 自定义引擎 / 输入 / 快捷键）
│   │   └── page-effects.ts         # 滚动揭示、图标降级
│   ├── data/
│   │   └── links.ts                # 默认分类、链接与搜索引擎配置
│   ├── lib/
│   │   ├── config.ts               # 常量、DOM 选择器、API/天气/图标端点
│   │   ├── storage.ts / dom.ts / time.ts / utils.ts
│   │   ├── search-engine.ts / search-ui.ts / search-filter.ts
│   │   ├── settings.ts / background.ts / hitokoto.ts / custom-engine.ts
│   │   ├── site-status.ts          # 站点状态：并发队列 + sessionStorage 缓存
│   │   ├── network-info.ts         # 页脚 IP / 线路信息
│   │   ├── weather/                # 浏览器定位 + 天气 API
│   │   └── panel/                  # 导航编辑器（19 个模块）
│   │       ├── types.ts / defaults.ts / legacy.ts
│   │       ├── store.ts            # 唯一数据源：校验 → 持久化 → 通知
│   │       ├── validate.ts / ids.ts / icon.ts
│   │       ├── render.ts / view.ts / drag-sort.ts
│   │       ├── site-editor.ts / category-editor.ts / category-manager.ts / category-delete.ts
│   │       ├── editor.ts / confirm.ts / data-panel.ts / backup.ts
│   │       └── settings-runtime.ts
│   └── styles/
│       └── global.css              # Tailwind v4 分层 + 设计令牌 / 组件样式 / 动画 / 响应式
├── shared/
│   ├── paths.js / paths.d.ts       # PANEL_BASE / PANEL_API_BASE 归一化
│   └── api/                        # API 唯一实现（纯 JS + 手写 d.ts）
│       ├── ip.js                   # 文本清洗、公网 IP 判定、域名校验
│       ├── cors.js                 # 跨源白名单（默认拒绝）
│       ├── rate-limit.js           # 固定窗口限速（纵深防御）
│       ├── network-info.js         # 访客 IP / 边缘节点 / 服务商
│       └── site-status.js          # 网站状态代理（固定上游）
├── functions/api/                  # Cloudflare Pages Functions 适配器
├── edge-functions/api/             # EdgeOne Pages Functions 适配器
├── tests/
│   └── security.test.mjs           # CORS/限速/输入校验/下游过滤回归用例
├── docs/security/                  # 安全架构、威胁模型、评审清单
├── SECURITY.md                     # 漏洞披露与安全基线
├── public/                         # 静态资源（favicon、图标、robots.txt）
├── scripts/
│   └── generate-deployment-files.mjs  # 构建后生成 _routes.json / _headers（含安全头）
└── astro.config.ts                 # 静态输出、Tailwind、dev API 代理、API 基址注入
```

## ⚙️ 配置指南

### 修改导航链接

编辑 [src/data/links.ts](src/data/links.ts) 中的 `CATEGORIES` 数组：

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
        useIcon: true,  // 可选：通过站点图标 API 获取 favicon，失败回退 icon
      },
    ],
  },
];
```

- `icon` - [Font Awesome](https://fontawesome.com/icons) 类名（默认/回退图标）
- `color` - 卡片强调色（hex）
- `useIcon` - `true` 时自动获取网站 favicon
- `status` - `false` 时不展示站点状态徽章

默认配置只在**首次访问**（`localStorage` 中没有 `panel-config`）时生效；之后以浏览器内保存的配置为准，可在设置面板中恢复默认导航。

### 配置搜索引擎

同样在 [src/data/links.ts](src/data/links.ts) 中编辑 `SEARCH_ENGINES`；自定义引擎在页面上通过「添加搜索引擎」维护，URL 支持 `{q}` 模板（缺省时在末尾追加关键词）。

### 全局常量

在 [src/lib/config.ts](src/lib/config.ts) 中可调整 `SCROLL_THRESHOLD`、`SEARCH_TIP_SHOW_TIME`、天气 API、图标/背景图端点等。API 端点由 `PANEL_API_BASE` 自动拼接，通常无需修改。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PANEL_BASE` | `/` | 站点子路径部署前缀（如 `/panel/`），对应 Astro `base` |
| `PANEL_API_BASE` | `/api/` | API 前缀，相对路径或绝对 URL（如 `https://api.example.com/`）；也兼容 `PUBLIC_PANEL_API_BASE` |
| `PANEL_ALLOWED_ORIGINS` | 空（仅同源） | API 跨源白名单，逗号分隔的 origin，如 `https://panel.example.com` |
| `PANEL_RATE_LIMIT_MAX` | `120` | 每个限速窗口内、每个客户端 IP 对单个 API 的最大请求数 |
| `PANEL_RATE_LIMIT_WINDOW_MS` | `60000` | 限速窗口长度（毫秒） |

注入链路：`astro.config.ts` 读取并归一化 → Astro `base` + Vite `define.__PANEL_API_BASE__` → [src/lib/config.ts](src/lib/config.ts) 生成 `SITE_STATUS_URL` / `NETWORK_INFO_URL`。

### 浏览器存储

| 键名 | 说明 |
|------|------|
| `panel-config` | **唯一配置键**（JSON，`schemaVersion: 1`）：分类、链接、设置 |
| `panel-config-corrupt` | 配置解析失败时自动隔离的原始数据副本（初始化或其他标签页写入损坏都会备份；再次损坏时会被最新损坏数据覆盖） |
| `site-status-cache`（sessionStorage） | 站点状态检测的会话级缓存（10 分钟 / 失败 60 秒），关闭标签页即失效 |

旧版本的 5 个分散键（`custom-search-engine`、`custom-bg-url`、`custom-hitokoto-api`、`card-glass-blur-value`、`card-glass-saturate-value`）仅在首次迁移时读取，之后统一以 `panel-config` 为准，并在下一次成功写入后清理（若只浏览而从不修改配置，旧键可能一直保留，但不影响读取顺序）。

### 天气 / 一言 / 外部服务

- 天气：浏览器定位（约 8s 超时）成功则按经纬度查询，失败回退北京；天气 API Key 在 [src/lib/config.ts](src/lib/config.ts) 中，**会随前端包发布，适合自行替换为个人 Key**
- 一言、站点图标、背景图均为外部公开接口，可在设置面板或 [src/lib/config.ts](src/lib/config.ts) 中替换

## 🏗️ 架构亮点

| 模式 | 说明 |
|------|------|
| **单一数据源** | `src/lib/panel/store.ts` 是唯一写入口，强制「校验 → 持久化 → 更新内存 → 通知订阅者」，写失败不污染内存 |
| **纯字符串渲染** | `render.ts` 只产出 HTML 字符串（全部经过 `escapeHtml/escapeAttr`），`view.ts` 负责重渲染与重新绑定 |
| **单调事件委托** | 分类折叠、拖拽排序、引擎菜单都挂在常驻容器上，重渲染后无需重新绑定 |
| **IntersectionObserver** | 可见链接优先检测状态，分类/页脚入场动画按可见性触发 |
| **WeakMap 文本缓存** | 搜索高亮时保留原始文本，可精确还原 |
| **requestIdleCallback** | 天气、一言等非关键请求延迟到浏览器空闲 |
| **状态缓存** | 站点状态检测做并发限制（4）并在 sessionStorage 中短期复用结果 |
| **Debounce 防抖** | 搜索输入 150ms 防抖，减少无效 DOM 操作 |
| **零框架运行时** | 除 Astro 构建期能力与 Font Awesome 外没有前端框架依赖 |

## 🔐 安全

安全基线、信任边界、STRIDE 威胁模型与六种安全架构的落实方式见
[SECURITY.md](SECURITY.md) 与 [docs/security/ARCHITECTURE.md](docs/security/ARCHITECTURE.md)。

- API **默认拒绝跨源**：只有 `PANEL_ALLOWED_ORIGINS` 白名单内的来源获得 CORS 头
- API 仅允许 `GET`/`OPTIONS`，带每客户端限速（`PANEL_RATE_LIMIT_MAX`）
- 输入采用允许列表校验（域名/IP/URL/类名/颜色/长度），下游响应按白名单过滤
- 输出统一转义，错误响应不含堆栈；配置渲染前全量 schema 校验
- 构建产物生成 `_headers` 安全头（CSP/HSTS/Referrer-Policy/Permissions-Policy 等）
- CI 执行依赖审计（高危阻断）、CodeQL、gitleaks、SBOM、cosign 签名与 provenance

```bash
pnpm test            # 安全回归用例（CORS/限速/输入校验/下游过滤）
pnpm security:audit  # 依赖漏洞审计（高危以上失败）
```

> 注：`_headers` 由 Cloudflare Pages 自动生效；EdgeOne Pages 请在控制台或边缘函数中
> 配置等价的安全响应头。安全规则、`.github/`、`shared/api/` 的变更需所有者复核
> （见 `.github/CODEOWNERS`）。

## 🛠️ 技术栈

| 技术 | 版本 | 描述 |
|------|------|------|
| [Astro](https://astro.build) | 7.2 | 静态站点构建（Vite 8 驱动） |
| [Tailwind CSS](https://tailwindcss.com) | 4.3 | 实用优先 CSS 框架（Vite 插件集成） |
| [Font Awesome Free](https://fontawesome.com) | 7.3 | 图标库 |
| [TypeScript](https://www.typescriptlang.org) | 6.0 | 类型安全的 JavaScript（strict） |

## 📦 npm 脚本

```bash
pnpm dev        # 启动开发服务器（http://localhost:4321）
pnpm start      # 同 dev
pnpm build      # astro build + 生成部署文件（dist/）
pnpm preview    # 预览构建结果
pnpm typecheck  # 仅执行 astro check
pnpm test       # 安全回归用例（node --test）
pnpm security:audit  # 依赖漏洞审计
```

## 🚀 部署

目前实际支持两种「静态站点 + 边缘函数」目标，**统一使用 `pnpm build`**；`functions/` 与 `edge-functions/` 由平台自动识别为函数目录。

### Cloudflare Pages

1. 推送代码到 GitHub，在 Cloudflare Pages 导入项目
2. 构建命令 `pnpm build`，输出目录 `dist`
3. `functions/api/*.ts` 自动成为 Pages Functions；构建脚本生成的 `dist/_routes.json` 与 `dist/_headers` 负责函数路由与缓存头

### EdgeOne Pages

1. 推送代码到 GitHub，在 EdgeOne Pages 导入项目，框架预设选 **Astro**
2. 构建命令 `pnpm build`，输出目录 `dist`
3. `edge-functions/api/*.js` 自动部署为边缘函数

### 子路径部署

设置 `PANEL_BASE`（如 `/panel/`）即可让静态资源与路由带上前缀；若 API 部署在其它域名，可把 `PANEL_API_BASE` 设为绝对 URL，此时前端直连该地址，需要自行配置 CORS。

> 历史版本 README 中的 `DEPLOY_TARGET` 与 `pnpm build:edgeone / build:vercel / build:cloudflare` 已不存在；项目没有 Vercel 适配器，Vercel 不是受支持的部署目标。

## 🎨 自定义示例

### 添加新分类

1. 编辑 [src/data/links.ts](src/data/links.ts)，在 `CATEGORIES` 中追加分类
2. 刷新页面（已有本地配置时请在设置面板中「恢复默认导航」，或直接使用编辑模式）

### 修改图标

浏览 [Font Awesome 图标库](https://fontawesome.com/icons)，使用对应类名：`fas fa-*`（实心）、`far fa-*`（线条）、`fab fa-*`（品牌）。设置 `useIcon: true` 时优先使用网站 favicon，失败回退 Font Awesome。

## 📱 浏览器兼容性

- ✅ Chrome / Edge（最新版）
- ✅ Firefox（最新版）
- ✅ Safari 14+
- ✅ 移动浏览器（iOS Safari、Chrome Mobile）

> 项目已适配 `prefers-reduced-motion`，为减弱动画偏好的用户提供无障碍体验。

## 📄 项目信息

- **版本**: 1.0.0
- **类型**: 纯静态站点 + 边缘函数 API
- **框架**: Astro 7
- **部署平台**: Cloudflare Pages、EdgeOne Pages
- **开发端口**: 4321

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

Created with ❤️ by [lvcdy](https://blog.lvcdy.cn)

---

有任何问题或建议，欢迎提交 Issue 或 Pull Request！
