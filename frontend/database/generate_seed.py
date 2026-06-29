# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Generator seed realistis PT Smart Home Inovasi (SHI) -> frontend/database/seed.sql

Tujuan: rombak seed demo menjadi RIWAYAT OPERASI yang realistis dan konsisten:
  - Model TIM TETAP (kecil): PT SHI punya N_TECHS teknisi; tiap orang mengerjakan 1 job
    pada satu waktu (CAPACITY=1) secara BERURUTAN dgn jeda bench. Riwayat MULTI-TAHUN
    (YEARS_HISTORY) -> ~400 proyek total (mayoritas selesai + ~N_TECHS aktif utk
    dashboard EWS). Volume = N_TECHS x kerapatan (BENCH_GAP), bukan menumpuk konkurensi.
  - Klien retensi: sebagian klien (developer/hotel/RS/pemerintah/mall/pabrik) punya
    BANYAK proyek; perorangan sedikit.
  - Penjadwal (`FixedRoster` + heap di build_projects): teknisi bebas paling awal
    mengambil proyek berikutnya -> konkurensi selalu <= N_TECHS, tak ada tabrakan.
    Rekrut masuk bertahap di awal riwayat (kisah pertumbuhan tim 5 -> N_TECHS).
  - TANPA status 'on-hold' (perusahaan tidak menunda pekerjaan).

Determinisme: random.Random(SEED) tetap -> output identik tiap run. Tanggal ditulis
relatif `CURRENT_DATE + N` supaya data selalu "segar" saat seed dimuat run.py.
project_health TIDAK ditulis di sini -- dihitung db:backfill-spi (recalculateSPI).

Jalankan:  python frontend/database/generate_seed.py
           (atau: uv run frontend/database/generate_seed.py)
"""
from __future__ import annotations

import datetime
import math
import random
import re
from pathlib import Path

# ============================ KONFIGURASI ============================
SEED = 20260619
# Model TIM TETAP (kecil): PT SHI punya N_TECHS teknisi; tiap orang 1 job pada satu
# waktu (CAPACITY=1) dan mengerjakan proyek BERURUTAN dgn jeda bench. Riwayat MULTI-
# TAHUN -> ~400 proyek total (mayoritas selesai + N_TECHS aktif utk EWS). Volume diatur
# N_TECHS x kerapatan (BENCH_GAP), BUKAN menumpuk konkurensi. 400 job/2.5thn = operasi
# kecil -> tim kecil (25 teknisi utk 400 job = nganggur). Peak konkurensi/teknisi = 1.
YEARS_HISTORY = 2.5                # rentang riwayat ke belakang (multi-tahun)
N_TECHS = 6                        # tim TETAP kecil (5 base + 1 rekrut) -> ~400 proyek / 2.5 thn
BENCH_GAP = (5, 11)                # jeda hari antar proyek/teknisi; >=2 jaga 1-job + atur kerapatan ke ~400 (lebar dikit: faktor jadwal kini lebih pendek -> kompensasi biar ~400)
MAX_PROJECTS = 3000                # pengaman ukuran seed.sql
SPI_CAP_PY = 2                     # cermin SPI_CAP di spiCalculator.ts (utk estimasi SPI di ringkasan)
NOMINAL_TODAY = datetime.date(2026, 6, 19)   # anchor kode proyek (kosmetik)
OUT = Path(__file__).parent / "seed.sql"
PW_HASH = "$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6"  # password123

# id user dasar (di-seed init.sql): manajer 1-3, teknisi 4-8
MANAGERS = [1, 2, 3]               # admin, budi, diana
MANAGER_W = [1, 4, 3]             # budi PM utama, diana kedua, admin jarang
BASE_TECHS = [4, 5, 6, 7, 8]      # rizky, andi, reza, fajar, hendra
USED_EMAILS = {
    "admin@shi.co.id", "budi@shi.co.id", "diana@shi.co.id", "rizky@shi.co.id",
    "andi@shi.co.id", "reza@shi.co.id", "fajar@shi.co.id", "hendra@shi.co.id",
}

rng = random.Random(SEED)

# ============================ DATA EKSTERNAL (seed_data/*.csv) ============================
# Semua DATA (nama, klien, koordinat, template tugas, frasa) ada di file teks supaya
# generator ini tetap ramping (logika saja) dan data mudah diedit tanpa sentuh kode.
# Format: delimiter '|', baris '#'/kosong diabaikan. Koordinat boleh diisi lat/lon
# atau di-parse dari URL Google Maps (pola @lat,lon atau q=lat,lon).
DATA_DIR = Path(__file__).parent / "seed_data"
_COORD_RE = re.compile(r"(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)")


def _rows(fname):
    """Baca file delimited '|' -> list baris (list field), lewati komentar/kosong."""
    out = []
    for line in (DATA_DIR / fname).read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s and not s.startswith("#"):
            out.append([c.strip() for c in s.split("|")])
    return out


def _lines(fname):
    out = []
    for line in (DATA_DIR / fname).read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s and not s.startswith("#"):
            out.append(s)
    return out


def _coords(lat, lon, maps_url):
    """Pakai lat/lon kalau ada; kalau kosong, parse dari URL Google Maps."""
    if lat and lon:
        return float(lat), float(lon)
    m = _COORD_RE.search(maps_url or "")
    if not m:
        raise ValueError(f"Klien/area tanpa koordinat (lat/lon kosong & URL tak ada koordinat): {maps_url!r}")
    return float(m.group(1)), float(m.group(2))


def _load_tech_names():
    """Daftar nama teknisi rekrutan terkurasi (urut, dipakai saat _hire)."""
    return _lines("tech_names.csv")


def _load_person_pools():
    """Pool nama klien perorangan (first_m/first_f/last) dari client_persons.csv."""
    fm, ff, ln = [], [], []
    for kind, val in _rows("client_persons.csv"):
        (fm if kind == "first_m" else ff if kind == "first_f" else ln).append(val)
    return fm, ff, ln


def _load_clients_pool():
    pool = []
    for nama, tipe, alamat, telp, email, notes, lat, lon, murl, weight, favs in _rows("clients.csv"):
        la, lo = _coords(lat, lon, murl)
        pool.append((nama, tipe, alamat, telp, email, notes, la, lo, int(weight),
                     [f.strip() for f in favs.split(",") if f.strip()]))
    return pool


def _load_areas():
    return [(area, *_coords(lat, lon, murl)) for area, lat, lon, murl in _rows("residential_areas.csv")]


def _load_task_templates():
    d = {}
    for cat, sort, nama, desc, is_sv, est in _rows("task_templates.csv"):
        d.setdefault(cat, []).append((int(sort), nama, desc, is_sv.lower() == "true", int(est)))
    return {cat: [(nm, ds, sv, e) for _, nm, ds, sv, e in sorted(rows)] for cat, rows in d.items()}


def _load_project_names():
    d = {}
    for cat, tmpl in _rows("project_names.csv"):
        d.setdefault(cat, []).append(tmpl)
    return d


TECH_NAMES = _load_tech_names()                 # nama teknisi rekrutan terkurasi <- tech_names.csv
FIRST_M, FIRST_F, LAST = _load_person_pools()   # nama klien perorangan <- client_persons.csv

ENTERPRISE = _load_clients_pool()      # klien enterprise + koordinat <- clients.csv
INDIV_AREAS = _load_areas()            # area perumahan klien perorangan <- residential_areas.csv

TASK_TEMPLATES = _load_task_templates()    # tugas per kategori (urut) <- task_templates.csv
NAME_TEMPLATES = _load_project_names()      # nama proyek per kategori  <- project_names.csv

# nilai proyek (rupiah) per kategori: (small_min, small_max, med_min, med_max, large_min, large_max)
VALUE = {
    "instalasi": (8, 25, 30, 90, 110, 400), "security": (15, 40, 45, 120, 130, 350),
    "monitoring": (18, 45, 50, 110, 120, 300), "networking": (12, 35, 40, 100, 110, 280),
    "maintenance": (4, 15, 18, 50, 55, 150), "perbaikan": (3, 12, 15, 40, 45, 120),
    "upgrade": (10, 30, 35, 90, 100, 250), "lainnya": (5, 20, 25, 70, 80, 200),
}
# durasi (hari kalender) per skala -- instalasi CCTV/smart-home realistis: rumah
# 1-3 hari, komersil 3-8 hari, besar (hotel/RS/mall) ~2-3 minggu. Pendek -> siklus
# per teknisi pendek -> throughput perusahaan ~3-4 proyek/hari dengan ~N_TECHS orang.
DUR = {"small": (1, 3), "medium": (2, 6), "large": (7, 14)}
# distribusi skala per tipe klien
SCALE_DIST = {
    "developer": ["small", "small", "medium", "medium", "large"],
    "hotel": ["medium", "medium", "large", "large", "small"],
    "hospital": ["medium", "medium", "large", "small"],
    "bank": ["small", "medium", "medium", "large"],
    "govt": ["medium", "large", "large", "small"],
    "mall": ["medium", "medium", "large", "large"],
    "warehouse": ["medium", "medium", "large", "small"],
    "factory": ["medium", "medium", "large", "small"],
    "campus": ["medium", "large", "small"],
    "school": ["small", "small", "medium"],
    "retail": ["small", "medium", "medium", "large"],
    "office": ["small", "small", "medium"],
    "fnb": ["small", "small", "medium"],
    "individual": ["small", "small", "small"],
}
TARGET_DESC = {cat: desc for cat, desc in _rows("target_desc.csv")}   # <- target_desc.csv
CONSTRAINTS_POOL = _lines("constraints.txt")                          # catatan kendala <- constraints.txt
ESC_POOL = [(t, d, p) for t, d, p in _rows("escalations.csv")]        # eskalasi <- escalations.csv

# Faktor jadwal proyek SELESAI = durasi_aktual / durasi_rencana. SPI akhir = 1/faktor:
# faktor <1 -> selesai lebih cepat (SPI>1); >1 -> telat (SPI<1). Sebaran DICONDONGKAN
# ke "sedikit telat" (mayoritas faktor >1) supaya RATA-RATA SPI portofolio ~0.9, bukan
# ~1.0. Tetap BERVARIASI (sebagian cepat SPI>1) -> riwayat tak monoton/"1 semua".
# Rata-rata SPI = AVG(spi_value) SEMUA proyek (dashboard.ts), didominasi proyek selesai
# -> SET INI yang menentukan angkanya. Dipakai build_tasks utk geser waktu penyelesaian.
# GRANULARITAS: tiap proyek mengalikan faktor dgn jitter KONTINU (SCHED_JITTER) -> durasi
# aktual pecahan -> SPI tak pernah mendarat di nilai "bulat" (1.500, 1.200). E[jitter]~1
# -> rata-rata portofolio tak bergeser. Diukur tanpa floor di spiCalculator (sub-hari).
# CITRA SEHAT: BASIS semua HIJAU (faktor < ~1.0, jitter sempit -> SPI basis selalu >=0.95).
# Proyek Kritis/Waspada BUKAN dari sebaran acak -> DIPAKSA tepat N_RED + N_AMBER oleh
# enforce_health_distribution (override durasi RENCANA beberapa proyek terpilih). Jadi
# jumlah merah/kuning DETERMINISTIK (mis. 3 + 2), bukan ~seperempat board. Aktual tetap
# granular (sub-hari) -> SPI tak "bulat".
SCHED_FACTORS = [0.88, 0.91, 0.94, 0.97, 0.99]
SCHED_JITTER = (0.98, 1.02)        # sempit -> faktor*jitter <= ~1.01 -> SPI basis hijau (>=0.95)


def pick(seq):
    return rng.choice(seq)


def weighted_scale(ctype):
    return pick(SCALE_DIST.get(ctype, SCALE_DIST["office"]))


def make_value(category, scale):
    s = VALUE[category]
    lo, hi = {"small": (s[0], s[1]), "medium": (s[2], s[3]), "large": (s[4], s[5])}[scale]
    juta = rng.randint(lo, hi)
    # bulatkan ke ratusan ribu/jutaan agar terlihat nyata
    return juta * 1_000_000 + rng.choice([0, 0, 0, 500_000, 250_000, 750_000])


# ============================ BANGUN KLIEN ============================
def build_clients():
    clients = []
    cid = 0
    for (nama, tipe, alamat, telp, email, notes, lat, lon, w, favs) in ENTERPRISE:
        cid += 1
        short = nama.replace("PT ", "").replace("CV ", "").replace("Yayasan ", "")
        short = short.split(" (")[0]
        clients.append(dict(id=cid, nama=nama, short=short, tipe=tipe, alamat=alamat, telp=telp,
                            email=email, notes=notes, lat=lat, lon=lon, weight=w, favs=favs,
                            created_by=pick(MANAGERS)))
    # perorangan -- nama depan UNIK antar klien (tak ada duplikasi depan); gelar
    # mengikuti gender nama depan (Bp. utk pria, Ibu utk wanita).
    n_indiv = 34
    persons = [("Bp.", f) for f in FIRST_M] + [("Ibu", f) for f in FIRST_F]
    rng.shuffle(persons)
    used_first = set()
    pi = 0
    for _ in range(n_indiv):
        cid += 1
        while pi < len(persons) and persons[pi][1] in used_first:
            pi += 1
        title, fn = persons[pi]
        pi += 1
        used_first.add(fn)
        ln = pick(LAST)
        area, blat, blon = pick(INDIV_AREAS)
        blok = f"{pick('ABCDEF')}-{rng.randint(1, 28)}"
        nama = f"{title} {fn} {ln}"
        emailname = f"{fn.lower()}.{ln.lower()}"
        clients.append(dict(
            id=cid, nama=nama, short=f"{title} {fn}", tipe="individual",
            alamat=f"{area} Blok {blok}, Sleman", telp=f"08{rng.randint(11,89)}{rng.randint(1000000,9999999)}",
            email=f"{emailname}{rng.randint(1,99)}@gmail.com",
            notes=pick(["Klien residensial, proyek smart home unit tunggal.",
                        "Pemilik rumah, ingin automasi & keamanan dasar.",
                        "Referral dari klien lama, proyek kecil residensial."]),
            lat=round(blat + rng.uniform(-0.01, 0.01), 6), lon=round(blon + rng.uniform(-0.01, 0.01), 6),
            weight=1, favs=["instalasi", "security", "maintenance"], created_by=pick(MANAGERS)))
    return clients


# ============================ PENJADWAL TIM TETAP (1 teknisi = 1 job) ============================
# PT SHI punya N_TECHS teknisi TETAP. Tiap teknisi mengerjakan proyek BERURUTAN
# (back-to-back) sepanjang riwayat -> konkurensi selalu ~N_TECHS (tiap orang 1 job),
# throughput perusahaan = N_TECHS / siklus-rata2. Rekrutan masuk bertahap di ~60%
# awal riwayat (kisah pertumbuhan tim 5 -> N_TECHS). Tidak ada lembur/tabrakan.
class FixedRoster:
    def __init__(self, span_days):
        self.members = []   # (tid, join_off): teknisi + tanggal gabung (offset)
        self.hires = []
        for tid in BASE_TECHS:                  # 5 base tersedia sejak awal riwayat
            self.members.append((tid, -span_days))
        n_hire = max(0, N_TECHS - len(BASE_TECHS))
        ramp = max(1, int(span_days * 0.6))     # rekrut tersebar di ~60% awal riwayat
        for k in range(n_hire):
            tid = 9 + k
            join = -span_days + int((k + 1) / (n_hire + 1) * ramp)
            self.members.append((tid, join))
            # nama teknisi terkurasi BERURUTAN (pria, nama depan unik); fallback bernomor.
            nama = TECH_NAMES[k] if k < len(TECH_NAMES) else f"Teknisi {tid}"
            parts = nama.split()
            base = f"{parts[0].lower()}.{parts[-1].lower()}"
            email, nn = f"{base}@shi.co.id", 2
            while email in USED_EMAILS:
                email = f"{base}{nn}@shi.co.id"
                nn += 1
            USED_EMAILS.add(email)
            self.hires.append(dict(id=tid, nama=nama, email=email, hire_off=join))


# ============================ SINTESIS PROYEK ============================
def _client_picker(clients):
    """Pemilih klien: jamin tiap klien >=1 proyek (cakupan) dulu, lalu berbobot (retensi)."""
    queue = list(clients)
    rng.shuffle(queue)
    weighted = [c for c in clients for _ in range(c["weight"])]
    def nxt():
        return queue.pop() if queue else pick(weighted)
    return nxt


def build_projects(clients):
    import heapq
    span = int(YEARS_HISTORY * 365)
    roster = FixedRoster(span)
    next_client = _client_picker(clients)
    # bucket kesehatan utk proyek AKTIF (manufaktur sebaran dashboard EWS).
    # SEHAT-saja (tanpa 'red'/'unrated'): perusahaan jaga citra -> proyek baru-jalan
    # TIDAK boleh tampil merah/0.000/Belum-Dinilai di tabel.
    # Proyek AKTIF: HIJAU/di-depan saja (tanpa amber/red) -> board aktif bersih, dan
    # total Waspada/Kritis portofolio = TEPAT yg dipaksa enforce_health_distribution
    # pada proyek SELESAI (tak ada amber aktif yg menambah hitungan).
    health_buckets = (["green"] * 60 + ["ahead"] * 40)
    projects = []
    pid = 0
    # heap (free_off, tid, prev_end): proses teknisi yang bebas paling awal -> rantai
    # kronologis. Tiap teknisi mengerjakan proyek SELESAI beruntun (jeda BENCH_GAP),
    # lalu SATU proyek "berjalan" (aktif) yang sedang dikerjakan hari ini.
    heap = [(jo, tid, jo - 1) for tid, jo in roster.members]
    heapq.heapify(heap)
    while heap and pid < MAX_PROJECTS:
        free_off, tid, prev_end = heapq.heappop(heap)
        if free_off > 0:
            continue  # teknisi sudah punya proyek aktif menembus hari ini -> stop rantai
        client = next_client()
        category = pick(client["favs"])
        scale = weighted_scale(client["tipe"])
        dlo, dhi = DUR[scale]
        dur = rng.randint(dlo, dhi)
        # faktor jadwal x jitter kontinu -> durasi AKTUAL pecahan (sub-hari). SPI akhir =
        # rencana/aktual = 1/(faktor*jitter): kontinu -> granular, tak ada 1.500/1.200.
        _sf = pick(SCHED_FACTORS) * rng.uniform(*SCHED_JITTER)
        _dur_float = max(0.5, dur * _sf)               # durasi aktual presisi (hari, pecahan)
        actual_dur = max(1, round(_dur_float))         # versi BULAT utk penjadwalan (heap/jeda)
        _spi_est = min(round(dur / _dur_float, 4), SPI_CAP_PY)   # SPI yg akan dihitung recalc

        start_off = free_off + rng.randint(*BENCH_GAP)   # mulai setelah jeda dari proyek lalu
        if start_off + actual_dur >= 0:
            # PROYEK BERJALAN (aktif), MID-FLIGHT: hari ini sudah di tengah durasi -> PV>0
            # -> SPI dinilai (EWS tampil merah/kuning/hijau, bukan "Belum Dinilai" semua).
            # Mundur 'elapsed' hari, dibatasi ruang sebelum proyek selesai terakhir (anti-tabrakan).
            room = -1 - prev_end
            if room < 1:
                start_off = 0                            # tak ada ruang -> baru mulai hari ini
            else:
                start_off = -rng.randint(1, min(max(1, dur - 1), room))
            if start_off + dur < 1:
                dur = 1 - start_off + rng.randint(0, 4)  # pastikan end menembus hari ini
            end_off = start_off + dur
            actual_end, eff_dur, status = end_off, dur, "active"
        else:
            end_off = start_off + dur                    # tanggal akhir RENCANA (= end_date)
            actual_end, eff_dur, status = start_off + actual_dur, actual_dur, "completed"

        # fase + survey approval
        survey_len = max(2, min(dur // 4, 10))
        if status == "active" and rng.random() < 0.25 and start_off > -survey_len:
            phase, survey_approved, sap_off = "survey", False, None
        else:
            phase, survey_approved = "execution", True
            sap_off = start_off + survey_len

        manager = rng.choices(MANAGERS, weights=MANAGER_W)[0]
        name = pick(NAME_TEMPLATES[category]).format(c=client["short"])
        bucket = pick(health_buckets) if status == "active" and phase == "execution" else None

        pid += 1
        projects.append(dict(
            id=pid, code=None, name=name, client=client, category=category, scale=scale,
            start_off=start_off, end_off=end_off, dur=dur, actual_dur=eff_dur, actual_end=actual_end,
            status=status, phase=phase, survey_approved=survey_approved, sap_off=sap_off,
            manager=manager, team=[tid], value=make_value(category, scale), bucket=bucket,
            target=TARGET_DESC[category], actual_dur_float=_dur_float, spi_est=_spi_est,
        ))
        if status == "completed":
            # bebas lagi pada actual_end; jeda BENCH_GAP ditambah saat pop berikutnya
            heapq.heappush(heap, (actual_end, tid, actual_end))

    # id + kode proyek mengikuti urutan KRONOLOGIS (start_off) -> rapi & stabil
    projects.sort(key=lambda p: (p["start_off"], p["id"]))
    seq_per_month = {}
    for newid, p in enumerate(projects, 1):
        p["id"] = newid
        nom = NOMINAL_TODAY + datetime.timedelta(days=p["start_off"])
        ym = f"{str(nom.year)[2:]}{nom.month:02d}"
        seq_per_month[ym] = seq_per_month.get(ym, 0) + 1
        p["code"] = f"SHI-{ym}{seq_per_month[ym]:03d}"
    return projects, roster


# ============================ SINTESIS TUGAS ============================
def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def split_off(off_exact):
    """Offset pecahan (hari, boleh negatif) -> (hari_floor, jam, menit) utk tsexpr.
    Menyimpan komponen sub-hari supaya recalc (tanpa floor) menghitung durasi aktual
    presisi -> SPI granular. floor (bukan int) supaya benar utk offset negatif."""
    day = math.floor(off_exact)
    rem = off_exact - day                          # 0..1
    hh = clamp(int(rem * 24), 0, 23)
    mm = clamp(int((rem * 24 - hh) * 60), 0, 59)
    return day, hh, mm


# ============================ DISTRIBUSI KESEHATAN PORTOFOLIO ============================
# Citra perusahaan SEHAT: hanya SEDIKIT proyek bermasalah. Paksa TEPAT N_RED proyek SELESAI
# jadi MERAH (Kritis, SPI<0.85) + N_AMBER jadi KUNING (Waspada, 0.85-0.95), sisanya HIJAU.
# Caranya: override durasi RENCANA (end_date) -> SPI = rencana/aktual turun ke pita target.
# Durasi AKTUAL (actual_dur_float, actual_end, jadwal heap) TIDAK disentuh -> tak ada riak
# penjadwalan. Proyek dipilih TERSEBAR kronologis. Dipanggil SEBELUM build_tasks supaya
# due-date tugas mengikuti durasi rencana yang baru.
N_RED = 3
N_AMBER = 2


def _force_spi_band(p, lo, hi):
    """Setel durasi RENCANA proyek agar SPI (=rencana/aktual) mendarat di [lo, hi).
    True bila ada durasi-hari integer di pita itu (proyek cukup panjang)."""
    af = max(1.0, p["actual_dur_float"])           # durasi AKTUAL (hari, pecahan) -- TETAP
    lo_d = max(1, math.ceil(lo * af))              # durasi integer terkecil dgn SPI >= lo
    hi_d = math.ceil(hi * af) - 1                  # terbesar dgn SPI < hi
    if hi_d < lo_d:
        return False                               # proyek terlalu pendek utk pita ini
    new_dur = min(max(int(round((lo + hi) / 2 * af)), lo_d), hi_d)
    p["dur"] = new_dur
    p["end_off"] = p["start_off"] + new_dur        # end_date RENCANA (actual_end tak berubah)
    p["spi_est"] = min(round(new_dur / af, 4), SPI_CAP_PY)
    return True


def enforce_health_distribution(projects):
    completed = sorted((p for p in projects if p["status"] == "completed"),
                       key=lambda p: p["start_off"])
    n = len(completed)
    if n == 0:
        return (0, 0)
    plan = [(0.62, 0.84)] * N_RED + [(0.86, 0.94)] * N_AMBER   # merah dulu, lalu kuning
    m = len(plan)
    used = set()
    nred = namber = 0
    for k, (lo, hi) in enumerate(plan):
        center = min(n - 1, int(round((k + 0.5) / m * n)))     # posisi tersebar merata
        placed = False
        for off in range(n):                                   # spiral keluar dari center
            for i in (center + off, center - off):
                if 0 <= i < n and i not in used and _force_spi_band(completed[i], lo, hi):
                    used.add(i)
                    if hi <= 0.85:
                        nred += 1
                    else:
                        namber += 1
                    placed = True
                    break
            if placed:
                break
    return (nred, namber)


def build_tasks(projects):
    tasks = []
    tid = 0
    for p in projects:
        tmpl = TASK_TEMPLATES[p["category"]]
        # proyek besar pakai semua tugas; kecil bisa lebih ringkas
        n = len(tmpl) if p["scale"] != "small" else max(4, len(tmpl) - rng.randint(0, 2))
        chosen = tmpl[:n]
        total = len(chosen)
        s, e, dur = p["start_off"], p["end_off"], p["dur"]

        # durasi AKTUAL dari penjadwal (FixedRoster). Proyek selesai: tugas 'done'
        # ditebar PROPORSIONAL sepanjang durasi aktual PECAHAN -> tugas TERAKHIR
        # mendarat tepat di start + durasi_aktual_float (sub-hari) -> MAX(status_changed_at)
        # presisi & monoton -> recalc SPI = rencana/aktual GRANULAR (bukan 1.500/1.200).
        actual_dur_float = p["actual_dur_float"] if p["status"] == "completed" else float(dur)

        # tentukan jumlah 'done' sesuai status/kesehatan
        if p["status"] == "completed":
            done = total
        elif p["status"] == "on-hold":
            done = clamp(int(total * rng.uniform(0.2, 0.6)), 1, total - 1)
        else:  # active -- bucket SEHAT saja (tanpa red/unrated). SPI dijamin >= floor.
            elapsed = clamp(-s, 1, dur)
            pv_frac = elapsed / dur
            # survey (bucket None) diperlakukan on-track (hijau): survei berjalan wajar.
            bucket = p["bucket"] or "green"
            tgt = {"amber": 0.90, "green": 1.05, "ahead": 1.35}[bucket]
            # floor diberi margin di atas ambang kategori (0.85/0.95) supaya pembulatan
            # PV 2-desimal di recalculateSPI tak menjatuhkan bucket ke bawah ambang.
            floor = {"amber": 0.87, "green": 0.96, "ahead": 1.0}[bucket]
            # done >= 1 -> EV>0 -> TAK PERNAH SPI 0.000. Naikkan done bila pembulatan
            # menjatuhkan SPI di bawah floor bucket -> tak ada proyek aktif MERAH (<0.85).
            done = clamp(round(tgt * pv_frac * total), 1, total)
            while done < total and (done / total) / pv_frac < floor:
                done += 1

        working_idx = done if done < total else None  # tugas berjalan berikutnya
        for idx, (nm, ds, is_sv, est) in enumerate(chosen):
            tid += 1
            due_off = s + round((idx + 1) / total * dur)
            assignee = p["team"][idx % len(p["team"])]
            if idx < done:
                st = "done"
                if p["status"] == "completed":
                    # stamp sub-hari proporsional; tugas terakhir = start + durasi_aktual_float
                    sc_off, sc_hh, sc_mm = split_off(s + (idx + 1) / total * actual_dur_float)
                    upd_off = sc_off
                else:
                    upd_off = clamp(due_off + rng.randint(-2, 1), s + 1, min(e, -1))
                    sc_off, sc_hh, sc_mm = upd_off, 14, 0
            elif idx == working_idx and p["status"] != "on-hold":
                st = "working_on_it"
                upd_off = clamp(-rng.randint(0, 3), s + 1, 0)
                sc_off, sc_hh, sc_mm = upd_off, 14, 0
            else:
                st = "to_do"
                upd_off = s
                sc_off, sc_hh, sc_mm = s, 14, 0
            tasks.append(dict(
                id=tid, proyek=p["id"], nama=nm, desc=ds, assigned=assignee, status=st,
                due_off=due_off, is_survey=is_sv, est=est, created_by=p["manager"],
                created_off=s, upd_off=upd_off, sc_off=sc_off, sc_hh=sc_hh, sc_mm=sc_mm,
            ))
        p["_task_ids"] = list(range(tid - total + 1, tid + 1))
        p["_total_tasks"] = total
        p["_done_tasks"] = done
    return tasks


# ============================ SEBAR SPI TEKNISI (task-based) ============================
# SPI per-TEKNISI (handler dashboard/users) = tugas-selesai / tugas-jatuh-tempo. Tanpa
# intervensi, tugas proyek aktif rampung tepat waktu -> SPI teknisi MENUMPUK ~1.0 (semua
# Baik). Fungsi ini MENYEBAR ke rentang RAG (Kritis/Waspada/Baik) dengan HANYA mengubah
# DUE DATE tugas proyek aktif:
#   - SPI target < 1: sebagian tugas belum-selesai dibuat SUDAH lewat tenggat (overdue).
#   - SPI target > 1: sebagian tugas selesai dibuat "selesai lebih awal" (tenggat di depan).
# TIDAK menyentuh jumlah 'done' -> KESEHATAN PROYEK (recalc done/total vs durasi) UTUH;
# TANPA rng -> stream deterministik tak bergeser. Target per proyek aktif (urut id).
# Stabil utk demo selama hari-ini di kisaran ~NOMINAL_TODAY+/-1 minggu (di luar itu drift).
# Urutan SPI yang DIINGINKAN (menaik) utk proyek-proyek aktif. SPI dapat-dicapai dibatasi
# done/total per proyek (due_cnt <= total), jadi tiap proyek dipasangkan ke target terdekat:
# proyek dgn headroom terbesar (done/total terkecil) diberi target terendah.
TECH_SPI_DESIRED = [0.67, 0.80, 0.90, 1.10, 1.33, 1.60]   # ~2 Kritis, 1 Waspada, 3 Baik->jauh-di-depan (cakup semua RAG, citra realistis)

def spread_active_tech_spi(projects, tasks):
    by_proj = {}
    for t in tasks:
        by_proj.setdefault(t["proyek"], []).append(t)
    active = sorted(
        [p for p in projects if p["status"] == "active" and p.get("_total_tasks")],
        key=lambda p: p["_done_tasks"] / max(1, p["_total_tasks"]),   # headroom (min SPI) menaik
    )
    spread = []
    for i, p in enumerate(active):
        desired = TECH_SPI_DESIRED[i % len(TECH_SPI_DESIRED)]
        done, total = p["_done_tasks"], p["_total_tasks"]
        # pilih jumlah tugas jatuh-tempo (1..total) yang SPI-nya (done/due_cnt) TERDEKAT ke desired
        due_cnt = min(range(1, total + 1), key=lambda d: abs(min(2.0, done / d) - desired))
        for idx, t in enumerate(sorted(by_proj.get(p["id"], []), key=lambda t: t["id"])):
            if idx < due_cnt:
                t["due_off"] = -(3 + (idx % 5))                # sudah jatuh tempo (lampau)
            else:
                t["due_off"] = 12 + (idx - due_cnt)            # belum jatuh tempo (depan)
        spread.append(round(min(2.0, done / due_cnt), 2))
    return sorted(spread)


# ============================ AKTIVITAS / LAPORAN / ESKALASI ============================
ACT_MSG = {
    "arrival": "Tiba di lokasi proyek", "start_work": "Mulai pengerjaan instalasi",
    "photo": "Dokumentasi foto progres", "note": "Catatan progres lapangan",
    "complete": "Tugas selesai dikerjakan", "pause": "Pekerjaan dijeda menunggu material",
}


def build_activities(projects, tasks):
    by_proj = {}
    for t in tasks:
        by_proj.setdefault(t["proyek"], []).append(t)
    acts, reports, escs = [], [], []
    aid = rid = eid = 0
    for p in projects:
        ptasks = by_proj.get(p["id"], [])
        done_tasks = [t for t in ptasks if t["status"] == "done"]
        work_tasks = [t for t in ptasks if t["status"] == "working_on_it"]
        s, e = p["start_off"], p["end_off"]
        hi = min(e, -1) if e < 0 else 0

        # aktivitas: ambil beberapa tugas done + working
        sample = (done_tasks[:4] + work_tasks)[:6]
        for t in sample:
            base = clamp(t["due_off"] + rng.randint(-3, 0), s, hi)
            seq = ["arrival", "start_work", "photo"]
            if t["status"] == "done":
                seq.append("complete")
            elif rng.random() < 0.5:
                seq.append("note")
            for k, atype in enumerate(seq):
                aid += 1
                acts.append(dict(id=aid, task=t["id"], user=t["assigned"], atype=atype,
                                 msg=ACT_MSG[atype], off=clamp(base, s, hi), hh=8 + k * 2,
                                 mm=rng.randint(0, 59)))

        # laporan harian (catatan kendala, mayoritas tanpa %)
        if rng.random() < 0.4 and ptasks:
            ndr = rng.randint(1, 2)
            used = set()
            for _ in range(ndr):
                rid += 1
                off = clamp(s + rng.randint(1, max(2, p["dur"])), s + 1, hi if hi > s else s + 1)
                while off in used:
                    off -= 1
                used.add(off)
                pct = None if rng.random() < 0.7 else round(rng.uniform(15, 70), 1)
                reports.append(dict(id=rid, proyek=p["id"], off=off, pct=pct,
                                    note=pick(CONSTRAINTS_POOL), by=p["manager"]))

        # eskalasi: proyek red/amber aktif + sebagian selesai (resolved)
        make_esc = ((p["status"] == "active" and p["bucket"] in ("red", "amber") and rng.random() < 0.6)
                    or (p["status"] == "completed" and rng.random() < 0.06))
        if make_esc and (done_tasks or work_tasks):
            eid += 1
            t = pick(work_tasks or done_tasks)
            title, desc, prio = pick(ESC_POOL)
            if p["status"] == "completed":
                est_status, res_off = "closed", clamp(t["due_off"] + rng.randint(1, 5), s + 1, hi)
            else:
                est_status, res_off = pick(["open", "open", "handled"]), None
            escs.append(dict(id=eid, task=t["id"], proyek=p["id"], by=t["assigned"], title=title,
                             desc=desc, status=est_status, prio=prio, res_off=res_off,
                             res_by=p["manager"], off=clamp(t["due_off"] + rng.randint(-2, 0), s, hi)))
    return acts, reports, escs


# ============================ EMIT SQL ============================
def q(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def dexpr(off):
    if off == 0:
        return "CURRENT_DATE"
    return f"CURRENT_DATE + {off}" if off > 0 else f"CURRENT_DATE - {-off}"


def tsexpr(off, hh, mm):
    return f"({dexpr(off)} + TIME '{hh:02d}:{mm:02d}')"


def chunked_insert(out, head, rows, size=80, tail=""):
    for i in range(0, len(rows), size):
        out.append(head + "\n" + ",\n".join(rows[i:i + size]) + tail + ";\n")


def emit(clients, projects, tasks, roster, acts, reports, escs):
    out = []
    out.append("-- =====================================================================")
    out.append("-- seed.sql -- DIGENERATE OTOMATIS oleh generate_seed.py. JANGAN EDIT TANGAN.")
    out.append(f"-- {len(projects)} proyek realistis ({YEARS_HISTORY} thn) | tim TETAP "
               f"{len(BASE_TECHS) + len(roster.hires)} teknisi (1 job/orang) | {len(clients)} klien | {len(tasks)} tugas")
    out.append("-- Guard: hanya jalan saat tb_proyek kosong (idempotent utk run.py).")
    out.append("-- project_health TIDAK di sini -- dihitung db:backfill-spi (recalculateSPI).")
    out.append("-- =====================================================================")
    out.append("DO $seed$\nBEGIN\nIF NOT EXISTS (SELECT 1 FROM tb_proyek) THEN\n")

    # --- teknisi rekrutan (base 8 sudah di init.sql) ---
    if roster.hires:
        out.append("  -- Teknisi direkrut seiring pertumbuhan volume (kapasitas terlampaui).")
        rows = [f"  ({h['id']}, {q(h['nama'])}, {q(h['email'])}, {q(PW_HASH)}, 'teknisi', TRUE, {tsexpr(h['hire_off'], 8, 0)})"
                for h in roster.hires]
        chunked_insert(out, "  INSERT INTO tb_user (id_user, nama, email, password, role, is_active, created_at) VALUES",
                       rows, tail=" ON CONFLICT (id_user) DO NOTHING")
        out.append("")

    # --- klien ---
    out.append("  -- Klien (enterprise retensi + perorangan).")
    rows = []
    for c in clients:
        rows.append(
            f"  ({c['id']}, {q(c['nama'])}, {q(c['alamat'])}, {q(c['telp'])}, {q(c['email'])}, "
            f"{q(c['notes'])}, {c['lat']}, {c['lon']}, {c['created_by']}, {tsexpr(-200, 9, 0)})")
    chunked_insert(out, "  INSERT INTO tb_klien (id_klien, nama_klien, alamat, no_telp, email, notes, latitude, longitude, created_by, created_at) VALUES", rows)
    out.append("")

    # --- proyek ---
    out.append("  -- Proyek (riwayat mundur: mayoritas selesai + sebagian aktif).")
    rows = []
    for p in projects:
        sap = tsexpr(p["sap_off"], 10, 0) if (p["survey_approved"] and p["sap_off"] is not None) else "NULL"
        sapby = str(p["manager"]) if p["survey_approved"] else "NULL"
        upd = tsexpr(p["end_off"], 16, 0) if p["status"] == "completed" else tsexpr(max(p["start_off"], -3), 12, 0)
        rows.append(
            f"  ({p['id']}, {q(p['code'])}, {q(p['name'])}, {q('Proyek ' + p['category'] + ' untuk ' + p['client']['nama'])}, "
            f"{p['client']['id']}, {dexpr(p['start_off'])}, {dexpr(p['end_off'])}, {q(p['status'])}, {q(p['phase'])}, "
            f"{q(p['category'])}, {p['value']}, {str(p['survey_approved']).upper()}, {sapby}, {sap}, "
            f"{q(p['target'])}, {p['manager']}, {tsexpr(p['start_off'], 8, 30)}, {upd})")
    chunked_insert(out, "  INSERT INTO tb_proyek (id_proyek, project_code, nama_proyek, description, id_klien, start_date, end_date, status, phase, category, project_value, survey_approved, survey_approved_by, survey_approved_at, target_description, created_by, created_at, updated_at) VALUES", rows)
    out.append("")

    # --- penugasan ---
    out.append("  -- Penugasan proyek (M:N) -- hasil penjadwalan kapasitas, tanpa tabrakan.")
    rows = []
    for p in projects:
        for tech in p["team"]:
            rows.append(f"  ({p['id']}, {tech}, {tsexpr(p['start_off'], 8, 0)})")
    chunked_insert(out, "  INSERT INTO tb_penugasan_proyek (id_proyek, id_user, assigned_at) VALUES", rows)
    out.append("")

    # --- tugas ---
    out.append("  -- Tugas (status konsisten dgn posisi waktu & kesehatan target).")
    rows = []
    for t in tasks:
        # status_changed_at: to_do belum berubah -> = waktu dibuat; selain itu pakai
        # stamp presisi (sub-hari utk proyek selesai -> SPI granular di recalc).
        if t["status"] == "to_do":
            sc = tsexpr(t["created_off"], 8, 0)
        else:
            sc = tsexpr(t["sc_off"], t["sc_hh"], t["sc_mm"])
        rows.append(
            f"  ({t['id']}, {t['proyek']}, {q(t['nama'])}, {q(t['desc'])}, {t['assigned']}, {q(t['status'])}, "
            f"{dexpr(t['due_off'])}, {str(t['is_survey']).upper()}, {t['est']}, NULL, "
            f"{sc}, {t['created_by']}, {tsexpr(t['created_off'], 8, 0)}, {tsexpr(t['upd_off'], 15, 0)})")
    chunked_insert(out, "  INSERT INTO tb_tugas (id_tugas, id_proyek, nama_tugas, description, assigned_to, status, due_date, is_survey_task, estimated_hours, depends_on, status_changed_at, created_by, created_at, updated_at) VALUES", rows)
    out.append("")

    # --- aktivitas tugas ---
    if acts:
        out.append("  -- Aktivitas tugas (menggerakkan laporan harian/mingguan/bulanan).")
        rows = [f"  ({a['id']}, {a['task']}, {a['user']}, {q(a['msg'])}, {q(a['atype'])}, {tsexpr(a['off'], a['hh'] % 24, a['mm'])})"
                for a in acts]
        chunked_insert(out, "  INSERT INTO task_activities (id, task_id, user_id, message, activity_type, created_at) VALUES", rows)
        out.append("")

    # --- laporan harian ---
    if reports:
        out.append("  -- Laporan harian (catatan kendala; mayoritas tanpa persentase).")
        rows = [f"  ({r['id']}, {r['proyek']}, {dexpr(r['off'])}, {('NULL' if r['pct'] is None else r['pct'])}, {q(r['note'])}, {r['by']}, {tsexpr(r['off'], 17, 0)})"
                for r in reports]
        chunked_insert(out, "  INSERT INTO daily_reports (id, project_id, report_date, progress_percentage, constraints, created_by, created_at) VALUES", rows)
        out.append("")

    # --- eskalasi ---
    if escs:
        out.append("  -- Eskalasi (kendala lapangan; open/handled aktif, closed utk selesai).")
        rows = []
        for ec in escs:
            res_at = tsexpr(ec["res_off"], 11, 0) if ec["res_off"] is not None else "NULL"
            res_by = str(ec["res_by"]) if ec["status"] == "closed" else "NULL"
            rnote = q("Sudah ditangani dan diselesaikan oleh tim.") if ec["status"] == "closed" else "NULL"
            rows.append(
                f"  ({ec['id']}, {ec['task']}, {ec['proyek']}, {ec['by']}, {q(ec['title'])}, {q(ec['desc'])}, "
                f"{q(ec['status'])}, {q(ec['prio'])}, {res_by}, {res_at}, {rnote}, {tsexpr(ec['off'], 10, 30)}, {tsexpr(ec['off'], 10, 30)})")
        chunked_insert(out, "  INSERT INTO tb_eskalasi (id_eskalasi, id_tugas, id_proyek, reported_by, title, description, status, priority, resolved_by, resolved_at, resolution_notes, created_at, updated_at) VALUES", rows)
        out.append("")

    # --- setval semua sequence supaya insert app berikutnya tidak bentrok ---
    out.append("  -- Sinkron sequence SERIAL ke MAX(id) -> insert via app lanjut mulus.")
    for tbl, col in [("tb_user", "id_user"), ("tb_klien", "id_klien"), ("tb_proyek", "id_proyek"),
                     ("tb_tugas", "id_tugas"), ("task_activities", "id"), ("daily_reports", "id"),
                     ("tb_eskalasi", "id_eskalasi")]:
        out.append(f"  PERFORM setval(pg_get_serial_sequence('{tbl}', '{col}'), "
                   f"(SELECT COALESCE(MAX({col}), 1) FROM {tbl}));")

    out.append("\nEND IF;\nEND\n$seed$;")
    return "\n".join(out)


def main():
    clients = build_clients()
    projects, roster = build_projects(clients)
    nred, namber = enforce_health_distribution(projects)   # paksa tepat N_RED merah + N_AMBER kuning
    tasks = build_tasks(projects)
    acts, reports, escs = build_activities(projects, tasks)
    tech_spread = spread_active_tech_spi(projects, tasks)   # sebar SPI teknisi (RAG) -- ubah due-date saja
    sql = emit(clients, projects, tasks, roster, acts, reports, escs)
    OUT.write_text(sql, encoding="utf-8")

    # ringkasan distribusi (stdout, bukan ke file)
    from collections import Counter, defaultdict
    st = Counter(p["status"] for p in projects)
    ph = Counter(p["phase"] for p in projects if p["status"] == "active")
    bk = Counter(p["bucket"] for p in projects if p["bucket"])
    cat = Counter(p["category"] for p in projects)
    cli = Counter(p["client"]["nama"] for p in projects)
    span = int(YEARS_HISTORY * 365)
    n_tech = len(BASE_TECHS) + len(roster.hires)
    active_today = sum(1 for p in projects if p["start_off"] <= 0 <= p["end_off"])
    rate = round(len(projects) / span, 2)
    avg_dur = round(sum(p["dur"] for p in projects) / len(projects), 1)
    recent = sum(1 for p in projects if -365 <= p["start_off"] <= 0)   # 1 thn terakhir (tim penuh)
    rate_recent = round(recent / 365, 2)
    # cek "1 teknisi = 1 job": konkurensi job per teknisi tak boleh > 1 di titik mana pun
    peak = 0
    busy = defaultdict(list)
    for p in projects:
        busy[p["team"][0]].append((p["start_off"], p["actual_end"]))
    for tid, ivs in busy.items():
        pts = sorted({x for iv in ivs for x in iv})
        for pt in pts:
            peak = max(peak, sum(1 for (a, b) in ivs if a <= pt <= b))
    print(f"[OK] tulis {OUT}  ({len(sql.splitlines())} baris)")
    print(f"  proyek: {dict(st)}  total={len(projects)}  (riwayat {YEARS_HISTORY} thn, avg durasi {avg_dur} hr)")
    print(f"  aktif-fase: {dict(ph)}  target-health: {dict(bk)}")
    print(f"  teknisi TETAP: base {len(BASE_TECHS)} + rekrut {len(roster.hires)} = {n_tech}")
    print(f"  throughput: ~{rate_recent} proyek/hari (1 thn terakhir, tim penuh) | lifetime ~{rate}/hari | aktif hari ini = {active_today}")
    print(f"  klien: {len(clients)} (top retensi: {cli.most_common(5)})")
    print(f"  kategori: {dict(cat)}")
    print(f"  tugas={len(tasks)} aktivitas={len(acts)} laporan={len(reports)} eskalasi={len(escs)}")
    print(f"  cek 1-job/teknisi: konkurensi maksimum per teknisi = {peak} (harus 1)")
    # estimasi SPI proyek selesai (= yg akan dihitung recalc tanpa floor): cek avg ~0.9 + granular
    spis = [p["spi_est"] for p in projects if p["status"] == "completed"]
    if spis:
        avg_spi = round(sum(spis) / len(spis), 3)
        distinct = len(set(round(x, 3) for x in spis))
        roundish = sum(1 for x in spis if abs(x * 4 - round(x * 4)) < 1e-6)  # kelipatan 0.25
        rag = {"green": sum(1 for x in spis if x >= 0.95),
               "amber": sum(1 for x in spis if 0.85 <= x < 0.95),
               "red": sum(1 for x in spis if x < 0.85)}
        print(f"  SPI selesai (estimasi recalc): avg={avg_spi}  min={round(min(spis),3)}  "
              f"max={round(max(spis),3)}  distinct={distinct}/{len(spis)}  bulat(.25)={roundish}")
        print(f"  RAG selesai (estimasi): {rag}")
    trag = {"Kritis(<0.85)": sum(1 for s in tech_spread if s < 0.85),
            "Waspada(.85-.95)": sum(1 for s in tech_spread if 0.85 <= s < 0.95),
            "Baik(>=0.95)": sum(1 for s in tech_spread if s >= 0.95)}
    print(f"  SPI teknisi aktif (target sebar, task-based): {sorted(tech_spread)}  RAG={trag}")


if __name__ == "__main__":
    main()
