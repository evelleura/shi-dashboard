# STANDARD.md — Patokan Diagram BAB IV (Naskah TA)

Dokumen ini adalah binding standard untuk seluruh diagram di folder `diagram/ai/`.
Sumber kebenaran: file PNG kurasi di `naskah/bab4_gambar/Gambar_4.*.png`
(diekstrak dari DOCX BAB IV yang sudah di-approve).

**Aturan global:**
- Curated PNG = binding standard. Kalau ada konflik dengan kode/skema implementasi, ikut curated.
- Tidak ada inline caption "Gambar 4.XX" di dalam image (caption ditaruh di docx, bukan di drawio).
- Bahasa Indonesia untuk semua label diagram (kecuali nama tabel/kelas yang konvensional dipakai English).
- Role label: `Teknisi` / `Manajer` / `Admin` (UI). Tidak boleh "Manajer Proyek".
- Convert ke PNG: `python3 drawio2png.py <path>` (script di folder yang sama).

---

## Mapping 27 Diagram

| # | File drawio | Reference PNG | Tipe |
|---|---|---|---|
| 4.1 | `Flowchart/FC_ALUR_BERJALAN.drawio` | `Gambar_4.1_Alur_Sistem_Berjalan.png` | Flowchart |
| 4.2 | `Flowchart/FC_ALUR_DIUSULKAN.drawio` | `Gambar_4.2_Alur_Sistem_Diusulkan.png` | Flowchart |
| 4.3 | `Use Case/UC_SISTEM.drawio` | `Gambar_4.3_Use_Case_Diagram.png` | Use Case |
| 4.4 | `Activity/AD_AUTENTIKASI.drawio` | `Gambar_4.4_Activity_Autentikasi.png` | Activity |
| 4.5 | `Activity/AD_PENGELOLAAN_PROYEK.drawio` | `Gambar_4.5_Activity_Pengelolaan_Proyek.png` | Activity |
| 4.6 | `Activity/AD_PELAPORAN_REVIEW_GATE.drawio` | `Gambar_4.6_Activity_Pelaporan_ReviewGate.png` | Activity |
| 4.7 | `Activity/AD_DASHBOARD_EWS.drawio` | `Gambar_4.7_Activity_Dashboard_EWS.png` | Activity |
| 4.8 | `Activity/AD_ESKALASI.drawio` | `Gambar_4.8_Activity_Eskalasi.png` | Activity |
| 4.9 | `Sequence/SD_AUTENTIKASI.drawio` | `Gambar_4.9_Sequence_Autentikasi.png` | Sequence |
| 4.10 | `Sequence/SD_PENGELOLAAN_PROYEK.drawio` | `Gambar_4.10_Sequence_Pengelolaan_Proyek.png` | Sequence |
| 4.11 | `Sequence/SD_REVIEW_GATE.drawio` | `Gambar_4.11_Sequence_Pelaporan_ReviewGate.png` | Sequence |
| 4.12 | `Sequence/SD_DASHBOARD_EWS.drawio` | `Gambar_4.12_Sequence_Dashboard_EWS.png` | Sequence |
| 4.13 | `Sequence/SD_ESKALASI.drawio` | `Gambar_4.13_Sequence_Eskalasi.png` | Sequence |
| 4.14 | `Class/CD_SISTEM.drawio` | `Gambar_4.14_Class_Diagram.png` | Class |
| 4.15 | `ERD/ERD_KONSEPTUAL.drawio` | `Gambar_4.15_ERD.png` | ERD Konseptual |
| 4.16 | `ERD/RELASI_DATA.drawio` | `Gambar_4.16_Relasi_Antar_Tabel.png` | ERD Fisik |
| 4.17 | `Wireframe/Input/WF_17_LOGIN.drawio` | `Gambar_4.17_Antarmuka_Login.png` | Wireframe |
| 4.18 | `Wireframe/Input/WF_18_TAMBAH_PROYEK.drawio` | `Gambar_4.18_Antarmuka_Tambah_Proyek.png` | Wireframe |
| 4.19 | `Wireframe/Input/WF_19_TAMBAH_DAILY_REPORT.drawio` | `Gambar_4.19_Antarmuka_Tambah_Daily_Report.png` | Wireframe |
| 4.20 | `Wireframe/Proses/WF_20_DASHBOARD_EWS.drawio` | `Gambar_4.20_Antarmuka_Dashboard_EWS.png` | Wireframe |
| 4.21 | `Wireframe/Proses/WF_21_DATA_PROYEK.drawio` | `Gambar_4.21_Antarmuka_Data_Proyek.png` | Wireframe |
| 4.22 | `Wireframe/Proses/WF_22_KANBAN.drawio` | `Gambar_4.22_Antarmuka_Kanban.png` | Wireframe |
| 4.23 | `Wireframe/Proses/WF_23_JADWAL.drawio` | `Gambar_4.23_Antarmuka_Jadwal.png` | Wireframe |
| 4.24 | `Wireframe/Output/WF_24_DASHBOARD_PERFORMA_TEKNISI.drawio` | `Gambar_4.24_Antarmuka_Dashboard_Performa_Teknisi.png` | Wireframe |
| 4.25 | `Wireframe/Output/WF_25_DETAIL_PROYEK.drawio` | `Gambar_4.25_Antarmuka_Detail_Proyek.png` | Wireframe |
| 4.26 | `Wireframe/Output/WF_26_LAPORAN_KESEHATAN.drawio` | `Gambar_4.26_Antarmuka_Laporan_Kesehatan.png` | Wireframe |
| 4.27 | `Navigasi/NAVIGASI_SIDEBAR.drawio` | `Gambar_4.27_Navigasi_Sidebar.png` | Navigasi |

---

## Standar Per-Diagram

### 4.1 / 4.2 Flowchart (Alur Sistem)

**Konvensi:**
- Bentuk: oval (start/end), rectangle (proses), parallelogram (input/output), diamond (decision).
- Arah aliran: top-to-bottom, kiri-ke-kanan untuk percabangan paralel.
- 4.1 (berjalan): proses manual — laporan via WhatsApp, rekap Excel, koordinasi telepon.
- 4.2 (diusulkan): proses sistem digital — login dashboard, input via form, otomatisasi notifikasi.

**Wajib ada:**
- Node start (oval) + end (oval).
- Loop kembali ("Minta tambahan data ke teknisi" → "Teknisi melaporkan progres") di 4.1.

---

### 4.3 Use Case Diagram

**Aktor:** `TEKNISI` (kiri), `MANAJER` (kanan).

**Use case Teknisi:**
- Tinjau dashboard performa
- Melihat riwayat proyek
- Lihat detail tugas & proyek
- Mengisi daily report
- Lihat riwayat daily report
- Mengajukan eskalasi/kendala lapangan

**Use case Manajer:**
- Tinjau dashboard proyek
- Kelola data proyek
- Menghapus data pelanggan
- Lihat detail dan progres proyek
- Kelola penugasan teknisi
- Kelola daily report
- Menindaklanjuti eskalasi

**Use case bersama:** `Login` (tengah).

**Relasi:**
- Asosiasi (solid) dari aktor ke use case yang langsung diakses.
- `<<include>>` dari setiap UC ke `Login` (dashed, open arrow).
- `<<extend>>`: `Melihat riwayat proyek` → `Lihat detail tugas & proyek`; `Lihat riwayat daily report` → `Mengisi daily report`; `Lihat detail dan progres proyek` → `Kelola data proyek`.
- `<<exclude>>`: `Menghapus data pelanggan` → `Kelola data proyek` (manajer tidak boleh hapus pelanggan).

**Catatan teknis drawio:**
- Pakai `html=0` di edge style supaya text `<<include>>` tidak diparse sebagai HTML tag (atau gunakan guillemets `«include»`).
- Tambah `labelBackgroundColor=#FFFFFF` agar label terbaca di atas garis.

---

### 4.4 — 4.8 Activity Diagram

**Konvensi:**
- Swimlane vertikal: aktor di header (warna abu-abu `#E6E6E6`).
- Initial node: lingkaran hitam penuh.
- Final node: lingkaran hitam dengan ring.
- Decision: rhombus dengan label pertanyaan + Y/N pada edge keluar.
- Bentuk action: **rounded rectangle** (bukan sharp).

**4.4 Autentikasi:** 2 swimlane (User, Sistem). Decision "Kredensial valid?" (Y → ke dashboard, N → ke pesan error).

**4.5 Pengelolaan Proyek:** 2 swimlane (Manajer, Sistem). Decision opsional untuk validasi data.

**4.6 Pelaporan & Review Gate:** 3 swimlane (User Manajer, Sistem, User Teknisi). Decision "Apakah hasil pekerjaan valid?" dengan Y → "Menyetujui dan menggeser status tugas menjadi Done", N → "Mengirim catatan revisi kepada Teknisi" → loop balik ke Teknisi.

**4.7 Dashboard EWS:** 2 swimlane (Manajer, Sistem). Tanpa decision (alur lurus tampilkan metrik).

**4.8 Eskalasi:** 3 swimlane (Teknisi, Sistem, Manajer). Flow: ajukan eskalasi → sistem flag merah → manajer tindak lanjut → status `ditangani`.

**Wajib:**
- Label Y/N pada edge dari decision diamond, dengan `labelBackgroundColor=#FFFFFF`.
- Setiap arrow harus orthogonal (no diagonal).

---

### 4.9 — 4.13 Sequence Diagram

**Konvensi:**
- Aktor: stick figure dengan label `Teknisi` / `Manajer` di bawah.
- Lifeline (kotak object): light blue `#DAE8FC` fill, dark blue border.
- Lifeline NAME = business object Indonesia (`Form Login`, `Data User`, `Form Proyek`, `Data Proyek`, `Papan Kanban`, `Data Tugas`, `Dashboard`, `Form Eskalasi`, `Data Eskalasi`).
- Activation bar: light blue strip pada lifeline (5px setengah-lebar).
- Message style: solid arrow untuk request, dashed arrow untuk return.
- Self-message: panah loop pada lifeline yang sama, offset +5px dari center.

**Tidak boleh ada:**
- Title text "Sequence Diagram XXX" di atas — reference tidak punya title.

**4.9 Autentikasi:** Actor `User`, lifeline `Form Login`, `Data User`. 7 messages termasuk 2 self-message validasi.

**4.10 Pengelolaan Proyek:** Actor `Manajer`, lifeline `Form Proyek`, `Data Proyek`. 1 self-message "memfilter teknisi berdasarkan jadwal".

**4.11 Pelaporan & Review Gate:** Actor `Manajer` (kiri) + `Teknisi` (kanan), lifeline `Papan Kanban`, `Data Tugas`. Termasuk message "menghitung ulang SPI dan Health Status" (self-message pada Data Tugas).

**4.12 Dashboard EWS:** Actor `Manajer`, lifeline `Dashboard`, `Data Proyek`. Self-message untuk memproses kueri + mapping warna EWS.

**4.13 Eskalasi:** Actor `Teknisi` (kiri) + `Manajer` (kanan), lifeline `Form Eskalasi`, `Data Eskalasi`.

---

### 4.14 Class Diagram

**Wajib 8 class:**
`User`, `Client`, `Project`, `ProjectAssignment`, `ProjectHealth`, `Task`, `TaskEvidence`, `Escalation`.

**Atribut `ProjectHealth` (LENGKAP, sesuai reference):**
```
- project_id: int {PK, FK}
- spi_value: decimal
- status: enum (green/amber/red)
- deviation_percent: decimal       ← WAJIB ADA (dulu sempat dihapus, restore)
- actual_progress: decimal
- planned_progress: decimal
- total_tasks: int
- completed_tasks: int
- last_updated: timestamp
```

**Method `ProjectHealth`:**
```
+ recalculate(): void
+ getStatus(): HealthStatus
+ computePlannedValue(): decimal
+ sortByUrgency(): Project[]
+ computeEarnedValue(): decimal
```

**Relasi:**
- `Client (1) — memiliki — (*) Project`
- `User (1) — (*) ProjectAssignment` dan `Project (1) — (*) ProjectAssignment` (junction M:M)
- `Project (1) — memiliki — (1) ProjectHealth`
- `Project (1) — memiliki — (*) Task`
- `Task (1) — memiliki — (*) TaskEvidence`
- `Project (1) — (*) Escalation`
- `Task (1) — (*) Escalation`
- `User (1) — melaporkan — (*) Escalation`
- `User (1) — ditugaskan — (*) Task`

**Style:** rounded=0 box, divider line antara title/attrs/methods, `labelBackgroundColor=#FFFFFF` di label relasi supaya tidak overlap dengan body class. Pakai explicit `exitX/exitY/entryX/entryY` di edge untuk routing yang clean.

---

### 4.15 ERD Konseptual (Chen Notation)

**Wajib 6 entitas (tb_ prefix, lowercase):**
- `tb_klien` — atribut: `id_klien` (PK), `nama_klien`, `no_telp`, `alamat`
- `tb_proyek` — atribut: `id_proyek` (PK), `nama_proyek`, `id_klien` (FK), `project_value`, `status`, `phase`
- `tb_user` — atribut: `id_user` (PK), `nama`, `role`, `email`
- `tb_eskalasi` — atribut: `id_eskalasi` (PK), `id_proyek`, `priority`, `status`
- `tb_tugas` — atribut: `id_tugas` (PK), `due_date`, `id_proyek`, `status`
- `tb_bukti` — atribut: `id_bukti` (PK), `file_path`, `id_tugas`

**Visualisasi:**
- Entitas: rectangle (bold).
- Atribut: oval (PK pakai `fontStyle=4` underline).
- Relasi: rhombus dengan label.
- Cardinality: label `1` / `M` / `N` di edge.

**Relasi wajib (7):**
1. `tb_klien (1) — memiliki — (M) tb_proyek`
2. `tb_user (M) — mengelola — (M) tb_proyek`
3. `tb_proyek (1) — memiliki — (M) tb_eskalasi`
4. `tb_user (1) — melaporkan — (M) tb_eskalasi`
5. `tb_proyek (1) — memiliki — (M) tb_tugas`
6. `tb_user (1) — mengerjakan — (M) tb_tugas`
7. `tb_tugas (1) — memiliki — (M) tb_bukti`

**TIDAK BOLEH ADA:** `Daily Report`, `Audit Log`, `Aktivitas Tugas`, `Penugasan Proyek` (sebagai weak entity), `Kesehatan Proyek` (di level konseptual).

---

### 4.16 ERD Fisik / Relasi Antar Tabel

**Konvensi:**
- Tabel: dark blue header `#4D7EA8`, putih text.
- Field: PK bold + light blue row, FK italic blue text, NN/nullable indicator.
- Edge: orthogonal dengan ERmany/ERone arrow notation.

**Wajib 9 tabel (`shi_` prefix):**
1. `shi_users`
2. `shi_clients`
3. `shi_projects`
4. `shi_project_assignments`
5. `shi_project_health`
6. `shi_tasks`
7. `shi_task_evidence`
8. `shi_materials`
9. `shi_budget_items`

**TIDAK ADA di diagram 4.16:** `daily_reports`, `task_activities`, `escalations`, `audit_log`, `notifications`.
*(Catatan: tabel-tabel ini ADA di schema.sql implementasi, tapi tidak digambar di ERD fisik thesis.)*

---

### 4.17 — 4.26 Wireframe

**Konvensi global:**
- Frame browser mockup: title bar `Login - SHI` / `Dashboard EWS - SHI` / dst, URL `https://shi-crm.id/...`, header brand `PT Smart Home Inovasi - Sistem Manajemen Proyek`.
- Font: Comic Sans MS (sketch feel) — sesuai mockup tool.
- Color: grayscale + black accent untuk button utama (`[Masuk]`, `[Simpan]`).
- Indicator: `[MERAH]` / `[KUNING]` / `[HIJAU]` untuk status proyek; `[!]` `[~]` `[v]` untuk EWS icons.

**TIDAK BOLEH ADA:**
- Inline caption `Gambar 4.XX ...` di dalam image. Caption hanya di docx, bukan di drawio.

**Wireframe-specific:**

| # | Halaman | Komponen kunci |
|---|---|---|
| 4.17 | Login | Email, Kata Sandi, tombol Masuk, hint role di bawah |
| 4.18 | Tambah Proyek | Form: nama, klien, tanggal, nilai, fase, deskripsi |
| 4.19 | Tambah Daily Report | Progress %, kendala, foto upload, tombol Simpan |
| 4.20 | Dashboard EWS | 4 stat card (Total/Merah/Kuning/Hijau) + tabel daftar proyek dengan kolom: **Status, Nama Proyek, Klien, SPI, Deviasi, Update Terakhir** + section Eskalasi Terbaru |
| 4.21 | Data Proyek | Tabel proyek dengan filter, search, tombol tambah |
| 4.22 | Kanban | 5 kolom: To Do / Working On It / Done / Overtime (computed) / Over Deadline (computed) |
| 4.23 | Jadwal | Timeline/calendar view per teknisi |
| 4.24 | Dashboard Performa Teknisi | Chart performa + tabel teknisi |
| 4.25 | Detail Proyek | Tab info, tugas, anggaran, bukti, eskalasi |
| 4.26 | Laporan Kesehatan | Ringkasan SPI + grafik trend + EWS detail |

---

### 4.27 Navigasi Sidebar

**Item menu (untuk Manajer):** Dashboard, Proyek, Klien, Jadwal, Laporan, Pengaturan.
**Footer:** Keluar.
**Untuk Teknisi:** Dashboard, Tugas Saya, Jadwal, Riwayat, Keluar.

---

## Aturan Generator drawio (Python)

Saat menulis generator (`_gen_*.py`):
- Style edge default: `endArrow=open;endFill=0;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;jettySize=auto;orthogonalLoop=1;`
- Label background: tambahkan `labelBackgroundColor=#FFFFFF;` di edge styles agar label tidak overlap dengan body shape lain.
- Untuk stereotype `<<...>>`: pakai `html=0` di edge style atau XML-escape ke `&lt;&lt;...&gt;&gt;`.
- Exit/entry sides: pakai `exitX=...;exitY=...;entryX=...;entryY=...` eksplisit untuk relasi yang sering overlap (terutama Class Diagram dan ERD).
- Bahasa Indonesia konsisten: `memiliki`, `mengelola`, `mengerjakan`, `melaporkan`, `ditugaskan`, `menjalani`, `mencatat`.

---

## Cara Convert ke PNG

```bash
# Single file
python3 diagram/ai/drawio2png.py <path/to/file.drawio>

# Whole directory (recursive)
python3 diagram/ai/drawio2png.py diagram/ai/

# All 27 diagrams at once
python3 diagram/ai/drawio2png.py diagram/ai/ --parallel
```

Script menggunakan `drawio` CLI (Homebrew di macOS: `/opt/homebrew/bin/drawio`).
Output PNG selalu sebelahan dengan .drawio source dengan border 20px.

---

## Verification Workflow

Setelah edit drawio:
1. Run `python3 drawio2png.py <file>` untuk regen PNG.
2. Compare visual dengan reference: `naskah/bab4_gambar/Gambar_4.XX_*.png`.
3. Kalau divergen, edit drawio (atau generator script-nya) dan ulangi.
4. Curated PNG = binding. Implementasi kode boleh berbeda — diagram ikut docx.
