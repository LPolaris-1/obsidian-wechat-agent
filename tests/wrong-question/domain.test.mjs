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
  assert.equal(first.targetPath, "06-Resources/学习/考研/考研数学/错题本/原档案/高数/左右极限-概念判断.md");
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
