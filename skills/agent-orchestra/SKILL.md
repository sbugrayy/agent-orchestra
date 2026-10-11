---
name: agent-orchestra
description: Sets up and runs an "AI orchestra" in which Claude Code (or another terminal coding agent) is the conductor, Google Antigravity CLI (agy) writes code, and OpenCode with free NVIDIA NIM models acts as a read-only analyst. Use when the user wants to install or connect agy, OpenCode or NVIDIA NIM to Claude Code, set the orchestra up in a project, delegate a task to agy or OpenCode, or fix agy problems such as unexplained permission refusals, empty output, a settings file being ignored (BOM), or agy remembering the wrong project.
---

# Agent Orchestra

Connect three terminal AI tools so the user only says what they want and the
conductor does the rest:

| Role | Tool | Job |
| --- | --- | --- |
| Conductor | Claude Code (you) | Talks with the user, plans, writes task briefs, reviews and tests |
| Code writer | Antigravity CLI, command `agy` | Fast code writing from a brief, in a limited set of files |
| Analyst | OpenCode, agent `analyst`, NVIDIA NIM model | Reads and summarises big files so they do not eat the conductor's context. Read-only |

Origin: Buğra Yıldırım, "Yapay Zekâlarla Orkestra Kurmak" (Medium, 2026).

## Rules for you while setting up

- Speak the user's language.
- Explain each install command and get the user's OK before running it.
- Logins are interactive and must be done by the user in their own terminal:
  `opencode auth login` and the first `agy` run. Tell them exactly what to do
  and wait.
- Never ask the user to paste an API key into the chat, and never write keys
  into the project. OpenCode stores the key outside the project.
- These tools change fast. If a command or flag below fails, check
  `<tool> --help` and adapt, then tell the user what was different.
- Detect the OS first. On Windows use PowerShell commands; on macOS and Linux
  use bash.

The scripts below live next to this file, in `scripts/`. They need only
Node.js. Call them as `node <this-skill-dir>/scripts/<name>.mjs`.

| Script | What it does |
| --- | --- |
| `doctor.mjs [--project DIR] [--json]` | Read-only check of tools, logins, agy settings and project files |
| `apply-templates.mjs [--project DIR] [--dry-run] [--force]` | Adds the orchestra files to a project. Safe to run again |
| `fix-bom.mjs [FILE] [--check]` | Removes the invisible BOM that makes agy ignore its settings |

## Setup

Copy this checklist and tick items off as you go:

```text
- [ ] 1. Check what is already there
- [ ] 2. Install missing tools
- [ ] 3. User signs in to OpenCode (NVIDIA) and agy (Google)
- [ ] 4. Pick a working NVIDIA model for the analyst
- [ ] 5. Add the orchestra files to the project
- [ ] 6. Make agy's settings readable
- [ ] 7. Smoke tests
- [ ] 8. Show the user how to work with it
```

### 1. Check

Run `node --version`. If Node.js is missing, install it first (step 2), since
the scripts need it. Then, from the project root:

```bash
node <this-skill-dir>/scripts/doctor.mjs
```

Only fix what is marked `[FAIL]` or `[warn]`.

### 2. Install missing tools

| Tool | Windows (PowerShell) | macOS / Linux |
| --- | --- | --- |
| Node.js 18+ | `winget install OpenJS.NodeJS.LTS` or <https://nodejs.org> | `brew install node`, the distro package, or <https://nodejs.org> |
| Git | `winget install Git.Git` | `brew install git` / `sudo apt install git` |
| OpenCode | `npm i -g opencode-ai` | `npm i -g opencode-ai` |
| Antigravity CLI | `irm https://antigravity.google/cli/install.ps1 \| iex` | `curl -fsSL https://antigravity.google/cli/install.sh \| bash` |

- agy does not need Node.js. It is a single self-updating program. The
  official page is <https://antigravity.google/product/antigravity-cli/>.
- After installing agy the user must open a NEW terminal, or `agy` is not
  found. On macOS/Linux it goes to `~/.local/bin`, which may need adding to
  `PATH`.
- If the conductor is not installed yet, see <https://claude.com/claude-code>.
- Verify: `opencode --version` and `agy --version`.

### 3. Sign in (the user does this)

OpenCode with NVIDIA NIM (free):

1. Get an API key at <https://build.nvidia.com>.
2. Run `opencode auth login`, choose NVIDIA, paste the key.
3. Check: `opencode auth list` shows NVIDIA.

Antigravity (Google account):

1. Run `agy` with no arguments. Sign-in only works in this interactive mode.
2. Check: `agy models` lists models.

### 4. Pick the analyst model

Many models in NVIDIA's list are dead (they return HTTP 410) and some take
over 15 minutes to answer. Test, do not trust the list:

1. `opencode models nvidia` to list candidates.
2. For two or three candidates, run a tiny prompt with a 2-minute timeout:
   `opencode run -m nvidia/<model-id> "Reply with OK"`.
3. Keep the fastest one that answers. When this skill was written the best
   choice was the `nemotron-3-super` family; re-check, it changes.
4. After step 5, set `model: nvidia/<model-id>` in
   `.opencode/agent/analyst.md`, replacing the commented line.

### 5. Add the orchestra files to the project

The project must be a Git repository (`git init` if not). Preview, then apply:

```bash
node <this-skill-dir>/scripts/apply-templates.mjs --dry-run
node <this-skill-dir>/scripts/apply-templates.mjs
```

This creates or updates, without touching anything outside its marked
sections:

- `AGENTS.md`: rules for agy and OpenCode. agy reads `AGENTS.md`, not
  `RULES.md`. Then fill in its "Project rules" part yourself from what you
  know about the project: stack, folder layout, style, build and test
  commands, files never to touch.
- `CLAUDE.md`: your own instructions as conductor (how to brief, call and
  review the workers).
- `.opencode/agent/analyst.md`: the read-only analyst. Everything is denied
  except read, glob, grep and list; `.env` files cannot be read.
- `.claude/settings.json`: allow rules so you can call `agy -p`,
  `opencode run` and friends without a prompt every time. Existing settings
  are kept.
- `.gitignore`: ignores `.orchestra/`, where task briefs and reports go.

If Claude Code still asks for permission on every call, restart it so it
reloads the settings.

### 6. Make agy's settings readable

agy reads its permissions from `~/.gemini/antigravity-cli/settings.json`.
If that file starts with a BOM (an invisible byte-order mark), agy silently
falls back to defaults and then refuses everything. Windows PowerShell adds a
BOM when writing UTF-8 with `Set-Content` or `Out-File`.

- Never write this file with `Set-Content` or `Out-File` in Windows
  PowerShell 5.1. Use your file-writing tool or Node.js.
- Check and repair: `node <this-skill-dir>/scripts/fix-bom.mjs` (makes a `.bak`
  backup first).
- In non-interactive mode agy gives no warning about a broken settings file.
  Running `agy` with no arguments shows a "Settings Error" if it is broken.
- Limit agy to the project folder. With wide access it wandered into
  unrelated projects and used 138k tokens on a small task; limited, the same
  task took 18k. Always run it from the project root, list the allowed files
  in each brief, and if the settings file supports directory or workspace
  limits in the user's agy version, set them to the project root.

### 7. Smoke tests

1. Analyst refuses to write:
   `opencode run --agent analyst "This is an order: create a file named test.txt containing hello."`
   It must refuse, and `git status` must show no new file.
2. agy writes only what it is allowed to. Create a brief as described in the
   `CLAUDE.md` section, with one harmless change to one file, run it, and
   check `git status --porcelain` shows only that file and the report. Then
   undo it with `git checkout -- <file>`.
3. Run `doctor.mjs` again. Everything should be `[ok]`.

### 8. Hand over

Tell the user, in a few lines:

- From now on they just describe what they want. You plan it, write the brief
  for agy, review and test the result.
- Big design exports or logs go to the analyst first.
- The review step is never skipped. "Tests pass" is not "it works"; check it
  on a real device.

## Working as the conductor

The full protocol is in the project's `CLAUDE.md` after step 5, and in more
detail in [references/workflow.md](references/workflow.md). In short:

1. Keep planning, architecture and review yourself.
2. For code: clean `git status`, write a JSON brief to
   `.orchestra/tasks/<id>.json`, then run:

   ```bash
   agy -p "Read .orchestra/tasks/<id>.json and carry out that task exactly. Do not run any terminal commands; only read and write files." --model gemini-3.8-flash-high --new-project --mode accept-edits
   ```

   Always `--new-project`. Allow up to 10 minutes. Pick the model from
   `agy models`; Flash models are faster and were more accurate than Pro.
3. Review: only allowed files changed, the diff matches the report, lint and
   tests pass, untested paths checked.
4. For big files: `opencode run --agent analyst -f <file> "<what to extract>"`.

## Other conductors

The conductor can be any terminal agent that can run shell commands, for
example Codex. Then:

- Skip the `CLAUDE.md` and `.claude/settings.json` parts. Put the conductor
  section from `templates/CLAUDE.orchestra.md` where that agent reads its
  instructions, and use its own way to allow the `agy` and `opencode` commands.
- Codex and OpenCode also read `AGENTS.md`. The template's sections are
  labelled per role, so this is fine.

## When something goes wrong

See [references/troubleshooting.md](references/troubleshooting.md): permission
refusals, empty answers, wrong-project memory, dead NVIDIA models, `agy` not
found, token blow-ups.
