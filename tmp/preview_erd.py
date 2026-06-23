#!/usr/bin/env python3
"""Render drawio ERD -> PNG biar bisa diLIHAT (drawio CLI tak ada di env).
Parse vertex (rect/ellipse/rhombus) + edge + label kardinalitas, gambar via matplotlib.
Edge digambar lurus center-ke-center (drawio routing orthogonal, tapi cukup utk nilai kerapatan)."""
import sys, xml.etree.ElementTree as ET
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Ellipse, Polygon

f = sys.argv[1] if len(sys.argv) > 1 else r"D:\__CODING\personal\_gf\irene\shi-crm\diagram\erd_shi.drawio"
out = sys.argv[2] if len(sys.argv) > 2 else r"D:\__CODING\personal\_gf\irene\shi-crm\tmp\erd_preview.png"
root = ET.parse(f).getroot()

verts, edges, labels = {}, [], []
for c in root.iter('mxCell'):
    style = c.get('style') or ''
    g = c.find('mxGeometry')
    if c.get('vertex') == '1' and g is not None and g.get('width'):
        x, y, w, h = (float(g.get(k)) for k in ('x', 'y', 'width', 'height'))
        kind = 'ellipse' if 'ellipse' in style else 'rhombus' if 'rhombus' in style else 'rect'
        verts[c.get('id')] = (x, y, w, h, kind, c.get('value') or '')
    elif c.get('edge') == '1':
        edges.append((c.get('source'), c.get('target')))
    if c.get('vertex') == '1' and 'edgeLabel' in style and g is not None:
        rx = float(g.get('x') or 0)
        labels.append((c.get('parent'), c.get('value') or '', rx))

def center(cid):
    if cid not in verts: return None
    x, y, w, h, *_ = verts[cid]
    return (x + w/2, -(y + h/2))  # y dibalik (drawio turun, mpl naik)

xs = [v[0] for v in verts.values()] + [v[0]+v[2] for v in verts.values()]
ys = [v[1] for v in verts.values()] + [v[1]+v[3] for v in verts.values()]
W, H = max(xs)-min(xs), max(ys)-min(ys)
fig, ax = plt.subplots(figsize=(W/90, H/90), dpi=110)

for src, tgt in edges:  # SEMUA lurus center-ke-center = persis drawio (no orthogonal)
    sc, tc = center(src), center(tgt)
    if sc and tc:
        ax.plot([sc[0], tc[0]], [sc[1], tc[1]], color='#888', lw=0.8, zorder=1)

for cid, (x, y, w, h, kind, val) in verts.items():
    cx, cy = x + w/2, -(y + h/2)
    if kind == 'rect':
        ax.add_patch(Rectangle((x, -(y+h)), w, h, fill=True, facecolor='white', edgecolor='black', lw=1.6, zorder=3))
        ax.text(cx, cy, val, ha='center', va='center', fontsize=8, fontweight='bold', zorder=4)
    elif kind == 'ellipse':
        ax.add_patch(Ellipse((cx, cy), w, h, fill=True, facecolor='white', edgecolor='black', lw=1, zorder=3))
        ax.text(cx, cy, val, ha='center', va='center', fontsize=6.2, zorder=4)
    else:  # rhombus
        pts = [(cx, -(y)), (x+w, cy), (cx, -(y+h)), (x, cy)]
        ax.add_patch(Polygon(pts, fill=True, facecolor='white', edgecolor='black', lw=1.4, zorder=3))
        ax.text(cx, cy, val, ha='center', va='center', fontsize=6.5, zorder=4)

# label kardinalitas: di sepanjang edge parent, frac=(rx+1)/2 dari source
emap = {}
for c in root.iter('mxCell'):
    if c.get('edge') == '1':
        emap[c.get('id')] = (c.get('source'), c.get('target'))
for pe, val, rx in labels:
    st = emap.get(pe)
    if not st: continue
    src, tgt = st
    sc = center(src)
    if tgt not in verts or not sc: continue
    ex, ey, ew, eh, *_ = verts[tgt]
    ecx, ecy = ex+ew/2, -(ey+eh/2)
    dx, dy = sc[0]-ecx, sc[1]-ecy
    if dx == 0 and dy == 0: continue
    scale = 1/max(abs(dx)/(ew/2), abs(dy)/(eh/2))   # tepi entitas ke arah diamond
    L = (dx*dx+dy*dy)**0.5
    lx, ly = ecx+dx*scale+dx/L*13, ecy+dy*scale+dy/L*13  # 13px di luar tepi
    ax.text(lx, ly, val, ha='center', va='center', fontsize=10, fontweight='bold', color='#b00', zorder=5,
            bbox=dict(boxstyle='square,pad=0.03', fc='white', ec='none'))

ax.set_xlim(min(xs)-40, max(xs)+40); ax.set_ylim(-max(ys)-40, -min(ys)+40)
ax.set_aspect('equal'); ax.axis('off')
plt.tight_layout(pad=0.2)
plt.savefig(out, bbox_inches='tight', facecolor='white')
print(f"preview -> {out}  ({W:.0f}x{H:.0f} drawio units, {len(verts)} vertex, {len(edges)} edge)")
