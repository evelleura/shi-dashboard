# Latar Belakang Masalah dan Perumusan Masalah

## Latar Belakang Masalah

### Konteks Perusahaan
PT Smart Home Inovasi (SHI) Yogyakarta adalah perusahaan teknologi yang mengkhususkan diri pada pengembangan solusi Smart Home dan IoT. Operasional perusahaan meliputi:
1. Penerimaan pesanan klien
2. Survei lokasi
3. Perencanaan desain sistem
4. Pelaksanaan instalasi perangkat
5. Integrasi antar-komponen
6. Pengujian dan serah terima proyek

Untuk mendukung operasional tersebut, SHI telah mengimplementasikan aplikasi manajemen proyek dengan fitur:
- Pengelolaan data proyek
- Penjadwalan
- Penugasan teknisi
- Pencatatan laporan harian (daily report)

### Masalah Utama Teridentifikasi

#### 1. **Akses Teknisi Lapangan Terbatas**
**Situasi Saat Ini:**
- Aplikasi manajemen proyek hanya dapat diakses oleh manajer
- Teknisi lapangan TIDAK dapat menginput data daily report secara langsung
- Teknisi harus melaporkan secara tidak langsung (via perantara manajer)

**Dampak Bisnis:**
- Proses pelaporan bertele-tele dan tidak efisien
- Lag informasi: keterlambatan antara peristiwa di lapangan dan tercatatnya di sistem
- Data tidak akurat karena melalui perantara

#### 2. **Ketiadaan Visualisasi Dashboard**
**Situasi Saat Ini:**
- Tidak ada dashboard untuk ringkasan kondisi seluruh proyek
- Manajer harus membaca laporan satu per satu secara manual
- Informasi disajikan dalam format tekstual (daily report mentah)

**Dampak Bisnis:**
- Proses pemantauan memakan waktu
- Sulit memahami kondisi portofolio proyek secara komprehensif
- Tidak ada visualisasi untuk perbandingan progres ideal vs aktual

#### 3. **Deteksi Masalah Lambat (Reactive)**
**Situasi Saat Ini:**
- Tanpa indikator risiko terukur, manajer sering mengabaikan proyek kritis
- Identifikasi masalah tergantung pada inisiatif manajer membaca laporan
- Keterlambatan hanya terdeteksi ketika sudah menjadi masalah besar

**Dampak Bisnis:**
- Penurunan efisiensi operasional
- Keterlambatan penyelesaian proyek meningkat
- Kepuasan pelanggan menurun
- Risiko finansial meningkat

#### 4. **Pengambilan Keputusan Subjektif**
**Situasi Saat Ini:**
- Manajer memprioritaskan penanganan masalah proyek berdasarkan intuisi atau penilaian subjektif
- Tidak ada kriteria objektif dan terukur untuk penentuan prioritas
- Proyek yang sebenarnya kritis mungkin diabaikan

**Dampak Bisnis:**
- Alokasi sumber daya tidak optimal
- Beberapa proyek tertarah sedangkan yang lain tepat waktu
- Inkonsistensi dalam pengambilan keputusan manajemen

---

## Rumusan Masalah

**Bagaimana merancang fitur dashboard yang mampu mengolah data daily report menjadi visualisasi status proyek yang mudah dipahami guna membantu manajer proyek dalam menentukan prioritas penanganan masalah secara objektif di PT Smart Home Inovasi Yogyakarta?**

---

## Batasan Masalah

### Scope Teknis:

1. **Data yang Diproses:**
   - Daily report mencakup: nama proyek, tanggal laporan, persentase progres harian, catatan kendala
   - Baseline jadwal proyek: tanggal mulai dan target selesai

2. **Metode Perhitungan:**
   - Deviasi progres dihitung dengan membandingkan realisasi aktual vs progres ideal
   - **TANPA** menggunakan machine learning atau kecerdasan buatan prediktif

3. **Kategorisasi Otomatis:**
   - Sistem mengkategorikan status kesehatan proyek ke dalam beberapa kategori
   - Proyek diurutkan berdasarkan tingkat urgensi pada dashboard

4. **Output Sistem:**
   - Dashboard dengan indikator kode warna (hijau, kuning, merah)
   - Detail: progres aktual, progres ideal, deviasi, catatan kendala terakhir

5. **Pengguna Sistem:**
   - Manajer Proyek: pemantau dashboard
   - Teknisi Lapangan: penginput data daily report

6. **Exclusion (Diluar Scope):**
   - Data keuangan (anggaran, pembayaran, invoice)
   - Pengadaan material
   - Manajemen sumber daya manusia (SDM)
   - Gantt chart
   - Predictive analytics

---

## Tujuan Penelitian

**Merancang dan mengembangkan fitur dashboard pada sistem project management yang mampu mengolah data daily report secara otomatis menjadi indikator visual status kesehatan proyek (Project Health Status) di PT SHI.**

---

## Manfaat Penelitian

### 1. Peningkatan Objektivitas Pengambilan Keputusan
- Manajer dapat menentukan prioritas penanganan proyek berdasarkan indikator visual yang terukur
- Bukan lagi berdasarkan intuisi atau penilaian subjektif
- Setiap keputusan dapat dipertanggungjawabkan dengan data

### 2. Akselerasi Identifikasi Masalah (Preventive)
- Sistem otomatis menonjolkan proyek dengan status kritis ke urutan teratas dashboard
- Potensi keterlambatan fatal dapat dideteksi lebih dini
- Tindakan penanganan dapat dilakukan secara preventif (sebelum masalah besar)

### 3. Efisiensi Operasional
- Pelaporan dari teknisi ke manajer menjadi lebih lancar
- Teknisi dapat menginput data daily report secara langsung tanpa perantara
- Manajer dapat mengevaluasi status proyek dengan cepat tanpa memeriksa satu per satu

### 4. Peningkatan Kepuasan Pelanggan
- Proyeknya dikerjakan dengan lebih efisien
- Risiko keterlambatan berkurang
- Komunikasi status proyek menjadi lebih transparan dan objektif

### 5. Dukungan Pengambilan Keputusan Strategis
- Eksekutif/pimpinan dapat memantau kesehatan portofolio proyek secara real-time
- Data akurat untuk perencanaan sumber daya jangka panjang
- Identifikasi pola dan tren dalam kinerja proyek

---

## Kriteria Keberhasilan

Penelitian ini dianggap berhasil jika:

1. **Fungsionalitas:**
   - Dashboard dapat menampilkan ringkasan proyek dengan indikator RAG (Red-Amber-Green)
   - SPI dihitung otomatis berdasarkan daily report
   - Teknisi dapat menginput daily report secara langsung

2. **Usability:**
   - Manajer dapat memahami kondisi proyek sekilas dari visualisasi dashboard
   - Interface intuitif dan mudah navigasi
   - Tidak memerlukan pelatihan teknis yang kompleks

3. **Akurasi Data:**
   - Perhitungan SPI dan kategorisasi status akurat
   - Data dari daily report tercermin dengan benar di dashboard
   - Tidak ada data yang hilang atau terduplikasi

4. **Performa:**
   - Dashboard dapat menampilkan data dengan responsif (real-time)
   - Dapat menangani 100+ proyek secara efisien
   - Loading time dalam batas yang dapat diterima pengguna

5. **Validasi Pengguna:**
   - UAT (User Acceptance Test) dengan manajer dan teknisi PT SHI
   - Skor kepuasan pengguna minimal 80%
   - Feedback positif terkait implementasi early warning system

---

## Referensi Permasalahan

Efektivitas pendekatan dashboard untuk manajemen proyek telah dibuktikan oleh:

- **Ernawan (2024):** Dashboard manajemen mampu membantu eksekutif memantau KPI secara real-time, meningkatkan akurasi data, dan mempercepat identifikasi masalah proyek
- **Azkia dkk. (2024):** Dashboard monitoring menggunakan EVM mencapai tingkat kepuasan pengguna 86% dan relevansi tinggi
- **Auliansyah dkk. (2023):** Sistem monitoring berbasis Kurva-S berhasil menghitung deviasi keterlambatan proyek dengan akurasi tinggi

---

## Konteks Penelitian

Penelitian ini adalah **pengembangan fitur pada sistem yang sudah berjalan** (bukan sistem baru). Dengan pendekatan prototyping, sistem dapat:
1. Disesuaikan dengan kebutuhan spesifik PT SHI
2. Diuji dan diperbaiki secara iteratif
3. Diintegrasikan dengan infrastruktur yang sudah ada
4. Diluncurkan secara bertahap untuk meminimalkan disruption
