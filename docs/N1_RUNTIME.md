# N1 Runtime Integration Record

## Scope

N1 only verifies the hand-off between the Wrong Question Skill, stock OpenClaw, DeepSeek Vision and the native FNS MCP registration. It does not add an agent loop, model client, MCP REST client, WeChat transport or filesystem writer.

## Environment verification

The runtime preparation on 2026-08-29 found:

- Node `v24.15.0` and npm `11.12.1` satisfy the official OpenClaw requirement.
- The official npm package `openclaw@2026.7.1-2` runs through `npm exec`; the PowerShell installer and global npm install were not usable on this machine.
- An isolated local profile `n1` was created with loopback Gateway, token auth, no daemon and workspace `C:\Users\HUAWEI\.openclaw\workspace-n1`.
- DeepSeek provider `deepseek/deepseek-v4-flash-vision-exp` was configured with an environment-backed key. Text smoke returned `N1_TEXT_OK`.
- A synthetic PNG smoke required exactly one `image` tool call and returned `x^2 + 1 = 0`; no real image or Vault content was used.
- The official FNS service is reachable on the existing server at `http://127.0.0.1:9000/api/mcp` (normally exposed to the workstation through an SSH tunnel). The discovered vault name is `defaultVault`.
- The existing `FNS_TOKEN` is present but has REST/WS scope only. FNS MCP initialization returns `Permission denied: /api/mcp`; no MCP tool list was accepted as discovered.

Therefore N1 real integration is **BLOCKED at native FNS MCP authorization**, not at OpenClaw or DeepSeek model execution. No REST client, custom MCP adapter, production write, or Vault write was introduced.

## Required order when the runtime is available

1. Run `node scripts/smoke-openclaw.mjs` and record the installed OpenClaw version.
2. Use that version's official help/schema to adapt the example files under `openclaw/`; do not copy secrets into them. The verified 2026.7.1-2 shape uses `mcp.servers.<name>.{transport,url,headers,toolFilter}`.
3. Register the existing `skills/wrong-question` directory as a Skill. The model must return structured fields; it may not choose `questionId`, a target root, or a fabricated user error.
4. Register the native FNS MCP endpoint using the deployment secret store. Discover the actual note/file tools before issuing a call.
5. Run DeepSeek text and image smoke through OpenClaw. Image input must be synthetic or otherwise non-sensitive and must not be committed.
6. Run FNS create → read → update → read-back under `Migration-Test/` only. Do not test delete or move.
7. Run one end-to-end request with explicit archive intent and verify the final note by read-back.

## Failure rules

- Missing executable, model key, FNS endpoint/token/scope or unverified tool names means BLOCKED, not PASS.
- A failed validation or failed read-back must not trigger a write to an alternate path.
- Real integration remains manual and is excluded from CI. CI only runs the offline TypeScript tests and syntax/type checks.
