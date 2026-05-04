# TODO — Sequence Diagram (4.3.1.3 Model Sequence Diagram)

**Status:** Done. 5 sequence diagram sesuai Raharja KKP standard, mirror activity 4.5-4.9.

**Output dir:** `diagram/ai/Sequence/`
**File format:** drawio (`SD_*.drawio`)
**Caption numbering:** Gambar 4.10–4.14
**Reference standard:** `widuri.raharja.info/index.php?title=KP1122469850`
**Standar visual:** `diagram/STANDARD.md` — section "Sequence Diagram"
**Sumber narasi:** `naskah/10_sequence_diagram.md`

---

## Paradigma

Pattern **business-process**, bukan MVC. Mirror 1:1 activity diagram (4.5-4.9).
- **Aktor**: orang/peran (Pengguna, Manajer, Teknisi) — `umlActor` stick figure
- **Lifeline**: objek bisnis (Form, Data, Dashboard, Papan Kanban) — rectangle
- **JANGAN** pakai komponen teknis (Halaman, Controller, Service, Database, Sistem generik)
- **JANGAN** pakai bahasa teknis (SQL, GET/POST, endpoint, table name, kode method)
- **JANGAN** pakai combined fragment (alt/loop/opt/par) — happy-path linear saja

---

## Daftar Sequence Diagram

### 1. SD Autentikasi — Gambar 4.10 (mirror Activity 4.5)

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Pengguna | Aktor |
| 2 | Form Login | Lifeline |
| 3 | Data Pengguna | Lifeline |

**Message count:** 10
**File:** `SD_AUTENTIKASI.drawio`

### 2. SD Pelaporan Progres Harian (Review Gate) — Gambar 4.11 (mirror Activity 4.6)

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Manajer | Aktor |
| 2 | Papan Kanban | Lifeline |
| 3 | Data Tugas | Lifeline |
| 4 | Teknisi | Aktor |

**Message count:** 13
**File:** `SD_REVIEW_GATE.drawio`

### 3. SD Pengelolaan Proyek — Gambar 4.12 (mirror Activity 4.7)

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Manajer | Aktor |
| 2 | Form Proyek | Lifeline |
| 3 | Data Proyek | Lifeline |

**Message count:** 11
**File:** `SD_PENGELOLAAN_PROYEK.drawio`

### 4. SD Dashboard Early Warning System — Gambar 4.13 (mirror Activity 4.8)

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Manajer | Aktor |
| 2 | Dashboard | Lifeline |
| 3 | Data Proyek | Lifeline |

**Message count:** 7
**File:** `SD_DASHBOARD_EWS.drawio`

### 5. SD Pengajuan & Penanganan Eskalasi — Gambar 4.14 (mirror Activity 4.9)

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Teknisi | Aktor |
| 2 | Form Eskalasi | Lifeline |
| 3 | Data Eskalasi | Lifeline |
| 4 | Manajer | Aktor |

**Message count:** 11
**File:** `SD_ESKALASI.drawio`

---

## Generator

`diagram/ai/Sequence/_gen.py` — Python builder.
Edit spec di file, jalankan `python _gen.py`, output 5 `SD_*.drawio`.

---

## Checklist

- [x] 5 SD generated (Gambar 4.10–4.14, mirror Activity 4.5–4.9)
- [x] Activation bar pada tiap aktor & lifeline
- [x] User pakai `umlActor` stick figure
- [x] Lifeline objek bisnis (Form/Data/Dashboard/Papan Kanban)
- [x] Bahasa pesan akademik Indonesia (kata kerja formal)
- [x] No combined fragment, no SQL/HTTP/code
- [x] Caption format: `Gambar X.X Sequence Diagram [NamaKegiatan].`
- [x] Narrative paragraph di `naskah/10_sequence_diagram.md` (format Raharja)
- [x] STANDARD.md updated dengan Raharja convention
- [ ] Render ke PNG/SVG untuk thesis (drawio.com / VS Code Draw.io extension)
