#!/usr/bin/env python3
"""Combine wireframe PNGs side-by-side per group and as one full sheet."""
from PIL import Image, ImageDraw, ImageFont
import os, math

PNG_DIR = os.path.join(os.path.dirname(__file__), 'png')
OUT_DIR = os.path.dirname(__file__)

GROUPS = {
    'Input':  ['WF_01_LOGIN', 'WF_02_TAMBAH_PROYEK', 'WF_03_TAMBAH_DAILY_REPORT'],
    'Proses': ['WF_04_DASHBOARD_EWS', 'WF_05_DATA_PROYEK',
               'WF_06_KANBAN_PENUGASAN', 'WF_07_JADWAL_PROYEK'],
    'Output': ['WF_08_DASHBOARD_PERFORMA_TEKNISI',
               'WF_09_DETAIL_PROYEK', 'WF_10_LAPORAN_KESEHATAN'],
}

LABEL_H   = 36    # height for filename label strip
PAD       = 16    # padding between images
BG        = (245, 246, 248)
LABEL_BG  = (55, 65, 81)
LABEL_FG  = (255, 255, 255)
CANVAS_W  = 1700  # target total canvas width for each group sheet

def target_thumb_w(n_items):
    """Compute thumb width so all n_items fit in one horizontal row."""
    return (CANVAS_W - (n_items + 1) * PAD) // n_items

def load_thumb(path, target_w):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    scale = target_w / w
    return img.resize((target_w, int(h * scale)), Image.LANCZOS)

def make_label(text, w, h, font_size=13):
    lbl = Image.new('RGBA', (w, h), LABEL_BG)
    draw = ImageDraw.Draw(lbl)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', font_size)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tx = (w - (bbox[2] - bbox[0])) // 2
    ty = (h - (bbox[3] - bbox[1])) // 2
    draw.text((tx, ty), text, fill=LABEL_FG, font=font)
    return lbl

def combine_group(names, cols=None):
    """cols=None → all in ONE horizontal row (side by side)."""
    n = len(names)
    if cols is None:
        cols = n                       # all in one row
    tw = target_thumb_w(cols)

    imgs = []
    for name in names:
        path = os.path.join(PNG_DIR, f'{name}.png')
        if os.path.exists(path):
            imgs.append((name, load_thumb(path, tw)))
        else:
            print(f'  MISSING: {path}')

    if not imgs:
        return None

    rows = math.ceil(len(imgs) / cols)

    max_h = max(img.size[1] for _, img in imgs)
    cell_w = tw
    cell_h = max_h + LABEL_H

    canvas_w = cols * cell_w + (cols + 1) * PAD
    canvas_h = rows * cell_h + (rows + 1) * PAD

    canvas = Image.new('RGBA', (canvas_w, canvas_h), BG)

    for i, (name, img) in enumerate(imgs):
        col = i % cols
        row = i // cols
        x = PAD + col * (cell_w + PAD)
        y = PAD + row * (cell_h + PAD)

        # label
        short = name.replace('WF_0', 'WF ').replace('WF_1', 'WF 1').replace('_', ' ')
        lbl = make_label(short, cell_w, LABEL_H)
        canvas.paste(lbl, (x, y))

        # image
        iw, ih = img.size
        # center if smaller than cell_w
        ox = x + (cell_w - iw) // 2
        canvas.paste(img, (ox, y + LABEL_H), img)

    return canvas.convert('RGB')

# ── per-group PNGs ────────────────────────────────────────────────
for group_name, names in GROUPS.items():
    print(f'Combining {group_name}...')
    img = combine_group(names)
    if img:
        out = os.path.join(OUT_DIR, f'WF_GROUP_{group_name.upper()}.png')
        img.save(out, 'PNG', optimize=True)
        print(f'  → {out}  ({img.size[0]}×{img.size[1]})')

# ── full sheet: all 10 in a 5-col grid ───────────────────────────
print('Combining full sheet...')
all_names = [n for g in GROUPS.values() for n in g]
img_full = combine_group(all_names, cols=5)
if img_full:
    out_full = os.path.join(OUT_DIR, 'WF_ALL.png')
    img_full.save(out_full, 'PNG', optimize=True)
    print(f'  → {out_full}  ({img_full.size[0]}×{img_full.size[1]})')

print('Done.')
