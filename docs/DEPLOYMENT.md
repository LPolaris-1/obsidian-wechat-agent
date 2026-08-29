# 部署约定

G0 不执行部署，也不连接生产服务器。

生产部署的前置条件是 Release Candidate 通过 CI、安全测试、Skill fixture 和人工 smoke。服务器只拉明确的 Release/Tag，不直接跟随 `main`。

## 预期流程

```text
本地测试 -> GitHub CI -> Release/Tag -> 资源检查 -> 短时旁路 -> 手动验收 -> 才考虑切换
```

切换和回滚步骤、资源检查及旧 bridge 保留策略见后续阶段文档。`scripts/deploy.sh` 在 G0 仅作为拒绝误执行的占位入口。
