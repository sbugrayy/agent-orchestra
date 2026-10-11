#!/usr/bin/env node
// Removes a UTF-8 BOM from a file (default: agy's settings.json) and checks that it is valid JSON.
// Usage: node fix-bom.mjs [file] [--check]
//   --check  only report, change nothing (exit 1 if a BOM is found)
import fs from "node:fs";
import { agySettingsPath, hasBom, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const file = args._[0] || agySettingsPath();

if (!fs.existsSync(file)) {
  console.log(`Not found: ${file}`);
  console.log("Run `agy` once interactively so it creates its settings file.");
  process.exit(args.check ? 1 : 0);
}

const buffer = fs.readFileSync(file);
const bom = hasBom(buffer);
const body = bom ? buffer.subarray(3) : buffer;

let jsonError = null;
if (file.endsWith(".json")) {
  try {
    JSON.parse(body.toString("utf8"));
  } catch (err) {
    jsonError = err.message;
  }
}

if (args.check) {
  console.log(`${file}: ${bom ? "HAS BOM (agy will ignore it)" : "no BOM"}`);
  if (jsonError) console.log(`Invalid JSON: ${jsonError}`);
  process.exit(bom || jsonError ? 1 : 0);
}

if (bom) {
  fs.copyFileSync(file, `${file}.bak`);
  fs.writeFileSync(file, body);
  console.log(`Removed BOM from ${file} (backup: ${file}.bak)`);
} else {
  console.log(`No BOM in ${file}, nothing to do.`);
}

if (jsonError) {
  console.log(`Warning: file is not valid JSON: ${jsonError}`);
  process.exit(1);
}
