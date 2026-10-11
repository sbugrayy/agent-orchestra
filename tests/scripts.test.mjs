// Tests for the skill's helper scripts. Run with: node --test tests/
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const scripts = path.join(root, "skills", "agent-orchestra", "scripts");
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "orchestra-test-"));
}

function node(script, args, env = {}) {
  return spawnSync(process.execPath, [path.join(scripts, script), ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function snapshot(dir) {
  const files = {};
  for (const rel of ["AGENTS.md", "CLAUDE.md", ".gitignore", ".claude/settings.json", ".opencode/agent/analyst.md"]) {
    const file = path.join(dir, rel);
    files[rel] = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  }
  return files;
}

test("apply-templates creates every file in an empty project", () => {
  const dir = tmpDir();
  const res = node("apply-templates.mjs", ["--project", dir]);
  assert.equal(res.status, 0, res.stderr);
  const files = snapshot(dir);
  for (const [rel, text] of Object.entries(files)) assert.notEqual(text, null, `${rel} missing`);
  assert.match(files["AGENTS.md"], /agent-orchestra:start/);
  assert.match(files["CLAUDE.md"], /you are the conductor/);
  assert.match(files[".gitignore"], /^\.orchestra\/$/m);
  const settings = JSON.parse(files[".claude/settings.json"]);
  assert.ok(settings.permissions.allow.includes("Bash(agy -p:*)"));
});

test("apply-templates is idempotent", () => {
  const dir = tmpDir();
  node("apply-templates.mjs", ["--project", dir]);
  const first = snapshot(dir);
  const res = node("apply-templates.mjs", ["--project", dir]);
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(snapshot(dir), first);
});

test("apply-templates keeps existing content and settings", () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, "CLAUDE.md"), "# My project\n\nKeep me.\n");
  fs.mkdirSync(path.join(dir, ".claude"));
  fs.writeFileSync(
    path.join(dir, ".claude", "settings.json"),
    Buffer.concat([BOM, Buffer.from(JSON.stringify({ model: "x", permissions: { allow: ["Bash(ls:*)"] } }))]),
  );
  const res = node("apply-templates.mjs", ["--project", dir]);
  assert.equal(res.status, 0, res.stderr);
  const claudeMd = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");
  assert.ok(claudeMd.startsWith("# My project\n\nKeep me.\n"));
  assert.match(claudeMd, /agent-orchestra:end/);
  const raw = fs.readFileSync(path.join(dir, ".claude", "settings.json"));
  assert.ok(!raw.subarray(0, 3).equals(BOM), "settings must be written without BOM");
  const settings = JSON.parse(raw.toString("utf8"));
  assert.equal(settings.model, "x");
  assert.equal(settings.permissions.allow[0], "Bash(ls:*)");
  assert.ok(settings.permissions.allow.includes("Bash(opencode run:*)"));
});

test("apply-templates refreshes an outdated orchestra section in place", () => {
  const dir = tmpDir();
  fs.writeFileSync(
    path.join(dir, "AGENTS.md"),
    "# Rules\n\nBefore.\n\n<!-- agent-orchestra:start -->\nold\n<!-- agent-orchestra:end -->\n\nAfter.\n",
  );
  node("apply-templates.mjs", ["--project", dir]);
  const text = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  assert.ok(!text.includes("\nold\n"));
  assert.match(text, /Before\./);
  assert.match(text, /After\./);
  assert.equal(text.split("agent-orchestra:start").length, 2);
});

test("apply-templates --dry-run writes nothing", () => {
  const dir = tmpDir();
  const res = node("apply-templates.mjs", ["--project", dir, "--dry-run"]);
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test("apply-templates refuses to overwrite broken settings.json", () => {
  const dir = tmpDir();
  fs.mkdirSync(path.join(dir, ".claude"));
  fs.writeFileSync(path.join(dir, ".claude", "settings.json"), "{ broken");
  const res = node("apply-templates.mjs", ["--project", dir]);
  assert.equal(res.status, 1);
  assert.equal(fs.readFileSync(path.join(dir, ".claude", "settings.json"), "utf8"), "{ broken");
});

test("fix-bom detects and removes a BOM, keeping a backup", () => {
  const file = path.join(tmpDir(), "settings.json");
  fs.writeFileSync(file, Buffer.concat([BOM, Buffer.from('{"a":1}')]));
  assert.equal(node("fix-bom.mjs", [file, "--check"]).status, 1);
  const res = node("fix-bom.mjs", [file]);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.readFileSync(file, "utf8"), '{"a":1}');
  assert.ok(fs.readFileSync(`${file}.bak`).subarray(0, 3).equals(BOM));
  assert.equal(node("fix-bom.mjs", [file, "--check"]).status, 0);
});

test("doctor flags a BOM in agy settings and reports project status as JSON", () => {
  const dir = tmpDir();
  const settings = path.join(tmpDir(), "settings.json");
  fs.writeFileSync(settings, Buffer.concat([BOM, Buffer.from("{}")]));
  node("apply-templates.mjs", ["--project", dir]);
  const res = node("doctor.mjs", ["--project", dir, "--json"], { AGENT_ORCHESTRA_AGY_SETTINGS: settings });
  const report = JSON.parse(res.stdout);
  const get = (name) => report.results.find((r) => r.name === name);
  assert.equal(get("settings.json encoding").status, "missing");
  assert.equal(get("AGENTS.md").status, "ok");
  assert.equal(get(".claude/settings.json permissions").status, "ok");
  assert.equal(get("OpenCode analyst agent").status, "warn");
  assert.equal(report.ok, false);
});
