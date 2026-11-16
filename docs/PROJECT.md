# 项目说明

## 目标

在保留 24 小时微信入口和 Obsidian 远程修改能力的前提下，使用 OpenClaw、Tencent WeChat Plugin、DeepSeek Vision 与 FNS MCP，替换旧项目中的自研通用基础设施。

## G0 成功标准

- 新仓库拥有可审查的目录、文档、示例配置和 CI 基础。
- 不复制旧 `weixin-bridge` 的 Runtime、状态、数据或凭据。
- 本地 `npm test` 与基础静态检查通过。

## G2 当前状态

- Wrong Question domain v1 已定义：结构化 schema、章节验证、`原档案/高数|线代` 路由、确定性 Markdown 与 write plan。
- G2 closeout 增加 stable `questionId`、chapter identity 消歧、碰撞安全文件名、严格 archive intent 与 renderer/template contract。
- 本阶段不执行写入，不连接 DeepSeek、FNS、微信或服务器，不实现章节聚合、索引、统计和图片 OCR。

## 历史 N1 阶段状态

- G2 PR #2 已 squash merge 到 `main`（`8ba00f774d7dc291f53484d1dd5c67dcc70c174b`）。
- `feature/minimal-runtime-integration` 当时仅保留 runtime smoke 前置探针和联调说明；当时工作机未发现 stock OpenClaw 可执行文件，且未注入 FNS MCP 地址/令牌，因此该阶段 DeepSeek/FNS/E2E smoke 尚未运行。
- 该阶段未修改生产配置、未连接微信、未写入真实 Vault；当时真实联调限定手动及 `Migration-Test/`。后续 N1 隔离联调记录见 [N1 Runtime](N1_RUNTIME.md)。

截至 2026-11-16 的服务器运行状态及配置见 [生产运行快照](PRODUCTION_RUNTIME.md)。

## 阶段边界

G0 只创建骨架。Wrong Question Skill、Policy Plugin 业务规则、FNS Contract、图片流程、OpenClaw 集成和服务器部署属于 G1 及以后阶段。

## 发布原则

原定原则是使用语义化版本和 Release/Tag，生产不自动跟随 `main`，也不在服务器直接修改代码。2026-11-16 核实时，服务器部署仓库与 `main` 均位于 `144080a9b1582d74222de9a51ff32f04bff0e41a`；本次文档同步未部署。
