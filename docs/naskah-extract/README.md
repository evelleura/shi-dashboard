# naskah-extract

LLM-friendly extraction + memory graph of `../Naskah TA Final 4.pdf` (Dian's Tugas Akhir, 114 pages).

## Layout

```
naskah-extract/
  extract.py          generator (PyMuPDF + pdfplumber). Re-run: python extract.py
  _manifest.json      raw inventory: TOC, page->chapter map, 72 images, 162 figure refs, 46 table refs
  text/page-NNN.txt   raw text per physical page (1-based), 114 files
  bab/<slug>.md       per-chapter concatenated text, 12 files (incl. front matter sections)
  images/             every raster image, page-NNN-imgKK.<ext>, 72 files
  wireframes/         (pre-existing) UI mockups 4.17-4.26
  graph/
    _graph.md         START HERE - navigation hub, mermaid overview, node catalog
    graph.json        curated knowledge graph: 78 nodes + 89 edges
    nodes/*.md        themed narrative nodes, cross-linked with [[node-id]] wikilinks
```

## Quick start for an LLM

1. Read `graph/_graph.md` for the map.
2. Read `graph/nodes/divergences.md` - the naskah differs from the running code; this is the key note.
3. Query `graph/graph.json` for any entity/relation; follow each node's `doc` field to its explanation.
4. Need full prose? `bab/` (per chapter) or `text/` (per page). Need a figure? `images/` + `_manifest.json`.

## Source facts

- Judul: Pengembangan Fitur Dashboard pada Sistem Manajemen Proyek Berdasarkan Data Laporan Harian (Studi Kasus PT Smart Home Inovasi Yogyakarta).
- Penulis: Dian Putri Iswandi (5220311118), UTY, 2026.
- Inti: SPI (EV/PV) -> RAG -> EWS, review gate, escalation. Black Box 18 tests, 83.33%.
