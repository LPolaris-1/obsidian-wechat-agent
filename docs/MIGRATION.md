# 迁移约定

旧 `weixin-bridge` 只作为行为参考、回滚基线和后续 G1 分析对象，不作为新仓库代码基础。

## 不迁移

微信协议/登录态、iLink polling、媒体解密、Runtime、Session、Memory、FNS REST client、PM2 bridge runtime、`.env`、`data/`、日志和 token。

## 分阶段

1. G0：创建并验证项目骨架。
2. G1：只读提取业务行为，形成 `OLD_BEHAVIOR.md`。
3. G2-G5：按测试驱动实现 Skill、fixture、FNS contract 和 Policy。
4. G6-G8：示例配置、本地集成和 Release Candidate。
5. S 阶段：仅从明确 Release 部署，先旁路、后手动切换。

任何正式切换前，旧 bridge 必须保持可回滚且不被覆盖。
