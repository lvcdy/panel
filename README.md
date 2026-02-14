# Panel - 个人导航仪表板 🎯

一个简洁高效的个人导航仪表板，用于快速访问常用网站、工具和服务。基于 Astro 和 Tailwind CSS 构建的现代化个人导航门户。

## ✨ 主要功能

- 🔍 **多搜索引擎快速切换** - 支持百度、Google、Bing、GitHub 等，支持智能防抖搜索
- 🌐 **分类导航** - 可折叠的分类卡片，支持检测链接可用性
- 🎨 **现代化设计** - 基于 Tailwind CSS 的毛玻璃 UI，支持动态背景
- ⚡ **性能优化** - 图标本地缓存（7天）、并发请求控制、懒加载与 requestIdleCallback 调度
- 📱 **响应式布局** - 完美适配桌面、平板和手机
- 🌍 **网络仪表盘** - 实时显示时间、双栈 IP 地址（IPv4/IPv6）、运营商、详细地理位置（至区县）及网络类型
- 🧩 **模块化架构** - 清晰的代码结构，易于维护和扩展

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

### 安装和运行

```bash
# 克隆项目
git clone <repository-url>
cd panel

# 安装依赖
pnpm install

# 本地开发（访问 http://localhost:4321）
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
panel/
├── public/                  # 静态资源
├── src/
│   ├── assets/             # 图片和媒体资源
│   ├── components/         # Astro 组件
│   │   ├── FloatingCtrl.astro # 浮动控制按钮
│   │   ├── Footer.astro       # 页脚组件
│   │   ├── Header.astro       # 头部（时间/日期/IP）
│   │   ├── LinkList.astro     # 链接列表
│   │   └── Search.astro       # 搜索栏组件
│   ├── data/
│   │   └── links.ts        # 导航链接和搜索引擎配置
│   ├── layouts/
│   │   └── Layout.astro    # 页面布局
│   ├── lib/                # 工具函数库
│   │   ├── cache.ts        # 缓存管理（localStorage）
│   │   ├── category.ts     # 分类折叠逻辑
│   │   ├── config.ts       # 全局配置常量
│   │   ├── dom.ts          # DOM 选择器封装
│   │   ├── hitokoto.ts     # 一言 API封装
│   │   ├── icons.ts        # 图标缓存与处理
│   │   ├── ip.ts           # IP 信息获取与解析
│   │   ├── main.ts         # 统一导出入口
│   │   ├── provider.ts     # 服务商检测
│   │   ├── search.ts       # 搜索与筛选逻辑
│   │   ├── status.ts       # 链接状态检测（带并发控制）
│   │   ├── time.ts         # 时间更新
│   ├── pages/
│   │   └── index.astro     # 首页入口（组装组件）
│   └── styles/
│       └── global.css      # 全局样式
├── astro.config.mjs        # Astro 配置
├── tailwind.config.mjs     # Tailwind 配置
└── package.json            # 项目配置
```

## ⚙️ 配置指南

### 修改导航链接

编辑 [src/data/links.ts](src/data/links.ts) 文件，修改 `CATEGORIES` 数组：

```typescript
export const CATEGORIES = [
  {
    title: "分类名称",
    links: [
      {
        name: "链接名称",
        url: "https://example.com",
        icon: "fas fa-icon-name",
        color: "#3498db"
      }
    ]
  }
];
```

**参数说明：**
- `title` - 分类标题
- `links` - 链接数组
  - `name` - 链接名称
  - `url` - 链接地址
  - `icon` - [Font Awesome](https://fontawesome.com/icons) 图标类名
  - `color` - 十六进制颜色值

### 配置搜索引擎

在 [src/data/links.ts](src/data/links.ts) 中编辑 `SEARCH_ENGINES` 数组：

```typescript
export const SEARCH_ENGINES = [
  { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'fas fa-paw' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'fab fa-google' },
  { id: 'bing', name: 'Bing', url: 'https://cn.bing.com/search?q=', icon: 'fab fa-microsoft' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', icon: 'fab fa-github' }
];
```

### 页脚自定义

编辑 [src/components/Footer.astro](src/components/Footer.astro) 中的配置对象：

```typescript
const profileConfig = {
  name: "你的名字",  // 修改用户名
  // 其他配置...
};
```

### IP 地址显示

项目默认启用 IP 地址和地理位置显示，使用公网 IP 查询接口：
- 显示公网 IP 和城市位置信息
- 如果 API 无法访问，显示"欢迎回来"

## 🛠️ 技术栈

| 技术 | 描述 |
|------|------|
| [Astro](https://astro.build) | 现代静态站点生成框架 |
| [Tailwind CSS](https://tailwindcss.com) | 实用优先的 CSS 框架 |
| [Font Awesome Free](https://fontawesome.com) | 本地 npm 图标库（@fortawesome/fontawesome-free） |
| [TypeScript](https://www.typescriptlang.org) | 类型安全的 JavaScript |
| Fetch API | 浏览器原生请求能力 |

## 📦 npm 脚本

```bash
pnpm dev       # 启动开发服务器
pnpm build     # 构建生产版本
pnpm preview   # 预览构建结果
pnpm astro     # 运行 Astro CLI 命令
```

## 🎨 自定义示例

### 添加新分类

1. 打开 [src/data/links.ts](src/data/links.ts)
2. 在 `CATEGORIES` 数组末尾添加：

```typescript
{
  title: "新分类",
  links: [
    {
      name: "网站名称",
      url: "https://example.com",
      icon: "fas fa-star",
      color: "#f39c12"
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

## 📱 浏览器兼容性

- ✅ Chrome / Edge (最新版)
- ✅ Firefox (最新版)
- ✅ Safari 14+
- ✅ 移动浏览器 (iOS Safari, Chrome Mobile)

## 🚀 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 访问 [Vercel](https://vercel.com) 导入项目
3. 自动识别 Astro 框架
4. 点击部署完成

### 其他平台

本项目构建输出为静态文件，可部署到任何静态托管平台：
- GitHub Pages
- Netlify
- Cloudflare Pages
- 自有服务器（Nginx、Apache 等）

## 📄 项目信息

- **版本**: 1.0.0
- **类型**: 静态网站
- **构建输出**: `./dist/`
- **开发端口**: 4321

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

Created with ❤️ by [lvcdy](https://blog.lvcdy.cn)

---

有任何问题或建议，欢迎提交 Issue 或 Pull Request！
