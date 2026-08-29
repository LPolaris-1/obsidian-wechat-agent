# OpenClaw 配置示例

这里仅保存不含秘密的 JSON5 示例：Gateway/Agent、DeepSeek Provider 和 FNS MCP。真实配置应在部署环境生成或注入，不要把 `.env`、登录态、Session 或 Token 写入仓库。

N1-RUNTIME 已在隔离 profile `n1` 中验证 stock OpenClaw `2026.7.1-2`，Node `v24.15.0`，并通过官方 CLI 配置 DeepSeek provider。仓库示例只描述结构，不是可直接复制的生产配置。

官方 MCP 配置字段是 `mcp.servers.<name>.{transport,url,headers,toolFilter}`；`urlEnv`、`tokenEnv`、`allowedTools` 不是 OpenClaw 2026.7.1-2 的配置字段。Token 只能在本机生成的 gitignored 配置或进程环境中注入，不能写入仓库。

当前 FNS 服务的 `/api/mcp` 路由需要带 MCP scope 的凭据；现有 bridge token 仅用于 REST/WS，探测会得到 `Permission denied: /api/mcp`。在获得正确 scope 前，不得把 N1 标记为 FNS smoke 通过，也不得以旧 REST client 代替 MCP。
