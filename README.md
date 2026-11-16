# WeChat Obsidian Agent

微信入口、OpenClaw Agent Runtime、DeepSeek Vision 与 FNS MCP 的重构项目。

截至 2026-11-16，服务器已运行 OpenClaw 与 FNS；已核实的版本、服务状态和无凭据配置快照见 [`docs/PRODUCTION_RUNTIME.md`](docs/PRODUCTION_RUNTIME.md)。本仓库维护业务规则、安全策略、Skill、插件、配置示例和测试；不复制 OpenClaw 或旧 `weixin-bridge` Runtime。

## 开发边界

- GitHub Private Repository 是开发源。服务器截至 2026-11-16 部署的是 `144080a9b1582d74222de9a51ff32f04bff0e41a`；GitHub `main` 已更新，当前部署状态见 [生产快照](docs/PRODUCTION_RUNTIME.md)。
- 普通 CI 不连接外部服务；历史 N1 smoke 的手动联调范围见 [N1 记录](docs/N1_RUNTIME.md)。
- 仓库内配置均为 example；生产私有配置中的凭据不提交。
- G1+ 的业务实现按阶段推进，见 [`docs/PROJECT.md`](docs/PROJECT.md)。

## 本地检查

```bash
npm ci
npm run ci
```

离线检查覆盖类型、语法和测试；真实服务联调仍需单独验收。

## 安装现状

仓库目前是 GitHub Private，未获访问权限者无法下载；仓库也没有开源许可证，不应视为已开源可分发。克隆仓库并运行 `npm ci` 只准备源码和本地离线检查，不会自动安装到 OpenClaw。

[`skills/wrong-question/SKILL.md`](skills/wrong-question/SKILL.md) 需要按目标 OpenClaw 版本支持的方式安装或注册到 Agent workspace，才能被发现。这一步不会自动接通 TypeScript domain、FNS MCP、DeepSeek 或腾讯微信插件。[JSON5 示例](openclaw/README.md) 缺少私有字段，不能直接部署。仓库尚无完整可复现的安装器，也没有陌生机器端到端验收，不能保证第三方克隆后即用。

## 目录

- `docs/`：项目、架构、迁移、部署、安全、测试和验收约定
- `openclaw/`：OpenClaw 的非敏感示例配置及 workspace 自定义规则
- `skills/`：`wrong-question` 已有业务规则与 TypeScript domain；`schedule` 仍为占位
- `extensions/obsidian-policy/`：Obsidian Policy Plugin 骨架
- `tests/`：测试分层和 fixture 目录
- `scripts/`：smoke 入口；`package-release.sh` 与 `deploy.sh` 为不执行实际打包或部署的占位脚本

## 状态边界

OpenClaw、FNS 和微信插件已在生产配置中启用；这些服务的运行状态不等于本仓库所有业务流程均完成端到端验收。Wrong Question 离线 domain 已在 G2 完成；具体生产配置和本次核验边界以 [当前快照](docs/PRODUCTION_RUNTIME.md) 为准。
