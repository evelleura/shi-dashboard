---
name: data-model
description: Full data model - 8 classes (Tabel 4.1-4.8) + 7 physical tables (Tabel 4.9-4.15) + relations, from BAB IV
metadata:
  type: reference
---

# Data Model

Class diagram `[[diagram:class]]` (Gambar 4.14), ERD `[[diagram:erd]]` (Gambar 4.15), relasi tabel `[[diagram:relasi]]` (Gambar 4.16). 8 kelas, 7 tabel fisik. Sumber: `../text/page-055.txt` .. `page-064.txt`.

## Classes (8)

### class-user
`[[class:user]]` Tabel 4.1. Lapisan autentikasi + otorisasi. Metode: `login` (validasi email+password), `hasRole` (cek peran). -> `[[table:tb_user]]`.

### class-klien
`[[class:klien]]` Tabel 4.2. Entitas pelanggan/instansi pemilik proyek. Metode: `create`, `update`, `delete`. -> `[[table:tb_klien]]`.

### class-proyek
`[[class:proyek]]` Tabel 4.3. Inti sistem - koordinasi, penjadwalan, fase, relasi antar tugas. Metode: `create`, `approveSurvey`, `calculateSPI`, `assignTechnician`, `getHealth`. -> `[[table:tb_proyek]]`.

### class-penugasan
`[[class:penugasan]]` Tabel 4.4. Kelas asosiasi M:N user<->proyek. Metode: `assign`, `unassign`, `getByProject`. -> `[[table:tb_penugasan_proyek]]`.

### class-kesehatan
`[[class:kesehatan]]` Tabel 4.5. Komputasi EWS, dipisah supaya tidak bebani kelas Proyek. Metode: `recalculate`, `getStatus` (-> hijau/kuning/merah), `computePlannedValue`, `sortByUrgency`, `computeEarnedValue`. Otak dari `[[concept:spi]]` + `[[concept:project-health]]` + `[[concept:criticality-sort]]`.
> Tidak punya tabel fisik tersendiri di 4.3.3 -> `[[div:kesehatan-table]]`.

### class-tugas
`[[class:tugas]]` Tabel 4.6. Unit pekerjaan lapangan. Metode: `create`, `changeStatus` (to_do/working_on/done), `markDone`, `isOvertime`, `isOverDeadline` (`[[concept:computed-states]]`). -> `[[table:tb_tugas]]`.

### class-bukti
`[[class:bukti]]` Tabel 4.7. Lampiran bukti pekerjaan teknisi. Metode: `upload`, `download`, `delete`. -> `[[table:tb_bukti]]`.

### class-eskalasi
`[[class:eskalasi]]` Tabel 4.8. Catat + kelola prioritas + pantau komunikasi kendala lapangan. Metode: `create`, `resolve`, `sendInstruction`. -> `[[table:tb_eskalasi]]`. Lihat `[[concept:escalation]]`.

## Physical Tables (7)

### tb_user
`[[table:tb_user]]` PK `id_user`. Fields: `id_user` BIGINT(20) PK, `nama` VARCHAR(255), `email` VARCHAR(255) Unique, `password` VARCHAR(255), `role` ENUM('technician','manager').

### tb_klien
`[[table:tb_klien]]` PK `id_klien`, FK `id_user`. Fields: `id_klien` PK, `nama_klien`, `alamat`, `no_telp` VARCHAR(20), `email` Unique, `id_user` FK.

### tb_proyek
`[[table:tb_proyek]]` PK `id_proyek`, FK `id_klien`+`id_user`. Fields: `id_proyek` PK, `nama_proyek`, `id_klien` FK, `start_date` DATE, `end_date` DATE, `status` ENUM('active','completed','on-hold') default active, `phase` ENUM('survey','execution') default survey, `id_user` FK.

### tb_penugasan_proyek
`[[table:tb_penugasan_proyek]]` PK `id_tugas`, FK `id_proyek`+`id_user`. Fields: `id_tugas` PK, `id_proyek` FK, `id_user` FK, `assigned_at` TIMESTAMP. (Tabel asosiasi M:N.)

### tb_tugas
`[[table:tb_tugas]]` PK `id_tugas`, FK `id_proyek`+`id_user`+`assigned_to`. Fields: `id_tugas` PK, `id_proyek` FK, `id_user` FK, `nama_tugas`, `due_date` DATE, `status` ENUM('to_do','working_on_it','done') default to_do, `assigned_to` FK.

### tb_bukti
`[[table:tb_bukti]]` PK `id_bukti`, FK `id_tugas`+`id_user`. Fields: `id_bukti` PK, `id_tugas` FK, `file_path` VARCHAR(500), `id_user` FK.

### tb_eskalasi
`[[table:tb_eskalasi]]` PK `id_eskalasi`, FK `id_user`+`id_tugas`. Fields: `id_eskalasi` PK, `id_user` FK, `id_tugas` FK, `title` VARCHAR(255), `priority` ENUM('low','medium','high') default medium, `status` ENUM('open','handled','closed') default open.

## Relations (ERD / relasi antar tabel, 4.3.4)

1. `tb_klien` 1:M `tb_proyek` - satu klien banyak proyek.
2. `tb_user` 1:M `tb_klien` - satu Manajer kelola banyak klien.
3. `tb_user` 1:M `tb_proyek` - satu Manajer kelola banyak proyek.
4. `tb_user` M:N `tb_proyek` via `tb_penugasan_proyek` - satu proyek banyak teknisi, satu teknisi banyak proyek.
5. `tb_proyek` 1:M `tb_tugas`.
6. `tb_user` 1:M `tb_tugas` - satu teknisi banyak tugas.
7. `tb_tugas` 1:M `tb_bukti`.
8. `tb_tugas` 1:M `tb_eskalasi`.
9. `tb_proyek` 1:1 `tb_kesehatan_proyek` (disebut di relasi #9, tapi tabel fisik tak dirinci -> `[[div:kesehatan-table]]`).
