#!/usr/bin/env bash
set -euo pipefail

GATE_NODE="/Users/qilong.lu/.trae-cn/binaries/node/versions/24.14.0/bin/node"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="${PROJECT_ROOT}/apps/web"

if [ ! -f "${GATE_NODE}" ]; then
  echo "ERROR: Gate Node.js not found at ${GATE_NODE}"
  echo "Please install or update the Trae bundled Node.js."
  exit 1
fi

echo "============================================"
echo " Atlax MindDock Web Gate (unified runner) "
echo "============================================"
echo ""
echo "[FINGERPRINT]"
echo "  node:     ${GATE_NODE}"
echo "  execPath: $(${GATE_NODE} -p "process.execPath")"
echo "  platform: $(${GATE_NODE} -p "process.platform")"
echo "  arch:     $(${GATE_NODE} -p "process.arch")"
echo ""

PASS=0
FAIL=0

run_step() {
  local label="$1"
  shift
  echo "--- ${label} ---"
  if "$@"; then
    echo "  PASS"
    PASS=$((PASS + 1))
    return 0
  else
    echo "  FAIL (exit code: $?)"
    FAIL=$((FAIL + 1))
    return 1
  fi
}

export PATH="${GATE_NODE%/*}:${PATH}"

run_step "lint"   pnpm --dir "${WEB_DIR}" lint      2>&1 || true
run_step "typecheck" pnpm --dir "${WEB_DIR}" typecheck 2>&1 || true
run_step "test"   pnpm --dir "${WEB_DIR}" test -- --run 2>&1 || true

echo ""
echo "============================================"
echo " Results: ${PASS} passed, ${FAIL} failed"
if [ "${FAIL}" -gt 0 ]; then
  echo " GATE: FAILED"
  exit 1
else
  echo " GATE: PASSED"
  exit 0
fi
