"""
SHI Dashboard - Build & Run Script
Starts PostgreSQL (Docker), installs deps (bun), sets up DB, runs backend + frontend.
"""

import subprocess
import sys
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


def find_bin(name: str, url: str) -> str:
    path = shutil.which(name)
    if not path:
        print(f"[ERROR] {name} not found. Install: {url}")
        sys.exit(1)
    return path


def ensure_env():
    if ENV_FILE.exists():
        return
    if ENV_EXAMPLE.exists():
        shutil.copy(ENV_EXAMPLE, ENV_FILE)
        print("[CREATED] .env from .env.example")


def start_postgres(docker: str):
    print("\n=== PostgreSQL ===")

    # Check if container already running
    result = subprocess.run(
        [docker, "compose", "ps", "--status", "running", "--format", "{{.Name}}"],
        cwd=ROOT, capture_output=True, text=True
    )
    if "shi-postgres" in result.stdout:
        print("[OK] PostgreSQL already running")
        return

    # Start container
    print("  Starting PostgreSQL container...")
    run([docker, "compose", "up", "-d", "--wait"], cwd=ROOT, check=False)

    # Wait for healthy
    for i in range(15):
        result = subprocess.run(
            [docker, "compose", "ps", "--status", "running", "--format", "{{.Name}}"],
            cwd=ROOT, capture_output=True, text=True
        )
        if "shi-postgres" in result.stdout:
            print("[OK] PostgreSQL ready")
            return
        time.sleep(1)

    print("[ERROR] PostgreSQL failed to start. Check: docker compose logs postgres")
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

    bun = find_bin("bun", "https://bun.sh")
    docker = find_bin("docker", "https://docker.com")
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

    # 1. PostgreSQL
    if "--no-docker" not in args:
        start_postgres(docker)

    # 2. Dependencies
    install_deps(bun)

    if "--install" in args:
        return

    # 3. Uploads dir
    (SERVER_DIR / "uploads").mkdir(exist_ok=True)

    # 4. Database schema + seed
    if "--skip-db" not in args:
        setup_db(bun, seed="--seed" in args)

    if "--db-only" in args:
        return

    # 5. Run
    start_services(bun)


if __name__ == "__main__":
    main()
