# Workspace 用户规则示例

以下仅提炼生产 workspace 中与本项目相关的用户自定义规则。合入实际 workspace 前，应与已有规则核对；本文件不包含 OpenClaw 通用模板、记忆或会话数据。

## 微信数学回复

微信里给用户看的数学表达使用 Unicode 符号和纯文本。禁止输出 `$...$`、`$$...$$`、`\(...\)`、`\[...\]` 或 TeX 命令。发送前自检，将残留的公式标记和命令转换为可直接阅读的纯文本。

## Obsidian 错题 Markdown

- 用 `fns__note_create_or_update`、`fns__note_append`、`fns__note_prepend`、`fns__note_replace` 或 `fns__file_write` 写错题前，必须先用 `fns__note_get` 读取 Vault 内 `06-Resources/rules/LaTeX写入规则.md`；读取失败就停止写入。
- 按该规则在 Obsidian Markdown 中使用 LaTeX：行内 `$...$`；块级 `$$` 单独占行且前后空行。数学内容不能裸写 Unicode 数学符号；公式内除法不用 `/`，用 `\frac{分子}{分母}`；使用 KaTeX 支持的数学命令。矩阵用 `pmatrix` 等 KaTeX 环境，列以 `&` 分隔、行以 `\\` 分隔；转置须写进公式。数学 tag 只用纯数字；公式中的中文文案放在 `\text{...}` 内。
- Frontmatter 中易被 YAML 误解的值要安全引用。不能对反斜杠做全局替换。写前检查公式定界符、空行、花括号、命令、矩阵分隔、tag、YAML 引用等格式；规则或原题有歧义时停止并询问，不猜写。
- 写后用 `fns__note_get` 读取精确目标路径并核对结果。用户可见的微信答复仍使用 Unicode 符号和纯文本。
