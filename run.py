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
  python run.py --new --iso  # STACK TERISOLASI: DB sendiri (shi_db_iso :5544) +
                             #   web sendiri (:3100) + build .next-iso. Default EMPTY
                             #   (8 staff, tanpa data). TIDAK menyentuh stack utama
                             #   (:3000 / shi_db :5433). Untuk uji guide tanpa ganggu
                             #   data kerja. Tambah --seed untuk data demo penuh.
  python run.py --iso --stop # Hentikan + hapus stack terisolasi (container + .next-iso)
  python run.py --test       # DB + skema (db uji) + jalankan vitest
  python run.py --build      # Build image Next.js produksi (app dir aktif)
  python run.py --pg-only    # Hanya jalankan PostgreSQL + muat skema
  python run.py --reset-db   # Hapus volume DB lalu mulai ulang (data hilang!)
  python run.py --stop       # Hentikan semua container
  python run.py --install    # Hanya install dependencies (bun install)
  python run.py --clean      # Nuke total: node_modules + .next + .env.local +
                             #   reset volume DB + muat skema + SEED + dev server
"""

import datetime
import os
import shutil
import stat
import signal
import socket
import subprocess
import sys
import threading
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

# -- Stack TERISOLASI (--iso) -------------------------------------------------
# Container + port + folder build terpisah supaya bisa jalan BERSAMAAN dengan
# stack utama tanpa bentrok. Dipakai untuk uji guide/UI tanpa menyentuh data kerja.
ISO_DB_CONTAINER = "shi_db_iso"
ISO_DB_PORT = 5544          # vs 5433 (utama)
ISO_WEB_PORT = 3100         # vs 3000 (utama)
ISO_DIST_DIR = ".next-iso"  # vs .next (utama); diaktifkan via NEXT_DIST_DIR
ISO_LOG_DIR = ROOT / "iso-logs"  # SEMUA log stack iso (server+API, DB, frontend) disimpan di sini
_iso_followers: list = []        # proses follower log yang harus dimatikan saat shutdown


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


def load_seed_frontend(db_name: str):
    """Muat seed.sql (data operasional realistis ~200 proyek, digenerate
    generate_seed.py) ke db frontend lewat docker psql.

    Idempotent: seed.sql punya guard 'IF NOT EXISTS (SELECT 1 FROM tb_proyek)'
    -> aman dimuat ulang run.py. Hanya untuk app dir 'frontend' (frontend_backup
    pakai db:seed sendiri). Regenerasi data: python frontend/database/generate_seed.py
    """
    if APP_DIR.name != "frontend":
        return
    seed = APP_DIR / "database" / "seed.sql"
    if not seed.exists():
        print("  [skip] seed.sql belum ada (jalankan: python frontend/database/generate_seed.py)")
        return
    print(f"  Memuat data realistis '{seed.name}' -> db '{db_name}'...")
    subprocess.run(
        ["docker", "cp", str(seed), f"{DB_CONTAINER}:/tmp/{seed.name}"],
        check=True, capture_output=True,
    )
    r = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", db_name,
         "-v", "ON_ERROR_STOP=1", "-f", f"/tmp/{seed.name}"],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("[ERROR] Gagal memuat seed.sql:")
        print(r.stderr.strip())
        sys.exit(1)
    print("  [OK] Data realistis dimuat (klien/proyek/tugas/laporan/eskalasi).")


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
    # frontend: buang teknisi rekrutan dari seed (id>8); sisakan 8 staf dasar
    # init.sql. Tanpa ini, --empty menyisakan puluhan teknisi seed (tb_user tak
    # ikut TRUNCATE) -> bukan "sistem baru". 8 dasar = manajer 1-3 + teknisi 4-8.
    if APP_DIR.name == "frontend":
        subprocess.run(
            ["docker", "exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", db_name,
             "-c", "DELETE FROM tb_user WHERE id_user > 8;"],
            capture_output=True,
        )
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


# -- Stack TERISOLASI (--iso) -------------------------------------------------

def _ts() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _banner(fh, title: str):
    """Tulis garis pemisah sesi yang jelas ke file log."""
    fh.write("\n" + "=" * 78 + "\n")
    fh.write(f"=== SESI ISO MULAI {_ts()} | {title}\n")
    fh.write("=" * 78 + "\n")
    fh.flush()


def iso_logs_init():
    """Siapkan folder iso-logs + tulis README + banner sesi ke log server/DB.
    SEMUA log (server+API, DB, frontend) berkumpul di sini untuk diserahkan ke
    sesi berikutnya."""
    ISO_LOG_DIR.mkdir(exist_ok=True)
    # Truncate log stream per sesi --iso (fresh), lalu tulis banner.
    for name, title in (("next-dev.log", "Next.js dev server (frontend + API handler + request log)"),
                        ("postgres.log", "PostgreSQL (semua query SQL, log_statement=all)")):
        with open(ISO_LOG_DIR / name, "w", encoding="utf-8") as fh:
            _banner(fh, title)
    (ISO_LOG_DIR / "README.md").write_text(
        "# iso-logs — log lengkap stack terisolasi (run.py --iso)\n\n"
        f"Dibuat: {_ts()}. Folder ini berisi SELURUH log sistem untuk diserahkan ke sesi berikutnya.\n\n"
        "| File | Isi | Sumber |\n"
        "|---|---|---|\n"
        "| `next-dev.log` | Log server Next.js: kompilasi, **request API** (GET/POST /api/...), "
        "`console.*` di handler, error server | run.py tee stdout `next dev` |\n"
        "| `postgres.log` | **Setiap query SQL** + koneksi (log_statement=all) | follower `docker logs` DB iso |\n"
        "| `browser-console.log` | **Console frontend** (semua level) + page error, per langkah | walkthrough.py |\n"
        "| `api-calls.log` | **Setiap panggilan /api/** dari browser: method, URL, status, ms | walkthrough.py |\n"
        "| `actions-timeline.log` | **TIMELINE aksi** — tiap langkah diberi garis pemisah jelas, "
        "lalu API/console yang terjadi di langkah itu | walkthrough.py |\n"
        "| `_console-errors.json` | error/warning ringkas (mesin-baca) | walkthrough.py |\n\n"
        "## Cara baca\n"
        "Mulai dari `actions-timeline.log` (ada garis `==== STEP NN ====` per aksi). "
        "Tiap baris ber-**timestamp**, jadi bisa dikorelasikan ke `next-dev.log` & `postgres.log` "
        "(samakan jam:menit:detik) untuk lihat API + query DB yang dipicu aksi itu.\n\n"
        "## Regenerasi\n"
        "```\npython run.py --new --iso          # nyalakan (tulis next-dev.log + postgres.log)\n"
        "cd docs/hasil-uji && python walkthrough.py   # tulis browser/api/timeline\n"
        "python run.py --iso --stop          # hentikan\n```\n",
        encoding="utf-8")
    print(f"[OK] Log iso -> {ISO_LOG_DIR}")


def iso_env() -> dict:
    """Env untuk dev server iso: DB ke port 5544, web ke 3100, build ke .next-iso."""
    return {
        **os.environ,
        "DB_HOST": DB_HOST,
        "DB_PORT": str(ISO_DB_PORT),
        "DB_USER": DB_USER,
        "DB_PASSWORD": DB_PASSWORD,
        "DB_NAME": DB_NAME,
        "JWT_SECRET": os.environ.get("JWT_SECRET", JWT_DEV_SECRET),
        "PORT": str(ISO_WEB_PORT),          # next dev menghormati env PORT
        "NEXT_DIST_DIR": ISO_DIST_DIR,      # dibaca next.config.ts -> build terpisah
    }


def iso_db_up():
    """DB Postgres TERISOLASI (container shi_db_iso, port 5544), terpisah dari
    stack utama (shi_db:5433). Dibuat FRESH tiap start (tanpa volume) supaya
    state pengujian selalu bersih. log_statement=all -> SEMUA query SQL tercatat."""
    print(f"\n=== [ISO] PostgreSQL terisolasi (port {ISO_DB_PORT}) ===")
    subprocess.run(["docker", "rm", "-f", ISO_DB_CONTAINER], capture_output=True)
    run([
        "docker", "run", "-d", "--name", ISO_DB_CONTAINER,
        "-e", f"POSTGRES_USER={DB_USER}",
        "-e", f"POSTGRES_PASSWORD={DB_PASSWORD}",
        "-e", f"POSTGRES_DB={DB_NAME}",
        "-e", "TZ=Asia/Jakarta", "-e", "PGTZ=Asia/Jakarta",
        "-p", f"{ISO_DB_PORT}:5432", "postgres:17-alpine",
        # Logging penuh: tiap statement + koneksi + durasi -> ke stderr container -> docker logs.
        "-c", "log_statement=all",
        "-c", "log_min_duration_statement=0",
        "-c", "log_connections=on",
        "-c", "log_disconnections=on",
        "-c", "log_line_prefix=%m [%p] %u@%d ",
    ])
    print("  Menunggu PostgreSQL (iso) siap...")
    for _ in range(30):
        r = subprocess.run(
            ["docker", "exec", ISO_DB_CONTAINER, "pg_isready", "-U", DB_USER],
            capture_output=True,
        )
        if r.returncode == 0:
            print(f"[OK] PostgreSQL (iso) siap di port {ISO_DB_PORT}")
            return
        time.sleep(1)
    print(f"[ERROR] PostgreSQL (iso) tidak siap. Cek: docker logs {ISO_DB_CONTAINER}")
    sys.exit(1)


def iso_db_logs_follow():
    """Alirkan log DB iso (semua query) ke iso-logs/postgres.log secara live."""
    fh = open(ISO_LOG_DIR / "postgres.log", "a", encoding="utf-8")
    proc = subprocess.Popen(
        ["docker", "logs", "-f", "--tail", "0", ISO_DB_CONTAINER],
        stdout=fh, stderr=subprocess.STDOUT,
    )
    _iso_followers.append((proc, fh))
    print("  [OK] Follower log DB -> iso-logs/postgres.log")


def iso_load_schema(empty: bool):
    """Muat skema frontend (init.sql) ke DB iso; bila empty=True kosongkan semua
    tabel kecuali staff/user (login tetap bisa)."""
    sql = ROOT / "frontend" / "database" / "init.sql"
    if not sql.exists():
        print(f"[ERROR] File skema tidak ditemukan: {sql}")
        sys.exit(1)
    print(f"  Memuat skema '{sql.name}' -> iso db '{DB_NAME}'...")
    subprocess.run(["docker", "cp", str(sql), f"{ISO_DB_CONTAINER}:/tmp/{sql.name}"],
                   check=True, capture_output=True)
    r = subprocess.run(
        ["docker", "exec", ISO_DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
         "-v", "ON_ERROR_STOP=1", "-f", f"/tmp/{sql.name}"],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("[ERROR] Gagal memuat skema iso:")
        print(r.stderr.strip())
        sys.exit(1)
    print("  [OK] Skema dimuat ke iso db")
    if empty:
        wipe = (
            "DO $$ DECLARE r RECORD; BEGIN "
            "FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' "
            "AND tablename NOT IN ('tb_user','users') LOOP "
            "EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; "
            "END LOOP; END $$;"
        )
        subprocess.run(
            ["docker", "exec", ISO_DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
             "-v", "ON_ERROR_STOP=1", "-c", wipe],
            check=True, capture_output=True,
        )
        print("  [OK] Data dikosongkan (EMPTY) — sisakan staff/user (8 akun)")
    else:
        # --seed: muat data realistis (seed.sql) ke stack iso. Idempotent (guard).
        seed = ROOT / "frontend" / "database" / "seed.sql"
        if seed.exists():
            subprocess.run(["docker", "cp", str(seed), f"{ISO_DB_CONTAINER}:/tmp/{seed.name}"],
                           check=True, capture_output=True)
            r = subprocess.run(
                ["docker", "exec", ISO_DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
                 "-v", "ON_ERROR_STOP=1", "-f", f"/tmp/{seed.name}"],
                capture_output=True, text=True,
            )
            if r.returncode != 0:
                print("[ERROR] Gagal memuat seed.sql (iso):")
                print(r.stderr.strip())
                sys.exit(1)
            print("  [OK] Data realistis (seed.sql) dimuat ke iso db")


def iso_start_dev():
    """Dev server TERISOLASI di port 3100, build di .next-iso. TIDAK membunuh proses
    next lain (server utama :3000 tetap aman) dan TIDAK menyentuh .next utama."""
    print(f"\n=== [ISO] Next.js Dev Server (port {ISO_WEB_PORT}) ===")
    dist = (ROOT / "frontend" / ISO_DIST_DIR)
    if dist.exists():
        shutil.rmtree(dist, ignore_errors=True)
    (ROOT / "frontend" / "uploads").mkdir(exist_ok=True)
    print(f"  App (iso): http://localhost:{ISO_WEB_PORT}  (dir: frontend, build: {ISO_DIST_DIR})")
    print(f"  DB  (iso): localhost:{ISO_DB_PORT} (user={DB_USER}, db={DB_NAME})")
    print(f"  Log (iso): {ISO_LOG_DIR}")
    print("  Ctrl+C untuk berhenti\n")
    pkg, _ = find_pkg_mgr()
    # Tee stdout/stderr dev server -> console + iso-logs/next-dev.log (request API + console handler + error).
    logf = open(ISO_LOG_DIR / "next-dev.log", "a", encoding="utf-8", buffering=1)
    app = subprocess.Popen(
        [pkg, "run", "dev"], cwd=str(ROOT / "frontend"), env=iso_env(),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
    )

    def _tee():
        assert app.stdout is not None
        for line in app.stdout:
            sys.stdout.write(line)
            try:
                logf.write(line)
                logf.flush()
            except Exception:
                pass
    threading.Thread(target=_tee, daemon=True).start()

    def shutdown(*_):
        print("\n\nMenghentikan (iso)...")
        for proc, fh in _iso_followers:
            try:
                proc.terminate()
            except Exception:
                pass
            try:
                fh.close()
            except Exception:
                pass
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
            print(f"[WARN] Next.js (iso) berhenti (exit {app.returncode})")
            sys.exit(app.returncode or 0)
        time.sleep(1)


def iso_down():
    """Hentikan + bersihkan stack terisolasi (container DB iso + folder .next-iso).
    Tidak menyentuh stack utama. Dev server iso (kalau jalan) berhenti dengan Ctrl+C
    di terminalnya sendiri."""
    print("\n=== [ISO] Hentikan stack terisolasi ===")
    subprocess.run(["docker", "rm", "-f", ISO_DB_CONTAINER], capture_output=True)
    dist = (ROOT / "frontend" / ISO_DIST_DIR)
    if dist.exists():
        shutil.rmtree(dist, ignore_errors=True)
    print(f"[OK] Container {ISO_DB_CONTAINER} dihapus + {ISO_DIST_DIR} dibersihkan.")


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


def kill_procs_under(dir_path: Path):
    """Windows: hentikan proses yang mengunci file di bawah dir_path. Tiga kelas:
      1) exe-nya ADA di bawah dir_path (mis. next.exe di node_modules/.bin), DAN
      2) exe global (node.exe/bun) tapi CommandLine-nya merujuk dir_path, DAN
      3) node/bun/next/esbuild yang ME-LOAD modul native (*.node, mis.
         tailwindcss-oxide...node / next-swc...node) dari dir_path. File .node
         di-map sebagai IMAGE -> menghapusnya kena 'Access is denied' (WinError 5),
         BUKAN sharing violation. Proses ini sering lolos dari query CIM karena
         exe + CommandLine-nya tak menyebut dir_path sama sekali (mis. dijalankan
         lewat `bun run dev` yang CommandLine-nya cuma "bun run dev"). Dideteksi
         lewat Process.Modules: modul yang ter-load punya FileName di bawah dir_path.
    pgrep/pkill (Unix) tak membunuh proses native Windows ini."""
    if sys.platform != "win32":
        return
    target = str(dir_path).replace("/", "\\")
    ps = (
        "$t='" + target + "';"
        # (1)+(2): exe di bawah target ATAU CommandLine menyebut target.
        "Get-CimInstance Win32_Process | Where-Object { "
        "($_.ExecutablePath -and $_.ExecutablePath.StartsWith($t)) -or "
        "($_.CommandLine -and $_.CommandLine -like ('*'+$t+'*')) "
        "} | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} };"
        # (3): node/bun/next/esbuild yang me-load modul native dari target. Dibatasi
        # nama proses ini supaya tidak ikut membunuh editor (VS Code dll) yang
        # kebetulan me-load modul yang sama.
        "Get-Process -Name node,bun,next-server,esbuild -ErrorAction SilentlyContinue | "
        "ForEach-Object { $p=$_; try { if ($p.Modules | Where-Object "
        "{ $_.FileName -and $_.FileName.StartsWith($t) }) "
        "{ Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } } catch {} }"
    )
    subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True)
    time.sleep(2)


def purge_trash():
    """Buang husk node_modules/.next lama di ROOT/.trash (sisa rename-aside run
    sebelumnya). Sebagian mungkin masih dikunci editor -> ignore_errors; yang sudah
    dilepas akan terhapus, sisanya dicoba lagi run berikutnya."""
    trash = ROOT / ".trash"
    if not trash.is_dir():
        return
    for h in trash.glob("locked-*"):
        shutil.rmtree(h, ignore_errors=True)
    try:
        trash.rmdir()  # hanya sukses bila .trash sudah kosong
    except OSError:
        pass


def move_aside(d: Path):
    """Pindahkan dir terkunci ke ROOT/.trash/locked-<n>. Rename direktori = operasi
    METADATA: berhasil walau ada file ter-map sebagai image (*.node) di dalamnya,
    selama satu volume -- inilah jalan keluar saat lock-holder TAK boleh dibunuh
    (mis. VS Code memegang tailwindcss-oxide...node lewat ekstensi Tailwind). Setelah
    pindah, path asli bebas -> install ulang jalan; husk dibersihkan purge_trash()
    run berikutnya saat editor sudah melepas. Return Path baru, atau None bila rename
    gagal (mis. beda volume / handle ke dir-nya sendiri terbuka)."""
    trash = ROOT / ".trash"
    trash.mkdir(exist_ok=True)
    for i in range(1, 1000):
        cand = trash / f"locked-{i}"
        if cand.exists():
            continue
        try:
            os.rename(d, cand)
        except OSError:
            return None
        shutil.rmtree(cand, ignore_errors=True)  # buang yg bisa; sisakan file terkunci
        return cand
    return None


def rmtree_robust(d: Path):
    """rmtree tahan-banting untuk Windows. Tiga lapis penanganan lock:
      1) retry + reset read-only + backoff menaik -- lock transien dari proses yang
         baru saja di-kill (OS butuh ratusan ms meng-unmap image *.node);
      2) kill ulang proses pe-lock (bun/next/esbuild) lalu rmtree pamungkas;
      3) kalau MASIH terkunci -- lock-holder yang sengaja TIDAK kita bunuh, mis. VS
         Code yang me-load *.node lewat ekstensi Tailwind -- pindahkan dir ke
         ROOT/.trash supaya path bebas; husk dibersihkan run berikutnya.
    Hanya raise bila ketiga lapis gagal (mis. rename beda-volume)."""
    def _onexc(func, path, _exc):
        # File read-only (umum di node_modules/.bin & cache) -> buka write-bit, ulang.
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
        except OSError:
            pass  # masih dipegang proses hidup; serahkan ke lapis berikut
    # Lapis 1: retry dengan backoff.
    for attempt in range(6):
        try:
            shutil.rmtree(d, onexc=_onexc)
        except OSError:
            pass
        if not d.exists():
            return
        time.sleep(0.5 * (attempt + 1))  # 0.5, 1.0, 1.5, 2.0, 2.5s -> beri OS waktu unmap
    # Lapis 2: kill ulang proses pe-lock, rmtree sekali lagi.
    kill_procs_under(d)
    shutil.rmtree(d, onexc=_onexc)
    if not d.exists():
        return
    # Lapis 3: lock-holder tak-bisa/tak-boleh dibunuh (editor) -> pindahkan dir.
    aside = move_aside(d)
    if aside is not None:
        print(f"  [!] {d.name} dikunci editor (VS Code) -> dipindah ke .trash/{aside.name} "
              f"(install ulang tetap jalan; husk dibersihkan run berikutnya)")
        return
    raise RuntimeError(
        f"Gagal menghapus {d}: terkunci proses yang tak bisa dihentikan dan tak bisa\n"
        f"  dipindah (beda volume?). Tutup dev server + editor yang membuka folder ini,\n"
        f"  lalu ulangi --clean."
    )


def clean():
    """Hapus artefak build (node_modules, .next) DAN reset DB.

    --clean dipakai saat user mau benar-benar mulai dari nol: kode di-rebuild
    ulang dan database di-recreate dari skema app dir aktif. Sebelumnya hanya menghapus
    node_modules / .next, jadi data lama (mis. user dummy schema lama yang
    masih pakai kolom 'name') tetap nyangkut dan menyebabkan login gagal.
    """
    print("\n=== Bersihkan (kode + database) ===")
    # Sapu husk node_modules/.next lama (rename-aside run sebelumnya) yang kini
    # mungkin sudah dilepas editor.
    purge_trash()
    # WINDOWS: proses next/bun yang masih jalan mengunci node_modules/.bin/next.exe
    # -> rmtree kena PermissionError WinError 5. Hentikan proses + container dulu.
    kill_stale_next_processes()
    kill_stale_app_container()
    kill_procs_under(APP_DIR / "node_modules")
    for d in [APP_DIR / "node_modules", APP_DIR / ".next"]:
        if d.exists():
            rmtree_robust(d)
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
        rmtree_robust(next_dir)
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
    iso = "--iso" in args
    if "--new" in args or iso:
        APP_DIR = ROOT / "frontend"  # iso selalu pakai frontend (app naskah)
    print("=" * 50)
    print(f"  SHI Dashboard  ({sys.platform})")
    print(f"  App dir: {APP_DIR.name}{'  [STACK TERISOLASI]' if iso else ''}")
    print("=" * 50)

    # --- Stack TERISOLASI: DB+web sendiri, terpisah dari stack utama ---
    if iso:
        ensure_docker()
        if "--stop" in args:
            iso_down()
            return
        iso_logs_init()
        iso_db_up()
        iso_db_logs_follow()   # mulai rekam query DB SEBELUM load schema -> seed ikut tercatat
        empty = "--seed" not in args  # default EMPTY; --seed = data demo penuh
        iso_load_schema(empty)
        install_deps()
        if not empty:
            pkg, _ = find_pkg_mgr()
            print("  Backfill SPI semua proyek (iso)...")
            run([pkg, "run", "db:backfill-spi"], cwd=(ROOT / "frontend"), env=iso_env())
        iso_start_dev()
        return

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

    # frontend: muat data operasional realistis (seed.sql, ~200 proyek) kecuali
    # --empty. Idempotent (guard IF NOT EXISTS tb_proyek). Pengganti demo inline
    # lama init.sql; no-op utk frontend_backup (pakai db:seed sendiri).
    if "--empty" not in args:
        load_seed_frontend(DB_NAME)

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
