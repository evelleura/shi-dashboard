"""
SHI Dashboard - Build & Run Script
Installs deps (bun), sets up DB, runs backend + frontend.
Expects PostgreSQL to be running (see docker-compose.yml).
"""

import subprocess
import sys
import socket
import signal
import shutil
import time
from pathlib import Path

ROOT = Path(__file__).parent
SERVER_DIR = ROOT / "server"
FRONTEND_DIR = ROOT / "frontend"
ENV_FILE = SERVER_DIR / ".env"
ENV_EXAMPLE = SERVER_DIR / ".env.example"


def run(cmd: list[str], cwd: Path = ROOT, check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    print(f"  >>> {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=cwd, check=check, **kwargs)


def find_bun() -> str:
    bun = shutil.which("bun")
    if not bun:
        print("[ERROR] bun not found. Install: https://bun.sh")
        sys.exit(1)
    return bun


def ensure_env():
    if ENV_FILE.exists():
        return
    if ENV_EXAMPLE.exists():
        shutil.copy(ENV_EXAMPLE, ENV_FILE)
        print("[CREATED] .env from .env.example")


def read_env_port() -> int:
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith("DB_PORT="):
                return int(line.split("=", 1)[1].strip().strip('"'))
    return 5432


def check_postgres() -> bool:
    port = read_env_port()
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=2):
            return True
    except (ConnectionRefusedError, OSError):
        return False


def ensure_postgres():
    print("\n=== PostgreSQL ===")
    if check_postgres():
        print("[OK] PostgreSQL reachable")
        return

    # Try auto-starting via docker compose if available
    docker = shutil.which("docker")
    if docker:
        print("  PostgreSQL not running. Starting via docker compose...")
        result = run([docker, "compose", "up", "-d", "--wait"], cwd=ROOT, check=False)
        if result.returncode == 0 and check_postgres():
            print("[OK] PostgreSQL started via Docker")
            return

    print("[ERROR] PostgreSQL not reachable on port", read_env_port())
    print("  Option 1: docker compose up -d")
    print("  Option 2: Install PostgreSQL and start the service")
    print("  Option 3: run.py --skip-db  (start app without DB)")
    sys.exit(1)


def install_deps(bun: str):
    print("\n=== Dependencies ===")
    server_ok = (SERVER_DIR / "node_modules").exists()
    frontend_ok = (FRONTEND_DIR / "node_modules").exists()

    if server_ok and frontend_ok:
        print("[OK] Already installed (use --clean to reinstall)")
        return

    procs = []
    if not server_ok:
        procs.append(("server", subprocess.Popen([bun, "install"], cwd=SERVER_DIR)))
    if not frontend_ok:
        procs.append(("frontend", subprocess.Popen([bun, "install"], cwd=FRONTEND_DIR)))

    for name, p in procs:
        if p.wait() != 0:
            print(f"[ERROR] bun install failed in {name}/")
            sys.exit(1)
        print(f"  [OK] {name}")


def setup_db(bun: str, seed: bool = False):
    print("\n=== Database ===")
    cmd = [bun, "run", "db:seed"] if seed else [bun, "run", "db:setup"]
    result = run(cmd, cwd=SERVER_DIR, check=False)
    if result.returncode != 0:
        print("[ERROR] Database setup failed")
        sys.exit(1)
    print("[OK] Database ready")


def start_services(bun: str):
    print("\n=== Services ===")
    print("  Backend:  http://localhost:3000")
    print("  Frontend: http://localhost:5173")
    print("  Ctrl+C to stop\n")

    backend = subprocess.Popen([bun, "run", "dev"], cwd=SERVER_DIR)
    time.sleep(1)
    frontend = subprocess.Popen([bun, "run", "dev"], cwd=FRONTEND_DIR)

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

    while True:
        if backend.poll() is not None:
            print(f"[WARNING] Backend exited ({backend.returncode})")
            shutdown()
        if frontend.poll() is not None:
            print(f"[WARNING] Frontend exited ({frontend.returncode})")
            shutdown()
        time.sleep(1)


def main():
    args = sys.argv[1:]

    print("=" * 50)
    print("  SHI Dashboard")
    print("=" * 50)

    bun = find_bun()
    ensure_env()

    if "--clean" in args:
        print("\n=== Clean ===")
        for d in [SERVER_DIR / "node_modules", FRONTEND_DIR / "node_modules"]:
            if d.exists():
                shutil.rmtree(d)
                print(f"  Removed {d.parent.name}/{d.name}")
        for f in [SERVER_DIR / "package-lock.json", FRONTEND_DIR / "package-lock.json"]:
            if f.exists():
                f.unlink()

    install_deps(bun)

    if "--install" in args:
        return

    (SERVER_DIR / "uploads").mkdir(exist_ok=True)

    if "--skip-db" not in args:
        ensure_postgres()
        setup_db(bun, seed="--seed" in args)

    if "--db-only" in args:
        return

    start_services(bun)


if __name__ == "__main__":
    main()
