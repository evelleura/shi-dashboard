# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Generator seed realistis PT Smart Home Inovasi (SHI) -> frontend/database/seed.sql

Tujuan: rombak seed demo menjadi RIWAYAT OPERASI yang realistis dan konsisten:
  - ~3 proyek masuk per hari (skala 900 proyek/tahun); chunk ini NUM_PROJECTS proyek
    "kebelakang" (mayoritas selesai + sebagian aktif untuk dashboard EWS).
  - Klien retensi: sebagian klien (developer/hotel/RS/pemerintah/mall/pabrik) punya
    BANYAK proyek; perorangan 1 proyek.
  - Penjadwalan teknisi berbasis KAPASITAS: tiap teknisi maksimum CAPACITY proyek
    berjalan bersamaan. Kalau permintaan > kapasitas -> REKRUT teknisi baru
    (created_at = tanggal proyek). Tidak pernah ada tabrakan jadwal.

Determinisme: random.Random(SEED) tetap -> output identik tiap run. Tanggal ditulis
relatif `CURRENT_DATE + N` supaya data selalu "segar" saat seed dimuat run.py.
project_health TIDAK ditulis di sini -- dihitung db:backfill-spi (recalculateSPI).

Jalankan:  python frontend/database/generate_seed.py
           (atau: uv run frontend/database/generate_seed.py)
"""
from __future__ import annotations

import datetime
import random
import re
from pathlib import Path

# ============================ KONFIGURASI ============================
SEED = 20260619
NUM_PROJECTS = 450                 # riwayat operasi (intake 2-3/hari sibuk, banyak hari kosong)
CAPACITY = 1                       # 1 teknisi = 1 job pada satu waktu (realistis lapangan)
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
# 1-3 hari, komersil 4-12 hari, besar (hotel/RS/mall) 2-5 minggu. Sengaja pendek
# supaya "1 teknisi = 1 job" (CAPACITY=1) tetap muat <=25 teknisi pada konkurensi.
DUR = {"small": (1, 3), "medium": (4, 12), "large": (14, 35)}
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
# faktor <1 -> selesai lebih cepat (SPI>1); >1 -> telat (SPI<1). Sebaran realistis:
# mayoritas tepat waktu/sedikit cepat, sebagian telat -> riwayat SPI BERVARIASI
# (bukan "1 semua"). Dipakai build_tasks utk menggeser waktu penyelesaian tugas.
SCHED_FACTORS = [0.70, 0.75, 0.80, 0.82, 0.88, 0.92, 0.96, 1.0, 1.0,
                 1.04, 1.08, 1.15, 1.22, 1.30, 1.45]


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


# ============================ TIMELINE INTAKE (mundur ~3/hari) ============================
def build_start_offsets(n):
    offs = []
    day = -2  # proyek terbaru mulai 2 hari lalu
    while len(offs) < n:
        intake = pick([0, 0, 0, 0, 0, 2, 2, 3, 3, 0])  # 2-3 proyek/hari sibuk, banyak hari kosong (rata ~1/hari)
        for _ in range(intake):
            if len(offs) >= n:
                break
            offs.append(day)
        day -= 1
    offs.sort()  # paling lama dulu (untuk scheduler kronologis)
    return offs


# ============================ PENJADWAL KAPASITAS (rekrut bila penuh) ============================
class Roster:
    def __init__(self):
        # tiap teknisi: list interval (s,e) proyek yang diemban
        self.tech = {tid: [] for tid in BASE_TECHS}
        self.hires = []  # dict user baru yang direkrut
        self.next_id = 9

    def _overlap_count(self, tid, s, e):
        return sum(1 for (a, b) in self.tech[tid] if not (b < s or a > e))

    def assign(self, s, e, team_size):
        chosen = []
        # best-fit packing: isi teknisi yg sudah hampir penuh (tapi <CAPACITY) dulu,
        # supaya headcount minimum (rekrut hanya saat semua benar2 penuh). Tie-break:
        # veteran (assignment terbanyak) didahulukan -> base teknisi dipakai maksimal.
        elig = sorted(
            [tid for tid in self.tech if self._overlap_count(tid, s, e) < CAPACITY],
            key=lambda t: (-self._overlap_count(t, s, e), -len(self.tech[t])),
        )
        for tid in elig:
            if len(chosen) >= team_size:
                break
            chosen.append(tid)
        # kurang teknisi -> REKRUT
        while len(chosen) < team_size:
            tid = self._hire(s)
            chosen.append(tid)
        for tid in chosen:
            self.tech[tid].append((s, e))
        return chosen

    def _hire(self, start_off):
        tid = self.next_id
        self.next_id += 1
        # nama teknisi terkurasi, dipakai BERURUTAN (pria, nama depan unik).
        # Fallback bernomor hanya kalau daftar habis (tak diharapkan pada CAPACITY ini).
        idx = len(self.hires)
        nama = TECH_NAMES[idx] if idx < len(TECH_NAMES) else f"Teknisi {tid}"
        parts = nama.split()
        base = f"{parts[0].lower()}.{parts[-1].lower()}"
        email, n = f"{base}@shi.co.id", 2
        while email in USED_EMAILS:
            email = f"{base}{n}@shi.co.id"
            n += 1
        USED_EMAILS.add(email)
        self.tech[tid] = []
        self.hires.append(dict(id=tid, nama=nama, email=email, hire_off=start_off))
        return tid


# ============================ SINTESIS PROYEK ============================
def assign_clients(clients, n):
    """Round-robin 1 proyek/klien dulu (cakupan), sisanya berbobot (retensi)."""
    order = []
    pool = [c for c in clients]
    rng.shuffle(pool)
    order.extend(pool)  # putaran cakupan
    # sisanya berbobot
    weighted = []
    for c in clients:
        weighted += [c] * c["weight"]
    while len(order) < n:
        order.append(pick(weighted))
    rng.shuffle(order)  # campur supaya timeline tidak berurut per klien
    return order[:n]


def build_projects(clients):
    starts = build_start_offsets(NUM_PROJECTS)
    client_seq = assign_clients(clients, NUM_PROJECTS)
    roster = Roster()
    projects = []
    seq_per_month = {}
    # bucket kesehatan utk proyek AKTIF (manufaktur sebaran dashboard)
    health_buckets = (["red"] * 15 + ["amber"] * 20 + ["green"] * 40
                      + ["ahead"] * 12 + ["unrated"] * 8)
    for i in range(NUM_PROJECTS):
        start_off = starts[i]
        client = client_seq[i]
        category = pick(client["favs"])
        scale = weighted_scale(client["tipe"])
        dlo, dhi = DUR[scale]
        dur = rng.randint(dlo, dhi)
        end_off = start_off + dur

        # tentukan status dari posisi interval vs hari ini (0).
        # TANPA 'on-hold': PT SHI menjaga citra -> tidak menunda pekerjaan. Proyek
        # yang jadwalnya sudah lewat = selesai; yang sedang berjalan = aktif.
        status = "completed" if end_off < 0 else "active"

        # fase + survey approval
        survey_len = max(2, min(dur // 4, 10))
        if status == "active" and rng.random() < 0.30 and start_off > -survey_len:
            phase, survey_approved, sap_off = "survey", False, None
        else:
            phase = "execution"
            survey_approved = True
            sap_off = start_off + survey_len

        # kode proyek (anchor nominal)
        nom = NOMINAL_TODAY + datetime.timedelta(days=start_off)
        ym = f"{str(nom.year)[2:]}{nom.month:02d}"
        seq_per_month[ym] = seq_per_month.get(ym, 0) + 1
        code = f"SHI-{ym}{seq_per_month[ym]:03d}"

        manager = rng.choices(MANAGERS, weights=MANAGER_W)[0]
        name = pick(NAME_TEMPLATES[category]).format(c=client["short"])
        team_size = {"small": 1, "medium": rng.choice([1, 1, 2]), "large": rng.choice([2, 2, 3])}[scale]
        team = roster.assign(start_off, end_off, team_size)

        # target kesehatan utk aktif
        bucket = pick(health_buckets) if status == "active" and phase == "execution" else None

        projects.append(dict(
            id=i + 1, code=code, name=name, client=client, category=category, scale=scale,
            start_off=start_off, end_off=end_off, dur=dur, status=status, phase=phase,
            survey_approved=survey_approved, sap_off=sap_off, manager=manager, team=team,
            value=make_value(category, scale), bucket=bucket,
            target=TARGET_DESC[category],
        ))
    return projects, roster


# ============================ SINTESIS TUGAS ============================
def clamp(v, lo, hi):
    return max(lo, min(hi, v))


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

        # durasi AKTUAL proyek selesai = durasi_rencana x faktor jadwal (acak realistis).
        # actual_end = saat tugas terakhir di-'done' (harus di masa lalu, <= -1) -> jadi
        # dasar SPI akhir (durasi_rencana / durasi_aktual) yang dihitung recalculateSPI.
        if p["status"] == "completed":
            actual_dur = max(1, round(dur * pick(SCHED_FACTORS)))
            actual_end = clamp(s + actual_dur, s + 1, -1)
            actual_dur = actual_end - s
        else:
            actual_end, actual_dur = e, dur

        # tentukan jumlah 'done' sesuai status/kesehatan
        if p["status"] == "completed":
            done = total
        elif p["status"] == "on-hold":
            done = clamp(int(total * rng.uniform(0.2, 0.6)), 1, total - 1)
        else:  # active
            elapsed = clamp(-s, 1, dur)
            pv_frac = elapsed / dur
            if p["phase"] == "survey":
                done = clamp(int(total * pv_frac * 0.5), 0, max(1, total // 3))
            elif p["bucket"] == "unrated":
                done = 0
            else:
                tgt = {"red": 0.6, "amber": 0.90, "green": 1.02, "ahead": 1.3}[p["bucket"]]
                done = clamp(round(tgt * pv_frac * total), 0, total)

        working_idx = done if done < total else None  # tugas berjalan berikutnya
        for idx, (nm, ds, is_sv, est) in enumerate(chosen):
            tid += 1
            due_off = s + round((idx + 1) / total * dur)
            assignee = p["team"][idx % len(p["team"])]
            if idx < done:
                st = "done"
                if p["status"] == "completed":
                    # penyelesaian aktual mengikuti durasi aktual; tugas terakhir
                    # mendarat di actual_end -> MAX(status_changed_at) = actual_end.
                    upd_off = clamp(s + round((idx + 1) / total * actual_dur), s + 1, actual_end)
                else:
                    upd_off = clamp(due_off + rng.randint(-2, 1), s + 1, min(e, -1))
            elif idx == working_idx and p["status"] != "on-hold":
                st = "working_on_it"
                upd_off = clamp(-rng.randint(0, 3), s + 1, 0)
            else:
                st = "to_do"
                upd_off = s
            tasks.append(dict(
                id=tid, proyek=p["id"], nama=nm, desc=ds, assigned=assignee, status=st,
                due_off=due_off, is_survey=is_sv, est=est, created_by=p["manager"],
                created_off=s, upd_off=upd_off,
            ))
        p["_task_ids"] = list(range(tid - total + 1, tid + 1))
        p["_total_tasks"] = total
        p["_done_tasks"] = done
    return tasks


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
    out.append(f"-- {NUM_PROJECTS} proyek realistis | kapasitas {CAPACITY}/teknisi | "
               f"{len(roster.hires)} teknisi direkrut | {len(clients)} klien | {len(tasks)} tugas")
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
        scoff = t["upd_off"] if t["status"] != "to_do" else t["created_off"]
        rows.append(
            f"  ({t['id']}, {t['proyek']}, {q(t['nama'])}, {q(t['desc'])}, {t['assigned']}, {q(t['status'])}, "
            f"{dexpr(t['due_off'])}, {str(t['is_survey']).upper()}, {t['est']}, NULL, "
            f"{tsexpr(scoff, 14, 0)}, {t['created_by']}, {tsexpr(t['created_off'], 8, 0)}, {tsexpr(t['upd_off'], 15, 0)})")
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
    tasks = build_tasks(projects)
    acts, reports, escs = build_activities(projects, tasks)
    sql = emit(clients, projects, tasks, roster, acts, reports, escs)
    OUT.write_text(sql, encoding="utf-8")

    # ringkasan distribusi (stdout, bukan ke file)
    from collections import Counter
    st = Counter(p["status"] for p in projects)
    ph = Counter(p["phase"] for p in projects if p["status"] == "active")
    bk = Counter(p["bucket"] for p in projects if p["bucket"])
    cat = Counter(p["category"] for p in projects)
    cli = Counter(p["client"]["nama"] for p in projects)
    print(f"[OK] tulis {OUT}  ({len(sql.splitlines())} baris)")
    print(f"  proyek: {dict(st)}  total={len(projects)}")
    print(f"  aktif-fase: {dict(ph)}  target-health: {dict(bk)}")
    print(f"  teknisi: base {len(BASE_TECHS)} + rekrut {len(roster.hires)} = {len(BASE_TECHS)+len(roster.hires)}")
    print(f"  klien: {len(clients)} (top retensi: {cli.most_common(5)})")
    print(f"  kategori: {dict(cat)}")
    print(f"  tugas={len(tasks)} aktivitas={len(acts)} laporan={len(reports)} eskalasi={len(escs)}")
    # cek tabrakan: tidak ada teknisi dgn > CAPACITY interval saling-tumpang di titik mana pun
    worst = 0
    for tid, ivs in roster.tech.items():
        pts = sorted(set([x for iv in ivs for x in iv]))
        for pt in pts:
            c = sum(1 for (a, b) in ivs if a <= pt <= b)
            worst = max(worst, c)
    print(f"  cek kapasitas: konkurensi maksimum per teknisi = {worst} (batas {CAPACITY})")


if __name__ == "__main__":
    main()
