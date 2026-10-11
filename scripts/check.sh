#!/bin/bash
# Runs every check CI runs: markdownlint, shellcheck, Node syntax check, tests.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> markdownlint-cli2"
markdownlint-cli2

echo "==> shellcheck"
mapfile -t shell_files < <(git ls-files --cached --others --exclude-standard '*.sh')
if [ "${#shell_files[@]}" -gt 0 ]; then
  shellcheck "${shell_files[@]}"
fi

echo "==> node --check"
mapfile -t js_files < <(git ls-files --cached --others --exclude-standard '*.mjs')
for file in "${js_files[@]}"; do
  node --check "$file"
done

echo "==> tests"
node --test tests/*.test.mjs

echo "All checks passed."
