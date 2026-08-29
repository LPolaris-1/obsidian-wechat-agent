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
- A newly supplied, valid FNS token is scoped `p:rest,ws,mcp` for the `openclaw` client. Native OpenClaw `streamable-http` MCP initialization succeeded and discovered 26 server tools.
- The isolated agent allowlist exposed only `image`, `fns__note_create_or_update` and `fns__note_get`. All destructive/file/vault tools were unavailable to the model.

## N1-SKILL-VERIFY evidence

- Wrong Question Skill discovery: PASS via the official `skills info wrong-question --agent main --json` command; source is `openclaw-workspace`, with `eligible: true` and `modelVisible: true`.
- Skill path: `C:\\Users\\HUAWEI\\.openclaw\\workspace-n1\\skills\\wrong-question\\SKILL.md`.
- Skill-triggered E2E: PASS. The runtime report included `wrong-question` in `skills.entries` and exposed only `image`, `fns__note_create_or_update`, and `fns__note_get`; the request used the explicit archive trigger and completed `fns__note_create_or_update` followed by `fns__note_get`.
- Exact-path read-back: PASS for `Migration-Test/N1-Skill-Verify.md`; an independent `note_get` returned HTTP 200 and the expected title, error, and key-point sections.
- Text E2E created `Migration-Test/N1-Text-Smoke.md`, then read the exact path back successfully. Image E2E read the synthetic PNG, created `Migration-Test/N1-Image-Smoke.md`, then read the exact path back successfully.

Therefore N1 real integration is **PASS for the bounded smoke scope**. No REST client, custom MCP adapter, production write, or formal Vault write was introduced.

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
- A successful smoke must include tool-call evidence and exact-path read-back; a model-only claim is insufficient.
- A failed validation or failed read-back must not trigger a write to an alternate path.
- Real integration remains manual and is excluded from CI. CI only runs the offline TypeScript tests and syntax/type checks.
