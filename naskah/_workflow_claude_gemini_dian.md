# Workflow Penyusunan Naskah TA: Claude + Gemini + Dian

**Dokumen ini:** kerangka kerja yang dipakai untuk menyusun naskah TA "Dashboard Project Management berbasis Daily Report" milik Dian Putri Iswandi.

**Tujuan dokumen:** menjadi referensi reusable untuk sub-bab berikutnya, dan ketika orang lain (atau Dian sendiri di sesi mendatang) ingin melanjutkan dengan pola yang sama.

---

## 1. Pembagian peran

| Pihak | Tugas | Bukan tugas |
|---|---|---|
| **Dian** | Pengarah konten, validator final, sumber konteks TA (judul, lingkup, batasan masalah, deadline sidang), pemegang naskah `.docx` autoritatif | Menulis kode, mengoperasikan tool teknis, melakukan ekstraksi data |
| **Claude (Opus 4.7)** | Mengeksekusi tool, baca/tulis file, jalankan Python, ekstrak `.docx` ke text, build docx via `python-docx`, recon codebase, koordinasi I/O antara Gemini dan file sistem, eksekusi git | Menyusun kalimat narasi akademik Bahasa Indonesia, polish gaya bahasa |
| **Gemini (3 Pro Preview, via gemini CLI)** | Menyusun kalimat narasi akademik, draft konten substantif (intro paragraf, deskripsi test case, paragraf penutup), cross-review konsistensi, saran terminologi | Menulis kode, mengoperasikan file system, eksekusi command |

**Prinsip pembagian:** "Claude pintar koding, jelek dalam menyusun kata. Gemini ga bisa koding dan sering error, tapi cantik dalam menyusun kata." (Quote Dian.)

---

## 2. Tools yang dipakai

### 2.1. Claude side
- **Bash tool** — eksekusi command shell (git, python, gemini CLI)
- **Read / Write / Edit / Glob / Grep** — operasi file
- **Agent (Explore)** — recon codebase tanpa edit
- **python-docx** (`pip install python-docx`) — manipulasi `.docx`
- **lxml** (transitive dep) — XML manipulation untuk insertion point

### 2.2. Gemini side
- **gemini CLI** v0.42.0 (`fnm` install)
- Model: **`gemini-3-pro-preview`** (eksplisit via `-m gemini-3-pro-preview`)
- Default `gemini-2.0-flash-exp-001` = Flash, BUKAN Pro. Selalu override dengan `-m`.
- Trust mode: `GEMINI_CLI_TRUST_WORKSPACE=true` env var (atau `--skip-trust`) — wajib untuk workspace di luar trust list
- Approval: `--approval-mode plan` untuk read-only mode (cocok untuk review)
- Non-interactive: `-p "<prompt>"` flag

### 2.3. File konvensi
- `naskah/Naskah TA <DD-MM-YY>.docx` — naskah autoritatif Dian (jangan diubah langsung, kecuali Dian eksplisit minta)
- `naskah/_dian_naskah_extracted.md` — text extract penuh naskah (Claude refresh setiap iterasi besar)
- `naskah/prompt_bab_<topik>.md` — stash prompt Gemini per topik (re-used antar iterasi)
- `naskah/_build_<deliverable>.py` — script builder Python (idempotent regenerate)
- `naskah/<sub-bab>.docx` — deliverable standalone (terpisah dari naskah utama, supaya bisa di-copy-paste manual oleh Dian)
- `naskah/_inkonsistensi_<topik>.md` — laporan review/audit

---

## 3. Alur kerja iteratif (7 fase)

```
[Fase 1] Dian → permintaan via prompt user
[Fase 2] Claude → konfirmasi pemahaman + opsi pendekatan + tanya pilihan
[Fase 3] Dian → pilih opsi atau kasih koreksi
[Fase 4] Claude → ekstrak naskah ke .md + susun prompt untuk Gemini
[Fase 5] Gemini → balas dengan draft konten (kata-kata akademik)
[Fase 6] Claude → review draft, kalau OK lanjut. Kalau ada gap, iterasi balik ke Fase 4 dengan refinement
[Fase 7] Claude → assembly ke .docx via python-docx, save sebagai file terpisah, verifikasi
[Fase 8] Cross-review opsional: Claude + Gemini cross-check deliverable vs naskah vs frontend
[Fase 9] Git commit + push (kalau Dian eksplisit minta)
```

**Aturan iterasi:**
1. **Tidak ada one-shot.** Tiap fase output di-review oleh fase berikutnya.
2. **Naskah utama TIDAK diubah** kecuali Dian eksplisit minta. Default: build deliverable standalone.
3. **Backup sebelum modifikasi naskah utama** — `cp <naskah>.docx <naskah>.docx.bak` SEBELUM `python-docx` save.
4. **Re-extract naskah** ke `.md` setiap kali naskah utama berubah. Gemini selalu ke-feed extract terbaru.
5. **Prompt Gemini di-stash** ke `naskah/prompt_*.md` (bukan inline di Bash), supaya Dian bisa baca dan iterasi.

---

## 4. Pola hand-off konkret

### 4.1. Claude → Gemini

Pattern:
```bash
# Stash prompt
cat > naskah/prompt_<topik>.md <<'EOF'
# Konteks
<deskripsi tugas, sumber data, batasan>

# Sumber yang harus dibaca
- naskah/_dian_naskah_extracted.md

# Pertanyaan spesifik (1-6 buah)
1. ...
2. ...

# Format output yang diminta
<exact template, e.g. "=== PARAGRAF ===" lalu "=== REVIEW ===">
EOF

# Eksekusi gemini
GEMINI_CLI_TRUST_WORKSPACE=true \
  gemini -m gemini-3-pro-preview --approval-mode plan \
  -p "$(cat naskah/prompt_<topik>.md)"
```

**Aturan prompt Claude → Gemini:**
- Mulai dengan konteks 1-paragraf (siapa Dian, sistem apa, lingkup batasan)
- Sebutkan file yang harus dibaca Gemini (markdown extract, bukan .docx mentah)
- Sertakan contoh referensi (gaya laporan lain) DENGAN catatan "JANGAN ditiru buta" supaya Gemini tahu mana yang TIDAK dipakai
- Sertakan batasan masalah Dian (aktor, eksklusi, scope) — Gemini akan otomatis enforce
- Tanya 4-6 pertanyaan SPESIFIK, jangan open-ended
- Format output template eksplisit (Gemini akan ikuti)
- Bahasa Indonesia akademik diminta eksplisit

### 4.2. Gemini → Claude → docx

Gemini balas markdown. Claude parse:
- Italic markup `*word*` → run dengan `italic=True` via `python-docx`
- Section header `===` → struktur output yang predictable
- Direct quote (paragraf siap pakai) → langsung dimasukkan tanpa parafrase

Builder script (template):
```python
"""Build standalone docx for sub-bab X.X.X."""
import re
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING

OUT = "naskah/X.X.X NamaSubBab.docx"

# Konten (paste dari Gemini)
HEADING = "X.X.X Judul"
INTRO_P1 = "..."
INTRO_P2 = "..."
CAPTION = "Tabel X.X Judul Tabel"
ROWS = [(...), ...]
CLOSING = "..."

def add_runs_with_italic(paragraph, text):
    """Split *...* markers → italic runs."""
    parts = re.split(r"(\*[^*]+\*)", text)
    for part in parts:
        if not part: continue
        italic = part.startswith("*") and part.endswith("*") and len(part) > 2
        run = paragraph.add_run(part[1:-1] if italic else part)
        run.italic = italic
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)

def main():
    doc = Document()
    # heading + intro paragraphs (justify, TNR 12, 1.5 spacing, indent 1.27cm)
    # caption (center, bold)
    # table (Table Grid, header bold center, data TNR 10)
    # closing paragraph
    doc.save(OUT)

if __name__ == "__main__":
    main()
```

### 4.3. Verifikasi pasca-build

```python
# Cek paragraf
from docx import Document
doc = Document(OUT)
for i, p in enumerate(doc.paragraphs):
    print(i, p.style.name, p.text[:80])

# Cek italic runs (sample)
p = doc.paragraphs[2]  # paragraph yang harusnya punya italic
italic = [r.text for r in p.runs if r.italic]
print(f"Italic runs: {len(italic)} — {italic[:5]}")

# Cek tabel
tbl = doc.tables[0]
print(f"Tabel: {len(tbl.rows)} rows x {len(tbl.columns)} cols")
```

---

## 5. Contoh konkret #1 — Penyusunan sub-bab 5.2.3 Pengujian Black Box

### Permintaan awal Dian
> "menyusun blackbox utk bab 5, ... format tabel Pengujian Black Box-nya sangat rapi karena langsung memetakan Kode Kebutuhan Sistem Fungsional ke Test Case ID ... kita membuat table testing kita sendiri dalam docx, namun gunakan gemini cli untuk menyusuh kata kata nya"

### Eksekusi

**Fase 1-3 (alignment struktur):**
- Claude tawarkan 3 opsi awal (A/B/C) → Dian koreksi: "kamu terlalu kaku dan fokus ke contoh orang laporan lain, ikuti naskah ta dian"
- Claude minta Gemini baca seluruh naskah Dian terlebih dahulu (extract ke `_dian_naskah_extracted.md`, 1467 lines)
- Gemini balas struktur revisi: sub-bab `5.2.3` (di bawah 5.2), 3 sub-sub-section, kode hybrid `AUTH/MN/TK/SYS`, 15 skenario

**Fase 4-6 (draft konten):**
- Claude susun prompt detail dengan 11 aturan wording, 15 skenario daftar konkret
- Gemini balas 15 test case dengan vocabulary Dian (komputasi, presisi, matriks, agregasi, merender, mitigasi, swamonitoring)
- Gemini auto-italicize istilah asing dengan `*...*`

**Fase 7 (assembly):**
- Claude tulis `naskah/_build_blackbox_docx.py`
- Output: `naskah/5.2.3 Pengujian Black Box.docx` (40KB)
- Heading + 2 intro + caption + 16x6 table + closing
- Verifikasi: 9 italic runs di intro p2, 3 di TC-MN-03 deskripsi

**Fase 8 (cross-review):**
- Claude minta Gemini final review terhadap full naskah
- Gemini balas verdict OK, catatan minor untuk paragraf pengantar 5.2 (di luar scope sub-bab)

### Pelajaran dari kesalahan
- **Iterasi pertama Claude edit langsung `Naskah TA 17-05-26.docx`** — Dian marah ("siapa yang nyuruh ngedit langsung file docx nya? kan disuruhnya bikin docx baru woi!")
- **Recovery:** restore dari `.bak`, build ulang sebagai standalone file
- **Aturan baru:** naskah utama Dian = READ-ONLY untuk Claude. Selalu produce file terpisah.

---

## 6. Contoh konkret #2 — 3-way consistency check

### Permintaan
> "membandingkan inconsisten antara naskah ... frontend/ dan 5.2.3 Pengujian Black Box.docx — list down utk membantu dian mengkurasi dan mencacati gaya bahasa"

### Eksekusi

**Recon paralel:**
- Claude spawn Agent (Explore) untuk inventory `frontend/` — 20 routes, 12 features, evidence ke file:line
- Claude paralel ekstrak BAB IV-V naskah dengan filter keyword (teknisi/manajer/dashboard/spi/rbac/dll)

**Sintesa inkonsistensi:**
- Mapping: Naskah claim → Frontend reality → Tabel 5.1 (docx Claude) claim
- Kategori output:
  - **A.** Naskah vs Frontend (Dian-side)
  - **B.** Naskah BAB IV vs BAB V (konsistensi internal Dian)
  - **C.** Tabel 5.1 vs Frontend (testing-side)
  - **D.** Gaya bahasa / italic / glosarium
  - **E.** Prioritas aksi (wajib/disarankan/dipertimbangkan)

**Output:**
- `naskah/_inkonsistensi_3way_review.md` (~ 380 lines)
- 10 inkonsistensi (3 tinggi, 4 sedang, 3 ringan)
- Setiap entry: quote naskah (dengan line ref), quote frontend (dengan file:line), implikasi, saran kurasi

### Pola yang bisa di-reuse
Untuk sub-bab teknis lain (basis data, implementasi, antarmuka), pola sama:
1. Recon frontend/backend (Explore agent)
2. Ekstrak naskah dengan filter
3. Mapping claim ↔ realita
4. Kategorikan inkonsistensi (terminologi / lingkup / detail teknis)
5. Sertakan saran konkret per item

---

## 7. Template prompt Gemini yang dipakai

### Template A — Struktur sub-bab baru
```markdown
# Konteks
Saya menyusun sub-bab <TITLE> untuk Tugas Akhir milik <NAMA>. Sistem: <DESKRIPSI 1 KALIMAT>.

# Yang harus kamu lakukan sebelum menjawab
Baca seluruh naskah: `naskah/_dian_naskah_extracted.md`. Tangkap karakter narasi: gaya bahasa, terminologi yang dipakai, batasan lingkup, alur logika antar bab.

# Konteks tambahan (referensi format, BUKAN gaya yang harus ditiru)
<contoh laporan TA lain — dengan catatan "JANGAN dipaksa">

# Pertanyaan
1. Struktur sub-bab yang paling natural untuk gaya <NAMA>?
2. Skema penomoran <test case/tabel/dst>?
3. Draft kalimat pengantar paragraf (sambung dari sub-bab sebelumnya)?
4. Jumlah dan distribusi <skenario/tabel/dst> untuk lingkup yang ditetapkan?
5. Caption + nomor (cek nomor terakhir di BAB X)?
6. Anything else yang harus diperhatikan?

Jawab dalam Bahasa Indonesia akademik. Spesifik, tidak generik. Referensi ke kalimat/paragraf konkret di naskah kalau perlu.
```

### Template B — Draft konten substantif
```markdown
# Tugas Lanjutan — Draft <N> <ITEM>

# Konfirmasi yang sudah disetujui
- Sub-bab: ...
- Caption: ...
- Kolom: ...
- Distribusi: ...

# Aturan wording (penting)
1. Gunakan kosakata <NAMA>: <list kosakata>
2. Italic istilah asing dengan markdown `*...*`: <list istilah>
3. <constraint #3 spesifik konteks>

# Daftar yang harus didraft
1. ID-01 <judul>
2. ID-02 <judul>
...

# Output format
```
ID-01
Field-1: <expected>
Field-2: <expected>
```
```

### Template C — Cross-review
```markdown
# Tugas — Review Final <SUB-BAB>

# Yang harus kamu lakukan
1. Baca naskah lengkap (sudah di-update): `naskah/_dian_naskah_extracted.md`
2. Fokus pada sub-bab <X.X.X>
3. Review final terhadap:
   - Konsistensi dengan flow naskah secara keseluruhan
   - Coherence antar elemen
   - Transisi ke sub-bab berikutnya
   - Apakah klaim kebutuhan fungsional <BAB Y> sudah tercover?

# Output
=== VERDICT === <OK / NEEDS_TWEAK / NEEDS_ADDITION>
=== ISSUES === <list spesifik>
=== SARAN === <draft revisi konkret>
=== KESIMPULAN === <1-2 kalimat>
```

---

## 8. Aturan komunikasi (Claude ke Dian)

1. **Caveman mode aktif** (per session-start hook) — output Claude ke Dian terse, fragmen OK, drop artikel/filler.
2. **Code/commit/PR message** — tulis normal, bukan caveman.
3. **Bahasa Indonesia campur Inggris** mengikuti gaya Dian — istilah teknis Inggris dipertahankan (kanban, dashboard, evidence), penghubung Indonesia.
4. **Pushback aktif** — kalau Dian minta sesuatu yang salah scope atau bertentangan dengan instruksi sebelumnya, sebutkan. Bukan "yes-man".
5. **Confirm sebelum tindakan irreversible** — restore, delete, force push.

---

## 9. Aturan keluaran (output naskah)

1. **TIDAK ada superlatif** — hindari: "menginovasi", "powerful", "comprehensive", "luar biasa", "sangat efektif", "sempurna", "brilliant", "state-of-the-art", "revolutionary".
2. **Klaim teknis = factual + verifiable** — sebut metrik konkret atau referensi diagram, bukan adjektiva.
3. **Vocabulary Dian preferred** — komputasi, presisi, agregasi, matriks, mitigasi, validasi, perekaman, swamonitoring (instead of: cerdas, smart, intelligent, sophisticated).
4. **Italic istilah asing** — keputusan editorial Dian (ketat vs naturalisasi). Tabel 5.1 saat ini pakai italic ketat untuk istilah teknis yang relatif jarang muncul (RBAC, EWS, EV, PV, review gate); istilah sangat sering (dashboard, daily report) bisa dipertimbangkan naturalisasi.
5. **Yang menulis kata-kata = Gemini.** Claude hanya assembly + verifikasi. Editorial polish dilakukan Gemini, bukan Claude.

---

## 10. Workflow ini cocok untuk:

- Penyusunan sub-bab naratif baru di BAB IV / V / VI
- Pembuatan tabel testing / matrix / komparasi
- Cross-review konsistensi antar bab atau antar dokumen
- Audit terminologi dan italic
- Mengisi placeholder section yang dijadwalkan tapi belum diisi (seperti `5.2.3 Pengujian` sebelum diisi)

**TIDAK cocok untuk:**
- Layout/format halaman (cover, daftar isi, halaman pengesahan) — manual di Word lebih cepat
- Insertion gambar (Word native lebih mudah handle relative path image link)
- Tata letak skripsi final (margin, header/footer, page break) — beyond python-docx ergonomics

---

## 11. Aset persistent (jangan dihapus dari repo)

- `naskah/_build_blackbox_docx.py` — builder script Tabel 5.1, idempotent regenerate
- `naskah/_dian_naskah_extracted.md` — text extract naskah (refresh per iterasi)
- `naskah/prompt_bab_blackbox.md` — arsip 4 iterasi prompt Gemini (struktur → draft 15 test case → paragraf penutup → final review)
- `naskah/_inkonsistensi_3way_review.md` — laporan audit 3-way
- `naskah/_workflow_claude_gemini_dian.md` — file ini

---

## 12. Catatan teknis (jebakan yang sudah dipelajari)

1. **Gemini CLI default model = `gemini-2.0-flash-exp-001`** (Flash, bukan Pro). Selalu override dengan `-m gemini-3-pro-preview`.
2. **Gemini stable Gemini 3 belum tersedia di CLI v0.42.0** — hanya preview. Jika constraint anti-preview, fallback ke `gemini-2.5-pro`.
3. **Gemini CLI butuh trust** — `GEMINI_CLI_TRUST_WORKSPACE=true` env var atau `--skip-trust` flag, kalau tidak akan error "not running in a trusted directory".
4. **`python-docx` Write tool error "file not read yet"** — file kosong existing tetap perlu Read sebelum Write. Atau pakai Bash `cat > file <<EOF` untuk file baru.
5. **`python-docx` save bisa shrink file size** — 15MB → 14MB karena recompress XML, BUKAN karena loss data. 104 image preserved per check `zipfile.namelist()`.
6. **Insertion via XML `addnext()`** — insert element setelah target. Multiple insertions: track `last` element, update tiap insertion.
7. **PDF reading** — `Read(pages="N-M")` dengan max 20 pages per call. Halaman fisik PDF != displayed page number (offset karena front-matter).
8. **`docx` tabel header style `Table Grid`** — sama dengan style yang dipakai naskah Dian, jadi build docx baru akan match visually.

---

**Status dokumen:** v1, 17 Mei 2026. Akan di-update saat workflow di-iterate lebih lanjut.
