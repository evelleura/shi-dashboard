# Catatan Wireframe — Naskah TA Final 4.pdf

Sumber: `docs/Naskah TA Final 4.pdf` halaman 53–66 (Bab 4.3.5 Perancangan Antarmuka).
Gambar telah diekstrak ke folder ini sebagai PNG `4.NN-*.png`.

Catatan ini WAJIB dirujuk saat membuat / mengubah UI agar tampilan
konsisten dengan rancangan yang sudah disetujui dosen pembimbing.

---

## 0. Konvensi Visual Umum (semua halaman terlindungi)

Ditarik dari kesamaan visual di Gambar 4.18, 4.20, 4.21, 4.22, 4.23, 4.24:

### Top bar
- **Latar gelap** (slate / grey-700), tinggi ±48 px, garis pemisah bawah.
- **Kiri**: teks `PT Smart Home Inovasi` (bold).
- **Kanan**: `<Peran>: [Nama Pengguna] | Keluar`
  - Peran = "Manajer" atau "Teknisi".
  - "Keluar" adalah link / tombol kecil.

### Sidebar
- **Latar putih**, lebar ±208 px, garis pemisah kanan abu-abu muda.
- Label `MENU` di atas (huruf kapital, kecil, abu-abu).
- Setiap item: teks plain, padding kecil; item **aktif diberi penanda kotak hitam `■`** di kiri.
- "Keluar" muncul di paling bawah (di-pisahkan border atas).

**Menu Manajer** (urutan PDF):
1. Dashboard
2. Proyek
3. Klien
4. Jadwal
5. Laporan
6. Pengaturan

**Menu Teknisi** (urutan PDF):
1. Dashboard
2. Tugas Saya
3. Daily Report
4. Profil

### Konten utama
- Latar abu sangat muda (slate-50).
- Header halaman: judul bold, opsional subjudul kecil.
- Tabel: rounded corners ringan, border abu-abu, header bg sedikit lebih gelap dari body.
- Tombol primer: kotak hitam / slate-900 (tidak biru cerah). Wireframe selalu pakai hitam.
- Tombol skunder (Batal): outline.

---

## 0a. Gambar 5.23 — Halaman Beranda (Landing Publik)

File rujukan: `4.30.png` lewat — tidak; render PDF asli ada di Bab 5.

**Halaman Beranda WAJIB ada.** Lihat Naskah TA Final 4 Bab 5.1.2 (1)(a),
Gambar 5.23, halaman 79 (cetak) / PDF fisik halaman 92.

Karakteristik desain (ekstrak dari screenshot implementasi):

- **Latar gelap penuh** (slate-950 / hampir hitam).
- **Logo SHI**: kotak kecil ±56 px dengan gradien `pink-500 → purple-600`,
  posisi tengah atas, teks `SHI` putih tebal.
- **Kredit**: `CREATED BY @DIANPUTRIISWANDI` — huruf kapital, tracking
  lebar, abu sangat muda.
- **Headline besar (2 baris)**:
  - Baris 1: `HOME TECHNOLOGY` (putih solid, extra-bold, ~6xl).
  - Baris 2: `EXPERTS` (gradien pink→purple via `bg-clip-text`).
- **Subtitle**: `Integrated control system of nearly every aspect of your home or business.`
- **CTA**: pill gradien pink→purple bertuliskan `Sign In` di tengah.
- **Background dekoratif**: lingkaran blur kecil-kecil di pojok (efek
  particle), huruf `N` kecil di kiri bawah, kata `scroll` di bawah CTA.
- Jika user sudah login → auto-redirect ke `/dashboard`.

Catatan: halaman ini memakai **bahasa Inggris** (HOME TECHNOLOGY EXPERTS,
Sign In) sebagai halaman marketing publik. Berbeda dengan halaman
internal sistem yang seluruhnya berbahasa Indonesia.

Implementasi: `src/app/page.tsx`.

---

## 1. Gambar 4.17 — Wireframe Login (DEPRECATED / hanya konsep awal)

File: `4.17-login.png`

Wireframe Bab 4 ini hanya rancangan awal minimalis dengan tombol hitam.
**JANGAN DIPAKAI** sebagai sumber kebenaran — implementasi nyata di Bab 5
(Gambar 5.24) berubah jadi split-screen biru. Selalu gunakan Gambar 5.24.

## 1b. Gambar 5.24 — Halaman Login (IMPLEMENTASI YANG DIPAKAI)

Lokasi: Naskah TA Final 4 hal 80 (cetak) / PDF fisik hal 93.

**Pola tata letak split-screen:**

### Panel kiri (≥lg, lebar ~55%)
- Latar **gradien biru** `from-blue-600 via-blue-700 to-indigo-900`.
- Pola titik radial putih opacity rendah sebagai background.
- Beberapa lingkaran particle/ring putih semi-transparan tersebar.
- Logo bundar di tengah: lingkaran ±80 px dengan ikon rumah, glow blur
  putih di belakangnya.
- Judul `Smart Home` (putih, 4xl bold) + baris kedua `Inovasi` (biru muda
  `text-blue-200`).
- Subtitle paragraf pendek tentang dashboard.
- 4 pill badge: `Real-time SPI`, `Kanban Boards`, `Analytics`, `Alerts`.
- Footer kecil di bawah: `© PT Smart Home Inovasi — Yogyakarta`.

### Panel kanan (selalu tampil)
- Latar putih / slate-50.
- Heading `Welcome back` (3xl bold) + subtitle `Sign in to your dashboard
  account`.
- Field Email dengan ikon amplop di kiri input, placeholder `Enter your
  email`.
- Field Password dengan ikon gembok di kiri, tombol mata di kanan untuk
  toggle visibility, placeholder `Enter your password`.
- Tombol `Sign In` lebar penuh, **gradien biru→indigo**, dengan spinner
  saat loading.
- Box kecil di bawah: list akun demo (manajer & teknisi).
- Footer kecil: kredit Tugas Akhir.

### Catatan bahasa
Login + Beranda memakai **bahasa Inggris** (Welcome back, Sign In, dst)
sebagai halaman publik / marketing. Sisanya (setelah login) **harus 100%
bahasa Indonesia**.

Implementasi: `src/app/login/page.tsx`

---

## 2. Gambar 4.18 — Halaman Tambah Proyek (Manajer)

File: `4.18-tambah-proyek.png`

Header halaman: **Tambah Proyek Baru**.

Tiga seksi dengan judul bernomor:

### 1. Informasi Proyek
- Nama Proyek (text, placeholder `Instalasi IoT Cluster A`)
- Nilai Proyek (Rp) (number, placeholder `150.000.000`)
- Klien (select, placeholder `[Pilih klien]`)
- Status (select, default `active`)
- Tanggal Mulai / Tanggal Selesai (date dd/mm/yyyy)
- Phase (select, default `survey`)

### 2. Penugasan Teknisi (rekomendasi sistem berdasarkan jadwal)
- Daftar checkbox per teknisi `[ ] Budi (Teknisi)`, `[x] Andi (Teknisi)`, `[ ] Citra (Teknisi)`
- Di kanan setiap baris: status ketersediaan — `Tersedia` atau `Bentrok 12-15 Mei` (merah jika bentrok).

### 3. Dekomposisi Daftar Tugas
- Tabel kolom: Nama Tugas | Tanggal Tenggat | Ditugaskan | Aksi (Hapus)
- Tombol `+ Tambah Tugas` di bawah (kotak putus-putus).

### Footer
- Tombol `Batal` (outline) + `Simpan Proyek` (hitam) di pojok kanan bawah.

Belum diimplementasi penuh — sekarang masih form pendek di `src/app/projects/new/`.

---

## 3. Gambar 4.19 / 4.25 — Tambah Laporan Harian (Teknisi)

File: `4.19-tambah-laporan-harian.png`, `4.25-laporan-harian-teknisi.png`

Header: **Tambah Laporan Harian**.

Field:
- Tanggal Laporan (auto today, contoh `07 Mei 2026 (otomatis - hari ini)`)
- Pilih Proyek (select)
- Pilih Tugas (select)
- Persentase Progres Hari Ini (%) (number 0-100, helper: `0-100, akumulatif terhadap tugas`)
- Status Tugas Setelah Laporan (select, helper: `Catatan: Done hanya disetujui oleh Manajer`)
- Catatan / Kendala Lapangan (textarea, placeholder `Tulis kendala atau catatan teknis di sini…`)
- Unggah Bukti Pekerjaan (Foto / dokumen) — area drag & drop dengan helper: `Format: jpg, png, pdf | maks 10 MB / berkas`

Footer: `Batal` (outline) + `Kirim Laporan` (hitam).

Belum diimplementasi — perlu halaman `/reports/new` untuk teknisi.

---

## 4. Gambar 4.20 — Dashboard EWS (Manajer)

File: `4.20-dashboard-ews.png`

Header halaman: **Dashboard — Early Warning System (EWS)**.

### Empat kartu status (grid 4 kolom, urutan TETAP):
1. **Total Proyek** — angka besar (`12`), tanpa badge.
2. **Status Merah** — angka (`3`), badge bulat merah berisi `x`.
3. **Status Kuning** — angka (`4`), badge bulat kuning berisi `!`.
4. **Status Hijau** — angka (`5`), badge bulat hijau berisi `✓`.

### Tabel Daftar Proyek (subtitle: "diurutkan dari status paling kritis")
Kolom: **Status | Nama Proyek | Klien | SPI | Deviasi | Update Terakhir**

Contoh isi:
| Status   | Nama Proyek          | Klien            | SPI  | Deviasi | Update Terakhir |
|----------|----------------------|------------------|------|---------|-----------------|
| [MERAH]  | Instalasi Cluster A  | PT Mitra Aksara  | 0.72 | -28%    | 07/05 09:14     |
| [MERAH]  | Renovasi Server B    | PT Bina Daya     | 0.81 | -19%    | 07/05 09:02     |
| [KUNING] | Pemasangan IoT Lt 3  | Yayasan Cahaya   | 0.88 | -12%    | 06/05 16:40     |
| [HIJAU]  | Instalasi Smart Off. | PT Maju Bersama  | 0.97 | -3%     | 07/05 10:05     |

Status diapit kurung kotak — boleh ditampilkan sebagai pill berwarna.

### Panel Eskalasi Terbaru (membutuhkan tindakan)
Daftar baris ringkas: `Andi (Teknisi) - Cluster A: kabel utama tidak kompatibel | 07/05 08:50`.

Implementasi: `src/app/dashboard/page.tsx` + `tabel-client.tsx`.

---

## 5. Gambar 4.21 — Data Proyek (Manajer)

File: `4.21-data-proyek.png`

Header: **Data Proyek**.

### Filter bar (di atas tabel)
Dari kiri ke kanan:
- Input pencarian (placeholder `Cari nama proyek…`)
- Dropdown `[Status: semua]`
- Dropdown `[Phase: semua]`
- Dropdown `[Klien: semua]`
- (paling kanan) Tombol hitam `+ Tambah Proyek`

### Tabel
Kolom: **ID | Nama Proyek | Klien | Status | Phase | Mulai | Selesai | Aksi**

Aksi berisi 3 tombol kecil: **Lihat | Edit | Hapus** (warna abu / biru / merah).

Footer: `Menampilkan 1-7 dari 12 proyek` + pagination `« 1 2 3 »` di kanan.

Implementasi: `src/app/projects/page.tsx` + `tabel-client.tsx`.

---

## 6. Gambar 4.22 — Kanban Penugasan Proyek (Manajer)

File: `4.22-kanban-penugasan.png`

Header: **Kanban Penugasan Proyek**.

### Toolbar atas
Dari kiri: dropdown `[Proyek: Instalasi Cluster A — PRJ-001]`, dropdown `[Teknisi: semua]`.
Sisi kanan: ringkasan `Total Tugas: 12 | Selesai: 5 | SPI: 0.91`.

### Tiga kolom Kanban
- **To Do** (subtitle: `(Belum Dikerjakan)`)
- **Working On It** (subtitle: `(Sedang Dikerjakan)`)
- **Done** (subtitle: `(Disetujui Manajer)`)

Tiap kartu tugas berisi:
- Judul tugas (bold)
- `Tanggal: dd/mm`
- `Teknisi: Nama`
- Tombol kecil `[Bukti]` di pojok kanan bawah (jika ada bukti unggah)

Kolom To Do diakhiri tombol `+ Tambah Tugas` (kotak putus-putus).

Implementasi sekarang ada di halaman Detail Proyek (per-proyek), bukan halaman tersendiri.

---

## 7. Gambar 4.23 — Dashboard Performa Saya (Teknisi)

File: `4.23-dashboard-performa-teknisi.png`

Header: **Dashboard Performa Saya**.

### Empat kartu KPI (urutan)
1. **SPI Saya** — `0.94` (helper: `target ≥ 0.95`)
2. **Tugas Selesai** — `18` (`akumulasi 30 hari`)
3. **Tugas Berjalan** — `4` (`saat ini`)
4. **Tugas Overdue** — `1` (`perlu eskalasi`)

### Pie chart "Komposisi Status Tugas Saya (30 hari terakhir)"
Legend di samping:
- Selesai (18 tugas)
- Working On It (1 tugas)
- To Do (4 tugas)
- Review (1 tugas)
- Total: 24 tugas

### Panel "Laporan Terbaru" (di kanan pie)
List ringkas 3-4 entri: `Instalasi sensor utama — 07/05 17:30`.

### Tabel "Tugas Saat Ini"
Kolom: **Tugas | Proyek | Status | Tanggal | SPI**

Implementasi: `src/app/dashboard/page.tsx` (cabang `role === 'technician'`). Pie chart belum ada.

---

## 8. Gambar 4.24 — Detail Proyek

File: `4.24-detail-proyek.png`

Halaman ringkasan satu proyek. Menampilkan: nama, klien, fase, kesehatan,
SPI, planned vs actual progress, daftar tugas, eskalasi aktif, log instruksi
manajer.

Implementasi parsial: `src/app/projects/[id]/page.tsx`.

---

## 9. Gambar 4.26–4.30 (halaman lanjutan)

File: `4.26.png` … `4.30.png`. Lihat masing-masing PNG — biasanya halaman
profil, pengaturan, daftar klien, dll. Cek isinya sebelum implementasi
fitur terkait.

---

## Cara Menambah / Memperbarui Catatan

Saat menemukan rancangan baru atau detail yang terlewat:

1. Render halaman PDF terkait:
   ```
   pdftoppm -r 100 -f <halaman> -l <halaman> "docs/Naskah TA Final 4.pdf" /tmp/page -png
   ```
2. Pindahkan ke `docs/wireframes/` dengan nama `Gambar-X.YY-deskripsi.png`.
3. Tambahkan seksi baru di file ini dengan urutan sesuai nomor Gambar.

---

## Aturan Konsistensi UI (RINGKAS)

- Top bar: gelap, kiri brand, kanan identitas + Keluar.
- Sidebar: putih, ■ untuk item aktif.
- Tombol primer: **hitam** (slate-900), bukan biru.
- Tabel: kolom Aksi berisi 3 tombol (Lihat/Edit/Hapus untuk admin/manajer).
- Status RAG: ditulis `MERAH / KUNING / HIJAU` (boleh sebagai pill berwarna).
- Bahasa: **100% Bahasa Indonesia** di seluruh UI. Tidak ada kata Inggris yang terlihat user kecuali nama metrik resmi (SPI, EV, PV, EWS).
