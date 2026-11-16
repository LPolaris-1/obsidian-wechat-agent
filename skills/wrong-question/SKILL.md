---
name: wrong-question
description: Archive an explicitly requested math wrong question through wrong_question_plan and exact-path FNS note operations.
user-invocable: false
---

# Wrong Question Skill v1

## Purpose

把用户明确要求收录的一道数学错题转换为经过校验的结构化对象和确定性写入计划，并在用户授权的 Vault 中完成碰撞检测、创建和读取验证。Skill 本身不直接读写文件；结构化校验和路径生成由 `wrong_question_plan` 工具完成，FNS 操作只使用该工具返回的字段。

## Trigger

仅当用户明确说“记录/收录/加入/放入错题本”等归档意图时才进入本流程。询问解法、讨论知识点、发送普通题目、只要求整理或只要求生成 Markdown 均不触发归档。

## Preconditions

归档前必须同时满足以下条件；任一条件不满足就停止并向用户报告，不得继续或改用其他工具：

- 用户已明确表达归档意图，并指定了授权的 Vault。
- 当前 Agent 可调用 `wrong_question_plan`。
- 当前 Agent 可调用 `fns__note_get` 和 `fns__note_create_or_update`，且对该 Vault 有读取和写入权限。
- 用户已提供 `subject`、`chapter`、`topic`、`problemType`、`question`、`userError`、`errorReason`、`correctSolution`、`keyPoint`、`tags` 等字段的真实内容。不要编造用户错误、错误原因或解法；缺失或不确定时先询问。

不要要求或尝试使用通用 shell、直接 filesystem、HTTP 请求、CLI 或备用写入通道。工具不可用、权限不足、读取失败或结果无法确认时，只能停止并报告。

## Step 1: 读取 Vault LaTeX 规则

在任何输入构造或写入之前，先用 `fns__note_get` 读取用户授权 Vault 内的精确路径：

`06-Resources/rules/LaTeX写入规则.md`

调用时明确传入该 Vault 和上述精确路径。读取成功后才能继续；如果文件不存在、无权限、传输失败、返回内容不可用或无法判断是否成功，立即停止。不得跳过规则读取，不得用记忆中的规则替代，也不得写入其他路径作为尝试。

构造结构化字段时，数学内容的 LaTeX 写法必须遵守刚读取的规则。规则有歧义或与原题冲突时停止并询问用户，不猜写。用户可见的微信答复仍使用 Unicode 符号和纯文本，不输出 `$...$`、`$$...$$`、`\(...\)`、`\[...\]` 或 TeX 命令。

## Step 2: 构造 `wrong_question_plan` 输入

只提交以下字段：

```json
{
  "archive": true,
  "question": {
    "subject": "高数或线代",
    "chapter": "canonical 章节名",
    "topic": "知识点",
    "problemType": "题型",
    "question": "题目",
    "userError": "我的错误",
    "errorReason": "错误原因",
    "correctSolution": "正确思路",
    "keyPoint": "关键点",
    "tags": ["标签"],
    "sourceImage": "可选，Vault-relative attachment reference"
  }
}
```

规则：

- `archive` 必须是字面量布尔值 `true`；字符串、数字、缺失值或 `false` 都不行。
- `subject` 只允许“高数”或“线代”。`chapter` 必须属于该科目的 canonical taxonomy；display name 重复时必须提供 `chapterId` 或 `chapterNumber` 消歧。
- `topic` 缺失时工具会使用确定性的“未分类知识点”，但不能用它掩盖用户本可提供的信息。
- `sourceImage` 只能是 Vault-relative attachment reference；不得是 URL、绝对路径或包含 `..` 的路径。
- 不要提交 `questionId`、`targetPath`、`chapterId`（除非用于消歧）、Vault 根目录或其他自定义路径。不得由模型生成或覆盖这些 identity/path。
- 所有字段内容都来自用户当前请求；不要把题目、错误或个人内容写入仓库、日志、提交信息或调试输出。

## Step 3: 调用 `wrong_question_plan`

调用一次 `wrong_question_plan`，输入必须是上一步构造的 `{ archive: true, question: {...} }`。

- 工具返回 `INVALID_INPUT`、不可用、超时或任何非成功结果时立即停止。不要修改字段后反复试错，不要自行修复路径，不要改用 shell 或本地 CLI。
- 只有返回对象同时包含非空 `questionId`、`targetPath` 和 `markdown` 时才继续。
- `targetPath` 和 `markdown` 是唯一可信来源；不要让模型重新计算、拼接或替换它们。

## Step 4: 精确路径碰撞检测

在用户授权的 Vault 中，用 `fns__note_get` 读取 `targetPath` 的精确路径：

```json
{ "vault": "用户授权的 Vault", "path": "<plan.targetPath>" }
```

判定规则：

- 返回一篇笔记：目标已存在。不得调用 `fns__note_create_or_update`，不得覆盖。向用户报告冲突和 `questionId`/`targetPath`，让用户选择下一步；在用户明确选择前停止。
- FNS 明确返回“笔记不存在”（note not found）且没有权限、传输或其他错误：视为目标不存在，可以继续。
- 权限错误、连接错误、超时、工具不可用、结果不明确或无法区分“不存在”和其他失败：立即停止并报告。不得用 `note_list`、关键词搜索或其他工具推断不存在。
- 不得自行生成替代路径，也不得把写入改到 `Migration-Test/` 等临时目录来绕过冲突。

如果用户在看到冲突后明确选择更新现有笔记，必须再次确认该选择，并说明这会更新已有内容；不得把“默认继续”当作授权。

## Step 5: 创建笔记

只有在 Step 4 明确判定目标不存在后，才调用 `fns__note_create_or_update`：

```json
{
  "vault": "用户授权的 Vault",
  "path": "<plan.targetPath>",
  "content": "<plan.markdown>"
}
```

必须原样使用 `targetPath` 和 `markdown`。不得使用 `note_append`、`note_prepend`、`note_replace`、`file_write` 或其他写入工具；不得改变 Vault、根目录、文件名或内容。写入失败时停止并报告，不要换个路径重试。

## Step 6: 精确路径读取验证

写入后必须再用 `fns__note_get` 读取完全相同的 `vault` 和 `targetPath`。只有以下条件全部满足才能向用户报告成功：

- 返回的笔记可读且正文非空。
- 标题、`id`、结构与 `plan.markdown` 的目标一致，未发现截断或错误内容。
- 读取使用精确目标路径，没有改用搜索、列表或近似路径。

读取失败、内容不一致、无法确认或工具不可用：停止并报告“写入结果未验证”，不要再次覆盖，不要改用其他路径重试，也不要声称归档已完成。

## Failure handling

| 失败点 | 必须行为 |
| --- | --- |
| 规则文件读取失败 | 停止；不构造输入、不调用计划工具、不写 Vault |
| `wrong_question_plan` 不可用或返回 `INVALID_INPUT` | 停止；不自行修复、不生成路径、不改用 shell/CLI |
| 碰撞检测读取失败或结果不明确 | 停止；不写 Vault、不推断“不存在” |
| 目标已存在 | 不覆盖；报告冲突并等待用户选择 |
| 创建失败 | 停止；不换路径重试、不改用其他写入工具 |
| 创建后读取失败或内容不一致 | 停止；报告未验证；不覆盖重试 |

## Output expectations

成功时，用户可见答复只需简短说明：已归档、`questionId`、目标笔记路径，以及已完成精确路径读取验证。不要输出题目个人内容、完整 Markdown 或内部工具参数。微信答复使用 Unicode 符号和纯文本。

## Safety and limits

- 本 Skill 不直接调用 filesystem、FNS HTTP API、DeepSeek、微信或任何 LLM API；FNS 只能通过已注册的原生工具调用。
- 不执行删除、移动、重命名、永久删除、索引写入、章节聚合或统计。
- 不覆盖已存在的 `targetPath`，除非用户在看到冲突后明确授权更新；即使如此，也不存在自动事务或跨请求锁。
- 碰撞检测是“先读后写”，不是原子事务；并发写入仍可能造成覆盖。不得承诺自动事务防覆盖。
- 题目、错误、图片和生成的 Markdown 属于个人内容，不写入仓库、日志、测试 fixture、issue、提交信息或调试输出。
- 本 Skill 的规则接线不等同于端到端验收。实际 FNS 行为、插件加载、模型工具调用和微信回复仍需在隔离 Vault 中用虚构数据逐一验证；未验证前不得宣称已通过。

## MUST NOT

- 不在用户未明确要求归档时生成写入计划或调用 FNS 写入。
- 不自行构造任意 Vault 路径，不覆盖已有笔记，不执行删除、移动或永久删除。
- 不在规则读取、碰撞检测、创建或读回失败后绕过、换路或静默继续。
- 不把 `questionId`、`targetPath` 或其他 identity 交给模型自由生成。
- 不承诺自动事务、自动防覆盖或已完成在线验收。
