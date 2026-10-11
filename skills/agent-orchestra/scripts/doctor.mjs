#!/usr/bin/env node
// Read-only health check for the orchestra. Changes nothing.
// Usage: node doctor.mjs [--project <dir>] [--json]
// Exit code 1 if a required item is missing.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARKER_START, agySettingsPath, hasBom, parseArgs, readText } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const project = path.resolve(args.project || process.cwd());
const results = [];

function add(group, name, status, detail, fix) {
  results.push({ group, name, status, detail, fix });
}

function run(cmd, cmdArgs) {
  const res = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    timeout: 20000,
    shell: process.platform === "win32",
  });
  if (res.error || res.status !== 0) return null;
  return `${res.stdout}${res.stderr}`.trim();
}

function firstLine(text) {
  return text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
}

function checkTool(name, cmd, required, fix) {
  const out = run(cmd, ["--version"]);
  if (out === null) add("tools", name, required ? "missing" : "optional", "not found on PATH", fix);
  else add("tools", name, "ok", firstLine(out));
}

// Tools
const nodeMajor = Number(process.versions.node.split(".")[0]);
add(
  "tools",
  "Node.js",
  nodeMajor >= 18 ? "ok" : "missing",
  `v${process.versions.node}`,
  nodeMajor >= 18 ? undefined : "Install Node.js 18+ (LTS) from https://nodejs.org",
);
checkTool("Git", "git", true, "Install Git from https://git-scm.com");
checkTool("OpenCode", "opencode", true, "npm i -g opencode-ai");
checkTool(
  "Antigravity CLI (agy)",
  "agy",
  true,
  "Install from https://antigravity.google/product/antigravity-cli/ then open a NEW terminal",
);
checkTool("Claude Code", "claude", false, "Conductor. Install from https://claude.com/claude-code");

// Auth
const authList = run("opencode", ["auth", "list"]);
if (authList === null) {
  add("auth", "OpenCode credentials", "unknown", "could not run `opencode auth list`");
} else if (/nvidia/i.test(authList)) {
  add("auth", "OpenCode NVIDIA key", "ok", "NVIDIA provider found in `opencode auth list`");
} else {
  add("auth", "OpenCode NVIDIA key", "missing", "no NVIDIA entry", "Run `opencode auth login`, pick NVIDIA, paste a key from https://build.nvidia.com");
}

// agy settings file
const settingsFile = agySettingsPath();
if (!fs.existsSync(settingsFile)) {
  add("agy", "settings.json", "missing", settingsFile, "Run `agy` once with no arguments and sign in with Google");
} else {
  const buffer = fs.readFileSync(settingsFile);
  if (hasBom(buffer)) {
    add("agy", "settings.json encoding", "missing", "starts with a BOM, agy will silently ignore it", `node ${path.join(here, "fix-bom.mjs")}`);
  } else {
    add("agy", "settings.json encoding", "ok", "UTF-8 without BOM");
  }
  try {
    JSON.parse(buffer.subarray(hasBom(buffer) ? 3 : 0).toString("utf8"));
    add("agy", "settings.json syntax", "ok", "valid JSON");
  } catch (err) {
    add("agy", "settings.json syntax", "missing", err.message, "Fix the JSON by hand");
  }
}

// Project
const inGit = run("git", ["-C", project, "rev-parse", "--is-inside-work-tree"]);
add("project", "Git repository", inGit === "true" ? "ok" : "missing", project, "git init");

const agents = readText(path.join(project, "AGENTS.md"));
add("project", "AGENTS.md", agents?.includes(MARKER_START) ? "ok" : "missing", "rules for agy / OpenCode", `node ${path.join(here, "apply-templates.mjs")}`);

const claudeMd = readText(path.join(project, "CLAUDE.md"));
add("project", "CLAUDE.md orchestra section", claudeMd?.includes(MARKER_START) ? "ok" : "missing", "conductor instructions", `node ${path.join(here, "apply-templates.mjs")}`);

const analyst = readText(path.join(project, ".opencode", "agent", "analyst.md"));
if (analyst === null) {
  add("project", "OpenCode analyst agent", "missing", ".opencode/agent/analyst.md", `node ${path.join(here, "apply-templates.mjs")}`);
} else if (!/^model:\s*\S+/m.test(analyst)) {
  add("project", "OpenCode analyst agent", "warn", "no `model:` set, OpenCode default model will be used", "Pick a model with `opencode models nvidia` and set `model:` in the file");
} else {
  add("project", "OpenCode analyst agent", "ok", firstLine(analyst.match(/^model:.*$/m)[0]));
}

let allow = [];
try {
  allow = JSON.parse(readText(path.join(project, ".claude", "settings.json")) ?? "{}").permissions?.allow ?? [];
} catch {
  // reported below as missing
}
const needed = ["Bash(agy -p:*)", "Bash(opencode run:*)"];
const lacking = needed.filter((rule) => !allow.includes(rule));
add("project", ".claude/settings.json permissions", lacking.length ? "missing" : "ok", lacking.length ? `missing: ${lacking.join(", ")}` : "agy and opencode allowed", `node ${path.join(here, "apply-templates.mjs")}`);

// Output
const failed = results.some((r) => r.status === "missing");
if (args.json) {
  console.log(JSON.stringify({ project, ok: !failed, results }, null, 2));
} else {
  const icon = { ok: "[ok]  ", missing: "[FAIL]", warn: "[warn]", optional: "[--]  ", unknown: "[??]  " };
  let group = "";
  for (const r of results) {
    if (r.group !== group) {
      group = r.group;
      console.log(`\n${group.toUpperCase()}`);
    }
    console.log(`  ${icon[r.status]} ${r.name}: ${r.detail}`);
    if (r.fix && r.status !== "ok") console.log(`         fix: ${r.fix}`);
  }
  console.log(failed ? "\nSome required items are missing." : "\nAll required items are in place.");
}
process.exit(failed ? 1 : 0);
