# Wrong Question Skill 安装手册

本手册面向准备在**隔离环境**中验证错题归档接线的用户。它记录截至 2026-11-16 已核实的命令和边界，不包含真实凭据，也不代表第三方机器或生产环境已经完成端到端验收。

## 先读：当前阶段实况

- 仓库正在准备公开发布，代码采用 [MIT 许可证](../LICENSE)。
- 目标运行时是 OpenClaw `2026.7.1-2`。本手册中的 `skills install`、`plugins install` 和插件 API 结论来自该版本的 CLI/包元数据；不要假设更新或更旧版本的安装命令完全一致，遇到版本差异时先查看目标版本的官方帮助。
- OpenClaw `2026.7.1-2` 的构建依赖在本次 `npm audit` 中报告 6 项 high、4 项 moderate 漏洞；这不表示已确认每一项均可利用。运行 OpenClaw 的使用者应参考上游修复和安全公告评估风险；固定版本不等于安全。
- 本仓库包含 `skills/wrong-question/`（Skill 指令、references、templates）和 `extensions/wrong-question-tool/`（注册 `wrong_question_plan` 的 OpenClaw 插件）。两者需要分别安装；安装 Skill 不会自动安装插件，安装插件也不会自动安装 Skill。
- 本仓库的错题路径是硬编码的业务规则：`06-Resources/学习/考研/考研数学/错题本/原档案/高数` 和同级的 `线代`。目标 Vault 必须提供相同的相对目录；这不是对任意 Vault 都通用的写入器。
- LaTeX 规则文件固定要求为 Vault 内的 `06-Resources/rules/LaTeX写入规则.md`。读取失败时 Skill 必须停止，不会使用内置规则代替。
- 碰撞检测是“先精确读取、再创建”，不是原子事务。并发请求仍可能同时通过检查并发生覆盖；本仓库不承诺自动事务防覆盖。已有目标默认不得覆盖，必须由用户在看到冲突后选择。
- **接线完成不等于在线验收通过。** discovery、`wrong_question_plan`、FNS 创建与精确读取、微信回复都必须由目标用户在隔离 Vault 中用虚构数据逐一验证；仓库中的离线测试不能替代这些证据。

## 环境要求

### OpenClaw 与 Node

- OpenClaw：`2026.7.1-2`。
- Node：必须满足 OpenClaw `2026.7.1-2` 的引擎约束：

  ```text
  >=22.22.3 <23 || >=24.15.0 <25 || >=25.9.0
  ```

  历史隔离验证使用 Node `v24.15.0`。仓库根 `package.json` 的 `engines.node` 为 `>=20`，只表示本地离线检查的最低门槛，不能替代 OpenClaw 自身的 Node 要求。
- 还需要 `npm`、`git`，以及目标机器上的 OpenClaw CLI。

### 隔离 Vault 与测试账号

准备一个专门用于验证的 Vault，而不是生产 Vault：

- 包含上述错题目录相对路径。
- 包含 `06-Resources/rules/LaTeX写入规则.md`。
- 只放入虚构题目、虚构错误和虚构图片引用。
- 微信验证使用测试账号或明确允许测试的会话；不要发送真实个人题目。

## 1. 准备源码和构建

仓库公开后，使用仓库地址克隆；不要把 token、SSH key 或登录态写入仓库、命令行历史或文档。

```bash
git clone <repository-url>
cd obsidian-wechat-agent
npm ci
```

### 依赖与 CI 行为

根目录 `npm ci` 只安装根 `package.json` 的依赖，**不会**安装 `extensions/wrong-question-tool/` 的插件依赖，也不会把 OpenClaw runtime 安装到根目录。插件有独立的 `package.json` 和已跟踪的 `package-lock.json`，完整检查会按该 lockfile 安装插件依赖：

```bash
npm run ci
```

说明：

- 根目录 `npm run ci` 会先执行 `npm --prefix extensions/wrong-question-tool ci --ignore-scripts`，再运行类型检查、语法检查、`build:wrong-question` 和测试。插件依赖由 `extensions/wrong-question-tool/package-lock.json` 锁定，干净检出不需要手工预装；跳过依赖安装脚本是因为插件构建只需要 lockfile 中的 TypeScript 和 OpenClaw SDK 声明。
- 只构建插件时，先安装插件依赖，再执行构建：

  ```bash
  npm --prefix extensions/wrong-question-tool ci --ignore-scripts
  npm run build:wrong-question
  ```

- 只做离线 domain 测试时，可以在根目录 `npm ci` 后运行 `npm test`；这不会验证插件构建或真实服务接线。

构建顺序和命令：

```bash
npm run build:wrong-question
```

它会依次执行：

1. 用 `skills/wrong-question/tsconfig.build.json` 构建 Skill CLI 到 `skills/wrong-question/dist/`。
2. 用插件的 TypeScript 配置构建插件到 `extensions/wrong-question-tool/dist/`。

预期产物包括 `skills/wrong-question/dist/cli.js` 和 `extensions/wrong-question-tool/dist/extensions/wrong-question-tool/src/index.js`。

## 2. 安装 Skill

OpenClaw `2026.7.1-2` 的 `skills install` 支持本地目录。安装必须覆盖 `skills/wrong-question/` 整个目录，而不是只复制 `SKILL.md`，因为 references 和 templates 是 Skill 的一部分：

```bash
openclaw skills install ./skills/wrong-question --agent <agent-id>
```

然后用目标版本支持的 discovery 命令核对：

```bash
openclaw skills info wrong-question --agent <agent-id> --json
```

预期能看到 `wrong-question` 来自 workspace、`eligible: true`、`modelVisible: true`。如果目标 OpenClaw 版本没有这个命令或参数不同，先运行 `openclaw skills --help`，按目标版本调整；不要直接套用更新版本的安装方式。

已有同名 Skill 时，不要默认加 `--force`。先比较现有内容并取得用户授权；覆盖会替换目标 workspace 中的 Skill。

## 3. 构建并安装插件

插件只负责注册一个只读计划工具，不写文件：

- 工具名：`wrong_question_plan`
- 输入：`{ "archive": true, "question": { ... } }`
- 输出：`{ "questionId": "...", "targetPath": "...", "markdown": "..." }`
- `archive` 必须是字面量布尔值 `true`；校验失败只返回 `INVALID_INPUT`，不回显题目内容。

先完成上面的插件构建，再按插件 README 安装：

```bash
openclaw plugins install --link ./extensions/wrong-question-tool
openclaw plugins list
```

`--link` 让运行时指向本仓库的构建产物；不要删除或移动 `extensions/wrong-question-tool/`，否则链接失效。也可以使用目标版本支持的其他安装方式，但必须先完成构建，并以 `plugins list`/`plugins inspect` 的实际结果为准。

如果 Agent 使用显式 `tools.allow`，确认其中包含 `wrong_question_plan`，并包含 Skill 需要的 FNS 工具：

- `fns__note_get`
- `fns__note_create_or_update`

不需要为此流程放开通用 shell、filesystem、删除、移动或其他写入工具。

## 4. 配置 FNS、模型和微信

### FNS

FNS 必须通过 OpenClaw 的官方 MCP 配置方式接入，并使用你自己的 endpoint 和 secret store。不要把 token、header 或私有 endpoint 写入仓库。当前仓库示例只展示非敏感字段和工具过滤位置，见 [OpenClaw 配置示例](../openclaw/README.md) 与 [MCP 示例](../openclaw/mcp.example.json5)。

本 Skill 依赖 FNS 的精确路径语义：

- `fns__note_get` 参数：`vault`、`path`（精确 Vault-relative 路径）。
- `fns__note_create_or_update` 参数：`vault`、`path`、`content`。

写入前必须先对 `targetPath` 做 `note_get` 碰撞检测；写入后必须再用同一 `vault` 和同一 `path` 做 `note_get` 验证。工具名和参数以目标运行时的实际 discovery 结果为准。

### 模型和凭据

DeepSeek 或其他模型 provider、API key、FNS token 都由用户通过 OpenClaw 官方配置或密钥存储自行填写。仓库不提供、不输出、不保存示例真实凭据；不要把 `.env`、token、登录态或会话数据提交到仓库。

### 腾讯微信插件

微信通道使用腾讯维护的外部插件 `@tencent-weixin/openclaw-weixin`。按官方文档安装、启用并用手机扫码登录：

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

或手动安装：

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
openclaw channels login --channel openclaw-weixin
```

扫码登录必须运行在 Gateway 所在机器上；按所安装腾讯插件版本的官方说明登录并验证访问控制。插件 `2.4.8` 未注册标准 pairing adapter，无法通过标准 pairing 流程授权；扫码登录和会话权限以所安装插件版本的说明为准。版本兼容性以实际官方说明为准，可用 `npm view @tencent-weixin/openclaw-weixin version` 查看当前发布版本。详见[微信通道访问控制](https://docs.openclaw.ai/channels/wechat#access-control)。

- 官方文档：<https://docs.openclaw.ai/channels/wechat>
- npm 包与版本：<https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin>

不要在文档、配置或日志中记录扫码得到的账号 token；损坏或版本不兼容时按官方文档更新或回退，不要在本仓库中绕过插件。

## 5. 隔离环境逐项验证

以下步骤必须在专用隔离 Vault 中使用虚构数据执行。任一步失败都停止，不要跳到下一步，也不要用生产 Vault 作为补救。

### 5.1 Discovery

```bash
openclaw --version
openclaw skills info wrong-question --agent <agent-id> --json
openclaw plugins list
```

核对：

- OpenClaw 版本为 `2026.7.1-2`。
- Skill 被发现，`eligible` 和 `modelVisible` 为 true。
- `wrong-question-tool` 已加载，`wrong_question_plan` 可见。
- Agent 实际可见 `fns__note_get` 和 `fns__note_create_or_update`。

记录工具发现结果，但不要把个人题目内容写进记录。

### 5.2 `wrong_question_plan`

通过隔离 Agent 发送一条明确要求归档的虚构错题。建议使用仓库中纯虚构的 fixture 文本结构（例如 `tests/fixtures/wrong-question/high-limit.json` 的字段形状），不要使用真实错题。

核对实际工具调用：

- 只调用一次 `wrong_question_plan`。
- 输入 `archive` 是布尔 `true`，字段完整。
- 输出包含非空 `questionId`、`targetPath`、`markdown`。
- 模型没有自行生成或修改路径/identity。

若返回 `INVALID_INPUT`，确认流程应停止，而不是让模型猜字段或改用 shell/本地 CLI。

### 5.3 FNS create 与 exact-path get

先在隔离 Vault 中手工验证 FNS 契约。使用一个明确的手工探测路径，例如 `Migration-Test/INSTALL-PROBE.md`，仅用于本次测试；不要把该路径作为 Skill 的备用路径：

1. 调用 `fns__note_create_or_update`，写入虚构标题和正文。
2. 用完全相同的 `vault` 和 `path` 调用 `fns__note_get`。
3. 核对正文非空、标题/关键段落匹配计划内容。

然后运行完整 Skill 流程，核对实际调用顺序：

```text
fns__note_get(06-Resources/rules/LaTeX写入规则.md)
wrong_question_plan
fns__note_get(<plan.targetPath>)
fns__note_create_or_update(<plan.targetPath>)
fns__note_get(<plan.targetPath>)
```

再重复一次同一虚构题目做碰撞测试：第二次必须停在“目标已存在”，不得自动覆盖。该测试只能证明先读后写路径有效，**不能证明并发情况下不会覆盖**。

### 5.4 微信回复

从测试微信账号发送一条明确归档的虚构错题，核对：

- 微信通道收到请求并触发 `wrong-question`。
- 工具调用顺序和权限符合 5.1-5.3。
- 写入后的精确路径读取成功。
- 用户可见回复是 Unicode 符号和纯文本，不包含 `$...$`、`$$...$$`、`\(...\)`、`\[...\]` 或 TeX 命令。
- 回复没有泄露完整题目、Markdown 或内部工具参数。

如果没有真实微信通道，只能记录为“未验证”，不能把离线测试或模型自述当作微信验收通过。

### 5.5 验收记录

验收记录至少包含：OpenClaw/Node/插件版本、Skill discovery 结果、工具调用序列（脱敏）、`questionId`、目标路径、精确读取结果和微信回复结果。记录中不要保存真实题目、我的错误、图片、token 或完整 Markdown。仓库文档不能替代目标机器的实际运行证据。

## 6. 已知限制

- Skill 的目标根目录是硬编码的；目标 Vault 必须提供同样的 `06-Resources/学习/考研/考研数学/错题本/原档案/{高数,线代}` 相对目录。不能宣称对所有 Vault 通用。
- LaTeX 规则文件路径固定；缺失、无权限或读取失败必须停止。
- `wrong_question_plan` 的路径/identity 是唯一来源；模型不得自行生成路径。
- FNS 的 `note_create_or_update` 是 upsert 语义，没有事务锁；碰撞检测是 read-before-write，存在并发竞争窗口。不能承诺自动事务防覆盖。
- 本仓库没有发布可安装的插件包，也没有第三方机器端到端验收；安装命令只在已核实的 OpenClaw `2026.7.1-2` 上确认。
- 根目录 `npm ci` 不安装插件依赖；`npm run ci` 会按 `extensions/wrong-question-tool/package-lock.json` 单独执行插件 `npm ci --ignore-scripts`。插件安装会下载 OpenClaw runtime 包以提供 SDK 类型，但不会安装到根 `node_modules/`。
- 本流程不执行删除、移动、重命名、章节聚合、索引或统计；测试 Vault 的清理应按其自身策略另行处理。
