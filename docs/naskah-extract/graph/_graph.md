---
name: memory-graph-index
description: Entry point to the TA naskah memory graph - how to navigate, mermaid overview, full node catalog
metadata:
  type: reference
---

# Memory Graph - PT SHI Dashboard EWS Thesis

Knowledge graph extracted from `../Naskah TA Final 4.pdf` (114 pages). This is the **navigation hub**.

## How to use

- **`graph.json`** - machine-readable source of truth: 78 nodes + 89 edges. Query it for entities/relations. Each node has `id`, `type`, `label`, `doc` (the markdown that explains it), `props`.
- **`nodes/*.md`** - human/LLM-readable narrative, grouped by theme. Cross-linked with `[[node-id]]` wikilinks (the `id` matches `graph.json`).
- **`../bab/*.md`** - full text per chapter. **`../text/page-NNN.txt`** - raw text per page. **`../images/`** - 72 extracted images. **`../_manifest.json`** - raw inventory (every figure/table/image with page + caption).

Wikilink convention: `[[concept:spi]]` = the node with that `id` in `graph.json`; open its `doc` to read it. `[[file.md]]` = sibling doc.

## Read first

`nodes/divergences.md` - the naskah does NOT fully match the running code. That file is the most important note in this graph.

## Overview (main spine)

```mermaid
graph TD
  T[thesis: Dashboard EWS PT SHI]
  T --> PROB[Problem: lapor tak langsung, no dashboard, deteksi lambat]
  PROB --> SOL[Solution: teknisi input langsung + dashboard cerdas]

  SOL --> DR[daily-report: EV source]
  DR --> EV[Earned Value]
  SOL --> PV[Planned Value]
  EV --> SPI[SPI = EV / PV]
  PV --> SPI
  SPI --> RAG[RAG: green>=0.95, amber>=0.85, red<0.85]
  RAG --> EWS[EWS: SPI<1 trigger]
  EWS --> SORT[criticality sort: red on top]

  SOL --> RG[review-gate: manajer approve done]
  RG --> SPI
  SOL --> ESC[escalation: teknisi->manajer]

  T --> DM[data model: 8 classes / 7 tables]
  DM --> KES[Kesehatan Proyek -> computes SPI]
  KES --> SPI

  T --> TEST[Black Box: 18 tests, 83.33%]
  TEST --> F1[TC-MN-04: EWS not real-time]
  TEST --> F2[TC-TK-03: .exe accepted]
  TEST --> F3[TC-TK-06: double submit]

  T --> DIV[DIVERGENCES vs code]
  DIV --> D1[Next.js vs Vite+React]
  DIV --> D2[manual % vs task-derived]
  DIV --> D3[materials/budget dropped]
  DIV --> D4[escalation added]
```

## Actor capability map

```mermaid
graph LR
  TK[Teknisi] --> DR[input laporan harian]
  TK --> KB[kanban: to_do/working_on_it + bukti]
  TK --> ESC[ajukan eskalasi]
  TK -.cannot.-> DONE[mark done]
  MN[Manajer] --> DONE
  MN --> EWS[pantau dashboard EWS]
  MN --> ESC2[instruksi eskalasi]
  MN -.cannot.-> DELK[hapus klien]
  RBAC[RBAC] --> TK
  RBAC --> MN
  RBAC --> AD[Admin: narasi saja, tak di enum]
```

## Node catalog

| Type | Count | Node IDs | Documented in |
|------|-------|----------|---------------|
| thesis | 1 | thesis | nodes/00-thesis.md |
| person | 2 | person:dian, person:adityo | nodes/00-thesis.md#people |
| org | 2 | org:uty, org:pt-shi | nodes/00-thesis.md |
| chapter | 6 | bab1..bab6 | ../bab/ |
| concept | 15 | spi, ev, pv, evm, project-health, rag, ews, criticality-sort, review-gate, daily-report, escalation, rbac, kanban, computed-states, two-phase | nodes/concepts-metrics.md, nodes/concepts-workflow.md |
| actor | 3 | teknisi, manajer, admin | nodes/actors.md |
| class | 8 | user, klien, proyek, penugasan, kesehatan, tugas, bukti, eskalasi | nodes/data-model.md |
| table | 7 | tb_user, tb_klien, tb_proyek, tb_penugasan_proyek, tb_tugas, tb_bukti, tb_eskalasi | nodes/data-model.md |
| diagram | 16 | usecase, class, erd, relasi, 5x activity, 5x sequence, 2x flowchart | nodes/diagrams.md |
| test / test-fail | 1 + 3 | blackbox, tc-mn-04, tc-tk-03, tc-tk-06 | nodes/testing.md |
| reference | 7 | azkia2024, ernawan2024, gledson2024, hakim2025, auliansyah2023, iqbal2024, luthan2023 | nodes/references.md |
| divergence | 7 | spi-formula, tech-stack, daily-report, materials-budget, escalation, roles, kesehatan-table | nodes/divergences.md |

Glossary of abbreviations: `nodes/glossary.md`.

## Regenerate

`python ../extract.py` re-extracts text/images/manifest from the PDF (idempotent). The graph (`graph.json` + `nodes/`) is hand-curated on top of that - update it manually when the naskah changes.
