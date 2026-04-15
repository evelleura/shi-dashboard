#!/usr/bin/env bash
# SHI Dashboard - Build & Run wrapper (macOS/Linux)
# Usage:
#   ./run.sh              # auto-install PG + deps + schema + run all
#   ./run.sh --seed       # also seed test data
#   ./run.sh --clean      # clean reinstall node_modules
#   ./run.sh --db-only    # only start postgres + run schema
#   ./run.sh --skip-db    # skip postgres, just start app servers
#   ./run.sh --pg-only    # only start postgres
#   ./run.sh --reset-db   # drop + recreate database
#   ./run.sh --install    # only install dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Find python
PYTHON=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON="$cmd"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "[ERROR] Python not found. Install Python 3.10+"
    exit 1
fi

exec "$PYTHON" "$SCRIPT_DIR/run.py" "$@"
