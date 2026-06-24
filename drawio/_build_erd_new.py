#!/usr/bin/env python3
"""ERD notasi Chen (akademik) -> drawio. COMPACT + rapi.
Aturan: persegi=entitas, oval=atribut (PK garis-bawah), belah ketupat=relasi POLOS.
- atribut HANYA di entitas (penugasan = entitas asosiatif persegi)
- kardinalitas m/1 huruf kecil nempel entitas
- verb relasi spesifik (bukan 'memiliki' melulu), kapital
- belah ketupat auto di titik-tengah dua entitas (+nudge), oval nempel, kanvas rapat
Reusable: edit ENT/ATTRS/REL lalu jalankan ulang.
"""
import xml.etree.ElementTree as ET

OX, OY = 60, 50
EW, EH = 150, 44
OVW, OVH = 98, 30
DW, DH = 104, 52
GAP = 28          # jarak oval dari sisi entitas
SP_V, SP_H = 35, 104   # spasi antar-oval (vertikal stack / horizontal row)

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
# (x, y, sisi_fan)
ENT = {
 'tb_klien':           (260, 150, 'up'),
 'tb_proyek':          (640, 150, 'up'),
 'tb_kesehatan_proyek':(980, 150, 'right'),
 'tb_penugasan_proyek':(90, 690, 'down'),
 'tb_user':            (90, 430, 'left'),
 'tb_eskalasi':        (980, 480, 'right'),
 'tb_tugas':           (600, 810, 'down'),
 'tb_bukti':           (940, 810, 'right'),
}
# nama TAMPIL entitas (konseptual, tanpa tb_) -- key internal tetap tb_* spy REL/ATTRS jalan
NAME = {
 'tb_user':'User', 'tb_klien':'Klien', 'tb_proyek':'Proyek',
 'tb_kesehatan_proyek':'Kesehatan Proyek', 'tb_penugasan_proyek':'Penugasan',
 'tb_tugas':'Tugas', 'tb_bukti':'Bukti', 'tb_eskalasi':'Eskalasi',
}
# (A,B,verb,kardA,kardB[,dx_nudge,dy_nudge]) -- diamond auto di titik-tengah A,B + nudge
REL = [
 ('tb_klien','tb_proyek','Memesan','1','m'),
 ('tb_user','tb_klien','Mengelola','1','m'),
 ('tb_user','tb_proyek','Membuat','1','m'),
 ('tb_proyek','tb_kesehatan_proyek','Dipantau','1','1'),
 ('tb_proyek','tb_penugasan_proyek','Memuat','1','m'),
 ('tb_user','tb_penugasan_proyek','Menerima','1','m'),
 ('tb_proyek','tb_tugas','Mencakup','1','m'),
 ('tb_user','tb_tugas','Mengerjakan','1','m'),
 ('tb_tugas','tb_bukti','Melampirkan','1','m'),
 ('tb_tugas','tb_eskalasi','Memicu','1','m'),
]

cells = []; add = cells.append
seen = []; CONFLICTS = []; SEGS = []
_ai = [0]

def reg(x, y, w, h, tag):
    for (bx,by,bw,bh,bt) in seen:
        if min(x+w,bx+bw)-max(x,bx) > -2 and min(y+h,by+bh)-max(y,by) > -2:
            CONFLICTS.append(f"{tag} x {bt}")
    seen.append((x,y,w,h,tag))

def box(name):
    x,y,_ = ENT[name]; return (x+OX, y+OY, EW, EH)
def ecenter(name):
    x,y,w,h = box(name); return (x+w/2, y+h/2)

def fan(src_id, bx, by, bw, bh, side, attrs, tag):
    """oval nempel entitas; >5 atribut -> wrap 2 baris (up/down) / 2 kolom (left/right)."""
    cx, cy = bx+bw/2, by+bh/2
    n = len(attrs)
    for j,(lbl,pk) in enumerate(attrs):
        if side in ('up','down'):
            rows = 2 if n>5 else 1
            ncols = -(-n//rows)
            r,c = divmod(j, ncols)
            ox = cx-(ncols-1)/2*SP_H + c*SP_H - OVW/2
            oy = (by-GAP-OVH-r*(OVH+8)) if side=='up' else (by+bh+GAP+r*(OVH+8))
        else:
            cols = 2 if n>5 else 1
            nrows = -(-n//cols)
            c,r = divmod(j, nrows)
            oy = cy-(nrows-1)/2*SP_V + r*SP_V - OVH/2
            ox = (bx-GAP-OVW-c*(OVW+12)) if side=='left' else (bx+bw+GAP+c*(OVW+12))
        reg(ox,oy,OVW,OVH,f"{tag}.{lbl}")
        fs='fontStyle=4;' if pk else ''
        oid=f"a{_ai[0]}"; _ai[0]+=1
        add(f'<mxCell id="{oid}" value="{lbl}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontSize=9;{fs}fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{ox:.0f}" y="{oy:.0f}" width="{OVW}" height="{OVH}" as="geometry"/></mxCell>')
        add(f'<mxCell id="ce{oid}" style="endArrow=none;html=1;strokeColor=#000000;rounded=0;" edge="1" parent="1" source="{src_id}" target="{oid}"><mxGeometry relative="1" as="geometry"/></mxCell>')

def card_edge(eid, src, tgt, card):
    # garis LURUS (gaya Chen akademik) -> drawio render = preview persis
    add(f'<mxCell id="{eid}" style="endArrow=none;html=1;strokeColor=#000000;rounded=0;" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    add(f'<mxCell id="{eid}l" value="{card}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;fontSize=12;fontStyle=1;fontColor=#000000;labelBackgroundColor=#FFFFFF;" connectable="0" vertex="1" parent="{eid}"><mxGeometry x="0.8" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>')

# entitas
eid={}
for i,name in enumerate(ENT):
    x,y,w,h = box(name); reg(x,y,w,h,name)
    eid[name]=f"e{i}"
    add(f'<mxCell id="e{i}" value="{NAME.get(name,name)}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.6;fontSize=11;fontStyle=1;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')

# diamond (titik-tengah + nudge) -> daftar dulu utk cek overlap
for k,r in enumerate(REL):
    A,B,verb,ca,cb = r[:5]
    ndx,ndy = (r[5],r[6]) if len(r)>5 else (0,0)
    ax,ay = ecenter(A); bx,by = ecenter(B)
    dcx,dcy = (ax+bx)/2+ndx, (ay+by)/2+ndy
    dx,dy = dcx-DW/2, dcy-DH/2
    reg(dx,dy,DW,DH,f"<>{verb}")
    add(f'<mxCell id="d{k}" value="{verb}" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.4;fontSize=9;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{dx:.0f}" y="{dy:.0f}" width="{DW}" height="{DH}" as="geometry"/></mxCell>')
    card_edge(f"d{k}a", f"d{k}", eid[A], ca)
    card_edge(f"d{k}b", f"d{k}", eid[B], cb)
    SEGS.append((dcx,dcy,ax,ay,f"<>{verb}",A,verb))
    SEGS.append((dcx,dcy,bx,by,f"<>{verb}",B,verb))

# atribut (didaftar terakhir; reg() kumpulin overlap box)
for name in ENT:
    x,y,w,h = box(name); _,_,side = ENT[name]
    fan(eid[name], x, y, w, h, side, ATTRS[name], name)

# cek garis relasi (lurus) NEMBUS box bukan-endpoint
def _ccw(A,B,C): return (C[1]-A[1])*(B[0]-A[0]) > (B[1]-A[1])*(C[0]-A[0])
def _sx(A,B,C,D): return _ccw(A,C,D)!=_ccw(B,C,D) and _ccw(A,B,C)!=_ccw(A,B,D)
def seg_hits(sx,sy,ex,ey, rx,ry,rw,rh):
    P,Q=(sx,sy),(ex,ey)
    cn=[(rx,ry),(rx+rw,ry),(rx+rw,ry+rh),(rx,ry+rh)]
    return any(_sx(P,Q,cn[i],cn[(i+1)%4]) for i in range(4))
for (sx,sy,ex,ey,sk1,sk2,lbl) in SEGS:
    for (bx,by,bw,bh,bt) in seen:
        if bt in (sk1,sk2): continue
        if seg_hits(sx,sy,ex,ey, bx+5,by+5,bw-10,bh-10):
            CONFLICTS.append(f"garis {lbl} NEMBUS {bt}")

body = "\n        ".join(cells)
xml = f'''<mxfile host="app.diagrams.net">
  <diagram name="ERD" id="erd-shi-chen">
    <mxGraphModel dx="1000" dy="700" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1500" pageHeight="1150" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''
ET.fromstring(xml)
out=r"D:\__CODING\personal\_gf\irene\shi-crm\diagram\erd_shi.drawio"
open(out,'w',encoding='utf-8').write(xml)
print("ok", len(cells),"cells,",_ai[0],"ovals,",len(ENT),"entitas,",len(REL),"relasi ->", out)
if CONFLICTS:
    print("CONFLICTS", len(CONFLICTS))
    for c in CONFLICTS: print("  ", c)
