---
name: divergences
description: CRITICAL - mismatches between the thesis naskah (Final 4) and the running code / older CLAUDE.md spec. Read before reconciling naskah and code.
metadata:
  type: project
---

# Divergences: Naskah vs Kode

The thesis `Naskah TA Final 4.pdf` is the academic spec. The repo now has **two** codebases, so "the code" is ambiguous - always say which:

- **`frontend/`** = Next.js, skema **Bahasa Indonesia** (`tb_user`, `tb_proyek`), enum persis naskah. **Ini target setia-naskah** (mode aman TA). `init.sql` header menyatakannya eksplisit.
- **`frontend_backup/`** = Next.js, skema **Bahasa Inggris** (`users`, `projects`), lebih kaya fitur. Bukan acuan akademik.

**Why it matters:** if asked to "make the code match the naskah", the target is `frontend/`. **How to apply:** when a request touches any item below, surface the mismatch and confirm which side is authoritative before editing.

## Status terkini vs `frontend/` (2026-06-17, diverifikasi ke kode)

Keputusan proyek: **naskah = acuan**. `frontend/` sudah dibangun untuk itu. Ringkasan:

| Divergence | Status di `frontend/` |
|---|---|
| tech-stack (Next.js) | **RESOLVED** - frontend/ Next.js 15. Catatan "Vite" hanya untuk kode lama. |
| escalation | **RESOLVED** - `tb_eskalasi` enum `open/handled/closed` + `low/medium/high` persis naskah. |
| materials-budget | **RESOLVED** - tak ada tabel materials/budget. (`project_value` ringan masih ada.) |
| spi-formula | **ALIGNED** - `spiCalculator`: EV=% tugas done, PV=hari/durasi, SPI=EV/PV. |
| kesehatan-table | **RESOLVED** - tabel `project_health` ada, ditandai pendukung di luar 7 tabel inti. |
| roles | **PARTIAL** - DB 2 peran (sesuai naskah) TAPI TS/UI masih bawa `admin` (UserRole type, UserManagementPage, nav Layout, `authorizeRoles(['manager','admin'])`). Perlu pangkas. |
| daily-report | **OPEN** - tetap tanpa input % manual; `daily_reports` cuma fallback EV. Naskah minta input manual. **Satu-satunya keputusan tersisa.** |

Dua sisa pekerjaan agar `frontend/` 100% setia-naskah: (1) buang scaffolding `admin`, (2) putuskan nasib laporan harian (lihat `#daily-report`).

## spi-formula
`[[div:spi-formula]]` **SPI formula has three framings.**
- Naskah landasan teori (2.2.5, Persamaan 1): `SPI = EV / PV`. Clean EVM ratio.
- Naskah inovasi (5.3): "rasio penyelesaian tugas terhadap proporsi durasi berjalan" - i.e. `(% tugas selesai) / (% durasi berjalan)`.
- Older `CLAUDE.md` code spec: `SPI = (completed_tasks/total_tasks) / (elapsed_days/total_project_days)`, fallback to `daily_reports.progress_percentage / planned_value`.

These are the same idea if EV = % tugas selesai and PV = % durasi berjalan. Confirm the code's actual EV source (task-completion vs typed %) before quoting a formula. Touches `[[concept:spi]]`, `[[concept:ev]]`, `[[concept:pv]]`.

## tech-stack
`[[div:tech-stack]]` **Frontend framework.**
- Naskah: **Next.js** (SSR, React-based) - stated in landasan teori 2.2.6 and in test case `[[test:tc-mn-04]]` ("Framework Next.js memproses data secara asynchronous"). Cites Genne (2025) on SSR.
- Repo (`CLAUDE.md`): **Vite + React 19 + TanStack Query 5 + Recharts + Tailwind v4**, backend Node + Express 5 + TypeScript.

The naskah's SSR/Next.js claim is not what the OLD code did. If the naskah text needs to match reality, Next.js references are wrong; if the code must match the naskah, that's a rewrite. Flag, don't silently pick.

> **frontend/ (2026-06):** sudah Next.js 15 App Router -> **RESOLVED**. Catatan "Vite" hanya berlaku untuk kode lama.

## daily-report
`[[div:daily-report]]` **Daily report input model.**
- Naskah (BAB I, 4.2.2 functional req 1): teknisi inputs "persentase progres pekerjaan harian (EV) dan catatan kendala" - manual percentage.
- Repo (memory FIX score 19): the manual-percentage daily report was REMOVED as an anti-pattern. "Task status changes ARE the daily report." User was explicit: "not some bullshit that I can fill the percentage myself."

So the naskah still describes a feature the code intentionally dropped. EV in code is derived from task status (review-gate done), not typed %. Touches `[[concept:daily-report]]`, `[[concept:review-gate]]`. Internal naskah tension: class `computeEarnedValue` says EV "berdasarkan tugas yang telah selesai" (task-based), contradicting the typed-% functional req in the same chapter.

> **frontend/:** tetap task-derived; `daily_reports` hanya fallback EV saat proyek 0 tugas, TANPA endpoint/UI input -> **tetap OPEN**. Naskah read-only + user benci input % manual (memory FIX 19) = perlu keputusan, bukan auto-implement.

## materials-budget
`[[div:materials-budget]]` **Materials & budget entities.**
- Naskah: NO material/budget data entities. Batasan masalah item 6 explicitly: "Sistem tidak mengelola entitas di luar laporan harian, seperti laporan keuangan, pengadaan material, atau manajemen SDM." (The "Rancangan Anggaran" 4.4 is the dev budget/RAB to build the system, not project material tracking.)
- Older `CLAUDE.md`: had `materials` + `budget_items` tables, MaterialsList + BudgetTable components, Materials/Budget API endpoints, project_value in rupiah.

The naskah trimmed materials/budget out. If aligning to naskah, those code features are out of academic scope. Touches `[[thesis]]`.

> **frontend/:** tak ada tabel `materials`/`budget_items` -> **RESOLVED**. Field `project_value` (rupiah) masih ada di `tb_proyek` (finansial ringan, bukan entitas penuh).

## escalation
`[[div:escalation]]` **Escalation feature.**
- Naskah: full feature - class `[[class:eskalasi]]`, table `[[table:tb_eskalasi]]`, activity `[[diagram:activity-eskalasi]]`, sequence `[[diagram:seq-eskalasi]]`, tested TC-MN-05 + TC-TK-04.
- Older `CLAUDE.md`: NO escalation anywhere.

Escalation is NEW in the naskah (replaces the materials/budget scope). Inspired by MDI/PDI in `[[ref:luthan2023]]`. If the code predates the naskah, escalation may be unimplemented in the repo - verify before claiming it exists. Touches `[[concept:escalation]]`.

> **frontend/:** sudah ada - `tb_eskalasi` (status `open/handled/closed`, priority `low/medium/high` persis naskah) + handler + `EscalationsPage` -> **RESOLVED**.

## roles
`[[div:roles]]` **Number of roles.**
- Naskah enum (`tb_user.role`): `technician`, `manager` (2).
- Naskah narrative (4.1.2): mentions Admin -> "Dashboard Umum" for master user/project data.
- Older `CLAUDE.md`: 3 roles - technician, manager, admin (full).

Admin is half-present in the naskah (narrative yes, enum + use case no). Decide whether admin is in scope per the authoritative side. Touches `[[concept:rbac]]`, `[[actor:admin]]`.

> **frontend/:** DB `role_check IN ('technician','manager')` sesuai naskah, seed `admin@shi.co.id` jadi `manager`. TAPI TS/UI masih bawa `admin`: `UserRole` type, `UserManagementPage`, nav `Layout.tsx`, `authorizeRoles(['manager','admin'])`, tab history admin-only. -> **PARTIAL**: pangkas scaffolding admin agar penuh setia-naskah.

## kesehatan-table
`[[div:kesehatan-table]]` **Project health: class without physical table.**
- Class `[[class:kesehatan]]` (Tabel 4.5) exists with methods recalculate/getStatus/computePV/computeEV/sortByUrgency.
- ERD relation #9 names `tb_kesehatan_proyek` (1:1 with `tb_proyek`).
- But 4.3.3 physical design only specifies 7 tables (4.9-4.15); no `tb_kesehatan_proyek` schema is given.

Either project_health is a computed/derived view, or the physical table spec is incomplete in the naskah. Older `CLAUDE.md` had a full `project_health` table (spi_value, status, deviation, etc.). Touches `[[class:kesehatan]]`.

---

## Reconciliation cheat-sheet

| Aspect | Naskah Final 4 | `frontend/` (target) | `frontend_backup/` |
|--------|----------------|----------------------|--------------------|
| Frontend | Next.js (SSR) | Next.js 15 ✓ | Next.js 15 |
| SPI source | EV/PV; also "task ratio" | EV/PV, EV=% tugas done ✓ | sama |
| Daily report | manual % input | tetap derived; tabel = fallback **(OPEN)** | derived; fallback |
| Materials/Budget | excluded | tak ada ✓ | tak ada |
| Escalation | full feature | `tb_eskalasi` enum persis naskah ✓ | ada (enum beda) |
| Roles | technician, manager (+admin narasi) | DB 2 ✓; TS/UI masih ada admin **(PARTIAL)** | 3 (admin fungsional) |
| project_health | class only, no table spec | tabel `project_health` (pendukung) | tabel |
| Status tugas | to_do/working_on_it/done (3) | 3 ✓ | 5 (+in_progress,review) |
| Penamaan | `tb_*` Indonesia | `tb_*` + alias ke JS ✓ | Inggris (`users`) |
