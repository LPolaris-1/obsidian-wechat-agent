import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  CHAPTERS,
  HIGH_MATH_CHAPTERS,
  LINEAR_ALGEBRA_CHAPTERS,
  buildWrongQuestionWritePlan,
  parseWrongQuestion,
  renderWrongQuestionMarkdown,
  resolveChapter,
  resolveWrongQuestionTarget,
  sanitizeFilename,
  validateSourceImageReference,
} from "../../skills/wrong-question/src/index.ts";

const fixture = async (name) => JSON.parse(await readFile(new URL(`../fixtures/wrong-question/${name}.json`, import.meta.url), "utf8"));
const validHigh = await fixture("high-limit");
const validLinear = await fixture("linear-matrix");
const mismatch = await fixture("chapter-mismatch");
const emptyQuestion = await fixture("empty-question");
const invalidImage = await fixture("invalid-image");
const validImage = await fixture("valid-image");

test("schema accepts a complete high-math fixture", () => {
  const value = parseWrongQuestion(validHigh);
  assert.equal(value.subject, "高数");
  assert.equal(value.chapter, "函数极限与连续");
  assert.equal(value.topic, "左右极限");
  assert.deepEqual(value.tags, ["极限", "概念"]);
});

test("schema accepts linear algebra and snake_case aliases", () => {
  const value = parseWrongQuestion({ ...validLinear, problemType: undefined, problem_type: validLinear.problemType, userError: undefined, user_error: validLinear.userError, errorReason: undefined, error_reason: validLinear.errorReason, correctSolution: undefined, correct_solution: validLinear.correctSolution, keyPoint: undefined, key_point: validLinear.keyPoint });
  assert.equal(value.subject, "线代");
  assert.equal(value.problemType, "计算题");
});

test("rejects invalid subject", () => {
  assert.throws(() => parseWrongQuestion({ ...validHigh, subject: "物理" }), /subject/);
});

test("rejects a chapter from another subject", () => {
  assert.throws(() => parseWrongQuestion(mismatch), /不属于/);
});

test("rejects empty question", () => {
  assert.throws(() => parseWrongQuestion(emptyQuestion), /question 不能为空/);
});

test("rejects malformed tags", () => {
  assert.throws(() => parseWrongQuestion({ ...validHigh, tags: ["ok", 3] }), /tags/);
});

test("uses deterministic topic fallback", () => {
  assert.equal(parseWrongQuestion({ ...validHigh, topic: "   " }).topic, "未分类知识点");
});

test("routes subjects only to the canonical archive roots", () => {
  const high = parseWrongQuestion(validHigh);
  const linear = parseWrongQuestion(validLinear);
  assert.match(resolveWrongQuestionTarget(high), /^06-Resources\/学习\/考研\/考研数学\/错题本\/原档案\/高数\//);
  assert.match(resolveWrongQuestionTarget(linear), /^06-Resources\/学习\/考研\/考研数学\/错题本\/原档案\/线代\//);
  assert.doesNotMatch(resolveWrongQuestionTarget(high), /原档案\/高数.*错题本\/高数/);
});

test("sanitizes filename and provides fallback", () => {
  assert.equal(sanitizeFilename("  a:b/c*  "), "a-b-c-");
  assert.equal(sanitizeFilename(".."), "未命名错题");
  assert.ok(sanitizeFilename("x".repeat(200)).length <= 100);
});

test("rejects unsafe image references", () => {
  assert.throws(() => parseWrongQuestion(invalidImage), /Vault-relative|越界/);
  assert.throws(() => validateSourceImageReference("C:\\secret.png"), /Vault-relative/);
  assert.throws(() => validateSourceImageReference("/tmp/image.png"), /Vault-relative/);
  assert.throws(() => validateSourceImageReference("attachments/../secret.png"), /越界/);
});

test("renders a legal image as an Obsidian embed", () => {
  const value = parseWrongQuestion(validImage);
  const markdown = renderWrongQuestionMarkdown(value);
  assert.match(markdown, /!\[\[attachments\/wrong-question\/example\.png\]\]/);
  assert.match(markdown, /type: wrong-question/);
  assert.match(markdown, /## 正确思路/);
});

test("renderer is deterministic and write plan contains no side effects", () => {
  const value = parseWrongQuestion(validHigh);
  const first = buildWrongQuestionWritePlan(value, { archive: true });
  const second = buildWrongQuestionWritePlan(value, { archive: true });
  assert.deepEqual(first, second);
  assert.equal(first.attachment, undefined);
  assert.equal(first.questionId, value.questionId);
  assert.equal(first.targetPath, `06-Resources/学习/考研/考研数学/错题本/原档案/高数/${value.questionId}-左右极限-概念判断.md`);
});

test("does not build a write plan without explicit archive intent", () => {
  const value = parseWrongQuestion(validHigh);
  assert.throws(() => buildWrongQuestionWritePlan(value, { archive: false }), /明确要求/);
});

test("taxonomy preserves the G1 counts and names", () => {
  assert.equal(HIGH_MATH_CHAPTERS.length, 18);
  assert.equal(LINEAR_ALGEBRA_CHAPTERS.length, 6);
  assert.equal(CHAPTERS.length, 24);
  assert.equal(HIGH_MATH_CHAPTERS[9], "应用(一)几何应用");
  assert.equal(LINEAR_ALGEBRA_CHAPTERS[0], "行列式");
});

test("questionId has stable canonical format", () => {
  const value = parseWrongQuestion(validHigh);
  assert.match(value.questionId, /^WQ-HM01-[A-F0-9]{12}$/);
  assert.equal(value.chapterId, "high-math-01");
  assert.equal(value.chapterNumber, 1);
});

test("question normalization keeps identity across whitespace variants", () => {
  const a = parseWrongQuestion({ ...validHigh, question: "  x + 1\r\n= 2  " });
  const b = parseWrongQuestion({ ...validHigh, question: "x + 1 = 2" });
  assert.equal(a.questionId, b.questionId);
});

test("different substantive questions get different identities and paths", () => {
  const a = parseWrongQuestion(validHigh);
  const b = parseWrongQuestion({ ...validHigh, question: validHigh.question.replace("2 和 3", "2 和 4") });
  assert.notEqual(a.questionId, b.questionId);
  assert.notEqual(resolveWrongQuestionTarget(a), resolveWrongQuestionTarget(b));
});

test("chapterId and chapterNumber resolve duplicate display names", () => {
  const byId = parseWrongQuestion({ ...validHigh, chapter: "应用(一)几何应用", chapterId: "high-math-05" });
  const byNumber = parseWrongQuestion({ ...validHigh, chapter: undefined, chapterNumber: 10 });
  assert.equal(byId.chapterId, "high-math-05");
  assert.equal(byNumber.chapterId, "high-math-10");
});

test("duplicate chapter display name without identity is ambiguous", () => {
  assert.throws(() => parseWrongQuestion({ ...validHigh, chapter: "应用(一)几何应用" }), /AMBIGUOUS CHAPTER/);
});

test("inconsistent chapter identity fields fail", () => {
  assert.throws(() => parseWrongQuestion({ ...validHigh, chapterId: "high-math-05", chapterNumber: 10 }), /不一致/);
  assert.throws(() => resolveChapter("高数", { chapterId: "high-math-05", chapter: "二重积分" }), /不一致/);
});

test("duplicate display names must agree with chapterId and chapterNumber", () => {
  assert.equal(parseWrongQuestion({ ...validHigh, chapterId: "high-math-05", chapter: "应用(一)几何应用" }).chapterId, "high-math-05");
  assert.equal(parseWrongQuestion({ ...validHigh, chapterId: "high-math-10", chapter: "应用(一)几何应用" }).chapterId, "high-math-10");
  assert.equal(parseWrongQuestion({ ...validHigh, chapterId: undefined, chapterNumber: 5, chapter: "应用(一)几何应用" }).chapterId, "high-math-05");
  assert.throws(() => parseWrongQuestion({ ...validHigh, chapterId: "high-math-01", chapter: "应用(一)几何应用" }), /章节字段不一致/);
  assert.throws(() => parseWrongQuestion({ ...validHigh, chapterId: undefined, chapterNumber: 1, chapter: "应用(一)几何应用" }), /章节字段不一致/);
  assert.throws(() => parseWrongQuestion({ ...validHigh, chapterId: "high-math-05", chapterNumber: 10, chapter: "应用(一)几何应用" }), /章节字段不一致/);
  assert.throws(() => parseWrongQuestion({ ...validHigh, chapter: "应用(一)几何应用", chapterId: undefined, chapterNumber: undefined }), /AMBIGUOUS CHAPTER/);
});

test("filename identity prevents topic/type collisions", () => {
  const a = parseWrongQuestion(validHigh);
  const b = parseWrongQuestion({ ...validHigh, question: "另一道完全不同的虚构题目" });
  assert.ok(resolveWrongQuestionTarget(a).includes(a.questionId));
  assert.ok(resolveWrongQuestionTarget(b).includes(b.questionId));
  assert.notEqual(resolveWrongQuestionTarget(a), resolveWrongQuestionTarget(b));
});

test("Windows reserved device names are rejected case-insensitively", () => {
  for (const name of ["CON", "con", "CON.txt", "PRN", "AUX", "NUL", "COM1", "LPT9"]) {
    assert.equal(sanitizeFilename(name), "未命名错题");
  }
});

test("truncation is followed by trailing dot/space cleanup", () => {
  const result = sanitizeFilename("x".repeat(99) + " .");
  assert.ok(result.length <= 100);
  assert.doesNotMatch(result, /[. ]$/);
});

test("archive intent is strict at the runtime boundary", () => {
  const value = parseWrongQuestion(validHigh);
  for (const invalid of [{ archive: "true" }, { archive: 1 }, {}, null]) {
    assert.throws(() => buildWrongQuestionWritePlan(value, invalid), /明确要求/);
  }
  assert.equal(buildWrongQuestionWritePlan(value, { archive: true }).questionId, value.questionId);
});

test("template documents the renderer contract", async () => {
  const template = await readFile(new URL("../../skills/wrong-question/templates/wrong-question.md", import.meta.url), "utf8");
  for (const key of ["type:", "id:", "subject:", "chapter_id:", "chapter_number:", "chapter:", "topic:", "tags:"]) assert.match(template, new RegExp(key));
  for (const heading of ["## 题目", "## 我的错误", "## 错误原因", "## 正确思路", "## 关键点", "## 分类"]) assert.match(template, new RegExp(heading));
});

test("renderer quotes YAML-sensitive metadata and deduplicates tags", () => {
  const value = parseWrongQuestion({ ...validHigh, topic: "极限: #边界", tags: ["错题", "高数", "极限", "极限"] });
  const markdown = renderWrongQuestionMarkdown(value);
  assert.equal((markdown.match(/  - "错题"/g) ?? []).length, 1);
  assert.match(markdown, /topic: "极限: #边界"/);
});
