---
task_id: "20260405_0002_crossplatform_runpy"
created: "2026-04-05T14:00:00Z"
last_updated: "2026-04-05T14:15:00Z"
status: "complete"
current_agent: "nakamura"
---

# Task: Make run.py fully cross-platform (Windows + macOS + Linux)

## User Request
run.py currently downloads Windows-only PostgreSQL binaries and references .exe executables. Make it work on macOS and Linux too.

## Tasks

## In Progress

## Completed
- [x] Rewrite run.py with platform-aware PG download URLs, binary names, extraction, env vars (agent: nakamura)
- [x] Create run.sh for macOS/Linux convenience wrapper (agent: nakamura)
- [x] Verify syntax with ast.parse -- PASS (agent: nakamura)

## Blockers
None

## Key Decisions
- Platform detection via sys.platform + platform.machine()
- pg_bin_path() helper eliminates all hardcoded .exe references
- pg_env() helper sets DYLD_LIBRARY_PATH (macOS) / LD_LIBRARY_PATH (Linux)
- tar.gz extraction for Linux with symlink support and permission preservation
- zip extraction for Windows/macOS with executable permission fix on macOS
- get_native_binding_name() for platform-aware rolldown binding check
- download_postgres() returns the archive Path so extract_postgres() handles both formats
- make_executable() helper for Unix chmod on extracted binaries
