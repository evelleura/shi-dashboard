"""
SHI Dashboard - Build & Run Script
Cross-platform: Windows, macOS, Linux
Auto-installs PostgreSQL (portable), installs deps (bun), sets up DB, runs everything.
"""

import subprocess
import sys
import os
import socket
import signal
import shutil
import time
import platform
import zipfile
import tarfile
import stat
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
APP_DIR = ROOT / "frontend"
ENV_FILE = APP_DIR / ".env.local"
ENV_EXAMPLE = APP_DIR / ".env.example"
PG_DIR = ROOT / "postgres"
PG_BIN = PG_DIR / "bin"
PG_DATA = PG_DIR / "data"
PG_LOG = PG_DIR / "log.txt"

PG_VERSION = "17.5-1"
PLATFORM = sys.platform  # win32, darwin, linux
ARCH = platform.machine()  # x86_64, AMD64, arm64, aarch64


# -- Platform helpers ---------------------------------------------------------

def get_pg_download_info() -> tuple[str, str]:
    """Returns (url, filename) for the current platform's PG binary."""
    base = "https://get.enterprisedb.com/postgresql"

    if PLATFORM == "win32":
        name = f"postgresql-{PG_VERSION}-windows-x64-binaries.zip"
    elif PLATFORM == "darwin":
        if ARCH == "arm64":
            name = f"postgresql-{PG_VERSION}-osx-arm64-binaries.zip"
        else:
            name = f"postgresql-{PG_VERSION}-osx-binaries.zip"
    elif PLATFORM == "linux":
        name = f"postgresql-{PG_VERSION}-linux-x64-binaries.tar.gz"
    else:
        print(f"[ERROR] Unsupported platform: {PLATFORM}")
        sys.exit(1)

    return f"{base}/{name}", name


def pg_bin_path(name: str) -> Path:
    """Returns path to a PG binary with platform-appropriate extension."""
    suffix = ".exe" if PLATFORM == "win32" else ""
    return PG_BIN / f"{name}{suffix}"


def pg_env() -> dict:
    """Returns environment dict with library paths set for PG binaries."""
    env = os.environ.copy()
    lib_dir = str(PG_DIR / "lib")
    if PLATFORM == "darwin":
        env["DYLD_LIBRARY_PATH"] = lib_dir
    elif PLATFORM == "linux":
        env["LD_LIBRARY_PATH"] = lib_dir
    return env


def make_executable(path: Path):
    """Make a file executable on Unix platforms."""
    if PLATFORM != "win32":
        st = path.stat()
        path.chmod(st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)


# -- Helpers ------------------------------------------------------------------

def run(cmd: list[str], cwd: Path = ROOT, check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    print(f"  >>> {' '.join(str(c) for c in cmd)}")
    # Inject PG library paths if running a PG binary
    if len(cmd) > 0 and str(PG_BIN) in str(cmd[0]):
        kwargs.setdefault("env", pg_env())
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
    return pg_bin_path("pg_ctl").exists()


def download_postgres():
    url, filename = get_pg_download_info()
    download_file = ROOT / filename
    print(f"  Downloading PostgreSQL {PG_VERSION} for {PLATFORM}/{ARCH} (~300MB)...")

    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 // total_size)
            mb = downloaded // (1024 * 1024)
            total_mb = total_size // (1024 * 1024)
            print(f"\r  [{pct:3d}%] {mb}/{total_mb} MB", end="", flush=True)

    urllib.request.urlretrieve(url, str(download_file), reporthook=progress)
    print()
    return download_file


def extract_postgres(archive_file: Path):
    """Extract PG archive, stripping the leading pgsql/ prefix."""
    print("  Extracting...")
    PG_DIR.mkdir(exist_ok=True)

    if archive_file.name.endswith(".tar.gz") or archive_file.name.endswith(".tgz"):
        # Linux: tar.gz
        with tarfile.open(archive_file, "r:gz") as tf:
            for member in tf.getmembers():
                if member.name.startswith("pgsql/"):
                    rel = member.name[len("pgsql/"):]
                    if not rel:
                        continue
                    member_copy = tarfile.TarInfo(name=rel)
                    member_copy.size = member.size
                    member_copy.mode = member.mode
                    member_copy.type = member.type
                    member_copy.linkname = member.linkname

                    target = PG_DIR / rel
                    if member.isdir():
                        target.mkdir(parents=True, exist_ok=True)
                    elif member.issym() or member.islnk():
                        # Handle symlinks
                        target.parent.mkdir(parents=True, exist_ok=True)
                        src = tf.extractfile(member)
                        if src is None:
                            # Symlink -- create it
                            if target.exists() or target.is_symlink():
                                target.unlink()
                            os.symlink(member.linkname, str(target))
                        else:
                            with open(target, "wb") as dst:
                                shutil.copyfileobj(src, dst)
                    else:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        src = tf.extractfile(member)
                        if src:
                            with open(target, "wb") as dst:
                                shutil.copyfileobj(src, dst)
                            # Preserve executable permissions
                            if member.mode & 0o111:
                                make_executable(target)
    else:
        # Windows/macOS: zip
        with zipfile.ZipFile(archive_file, "r") as zf:
            for member in zf.infolist():
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
                        # On macOS, make binaries executable
                        if PLATFORM != "win32" and (
                            "bin/" in member.filename or member.filename.endswith(".sh")
                        ):
                            make_executable(target)

    archive_file.unlink()
    print("  [OK] Extracted to postgres/")


def init_postgres():
    if PG_DATA.exists():
        return
    print("  Initializing database cluster...")
    run(
        [str(pg_bin_path("initdb")), "-D", str(PG_DATA), "-U", "postgres", "-A", "trust", "--encoding=UTF8"],
        check=True,
        env=pg_env(),
    )


def start_postgres():
    if pg_ready():
        return
    env_vars = read_env()
    port = env_vars.get("DB_PORT", "5432")

    # Write port to postgresql.conf if non-default
    conf = PG_DATA / "postgresql.conf"
    if conf.exists():
        text = conf.read_text()
        if f"port = {port}" not in text:
            with open(conf, "a") as f:
                f.write(f"\nport = {port}\n")

    print("  Starting PostgreSQL...")
    run(
        [str(pg_bin_path("pg_ctl")), "-D", str(PG_DATA), "-l", str(PG_LOG), "start"],
        check=True,
        env=pg_env(),
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
            [str(pg_bin_path("pg_ctl")), "-D", str(PG_DATA), "stop", "-m", "fast"],
            capture_output=True,
            env=pg_env(),
        )
        print("  [postgres] stopped")


def create_database():
    env_vars = read_env()
    dbname = env_vars.get("DB_NAME", "shi_dashboard")
    port = env_vars.get("DB_PORT", "5432")

    # Check if DB already exists
    result = subprocess.run(
        [str(pg_bin_path("psql")), "-U", "postgres", "-p", port, "-lqt"],
        capture_output=True, text=True,
        env=pg_env(),
    )
    if dbname in result.stdout:
        return

    print(f"  Creating database '{dbname}'...")
    run(
        [str(pg_bin_path("createdb")), "-U", "postgres", "-p", port, dbname],
        check=True,
        env=pg_env(),
    )


def ensure_postgres():
    print("\n=== PostgreSQL ===")

    if pg_ready():
        print("[OK] Already running")
        return

    if not pg_installed():
        archive = download_postgres()
        extract_postgres(archive)

    init_postgres()
    start_postgres()
    create_database()


def reset_database():
    env_vars = read_env()
    dbname = env_vars.get("DB_NAME", "shi_dashboard")
    port = env_vars.get("DB_PORT", "5432")
    print(f"\n=== Resetting database '{dbname}' ===")
    subprocess.run(
        [str(pg_bin_path("dropdb")), "-U", "postgres", "-p", port, "--if-exists", dbname],
        capture_output=True,
        env=pg_env(),
    )
    run(
        [str(pg_bin_path("createdb")), "-U", "postgres", "-p", port, dbname],
        check=True,
        env=pg_env(),
    )
    print("[OK] Database reset")


# -- Node/Bun ----------------------------------------------------------------

def install_deps(bun: str):
    print("\n=== Dependencies ===")
    if (APP_DIR / "node_modules").exists():
        print("[OK] Already installed (use --clean to reinstall)")
        return

    p = subprocess.Popen([bun, "install"], cwd=APP_DIR)
    if p.wait() != 0:
        print("[ERROR] bun install failed")
        sys.exit(1)
    print("  [OK] Dependencies installed")


def setup_db(bun: str, seed: bool = False):
    print("\n=== Schema ===")
    cmd = [bun, "run", "db:seed"] if seed else [bun, "run", "db:setup"]
    result = run(cmd, cwd=APP_DIR, check=False)
    if result.returncode != 0:
        print("[ERROR] Schema setup failed")
        sys.exit(1)
    print("[OK] Database ready")


# -- Services -----------------------------------------------------------------

def start_services(bun: str):
    print("\n=== Next.js Dev Server ===")
    print("  App: http://localhost:3000")
    print("  Ctrl+C to stop\n")

    app = subprocess.Popen([bun, "run", "dev"], cwd=APP_DIR)

    def shutdown(signum=None, frame=None):
        print("\n\nShutting down...")
        if app.poll() is None:
            app.terminate()
            try:
                app.wait(timeout=5)
            except subprocess.TimeoutExpired:
                app.kill()
            print("  [next.js] stopped")
        stop_postgres()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        if app.poll() is not None:
            print(f"[WARNING] Next.js exited ({app.returncode})")
            shutdown()
        time.sleep(1)


# -- Main ---------------------------------------------------------------------

def main():
    args = sys.argv[1:]

    print("=" * 50)
    print(f"  SHI Dashboard  ({PLATFORM}/{ARCH})")
    print("=" * 50)

    bun = find_bun()
    ensure_env()

    if "--clean" in args:
        print("\n=== Clean ===")
        for d in [APP_DIR / "node_modules", APP_DIR / ".next"]:
            if d.exists():
                shutil.rmtree(d)
                print(f"  Removed {d.name}")
        for f in [APP_DIR / "package-lock.json", APP_DIR / "bun.lock", APP_DIR / "bun.lockb"]:
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
    (APP_DIR / "uploads").mkdir(exist_ok=True)

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
