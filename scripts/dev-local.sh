#!/bin/sh
set -eu
project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"
task_node=$(command -v node || true)
if [ -z "$task_node" ] || ! "$task_node" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)' 2>/dev/null; then
  task_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$task_node" ]; then
  echo 'Install Node 24 and run npm ci, then npm run dev.' >&2
  exit 1
fi
if [ ! -f node_modules/vite/bin/vite.js ]; then
  echo 'Dependencies missing. With Node 24 active, run npm ci first.' >&2
  exit 1
fi
exec "$task_node" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
