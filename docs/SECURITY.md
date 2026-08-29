# 安全约定

## 不提交

DeepSeek API Key、FNS Token、微信登录数据、OpenClaw Gateway Token、SSH Key、`.env`、生产配置、Session、运行日志和个人/教材原始资料。

## Policy 方向

- 修改已有笔记前，本轮必须成功读取目标。
- 创建必须有明确意图且路径符合 Vault Policy。
- 删除只允许进入 FNS Trash；永久删除默认拒绝。
- 拒绝 `../`、绝对路径、`.obsidian/`、`.env` 和 Vault 外路径。
- 禁止 `vault_delete`、`file_delete` 和清空回收站。

G0 仅建立约定和测试目录，不宣称上述运行时规则已经实现。
