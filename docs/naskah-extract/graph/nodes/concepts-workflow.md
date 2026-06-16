---
name: concepts-workflow
description: Workflow/behavioral concepts - review gate, daily report, escalation, RBAC, kanban, computed states, two-phase lifecycle
metadata:
  type: reference
---

# Workflow & Behavioral Concepts

## review-gate

`[[concept:review-gate]]` **Review Gate (Validasi Tugas)** - gerbang persetujuan: Teknisi TIDAK bisa menandai tugas "done". Alur (Gambar 4.6 / 4.11, `[[diagram:activity-reviewgate]]` / `[[diagram:seq-reviewgate]]`):

1. Teknisi ubah status tugas ke `working_on_it`, unggah foto bukti via `[[concept:kanban]]`.
2. Sistem kirim notifikasi peninjauan ke Manajer.
3. Manajer tinjau bukti. Jika belum sesuai -> catatan revisi. Jika valid -> setujui jadi `done`.
4. Persetujuan memicu rekalkulasi `[[concept:spi]]` + status kesehatan -> update dashboard.

Memetakan langsung ke memory proyek (FIX score 16): teknisi = pekerja, manajer = reviewer.

## daily-report

`[[concept:daily-report]]` **Laporan Harian** - sumber data faktual EV.

- **Versi naskah (BAB I, 4.2.2):** teknisi input "persentase progres pekerjaan harian (EV) dan catatan kendala". Manual percentage.
- **Versi kode (memory proyek FIX score 19):** fitur daily-report dengan persen ketik-manual DIHAPUS sebagai anti-pattern; progres diturunkan dari perubahan status tugas (task status changes ARE the daily report).

Konflik ini penting -> `[[div:daily-report]]`. Juga ada bug double-submit `[[test:tc-tk-06]]`.

## escalation

`[[concept:escalation]]` **Eskalasi (Kendala Lapangan)** - mekanisme pelaporan + penanganan kendala. Fitur ini ADA di naskah tapi tidak di spec lama (`[[div:escalation]]`). Kelas `[[class:eskalasi]]`, tabel `[[table:tb_eskalasi]]`. Alur (Gambar 4.8 / 4.13, `[[diagram:activity-eskalasi]]` / `[[diagram:seq-eskalasi]]`):

1. Teknisi ajukan tiket eskalasi (title, priority low/medium/high).
2. Indikator peringatan eskalasi muncul di dashboard Manajer.
3. Manajer tinjau tiket, kirim instruksi penanganan (`sendInstruction`).
4. Status tiket -> "ditangani"/handled; instruksi diteruskan ke Teknisi. (`resolve` -> closed.)

Inspirasi konseptual: MDI/PDI dari `[[ref:luthan2023]]` (delay index manajemen vs produksi).

## rbac

`[[concept:rbac]]` **Role-Based Access Control** - kebutuhan non-fungsional keamanan. Teknisi hanya boleh input laporan; pantau dashboard menyeluruh khusus Manajer. Diuji TC-AUTH-03 (teknisi blokir akses dashboard manajer via URL). Role enum di `[[table:tb_user]]`: `technician`, `manager`. Admin disebut di narasi 4.1.2 tapi tak masuk enum -> `[[div:roles]]`.

## kanban

`[[concept:kanban]]` **Papan Kanban** - antarmuka teknisi untuk kelola tugas. DB status: `to_do`, `working_on_it`, `done` (3). Visual: 5 kolom dengan 2 computed (`[[concept:computed-states]]`). Click-to-change (bukan drag-and-drop, per scope lama).

## computed-states

`[[concept:computed-states]]` **Computed States** - status objektif dari perbandingan tanggal, bukan self-report (memory proyek FIX score 14):
- **Overtime:** `status = working_on_it AND due_date < today`. Metode `isOvertime` di `[[class:tugas]]`.
- **Over Deadline:** `status = to_do AND due_date < today`. Metode `isOverDeadline`.

## two-phase

`[[concept:two-phase]]` **Two-Phase Lifecycle** - proyek punya fase `survey` lalu `execution` (enum `phase` di `[[table:tb_proyek]]`). Transisi via `approveSurvey` di `[[class:proyek]]` (gerbang persetujuan survei sebelum eksekusi).
