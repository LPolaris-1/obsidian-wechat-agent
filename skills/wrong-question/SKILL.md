# Wrong Question Skill v1

## Purpose

将用户明确要求收录的一道数学错题转换为经过校验的结构化对象和确定性 `WrongQuestionWritePlan`。本版本只提供离线业务 domain logic，不执行文件写入。

## Trigger

仅当用户明确说“记录/收录/加入/放入错题本”等意图时才进入归档流程。询问解法、讨论知识点或发送普通题目均不触发归档。

## Required fields

`subject`、`chapter`、`topic`、`problemType`、`question`、`userError`、`errorReason`、`correctSolution`、`keyPoint`、`tags` 必须通过 schema 验证。`topic` 缺失时使用确定性的“未分类知识点”；`sourceImage` 只能是 Vault-relative attachment reference。

## Subject and chapter routing

`subject` 仅允许“高数”或“线代”。章节必须属于该科目的 canonical taxonomy；例如“高数 + 行列式”直接失败。目标根目录由 domain 常量决定，调用方和模型不能传入自定义 root。

## Output contract

`parseWrongQuestion()` 返回 `ValidatedWrongQuestion`；`buildWrongQuestionWritePlan()` 再生成 `targetPath`、确定性 Markdown 和可选附件引用。Markdown 包含稳定 frontmatter、题目、我的错误、错误原因、正确思路、关键点和分类段落。

## Safety expectations

路径拒绝 NUL、`..`、POSIX/Windows 绝对路径、URL scheme 和空路径；文件名会清理非法字符、trim、限长并提供 fallback。所有输出均为纯对象或字符串，便于 fixture 测试。

## MUST NOT

- 不直接调用 filesystem、FNS、DeepSeek、微信或任何 LLM API。
- 不自行构造任意 Vault 路径，不执行删除、移动或永久删除。
- 不实现章节聚合、统计、索引写入、图片 OCR、AES/CDN 或旧 iLink runtime。
- 未经用户明确归档意图，不生成写入计划。
