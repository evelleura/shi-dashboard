---
name: thesis-root
description: Root node of the TA memory graph - identity, problem, solution, result of Dian's thesis on PT SHI dashboard EWS
metadata:
  type: reference
---

# Thesis Root

Node `[[thesis]]` in `graph.json`. Source: `Naskah TA Final 4.pdf` (114 pages). Per-chapter text under `../bab/`, raw page text under `../text/`, image inventory in `../_manifest.json`.

**Judul:** Pengembangan Fitur Dashboard pada Sistem Manajemen Proyek Berdasarkan Data Laporan Harian
**Studi Kasus:** PT Smart Home Inovasi Yogyakarta (PT SHI)

## people

- `[[person:dian]]` Dian Putri Iswandi, NPM 5220311118 - penulis.
- `[[person:adityo]]` Adityo Permana Wibowo, S.Kom., M.Cs. (NIK 110116079) - Dosen Pembimbing / Penguji II, sekaligus Ketua Prodi Sistem Informasi.
- `[[org:uty]]` Universitas Teknologi Yogyakarta, Prodi Sistem Informasi Program Sarjana, Fakultas Sains & Teknologi, 2026.

## company

`[[org:pt-shi]]` PT Smart Home Inovasi - perusahaan teknologi Smart Home + IoT di Sleman, DIY. Proses bisnis: terima pesanan -> survei lokasi -> desain -> instalasi perangkat -> integrasi -> pengujian -> serah terima.

## problem

Sistem manajemen proyek PT SHI yang berjalan punya fitur laporan harian, tapi:
1. Hanya manajer yang bisa akses; teknisi melapor tidak langsung (via WhatsApp -> manajer input manual ke spreadsheet "ScriptSheet"). Lihat `[[flowchart:berjalan]]`.
2. Tidak ada visualisasi dashboard ringkasan kondisi seluruh proyek.
3. Tanpa indikator risiko terukur -> manajer sering abaikan proyek kritis, deteksi masalah lambat (reaktif, bukan preventif).

Dampak: penurunan efisiensi operasional + kepuasan pelanggan.

## solution

Kembangkan fitur dashboard dengan dua aspek:
1. Beri akses sistem ke teknisi untuk input laporan harian langsung.
2. Dashboard cerdas: otomasi kategorisasi `[[concept:project-health]]` -> hitung progres ideal `[[concept:pv]]` vs realisasi aktual `[[concept:ev]]` -> visual `[[concept:rag]]` (`[[concept:ews]]`), urutkan proyek kritis ke atas (`[[concept:criticality-sort]]`). Lihat `[[flowchart:diusulkan]]`.

**Rumusan Masalah:** Bagaimana mengembangkan fitur dashboard yang mampu memvisualisasikan indikator kesehatan proyek berdasarkan data laporan harian di PT SHI?

**Tujuan:** Mengembangkan fitur dashboard yang mengolah data laporan harian otomatis menjadi indikator visual status kesehatan proyek.

**Batasan Masalah (penting):** data terbatas laporan harian + jadwal baseline; performa jadwal MURNI pakai `[[concept:spi]]` (tanpa ML/AI); 2 hak akses (Manajer, Teknisi); sistem TIDAK mengelola keuangan, pengadaan material, atau SDM. (Lihat divergensi `[[div:materials-budget]]`, `[[div:roles]]`.)

## result

`[[test:blackbox]]`: 18 skenario Black Box -> 15 valid, 3 tidak valid = **83.33%** keberhasilan. Tujuan dinyatakan tercapai.

**Saran (future work, 6.2):** aplikasi mobile untuk teknisi, notifikasi otomatis, integrasi aspek biaya proyek.

## divergence warning

Naskah ini (spec akademik) berbeda dari kode yang berjalan di repo pada beberapa titik penting. Sebelum menyelaraskan naskah <-> kode, baca `[[divergences.md]]` lebih dulu. Yang paling tajam: formula SPI, tech stack (Next.js vs Vite+React), model laporan harian, materials/budget vs eskalasi.
