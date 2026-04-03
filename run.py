"""
SHI Dashboard - Build & Run Script
Installs dependencies, sets up database, and starts backend + frontend.
"""

import subprocess
import sys
import os
import signal
import shutil
import time
from pathlib import Path

ROOT = Path(__file__).parent
SERVER_DIR = ROOT / "server"
FRONTEND_DIR = ROOT / "frontend"
ENV_FILE = SERVER_DIR / ".env"
ENV_EXAMPLE = SERVER_DIR / ".env.example"


def run(cmd: list[str], cwd: Path, check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    print(f"\n>>> {' '.join(cmd)}  (in {cwd.name}/)")
    return subprocess.run(cmd, cwd=cwd, check=check, **kwargs)


def find_npm() -> str:
    npm = shutil.which("npm")
    if not npm:
        print("[ERROR] npm not found. Install Node.js first.")
        sys.exit(1)
    return npm


def ensure_env():
    if ENV_FILE.exists():
        print("[OK] .env file exists")
        return
    if ENV_EXAMPLE.exists():
        shutil.copy(ENV_EXAMPLE, ENV_FILE)
        print("[CREATED] .env copied from .env.example -- edit server/.env with your DB credentials")
    else:
        print("[WARNING] No .env or .env.example found in server/")


def install_deps(npm: str):
    print("\n=== Installing dependencies ===")
    server_modules = SERVER_DIR / "node_modules"
    frontend_modules = FRONTEND_DIR / "node_modules"

    if server_modules.exists() and frontend_modules.exists():
        print("[OK] node_modules exist in both directories (use --clean to reinstall)")
        return

    procs = []
    if not server_modules.exists():
        p = subprocess.Popen([npm, "install"], cwd=SERVER_DIR)
        procs.append(("server", p))
    if not frontend_modules.exists():
        p = subprocess.Popen([npm, "install"], cwd=FRONTEND_DIR)
        procs.append(("frontend", p))

    for name, p in procs:
        code = p.wait()
        if code != 0:
            print(f"[ERROR] npm install failed in {name}/")
            sys.exit(1)
        print(f"[OK] {name} dependencies installed")


def setup_db(npm: str, seed: bool = False):
    print("\n=== Database setup ===")
    cmd = [npm, "run", "db:seed"] if seed else [npm, "run", "db:setup"]
    result = run(cmd, cwd=SERVER_DIR, check=False)
    if result.returncode != 0:
        print("[WARNING] Database setup failed -- check your .env DB credentials")
        print("          You can run manually: cd server && npm run db:setup")
    else:
        print("[OK] Database ready")


def ensure_uploads():
    uploads = SERVER_DIR / "uploads"
    uploads.mkdir(exist_ok=True)


def start_services(npm: str):
    print("\n=== Starting services ===")
    print("Backend:  http://localhost:3000")
    print("Frontend: http://localhost:5173")
    print("Press Ctrl+C to stop both\n")

    backend = subprocess.Popen(
        [npm, "run", "dev"],
        cwd=SERVER_DIR,
    )
    # Small delay so backend port binds first
    time.sleep(1)
    frontend = subprocess.Popen(
        [npm, "run", "dev"],
        cwd=FRONTEND_DIR,
    )

    def shutdown(signum=None, frame=None):
        print("\n\nShutting down...")
        for name, proc in [("backend", backend), ("frontend", frontend)]:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                print(f"  [{name}] stopped")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Wait for either to exit
    while True:
        if backend.poll() is not None:
            print(f"[WARNING] Backend exited with code {backend.returncode}")
            shutdown()
        if frontend.poll() is not None:
            print(f"[WARNING] Frontend exited with code {frontend.returncode}")
            shutdown()
        time.sleep(1)


def main():
    args = sys.argv[1:]
    clean = "--clean" in args
    seed = "--seed" in args
    db_only = "--db-only" in args
    skip_db = "--skip-db" in args
    install_only = "--install" in args

    print("=" * 50)
    print("  SHI Dashboard - Build & Run")
    print("=" * 50)

    npm = find_npm()
    ensure_env()

    if clean:
        print("\n=== Clean install ===")
        for d in [SERVER_DIR / "node_modules", FRONTEND_DIR / "node_modules"]:
            if d.exists():
                shutil.rmtree(d)
                print(f"  Removed {d.name} from {d.parent.name}/")

    install_deps(npm)

    if install_only:
        print("\n[DONE] Dependencies installed.")
        return

    ensure_uploads()

    if not skip_db:
        setup_db(npm, seed=seed)

    if db_only:
        print("\n[DONE] Database setup complete.")
        return

    start_services(npm)


if __name__ == "__main__":
    main()
