# WeChat Obsidian Agent

微信入口、OpenClaw Agent Runtime、DeepSeek Vision 与 FNS MCP 的重构项目。

当前阶段：**G0 项目骨架（v0）**。本仓库只维护本项目的业务规则、安全策略、Skill、插件和测试；不复制 OpenClaw 或旧 `weixin-bridge` Runtime。

## 开发边界

- GitHub Private Repository 是开发源；生产环境只运行明确的 Release/Tag。
- G0 不连接真实微信、DeepSeek、FNS 或生产服务器。
- 所有配置均为 example；真实凭据通过本地环境或部署平台注入，绝不提交。
- G1+ 的业务实现按阶段推进，见 [`docs/PROJECT.md`](docs/PROJECT.md)。

## 本地检查

```bash
npm install
npm test
```

G0 测试只验证骨架和安全边界；真实服务联调属于手动验收，不进入普通 CI。

## 目录

- `docs/`：项目、架构、迁移、部署、安全、测试和验收约定
- `openclaw/`：OpenClaw 的非敏感示例配置
- `skills/`：本项目 Skill 占位与后续业务规则
- `extensions/obsidian-policy/`：Obsidian Policy Plugin 骨架
- `tests/`：测试分层和 fixture 目录
- `scripts/`：后续 smoke、release、部署入口（G0 仅占位）

## 当前未实现

错题识别/渲染、图片处理、FNS MCP 调用、真实 OpenClaw 注册、微信插件接入和生产部署均留待后续阶段。
