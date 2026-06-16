---
name: actors
description: System actors/roles - Teknisi, Manajer, Admin - with permission breakdown from BAB IV
metadata:
  type: reference
---

# Actors / Roles

Use case (Gambar 4.3, `[[diagram:usecase]]`) melibatkan dua aktor utama: Teknisi dan Manajer. Admin muncul di narasi sistem diusulkan (4.1.2) tapi bukan aktor use case.

## teknisi

`[[actor:teknisi]]` **Teknisi** - pelaksana operasional di lokasi klien (instalasi IoT). Sumber utama pencatatan data faktual.

Kebutuhan / hak (4.2.1):
- Input `[[concept:daily-report]]` mandiri (progres + kendala).
- Akses Self-Performance Dashboard (swamonitoring SPI pribadi, TC-TK-05).
- Kelola tugas di `[[concept:kanban]]`: ubah `to_do` <-> `working_on_it`, unggah bukti.
- Ajukan `[[concept:escalation]]`.
- TIDAK bisa mark done (gerbang `[[concept:review-gate]]`).

## manajer

`[[actor:manajer]]` **Manajer** - pengawas tingkat manajerial atas seluruh portofolio proyek.

Kebutuhan / hak (4.2.1):
- Dashboard utama: ringkasan seluruh proyek aktif + metrik `[[concept:rag]]`.
- Lihat perbandingan PV (ideal) vs EV (aktual) + nilai SPI.
- Terima peringatan dini via `[[concept:criticality-sort]]`.
- Eksekusi `[[concept:review-gate]]` (approve done).
- Kelola proyek + penugasan teknisi, tangani `[[concept:escalation]]`.
- Use case exclude: Manajer TIDAK boleh hapus data pelanggan/klien.

> Naskah 4.2.1(e) menyatakan hak Manajer dibatasi pada pemantauan + evaluasi, "tanpa wewenang mengelola data di luar lingkup laporan harian" - selaras dengan dijatuhkannya materials/budget (`[[div:materials-budget]]`).

## admin

`[[actor:admin]]` **Admin** - disebut hanya di 4.1.2 (sistem diusulkan): diarahkan ke "Dashboard Umum" untuk mengelola data master pengguna dan keseluruhan data proyek. TIDAK ada di:
- role enum `[[table:tb_user]]` (hanya `technician`, `manager`),
- aktor use case diagram,
- kebutuhan user 4.2.1.

Spec lama (`CLAUDE.md`) punya admin penuh. Inkonsistensi -> `[[div:roles]]`.
