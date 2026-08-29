# OpenClaw 配置示例

这里仅保存不含秘密的 JSON5 示例：Gateway/Agent、DeepSeek Provider 和 FNS MCP。真实配置应在部署环境生成或注入，不要把 `.env`、登录态、Session 或 Token 写入仓库。

N1-RUNTIME 已在隔离 profile `n1` 中验证 stock OpenClaw `2026.7.1-2`，Node `v24.15.0`，并通过官方 CLI 配置 DeepSeek provider。仓库示例只描述结构，不是可直接复制的生产配置。

官方 MCP 配置字段是 `mcp.servers.<name>.{transport,url,headers,toolFilter}`；`urlEnv`、`tokenEnv`、`allowedTools` 不是 OpenClaw 2026.7.1-2 的配置字段。Token 只能在本机生成的 gitignored 配置或进程环境中注入，不能写入仓库。

当前 FNS 服务的 `/api/mcp` 路由需要 MCP scope。隔离 N1 运行已使用 `openclaw` client 的 MCP-scoped credential，通过官方 `streamable-http` 成功发现 26 个工具；运行时 allowlist 只暴露错题 smoke 所需的创建与读取工具。凭据已在 smoke 结束后从本地 MCP 配置移除。
