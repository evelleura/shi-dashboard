# Pengembangan Fitur Dashboard pada Sistem Project Management Berdasarkan Data Daily Report

## Identitas Penulis
- **Nama:** Dian Putri Iswandi
- **NIM:** 5220311118
- **Program Studi:** Sistem Informasi, Program Sarjana
- **Fakultas:** Sains & Teknologi
- **Universitas:** Universitas Teknologi Yogyakarta
- **Tahun:** 2026

---

## Studi Kasus
**PT Smart Home Inovasi (SHI) Yogyakarta**
- Lokasi: Kabupaten Sleman, Daerah Istimewa Yogyakarta
- Bidang: Pengembangan solusi Smart Home dan Internet of Things (IoT)
- Visi: Penyedia solusi hunian cerdas terdepan

---

## Ringkasan Eksekutif

Penelitian ini mengembangkan fitur dashboard pada sistem project management berbasis data daily report untuk PT Smart Home Inovasi. Dashboard ini dirancang untuk mengatasi masalah:

1. **Akses Teknisi Terbatas:** Teknisi lapangan tidak memiliki akses langsung ke sistem pelaporan (harus melalui perantara)
2. **Ketiadaan Visualisasi:** Tidak ada dashboard untuk ringkasan kondisi proyek secara visual
3. **Deteksi Masalah Lambat:** Manajer sering melewatkan proyek kritis (reactive, bukan preventive)
4. **Pengambilan Keputusan Subjektif:** Tanpa indikator terukur, prioritas proyek didasarkan intuisi

---

## Solusi Utama

### Dua Aspek Pengembangan Utama:
1. **Akses Langsung Teknisi:** Memberi wewenang teknisi lapangan untuk menginput daily report secara mandiri
2. **Dashboard Cerdas (Smart System):** Otomasi kategorisasi status kesehatan proyek menggunakan perhitungan SPI

### Mekanisme Smart System:
- **Input:** Teknisi memasukkan persentase progres harian (Earned Value)
- **Kalkulasi:** Sistem otomatis menghitung Planned Value (persentase ideal berdasarkan durasi proyek)
- **Perbandingan:** Membandingkan EV vs PV untuk menghasilkan Schedule Performance Index (SPI)
- **Visualisasi:** Hasil ditampilkan sebagai indikator kode warna (Green/Amber/Red) pada dashboard
- **EWS:** Sistem peringatan dini secara otomatis mengurutkan proyek berdasarkan kekritisan

---

## Manfaat Penelitian

1. **Peningkatan Objektivitas:** Manajer membuat keputusan berdasarkan metrik terukur, bukan intuisi
2. **Deteksi Dini Proyek Kritis:** Sistem otomatis menonjolkan proyek berisiko ke urutan teratas
3. **Efisiensi Operasional:** Pelaporan lebih lancar dengan akses langsung teknisi
4. **Mitigasi Risiko:** Keterlambatan dapat diidentifikasi dan ditangani secara preventif

---

## Pendekatan Penelitian

- **Metode:** Prototyping (Iterative SDLC)
- **Tahapan:** 8 tahap dari analisis kebutuhan hingga release dashboard
- **Evaluasi:** Uji prototype dengan pengguna, black-box testing, integritas data

---

## Batasan Penelitian

Sistem mengatasi aspek **monitoring jadwal** saja. **TIDAK mencakup:**
- Data keuangan atau pengadaan material
- Prediksi berbasis machine learning
- Gantt chart atau drag-and-drop Kanban
- Analitik prediktif kompleks

---

## Referensi Utama

Penelitian ini didasarkan pada 8 penelitian terdahulu (2023-2025) yang relevan:
- Azkia dkk. (2024): Dashboard EVM untuk proyek konstruksi telekomunikasi
- Ernawan (2024): Dashboard manajemen untuk pengambilan keputusan strategis
- Auliansyah dkk. (2023): Sistem monitoring menggunakan Kurva-S
- Dan 5 penelitian lainnya yang mendukung validasi pendekatan dashboard

---

## Kontribusi Ilmiah

Perbedaan utama dengan penelitian terdahulu:
1. **Fokus Spesifik:** Smart system untuk kategorisasi otomatis status kesehatan proyek
2. **Metode Sederhana:** Perhitungan deviasi progres yang tidak memerlukan kompleksitas EVM penuh
3. **Alur Operasional:** Desentralisasi pelaporan (teknisi → dashboard langsung, bukan via manajer)
4. **SPI-based EWS:** Early Warning System otomatis berbasis Schedule Performance Index

---

## Outcome Harapan

- Fitur dashboard yang intuitif dan visual
- Kategorisasi otomatis status kesehatan proyek (RAG)
- Early Warning System untuk deteksi dini keterlambatan
- Peningkatan efisiensi manajemen proyek di PT SHI
- UAT approval dan implementasi operasional

---

## Dokumentasi Terkait

- Lihat: `02_PROBLEM_STATEMENT.md` - Penjelasan masalah bisnis secara detail
- Lihat: `03_ARCHITECTURE.md` - Desain sistem teknis
- Lihat: `04_DATA_MODEL.md` - Struktur database dan relasi
- Lihat: `05_IMPLEMENTATION.md` - Hasil implementasi dan pengujian
- Lihat: `DIAGRAMS/` - Diagram UML dan ERD
