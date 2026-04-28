# Diagram Batch Progress — 2026-04-28

## Format Reference
- File acuan: `diagram/01_FLOWCHART_LOGIN.drawio`
- Aturan: fillColor=#FFFFFF, strokeColor=#000000, no warna
- Caption: italic (fontStyle=2), "Gambar X.X [Nama]."
- Arrow: endArrow=block;endFill=1
- I/O: shape=parallelogram | Decision: rhombus | Start/End: ellipse

---

## Diagram Files

- [x] **01 — LOGIN** `diagram/01_FLOWCHART_LOGIN.drawio`
  - Gambar 4.1 Flowchart Login dan Autentikasi.
  - Status: file acuan, tidak dimodifikasi

- [x] **02 — PROSES BISNIS SEBELUM SISTEM** `diagram/02_FLOWCHART_PROSES_BISNIS_SEBELUM_SISTEM.drawio`
  - Gambar 4.2 Flowchart Proses Bisnis Berjalan.
  - 14 nodes (start→end), 2 decision nodes (Data Lengkap? + Proyek Terlambat?)
  - Key pain point: io2 = Ekspor ke Excel + p5 = Hitung SPI Manual
  - Loop: d1→perr (N,kiri) → perr→io1 (balik ke atas)
  - Right branch: d2→pTL (Y) → pTL→p6

- [x] **03 — PROSES BISNIS SETELAH SISTEM** `diagram/03_FLOWCHART_PROSES_BISNIS_SETELAH_SISTEM.drawio`
  - Gambar 4.3 Flowchart Proses Bisnis Setelah Sistem.
  - pageHeight=1400 (extended)
  - 13 steps, 2 decision nodes (Ada Kendala? + Health Status Aman?)
  - Right branch: d1→io3 Eskalasi (Y) → rejoins p7
  - Left branch: d2→p9 Performa Turun (N) → rejoins io4

- [x] **04 — KALKULASI SPI** `diagram/04_FLOWCHART_KALKULASI_SPI.drawio`
  - Gambar 4.4 Flowchart Kalkulasi SPI. ← caption diperbaiki (was: 4.3)
  - XML comment masih bertuliskan 4.3 (comment saja, tidak tampil di diagram)

- [x] **05 — PERSETUJUAN SURVEY** `diagram/05_FLOWCHART_PERSETUJUAN_SURVEY.drawio`
  - Gambar 4.5 Flowchart Alur Persetujuan Survey dan Eksekusi Proyek.
  - fillColor node sys-spi diperbaiki #F5F5F5 → #FFFFFF

- [x] **06 — UPLOAD EVIDENCE** `diagram/06_FLOWCHART_UPLOAD_EVIDENCE.drawio`
  - Gambar 4.6 Flowchart Upload Evidence Task. ← caption diperbaiki (was: 4.5)
  - XML comment masih bertuliskan 4.5 (comment saja, tidak tampil di diagram)

- [x] **USE CASE DIAGRAM** `docs/use-case-diagram.drawio`
  - Gambar 3.1 Use Case Diagram Sistem Dashboard PT Smart Home Inovasi.
  - Admin: 8 use cases (x=395, col kiri)
  - Manajer: 6 use cases (x=1195, col kanan atas)
  - Teknisi: 5 use cases (x=1195, col kanan bawah)
  - Note: konfirmasi popup + fitur komentar
  - pageWidth=1600, pageHeight=1200

---

## Audit Hasil
| File | Caption | fillColor | Status |
|------|---------|-----------|--------|
| 01_LOGIN | Gambar 4.1 | ✓ #FFFFFF | ✓ OK |
| 02_SEBELUM | Gambar 4.2 | ✓ #FFFFFF | ✓ OK |
| 03_SETELAH | Gambar 4.3 | ✓ #FFFFFF | ✓ OK |
| 04_SPI | Gambar 4.4 | ✓ #FFFFFF | ✓ OK |
| 05_SURVEY | Gambar 4.5 | ✓ #FFFFFF | ✓ OK |
| 06_EVIDENCE | Gambar 4.6 | ✓ #FFFFFF | ✓ OK |
| use-case | Gambar 3.1 | ✓ none/FFFFFF | ✓ OK |
