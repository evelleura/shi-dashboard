#!/usr/bin/env bash
# Orchestrator helper: send a prompt to the persistent Gemini session.
# Usage:
#   ./gemini_ask.sh init       # First call: feed briefing.md
#   ./gemini_ask.sh "<task>"   # Subsequent: resume session, append <task>
#   ./gemini_ask.sh -f file.md # Subsequent: resume, append contents of file
#
# Session ID is pinned so chain context is guaranteed across calls.

set -euo pipefail

SESSION_ID="ta-dian-bab5-final-orch"
HERE="$(cd "$(dirname "$0")" && pwd)"
BRIEFING="$HERE/gemini_briefing.md"
LOG_DIR="$HERE/gemini_log"
mkdir -p "$LOG_DIR"

TS="$(date +%Y%m%d-%H%M%S)"

if [[ "${1:-}" == "init" ]]; then
    [[ -f "$BRIEFING" ]] || { echo "Briefing not found: $BRIEFING" >&2; exit 1; }
    if gemini --list-sessions 2>/dev/null | grep -q "\[$SESSION_ID\]"; then
        echo "Session already exists. To re-init, delete it first." >&2
        echo "Run: gemini --list-sessions  to find the index, then" >&2
        echo "     gemini --delete-session <N>" >&2
        exit 2
    fi
    echo "[INIT] Sending briefing as initial prompt..."
    OUT="$LOG_DIR/${TS}-init.out"
    gemini --session-id "$SESSION_ID" -p "$(cat "$BRIEFING")" 2>&1 | tee "$OUT"
    echo
    echo "[INIT] Logged to $OUT"
    exit 0
fi

# Subsequent turn: collect prompt from args or stdin or -f
if [[ "${1:-}" == "-f" && -n "${2:-}" ]]; then
    PROMPT="$(cat "$2")"
elif [[ -n "${1:-}" ]]; then
    PROMPT="$*"
else
    PROMPT="$(cat)"  # read stdin
fi

if [[ -z "${PROMPT// }" ]]; then
    echo "Empty prompt. Aborting." >&2
    exit 3
fi

OUT="$LOG_DIR/${TS}-turn.out"
echo "[ASK] Resuming session: $SESSION_ID"
echo "----- PROMPT -----"
echo "$PROMPT"
echo "----- RESPONSE -----"
gemini --resume "$SESSION_ID" -p "$PROMPT" 2>&1 | tee "$OUT"
echo
echo "[ASK] Logged to $OUT"
