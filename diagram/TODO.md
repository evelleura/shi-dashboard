# TODO — Sequence Diagram (4.3.1.3 Model Sequence Diagram)

**Status:** Done. 4 sequence diagram sesuai Raharja KKP standard.

**Output dir:** `diagram/ai/Sequence/`
**File format:** drawio (`SD_*.drawio`)
**Caption numbering:** Gambar 4.10–4.13
**Reference standard:** `widuri.raharja.info/index.php?title=KP1122469850`
**Standar visual:** `diagram/STANDARD.md` — section "Sequence Diagram"
**Sumber narasi:** `naskah/10_sequence_diagram.md`

---

## Paradigma

Pattern **business-process**, bukan MVC.
- **Aktor**: orang/peran (Pengguna, Manajer, Teknisi) — `umlActor` stick figure
- **Lifeline**: objek bisnis (Form, Data, Dashboard) — rectangle
- **JANGAN** pakai komponen teknis (Halaman, Controller, Service, Database, Sistem generik)
- **JANGAN** pakai bahasa teknis (SQL, GET/POST, endpoint, table name, kode method)
- **JANGAN** pakai combined fragment (alt/loop/opt/par) — happy-path linear saja

---

## Daftar Sequence Diagram

### 1. SD Autentikasi — Gambar 4.10

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Pengguna | Aktor |
| 2 | Form Login | Lifeline |
| 3 | Data Pengguna | Lifeline |

**Message count:** 7
**File:** `SD_AUTENTIKASI.drawio`

### 2. SD Pengelolaan Proyek — Gambar 4.11

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Manajer | Aktor |
| 2 | Form Proyek | Lifeline |
| 3 | Data Klien | Lifeline |
| 4 | Data Proyek | Lifeline |

**Message count:** 10
**File:** `SD_PENGELOLAAN_PROYEK.drawio`

### 3. SD Dashboard Early Warning System — Gambar 4.12

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Manajer | Aktor |
| 2 | Dashboard | Lifeline |
| 3 | Data Proyek | Lifeline |

**Message count:** 7
**File:** `SD_DASHBOARD_EWS.drawio`

### 4. SD Upload Bukti Pekerjaan — Gambar 4.13

| # | Komponen | Tipe |
|---|----------|------|
| 1 | Teknisi | Aktor |
| 2 | Form Bukti | Lifeline |
| 3 | Data Tugas | Lifeline |

**Message count:** 8
**File:** `SD_UPLOAD_EVIDENCE.drawio`

---

## Generator

`diagram/ai/Sequence/_gen.py` — Python builder.
Edit spec di file, jalankan `python _gen.py`, output 4 `SD_*.drawio`.

---

## Checklist

- [x] 4 SD generated (Gambar 4.10–4.13)
- [x] Activation bar pada tiap aktor & lifeline
- [x] User pakai `umlActor` stick figure
- [x] Lifeline objek bisnis (Form/Data/Dashboard) — bukan Sistem/Database teknis
- [x] Bahasa pesan akademik Indonesia (kata kerja formal)
- [x] No combined fragment, no SQL/HTTP/code
- [x] Caption format: `Gambar X.X Sequence Diagram [NamaKegiatan].`
- [x] Narrative paragraph di `naskah/10_sequence_diagram.md` (format Raharja)
- [x] STANDARD.md updated dengan Raharja convention
- [ ] Render ke PNG/SVG untuk thesis (drawio.com / VS Code Draw.io extension)
