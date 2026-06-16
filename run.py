"""
SHI Dashboard - Build & Run Script (Docker-based)

Orkestrator sederhana untuk stack yang sudah disederhanakan:
- PostgreSQL via Docker Compose (port 5433)
- Next.js 15 (App Router) via bun (fallback: pnpm). npm tidak dipakai.

Penggunaan:
  python run.py              # Start DB + install deps + dev server
  python run.py --test       # Start DB + jalankan vitest
  python run.py --build      # Build image Next.js produksi (docker compose build)
  python run.py --pg-only    # Hanya jalankan PostgreSQL
  python run.py --reset-db   # Hapus volume DB lalu mulai ulang (data hilang!)
  python run.py --stop       # Hentikan semua container
  python run.py --install    # Hanya install dependencies (bun install)
  python run.py --clean      # Reset node_modules + .next + .env.local + volume DB
"""

import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
APP_DIR = ROOT / "frontend"
COMPOSE_FILE = ROOT / "docker-compose.yml"
DB_CONTAINER = "shi_db"
DB_PORT = 5433
DB_USER = "postgres"
DB_NAME = "shi"
DB_NAME_TEST = "shi_test"


# -- Helpers ------------------------------------------------------------------

def run(cmd: list[str], cwd: Path = ROOT, check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    print(f"  >>> {' '.join(str(c) for c in cmd)}")
    return subprocess.run(cmd, cwd=cwd, check=check, **kwargs)


def find(cmd: str) -> str:
    path = shutil.which(cmd)
    if not path:
        print(f"[ERROR] '{cmd}' tidak ditemukan di PATH.")
        sys.exit(1)
    return path


def docker_running() -> bool:
    try:
        subprocess.run(
            ["docker", "info"], check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=2):
            return True
    except (ConnectionRefusedError, OSError):
        return False


def container_running(name: str) -> bool:
    try:
        r = subprocess.run(
            ["docker", "ps", "--filter", f"name=^{name}$", "--format", "{{.Names}}"],
            capture_output=True, text=True, check=True,
        )
        return name in r.stdout
    except subprocess.CalledProcessError:
        return False


# -- Docker / PostgreSQL ------------------------------------------------------

def ensure_docker():
    print("\n=== Docker ===")
    find("docker")
    if not docker_running():
        print("[ERROR] Docker daemon tidak berjalan. Mulai Docker Desktop terlebih dahulu.")
        sys.exit(1)
    print("[OK] Docker tersedia")


def compose_up_db():
    print("\n=== PostgreSQL (Docker) ===")
    if container_running(DB_CONTAINER):
        print(f"[OK] Container '{DB_CONTAINER}' sudah berjalan")
    else:
        run(["docker", "compose", "-f", str(COMPOSE_FILE), "up", "-d", "db"])

    # Tunggu hingga DB siap menerima koneksi.
    print("  Menunggu PostgreSQL siap...")
    for _ in range(30):
        if port_open(DB_PORT):
            # Verifikasi pg_isready di dalam container.
            r = subprocess.run(
                ["docker", "exec", DB_CONTAINER, "pg_isready", "-U", DB_USER],
                capture_output=True,
            )
            if r.returncode == 0:
                print(f"[OK] PostgreSQL siap di port {DB_PORT}")
                ensure_test_db()
                return
        time.sleep(1)
    print("[ERROR] PostgreSQL tidak siap setelah 30 detik. Cek: docker logs shi_db")
    sys.exit(1)


def ensure_test_db():
    """Pastikan database shi_test ada (untuk integration tests)."""
    r = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-tAc",
         f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME_TEST}';"],
        capture_output=True, text=True,
    )
    if "1" in r.stdout:
        return
    print(f"  Membuat database uji '{DB_NAME_TEST}'...")
    subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-c",
         f"CREATE DATABASE {DB_NAME_TEST};"],
        check=True, capture_output=True,
    )
    # Terapkan skema ke shi_test menggunakan init.sql yang sudah dibake di image.
    subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME_TEST,
         "-f", "/docker-entrypoint-initdb.d/01_init.sql"],
        check=True, capture_output=True,
    )
    print(f"  [OK] Skema diterapkan ke {DB_NAME_TEST}")


def reset_db():
    print("\n=== Reset Database (volume dihapus) ===")
    run(["docker", "compose", "-f", str(COMPOSE_FILE), "down", "-v"])
    print("[OK] Volume DB dihapus")
    compose_up_db()


def compose_down():
    print("\n=== Hentikan Container ===")
    run(["docker", "compose", "-f", str(COMPOSE_FILE), "down"])
    print("[OK] Semua container dihentikan")


# -- Node / bun ---------------------------------------------------------------

def find_pkg_mgr() -> tuple[str, str]:
    """Return (binary_path, name). Prefer bun, fall back to pnpm.

    npm sengaja tidak dipakai — bun jauh lebih cepat untuk install + dev server.
    """
    for name in ("bun", "pnpm"):
        path = shutil.which(name)
        if path:
            return path, name
    print("[ERROR] Tidak menemukan 'bun' atau 'pnpm' di PATH.")
    print("        Install bun: curl -fsSL https://bun.sh/install | bash")
    sys.exit(1)


def install_deps():
    print("\n=== Dependencies ===")
    pkg, name = find_pkg_mgr()
    if (APP_DIR / "node_modules").exists():
        print(f"[OK] Sudah terinstal (gunakan --clean untuk install ulang via {name})")
        return
    run([pkg, "install"], cwd=APP_DIR)
    print(f"[OK] Dependencies terinstal via {name}")


def clean():
    """Hapus artefak build (node_modules, .next) DAN reset DB.

    --clean dipakai saat user mau benar-benar mulai dari nol: kode di-rebuild
    ulang dan database di-recreate dari init.sql. Sebelumnya hanya menghapus
    node_modules / .next, jadi data lama (mis. user dummy schema lama yang
    masih pakai kolom 'name') tetap nyangkut dan menyebabkan login gagal.
    """
    print("\n=== Bersihkan (kode + database) ===")
    for d in [APP_DIR / "node_modules", APP_DIR / ".next"]:
        if d.exists():
            shutil.rmtree(d)
            print(f"  Hapus {d.name}")
    # Stale .env.local dari setup lama (PG portable, DB name lama) bikin
    # Next.js connect ke instance yang salah. Wajib dihapus.
    stale_env = APP_DIR / ".env.local"
    if stale_env.exists():
        stale_env.unlink()
        print(f"  Hapus {stale_env.name} (stale dari setup lama)")
    # package-lock.json bekas npm — hapus agar bun/pnpm tidak bingung.
    for f in [APP_DIR / "package-lock.json"]:
        if f.exists():
            f.unlink()
            print(f"  Hapus {f.name}")
    # Reset volume DB jika docker tersedia — pastikan schema fresh dari init.sql.
    if docker_running():
        print("  Reset volume DB...")
        subprocess.run(
            ["docker", "compose", "-f", str(COMPOSE_FILE), "down", "-v"],
            capture_output=True,
        )
        print("  [OK] Volume DB dihapus (akan di-init ulang oleh init.sql saat 'up')")


def run_tests():
    print("\n=== Vitest ===")
    pkg, name = find_pkg_mgr()
    # PENTING: pakai `bun run test`, BUKAN `bun test` — `bun test` memanggil
    # built-in runner bun yang tidak kompatibel dengan vitest.
    r = subprocess.run([pkg, "run", "test"], cwd=str(APP_DIR))
    if r.returncode != 0:
        print("[ERROR] Test gagal")
        sys.exit(r.returncode)
    print("[OK] Semua test lulus")


def run_build():
    print("\n=== Build (docker compose) ===")
    run(["docker", "compose", "-f", str(COMPOSE_FILE), "build"])
    print("[OK] Image dibuild")


def kill_stale_next_processes():
    """Hentikan proses next/bun lain agar tidak bentrok di .next/."""
    try:
        r = subprocess.run(
            ["pgrep", "-fl", "next-server|next dev|next build"],
            capture_output=True, text=True,
        )
        if r.stdout.strip():
            print("  [!] Mendeteksi proses Next.js lain — dihentikan agar .next/ tidak bentrok:")
            for line in r.stdout.strip().splitlines():
                print(f"      {line}")
            subprocess.run(["pkill", "-f", "next-server|next dev|next build"],
                           capture_output=True)
            time.sleep(1)
    except FileNotFoundError:
        pass  # pgrep tidak ada di OS ini


def kill_stale_app_container():
    """Hentikan container shi_app jika berjalan — memakai port 3000 yang sama."""
    if container_running("shi_app"):
        print("  [!] Container 'shi_app' aktif di port 3000 — dihentikan.")
        subprocess.run(["docker", "compose", "-f", str(COMPOSE_FILE), "stop", "app"],
                       capture_output=True)


def start_dev_server():
    print("\n=== Next.js Dev Server ===")
    kill_stale_next_processes()
    kill_stale_app_container()
    # Bersihkan .next agar tidak ada sisa build/cache yang rusak dari run sebelumnya.
    next_dir = APP_DIR / ".next"
    if next_dir.exists():
        shutil.rmtree(next_dir)
        print("  [OK] .next/ dibersihkan")

    print(f"  App:  http://localhost:3000")
    print(f"  DB:   localhost:{DB_PORT} (user={DB_USER}, db={DB_NAME})")
    print("  Ctrl+C untuk berhenti\n")
    pkg, _ = find_pkg_mgr()
    (APP_DIR / "uploads").mkdir(exist_ok=True)
    app = subprocess.Popen([pkg, "run", "dev"], cwd=str(APP_DIR))

    def shutdown(*_):
        print("\n\nMenghentikan...")
        if app.poll() is None:
            app.terminate()
            try:
                app.wait(timeout=5)
            except subprocess.TimeoutExpired:
                app.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        if app.poll() is not None:
            print(f"[WARN] Next.js berhenti (exit {app.returncode})")
            sys.exit(app.returncode or 0)
        time.sleep(1)


# -- Main ---------------------------------------------------------------------

def main():
    args = sys.argv[1:]
    print("=" * 50)
    print(f"  SHI Dashboard  ({sys.platform})")
    print("=" * 50)

    if "--stop" in args:
        compose_down()
        return

    ensure_docker()

    if "--clean" in args:
        clean()

    if "--reset-db" in args:
        reset_db()
    else:
        compose_up_db()

    if "--pg-only" in args:
        print("\n[OK] PostgreSQL berjalan. Container tetap aktif sampai 'python run.py --stop'.")
        return

    install_deps()

    if "--install" in args:
        return

    if "--build" in args:
        run_build()
        return

    if "--test" in args:
        run_tests()
        return

    start_dev_server()


if __name__ == "__main__":
    main()
