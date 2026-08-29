import { spawnSync } from "node:child_process";

const command = process.env.OPENCLAW_BIN || "openclaw";
const result = spawnSync(command, ["--version"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

if (result.error || result.status !== 0) {
  console.error(`BLOCKED: OpenClaw executable unavailable (${command}).`);
  console.error("Install or expose the stock OpenClaw runtime before running N1 smoke tests.");
  process.exitCode = 2;
} else {
  const version = (result.stdout || result.stderr || "").trim().split(/\r?\n/, 1)[0];
  console.log(`OpenClaw: ${version || "version command succeeded"}`);
  console.log("Runtime start was not requested by this preflight.");
}
