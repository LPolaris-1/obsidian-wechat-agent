# 架构约定

目标链路：

```text
手机微信 -> Tencent openclaw-weixin -> OpenClaw Gateway
         -> Wrong Question Skill / Schedule Skill
         -> DeepSeek Provider + Obsidian Policy Plugin
         -> FNS MCP -> Fast Note Sync Service -> Obsidian
```

## 职责

- 微信插件：登录、协议、消息和媒体传输。
- OpenClaw：Agent Runtime、会话、工具调用、MCP 和模型路由。
- DeepSeek：文本/图片理解、公式识别和结构化分析。
- FNS：正式笔记与附件数据层。
- 本项目：业务 Skill、Policy 和测试。

本仓库不 Fork OpenClaw，也不把旧 bridge 的 transport、session、model loop 或 REST client 搬入新项目。
