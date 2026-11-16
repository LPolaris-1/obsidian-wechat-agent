# OpenClaw 配置示例

这里保存不含秘密的 JSON5 配置片段：Gateway/Agent、DeepSeek Provider 和 FNS MCP，以及仅含用户自定义规则的 [workspace AGENTS 示例](workspace-AGENTS.example.md)。不要把 `.env`、登录态、Session 或 Token 写入仓库。三个 JSON5 片段不能直接部署：它们需要合并，并在私有配置中补齐凭据与环境相关字段。

截至 2026-11-16，服务器运行 OpenClaw `2026.7.1-2`，当前配置形态和服务状态见 [生产运行快照](../docs/PRODUCTION_RUNTIME.md)。历史 N1 隔离运行记录见 [N1 文档](../docs/N1_RUNTIME.md)。

本次核实的 MCP 配置使用 `mcp.servers.fns` 的 `transport`、`url`、`connectTimeout`、`requestTimeoutMs`、`headers` 和 `toolFilter`。生产私有配置含 `headers.Token`；示例不提供值，也不说明其生成机制。

生产 FNS 使用本机 `http://127.0.0.1:9000/api/mcp`，传输方式为 `streamable-http`。当前主 Agent allowlist 和 FNS toolFilter 已按生产快照列在示例中；历史 N1 的较窄 smoke allowlist 不代表当前生产范围。
