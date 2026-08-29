import { spawnSync } from "node:child_process";

const command = process.env.OPENCLAW_BIN || "openclaw";
const required = ["FNS_BASE_URL", "FNS_TOKEN", "FNS_VAULT"];
const missing = required.filter((name) => !process.env[name]);
const version = spawnSync(command, ["--version"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

if (version.error || version.status !== 0) {
  console.error("BLOCKED: cannot discover FNS MCP tools without the stock OpenClaw runtime.");
  process.exitCode = 2;
} else if (missing.length > 0) {
  console.error(`BLOCKED: missing FNS runtime variables: ${missing.join(", ")}.`);
  process.exitCode = 2;
} else {
  console.log("FNS runtime variables are present (token value intentionally not printed).");
  console.log("Tool discovery and Migration-Test CRUD must be run through the verified OpenClaw MCP registration.");
}
