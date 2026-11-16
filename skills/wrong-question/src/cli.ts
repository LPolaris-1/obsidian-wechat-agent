import { buildWrongQuestionWritePlan, parseWrongQuestion } from "./index.js";

const MAX_INPUT_BYTES = 1024 * 1024;

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_INPUT_BYTES) throw new Error("输入超过 1 MiB");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function main(): Promise<void> {
  try {
    const input: unknown = JSON.parse(await readStdin());
    if (!isRecord(input) || input.archive !== true) throw new Error("archive 必须严格为 true");
    const question = parseWrongQuestion(input.question);
    const plan = buildWrongQuestionWritePlan(question, { archive: true });
    process.stdout.write(`${JSON.stringify(plan)}\n`);
  } catch {
    process.stderr.write("INVALID_INPUT\n");
    process.exitCode = 1;
  }
}

void main();
