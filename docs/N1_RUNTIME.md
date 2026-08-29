# N1 Runtime Integration Record

## Scope

N1 only verifies the hand-off between the Wrong Question Skill, stock OpenClaw, DeepSeek Vision and the native FNS MCP registration. It does not add an agent loop, model client, MCP REST client, WeChat transport or filesystem writer.

## Environment preflight

The preflight on 2026-08-29 found:

- `openclaw` executable: **not found**
- `DEEPSEEK_API_KEY`: present (value was not read or printed)
- `FNS_BASE_URL`, `FNS_TOKEN`, `FNS_VAULT`: missing
- production server / Vault / WeChat: not contacted

Because the stock runtime and FNS registration are unavailable, N1 real smoke is **BLOCKED AT runtime preflight**. No version, config schema, model registration or MCP tool list is invented in this repository.

## Required order when the runtime is available

1. Run `node scripts/smoke-openclaw.mjs` and record the installed OpenClaw version.
2. Use that version's official help/schema to adapt the example files under `openclaw/`; do not copy secrets into them.
3. Register the existing `skills/wrong-question` directory as a Skill. The model must return structured fields; it may not choose `questionId`, a target root, or a fabricated user error.
4. Register the native FNS MCP endpoint using the deployment secret store. Discover the actual note/file tools before issuing a call.
5. Run DeepSeek text and image smoke through OpenClaw. Image input must be synthetic or otherwise non-sensitive and must not be committed.
6. Run FNS create → read → update → read-back under `Migration-Test/` only. Do not test delete or move.
7. Run one end-to-end request with explicit archive intent and verify the final note by read-back.

## Failure rules

- Missing executable, model key, FNS endpoint/token or unverified tool names means BLOCKED, not PASS.
- A failed validation or failed read-back must not trigger a write to an alternate path.
- Real integration remains manual and is excluded from CI. CI only runs the offline TypeScript tests and syntax/type checks.
