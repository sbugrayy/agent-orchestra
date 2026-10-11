# Conductor workflow

How the conductor turns a user request into delegated work and checks it.

## Contents

- Deciding who does what
- Writing a good brief
- Calling agy
- Reviewing agy's work
- Using the analyst
- A full example

## Deciding who does what

| Kind of work | Who |
| --- | --- |
| Understanding the request, asking questions, architecture, plans | Conductor |
| Writing or changing code once the files and steps are clear | agy |
| Summarising a large design export, log or document | OpenCode analyst |
| Running builds, linters and tests | Conductor |
| Final review and the decision that it is done | Conductor, then the user on a real device |

Do it yourself when the change is a few lines: writing a brief costs more than
the edit. Delegate when the change is larger but well defined.

## Writing a good brief

The brief is a JSON file in `.orchestra/tasks/`. Keeping it in a file means
the context is never lost in shell quoting, and the brief stays as a record.

- `goal`: the end state, not the steps.
- `context`: decisions agy cannot guess. Name the existing functions, types
  and patterns to reuse.
- `files_to_read` and `files_to_write`: be exact. Anything not in
  `files_to_write` must not change. Always include the report file.
- `steps`: concrete and ordered.
- `acceptance`: checks you will run in the review.
- `rules`: always include "Do not run any terminal commands. Only read and
  write files." agy running commands caused most of the problems in practice.

## Calling agy

```bash
agy -p "Read .orchestra/tasks/<id>.json and carry out that task exactly. Do not run any terminal commands; only read and write files." --model gemini-3.8-flash-high --new-project --mode accept-edits
```

- Run from the project root.
- `--new-project` every time, so agy does not reuse memory of another project.
- `--mode accept-edits` lets it write files without asking.
- Give the command a long timeout (about 10 minutes) or run it in the
  background and wait for it.
- Model names change; check `agy models`.
- Empty output means a blocked permission. Rerun with
  `--output-format stream-json` and look for the tool call that failed.

## Reviewing agy's work

1. `git status --porcelain`: only `files_to_write` may appear. Revert anything
   else with `git checkout -- <file>` and tell agy in the next brief.
2. Read the report, then the full diff (`git diff`). Do not trust the report
   alone; check each claim against the code.
3. Look for: style breaks, data filled in with the wrong meaning, invented
   functions or imports, TODOs left behind.
4. Run the project's lint and tests.
5. Check what tests do not cover. In one real case static analysis was clean,
   all 552 tests passed, the app built, and it would not open, because of a
   start-up function no test ran.
6. Ask the user to try it on a real device when it affects what they see.
7. Commit only after all of this, with a message that says agy wrote it.

## Using the analyst

```bash
opencode run --agent analyst -f exports/landing.html "List the sections of this page in order. For each: purpose, components, texts, colours, fonts. Max 300 words."
```

- Good for HTML exported from Claude Design, Google Stitch, Figma AI, v0,
  Framer AI or Durable AI. These files are huge; a summary keeps your
  context free.
- Ask for a structure you can use directly (lists, tables, max length).
- It cannot write, run commands or browse. If it ever does, stop and tell
  the user.

## A full example

User: "Add a dark mode toggle to the settings page."

1. Conductor reads the settings page and theme code, decides the approach,
   and asks the user one question about where the toggle goes.
2. Conductor writes `.orchestra/tasks/004-dark-mode-toggle.json`:

   ```json
   {
     "id": "004-dark-mode-toggle",
     "goal": "Settings page has a dark mode switch that changes the theme and remembers the choice.",
     "context": "Theme lives in src/theme/ThemeProvider.tsx (useTheme hook, setMode). Settings rows use <SettingsRow> from src/settings/SettingsRow.tsx. Persist with the existing storage helper src/lib/storage.ts.",
     "files_to_read": ["src/theme/ThemeProvider.tsx", "src/settings/SettingsRow.tsx", "src/lib/storage.ts"],
     "files_to_write": ["src/settings/SettingsPage.tsx", ".orchestra/tasks/004-dark-mode-toggle.report.md"],
     "steps": [
       "Add a SettingsRow titled 'Dark mode' with a switch under 'Appearance'.",
       "Switch calls setMode('dark' | 'light') and saves it with storage.set('theme', mode)."
     ],
     "acceptance": ["Switch reflects the current mode on load", "No new dependencies"],
     "rules": [
       "Do not run any terminal commands. Only read and write files.",
       "Follow AGENTS.md.",
       "Write a report to .orchestra/tasks/004-dark-mode-toggle.report.md."
     ]
   }
   ```

3. Conductor runs agy, then reviews: one file changed plus the report, diff
   reads well, lint and tests pass.
4. Conductor checks the theme loads correctly on a cold start (not covered by
   tests) and asks the user to try it on their phone.
