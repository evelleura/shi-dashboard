#!/usr/bin/env python3
"""ERD Chen (akademik) auto-layout -> drawio (AUXILIARY / KANDIDAT saja).

[!] SUMBER KEBENARAN = diagram/erd_shi.final.drawio -- di-rapikan TANGAN, FINAL.
    Generator ini TIDAK menimpa final.drawio. OUT -> drawio/erd_shi.autolayout.drawio
    sbg kandidat auto-layout pembanding; tata-letak RESMI dipelihara manual di final.

Garis relasi ORTOGONAL, LURUS, sesedikit siku.
Sumber layout = erd_shi.final.drawio (posisi ENTITAS + ATRIBUT DIPERTAHANKAN).
Skrip menata-ulang BELAH-KETUPAT + garis relasi saja.

Kelurusan dimanfaatkan dari tata-letak entitas yg sudah rapi (baris/kolom):
  6 relasi LURUS total (0 siku)  : Memesan, Dipantau, Menerima, Melampirkan,
                                   Memicu (horizontal) + Memuat (vertikal).
  4 relasi sulit (Proyek terkepung Memesan-kiri/Dipantau-kanan/Penugasan-bawah,
  User ramai 4 relasi) -> rute eksplisit rapi, tiap lengan <=1 siku kecuali
  Mencakup (Proyek->Tugas terhalang Penugasan+oval) yg butuh 1 koridor memutar.
Titik-sambung di entitas ramai DISEBAR -> tak ada garis mulai dari titik sama.

Output: drawio/erd_shi.autolayout.drawio (kandidat). final.drawio dipelihara manual.
"""
import xml.etree.ElementTree as ET
from collections import defaultdict

SRC = r"D:\__CODING\personal\_gf\irene\shi-crm\diagram\erd_shi.final.drawio"
OUT = r"D:\__CODING\personal\_gf\irene\shi-crm\drawio\erd_shi.autolayout.drawio"
REL_STYLE = "endArrow=none;html=1;strokeColor=#000000;rounded=0;edgeStyle=orthogonalEdgeStyle;"
PAD = 5

tree = ET.parse(SRC); root = tree.getroot()
boxes, ename, diamonds, dverb, edge_cells, dcell = {}, {}, set(), {}, [], {}
for c in root.iter('mxCell'):
    style = c.get('style') or ''; g = c.find('mxGeometry')
    if c.get('vertex') == '1' and g is not None and g.get('width'):
        x, y = float(g.get('x')), float(g.get('y'))
        w, h = float(g.get('width')), float(g.get('height'))
        boxes[c.get('id')] = [x, y, w, h]
        if 'rhombus' in style:
            diamonds.add(c.get('id')); dverb[c.get('id')] = c.get('value') or ''; dcell[c.get('id')] = c
        elif 'ellipse' not in style:
            ename[c.get('id')] = c.get('value') or ''
    elif c.get('edge') == '1':
        edge_cells.append((c, c.get('source'), c.get('target')))

DW, DH = next(boxes[d][2:4] for d in diamonds)
name2id = {v: k for k, v in ename.items()}
def B(name): return boxes[name2id[name]]                 # box entitas by-nama
def cxy(name): x, y, w, h = B(name); return (x+w/2, y+h/2)
def _resolve_t(cell, t):                                  # tujuan edge: target= kalau ada, else infer dari targetPoint (edge lepas hasil edit tangan)
    if t in ename: return t
    g = cell.find('mxGeometry'); tp = g.find("mxPoint[@as='targetPoint']") if g is not None else None
    if tp is not None:
        px, py = float(tp.get('x')), float(tp.get('y'))
        for eid in ename:
            x, y, w, h = boxes[eid]
            if x-6 <= px <= x+w+6 and y-6 <= py <= y+h+6: return eid
    return None
dents = defaultdict(list)                                 # diamond -> [cell, entitas_id]
for cell, s, t in edge_cells:
    if s in diamonds:
        rt = _resolve_t(cell, t)
        if rt is not None: dents[s].append((cell, rt))

TIPF = {'L': (0, 0.5), 'R': (1, 0.5), 'T': (0.5, 0), 'B': (0.5, 1)}
def tip(Dc, k): dx, dy = Dc; return {'L': (dx-DW/2, dy), 'R': (dx+DW/2, dy),
                                     'T': (dx, dy-DH/2), 'B': (dx, dy+DH/2)}[k]
def efrac(name, px, py): x, y, w, h = B(name); return ((px-x)/w, (py-y)/h)

# ---------- builder rute ----------
def straight(an, bn):
    """an,bn se-baris ATAU se-kolom -> belah-ketupat di tengah, dua lengan lurus."""
    ax, ay, aw, ah = B(an); bx, by, bw, bh = B(bn)
    acx, acy, bcx, bcy = ax+aw/2, ay+ah/2, bx+bw/2, by+bh/2
    if abs(acy-bcy) < 46:                                 # horizontal
        yy = (acy+bcy)/2
        L, R = (an, bn) if acx < bcx else (bn, an)
        lx, ly, lw, lh = B(L); rx, ry, rw, rh = B(R)
        dcx = (lx+lw+rx)/2; Dc = (dcx, yy)
        return Dc, {L: (TIPF['L'], (1, (yy-ly)/lh), [tip(Dc, 'L'), (lx+lw, yy)]),
                    R: (TIPF['R'], (0, (yy-ry)/rh), [tip(Dc, 'R'), (rx, yy)])}
    yy = None                                             # vertical
    T, Bm = (an, bn) if acy < bcy else (bn, an)
    tx, ty, tw, th = B(T); bx2, by2, bw2, bh2 = B(Bm)
    xx = tx+tw/2; dcy = (ty+th+by2)/2; Dc = (xx, dcy)
    return Dc, {T: (TIPF['T'], ((xx-tx)/tw, 1), [tip(Dc, 'T'), (xx, ty+th)]),
                Bm: (TIPF['B'], ((xx-bx2)/bw2, 0), [tip(Dc, 'B'), (xx, by2)])}

def elbow(Dc, frm, to_name, to_pt, exit_k):
    """satu siku: keluar tip exit_k -> belok -> titik to_pt di entitas to_name."""
    sx, sy = tip(Dc, exit_k)
    if exit_k in ('L', 'R'):                              # H dulu lalu V
        corner = (to_pt[0], sy)
    else:                                                 # V dulu lalu H
        corner = (sx, to_pt[1])
    return (TIPF[exit_k], efrac(to_name, *to_pt), [(sx, sy), corner, to_pt])

ROUTES = {}                                              # diamond -> (Dc, {entid:(exitf,entryf,pts)})
for D in diamonds:
    v = dverb[D]; ents = {ename[e]: (cell, e) for cell, e in dents[D]}
    if v in ('Memesan', 'Dipantau', 'Menerima', 'Melampirkan', 'Memicu', 'Memuat'):
        an, bn = list(ents)
        Dc, arms = straight(an, bn)
        ROUTES[D] = (Dc, {name2id[k]: a for k, a in arms.items()})
    elif v == 'Mengelola':                               # Klien (atas) - User (bawah)
        K = B('Klien'); U = B('User')
        Dc = (K[0]+K[2]/2, (K[1]+K[3]+U[1])/2)
        a_k = (TIPF['T'], (0.5, 1), [tip(Dc, 'T'), (K[0]+K[2]/2, K[1]+K[3])])      # lurus V
        a_u = elbow(Dc, 'User', 'User', (U[0]+U[2], U[1]+8), 'B')                  # 1 siku ke sisi-kanan User (hindari belah-ketupat Membuat)
        ROUTES[D] = (Dc, {name2id['Klien']: a_k, name2id['User']: a_u})
    elif v == 'Membuat':                                 # User (bawah) - Proyek (atas-kanan)
        U = B('User'); P = B('Proyek')
        Dc = (U[0]+U[2]/2, U[1]-65)
        a_u = (TIPF['B'], (0.5, 0), [tip(Dc, 'B'), (U[0]+U[2]/2, U[1])])           # lurus V
        px = P[0]+12
        a_p = elbow(Dc, 'P', 'Proyek', (px, P[1]+P[3]), 'R')                       # 1 siku ke bawah Proyek
        ROUTES[D] = (Dc, {name2id['User']: a_u, name2id['Proyek']: a_p})
    elif v == 'Mengerjakan':                             # User (atas) - Tugas (bawah-kanan)
        U = B('User'); T = B('Tugas')
        Dc = (U[0]+U[2]/2, U[1]+U[3]+76)
        a_u = (TIPF['T'], (0.5, 1), [tip(Dc, 'T'), (U[0]+U[2]/2, U[1]+U[3])])      # lurus V
        tx = T[0]+30
        a_t = elbow(Dc, 'T', 'Tugas', (tx, T[1]), 'R')                            # 1 siku ke atas Tugas
        ROUTES[D] = (Dc, {name2id['User']: a_u, name2id['Tugas']: a_t})
    elif v == 'Mencakup':                                # Proyek -> Tugas (terhalang Penugasan): memutar kanan
        P = B('Proyek'); T = B('Tugas')
        Dc = (P[0]+P[2]+160, T[1]-69)                     # koridor kanan kosong (x~1010, y~615)
        prx = P[0]+P[2]-5                                 # keluar Proyek bawah pojok-kanan
        a_p = ((0.5, 0), ((prx-P[0])/P[2], 1),
               [tip(Dc, 'T'), (Dc[0], 450), (prx, 450), (prx, P[1]+P[3])])         # 2 siku turun-kanan
        tx = T[0]+100
        a_t = ((0, 0.5), ((tx-T[0])/T[2], 0),
               [tip(Dc, 'L'), (tx, Dc[1]), (tx, T[1])])                            # 1 siku ke atas Tugas
        ROUTES[D] = (Dc, {name2id['Proyek']: a_p, name2id['Tugas']: a_t})

# ---------- terapkan ----------
def set_edge(cell, exitf, entryf, pts):
    cell.set('style', REL_STYLE +
             f"exitX={exitf[0]:.3f};exitY={exitf[1]:.3f};exitDx=0;exitDy=0;"
             f"entryX={entryf[0]:.3f};entryY={entryf[1]:.3f};entryDx=0;entryDy=0;")
    g = cell.find('mxGeometry')
    for ch in list(g): g.remove(ch)
    g.set('relative', '1')
    mids = pts[1:-1]
    if mids:
        arr = ET.SubElement(g, 'Array'); arr.set('as', 'points')
        for px, py in mids:
            p = ET.SubElement(arr, 'mxPoint'); p.set('x', f"{px:.0f}"); p.set('y', f"{py:.0f}")

cell_of = {e: cell for D in diamonds for cell, e in dents[D]}   # (D-implisit via ROUTES)
tot_bends = 0
for D, (Dc, arms) in ROUTES.items():
    g = dcell[D].find('mxGeometry')
    g.set('x', f"{Dc[0]-DW/2:.0f}"); g.set('y', f"{Dc[1]-DH/2:.0f}")
    boxes[D] = [Dc[0]-DW/2, Dc[1]-DH/2, DW, DH]
    cells = {e: cell for cell, e in dents[D]}
    for entid, (exitf, entryf, pts) in arms.items():
        cells[entid].set('target', entid)                 # pastikan ter-bind (perbaiki edge lepas mis. Mencakup->Tugas)
        set_edge(cells[entid], exitf, entryf, pts)
        tot_bends += max(0, len(pts)-2)

tree.write(OUT, encoding='unicode', xml_declaration=False)

# ---------- verifikasi ----------
def seg_hits(seg, skip):
    (x1, y1), (x2, y2) = seg; n = 0
    for bid, (x, y, w, h) in boxes.items():
        if bid in skip: continue
        bx0, by0, bx1, by1 = x+PAD, y+PAD, x+w-PAD, y+h-PAD
        if abs(y1-y2) < 0.5:
            lo, hi = sorted((x1, x2))
            if by0 < y1 < by1 and lo < bx1 and hi > bx0: n += 1
        else:
            lo, hi = sorted((y1, y2))
            if bx0 < x1 < bx1 and lo < by1 and hi > by0: n += 1
    return n
def collinear(a, b):
    (ax1, ay1), (ax2, ay2) = a; (bx1, by1), (bx2, by2) = b
    if abs(ay1-ay2) < 0.5 and abs(by1-by2) < 0.5 and abs(ay1-by1) < 2:
        return min(max(ax1, ax2), max(bx1, bx2))-max(min(ax1, ax2), min(bx1, bx2)) > 6
    if abs(ax1-ax2) < 0.5 and abs(bx1-bx2) < 0.5 and abs(ax1-bx1) < 2:
        return min(max(ay1, ay2), max(by1, by2))-max(min(ay1, ay2), min(by1, by2)) > 6
    return False
allp, box_pen = [], 0
for D, (Dc, arms) in ROUTES.items():
    A, Bn = [e for _, e in dents[D]]
    for entid, (_, _, pts) in arms.items():
        allp.append(pts)
        box_pen += sum(seg_hits(s, {D, A, Bn}) for s in zip(pts, pts[1:]))
ov = 0
for i in range(len(allp)):
    for j in range(i+1, len(allp)):
        if any(collinear(sa, sb) for sa in zip(allp[i], allp[i][1:]) for sb in zip(allp[j], allp[j][1:])):
            ov += 1
print(f"ok -> {OUT}")
print(f"  {len(ename)} entitas, {len(diamonds)} relasi, {len(allp)} garis")
print(f"  total SIKU (belokan)   : {tot_bends}")
print(f"  garis tembus kotak     : {box_pen}")
print(f"  garis tumpang-tindih   : {ov}")
print("  VERDICT:", "LURUS & BERSIH [OK]" if box_pen == 0 and ov == 0 else "PERLU CEK [!]")
