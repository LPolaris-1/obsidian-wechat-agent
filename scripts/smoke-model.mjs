import { spawnSync } from "node:child_process";

const command = process.env.OPENCLAW_BIN || "openclaw";
const keyPresent = Boolean(process.env.DEEPSEEK_API_KEY);
const version = spawnSync(command, ["--version"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

if (version.error || version.status !== 0) {
  console.error("BLOCKED: cannot run DeepSeek smoke without the stock OpenClaw runtime.");
  process.exitCode = 2;
} else if (!keyPresent) {
  console.error("BLOCKED: DEEPSEEK_API_KEY is not present in the process environment.");
  process.exitCode = 2;
} else {
  console.log("DeepSeek credentials are present (value intentionally not printed).");
  console.log("Text/image calls are manual and must be issued through the installed OpenClaw CLI after its model config is verified.");
}
