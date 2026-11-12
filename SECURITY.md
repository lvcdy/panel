# 安全策略（Security Policy）

Panel 是一个纯静态的个人导航站点，服务端只有两个只读的边缘函数
（`/api/network-info`、`/api/site-status`）。我们仍然按「安全开发生命周期 +
可验收安全需求 + 供应链可验证」的方式维护它，规则与证据见
[docs/security/ARCHITECTURE.md](docs/security/ARCHITECTURE.md)。

## 支持版本

| 版本 | 支持状态 |
|------|----------|
| `main` 分支最新提交 | ✅ 接收安全修复 |
| 已归档/派生部署 | ❌ 请升级到最新 `main` |

## 漏洞报告

- **请勿公开提交 Issue**。优先使用 GitHub 私有漏洞报告：
  `Security` → `Report a vulnerability`（GitHub Security Advisories）。
- 备选渠道：邮件 `lvcdy@lvcdy.cn`（标题注明 `[panel security]`）。
- 请在报告中提供：受影响版本/提交、复现步骤、影响评估、可选修复建议。
- 我们承诺：**3 个工作日内确认收到**，**10 个工作日内给出初步评估与修复计划**；
  修复发布后会在 Advisory 中致谢（除非你要求匿名）。
- 安全港：在遵守「不破坏数据、不横向扩散、不公开细节」前提下进行的善意测试，
  我们不会追究。

## 安全基线（摘要）

- 输入：域名/IP 采用**允许列表**校验（`shared/api/ip.js`），拒绝 IP 字面量、
  单标签主机、`.local/.internal/.lan` 等内部域；从不请求用户提供的 URL（防 SSRF）。
- 跨域：**默认拒绝**，只有 `PANEL_ALLOWED_ORIGINS` 白名单内的来源获得 CORS 头。
- 速率：两个 API 均有限速（默认 120 次/分钟/客户端，按路由分桶），并建议在
  Cloudflare / EdgeOne 侧再叠加 WAF 速率规则（纵深防御）。
- 输出：HTML 一律经过 `escapeHtml/escapeAttr`，JSON 只回传白名单字段；
  错误响应不携带堆栈。
- 供应链：依赖锁定 + `pnpm audit` 阻断高危、SBOM（CycloneDX）归档、
  cosign 签名与构建 provenance（见 `.github/workflows/security.yml`）。
- 发布头：CSP、HSTS、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、
  Permissions-Policy、COOP（Cloudflare Pages 的 `dist/_headers`）。

## 安全评审与告警

- 合并前必须通过 `.github/pull_request_template.md` 中的安全评审清单
  （对应 [docs/security/REVIEW-CHECKLIST.md](docs/security/REVIEW-CHECKLIST.md)）。
- 安全规则、工作流、`shared/api/` 的变更必须由仓库所有者复核
  （`.github/CODEOWNERS` + 分支保护）。
- 关键异常（鉴权/限速/上游失败）通过平台日志观察；需要告警时在 Cloudflare /
  EdgeOne 控制台为 4xx/5xx 配置告警，责任人为仓库所有者。
- 事件响应流程见 [docs/security/ARCHITECTURE.md](docs/security/ARCHITECTURE.md#事件响应)。
