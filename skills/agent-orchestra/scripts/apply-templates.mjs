#!/usr/bin/env node
// Copies the orchestra templates into a project. Safe to run more than once.
// Usage: node apply-templates.mjs [--project <dir>] [--dry-run] [--force]
//   --project  target project root (default: current directory)
//   --dry-run  print what would change, write nothing
//   --force    overwrite .opencode/agent/analyst.md if it already exists
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARKER_END, MARKER_START, parseArgs, readText, writeText } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const templates = path.join(here, "..", "templates");
const args = parseArgs(process.argv.slice(2));
const project = path.resolve(args.project || process.cwd());
const dryRun = Boolean(args["dry-run"]);
const actions = [];

function write(rel, text) {
  if (!dryRun) writeText(path.join(project, rel), text);
}

// Inserts or replaces the marked orchestra section of a Markdown file.
function upsertSection(rel, templateName, title) {
  const target = path.join(project, rel);
  const section = readText(path.join(templates, templateName)).trim();
  const current = readText(target);

  if (current === null) {
    write(rel, `# ${title}\n\n${section}\n`);
    actions.push(`created ${rel}`);
    return;
  }
  const start = current.indexOf(MARKER_START);
  const end = current.indexOf(MARKER_END);
  if (start !== -1 && end > start) {
    const updated = current.slice(0, start) + section + current.slice(end + MARKER_END.length);
    if (updated === current) {
      actions.push(`unchanged ${rel}`);
    } else {
      write(rel, updated);
      actions.push(`updated orchestra section in ${rel}`);
    }
    return;
  }
  write(rel, `${current.trimEnd()}\n\n${section}\n`);
  actions.push(`appended orchestra section to ${rel}`);
}

function copyIfMissing(rel, templateName) {
  const existed = fs.existsSync(path.join(project, rel));
  if (existed && !args.force) {
    actions.push(`kept existing ${rel} (use --force to overwrite)`);
    return;
  }
  write(rel, readText(path.join(templates, templateName)));
  actions.push(`${existed ? "overwrote" : "created"} ${rel}`);
}

// Adds the orchestra allow rules to .claude/settings.json, keeping everything else.
function mergeClaudeSettings() {
  const rel = path.join(".claude", "settings.json");
  const target = path.join(project, rel);
  const wanted = JSON.parse(readText(path.join(templates, "claude-settings.json")));
  const raw = readText(target);
  let settings = {};
  if (raw !== null && raw.trim() !== "") {
    try {
      settings = JSON.parse(raw);
    } catch (err) {
      console.error(`Cannot parse ${rel}: ${err.message}`);
      console.error("Fix the file by hand, then run this script again.");
      process.exit(1);
    }
  }
  settings.permissions ??= {};
  const allow = settings.permissions.allow ?? [];
  const missing = wanted.permissions.allow.filter((rule) => !allow.includes(rule));
  if (missing.length === 0 && raw !== null) {
    actions.push(`unchanged ${rel}`);
    return;
  }
  settings.permissions.allow = [...allow, ...missing];
  write(rel, `${JSON.stringify(settings, null, 2)}\n`);
  actions.push(`${raw === null ? "created" : "updated"} ${rel} (+${missing.length} allow rules)`);
}

function ensureGitignore() {
  const rel = ".gitignore";
  const entry = ".orchestra/";
  const current = readText(path.join(project, rel));
  if (current !== null && current.split(/\r?\n/).includes(entry)) {
    actions.push(`unchanged ${rel}`);
    return;
  }
  const prefix = current === null ? "" : `${current.trimEnd()}\n\n`;
  write(rel, `${prefix}# agent-orchestra task briefs and reports\n${entry}\n`);
  actions.push(`${current === null ? "created" : "updated"} ${rel}`);
}

if (!fs.existsSync(project)) {
  console.error(`Project directory not found: ${project}`);
  process.exit(1);
}

upsertSection("AGENTS.md", "AGENTS.md", "AGENTS.md");
upsertSection("CLAUDE.md", "CLAUDE.orchestra.md", "CLAUDE.md");
copyIfMissing(path.join(".opencode", "agent", "analyst.md"), path.join("opencode", "agent", "analyst.md"));
mergeClaudeSettings();
ensureGitignore();

console.log(`${dryRun ? "[dry run] " : ""}Project: ${project}`);
for (const action of actions) console.log(`  - ${action}`);
