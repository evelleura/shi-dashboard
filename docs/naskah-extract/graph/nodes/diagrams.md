---
name: diagrams
description: Catalog of all UML diagrams and flowcharts in BAB IV with extracted image paths and narrative
metadata:
  type: reference
---

# Diagram Catalog

Setiap diagram dipetakan ke file gambar hasil ekstraksi di `../images/`. Narasi dari `../text/`. UML pakai pola business-process (lifeline = objek bisnis), bukan MVC - konvensi akademik Indonesia (lihat memory `[[reference_drawio_class_style]]`).

## flowchart

**Sistem Berjalan** `[[flowchart:berjalan]]` - Gambar 4.1, `../images/page-037-img00.png`.
Manajer buat data proyek di ScriptSheet -> tugaskan teknisi -> teknisi lapor progres via WhatsApp -> manajer input manual ke spreadsheet -> hitung SPI manual -> jika terlambat, hubungi teknisi via WhatsApp. (Masalah: manual, lambat.)

**Sistem Diusulkan** `[[flowchart:diusulkan]]` - Gambar 4.2, `../images/page-039-img00.png`.
Login -> deteksi role -> ruang kerja spesifik: Admin->Dashboard Umum, Manajer->Dashboard pemantauan, Teknisi->Dashboard Performa. Komentar global di detail proyek. Logout mengakhiri siklus.

## usecase

`[[diagram:usecase]]` - Gambar 4.3, `../images/page-043-img00.png` (1062x667).
Aktor: `[[actor:teknisi]]`, `[[actor:manajer]]`. Relasi:
- `include`: fungsi tertentu wajib lewat Login.
- `extend`: riwayat proyek/laporan (teknisi), detail+progres proyek (manajer).
- `exclude`: Manajer tidak boleh hapus data pelanggan.

## activity

5 activity diagram (4.3.1.2):
1. Autentikasi `[[diagram:activity-auth]]` - Gambar 4.4, `../images/page-044-img00.png`. Input email+password -> validasi vs `tb_user` -> akses/ulang -> logout.
2. Pengelolaan Proyek `[[diagram:activity-proyek]]` - Gambar 4.5, `../images/page-045-img00.png`. Input data+rentang waktu -> sistem tampilkan teknisi tersedia -> tetapkan penugasan+tugas -> simpan -> notifikasi ke teknisi.
3. Pelaporan Harian + Review Gate + SPI `[[diagram:activity-reviewgate]]` - Gambar 4.6, `../images/page-046-img00.png`. Inti `[[concept:review-gate]]`: teknisi ubah status+unggah bukti -> manajer review -> revisi/approve done -> trigger rekalkulasi SPI + update dashboard real-time.
4. Dashboard EWS `[[diagram:activity-ews]]` - Gambar 4.7, `../images/page-047-img00.png`. Manajer buka dashboard -> ekstraksi data metrik+SPI -> mapping ke warna RAG -> urut by urgency -> render.
5. Pengajuan & Penanganan Eskalasi `[[diagram:activity-eskalasi]]` - Gambar 4.8, `../images/page-048-img00.png`. Lihat `[[concept:escalation]]`.

## sequence

5 sequence diagram (4.3.1.3), lifeline = objek bisnis:
1. Autentikasi `[[diagram:seq-auth]]` - Gambar 4.9, `../images/page-049-img00.png`. Pesan sinkron email+password -> verifikasi ke basis data -> validasi kredensial + cek role (RBAC) -> render dashboard per peran.
2. Pengelolaan Proyek `[[diagram:seq-proyek]]` - Gambar 4.10, `../images/page-050-img00.png`.
3. Pelaporan Harian + Review Gate + SPI `[[diagram:seq-reviewgate]]` - Gambar 4.11, `../images/page-051-img00.png`. Teknisi -> "Working On It" + bukti -> notifikasi manajer -> validasi -> "Done" -> catat DB -> komputasi ulang SPI + kesehatan -> tampil dashboard + notifikasi teknisi.
4. Dashboard EWS `[[diagram:seq-ews]]` - Gambar 4.12, `../images/page-052-img00.png`.
5. Pengajuan & Penanganan Eskalasi `[[diagram:seq-eskalasi]]` - Gambar 4.13, `../images/page-053-img00.png`. Teknisi ajukan tiket -> manajer tinjau + instruksi -> status "Ditangani" -> teruskan balasan + notifikasi ke teknisi.

## class

`[[diagram:class]]` - Gambar 4.14, `../images/page-054-img00.png` (1462x962). 8 kelas, lihat `[[data-model.md]]`.

## erd

`[[diagram:erd]]` - Gambar 4.15, `../images/page-059-img00.png`. Entitas: User, Klien, Penugasan Proyek, Proyek, Tugas, Bukti Tugas, Eskalasi, Kesehatan Proyek.

## relasi

`[[diagram:relasi]]` Perancangan Relasi Antar Tabel - Gambar 4.16, `../images/page-065-img00.jpeg`. 9 relasi, lihat `[[data-model.md]]` bagian Relations.

## Antarmuka & Implementasi (figur kunci lain)

Antarmuka rancangan (4.3.5) Gambar 4.17-4.26 dan implementasi (BAB V) Gambar 5.1-5.34 ada di `../images/` dan tersilang di `../_manifest.json`. Wireframe terpisah juga di `../wireframes/`. Highlights implementasi:
- 5.8 Perubahan Status Tugas & Pemicu SPI (`page-083-img00.png`).
- 5.9 Perhitungan SPI (`page-084-img00.jpeg`).
- 5.10 Klasifikasi Kesehatan Proyek (`page-085-img00.jpeg`).
- 5.11 Pengurutan Berdasarkan Kekritisan (`page-086-img00.jpeg`).
- 5.13-5.22 kueri SQL (INSERT/SELECT/UPSERT) + hasil eksekusi (`page-088`..`page-091`).
- 5.32 Halaman SPI, 5.33 Review Gate, 5.34 Dashboard Performa Teknisi (`page-106`..`page-108`).
