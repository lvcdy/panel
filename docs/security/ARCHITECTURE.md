# Panel 代码安全防御架构

本文件是本仓库的**安全架构与规则符合性说明**，对应《代码安全防御架构规则》
v1.0 的六种核心架构：Microsoft SDL、OWASP ASVS 5.0（L2）、SLSA v1.2、
SBOM + Sigstore/cosign、零信任、Saltzer & Schroeder 八原则。

- 威胁建模：[THREAT-MODEL.md](THREAT-MODEL.md)
- 合并评审清单：[REVIEW-CHECKLIST.md](REVIEW-CHECKLIST.md)
- 漏洞披露：[SECURITY.md](../../SECURITY.md)
- 自动化：`.github/workflows/security.yml`

---

## 1. 范围与资产

应用形态：Astro 7 纯静态站点 + 两个只读边缘函数（Cloudflare Pages Functions /
EdgeOne Pages Functions），配置仅存于用户浏览器 `localStorage`，无账号体系、
无服务端数据库、无服务端写入。

| 资产 | 位置 | 敏感性 | 保护目标 |
|------|------|--------|----------|
| 导航配置（分类/链接/设置） | 用户浏览器 `localStorage` | 低（用户可完全控制） | 完整性、可用性；渲染前必须校验与转义 |
| 访客公网 IP / ISP 信息 | 边缘函数内存（不落盘） | 中（个人数据） | 仅回传调用方自身；不持久化、不写日志 |
| 上游代理配额（状态查询、IP9） | 第三方服务 | 中 | 防滥用（限速、超时、单一上游） |
| 发布产物（`dist/`） | CI/CD | 高 | 完整性、可追溯（SBOM、签名、provenance） |
| 边缘函数运行环境 | 平台托管 | 高 | 最小权限、无持久状态 |

---

## 2. Microsoft SDL（安全开发生命周期）

| SDL 阶段 | 本仓库落实方式 | 证据 |
|----------|----------------|------|
| 需求 | 按 OWASP ASVS 5.0 L2 作为可验收安全需求（见 §4） | 本文件 |
| 设计 | 显式信任边界图 + STRIDE 威胁模型；新增跨边界调用必须更新 | [THREAT-MODEL.md](THREAT-MODEL.md) |
| 实现 | 默认拒绝、允许列表校验、输出编码、无自研密码学；安全规则集中 | `shared/api/ip.js`、`src/lib/utils.ts`、`src/lib/panel/validate.ts` |
| 验证 | `pnpm typecheck`、`pnpm test`（安全回归用例）、CodeQL、gitleaks、`pnpm audit` | `tests/security.test.mjs`、`.github/workflows/security.yml` |
| 发布 | 锁文件构建、SBOM 生成、cosign 签名、provenance 证明 | `.github/workflows/security.yml` |
| 响应 | 披露渠道 + SLA + 事件响应流程 | `SECURITY.md`、本文件 §13 |

SDL 关口（Gate）：任何 PR 合并前必须通过
[REVIEW-CHECKLIST.md](REVIEW-CHECKLIST.md) 与 CI 安全任务；未通过不得合并。

---

## 3. 零信任（Zero Trust）

原则：**网络位置不等于信任，每次访问都验证**。

| 访问路径 | 验证动作 | 代码 |
|----------|----------|------|
| 浏览器 → 静态资源 | TLS（平台）+ 安全响应头（CSP/HSTS/…） | `scripts/generate-deployment-files.mjs` 生成 `_headers` |
| 浏览器 → 边缘函数 | 来源白名单（CORS，默认拒绝）+ 限速 + 方法白名单（仅 GET/OPTIONS） | `shared/api/cors.js`、`shared/api/rate-limit.js`、两个 handler |
| 边缘函数 → 第三方上游 | 只使用固定上游 URL；输入先经允许列表校验；超时 + 失败关闭 | `shared/api/site-status.js`、`network-info.js`、`ip.js` |
| 浏览器 → 第三方（天气/一言/图标/背景） | 数据按不可信处理，仅用于展示；URL 经 `isValidHttpUrl` 校验 | `src/lib/weather/*`、`hitokoto.ts`、`background.ts`、`panel/validate.ts` |
| 浏览器 → `localStorage` | 视为不可信输入：JSON schema 全量校验后才能渲染 | `src/lib/panel/store.ts`、`validate.ts` |

不信任的来源具体包括：`Origin`/`Referer`、`X-Forwarded-For`、用户输入的域名/URL、
localStorage 内容、第三方 API 返回体。**只信任**平台注入的客户端信息：
Cloudflare 的 `cf-connecting-ip` + `request.cf`、EdgeOne 的 `request.eo.clientIp` /
`request.eo.geo`（旧接入兼容 `eo-connecting-ip`），且仍对 IP 做公网校验；业务输入
必须经允许列表校验后才使用。

---

## 4. OWASP ASVS 5.0（L2 验收基线）

| ASVS 章节 | 适用性 | 落实方式 |
|-----------|--------|----------|
| V1 编码与架构 | ✅ | 分层（静态/边缘/浏览器）、单一数据源 store、规则集中、默认拒绝 |
| V2 认证 | ❌ N/A | 无账号体系、无登录 |
| V3 会话管理 | ❌ N/A | 无会话令牌 |
| V4 访问控制 | ⚠️ 部分 | 无多用户资源；API 只读且无用户数据；CORS 白名单即资源级访问控制 |
| V5 输入校验 | ✅ | 允许列表：域名、公网 IP、URL、图标类名、hex 颜色、标签长度、备份 schema |
| V6 密码学 | ⚠️ N/A | 应用不自行加解密；传输安全由平台 TLS（HSTS 开启）提供 |
| V7 错误处理与日志 | ✅ | 统一 `{error}`、无堆栈回显；平台日志观察 4xx/5xx；无敏感数据入日志 |
| V8 数据保护 | ✅ | 不采集多余字段；IP 仅在内存中短暂处理；配置留在用户设备；无服务端持久化 |
| V9 通信 | ✅ | 全站 HTTPS + HSTS；上游调用固定 HTTPS；无明文降级逻辑 |
| V10 恶意代码 | ✅ | 无可执行上传；静态资源由构建产物提供；CSP + `object-src 'none'` |
| V11 业务逻辑 | ✅ | 服务端唯一业务逻辑是 API 输入校验与上游白名单；客户端配置逻辑不构成安全边界 |
| V12 文件与资源 | ⚠️ 部分 | 无服务端文件上传；本地备份导入校验类型/大小/JSON schema（≤5MB） |
| V13 API | ✅ | 仅 GET；方法白名单；CORS 默认拒绝；限速；错误不泄露内部信息 |
| V14 配置 | ✅ | 安全头集中生成；依赖锁定；环境变量白名单；生产无调试开关 |

---

## 5. SLSA v1.2（Source / Build Track）

- **Source Track**：`main` 分支受保护、变更经 PR；安全规则/工作流/API 变更需
  CODEOWNERS 复核（`.github/CODEOWNERS`）。
- **Build Track**：
  - 构建在 GitHub 托管 runner 上执行（隔离、临时）；
  - `pnpm install --frozen-lockfile` 保证依赖与 `pnpm-lock.yaml` 完全一致；
  - 仅使用官方 npm registry + 锁文件完整性校验（`pnpm-lock.yaml` integrity）；
  - 构建后生成 SBOM、计算 SHA-256、生成 provenance 证明
    （`actions/attest-build-provenance`）；
  - 发布前用 `cosign verify-blob` 复核签名与来源身份。
- **当前等级**：Build L2（托管构建 + provenance）。**L3 路线图**：将发布流程
  迁移到 `slsa-framework/slsa-github-generator` 的隔离构建器，并启用可复现构建
  校验；完成前不宣称 L3。

---

## 6. SBOM + Sigstore / cosign

- **SBOM**：每次 CI 构建生成 CycloneDX（`@cyclonedx/cyclonedx-npm`），与构建产物
  一起归档为 GitHub Actions Artifact（保留期按仓库设置），并在 release 附件中发布。
- **签名**：使用 cosign keyless（OIDC 身份 = 本仓库 workflow）对构建归档做
  `sign-blob`；签名与证书随产物归档。
- **验证**：`cosign verify-blob --certificate-identity-regexp
  "^https://github.com/<owner>/<repo>/" --certificate-oidc-issuer
  https://token.actions.githubusercontent.com`。

---

## 7. Saltzer & Schroeder 八原则

| 原则 | 落实 |
|------|------|
| 最小权限 | 边缘函数只读、无持久状态、无数据库/文件权限；浏览器仅请求 geolocation 必要权限；CI 每个 job 最小 `permissions` |
| 失败安全默认（Fail-safe defaults） | CORS 默认拒绝；未登记方法 405；未配置白名单 = 不允许跨源；上游失败返回 502/UNKNOWN 而非放行 |
| 完全仲裁（Complete mediation） | 每个 API 请求都经过 CORS → 方法 → 限速 → 输入校验链；不存在绕过路径 |
| 开放设计（Open design） | 全部源码与本文档公开；安全性不依赖保密，仅依赖密钥/白名单配置 |
| 权限分离（Separation of privilege） | 高风险配置操作（删除分类、恢复默认、全量导入）需要用户二次确认（`confirm.ts` + 二次弹窗）；发布签名与验证分离 |
| 最小公共机制（Least common mechanism） | 共享状态仅限内存限速桶；无跨用户共享数据 |
| 心理可接受性（Psychological acceptability） | 安全默认不牺牲可用性：同源请求零配置、失败降级为默认导航 |
| 最小惊讶 / 记录使用（Work factor & recording） | 4xx/5xx 由平台日志记录；安全相关变更走评审与 CI |

---

## 8. 纵深防御（每项资产 ≥ 2 条独立防线）

| 资产 | 防线 1 | 防线 2 | 独立性 |
|------|--------|--------|--------|
| API 可用性 | 应用层限速（`rate-limit.js`） | 平台 WAF/速率规则（Cloudflare/EdgeOne 控制台） | 不同执行层 |
| 访客 IP 隐私 | 仅信任平台头 + 公网 IP 校验 | 不落盘、不写日志、`no-store` | 校验与数据生命周期独立 |
| 上游滥用 | 固定上游 + 输入校验（防 SSRF） | 上游超时（1.5s/2.5s）+ 客户端超时（2.5s/5s） | 输入侧与网络侧独立 |
| XSS | 输出编码（`escapeHtml/escapeAttr`、`textContent`） | CSP + `X-Content-Type-Options` + 无 `eval` | 渲染侧与响应头侧 |
| 点击劫持 | `X-Frame-Options: DENY` | CSP `frame-ancestors 'none'` | 两套独立头 |
| 发布产物完整性 | SBOM + 签名（cosign） | provenance 证明 + 锁文件构建 | 两种独立机制 |
| 配置篡改 | 导入 schema 校验 | 渲染前全量 `validatePanelConfig` + 转义 | 导入侧与渲染侧 |
| 供应链 | `pnpm audit` 阻断高危 | 锁文件 + 官方 registry + SBOM | 漏洞侧与来源侧 |

---

## 9. 最小权限与权限清单

**本应用没有账号、角色或服务端权限模型**（N/A 的规则见 §12）。运行权限清单：

| 主体 | 权限 | 说明 |
|------|------|------|
| 边缘函数 | 只读网络出口 + 内存 | 无数据库、无 KV、无文件系统写入、无环境写权限 |
| CI `audit` job | `contents: read` | 只读仓库 |
| CI `codeql` job | `contents: read`, `security-events: write` | 仅上传扫描结果 |
| CI `sbom-sign` job | `contents: read`, `id-token: write`, `attestations: write` | 仅用于 keyless 签名与 provenance |
| 浏览器 | `geolocation`（按需） | 仅天气功能使用；拒绝时回退北京 |
| 仓库所有者 | 管理权限 | 通过分支保护 + CODEOWNERS 约束 |

---

## 10. 数据分类与最小化

| 数据 | 处理方式 |
|------|----------|
| 访客 IP | 仅在请求生命周期内用于查 ISP；不持久化、不入日志、响应仅返回调用方自身 |
| 上游返回体 | 白名单字段过滤后返回；非法字段丢弃（`sanitizeSiteStatusPayload`） |
| 用户配置 | 仅存浏览器本地；导出文件由用户自行保管；备份导入限制大小与 schema |
| 备份文件 | 服务端不接收；导入端校验 app/kind/formatVersion/大小/JSON 结构 |

---

## 11. 日志、审计与告警

- 应用不记录令牌/凭证/完整 IP；错误响应统一为 `{error}`，不含堆栈。
- 平台日志记录函数请求（状态码、耗时）；安全相关 4xx/5xx 由 Cloudflare /
  EdgeOne 日志与告警观察。
- 无登录/授权事件（无账号体系），因此「审计」聚焦于发布操作：Git 历史 +
  PR 评审 + CI 运行记录（可追溯谁在何时合入了什么）。
- 告警：在平台控制台为 429/5xx 峰值配置告警；责任人 = 仓库所有者。

---

## 12. 不适用规则说明（N/A 证据）

以下规则因本应用**不存在对应攻击面**而不适用，已登记结论：

| 规则 | 结论与理由 |
|------|------------|
| A-08 权限分离（服务端高风险动作） | 服务端无写操作；客户端高风险操作已有二次确认（`panel/confirm.ts`、分类删除/恢复默认） |
| B-02 会话令牌 | 无认证、无会话、无令牌 |
| B-05 生物识别/免密登录 | 无登录功能 |
| B-06 认证与授权分离 | 无认证体系 |
| B-08 敏感操作二次验证 | 无改密/绑卡/交易；客户端破坏性操作已二次确认 |
| C-01/C-02/C-04/C-05/C-06 服务端授权/RBAC/批量接口/权限点/管理接口 | 无多用户资源、无批量写接口、无管理后台 |
| D-01/D-03/D-06/D-07/D-09 密码学与敏感数据 | 应用不自行加解密、不存储秘密；TLS 由平台提供；无敏感页面/备份密钥/HSM 需求 |
| E-06 服务端业务终校验 | 无金额/数量/状态流转；服务端唯一逻辑是 API 输入白名单校验 |
| E-07 文件上传 | 无服务端上传；本地备份导入已校验类型/大小/结构 |
| E-09 模糊测试 | 无可被 fuzz 的复杂解析器；输入校验由允许列表 + 单元测试覆盖 |
| F-06 客户端混淆 | Web 产物由 Astro/esbuild 压缩打包；无原生 App 的 R8/ProGuard 需求 |
| F-07 更新包双签名 | 无自更新/安装包；静态站点由平台原子发布 |
| F-09 SLSA L3 | 当前 L2（见 §5），L3 为路线图项 |
| G-06 非 root 运行 | 无自管服务器；边缘函数运行在平台沙箱 |
| H-01 登录/授权审计 | 无登录/授权事件；发布操作可审计（Git/PR/CI） |
| H-04/H-05 告警与响应 | 无长驻服务；仍建立披露 SLA 与事件响应流程（§13） |
| I-05/I-06 季度抽查与渗透测试 | 作为流程计划登记：每季度做规则符合性抽查并留档；每半年做一次渗透/红蓝演练（范围见 §13） |
| J-03 依赖来源 | 所有依赖在 `package.json` 显式声明、锁定于 `pnpm-lock.yaml`、来自官方 npm registry，无 sibling/宿主未声明依赖 |

---

## 13. 事件响应

1. **发现**：私有 Advisory / 邮件；CI 或平台告警。
2. **定位**：确认受影响版本、范围与攻击面；保留证据（日志、构建产物哈希）。
3. **止血**：回滚到上一个已验证构建（平台一键回滚）；必要时收紧 CORS
   白名单/限速；吊销并轮换任何泄露的密钥。
4. **复盘**：在 `SECURITY.md` 记录时间线；更新威胁模型与规则；补充回归测试。
5. **披露**：修复发布后发布 Advisory，致谢报告者。

---

## 14. 安全评审与变更控制

- 所有变更走 PR，使用 `.github/pull_request_template.md`；
  清单见 [REVIEW-CHECKLIST.md](REVIEW-CHECKLIST.md)。
- 安全规则、`.github/`、`shared/api/` 的变更必须由所有者复核
  （`.github/CODEOWNERS` + 分支保护「Require review from Code Owners」）。
- 每季度由所有者做一次规则符合性抽查并留档（Issue/PR 记录）；
  每半年在预发布环境做一次渗透/红蓝演练（覆盖 API CORS/限速/输入校验、
  XSS、供应链篡改场景），结论归档到本文件附录。

## 15. 残留风险与路线图

| 项 | 风险 | 计划 |
|----|------|------|
| CSP `'unsafe-inline'` | 内联防闪脚本需要内联；弱化脚本来源限制 | 用静态 hash/nonce 收敛到无 `unsafe-inline` |
| 限速为 isolate 内存 | 多实例下不精确 | 叠加平台 WAF 速率规则（文档要求部署方配置） |
| EdgeOne 安全头 | `_headers` 仅 Cloudflare 自动生效 | EdgeOne 控制台/边缘函数配置等价头（文档说明） |
| 第三方隐私 | 天气/一言/图标会看到访客 IP | README 披露；可自建代理（`PANEL_API_BASE`） |
