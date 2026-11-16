# WeChat Obsidian Agent

微信入口、OpenClaw Agent Runtime、DeepSeek Vision 与 FNS MCP 的重构项目。

截至 2026-11-16，服务器已运行 OpenClaw 与 FNS；已核实的版本、服务状态和无凭据配置快照见 [`docs/PRODUCTION_RUNTIME.md`](docs/PRODUCTION_RUNTIME.md)。本仓库维护业务规则、安全策略、Skill、插件、配置示例和测试；不复制 OpenClaw 或旧 `weixin-bridge` Runtime。

## 开发边界

- GitHub 仓库是开发源，正在准备公开发布。服务器截至 2026-11-16 部署的是 `144080a9b1582d74222de9a51ff32f04bff0e41a`；GitHub `main` 已更新，当前部署状态见 [生产快照](docs/PRODUCTION_RUNTIME.md)。
- 普通 CI 不连接外部服务；历史 N1 smoke 的手动联调范围见 [N1 记录](docs/N1_RUNTIME.md)。
- 仓库内配置均为 example；生产私有配置中的凭据不提交。
- G1+ 的业务实现按阶段推进，见 [`docs/PROJECT.md`](docs/PROJECT.md)。

## 本地检查

```bash
npm ci
npm run ci
```

根目录 `npm ci` 只安装根依赖，不会把 OpenClaw runtime 安装到根目录。`npm run ci` 会先用插件自己的 `package-lock.json` 执行 `npm --prefix extensions/wrong-question-tool ci --ignore-scripts`，再运行类型检查、语法检查、Skill/插件构建和测试，因此干净检出可重复执行。只做离线 domain 测试可在根目录 `npm ci` 后单独运行 `npm test`。离线检查覆盖类型、语法和测试；真实服务联调仍需按 [安装手册](docs/INSTALL_WRONG_QUESTION.md) 在隔离 Vault 中单独验收。

## 安装现状

仓库正在准备公开发布，代码采用 [MIT 许可证](LICENSE)。克隆仓库并运行 `npm ci` 只准备源码和本地离线检查，不会自动安装到 OpenClaw。

Wrong Question 的安装步骤、当前版本依赖、构建顺序、Skill/插件分别安装、腾讯微信插件扫码登录和隔离验证清单见 [`docs/INSTALL_WRONG_QUESTION.md`](docs/INSTALL_WRONG_QUESTION.md)。[`extensions/wrong-question-tool/`](extensions/wrong-question-tool/README.md) 注册只读的 `wrong_question_plan`，不写文件；[`skills/wrong-question/`](skills/wrong-question/SKILL.md) 负责先读 Vault LaTeX 规则、按 exact-path 做 FNS 碰撞检测、创建并读取验证。两者需要分别安装。

这条接线仍需要在专用隔离 Vault 中用虚构数据完成 discovery、`wrong_question_plan`、FNS 创建与精确读取、微信回复的端到端验证；仓库离线测试和本页说明不能替代目标机器证据。碰撞检测是先读后写，不是原子事务，不能承诺自动防覆盖。Skill 使用硬编码的 `06-Resources/学习/考研/考研数学/错题本/原档案/{高数,线代}` 相对目录，目标用户必须提供同样结构；不能宣称对任意 Vault 通用。[JSON5 示例](openclaw/README.md) 缺少私有字段，不能直接部署。

## 目录

- `docs/`：项目、架构、迁移、部署、安全、测试和验收约定
- `openclaw/`：OpenClaw 的非敏感示例配置及 workspace 自定义规则
- `skills/`：`wrong-question` 已有业务规则与 TypeScript domain；`schedule` 仍为占位
- `extensions/obsidian-policy/`：Obsidian Policy Plugin 骨架；`extensions/wrong-question-tool/`：只读 `wrong_question_plan` 插件
- `tests/`：测试分层和 fixture 目录
- `scripts/`：smoke 入口；`package-release.sh` 与 `deploy.sh` 为不执行实际打包或部署的占位脚本

## 状态边界

OpenClaw、FNS 和微信插件已在生产配置中启用；这些服务的运行状态不等于本仓库所有业务流程均完成端到端验收。Wrong Question 离线 domain 已在 G2 完成；具体生产配置和本次核验边界以 [当前快照](docs/PRODUCTION_RUNTIME.md) 为准。
