---
task_id: "20260405_0002_crossplatform_runpy"
agent: "nakamura"
phase: "implementation"
status: "COMPLETE"
timestamp: "2026-04-05T14:15:00Z"
---

# Context: Nakamura - Cross-platform run.py

## Work Done

Rewrote run.py from Windows-only to full cross-platform support (Windows + macOS + Linux).

### Changes to run.py (complete rewrite)

**New platform helpers (5 functions):**
- `get_pg_download_info()` - Returns correct EDB download URL based on sys.platform/platform.machine()
- `pg_bin_path(name)` - Appends .exe on Windows, bare name on Unix
- `pg_env()` - Sets DYLD_LIBRARY_PATH (macOS) or LD_LIBRARY_PATH (Linux)
- `get_native_binding_name()` - Maps platform to rolldown binding dir name
- `make_executable(path)` - chmod +x on Unix platforms

**Modified functions:**
- `download_postgres()` - Uses get_pg_download_info(), returns archive Path
- `extract_postgres(archive_file)` - Handles both .zip and .tar.gz, strips pgsql/ prefix, preserves permissions and symlinks on Linux
- `pg_installed()` - Uses pg_bin_path() instead of hardcoded .exe
- `init_postgres()` - Uses pg_bin_path() + pg_env()
- `start_postgres()` - Uses pg_bin_path() + pg_env()
- `stop_postgres()` - Uses pg_bin_path() + pg_env()
- `create_database()` - Uses pg_bin_path() + pg_env()
- `reset_database()` - Uses pg_bin_path() + pg_env()
- `check_native_bindings()` - Uses get_native_binding_name()
- `run()` - Auto-injects pg_env() when running PG binaries
- `main()` - Shows platform/arch in banner

**Removed globals:**
- PG_ZIP_URL (replaced by get_pg_download_info())
- PG_ZIP_FILE (replaced by local variable in download_postgres())

**New globals:**
- PLATFORM = sys.platform
- ARCH = platform.machine()

**New imports:**
- os, platform, tarfile, stat

### New file: run.sh
Bash convenience wrapper for macOS/Linux (equivalent of run.ps1 for Windows).
Finds python3/python, forwards all args to run.py.

## Verification
- `python -c "import ast; ast.parse(open('run.py').read())"` -- PASS
- Zero hardcoded .exe references (only conditional in pg_bin_path())
- Zero hardcoded Windows download URLs outside platform branch
- All PG subprocess calls pass pg_env() for library path resolution

## Files Changed
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\run.py (complete rewrite, 487 lines)
- D:\__CODING\05-MyProjects\__IRENE\dian-shi-dashboard\run.sh (new, 28 lines)
