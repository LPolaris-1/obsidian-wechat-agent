import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = resolve(projectRoot, "extensions/obsidian-policy/openclaw.plugin.json");

test("Obsidian policy plugin remains a G0 skeleton", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  assert.equal(manifest.id, "obsidian-policy");
  assert.equal(manifest.status, "skeleton");
});
