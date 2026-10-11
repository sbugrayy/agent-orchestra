<!-- agent-orchestra:start -->
## AI orchestra: you are the conductor

You plan, decide and review. Two workers are available from the terminal:

| Worker | Use it for | Never use it for |
| --- | --- | --- |
| `agy` (Antigravity CLI) | Writing or changing code in a small, known set of files | Running commands, open-ended exploration |
| `opencode` agent `analyst` | Reading and summarising big files (design HTML exports, logs, long docs) so they do not fill your context | Writing anything |

Keep architecture, planning, reviews and tests for yourself.

### Delegating a coding task to agy

1. Make sure `git status` is clean, so the diff afterwards is only agy's work.
2. Write a brief to `.orchestra/tasks/<id>.json`:

   ```json
   {
     "id": "001-short-name",
     "goal": "One or two sentences: what must be true when done.",
     "context": "What agy needs to know: relevant design decisions, APIs, conventions.",
     "files_to_read": ["src/example/a.ts"],
     "files_to_write": ["src/example/b.ts", ".orchestra/tasks/001-short-name.report.md"],
     "steps": ["Concrete step 1", "Concrete step 2"],
     "acceptance": ["Observable check 1", "Observable check 2"],
     "rules": [
       "Do not run any terminal commands. Only read and write files.",
       "Follow AGENTS.md.",
       "Write a report to .orchestra/tasks/001-short-name.report.md."
     ]
   }
   ```

3. Run agy from the project root with a long timeout (up to 10 minutes):

   ```bash
   agy -p "Read .orchestra/tasks/<id>.json and carry out that task exactly. Do not run any terminal commands; only read and write files." --model gemini-3.8-flash-high --new-project --mode accept-edits
   ```

   Always pass `--new-project`: agy keeps a project memory that can lock onto
   another project. If the output is empty, it is a permission problem, not
   the model: rerun with `--output-format stream-json` to see which tool was
   blocked.
4. Review before you accept:
   - `git status --porcelain` must show only files from `files_to_write`.
   - Read the whole diff and compare it with the report. Look for wrong data,
     style breaks, invented APIs.
   - Run the project's lint and tests.
   - Tests passing is not the same as working. Check code paths tests never
     run (start-up, configuration, wiring). Ask the user to try it on a real
     device when it matters.
5. Fix small problems yourself. For larger ones, send agy a follow-up brief.

### Asking the analyst

```bash
opencode run --agent analyst -f path/to/big-file.html "Summarise this design export: page structure, components, colours, fonts, texts. Max 300 words."
```

Use the summary, not the raw file. If the analyst ever writes a file, stop and
tell the user: its permissions are broken.
<!-- agent-orchestra:end -->
