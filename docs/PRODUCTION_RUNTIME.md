# 生产运行快照（2026-11-16）

## 审计范围与边界

本页记录已核实的服务器 OpenClaw/FNS 状态及非敏感配置。它是当日快照，不代表后续版本或完整业务端到端验收；本页不包含密钥、设备标识、会话或个人数据。仓库中的 [JSON5 示例](../openclaw/README.md) 是配置片段，不能直接部署。

## 代码与服务

- GitHub 私有仓库 `main` 与服务器 `/opt/obsidian-wechat-agent` 均位于 `144080a9b1582d74222de9a51ff32f04bff0e41a`；服务器部署仓库干净。
- OpenClaw 版本为 `2026.7.1-2`；`openclaw-gateway.service` 为 active，FNS `fast-note.service` 为 active。
- OpenClaw 生产配置位于 `/root/.openclaw-prod/openclaw.json`，workspace 位于 `/root/.openclaw-prod/workspace`。
- 生产 Wrong Question Skill 与部署仓库 Skill 的 SHA-256 相同：`4552abd880a45497180aa8f31411cf3997db1f7ce91ab0eec2aaaf28f987eac2`。

## 模型、Agent 与插件

- 默认模型：`deepseek/deepseek-flash`。DeepSeek provider 使用 `api=openai-completions`、`auth=api-key`、`timeoutSeconds=300`，模型 `deepseek-flash` 的输入为 `text`、`image`；`models.mode=merge`。
- `agents.defaults.timeoutSeconds=900`，`tools.profile=coding`。
- `main` Agent 的 `tools.allow`：`image`、`fns__file_get_info`、`fns__file_list`、`fns__file_read`、`fns__file_write`、`fns__note_append`、`fns__note_create_or_update`、`fns__note_get`、`fns__note_get_backlinks`、`fns__note_get_outlinks`、`fns__note_list`、`fns__note_patch_frontmatter`、`fns__note_prepend`、`fns__note_replace`、`fns__vault_list`、`web_search`、`web_fetch`。
- Web search 已启用，provider 为 `duckduckgo`；Web fetch 已启用。
- `openclaw-weixin` 与 `deepseek` 插件已启用；`session.dmScope=per-channel-peer`。
- Gateway 使用 `mode=local` 与 `auth.mode=token`。

## FNS MCP

- 本机地址：`http://127.0.0.1:9000/api/mcp`；`transport=streamable-http`；`connectTimeout=30`；`requestTimeoutMs=120000`。
- `mcp.servers.fns.toolFilter.include`：`file_get_info`、`file_list`、`file_read`、`file_write`、`note_append`、`note_create_or_update`、`note_get`、`note_get_backlinks`、`note_get_outlinks`、`note_list`、`note_patch_frontmatter`、`note_prepend`、`note_replace`、`vault_list`。
- 生产私有配置含 `headers.Token`，其值未入仓库；示例仅标出该字段的位置，不说明其生成机制。

## Workspace 自定义规则

生产 workspace 增加了微信数学纯文本回复和 Obsidian 错题 LaTeX 写入/读回规则。仓库只保存提炼后的 [用户规则示例](../openclaw/workspace-AGENTS.example.md)。
