# Legacy `weixin-bridge` Behavior Baseline

> G1 静态审计结果。本文以旧项目当前 working tree 为主；Git HEAD 只用于解释变化来源。本文不代表新项目已经实现这些行为。

## 1. Audit Scope

审计目标是提取旧 `weixin-bridge` 当前可达的消息、模型、工具、FNS/Obsidian、错题、日程、记忆和安全行为，为 G2 提供事实基线。审计为只读静态分析，没有启动 bridge、PM2、`sync-fns.js`、OpenClaw，也没有连接微信、DeepSeek、FNS 或生产服务器。

## 2. Audit Source

- Old project path: `C:\Users\HUAWEI\Desktop\original\coding\weixin-bridge`
- 主要入口和源码：`src/index.ts`、`src/orchestrator.ts`、`src/config.ts`、`src/session.ts`、`src/lock.ts`
- Transport：`src/transport/auth.ts`、`client.ts`、`polling.ts`、`media.ts`、`sender.ts`
- Agent：`src/agent/claude.ts`、`stream.ts`、`conversation.ts`、`qwen-vl.ts`
- Tools：`src/tools/registry.ts`、`fns-api.ts`、`notes.ts`、`note-management.ts`、`note-routing.ts`、`files.ts`、`shell.ts`、`search.ts`、`schedule.ts`、`schedule-write.ts`、`docx.ts`、`pdf.ts`
- Business/memory：`src/workflows/wrong-question.ts`、`src/memory/shared.ts`、`sync-fns.js`
- 配置/测试：`package.json`、`ecosystem.config.cjs`、`startup.bat`、`src/**/*.test.ts`

只记录配置变量名，不记录任何 secret value：`ANTHROPIC_BASE_URL`、`ANTHROPIC_API_KEY`、`ANTHROPIC_MODEL`、`DASHSCOPE_API_KEY`、`ILINK_BASE_URL`、`DATA_DIR`、`FNS_BASE_URL`、`FNS_TOKEN`、`FNS_VAULT`、`MAX_INCOMING_IMAGE_BYTES`。

## 3. Git / Working Tree State

```text
HEAD: aadb6d394896be2573fa1b35961418a848eead11
HEAD subject: feat: add server-side wrong-question workflow hook
branch: main (ahead 1 of origin/main)
working tree: DIRTY
```

当前 snapshot 有 14 个已跟踪文件修改和多个未跟踪文件。审计不执行 reset、checkout、clean 或 stash。`git diff HEAD` 显示当前修改集中在 FNS、写安全门禁、媒体下载、工具管理、测试和 orchestrator；例如当前 orchestrator 已移除 Qwen-VL 调用，而当前 notes 已移除错题聚合 hook。

## 4. Classification Legend

- **ACTIVE**：当前 working tree 存在真实调用链，可由运行入口到达。
- **PARTIAL**：调用链存在，但有已知断点、路径/语义问题或未覆盖条件。
- **DEAD**：代码存在，但当前没有 caller 或不可达。
- **INTENDED**：历史/注释/测试表明设计意图，但当前运行时不具备。
- **UNCERTAIN**：仅凭旧项目静态代码无法确认。

## 5. Runtime Architecture

```text
src/index.ts
  -> CONFIG / instance lock / bridge-state.json
  -> qrLogin() when botToken is absent
  -> orchestrator.run(state)
  -> getUpdates() long poll
  -> handleMessage()
  -> generateReply() stream + tool loop
  -> sendReply()/sendTyping()
```

入口证据：`src/index.ts:31-71`。当前运行时是单进程 Node/tsx bridge，状态和日志写入本地 `data/`。旧 HEAD 与 working tree 不同，本文以下行为均优先采用 working tree。

## 6. Startup and Lifecycle

- `package.json:7-9` 的启动命令是 `tsx src/index.ts`；`ecosystem.config.cjs`/`startup.bat` 是常驻入口配置。
- `src/index.ts:16-24`：`unhandledRejection` 只写 crash log 并继续；`uncaughtException` 写 crash log、释放锁并退出 1。
- `src/index.ts:25-29`：SIGTERM/SIGINT flush 去重、释放锁并记录日志，但没有显式 `process.exit()`；orchestrator heartbeat 没有清理，关闭行为为 **PARTIAL**。
- `src/lock.ts:8-34`：通过本地锁防止多个 bridge 实例并发轮询。
- `src/session.ts:6-17`：状态文件为 `DATA_DIR/bridge-state.json`，保存 bot token、bot id、base URL、用户和 cursor。会话持久化为 **ACTIVE**；重启恢复时保存的 `state.baseUrl` 未重新应用到 `CONFIG.ilink.baseUrl`，为 **PARTIAL**。

## 7. WeChat Transport

### 7.1 Login

`src/transport/auth.ts:10-38,68-118`：

- `POST /ilink/bot/get_bot_qrcode?bot_type=3` 获取二维码；`GET /ilink/bot/get_qrcode_status` 每秒轮询。
- 扫码等待 deadline 为 480 秒；`need_verifycode` 读取 stdin 数字确认。
- `expired` 和 `verify_code_blocked` 递归重新扫码，理论上可无限递归；`binded_redirect` 返回 already-connected 失败结果。
- confirmed 结果保存 bot token、bot id、base URL、用户 id 到 session。

### 7.2 Client and Polling

- `src/transport/client.ts:4-33`：iLink app id 为 `bot`，channel version 为 `2.4.3`，请求带 bearer token、随机 `X-WECHAT-UIN` 和 common headers。
- `src/transport/client.ts:36-73`：POST 请求默认超时 35 秒，最多 3 次重试，退避 1/2/4 秒并加入随机 jitter，最终抛错。
- `src/transport/polling.ts:4-24`：`POST /ilink/bot/getupdates`，传 `get_updates_buf` 和 `base_info`；服务端 `longpolling_timeout_ms` 会覆盖下一轮 timeout；timeout/abort 被视为空消息并保留原 cursor。
- `src/orchestrator.ts:106-195`：`ret`/`errcode` 非零时连续失败 3 次等待 30 秒，否则等待 2 秒；会话过期码为 `-14`，清空 token 并要求重启。

### 7.3 Message Routing

- `src/orchestrator.ts:315-325`：忽略 bot 自身消息（`message_type === 2`）和生成中消息（`message_state === 1`）。
- `src/orchestrator.ts:503-518`：文本、语音转写和文件名被拼成输入文本；回复目标始终为 `from_user_id`，没有独立群聊路由。
- `context_token` 在 `src/orchestrator.ts:332-339` 保存到用户 session，并在发送回复时传回。
- `src/orchestrator.ts:158-187`：先处理消息，成功处理全部消息后才推进并保存 cursor。

### 7.4 Dedup and Retry

- message id 持久化在 `DATA_DIR/dedup.json`，最多保留 500 个；同用户同文本另有内存 Set（上限 100），代码注释称 30 秒但没有 TTL，均见 `src/orchestrator.ts:96-104,140-174`。
- 已回复 message id 保存在 `DATA_DIR/replied.json`，没有上限：`src/orchestrator.ts:98-104,405-411`。
- 回复内容 hash 的内存去重上限 20：`src/orchestrator.ts:453-466`。
- 单条消息的模型调用对连接/timeout 类错误最多重试 2 次，退避 2/4 秒：`src/orchestrator.ts:413-447`。

## 8. Model Runtime

- `src/config.ts:8-18`：endpoint 来自 `ANTHROPIC_BASE_URL`，默认 `https://api.deepseek.com/anthropic`；模型来自 `ANTHROPIC_MODEL`，默认 `deepseek-v4-flash-vision-exp`。
- `src/agent/claude.ts:5-39`：使用 Anthropic SDK，timeout 600 秒、`max_tokens=8000`，system prompt 要求中文、工具调用和 FNS 规则。
- `src/agent/stream.ts:27-49`：图片以 Anthropic base64 image block 加文本输入；当前主图片模型是 DeepSeek Vision。
- `src/agent/stream.ts:57-158`：每轮创建流式请求，逐个执行 tool_use，把本轮所有 tool_result 合并成一个 user message，并在每轮保存历史。
- `src/agent/stream.ts:57` 的 `for (let turn = 0; ; turn++)` 没有上限，`turn` 未使用；代码级 tool-loop 限制为 **PARTIAL**，存在无限调用风险。

## 9. Image Pipeline

当前 working tree 的主链路为：

```text
WeChat item_list
 -> direct/ref image_item
 -> CDN full_url 或 encrypt_query_param
 -> size check
 -> 明文 magic bytes 或 AES-128-ECB 解密
 -> MIME signature
 -> Base64
 -> DeepSeek Vision
```

证据：`src/transport/media.ts:53-71,74-107,110-166,229-309`、`src/orchestrator.ts:224-312`、`src/agent/stream.ts:27-49`。

- direct image 优先于一层引用 image；URL 优先 `full_url`、再 CDN 参数、最后 legacy `download_url`/`url`。
- AES key 优先原图 `image_item.aeskey`，再 `media.aes_key`；支持 32 位 hex、base64 原始 16 bytes、base64 hex 字符串。
- 算法为 AES-128-ECB + PKCS#7；MIME 只信 JPEG/PNG/GIF/WebP 文件签名。
- 默认下载 timeout 60 秒、最大 10 MB；原图失败后尝试 `thumb_media`，不复用原图顶层 key。
- 下载失败只记录并返回无图，文本仍可能继续送模型，为 **PARTIAL**。
- FILE 图片是另一条 fallback：`src/orchestrator.ts:520-559` 只使用 `file_item.media.full_url`，下载到 `data/files/{timestamp}_{sanitized filename}`；没有 AES/CDN 参数解密、大小限制或清理，为 **PARTIAL**。

### Outbound Media

`src/transport/sender.ts:56-143,148-230`：`send_image` 最大 10 MB、`send_file` 最大 20 MB；先 `POST ilink/bot/getuploadurl`，AES-128-ECB 加密后 POST CDN，再 `POST ilink/bot/sendmessage`。当前代码把 getuploadurl body 先 `JSON.stringify` 后交给同样会 stringify 的 `apiPost`，存在双重 JSON 编码疑点，为 **PARTIAL**。文本回复通过 `sendmessage`，超过 4000 字拆分；传递 context token，但没有真正 quote/ref 字段。typing 通过 `getconfig` + `sendtyping`，每 5 秒 keepalive：`src/orchestrator.ts:369-381`。

## 10. Tool Loop

`src/agent/stream.ts:53-158` 的实际顺序：

1. 加载并裁剪用户历史。
2. 发送文本/图片给主模型。
3. 累积 text、thinking 和 tool_use block。
4. 逐个执行工具并生成 tool_result。
5. 将全部 tool_result 放入一个 user message，继续下一轮。
6. 无 tool_use 时保存 assistant 内容并结束。

system prompt 中“每个工具最多一次”只是模型指令，代码没有硬限制；异常结果以字符串返回模型，模型/工具循环没有最大轮次。

## 11. Tool Inventory

注册表 `src/tools/registry.ts:32-220` 共 15 个工具：

| Tool | Purpose | Read/Write | Current status | Guard / backend |
|---|---|---|---|---|
| `search_web` | Bing RSS 网页搜索 | Read/network | ACTIVE | Bing GET |
| `create_note` | 创建 Markdown 并回读校验 | Write | ACTIVE/PARTIAL | FNS POST+GET，路径和错题意图门禁 |
| `find_notes` | 分页查找笔记路径 | Read | ACTIVE | FNS GET `/api/notes` |
| `read_file` | 读取 Vault 或本地文本 | Read | ACTIVE/PARTIAL | Vault 走 FNS；非 Vault 任意存在路径 |
| `update_note` | 更新笔记并回读 | Write | ACTIVE | update intent + 同轮 read-before-write |
| `move_note` | 读源、写目标、回读、删源 | Write | ACTIVE | move intent，失败保源 |
| `delete_note` | 软删除或永久删除 | Write | ACTIVE/PARTIAL | delete intent；permanent 双门禁 |
| `read_docx` | pandoc 转 Markdown | Read/process | ACTIVE/PARTIAL | 任意本地路径，无统一 root guard |
| `read_pdf` | pdfplumber 提取文本 | Read/process | ACTIVE/PARTIAL | 临时 Python，任意本地路径 |
| `run_shell` | 执行只读 shell | Process | ACTIVE/PARTIAL | 白名单和重定向/敏感路径拦截 |
| `add_memory` | 写共享记忆 | Write | ACTIVE/PARTIAL | 写 DATA_DIR 和旧 Claude memory，无确认门 |
| `get_schedule` | 读取看板/日记 | Read | PARTIAL | 硬编码 Windows Vault |
| `add_schedule_event` | 写看板/日记 | Write | ACTIVE/PARTIAL | 硬编码 Windows Vault、解析缺陷 |
| `send_image` | 加密上传图片并发送 | Write/network | PARTIAL | iLink/CDN，双重 stringify 疑点 |
| `send_file` | 加密上传文件并发送 | Write/network | PARTIAL | 同上 |

## 12. FNS / Obsidian Operations

配置变量只记录名称；`src/tools/fns-api.ts:1-5` 的默认值不包含 secret。代码实际使用的 endpoint 路径和 method：

- `GET /api/note?path=...&vault=...`：读取单笔记，`fns-api.ts:95-117`。
- `POST /api/note`：创建/更新，`fns-api.ts:131-142`。
- `DELETE /api/note`：删除，`fns-api.ts:144-155`。
- `GET /api/notes?vault=...&page=...&pageSize=...`：分页查找，`fns-api.ts:189-210`。

成功依据是业务 `code > 0 && code <= 200`，不是单看 HTTP 200：`fns-api.ts:48-64`。404/430 或 not-found 文本被识别为不存在。路径标准化拒绝空路径、NUL、`..`、其他 Windows/POSIX 绝对路径；接受 Vault 相对路径、canonical Windows Vault 前缀和 `/opt/vault-mirror` 前缀：`fns-api.ts:11-36`。

- 普通创建默认 `01-Inbox`；`notes.ts:3-20` 将“高数/线代”映射到 `06-Resources/学习/考研/考研数学/错题本/原档案/{高数,线代}`。
- 创建后 GET 回读，内容不一致则失败：`notes.ts:12-34`。
- `read_file` 对非 Vault 路径直接读取任意存在的本地文本，最多 8000 字符：`files.ts:11-27`。

## 13. Write Safety Gates

当前 working tree 的代码级门禁位于 `src/tools/registry.ts:231-320`：

- update 必须有当前消息中的“修改/更新/编辑/补充/替换/重写”等意图词。
- update 必须在同一请求先成功 `read_file` 同一路径；比较前做路径标准化。
- move 必须有移动/改名/重命名等意图。
- delete 必须有删除意图；`permanent === true` 还必须有“永久删除/彻底删除/不可恢复”等确认词。
- 普通 create 的 folder 若未在当前消息明确出现，强制回到 `01-Inbox`。
- 错题 create 必须明确收录/加入/放入错题，并能判断高数或线代，否则返回失败。

移动的底层顺序是 GET 源 → 确认目标不存在 → POST 目标 → GET 回读比对 → DELETE 源；失败时保留源：`note-management.ts:64-85`。

## 14. Delete / Move Semantics

- 默认删除移动到 `07-Archive/微信桥回收站/YYYY-MM-DD/`；目标冲突时追加 `-1` 等后缀：`note-management.ts:98-123`。
- `permanent=true` 经过 registry 的关键词双门禁后，调用 `DELETE /api/note` 并返回“笔记已永久删除”：`registry.ts:310-318`、`note-management.ts:98-107`、`fns-api.ts:144-155`。
- 旧项目源码不能证明 FNS 服务端是否真正不可恢复；该语义为 **UNCERTAIN**。

## 15. File and Attachment Behavior

- 入站文件：`file_item.media.full_url` 下载到 `DATA_DIR/files/`，文件名仅做字符替换；文本扩展名会把本地路径提示给模型读取，Word/PDF 会提示专用工具：`orchestrator.ts:386-400,520-559`。
- 入站文件若 magic bytes 是图片，会同时转 Base64 给模型；普通文件没有统一大小限制或生命周期清理。
- 出站图片/文件走 iLink CDN 加密上传，见 `sender.ts:56-230`；附件是否成功依赖真实 CDN/FNS，静态测试不能证明。

## 16. Wrong Question Workflow

### 16.1 User Trigger and Subject Routing

当前真实保存入口是 `registry.execute("create_note")` → `resolveCreateFolder()` → `createNote()`，见 `registry.ts:254-302`、`notes.ts:12-34`。`note-routing.ts:15-16` 要求当前消息明确“错题”及收录类动词；科目可由 folder、标题或消息中的高数/线代词推断，无法判断时 `registry.ts:258-261` 拒绝。

### 16.2 Paths

当前原题保存路径：

```text
06-Resources/学习/考研/考研数学/错题本/原档案/高数/
06-Resources/学习/考研/考研数学/错题本/原档案/线代/
```

证据：`src/tools/notes.ts:3-20`。

### 16.3 Historical Workflow Reachability

`src/workflows/wrong-question.ts:23-33` 仍定义 `isWrongQuestionPath()` 和 `enqueueWrongQuestion()`，但当前全仓 caller 为 0；当前 `notes.ts` 已移除 enqueue 调用。workflow 只匹配无 `原档案` 的 `错题本/高数`、`错题本/线代`，与当前保存路径不一致。因此自动章节聚合当前为 **DEAD / INTENDED / BROKEN**。`git diff HEAD -- src/tools/notes.ts` 证明 HEAD 曾有 hook，working tree 已移除。

### 16.4 Chapter Taxonomy

`wrong-question.ts:10-19` 的工作流 taxonomy 为高数 18 讲、线代 6 章。高数包含函数极限与连续、数列极限、一元函数微分学概念/计算、几何应用、中值定理/微分等式/微分不等式、物理与经济应用、一元函数积分学概念/计算、重复命名的积分几何/等式/物理应用、多元函数微分学、二重积分、微分方程、无穷级数、多元函数积分学（一）（二）。线代为行列式、矩阵、线性方程组、向量与方程组、矩阵相似理论、二次型。不要把重复标题自行合并。

### 16.5 Classification Schema and Aggregation

workflow 要求模型返回 JSON 字段：`chapter_number`、`chapter_file`、`section`、`topic`、`problem_type`、`key_point`、`methods`、`summary`、`pitfall`：`wrong-question.ts:95-99`。解析只去除代码围栏、截取首个 `{` 到最后一个 `}` 后 `JSON.parse`，没有完整 schema/type 校验：`wrong-question.ts:43-57`。

历史聚合设计：读取章节归纳文件；不存在时生成带 `title`、`tags`、`source_book`、`source_chapter`、`note_count` 的模板；追加错题条目和 Obsidian embed；更新 `note_count`；最后更新 `03-Projects/考研数学/错题本索引.md`：`wrong-question.ts:65-112`。当前无 caller，故这些行为为 **INTENDED/DEAD**，不是当前功能。

### 16.6 Current Markdown

当前 `create_note` 不生成强制错题 Markdown 模板，只写入模型传入的 `content` 并回读校验：`notes.ts:12-34`。因此 frontmatter、标题、题目、用户错误、AI 分析、tags、时间戳不属于 bridge 强制 schema。只有历史 workflow 模板（`wrong-question.ts:65-85`）包含上述聚合字段和 embed。

## 17. Schedule

- `src/tools/schedule.ts:4-55` 直接读取硬编码的 `C:/Users/HUAWEI/Vault/猥琐凡人的仓库/02-Daily/to do/日程看板.md` 和 `02-Daily/journal/`，返回看板和最多 2000 字符日记。
- `src/tools/schedule-write.ts:7-10,155-241` 直接修改同一看板，并在存在时插入日记；支持今天/明天/后天、下周几、月日、数字和中文时间、时长。
- 已知静态缺陷：`CN_NUM["二"]` 为 1；`零` 受 falsy 判断影响；复合中文数字处理不完整并可能回退 9 点；`MONTHLY_DIR` 定义未使用。没有对应 schedule-write 测试。
- 与其他项目规范中“`03-Projects/日程清单.md`”的声明不一致；当前实现为 **PARTIAL**。Q7 的硬编码 Windows 路径事实为 VERIFIED。

## 18. Search

`src/tools/search.ts:1-73` 只实现 Bing RSS 网页搜索（`cn.bing.com`、`www.bing.com`），GET timeout 8 秒，过滤 HTML/Cloudflare 页面，解析 title/link/description。`search_web` 是外部网络搜索；`find_notes` 是 FNS/Vault 搜索，两者不是同一后端。

## 19. Shell / Filesystem

`src/tools/shell.ts:8-131` 允许 Agent 使用命令白名单（`pwd/date/ls/cat/head/tail/grep/rg/find/df/du/ps/stat/file/wc/sort/uniq/which/where/uname/id/whoami/realpath/readlink/basename/dirname/jq/git/pm2`）。git 仅允许 status/diff/log/show/rev-parse/ls-files/grep；pm2 仅允许 status/list/logs。

阻止命令链、命令替换、进程替换、输入/写重定向、后台连接符、`find -delete/-exec/-fprint`、`sort -o`、`rg --pre`、敏感路径（`.env`、auth、credentials、`.ssh`、私钥）。Windows cwd 固定为 `C:/Users/HUAWEI/Desktop/original`：`shell.ts:4-12,109-119`。

安全结论为 **ACTIVE/PARTIAL**：白名单和过滤器存在，但参数仅用简单 token split，且 `read_file`、`read_docx`、`read_pdf`、`send_image`、`send_file` 没有统一 filesystem root guard，可处理任意存在的本地绝对路径。

## 20. Memory

`src/memory/shared.ts:5-8,34-49`：`DATA_DIR/shared-memory.json` 保存 user facts、IDE topics、微信 topics 和最近最多 50 条微信摘要；user facts 最多 30 条。`addUserFact()` 同时写 shared memory 和旧 Claude memory 目录：`shared.ts:51-95,130-137`。

`buildMemoryContext()` 将 user facts、旧 Claude memory 文件和最近 IDE topics 拼进模型 system prompt：`shared.ts:99-112`。最近微信摘要主要给 `/memory` 命令展示，并不进入该 prompt。旧 memory 内容没有明显的 prompt-injection 隔离，行为为 **ACTIVE/PARTIAL**；caller 为 `/memory`、`/remember`、成功/部分回复记录和模型 `add_memory`：`orchestrator.ts:350-361,473-491`。

## 21. `sync-fns.js`

`sync-fns.js:21-84` 是辅助 mirror/cache，不是正式写入通道：每 5 秒从 FNS 读取 `/notes` 和 `/note`，写入 `/opt/vault-mirror`，并删除远端列表中不存在的本地镜像文件；不调用 FNS POST/DELETE。它不是 `package.json` script，当前 `ecosystem.config.cjs` 也未见启动入口；是否正在生产运行不能靠本轮静态代码确认。

脚本在 ES module 包中对缺失 token 的 fallback 使用 `require('fs')`，可能出现 `require is not defined`；实际部署是否总有环境变量只能外部验证。因此“只读 mirror”是 VERIFIED，“当前是否运行”是 UNCERTAIN。

## 22. Dead / Unreachable Code

- `src/workflows/wrong-question.ts` 的 `enqueueWrongQuestion`：DEAD；定义存在但当前 caller 为 0。
- `src/agent/qwen-vl.ts` 的 `analyzeImageWithQwenVL`：DEAD/INTENDED；当前全仓无 caller，旧 HEAD orchestrator 曾调用，working tree 已移除该调用。
- workflow 聚合/索引函数：INTENDED/DEAD；逻辑存在但当前保存入口不再触发。
- `sync-fns.js`：辅助脚本存在但是否被常驻进程调用 UNCERTAIN。

## 23. Intended But Currently Broken Behavior

- 错题原档案创建与章节自动聚合之间的 hook 已断开；路径常量也不一致。
- 章节 JSON 分类缺少 schema 校验，模型输出结构错误时仅靠 JSON.parse。
- schedule 设计与当前 Vault 日程清单路径/中文数字解析存在偏差。
- 永久删除的客户端标签是“永久”，但 FNS 服务端是否不可恢复无法由源码确认。
- 出站 CDN upload 的双重 JSON stringify 疑点未被当前测试覆盖。

## 24. Tests vs Runtime Differences

旧项目测试覆盖：15 个工具注册、create 路由和回读、update/read-before-write、move 顺序、软/永久删除、FNS code/分页/not-found、路径 normalization、AES/MIME/CDN fallback、direct/ref 图片优先级、shell allowlist、conversation tool pair/history trim、Bing RSS：见 `src/**/*.test.ts`。

测试不能证明：

- workflow 测试函数导出不等于 runtime caller 存在；当前 caller 仍为 0。
- media mock 不等于真实 iLink payload/CDN 行为。
- FNS mock 不等于服务端永久删除和同步语义。
- `send_image`/`send_file` 没覆盖双重 stringify；schedule-write 没有测试，中文数字缺陷未被门禁捕获。

## 25. Known Bugs / Semantic Mismatches

1. 错题 workflow 路径缺少 `原档案`，且当前 hook 已断开。
2. Qwen-VL 代码保留但当前不可达。
3. 内容去重注释称 30 秒但实现没有 TTL。
4. session 恢复未重新应用保存的 iLink base URL。
5. signal 关闭未显式退出且 heartbeat 未清理。
6. FILE 图片没有统一大小限制/清理。
7. schedule 硬编码 Windows 路径和中文数字解析缺陷。
8. shell 参数解析简单，filesystem 工具缺少统一 root guard。
9. tool loop 没有最大 turn 限制。
10. FNS 永久删除服务端语义、CDN 出站双重 stringify、`sync-fns.js` 是否运行需要外部验证。

## 26. Assets Worth Migrating

- 错题科目显式意图和高数/线代路由规则。
- 当前原档案目录约定及标题清理规则。
- 章节 taxonomy、聚合字段和 Obsidian embed 形式（需先修复路径/入口）。
- update 的明确意图 + 同轮 read-before-write。
- move 的读/目标不存在/写/回读/删源顺序和失败保源语义。
- 默认软删除回收站与路径 normalization/traversal 防护。
- 图片 magic-byte 检测、AES key 多格式解析和大小限制思路。

## 27. Components That Must NOT Be Migrated

- iLink 登录、polling、session、消息 transport、CDN/AES 协议实现。
- 旧自研 Anthropic/DeepSeek model loop、基础 memory runtime、PM2 bridge runtime。
- Qwen-VL dead path 和未接入的旧 workflow 自动行为。
- `sync-fns.js` 作为正式写入通道。
- 任何 `.env`、token、登录态、`data/`、日志、`node_modules` 或个人/教材原始资料。

## 28. Open Questions

- FNS `DELETE /api/note` 是否服务端可恢复/不可恢复？
- 当前生产是否实际启动 `sync-fns.js`？需 S0/S1 外部进程证据，G1 不连接服务器。
- iLink 出站 `getuploadurl` body 双重 stringify 在真实服务端是否被接受？
- 当前 dirty working tree 的全部变更是否已部署？本阶段不作运行时推断。

## 29. Verified Known Questions (Q1–Q10)

| Question | Result | Conclusion |
|---|---|---|
| Q1 wrong-question caller | **VERIFIED** | 当前 `enqueueWrongQuestion` caller 为 0；自动聚合不可达。 |
| Q2 path mismatch | **VERIFIED** | workflow 匹配无 `原档案` 路径，当前 notes 写入有 `原档案` 路径。 |
| Q3 Qwen-VL caller | **VERIFIED** | 当前无 caller，`qwen-vl.ts` 为 DEAD/INTENDED。 |
| Q4 image pipeline | **VERIFIED** | 当前 direct/ref 图片走 CDN→明文/AES→MIME→Base64→DeepSeek Vision；FILE 图片是有限 fallback。 |
| Q5 permanent delete | **VERIFIED** | `permanent=true` 最终调用 `DELETE /api/note`；服务器不可恢复语义 UNCERTAIN。 |
| Q6 write safety guards | **VERIFIED** | update/read-before-write、update/delete/move intent、permanent 双门禁均存在。 |
| Q7 Windows schedule path | **VERIFIED** | schedule 直接绑定 `C:/Users/HUAWEI/Vault/...`。 |
| Q8 sync-fns | **VERIFIED** | 代码只读 FNS 并写本地 mirror，不是正式写入；当前是否运行 UNCERTAIN。 |
| Q9 tool-loop limit | **VERIFIED** | `for (let turn = 0; ; turn++)` 无有效最大轮次。 |
| Q10 aggregation reachability | **VERIFIED** | workflow 当前无 caller，且路径不一致；状态 DEAD/BROKEN。 |

## 30. G2 Input Specification

### MUST PRESERVE

- 仅在当前消息明确收录错题时写入错题目录；高数/线代科目必须可解释确定。
- `原档案/高数` 与 `原档案/线代` 的当前目录事实（不要恢复无 `原档案` 的旧常量）。
- update 的明确意图、同轮同路径 read-before-write 和写后回读。
- move 的安全顺序、失败保源；默认删除进入日期回收站。
- Vault-relative path normalization、拒绝 `..`/NUL/越界绝对路径。
- 已有章节 taxonomy、分类字段、note_count/embed 等有价值业务字段，待入口修复后再实现。
- 图片 MIME magic-byte 检测、AES key 格式兼容和明确大小限制作为数据处理约束。

### MUST FIX

- 恢复/重设计错题聚合 caller，并统一 workflow 与当前 `原档案` 路径。
- 为分类对象加入显式 schema 校验、字段缺失和模型异常处理。
- 明确 FNS 删除/恢复语义，不把客户端“永久”标签当作服务端事实。
- 去除 schedule 的 Windows 绝对路径依赖并修正中文数字解析。
- 为文件/附件工具建立统一根目录与大小/生命周期策略。
- 为 tool loop 设计可验证的最大轮次/重复调用门禁。

### DO NOT MIGRATE

- iLink transport/auth/polling/CDN/AES 协议实现。
- 旧 custom model loop、旧基础 memory runtime、Qwen-VL dead path。
- `sync-fns.js` 作为正式 FNS 写入通道。
- secrets、session、data、logs、node_modules、个人/教材原始 fixture。

### DEFER

- schedule 重构和复杂日程解析。
- 完整章节聚合、索引维护和历史统计。
- Qwen OCR fallback。
- 完整附件归档/同步策略。
- 真实 DeepSeek/FNS/iLink 集成与生产迁移。
