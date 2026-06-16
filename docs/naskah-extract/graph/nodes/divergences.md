---
name: divergences
description: CRITICAL - mismatches between the thesis naskah (Final 4) and the running code / older CLAUDE.md spec. Read before reconciling naskah and code.
metadata:
  type: project
---

# Divergences: Naskah vs Kode

The thesis `Naskah TA Final 4.pdf` is the current academic spec. It does NOT fully match the code in this repo, nor the older data model in the root `CLAUDE.md`. These gaps are the highest-value notes here. **Why it matters:** if asked to "make the code match the naskah" or "fix the diagram to match the code", you must know which side says what. **How to apply:** when a request touches any item below, surface the mismatch and confirm which side is authoritative before editing.

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

The naskah's SSR/Next.js claim is not what the code does. If the naskah text needs to match reality, Next.js references are wrong; if the code must match the naskah, that's a rewrite. Flag, don't silently pick.

## daily-report
`[[div:daily-report]]` **Daily report input model.**
- Naskah (BAB I, 4.2.2 functional req 1): teknisi inputs "persentase progres pekerjaan harian (EV) dan catatan kendala" - manual percentage.
- Repo (memory FIX score 19): the manual-percentage daily report was REMOVED as an anti-pattern. "Task status changes ARE the daily report." User was explicit: "not some bullshit that I can fill the percentage myself."

So the naskah still describes a feature the code intentionally dropped. EV in code is derived from task status (review-gate done), not typed %. Touches `[[concept:daily-report]]`, `[[concept:review-gate]]`. Internal naskah tension: class `computeEarnedValue` says EV "berdasarkan tugas yang telah selesai" (task-based), contradicting the typed-% functional req in the same chapter.

## materials-budget
`[[div:materials-budget]]` **Materials & budget entities.**
- Naskah: NO material/budget data entities. Batasan masalah item 6 explicitly: "Sistem tidak mengelola entitas di luar laporan harian, seperti laporan keuangan, pengadaan material, atau manajemen SDM." (The "Rancangan Anggaran" 4.4 is the dev budget/RAB to build the system, not project material tracking.)
- Older `CLAUDE.md`: had `materials` + `budget_items` tables, MaterialsList + BudgetTable components, Materials/Budget API endpoints, project_value in rupiah.

The naskah trimmed materials/budget out. If aligning to naskah, those code features are out of academic scope. Touches `[[thesis]]`.

## escalation
`[[div:escalation]]` **Escalation feature.**
- Naskah: full feature - class `[[class:eskalasi]]`, table `[[table:tb_eskalasi]]`, activity `[[diagram:activity-eskalasi]]`, sequence `[[diagram:seq-eskalasi]]`, tested TC-MN-05 + TC-TK-04.
- Older `CLAUDE.md`: NO escalation anywhere.

Escalation is NEW in the naskah (replaces the materials/budget scope). Inspired by MDI/PDI in `[[ref:luthan2023]]`. If the code predates the naskah, escalation may be unimplemented in the repo - verify before claiming it exists. Touches `[[concept:escalation]]`.

## roles
`[[div:roles]]` **Number of roles.**
- Naskah enum (`tb_user.role`): `technician`, `manager` (2).
- Naskah narrative (4.1.2): mentions Admin -> "Dashboard Umum" for master user/project data.
- Older `CLAUDE.md`: 3 roles - technician, manager, admin (full).

Admin is half-present in the naskah (narrative yes, enum + use case no). Decide whether admin is in scope per the authoritative side. Touches `[[concept:rbac]]`, `[[actor:admin]]`.

## kesehatan-table
`[[div:kesehatan-table]]` **Project health: class without physical table.**
- Class `[[class:kesehatan]]` (Tabel 4.5) exists with methods recalculate/getStatus/computePV/computeEV/sortByUrgency.
- ERD relation #9 names `tb_kesehatan_proyek` (1:1 with `tb_proyek`).
- But 4.3.3 physical design only specifies 7 tables (4.9-4.15); no `tb_kesehatan_proyek` schema is given.

Either project_health is a computed/derived view, or the physical table spec is incomplete in the naskah. Older `CLAUDE.md` had a full `project_health` table (spi_value, status, deviation, etc.). Touches `[[class:kesehatan]]`.

---

## Reconciliation cheat-sheet

| Aspect | Naskah Final 4 | Repo / old CLAUDE.md |
|--------|----------------|----------------------|
| Frontend | Next.js (SSR) | Vite + React 19 |
| SPI source | EV/PV; also "task ratio" | task completion ratio |
| Daily report | manual % input | removed; task-status derived |
| Materials/Budget | excluded | tables + UI + API existed |
| Escalation | full feature | absent |
| Roles | technician, manager (+admin narrative) | technician, manager, admin |
| project_health | class only, no table spec | full table |
