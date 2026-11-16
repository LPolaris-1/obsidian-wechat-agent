import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  INVALID_INPUT_ERROR,
  WRONG_QUESTION_PLAN_TOOL_NAME,
  registerWrongQuestionPlanTool,
} from "../../extensions/wrong-question-tool/src/register.ts";

const validQuestion = {
  subject: "高数",
  chapter: "函数极限与连续",
  topic: "合成知识点",
  problemType: "合成题型",
  question: "合成夹具：判断函数在一点的左右极限是否相等。",
  userError: "合成错误：直接取左右极限的平均值。",
  errorReason: "合成原因：忽略了左右极限必须相等。",
  correctSolution: "合成解法：比较左右极限，不相等则极限不存在。",
  keyPoint: "合成关键点：左右极限相等是极限存在的必要条件。",
  tags: ["合成", "极限"],
};

function registerTool() {
  let registration;
  const api = {
    registerTool(tool, options) {
      assert.equal(registration, undefined, "the plugin must register one tool");
      registration = { tool, options };
    },
  };
  registerWrongQuestionPlanTool(api);
  assert.ok(registration, "the registration handler must register a tool");
  return registration;
}

async function execute(input) {
  const { tool } = registerTool();
  return tool.execute("test-tool-call", input);
}

async function expectInvalid(input, sensitiveValues = []) {
  const { tool } = registerTool();
  await assert.rejects(
    () => tool.execute("test-tool-call", input),
    (error) => {
      assert.equal(error.message, INVALID_INPUT_ERROR);
      for (const sensitive of sensitiveValues) {
        assert.equal(error.message.includes(sensitive), false);
      }
      return true;
    },
  );
}

test("registers one strictly shaped planning tool through the real handler", () => {
  const { tool, options } = registerTool();
  assert.equal(options, undefined);
  assert.equal(tool.name, WRONG_QUESTION_PLAN_TOOL_NAME);
  assert.equal(tool.label, "Wrong Question Plan");
  assert.equal(typeof tool.execute, "function");
  assert.match(tool.description, /never writes files|network/i);
  assert.equal(tool.parameters.type, "object");
  assert.equal(tool.parameters.additionalProperties, false);
  assert.deepEqual(tool.parameters.required, ["archive", "question"]);
  assert.equal(tool.parameters.properties.archive.type, "boolean");
  assert.equal(tool.parameters.properties.question.type, "object");
});

test("valid input returns the domain plan without performing a write", async () => {
  const result = await execute({ archive: true, question: validQuestion });
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, "text");
  const plan = JSON.parse(result.content[0].text);
  assert.deepEqual(result.details, plan);
  assert.match(plan.questionId, /^WQ-HM01-[0-9A-F]{12}$/);
  assert.equal(
    plan.targetPath,
    `06-Resources/学习/考研/考研数学/错题本/原档案/高数/${plan.questionId}-合成知识点-合成题型.md`,
  );
  assert.match(plan.markdown, /合成夹具：判断函数在一点的左右极限是否相等。/);
  assert.match(plan.markdown, /## 正确思路/);
  assert.equal(plan.attachment, undefined);
});

test("invalid domain input returns only the generic error", async () => {
  await expectInvalid(
    {
      archive: true,
      question: {
        ...validQuestion,
        chapter: "行列式",
        topic: "SECRET_TOPIC_MARKER",
        question: "SECRET_QUESTION_MARKER",
      },
    },
    ["SECRET_TOPIC_MARKER", "SECRET_QUESTION_MARKER", "行列式"],
  );

  await expectInvalid(
    { archive: true, question: { ...validQuestion, question: "   " } },
  );

  await expectInvalid(
    { archive: true, question: { ...validQuestion, tags: ["ok", 7] } },
  );
});

test("archive intent must be the literal boolean true", async () => {
  for (const archive of [false, "true", 1, undefined]) {
    await expectInvalid({ archive, question: validQuestion });
  }
  await expectInvalid({ question: validQuestion });
  await expectInvalid({ archive: true, question: null });
  await expectInvalid({ archive: true, question: [validQuestion] });
  await expectInvalid(null);
});

test("manifest and package metadata describe the built entry and owned tool", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../../extensions/wrong-question-tool/openclaw.plugin.json", import.meta.url),
      "utf8",
    ),
  );
  const pkg = JSON.parse(
    await readFile(
      new URL("../../extensions/wrong-question-tool/package.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(manifest.id, "wrong-question-tool");
  assert.deepEqual(manifest.contracts.tools, [WRONG_QUESTION_PLAN_TOOL_NAME]);
  assert.deepEqual(pkg.openclaw.extensions, [
    "./dist/extensions/wrong-question-tool/src/index.js",
  ]);
  assert.equal(pkg.peerDependencies.openclaw, "2026.7.1-2");
  assert.equal(pkg.openclaw.compat.pluginApi, "2026.7.1");
  assert.ok(pkg.files.includes("dist"));
  assert.ok(pkg.files.includes("openclaw.plugin.json"));
});
