// Shared helpers for the agent-orchestra scripts. Node.js only, no dependencies.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
export const MARKER_START = "<!-- agent-orchestra:start -->";
export const MARKER_END = "<!-- agent-orchestra:end -->";

export function agySettingsPath() {
  return (
    process.env.AGENT_ORCHESTRA_AGY_SETTINGS ||
    path.join(os.homedir(), ".gemini", "antigravity-cli", "settings.json")
  );
}

export function hasBom(buffer) {
  return buffer.length >= 3 && buffer.subarray(0, 3).equals(BOM);
}

export function stripBom(buffer) {
  return hasBom(buffer) ? buffer.subarray(3) : buffer;
}

// Reads a text file, tolerating a UTF-8 BOM. Returns null if the file is missing.
export function readText(file) {
  if (!fs.existsSync(file)) return null;
  return stripBom(fs.readFileSync(file)).toString("utf8");
}

// Writes UTF-8 without BOM. agy silently ignores settings files that start with a BOM.
export function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(text, "utf8"));
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}
