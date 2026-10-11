# Troubleshooting

## agy refuses everything, whatever the settings say

Most likely `~/.gemini/antigravity-cli/settings.json` starts with a BOM, so agy
ignores it and uses defaults. Non-interactive mode gives no warning.

- Check: `node <skill-dir>/scripts/fix-bom.mjs --check`
- Fix: `node <skill-dir>/scripts/fix-bom.mjs`
- Confirm: run `agy` with no arguments. A broken file shows "Settings Error".
- Cause: Windows PowerShell `Set-Content` / `Out-File` with UTF-8. Write the
  file with Node.js or an editor that saves "UTF-8" without BOM.

## agy returns an empty answer

Not the model's fault. In `-p` mode agy cannot ask for permission, so a
blocked tool ends the run silently. Rerun with `--output-format stream-json`
(check the exact flag with `agy --help`) and find the tool call that was
refused. Then either allow it in the settings or change the brief so it is
not needed. Usually the cause is agy trying to run a terminal command; the
brief must forbid that.

## agy talks about another project's plan or phases

agy keeps a persistent project memory that can lock onto another project.
Always pass `--new-project`.

## agy uses a huge number of tokens

It is exploring outside the project. Run it from the project root, list exact
files in the brief, and limit its allowed directories in the settings if your
agy version supports it. In one case this cut a small task from 138k to 18k
tokens.

## `agy` is not found after installing

Open a new terminal. On macOS/Linux make sure `~/.local/bin` is on `PATH`.

## `agy` sign-in does not work from a script

Sign-in only works interactively. The user runs `agy` with no arguments once.

## NVIDIA model returns 410 or never answers

The model was retired, or it is overloaded. Pick another from
`opencode models nvidia` and test it with a short prompt and a timeout. Set the
winner as `model:` in `.opencode/agent/analyst.md`.

## The analyst wrote a file or ran a command

Its permissions are not applied. Check:

- The file is at `.opencode/agent/analyst.md` in the project root.
- `opencode agent list` shows `analyst` with `"*"` denied and only read,
  glob, grep and list allowed.
- You called it with `--agent analyst`.

## Claude Code asks for permission on every agy or opencode call

The allow rules are in `.claude/settings.json` but not loaded. Restart Claude
Code. Check the call starts exactly with `agy -p` or `opencode run`; the
rules match on the start of the command.

## Tests pass but the app does not work

Tests only prove what they run. Check start-up code, configuration and
wiring by hand, and try the app on a real device.
