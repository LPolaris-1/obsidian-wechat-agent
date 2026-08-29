# WeChat Obsidian Agent

微信入口、OpenClaw Agent Runtime、DeepSeek Vision 与 FNS MCP 的重构项目。

当前阶段：**N1 最小运行时接线（手动 smoke 前置）**。本仓库只维护本项目的业务规则、安全策略、Skill、插件和测试；不复制 OpenClaw 或旧 `weixin-bridge` Runtime。

## 开发边界

- GitHub Private Repository 是开发源；生产环境只运行明确的 Release/Tag。
- N1 的真实 DeepSeek/FNS smoke 仅允许手动执行，且写入范围限定为 `Migration-Test/`；普通 CI 不连接任何外部服务。
- 所有配置均为 example；真实凭据通过本地环境或部署平台注入，绝不提交。
- G1+ 的业务实现按阶段推进，见 [`docs/PROJECT.md`](docs/PROJECT.md)。

## 本地检查

```bash
npm install
npm test
```

离线测试验证 domain/schema/routing/render/path safety；真实服务联调属于手动验收，不进入普通 CI。当前工作机尚未安装 stock OpenClaw，因此 smoke 预检会 fail-closed，详见 [`docs/N1_RUNTIME.md`](docs/N1_RUNTIME.md)。

## 目录

- `docs/`：项目、架构、迁移、部署、安全、测试和验收约定
- `openclaw/`：OpenClaw 的非敏感示例配置
- `skills/`：本项目 Skill 占位与后续业务规则
- `extensions/obsidian-policy/`：Obsidian Policy Plugin 骨架
- `tests/`：测试分层和 fixture 目录
- `scripts/`：smoke、release、部署入口（N1 smoke 仅做安全前置探针）

## 当前未实现

真实 OpenClaw 注册、DeepSeek/FNS 联调、图片处理、微信插件接入和生产部署仍留待运行时具备后的后续阶段；Wrong Question 离线 domain 已在 G2 完成。
