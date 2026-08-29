# 测试约定

测试分层：

1. Unit：纯逻辑、路径、模板和安全规则。
2. Skill fixture：固定消息与图片的结构化输出。
3. Policy security：越权删除、越界路径和未经读取覆盖必须失败。
4. FNS contract：使用 mock MCP 验证请求/返回契约。
5. Real integration：手动连接真实 DeepSeek/FNS，不进入普通 CI。

G0 只提供测试入口和 fixture 目录占位。普通 CI 不读取生产凭据，也不访问真实服务。
