"""
SHI Dashboard - Build & Run Script
Auto-installs PostgreSQL (portable), installs deps (bun), sets up DB, runs everything.
"""

import subprocess
import sys
import socket
import signal
import shutil
import time
import zipfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
SERVER_DIR = ROOT / "server"
FRONTEND_DIR = ROOT / "frontend"
ENV_FILE = SERVER_DIR / ".env"
ENV_EXAMPLE = SERVER_DIR / ".env.example"
PG_DIR = ROOT / "postgres"
PG_BIN = PG_DIR / "bin"
PG_DATA = PG_DIR / "data"
PG_LOG = PG_DIR / "log.txt"

PG_VERSION = "17.5-1"
PG_ZIP_URL = f"https://get.enterprisedb.com/postgresql/postgresql-{PG_VERSION}-windows-x64-binaries.zip"
PG_ZIP_FILE = ROOT / "postgres-download.zip"


# -- Helpers ------------------------------------------------------------------

def run(cmd: list[str], cwd: Path = ROOT, check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    print(f"  >>> {' '.join(str(c) for c in cmd)}")
    return subprocess.run(cmd, cwd=cwd, check=check, **kwargs)


def find_bun() -> str:
    bun = shutil.which("bun")
    if not bun:
        print("[ERROR] bun not found. Install: https://bun.sh")
        sys.exit(1)
    return bun


def read_env() -> dict[str, str]:
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"')
    return env


def ensure_env():
    if ENV_FILE.exists():
        return
    if ENV_EXAMPLE.exists():
        shutil.copy(ENV_EXAMPLE, ENV_FILE)
        print("[CREATED] .env from .env.example")


# -- PostgreSQL ---------------------------------------------------------------

def pg_ready() -> bool:
    env = read_env()
    port = int(env.get("DB_PORT", "5432"))
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=2):
            return True
    except (ConnectionRefusedError, OSError):
        return False


def pg_installed() -> bool:
    return (PG_BIN / "pg_ctl.exe").exists()


def download_postgres():
    print(f"  Downloading PostgreSQL {PG_VERSION} (~300MB)...")

    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 // total_size)
            mb = downloaded // (1024 * 1024)
            total_mb = total_size // (1024 * 1024)
            print(f"\r  [{pct:3d}%] {mb}/{total_mb} MB", end="", flush=True)

    urllib.request.urlretrieve(PG_ZIP_URL, str(PG_ZIP_FILE), reporthook=progress)
    print()


def extract_postgres():
    print("  Extracting...")
    PG_DIR.mkdir(exist_ok=True)
    with zipfile.ZipFile(PG_ZIP_FILE, "r") as zf:
        for member in zf.infolist():
            # Strip leading "pgsql/" prefix -> extract to postgres/
            if member.filename.startswith("pgsql/"):
                rel = member.filename[len("pgsql/"):]
                if not rel:
                    continue
                target = PG_DIR / rel
                if member.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with zf.open(member) as src, open(target, "wb") as dst:
                        shutil.copyfileobj(src, dst)
    PG_ZIP_FILE.unlink()
    print("  [OK] Extracted to postgres/")


def init_postgres():
    if PG_DATA.exists():
        return
    print("  Initializing database cluster...")
    run(
        [str(PG_BIN / "initdb.exe"), "-D", str(PG_DATA), "-U", "postgres", "-A", "trust", "--encoding=UTF8"],
        check=True,
    )


def start_postgres():
    if pg_ready():
        return
    env = read_env()
    port = env.get("DB_PORT", "5432")

    # Write port to postgresql.conf if non-default
    conf = PG_DATA / "postgresql.conf"
    if conf.exists():
        text = conf.read_text()
        if f"port = {port}" not in text:
            with open(conf, "a") as f:
                f.write(f"\nport = {port}\n")

    print("  Starting PostgreSQL...")
    run(
        [str(PG_BIN / "pg_ctl.exe"), "-D", str(PG_DATA), "-l", str(PG_LOG), "start"],
        check=True,
    )

    # Wait for ready
    for _ in range(15):
        if pg_ready():
            print("  [OK] PostgreSQL running")
            return
        time.sleep(1)
    print("[ERROR] PostgreSQL failed to start. Check postgres/log.txt")
    sys.exit(1)


def stop_postgres():
    if pg_installed() and PG_DATA.exists():
        subprocess.run(
            [str(PG_BIN / "pg_ctl.exe"), "-D", str(PG_DATA), "stop", "-m", "fast"],
            capture_output=True,
        )
        print("  [postgres] stopped")


def create_database():
    env = read_env()
    dbname = env.get("DB_NAME", "shi_dashboard")
    port = env.get("DB_PORT", "5432")

    # Check if DB already exists
    result = subprocess.run(
        [str(PG_BIN / "psql.exe"), "-U", "postgres", "-p", port, "-lqt"],
        capture_output=True, text=True,
    )
    if dbname in result.stdout:
        return

    print(f"  Creating database '{dbname}'...")
    run(
        [str(PG_BIN / "createdb.exe"), "-U", "postgres", "-p", port, dbname],
        check=True,
    )


def ensure_postgres():
    print("\n=== PostgreSQL ===")

    if pg_ready():
        print("[OK] Already running")
        return

    if not pg_installed():
        download_postgres()
        extract_postgres()

    init_postgres()
    start_postgres()
    create_database()


def reset_database():
    env = read_env()
    dbname = env.get("DB_NAME", "shi_dashboard")
    port = env.get("DB_PORT", "5432")
    print(f"\n=== Resetting database '{dbname}' ===")
    subprocess.run(
        [str(PG_BIN / "dropdb.exe"), "-U", "postgres", "-p", port, "--if-exists", dbname],
        capture_output=True,
    )
    run(
        [str(PG_BIN / "createdb.exe"), "-U", "postgres", "-p", port, dbname],
        check=True,
    )
    print("[OK] Database reset")


# -- Node/Bun ----------------------------------------------------------------

def check_native_bindings() -> bool:
    """Verify Vite's rolldown native binding exists and isn't empty."""
    binding_dir = FRONTEND_DIR / "node_modules" / "@rolldown" / "binding-win32-x64-msvc"
    if not binding_dir.exists():
        return False
    # Directory exists but might be empty (interrupted install)
    return any(binding_dir.iterdir())


def install_deps(bun: str):
    print("\n=== Dependencies ===")
    server_ok = (SERVER_DIR / "node_modules").exists()
    frontend_ok = (FRONTEND_DIR / "node_modules").exists() and check_native_bindings()

    if not frontend_ok and (FRONTEND_DIR / "node_modules").exists():
        print("  Broken native bindings detected, reinstalling frontend...")
        shutil.rmtree(FRONTEND_DIR / "node_modules")
        for f in [FRONTEND_DIR / "package-lock.json", FRONTEND_DIR / "bun.lock", FRONTEND_DIR / "bun.lockb"]:
            if f.exists():
                f.unlink()

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
    print("\n=== Schema ===")
    cmd = [bun, "run", "db:seed"] if seed else [bun, "run", "db:setup"]
    result = run(cmd, cwd=SERVER_DIR, check=False)
    if result.returncode != 0:
        print("[ERROR] Schema setup failed")
        sys.exit(1)
    print("[OK] Database ready")


# -- Services -----------------------------------------------------------------

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
        for name, proc in [("frontend", frontend), ("backend", backend)]:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                print(f"  [{name}] stopped")
        stop_postgres()
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


# -- Main ---------------------------------------------------------------------

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

    # 1. PostgreSQL
    if "--skip-db" not in args:
        ensure_postgres()

    if "--pg-only" in args:
        print("\n[OK] PostgreSQL running. Ctrl+C to stop.")
        signal.signal(signal.SIGINT, lambda *_: (stop_postgres(), sys.exit(0)))
        signal.signal(signal.SIGTERM, lambda *_: (stop_postgres(), sys.exit(0)))
        while True:
            time.sleep(1)

    # 2. Dependencies
    install_deps(bun)

    if "--install" in args:
        return

    # 3. Uploads dir
    (SERVER_DIR / "uploads").mkdir(exist_ok=True)

    # 4. Database schema
    if "--skip-db" not in args:
        if "--reset-db" in args:
            reset_database()
        setup_db(bun, seed="--seed" in args)

    if "--db-only" in args:
        return

    # 5. Run
    start_services(bun)


if __name__ == "__main__":
    main()
