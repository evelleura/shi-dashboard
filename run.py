"""
SHI Dashboard - Build & Run Script (Docker-based)

Orkestrator sederhana untuk stack:
- PostgreSQL polos via Docker Compose (port 5433). Skema TIDAK di-bake ke image;
  run.py memuat skema app dir aktif (idempotent) setelah DB siap.
- Next.js 15 (App Router) via bun (fallback: pnpm). npm tidak dipakai.

Default app dir: frontend_backup/ (skema database/schema.sql, tabel bhs Inggris).
Tambahkan --new untuk pakai frontend/ (skema database/init.sql, tabel bhs Indonesia).
run.py meng-inject DB_HOST/PORT/USER/PASSWORD/NAME ke dev server + db:setup
supaya app nyambung ke Postgres docker (default db.ts = port 5432 / DB_NAME kosong).

Penggunaan:
  python run.py              # DB + skema + install deps + dev server (frontend_backup)
  python run.py --new        # Sama, tapi pakai frontend/ bukan frontend_backup/
  python run.py --seed       # Sama + seed data contoh (frontend_backup saja)
  python run.py --empty      # Data KOSONG kecuali staff/user (simulasi sistem baru)
  python run.py --test       # DB + skema (db uji) + jalankan vitest
  python run.py --build      # Build image Next.js produksi (app dir aktif)
  python run.py --pg-only    # Hanya jalankan PostgreSQL + muat skema
  python run.py --reset-db   # Hapus volume DB lalu mulai ulang (data hilang!)
  python run.py --stop       # Hentikan semua container
  python run.py --install    # Hanya install dependencies (bun install)
  python run.py --clean      # Nuke total: node_modules + .next + .env.local +
                             #   reset volume DB + muat skema + SEED + dev server
"""

import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
APP_DIR = ROOT / "frontend_backup"  # default; --new switches to ROOT/"frontend"
COMPOSE_FILE = ROOT / "docker-compose.yml"
DB_CONTAINER = "shi_db"
DB_HOST = "127.0.0.1"
DB_PORT = 5433
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_NAME = "shi"
DB_NAME_TEST = "shi_test"
JWT_DEV_SECRET = "dev-secret-shi"  # hanya untuk dev lokal


def db_env(db_name: str) -> dict:
    """Env DB_* yang di-inject ke proses node/bun (dev server, db:setup, seed).

    frontend_backup/src/lib/db.ts default DB_NAME kosong + port 5432, jadi WAJIB
    di-inject agar nyambung ke Postgres docker (host 5433). frontend pun butuh
    DB_PORT=5433 karena defaultnya 5432.
    """
    return {
        **os.environ,
        "DB_HOST": DB_HOST,
        "DB_PORT": str(DB_PORT),
        "DB_USER": DB_USER,
        "DB_PASSWORD": DB_PASSWORD,
        "DB_NAME": db_name,
        "JWT_SECRET": os.environ.get("JWT_SECRET", JWT_DEV_SECRET),
    }


def schema_file() -> Path:
    """File skema SQL milik app dir aktif.

    frontend_backup pakai database/schema.sql (tabel bhs Inggris: users, projects).
    frontend pakai database/init.sql (tabel bhs Indonesia: tb_user, tb_klien).
    Keduanya idempotent (CREATE TABLE IF NOT EXISTS).
    """
    if APP_DIR.name == "frontend":
        return APP_DIR / "database" / "init.sql"
    return APP_DIR / "database" / "schema.sql"


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
                return
        time.sleep(1)
    print("[ERROR] PostgreSQL tidak siap setelah 30 detik. Cek: docker logs shi_db")
    sys.exit(1)


def ensure_database(name: str):
    """Pastikan database `name` ada (db utama 'shi' otomatis dibuat image,
    tapi 'shi_test' perlu dibuat manual)."""
    r = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-tAc",
         f"SELECT 1 FROM pg_database WHERE datname='{name}';"],
        capture_output=True, text=True,
    )
    if "1" in r.stdout:
        return
    print(f"  Membuat database '{name}'...")
    subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-c",
         f"CREATE DATABASE {name};"],
        check=True, capture_output=True,
    )


def load_schema(db_name: str):
    """Muat skema app dir aktif ke `db_name` lewat docker psql.

    DB sekarang Postgres polos (bukan image yang sudah di-bake), jadi skema HARUS
    dimuat dari run.py. Pakai docker cp + psql -f supaya tidak ada masalah stdin
    newline di Windows. File skema idempotent -> aman dijalankan ulang.
    """
    sql = schema_file()
    if not sql.exists():
        print(f"[ERROR] File skema tidak ditemukan: {sql}")
        sys.exit(1)
    print(f"  Memuat skema '{sql.name}' -> db '{db_name}'...")
    subprocess.run(
        ["docker", "cp", str(sql), f"{DB_CONTAINER}:/tmp/{sql.name}"],
        check=True, capture_output=True,
    )
    r = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", db_name,
         "-v", "ON_ERROR_STOP=1", "-f", f"/tmp/{sql.name}"],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print(f"[ERROR] Gagal memuat skema ke {db_name}:")
        print(r.stderr.strip())
        sys.exit(1)
    print(f"  [OK] Skema dimuat ke {db_name}")


def wipe_non_users(db_name: str):
    """Kosongkan SEMUA tabel kecuali tabel staff/user (tb_user / users).

    Dipakai oleh --empty: simulasi sistem baru dipakai. Staff TETAP ada (bisa
    login), tapi tak ada data klien/proyek/tugas/eskalasi/laporan/dll. RESTART
    IDENTITY -> sequence balik ke 1 supaya data baru mulai dari id 1.

    Dinamis (exclude 'tb_user' DAN 'users') -> aman untuk frontend (skema
    Indonesia) maupun frontend_backup (skema Inggris) tanpa hardcode daftar tabel.
    """
    print("\n=== Kosongkan Data (sisakan staff) ===")
    sql = (
        "DO $$ DECLARE r RECORD; BEGIN "
        "FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' "
        "AND tablename NOT IN ('tb_user','users') LOOP "
        "EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; "
        "END LOOP; END $$;"
    )
    r = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", db_name,
         "-v", "ON_ERROR_STOP=1", "-c", sql],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("[ERROR] Gagal mengosongkan data:")
        print(r.stderr.strip())
        sys.exit(1)
    user_tbl = "tb_user" if APP_DIR.name == "frontend" else "users"
    cnt = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", db_name,
         "-tAc", f"SELECT count(*) FROM {user_tbl};"],
        capture_output=True, text=True,
    )
    print(f"[OK] Semua data dikosongkan kecuali staff. Staff tersisa: {cnt.stdout.strip()}")


def seed_db():
    """Isi data contoh. Hanya frontend_backup yang punya script db:seed.

    PAKAI --force-seed (TRUNCATE users CASCADE lalu reseed), BUKAN --seed biasa.
    Alasannya: schema.sql baris ~264 selalu meng-insert 1 user default
    (admin@shi.co.id), jadi guard idempotent di setup.ts ("skip kalau users > 0")
    SELALU melewati seed -> 8 user fixture (budi/diana/teknisi) tak pernah masuk
    -> login gagal 401. Force-seed membersihkan baris default itu dulu, lalu
    memuat seed.sql lengkap. Semua password fixture: 'password123'.
    """
    if APP_DIR.name != "frontend_backup":
        print("  [skip] --seed hanya tersedia untuk frontend_backup")
        return
    print("\n=== Seed Data (frontend_backup, force) ===")
    pkg, _ = find_pkg_mgr()
    run([pkg, "run", "db:seed", "--", "--force-seed"], cwd=APP_DIR, env=db_env(DB_NAME))
    print("[OK] Seed selesai (8 user, password: password123)")
    # seed.sql hanya mengisi project_health utk sebagian proyek -> sisanya tampil
    # SPI "-". Recompute SPI SEMUA proyek (termasuk tanpa task / non-aktif) pakai
    # logika app (recalculateSPI) supaya tidak ada SPI kosong di dashboard/laporan.
    run([pkg, "run", "db:backfill-spi"], cwd=APP_DIR, env=db_env(DB_NAME))
    print("[OK] SPI semua proyek di-backfill (tidak ada yang kosong)")


def backfill_spi_frontend():
    """Lengkapi project_health SEMUA proyek di db 'shi' (frontend) lewat
    recalculateSPI milik app, supaya tak ada SPI kosong di dashboard/laporan.

    init.sql hanya pra-isi sebagian project_health; proyek lain yang punya
    tugas/laporan tapi tak ter-seed akan tampil SPI '-'. Idempotent. Hanya untuk
    app dir 'frontend' (frontend_backup ditangani seed_db lewat --seed) dan hanya
    jika dependency sudah terpasang (butuh bunx tsx)."""
    if APP_DIR.name != "frontend":
        return
    script = APP_DIR / "database" / "backfill-spi.ts"
    if not script.exists() or not (APP_DIR / "node_modules").exists():
        return
    pkg, _ = find_pkg_mgr()
    print("  Backfill SPI semua proyek (frontend)...")
    run([pkg, "run", "db:backfill-spi"], cwd=APP_DIR, env=db_env(DB_NAME))


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
    ulang dan database di-recreate dari skema app dir aktif. Sebelumnya hanya menghapus
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
    # Reset volume DB jika docker tersedia — skema fresh dimuat run.py saat 'up'.
    if docker_running():
        print("  Reset volume DB...")
        subprocess.run(
            ["docker", "compose", "-f", str(COMPOSE_FILE), "down", "-v"],
            capture_output=True,
        )
        print("  [OK] Volume DB dihapus (skema dimuat ulang oleh run.py saat 'up')")


def run_tests():
    print("\n=== Vitest ===")
    pkg, name = find_pkg_mgr()
    # PENTING: pakai `bun run test`, BUKAN `bun test` — `bun test` memanggil
    # built-in runner bun yang tidak kompatibel dengan vitest.
    # Inject DB_* (db uji) — file test frontend_backup yang TIDAK meng-hardcode
    # env akan ikut ke Postgres docker.
    r = subprocess.run([pkg, "run", "test"], cwd=str(APP_DIR), env=db_env(DB_NAME_TEST))
    if r.returncode != 0:
        print("[ERROR] Test gagal")
        sys.exit(r.returncode)
    print("[OK] Semua test lulus")


def run_build():
    print("\n=== Build (docker compose) ===")
    # Context build service 'app' di compose pakai ${APP_CONTEXT}. Arahkan ke
    # app dir aktif supaya `--build` membangun image yang benar.
    ctx = "./frontend" if APP_DIR.name == "frontend" else "./frontend_backup"
    env = {**os.environ, "APP_CONTEXT": ctx}
    run(["docker", "compose", "-f", str(COMPOSE_FILE), "build", "app"], env=env)
    print(f"[OK] Image dibuild dari {ctx}")


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

    print(f"  App:  http://localhost:3000  (dir: {APP_DIR.name})")
    print(f"  DB:   localhost:{DB_PORT} (user={DB_USER}, db={DB_NAME})")
    print("  Ctrl+C untuk berhenti\n")
    pkg, _ = find_pkg_mgr()
    (APP_DIR / "uploads").mkdir(exist_ok=True)
    # Inject DB_* supaya app nyambung ke Postgres docker (port 5433), bukan
    # default 5432 / DB_NAME kosong yang ada di db.ts.
    app = subprocess.Popen([pkg, "run", "dev"], cwd=str(APP_DIR), env=db_env(DB_NAME))

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
    global APP_DIR
    args = sys.argv[1:]
    if "--new" in args:
        APP_DIR = ROOT / "frontend"
    print("=" * 50)
    print(f"  SHI Dashboard  ({sys.platform})")
    print(f"  App dir: {APP_DIR.name}")
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

    # DB adalah Postgres polos -> muat skema app dir aktif (idempotent).
    ensure_database(DB_NAME)
    load_schema(DB_NAME)

    # --empty: kosongkan semua data kecuali staff (simulasi sistem baru dipakai).
    # Jalan setelah load_schema (yang sudah seed staff) -> sisakan staff, buang demo.
    if "--empty" in args:
        wipe_non_users(DB_NAME)

    if "--pg-only" in args:
        print("\n[OK] PostgreSQL berjalan + skema dimuat. Container aktif sampai 'python run.py --stop'.")
        return

    install_deps()

    if "--install" in args:
        return

    # Lengkapi SPI semua proyek (frontend) setelah deps siap -> tak ada SPI kosong.
    # Dilewati saat --empty: tak ada proyek untuk dihitung.
    if "--empty" not in args:
        backfill_spi_frontend()

    if "--build" in args:
        run_build()
        return

    if "--test" in args:
        # DB uji terpisah, skema sama dengan app dir aktif.
        ensure_database(DB_NAME_TEST)
        load_schema(DB_NAME_TEST)
        run_tests()
        return

    # --clean = mulai dari nol: volume DB sudah dihapus (lihat clean()), skema
    # baru saja dimuat ulang -> sekalian seed supaya langsung bisa login.
    # --empty menang atas auto-seed --clean: biarkan kosong (kecuali staff).
    if ("--seed" in args or "--clean" in args) and "--empty" not in args:
        seed_db()

    start_dev_server()


if __name__ == "__main__":
    main()
