#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
"""drawio2png — instant drawio -> PNG converter.

Usage:
  python3 drawio2png.py <file.drawio>          # single file
  python3 drawio2png.py <directory>            # all .drawio in dir, recursive
  python3 drawio2png.py <path> --parallel      # parallel mode (4 workers)
  python3 drawio2png.py <path> --border 30     # custom border (default 20)
  python3 drawio2png.py --all                  # convert ALL .drawio under script's dir

Output: same folder as source, replacing .drawio with .png.
Exit code: 0 = all success, 1 = at least one failed.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# ---- drawio CLI discovery ----
DRAWIO_CANDIDATES = [
    "/opt/homebrew/bin/drawio",       # macOS Apple Silicon (Homebrew)
    "/usr/local/bin/drawio",          # macOS Intel / Linux Homebrew
    "/usr/bin/drawio",                # Linux package
    "drawio",                         # fallback to PATH
]


def find_drawio() -> str:
    for c in DRAWIO_CANDIDATES:
        if c.startswith("/"):
            if Path(c).is_file():
                return c
        else:
            found = shutil.which(c)
            if found:
                return found
    sys.stderr.write(
        "ERROR: drawio CLI not found. Install via:\n"
        "  macOS:  brew install --cask drawio\n"
        "  Linux:  https://github.com/jgraph/drawio-desktop/releases\n"
    )
    sys.exit(2)


# ---- conversion ----
def convert_one(drawio_path: Path, drawio_bin: str, border: int) -> tuple[Path, bool, str]:
    """Run drawio CLI to export single file. Returns (path, ok, message)."""
    try:
        result = subprocess.run(
            [drawio_bin, "--export", "--format", "png",
             "--border", str(border), str(drawio_path)],
            capture_output=True, text=True, timeout=120,
        )
        ok = result.returncode == 0 and Path(str(drawio_path).replace(".drawio", ".png")).exists()
        msg = result.stdout.strip().splitlines()[-1] if result.stdout else result.stderr.strip()
        return (drawio_path, ok, msg or ("OK" if ok else "no output"))
    except subprocess.TimeoutExpired:
        return (drawio_path, False, "TIMEOUT after 120s")
    except Exception as e:
        return (drawio_path, False, f"EXCEPTION: {e}")


def collect_targets(path: Path) -> list[Path]:
    """Return list of .drawio files. If path is a file, returns [path]; if dir, recurses."""
    if path.is_file():
        if path.suffix != ".drawio":
            sys.stderr.write(f"ERROR: {path} is not a .drawio file\n")
            sys.exit(2)
        return [path]
    if path.is_dir():
        return sorted(path.rglob("*.drawio"))
    sys.stderr.write(f"ERROR: {path} does not exist\n")
    sys.exit(2)


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Convert drawio file(s) to PNG using the drawio CLI.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    ap.add_argument("path", nargs="?", help="File .drawio atau folder (rekursif).")
    ap.add_argument("--all", action="store_true",
                    help="Convert SEMUA .drawio di bawah folder script (diagram/ai/).")
    ap.add_argument("--parallel", action="store_true",
                    help="Convert paralel (4 workers). Default: sekuensial.")
    ap.add_argument("--workers", type=int, default=4, help="Jumlah parallel workers (default 4).")
    ap.add_argument("--border", type=int, default=20, help="PNG border px (default 20).")
    args = ap.parse_args()

    if args.all:
        target_path = Path(__file__).resolve().parent
    elif args.path:
        target_path = Path(args.path).resolve()
    else:
        ap.print_help()
        return 2

    drawio_bin = find_drawio()
    targets = collect_targets(target_path)

    if not targets:
        sys.stderr.write(f"No .drawio files found under {target_path}\n")
        return 1

    print(f"[drawio2png] CLI: {drawio_bin}")
    print(f"[drawio2png] Border: {args.border}px")
    print(f"[drawio2png] Targets: {len(targets)} file(s)")
    print(f"[drawio2png] Mode: {'parallel x' + str(args.workers) if args.parallel else 'sequential'}")
    print("-" * 60)

    results: list[tuple[Path, bool, str]] = []
    if args.parallel:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futs = {pool.submit(convert_one, t, drawio_bin, args.border): t for t in targets}
            for fut in as_completed(futs):
                results.append(fut.result())
                p, ok, msg = results[-1]
                tag = "OK " if ok else "FAIL"
                print(f"  [{tag}] {p.name}")
    else:
        for t in targets:
            p, ok, msg = convert_one(t, drawio_bin, args.border)
            results.append((p, ok, msg))
            tag = "OK " if ok else "FAIL"
            print(f"  [{tag}] {p.relative_to(target_path) if target_path.is_dir() else p.name}")
            if not ok:
                print(f"         -> {msg}")

    n_ok = sum(1 for _, ok, _ in results if ok)
    n_fail = len(results) - n_ok
    print("-" * 60)
    print(f"[drawio2png] Done: {n_ok} ok, {n_fail} failed.")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
