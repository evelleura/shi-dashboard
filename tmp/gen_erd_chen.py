#!/usr/bin/env python3
"""ERD notasi Chen (akademik, gaya referensi Pelanggan/Pegawai) -> drawio.
Persegi=entitas, oval=atribut (PK garis-bawah), belah ketupat=relasi.
Aturan dari referensi dosen:
  - kardinalitas 'm'/'1' (huruf kecil) NEMPEL di entitas (label di ujung garis dekat entitas)
  - relasi M:N = belah ketupat ber-ATRIBUT (associative), BUKAN entitas terpisah
    -> tb_penugasan_proyek jadi relasi 'Ditugaskan' (id_penugasan PK menggantung), spt 'Membeli'
  - nama relasi huruf kapital
Reusable: edit ENT/ATTRS/REL/ASSOC lalu jalankan ulang.
"""
import xml.etree.ElementTree as ET

OX, OY = 300, 40
EW, EH = 160, 50
OVW, OVH = 120, 34
DW, DH = 130, 60

ATTRS = {
 'tb_user':            [('id_user',1),('nama',0),('email',0),('password',0),('role',0)],
 'tb_klien':           [('id_klien',1),('nama_klien',0),('alamat',0),('no_telp',0),('email',0),('id_user',0)],
 'tb_proyek':          [('id_proyek',1),('id_klien',0),('id_user',0),('nama_proyek',0),('status',0),('start_date',0),('end_date',0),('phase',0)],
 'tb_kesehatan_proyek':[('id_proyek',1),('spi_value',0),('actual',0),('planned',0),('status',0),('completed',0),('total_tasks',0)],
 'tb_penugasan_proyek':[('id_penugasan',1),('id_proyek',0),('id_user',0),('assigned_at',0)],
 'tb_eskalasi':        [('id_eskalasi',1),('id_tugas',0),('id_user',0),('title',0),('priority',0),('status',0)],
 'tb_tugas':           [('id_tugas',1),('id_proyek',0),('id_user',0),('nama_tugas',0),('due_date',0),('status',0),('assigned_to',0)],
 'tb_bukti':           [('id_bukti',1),('id_user',0),('id_tugas',0),('file_path',0)],
}
ENT = {
 'tb_user':            (160, 640, 'left'),
 'tb_klien':           (160, 250, 'left'),
 'tb_proyek':          (740, 250, 'up'),
 'tb_kesehatan_proyek':(1340,250, 'right'),
 'tb_penugasan_proyek':(560, 600, 'down'),
 'tb_eskalasi':        (1340,600, 'right'),
 'tb_tugas':           (740, 1010,'down'),
 'tb_bukti':           (1340,1010,'right'),
}
# relasi biasa: (A,B,verb,kardA,kardB,diamond_cx,diamond_cy)  subjek=A
REL = [
 ('tb_klien','tb_proyek','Memesan','1','m', 490,275),
 ('tb_user','tb_klien','Mengelola','1','m', 250,460),
 ('tb_user','tb_proyek','Membuat','1','m', 500,475),
 ('tb_proyek','tb_kesehatan_proyek','Dipantau','1','1', 1110,275),
 ('tb_proyek','tb_penugasan_proyek','Memuat','1','m', 705,440),
 ('tb_user','tb_penugasan_proyek','Menerima','1','m', 470,665),
 ('tb_proyek','tb_tugas','Mencakup','1','m', 820,650),
 ('tb_user','tb_tugas','Mengerjakan','1','m', 300,890),
 ('tb_tugas','tb_bukti','Melampirkan','1','m', 1150,1035),
 ('tb_tugas','tb_eskalasi','Memicu','1','m', 1130,820),
]
# relasi associative DIHAPUS: penugasan kini entitas persegi (aturan "atribut hanya entitas").
# M:N user<->proyek diwakili 2 relasi 1:m ke entitas asosiatif tb_penugasan_proyek (Memuat + Menerima).
ASSOC = []

cells = []
add = cells.append
seen = set()
_ai = [0]

def fan(src_id, bx, by, bw, bh, side, attrs):
    """emit oval atribut + konektor mengelilingi box (entitas atau diamond)."""
    cx, cy = bx+bw/2, by+bh/2
    n = len(attrs)
    for j,(lbl,pk) in enumerate(attrs):
        if side=='left':
            ox = bx-200; oy = cy - (n-1)/2*44 + j*44 - OVH/2
        elif side=='right':
            ox = bx+bw+80; oy = cy - (n-1)/2*44 + j*44 - OVH/2
        elif side=='up':
            ox = cx - (n-1)/2*128 + j*128 - OVW/2; oy = by-95
        else: # down
            ox = cx - (n-1)/2*128 + j*128 - OVW/2; oy = by+bh+65
        key = (round(ox), round(oy))
        assert key not in seen, f"oval tumpuk {lbl} @ {key}"
        seen.add(key)
        fs = 'fontStyle=4;' if pk else ''
        oid = f"a{_ai[0]}"; _ai[0]+=1
        add(f'<mxCell id="{oid}" value="{lbl}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontSize=10;{fs}fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{ox:.0f}" y="{oy:.0f}" width="{OVW}" height="{OVH}" as="geometry"/></mxCell>')
        add(f'<mxCell id="ce{oid}" style="endArrow=none;html=1;strokeColor=#000000;rounded=0;" edge="1" parent="1" source="{src_id}" target="{oid}"><mxGeometry relative="1" as="geometry"/></mxCell>')

def card_edge(eid, src, tgt, card):
    """garis relasi + label kardinalitas NEMPEL di entitas (x=0.78 -> dekat target)."""
    add(f'<mxCell id="{eid}" style="endArrow=none;html=1;strokeColor=#000000;edgeStyle=orthogonalEdgeStyle;rounded=0;" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    add(f'<mxCell id="{eid}l" value="{card}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;fontSize=13;fontStyle=1;fontColor=#000000;labelBackgroundColor=#FFFFFF;" connectable="0" vertex="1" parent="{eid}"><mxGeometry x="0.78" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>')

# entitas
eid = {}
for i,(name,(x,y,side)) in enumerate(ENT.items()):
    cid=f"e{i}"; eid[name]=cid
    add(f'<mxCell id="{cid}" value="{name}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontSize=12;fontStyle=1;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{x+OX}" y="{y+OY}" width="{EW}" height="{EH}" as="geometry"/></mxCell>')

# atribut entitas
for name,(x,y,side) in ENT.items():
    fan(eid[name], x+OX, y+OY, EW, EH, side, ATTRS[name])

# relasi biasa
for k,(A,B,verb,ca,cb,dx,dy) in enumerate(REL):
    did=f"d{k}"
    add(f'<mxCell id="{did}" value="{verb}" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontSize=11;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{dx+OX-DW//2}" y="{dy+OY-DH//2}" width="{DW}" height="{DH}" as="geometry"/></mxCell>')
    card_edge(f"{did}a", did, eid[A], ca)
    card_edge(f"{did}b", did, eid[B], cb)

# relasi associative + atributnya
for m,(A,B,verb,ca,cb,dx,dy,attrs,side) in enumerate(ASSOC):
    did=f"s{m}"
    bx,by = dx+OX-DW//2, dy+OY-DH//2
    add(f'<mxCell id="{did}" value="{verb}" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontSize=11;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{bx}" y="{by}" width="{DW}" height="{DH}" as="geometry"/></mxCell>')
    card_edge(f"{did}a", did, eid[A], ca)
    card_edge(f"{did}b", did, eid[B], cb)
    fan(did, bx, by, DW, DH, side, attrs)

body = "\n        ".join(cells)
xml = f'''<mxfile host="app.diagrams.net">
  <diagram name="ERD" id="erd-shi-chen">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2150" pageHeight="1400" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

ET.fromstring(xml)  # self-check well-formed
out = r"D:\__CODING\personal\_gf\irene\shi-crm\diagram\erd_shi.drawio"
with open(out,'w',encoding='utf-8') as f: f.write(xml)
print("ok", len(cells), "cells,", _ai[0], "ovals,", len(ENT), "entitas,", len(REL)+len(ASSOC), "relasi ->", out)
