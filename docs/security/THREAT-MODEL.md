# 威胁模型（STRIDE）

范围：`panel` 静态站点、两个边缘函数（`/api/network-info`、`/api/site-status`）、
浏览器本地配置（`localStorage`）、以及对外部公共服务（天气、一言、图标、状态查询）
的调用。更新时机：新增跨信任边界调用、新增 API、修改数据/权限模型时。

## 信任边界

```
[不可信] 浏览器 / 访客输入 / 第三方页面
   │  HTTPS（TLS 由平台终结）        ← 边界 1：公网 → CDN/静态资源
   ▼
[半可信] Cloudflare Pages / EdgeOne Pages（静态资源 + 边缘函数）
   │  platform 注入头（cf-connecting-ip / eo-connecting-ip、request.cf）
   ▼                                ← 边界 2：边缘函数 → 第三方上游
[不可信] ip9.com.cn、isyourwebsitedownrightnow.com
   ▲
   │  浏览器直连（不经过我们的服务端） ← 边界 3：浏览器 → 第三方（天气/一言/图标/背景）
[不可信] api.seniverse.com、api.lvcdy.cn、api.afmax.cn、t.alcy.cc

本地存储：localStorage 属于用户可完全控制的数据，仅按「不可信输入」处理 ——
渲染前一律经 `validate.ts` 全量校验与 `escapeHtml/escapeAttr` 编码。
```

## STRIDE 分析

| 类别 | 具体威胁 | 缓解措施（代码位置） | 残余风险 |
|------|----------|----------------------|----------|
| **S**poofing | 伪造客户端 IP 头，冒充他人查询 ISP/位置 | 只信任平台注入的客户端信息：Cloudflare 的 `cf-connecting-ip` + `request.cf`；EdgeOne 的 `request.eo.clientIp` / `request.eo.geo`（旧接入兼容 `eo-connecting-ip`）。显式忽略 `X-Forwarded-For`（`shared/api/network-info.js`）；IP 经 `normalizePublicIp` 校验 | 开发中间件下头可被本地伪造：仅本地影响，已在文档说明 |
| **T**ampering | 篡改 `panel-config` / 备份 JSON 注入恶意 HTML/URL | 导入时校验 `app/kind/formatVersion/大小/JSON schema`；渲染全部转义；URL 仅 http(s)、图标类名白名单（`src/lib/panel/validate.ts`、`render.ts`） | 用户可修改自己的配置：按设计预期，不视为越权 |
| **R**epudiation | 无法证明谁改过配置 | 配置仅存在用户浏览器，无多用户/无服务端写入；变更由用户本地操作触发 | 无服务端审计需求 |
| **I**nformation disclosure | 通过 API 获取访客 IP；错误响应泄露堆栈/内部信息 | IP 仅回传调用方自身；错误统一 `{error}` 无堆栈；`no-store`；CORS 默认拒绝；安全响应头（CSP/HSTS/Referrer-Policy） | IP9 上游会看到访客公网 IP：已在 README 披露 |
| **D**enial of service | 滥用代理接口刷上游/耗尽配额 | 每路由固定窗口限速 + 平台 WAF 建议；上游请求 1.5s/2.5s 超时；客户端并发 4 + 2s/5s 超时；静态资源长缓存 | 边缘 isolate 内存限速为尽力而为，需平台 WAF 兜底 |
| **E**levation of privilege | 通过接口越权访问他人数据/执行写操作 | API 只支持 GET，且无用户体系、无服务端数据写入；`OPTIONS` 仅预检；未登记方法 405 | 无权限模型可被提升（N/A） |
| 供应链 | 依赖投毒、构建产物被替换 | 锁文件 + `--frozen-lockfile`、`pnpm audit --audit-level=high`、SBOM、cosign 签名、GitHub provenance、仅官方 npm registry | 上游 npm 账号被攻破（由签名/SBOM 提供可追溯性） |
| 客户端 | XSS / 点击劫持 / 信息泄露 | 全量转义 + `textContent`；无 `eval`/`innerHTML` 拼接用户输入；CSP + `X-Frame-Options: DENY` | CSP 目前允许 `'unsafe-inline'`（Astro 内联防闪脚本），后续以 hash/nonce 收紧 |

## 不在范围内的项目

- 用户设备被攻破（恶意扩展/键盘记录）。
- 第三方服务自身的可用性与隐私政策。
- 用户把 `PANEL_API_BASE` 指向自建代理后的安全责任（见 README 部署说明）。
