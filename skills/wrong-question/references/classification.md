# Classification

- `subject`：大类，只允许 `高数` / `线代`。
- `chapter`：当前科目的 canonical chapter，必须通过章节集合验证。
- `topic`：具体知识点；缺失时使用 `未分类知识点` fallback。
- `problemType`：题型，必须为非空字符串。
- `userError`：用户本人的错误操作或判断。
- `errorReason`：错误产生的原因。
- `correctSolution`：正确思路或解法。
- `keyPoint`：以后复习时应快速记住的关键点。
- `tags`：非空字符串数组，最多 20 项；渲染时与 `错题`、科目标签去重。
- `sourceImage`：可选的 Vault-relative attachment reference，不包含传输协议或加密字段。
