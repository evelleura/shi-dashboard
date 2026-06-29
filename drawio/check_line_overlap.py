#!/usr/bin/env python3
"""Verifikasi keluhan dosen 'tidak tumpang-tindih' utk GARIS RELASI di erd_shi.drawio.
Rekonstruksi polyline tiap garis relasi (anchor diamond -> titik-belok -> anchor
entitas) dari exitX/entryX + Array points, lalu deteksi:
  (a) segmen menembus kotak bukan- endpoint  (overlap garis x kotak)
  (b) dua segmen beda-relasi COLLINEAR & tumpang  (overlap garis x garis; silang TIDAK dihitung)
Silang tegak-lurus = wajar di ERD, bukan pelanggaran."""
import re, xml.etree.ElementTree as ET

F = r"D:\__CODING\personal\_gf\irene\shi-crm\diagram\erd_shi.final.drawio"
root = ET.parse(F).getroot()

boxes, rhom, rect = {}, set(), set()
for c in root.iter('mxCell'):
    g = c.find('mxGeometry'); style = c.get('style') or ''
    if c.get('vertex') == '1' and g is not None and g.get('width'):
        x, y = float(g.get('x')), float(g.get('y'))
        w, h = float(g.get('width')), float(g.get('height'))
        boxes[c.get('id')] = (x, y, w, h)
        if 'rhombus' in style: rhom.add(c.get('id'))
        elif 'ellipse' not in style: rect.add(c.get('id'))

def frac(style, key, d):
    m = re.search(rf"{key}=([-\d.]+)", style)
    return float(m.group(1)) if m else d

rels = []  # (id, [pts])
for c in root.iter('mxCell'):
    if c.get('edge') != '1': continue
    s, t = c.get('source'), c.get('target')
    if s not in rhom or t not in rect: continue
    st = c.get('style') or ''
    bx, by, bw, bh = boxes[s]; ex, ey, ew, eh = boxes[t]
    p0 = (bx + frac(st,'exitX',0.5)*bw, by + frac(st,'exitY',0.5)*bh)
    p1 = (ex + frac(st,'entryX',0.5)*ew, ey + frac(st,'entryY',0.5)*eh)
    mids = []
    g = c.find('mxGeometry'); arr = g.find('Array') if g is not None else None
    if arr is not None:
        mids = [(float(p.get('x')), float(p.get('y'))) for p in arr.findall('mxPoint')]
    rels.append((c.get('id'), s, t, [p0]+mids+[p1]))

def segs(pts):
    return list(zip(pts, pts[1:]))

# (a) garis x kotak
PAD = 4
def hits_box(seg, skip):
    bad = []
    (x1,y1),(x2,y2) = seg
    for bid,(x,y,w,h) in boxes.items():
        if bid in skip: continue
        bx0,by0,bx1,by1 = x+PAD,y+PAD,x+w-PAD,y+h-PAD
        if abs(y1-y2) < 0.5:
            lo,hi = sorted((x1,x2))
            if by0 < y1 < by1 and lo < bx1 and hi > bx0: bad.append(bid)
        else:
            lo,hi = sorted((y1,y2))
            if bx0 < x1 < bx1 and lo < by1 and hi > by0: bad.append(bid)
    return bad

box_pen = []
for rid,s,t,pts in rels:
    for seg in segs(pts):
        for bid in hits_box(seg, {s,t}):
            box_pen.append((rid, bid))

# (b) garis x garis collinear-overlap
def collinear_overlap(a, b):
    (ax1,ay1),(ax2,ay2) = a; (bx1,by1),(bx2,by2) = b
    ah, bh = abs(ay1-ay2) < 0.5, abs(by1-by2) < 0.5
    av, bv = abs(ax1-ax2) < 0.5, abs(bx1-bx2) < 0.5
    if ah and bh and abs(ay1-by1) < 2:          # dua horizontal, y sama
        lo = max(min(ax1,ax2), min(bx1,bx2)); hi = min(max(ax1,ax2), max(bx1,bx2))
        return hi - lo > 6
    if av and bv and abs(ax1-bx1) < 2:          # dua vertikal, x sama
        lo = max(min(ay1,ay2), min(by1,by2)); hi = min(max(ay1,ay2), max(by1,by2))
        return hi - lo > 6
    return False

line_ov = []
for i in range(len(rels)):
    for j in range(i+1, len(rels)):
        ri, rj = rels[i], rels[j]
        for sa in segs(ri[3]):
            for sb in segs(rj[3]):
                if collinear_overlap(sa, sb):
                    line_ov.append((ri[0], rj[0]))
                    break

print(f"{len(rels)} garis relasi diperiksa")
print(f"(a) garis tembus kotak : {len(box_pen)}", box_pen if box_pen else "-> BERSIH")
print(f"(b) garis collinear-overlap garis : {len(line_ov)}", line_ov if line_ov else "-> BERSIH")
print("VERDICT:", "ORTOGONAL & TIDAK TUMPANG-TINDIH [OK]" if not box_pen and not line_ov else "MASIH ADA PELANGGARAN [!]")
