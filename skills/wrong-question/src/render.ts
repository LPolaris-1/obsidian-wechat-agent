import { resolveWrongQuestionTarget } from "./routing.js";
import type { ArchiveIntent, ValidatedWrongQuestion, WrongQuestionWritePlan } from "./types.js";

function yaml(value: string): string {
  return JSON.stringify(value);
}

export function wrongQuestionTitle(question: ValidatedWrongQuestion): string {
  return `${question.topic}｜${question.problemType}`;
}

export function renderWrongQuestionMarkdown(question: ValidatedWrongQuestion): string {
  const tags = [...new Set(["错题", question.subject, ...question.tags])];
  const image = question.sourceImage ? `\n\n![[${question.sourceImage}]]` : "";
  return [
    "---",
    "type: wrong-question",
    `id: ${yaml(question.questionId)}`,
    `subject: ${yaml(question.subject)}`,
    `chapter_id: ${yaml(question.chapterId)}`,
    `chapter_number: ${question.chapterNumber}`,
    `chapter: ${yaml(question.chapter)}`,
    `topic: ${yaml(question.topic)}`,
    "tags:",
    ...tags.map((tag) => `  - ${yaml(tag)}`),
    "---",
    "",
    `# ${wrongQuestionTitle(question)}`,
    "",
    "## 题目",
    "",
    question.question + image,
    "",
    "## 我的错误",
    "",
    question.userError,
    "",
    "## 错误原因",
    "",
    question.errorReason,
    "",
    "## 正确思路",
    "",
    question.correctSolution,
    "",
    "## 关键点",
    "",
    question.keyPoint,
    "",
    "## 分类",
    "",
    `- 编号：${question.questionId}`,
    `- 科目：${question.subject}`,
    `- 章节：${question.chapter}`,
    `- 章节编号：${question.chapterNumber}`,
    `- 知识点：${question.topic}`,
    `- 题型：${question.problemType}`,
    `- 标签：${tags.join("、")}`,
    "",
  ].join("\n");
}

export function buildWrongQuestionWritePlan(question: ValidatedWrongQuestion, intent: ArchiveIntent): WrongQuestionWritePlan {
  if (intent?.archive !== true) throw new Error("用户未明确要求收录错题");
  const markdown = renderWrongQuestionMarkdown(question);
  return {
    questionId: question.questionId,
    targetPath: resolveWrongQuestionTarget(question),
    markdown,
    ...(question.sourceImage ? { attachment: { sourceReference: question.sourceImage } } : {}),
  };
}
