# 测试约定

测试分层：

1. Unit：纯逻辑、路径、模板和安全规则。
2. Skill fixture：固定消息与图片的结构化输出。
3. Policy security：越权删除、越界路径和未经读取覆盖必须失败。
4. FNS contract：使用 mock MCP 验证请求/返回契约。
5. Real integration：手动通过 stock OpenClaw 连接真实 DeepSeek/FNS，不进入普通 CI；所有写入限定在 `Migration-Test/`。

G2 新增 Wrong Question domain fixture：schema validation、chapter identity/ambiguity、stable questionId、Windows filename safety、subject routing、path safety、Markdown renderer/template contract 和 write-plan determinism。fixture 使用虚构文本与 Vault-relative 图片引用；普通 CI 不读取生产凭据，也不访问真实服务。

## N1 runtime smoke

`npm run lint` 只做脚本语法检查，不启动服务。手动联调前先运行：

```bash
node scripts/smoke-openclaw.mjs
node scripts/smoke-model.mjs
node scripts/smoke-fns.mjs
```

这些探针在 OpenClaw 未安装、环境变量缺失或运行时未配置时 fail-closed（退出码 2），不会自行安装依赖、调用 LLM、实现 MCP REST 客户端或写入 Vault。通过探针后，按 `docs/N1_RUNTIME.md` 使用已验证的 OpenClaw CLI 完成 text/image、MCP 工具发现和 `Migration-Test/` CRUD read-back。
