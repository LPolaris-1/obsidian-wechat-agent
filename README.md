# WeChat Obsidian Agent

微信入口、OpenClaw Agent Runtime、DeepSeek Vision 与 FNS MCP 的重构项目。

截至 2026-11-16，服务器已运行 OpenClaw 与 FNS；已核实的版本、服务状态和无凭据配置快照见 [`docs/PRODUCTION_RUNTIME.md`](docs/PRODUCTION_RUNTIME.md)。本仓库维护业务规则、安全策略、Skill、插件、配置示例和测试；不复制 OpenClaw 或旧 `weixin-bridge` Runtime。

## 开发边界

- GitHub Private Repository 是开发源。当前服务器部署仓库与 `main` 均位于 `144080a9b1582d74222de9a51ff32f04bff0e41a`；发布策略见历史部署约定，不能据此推定后续自动跟随 `main`。
- 历史 N1 smoke 的真实 DeepSeek/FNS 联调仅允许手动执行，写入范围限定为 `Migration-Test/`；这是当时的 smoke 范围，不代表当前生产写入范围。普通 CI 不连接任何外部服务。
- 仓库内配置均为 example；生产私有配置中的凭据不提交。
- G1+ 的业务实现按阶段推进，见 [`docs/PROJECT.md`](docs/PROJECT.md)。

## 本地检查

```bash
npm install
npm test
```

离线测试验证 domain/schema/routing/render/path safety；真实服务联调属于手动验收，不进入普通 CI。历史 N1 本机联调记录见 [`docs/N1_RUNTIME.md`](docs/N1_RUNTIME.md)，当前生产快照见 [`docs/PRODUCTION_RUNTIME.md`](docs/PRODUCTION_RUNTIME.md)。

## 目录

- `docs/`：项目、架构、迁移、部署、安全、测试和验收约定
- `openclaw/`：OpenClaw 的非敏感示例配置及 workspace 自定义规则
- `skills/`：本项目 Skill 占位与后续业务规则
- `extensions/obsidian-policy/`：Obsidian Policy Plugin 骨架
- `tests/`：测试分层和 fixture 目录
- `scripts/`：smoke、release、部署入口（N1 smoke 仅做安全前置探针）

## 状态边界

OpenClaw、FNS 和微信插件已在生产配置中启用；这些服务的运行状态不等于本仓库所有业务流程均完成端到端验收。Wrong Question 离线 domain 已在 G2 完成；具体生产配置和本次核验边界以 [当前快照](docs/PRODUCTION_RUNTIME.md) 为准。
