---
name: concepts-metrics
description: Core metric concepts of the thesis - SPI, EV, PV, EVM, project health, RAG, EWS, criticality sort
metadata:
  type: reference
---

# Metric & EWS Concepts

Cluster of metric nodes. Defined mainly in BAB II 2.2.4-2.2.5 (`../text/page-023.txt`, `page-024.txt`).

## spi

`[[concept:spi]]` **Schedule Performance Index** - indikator matematis efisiensi waktu pelaksanaan proyek. Pemicu utama `[[concept:ews]]`.

**Formula teori (Persamaan 1, BAB II):**
```
SPI = Earned Value (EV) / Planned Value (PV)
```
Interpretasi:
- `SPI = 1` -> tepat waktu (on schedule), hijau.
- `SPI > 1` -> lebih cepat dari rencana.
- `SPI < 1` -> terlambat (Persamaan 2) -> pemicu EWS, indikator merah/"Kritis".

> Catatan: BAB V 5.3 (Inovasi) mendeskripsikan SPI sebagai "rasio penyelesaian tugas terhadap proporsi durasi berjalan" - framing berbeda dari EV/PV murni. Dan kode lama pakai `(completed/total)/(elapsed/total_days)`. Lihat `[[div:spi-formula]]`.

## ev-pv

`[[concept:ev]]` **Earned Value (EV / Nilai Hasil)** - persentase bobot pekerjaan aktual yang faktual selesai di lapangan. Diakumulasi otomatis dari progres tugas yang diinput via laporan harian (`[[concept:daily-report]]`) / tugas berstatus done (`[[concept:review-gate]]`).

`[[concept:pv]]` **Planned Value (PV / Nilai Rencana)** - persentase bobot target yang seharusnya selesai pada titik waktu pemantauan, berdasarkan jadwal awal.
```
PV = (Hari Berjalan / Total Durasi Proyek) x 100%
```

## evm

`[[concept:evm]]` **Earned Value Management** - kerangka pengukuran kinerja proyek yang membandingkan nilai rencana (PV) dan nilai hasil (EV). SPI adalah salah satu indeksnya. Beberapa penelitian terdahulu (`[[ref:azkia2024]]`) memakai EVM sebagai basis dashboard.

## project-health

`[[concept:project-health]]` **Status Kesehatan Proyek** - indikator evaluatif faktual yang membandingkan progres aktual vs rencana. Bukan analitik prediktif; instrumen audit visual untuk deteksi penyimpangan jadwal sedini mungkin. Direpresentasikan via `[[concept:rag]]`, dihitung kelas `[[class:kesehatan]]`.

## rag

`[[concept:rag]]` **Red-Amber-Green** - konversi nilai SPI menjadi indikator warna (ambang batas):

| Warna | Kondisi | Arti |
|-------|---------|------|
| Hijau (Green) | SPI >= 0.95 | on track |
| Kuning (Amber) | 0.85 <= SPI < 0.95 | warning |
| Merah (Red) | SPI < 0.85 | kritis - tertinggal jadwal |

## ews

`[[concept:ews]]` **Early Warning System** - fitur yang memproses data progres aktual terkomputasi untuk menghasilkan indikator peringatan otomatis sesuai metrik (`[[concept:spi]]`). Tujuan: percepat deteksi keterlambatan supaya manajer bisa mitigasi terarah berbasis data. Trigger: `SPI < 1`. Lihat diagram `[[diagram:activity-ews]]`, `[[diagram:seq-ews]]`.

> Bug teruji: indikator EWS tidak update real-time setelah review gate; butuh refresh manual (`[[test:tc-mn-04]]`).

## criticality-sort

`[[concept:criticality-sort]]` **Pengurutan Berdasarkan Kekritisan** - dashboard otomatis menempatkan proyek status merah (kritis) di urutan teratas (merah -> kuning -> hijau), supaya manajer langsung lihat prioritas penanganan. Metode kelas: `sortByUrgency` di `[[class:kesehatan]]`. Figur implementasi: Gambar 5.11, 5.12.
