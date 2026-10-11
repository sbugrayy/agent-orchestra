#!/bin/bash
# Claude Code bulut oturumlarında lint araçlarını kurar.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

MARKDOWNLINT_VERSION="0.23.3"
SHELLCHECK_PY_VERSION="0.11.0.1"

installed_md="$(markdownlint-cli2 --help 2>&1 | head -n 1 || true)"
if [[ "$installed_md" != *"v${MARKDOWNLINT_VERSION} "* ]]; then
  npm install -g "markdownlint-cli2@${MARKDOWNLINT_VERSION}" --no-fund --no-audit
fi

installed_sc="$(pip3 show shellcheck-py 2>/dev/null || true)"
if [[ "$installed_sc" != *"Version: ${SHELLCHECK_PY_VERSION}"* ]]; then
  pip3 install --quiet --root-user-action=ignore "shellcheck-py==${SHELLCHECK_PY_VERSION}"
fi
