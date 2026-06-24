#!/usr/bin/env python3
"""Potong erd_preview.png jadi 4 kuadran (overlap) + upscale 2x biar detail
garis relasi kebaca pas di-Read. Output tmp/erd_q{1..4}.png."""
from PIL import Image
im = Image.open(r"D:\__CODING\personal\_gf\irene\shi-crm\tmp\erd_preview.png").convert("RGB")
W, H = im.size
ov = 80  # overlap px biar tepi tak kepotong
quads = {
    1: (0, 0, W//2+ov, H//2+ov),            # kiri-atas
    2: (W//2-ov, 0, W, H//2+ov),            # kanan-atas
    3: (0, H//2-ov, W//2+ov, H),            # kiri-bawah
    4: (W//2-ov, H//2-ov, W, H),            # kanan-bawah
}
for k, box in quads.items():
    c = im.crop(box)
    c = c.resize((c.width*2, c.height*2), Image.LANCZOS)
    p = rf"D:\__CODING\personal\_gf\irene\shi-crm\tmp\erd_q{k}.png"
    c.save(p)
    print("saved", p, c.size)
