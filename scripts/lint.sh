#!/bin/bash
# Tüm Markdown ve shell dosyalarını lint eder. CI ile aynı kontroller.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> markdownlint-cli2"
markdownlint-cli2

echo "==> shellcheck"
mapfile -t shell_files < <(git ls-files --cached --others --exclude-standard '*.sh')
if [ "${#shell_files[@]}" -gt 0 ]; then
  shellcheck "${shell_files[@]}"
fi

echo "Tüm kontroller geçti."
