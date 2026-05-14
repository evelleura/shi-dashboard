# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Chen-notation ERD generator -- aligned to curated reference Gambar 4.15.
6 entities (tb_ prefix), full attribute ovals, Indonesian relationships."""
from __future__ import annotations
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ERD_KONSEPTUAL.drawio")

S_ENT = ("rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
         "strokeWidth=1.5;fontSize=12;fontStyle=1;fontColor=#000000;")
S_ATTR = ("ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
          "strokeWidth=1;fontSize=10;fontColor=#000000;")
S_ATTR_PK = ("ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
             "strokeWidth=1;fontSize=10;fontStyle=4;fontColor=#000000;")
S_REL = ("rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
         "strokeWidth=1.5;fontSize=10;fontColor=#000000;")
S_LINE = ("endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;"
          "strokeWidth=1;edgeStyle=orthogonalEdgeStyle;jettySize=auto;orthogonalLoop=1;")
S_LINE_DIAG = "endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_CARD = "text;html=1;align=center;fontSize=11;fontStyle=1;fontColor=#000000;"

PAGE_W, PAGE_H = 1800, 1300

cells: list[str] = []
_id = [0]


def gid() -> str:
    _id[0] += 1
    return f"c{_id[0]}"


def shape(x: int, y: int, w: int, h: int, label: str, style: str) -> str:
    i = gid()
    cells.append(f'<mxCell id="{i}" value="{label}" style="{style}" vertex="1" parent="1">'
                 f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    return i


def edge(src: str, tgt: str, straight: bool = False) -> str:
    """Default: orthogonal routing (entity-relation lines).
    straight=True: diagonal radial lines (entity-attribute spokes)."""
    i = gid()
    s = S_LINE_DIAG if straight else S_LINE
    cells.append(f'<mxCell id="{i}" value="" style="{s}" edge="1" parent="1" '
                 f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    return i


def card(x: int, y: int, label: str) -> str:
    return shape(x, y, 22, 18, label, S_CARD)


def entity(cx: int, cy: int, name: str) -> str:
    return shape(cx - 70, cy - 22, 140, 44, name, S_ENT)


def attr_oval(cx: int, cy: int, name: str, pk: bool = False) -> str:
    style = S_ATTR_PK if pk else S_ATTR
    return shape(cx - 50, cy - 16, 100, 32, name, style)


def diamond(cx: int, cy: int, label: str) -> str:
    return shape(cx - 60, cy - 28, 120, 56, label, S_REL)


# ---- Layout ----
# tb_klien (top-left), tb_proyek (top-center), tb_user (center), tb_eskalasi (bottom-left),
# tb_tugas (bottom-center), tb_bukti (bottom-right)

# Entities
e_klien    = entity(220,  170, "tb_klien")
e_proyek   = entity(820,  220, "tb_proyek")
e_user     = entity(820,  580, "tb_user")
e_eskalasi = entity(220,  950, "tb_eskalasi")
e_tugas    = entity(820,  980, "tb_tugas")
e_bukti    = entity(1420, 980, "tb_bukti")

# tb_klien attributes (around 220,170): id_klien (PK), nama_klien, no_telp, alamat
a_kl_id    = attr_oval(80,  80,  "id_klien", pk=True)
a_kl_nama  = attr_oval(220, 50,  "nama_klien")
a_kl_telp  = attr_oval(360, 80,  "no_telp")
a_kl_alm   = attr_oval(80,  240, "alamat")
for a in (a_kl_id, a_kl_nama, a_kl_telp, a_kl_alm):
    edge(e_klien, a, straight=True)

# tb_proyek attributes (around 820,220): id_proyek (PK), nama_proyek, id_klien (FK), project_value, status, phase
a_pr_id    = attr_oval(680, 90,  "id_proyek", pk=True)
a_pr_nama  = attr_oval(820, 60,  "nama_proyek")
a_pr_idkl  = attr_oval(560, 200, "id_klien")
a_pr_val   = attr_oval(960, 90,  "project_value")
a_pr_st    = attr_oval(1100, 200, "status")
a_pr_ph    = attr_oval(1100, 280, "phase")
for a in (a_pr_id, a_pr_nama, a_pr_idkl, a_pr_val, a_pr_st, a_pr_ph):
    edge(e_proyek, a, straight=True)

# tb_user attributes (around 820,580): id_user (PK), nama, role, email
a_u_id     = attr_oval(680, 540, "id_user", pk=True)
a_u_nama   = attr_oval(680, 620, "nama")
a_u_role   = attr_oval(1010, 560, "role")
a_u_email  = attr_oval(1010, 620, "email")
for a in (a_u_id, a_u_nama, a_u_role, a_u_email):
    edge(e_user, a, straight=True)

# tb_eskalasi attributes (around 220,950): id_eskalasi (PK), id_proyek, priority, status
a_es_id    = attr_oval(80,  860, "id_eskalasi", pk=True)
a_es_idpr  = attr_oval(80,  920, "id_proyek")
a_es_pri   = attr_oval(80,  990, "priority")
a_es_st    = attr_oval(220, 1080, "status")
for a in (a_es_id, a_es_idpr, a_es_pri, a_es_st):
    edge(e_eskalasi, a, straight=True)

# tb_tugas attributes (around 820,980): id_tugas (PK), due_date, id_proyek, status
a_tg_id    = attr_oval(680, 1080, "id_tugas", pk=True)
a_tg_due   = attr_oval(820, 1110, "due_date")
a_tg_idpr  = attr_oval(820, 1180, "id_proyek")
a_tg_st    = attr_oval(960, 1080, "status")
for a in (a_tg_id, a_tg_due, a_tg_idpr, a_tg_st):
    edge(e_tugas, a, straight=True)

# tb_bukti attributes (around 1420,980): id_bukti (PK), file_path, id_tugas
a_bk_id    = attr_oval(1560, 920, "id_bukti", pk=True)
a_bk_fp    = attr_oval(1700, 950, "file_path")
a_bk_idtg  = attr_oval(1560, 1080, "id_tugas")
for a in (a_bk_id, a_bk_fp, a_bk_idtg):
    edge(e_bukti, a, straight=True)

# ---- Relationships ----

# 1. tb_klien (1) -memiliki- (M) tb_proyek
d1 = diamond(520, 195, "memiliki")
edge(e_klien, d1)
edge(d1, e_proyek)
card(440, 175, "1")
card(640, 175, "M")

# 2. tb_user (M) -mengelola- (M) tb_proyek (M:M)
d2 = diamond(680, 400, "mengelola")
edge(e_user, d2)
edge(d2, e_proyek)
card(700, 330, "M")
card(700, 470, "M")

# 3. tb_proyek (1) -memiliki- (M) tb_eskalasi  (use shared diamond near user-proyek-eskalasi area)
d3 = diamond(490, 530, "memiliki")
edge(e_proyek, d3)
edge(d3, e_eskalasi)
card(550, 450, "1")
card(330, 700, "M")

# 4. tb_user (1) -melaporkan- (M) tb_eskalasi
d4 = diamond(490, 780, "melaporkan")
edge(e_user, d4)
edge(d4, e_eskalasi)
card(620, 700, "1")
card(360, 870, "M")

# 5. tb_proyek (1) -memiliki- (M) tb_tugas
d5 = diamond(1090, 600, "memiliki")
edge(e_proyek, d5)
edge(d5, e_tugas)
card(1010, 350, "1")
card(950, 900, "M")

# 6. tb_user (1) -mengerjakan- (M) tb_tugas
d6 = diamond(680, 800, "mengerjakan")
edge(e_user, d6)
edge(d6, e_tugas)
card(750, 700, "1")
card(750, 900, "M")

# 7. tb_tugas (1) -memiliki- (M) tb_bukti
d7 = diamond(1130, 980, "memiliki")
edge(e_tugas, d7)
edge(d7, e_bukti)
card(1060, 960, "1")
card(1340, 960, "M")

HEADER = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel dx="{PAGE_W}" dy="{PAGE_H}" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="0" fold="1" page="1" pageScale="1" pageWidth="{PAGE_W}" pageHeight="{PAGE_H}" math="0" shadow="0" background="#FFFFFF">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
'''
FOOTER = '''  </root>
</mxGraphModel>
'''
xml = HEADER + "\n".join(cells) + "\n" + FOOTER
with open(OUT, "w", encoding="utf-8") as f:
    f.write(xml)
print(f"OK {OUT}")
print(f"  Cells: {len(cells)}")
