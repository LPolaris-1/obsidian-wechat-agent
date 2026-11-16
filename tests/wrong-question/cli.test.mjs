import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const cliPath = fileURLToPath(new URL("../../skills/wrong-question/src/cli.ts", import.meta.url));

const fixture = async (name) => JSON.parse(await readFile(new URL(`../fixtures/wrong-question/${name}.json`, import.meta.url), "utf8"));
const validHigh = await fixture("high-limit");
const mismatch = await fixture("chapter-mismatch");

function runCli(input) {
  const result = spawnSync(process.execPath, ["--import", "tsx", cliPath], {
    cwd: projectRoot,
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  assert.equal(result.error, undefined);
  return result;
}

function assertInvalidInput(result) {
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "INVALID_INPUT\n");
}

test("CLI prints a single-line write plan for a valid fixture", () => {
  const result = runCli({ archive: true, question: validHigh });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^[^\r\n]+\n$/);
  const plan = JSON.parse(result.stdout);
  assert.match(plan.questionId, /^WQ-HM01-[0-9A-F]{12}$/);
  assert.equal(plan.targetPath, `06-Resources/学习/考研/考研数学/错题本/原档案/高数/${plan.questionId}-左右极限-概念判断.md`);
});

test("CLI rejects archive values that are not strictly true", () => {
  const result = runCli({ archive: false, question: validHigh });
  assertInvalidInput(result);
});

test("CLI rejects a chapter from another subject without echoing input", () => {
  const result = runCli({ archive: true, question: mismatch });
  assertInvalidInput(result);
  assert.doesNotMatch(result.stderr, /行列式|高数|测试分类/);
});

test("CLI rejects invalid JSON without echoing input", () => {
  const result = runCli("{not-json");
  assertInvalidInput(result);
  assert.doesNotMatch(result.stderr, /not-json/);
});
