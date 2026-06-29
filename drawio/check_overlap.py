#!/usr/bin/env python3
"""Audit tumpang-tindih bbox antar vertex (entitas/oval/diamond) di drawio ERD.
Lapor pasangan yang overlap > PAD toleransi. Bukan edge (edge tak punya geometry box)."""
import xml.etree.ElementTree as ET

f = r"D:\__CODING\personal\_gf\irene\shi-crm\diagram\erd_shi.final.drawio"
root = ET.parse(f).getroot()
boxes = []
for c in root.iter('mxCell'):
    if c.get('vertex') != '1':
        continue
    g = c.find('mxGeometry')
    if g is None or None in (g.get('x'), g.get('y'), g.get('width'), g.get('height')):
        continue  # lewati label edge (relative, tanpa y/width)
    x, y = float(g.get('x')), float(g.get('y'))
    w, h = float(g.get('width')), float(g.get('height'))
    boxes.append((c.get('value') or c.get('id'), x, y, w, h))

PAD = -2  # izinkan sentuhan tepi 2px
def overlap(a, b):
    _, ax, ay, aw, ah = a; _, bx, by, bw, bh = b
    ix = min(ax+aw, bx+bw) - max(ax, bx)
    iy = min(ay+ah, by+bh) - max(ay, by)
    return ix > PAD and iy > PAD

hits = []
for i in range(len(boxes)):
    for j in range(i+1, len(boxes)):
        if overlap(boxes[i], boxes[j]):
            a, b = boxes[i][0], boxes[j][0]
            ix = min(boxes[i][1]+boxes[i][3], boxes[j][1]+boxes[j][3]) - max(boxes[i][1], boxes[j][1])
            iy = min(boxes[i][2]+boxes[i][4], boxes[j][2]+boxes[j][4]) - max(boxes[i][2], boxes[j][2])
            hits.append((a, b, round(ix), round(iy)))

print(f"{len(boxes)} vertex, {len(hits)} overlap")
for a, b, ix, iy in hits:
    print(f"  OVERLAP {a!r} x {b!r}  ({ix}x{iy}px)")
