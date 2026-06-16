# /// script
# requires-python = ">=3.10"
# dependencies = ["pymupdf", "pdfplumber"]
# ///
"""
Extract `Naskah TA Final 4.pdf` into LLM-friendly form.

Outputs (all under docs/naskah-extract/):
  _manifest.json     structure tree, page->chapter map, image + figure + table inventory
  text/page-NNN.txt  raw text per physical page (1-based)
  bab/<slug>.md      per-chapter concatenated markdown (text only)
  images/            every raster image, named page-NNN-imgKK.<ext>

Re-runnable. Idempotent (clears text/ bab/ images/ on each run).
"""
import fitz  # PyMuPDF
import json
import re
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
PDF = HERE.parent / "Naskah TA Final 4.pdf"

TEXT_DIR = HERE / "text"
BAB_DIR = HERE / "bab"
IMG_DIR = HERE / "images"

FIG_RE = re.compile(r"Gambar\s+(\d+\.\d+)\s+(.+)")
TBL_RE = re.compile(r"Tabel\s+(\d+\.\d+)\s+(.+)")


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:60]


def reset_dirs():
    for d in (TEXT_DIR, BAB_DIR, IMG_DIR):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)


def build_chapter_ranges(toc, n_pages):
    """Map each top-level (level==1) TOC entry to a [start,end] physical page range."""
    tops = [(i, t) for i, t in enumerate(toc) if t[0] == 1]
    ranges = []
    for k, (idx, (lvl, title, page)) in enumerate(tops):
        start = page
        end = tops[k + 1][1][2] - 1 if k + 1 < len(tops) else n_pages
        ranges.append({"title": title, "start": start, "end": max(start, end)})
    return ranges


def main():
    reset_dirs()
    doc = fitz.open(PDF)
    n = doc.page_count
    toc = doc.get_toc()

    manifest = {
        "source": PDF.name,
        "pages": n,
        "metadata": {k: doc.metadata.get(k) for k in ("title", "author", "creator")},
        "toc": [{"level": l, "title": t, "page": p} for (l, t, p) in toc],
        "chapters": [],
        "images": [],
        "figures": [],   # Gambar X.Y captions
        "tables": [],    # Tabel X.Y captions
    }

    chapters = build_chapter_ranges(toc, n)
    page_text = {}

    # --- per-page text + images ---
    for pno in range(n):
        page = doc[pno]
        phys = pno + 1
        txt = page.get_text("text")
        page_text[phys] = txt
        (TEXT_DIR / f"page-{phys:03d}.txt").write_text(txt, encoding="utf-8")

        # figure / table captions
        for m in FIG_RE.finditer(txt):
            manifest["figures"].append(
                {"id": m.group(1), "title": m.group(2).strip(), "page": phys}
            )
        for m in TBL_RE.finditer(txt):
            manifest["tables"].append(
                {"id": m.group(1), "title": m.group(2).strip(), "page": phys}
            )

        # images
        for ii, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            ext = base["ext"]
            w, h = base.get("width"), base.get("height")
            # skip tiny decorative slivers (logos/lines under 40px)
            if (w or 0) < 40 and (h or 0) < 40:
                continue
            fname = f"page-{phys:03d}-img{ii:02d}.{ext}"
            (IMG_DIR / fname).write_bytes(base["image"])
            manifest["images"].append(
                {"file": fname, "page": phys, "xref": xref, "ext": ext, "w": w, "h": h}
            )

    # --- per-chapter markdown ---
    for ch in chapters:
        body = []
        for phys in range(ch["start"], ch["end"] + 1):
            t = page_text.get(phys, "").rstrip()
            if t:
                body.append(f"\n\n<!-- page {phys} -->\n\n{t}")
        slug = slugify(ch["title"])
        (BAB_DIR / f"{slug}.md").write_text(
            f"# {ch['title']}\n\n_Pages {ch['start']}-{ch['end']} of {PDF.name}_\n"
            + "".join(body),
            encoding="utf-8",
        )
        manifest["chapters"].append(
            {"title": ch["title"], "slug": slug, "start": ch["start"], "end": ch["end"]}
        )

    # associate each image with nearest figure caption on same page
    fig_by_page = {}
    for f in manifest["figures"]:
        fig_by_page.setdefault(f["page"], []).append(f)
    for im in manifest["images"]:
        figs = fig_by_page.get(im["page"], [])
        if len(figs) == 1:
            im["figure"] = figs[0]["id"]
            im["caption"] = figs[0]["title"]

    (HERE / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"pages={n} chapters={len(chapters)} images={len(manifest['images'])} "
          f"figures={len(manifest['figures'])} tables={len(manifest['tables'])}")


if __name__ == "__main__":
    main()
