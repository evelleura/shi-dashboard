"""Chen-notation ERD generator.
Strict 3-row grid. Entity-relationship-entity edges = orthogonal (right-angle).
Entity-attribute edges = straight (diagonal OK)."""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ERD_KONSEPTUAL.drawio")

# Styles
S_ENT = ("rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
         "strokeWidth=1.5;fontSize=12;fontStyle=1;fontColor=#000000;")
S_ATTR = ("ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
          "strokeWidth=1;fontSize=10;fontColor=#000000;")
S_ATTR_PK = ("ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
             "strokeWidth=1;fontSize=10;fontStyle=4;fontColor=#000000;")
S_REL = ("rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
         "strokeWidth=1.5;fontSize=11;fontColor=#000000;")
# Attribute edge: plain straight line
S_LINE_ATTR = "endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
# Relationship edge: orthogonal (right-angle siku)
S_LINE_REL = ("endArrow=none;startArrow=none;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;"
              "strokeColor=#000000;strokeWidth=1;jettySize=auto;orthogonalLoop=1;")
S_CAPTION = "text;html=1;align=center;fontSize=11;fontStyle=2;fontColor=#000000;"

cells = []
nid = [0]
def gid():
    nid[0] += 1
    return f"c{nid[0]}"

def shape(x, y, w, h, label, style):
    i = gid()
    cells.append(f'<mxCell id="{i}" value="{label}" style="{style}" vertex="1" parent="1">'
                 f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    return i

def rect(x, y, w, h, label):    return shape(x, y, w, h, label, S_ENT)
def oval(x, y, w, h, label, pk=False):
    return shape(x, y, w, h, label, S_ATTR_PK if pk else S_ATTR)
def diamond(x, y, w, h, label): return shape(x, y, w, h, label, S_REL)

def edge_attr(src, tgt):
    """Entity to attribute: straight line, no constraint on routing."""
    i = gid()
    cells.append(f'<mxCell id="{i}" value="" style="{S_LINE_ATTR}" edge="1" parent="1" '
                 f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    return i

def edge_rel(src, tgt, waypoints=None):
    """Entity to relationship diamond: orthogonal route. Optional waypoints."""
    i = gid()
    geom = '<mxGeometry relative="1" as="geometry"'
    if waypoints:
        pts = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in waypoints)
        geom += f'><Array as="points">{pts}</Array></mxGeometry>'
    else:
        geom += "/>"
    cells.append(f'<mxCell id="{i}" value="" style="{S_LINE_REL}" edge="1" parent="1" '
                 f'source="{src}" target="{tgt}">{geom}</mxCell>')
    return i

def card_label(edge_id, text, near_source=True):
    lid = gid()
    x = -0.7 if near_source else 0.7
    cells.append(f'<mxCell id="{lid}" value="{text}" '
                 f'style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;'
                 f'points=[];fontSize=12;fontStyle=1;fontColor=#000000;background=#FFFFFF;" '
                 f'vertex="1" connectable="0" parent="{edge_id}">'
                 f'<mxGeometry x="{x}" relative="1" as="geometry">'
                 f'<mxPoint as="offset"/></mxGeometry></mxCell>')

def link_pair(ent_a, rel, ent_b, card_a, card_b, wp_a=None, wp_b=None):
    e1 = edge_rel(ent_a, rel, wp_a); card_label(e1, card_a, near_source=True)
    e2 = edge_rel(rel, ent_b, wp_b); card_label(e2, card_b, near_source=False)

# ============================================================
# Layout — strict grid
# ============================================================
PAGE_W = 1700
PAGE_H = 1280
ENT_W, ENT_H = 140, 50
REL_W, REL_H = 130, 60
ATTR_W, ATTR_H = 110, 36

KLIEN  = (300, 180)
PROYEK = (1300, 180)
USER   = (800, 560)
ESKAL  = (300, 920)
TUGAS  = (800, 920)
BUKTI  = (1300, 920)

e_klien  = rect(*KLIEN,  ENT_W, ENT_H, "tb_klien")
e_proyek = rect(*PROYEK, ENT_W, ENT_H, "tb_proyek")
e_user   = rect(*USER,   ENT_W, ENT_H, "tb_user")
e_eskal  = rect(*ESKAL,  ENT_W, ENT_H, "tb_eskalasi")
e_tugas  = rect(*TUGAS,  ENT_W, ENT_H, "tb_tugas")
e_bukti  = rect(*BUKTI,  ENT_W, ENT_H, "tb_bukti")

def dmd(cx, cy, label):
    return diamond(cx - REL_W // 2, cy - REL_H // 2, REL_W, REL_H, label)

# ============================================================
# Diamond positions (centers) for clean orthogonal routing
# ============================================================
# Entity centers: klien(370,205) proyek(1370,205) user(870,585)
#                 eskal(370,945) tugas(870,945) bukti(1370,945)
r_klien_proy = dmd(870,  205, "memiliki")    # row1 horiz: klien-proyek y=205
r_user_proy  = dmd(1370, 395, "mengelola")   # x=proyek, y=between (above user)
r_proy_tug   = dmd(1100, 765, "memiliki")    # off-axis, route via waypoints
r_user_tug   = dmd(870,  765, "mengerjakan") # vert: user-tugas x=870
r_tug_bk     = dmd(1120, 1080, "memiliki")   # below row3 to free corridor
r_user_esk   = dmd(140,  585, "melaporkan")  # far-left x, y=user

# ============================================================
# Relationship pairs with cardinality + waypoints
# ============================================================
# 1. klien-proyek: pure horiz at y=205, no waypoints
link_pair(e_klien, r_klien_proy, e_proyek, "1", "N")

# 2. user-proyek: user goes UP-then-RIGHT, proyek-diamond vertical at x=1370
link_pair(e_user, r_user_proy, e_proyek, "M", "N")

# 3. proyek-tugas: waypoint forces route via top-left to avoid r_user_proy
#    proyek -> (1100, 205) -> diamond(1100, 765)
link_pair(e_proyek, r_proy_tug, e_tugas, "1", "N",
          wp_a=[(1100, 205)])

# 4. user-tugas: pure vert at x=870, no waypoints
link_pair(e_user, r_user_tug, e_tugas, "1", "N")

# 5. tugas-bukti: tugas down-then-right to diamond, bukti down-then-left to diamond
link_pair(e_tugas, r_tug_bk, e_bukti, "1", "N")

# 6. user-eskalasi: user-LEFT to diamond at y=585, eskalasi-UP to diamond
link_pair(e_user, r_user_esk, e_eskal, "1", "N")

# ============================================================
# Attributes — clustered tight at outside corners
# ============================================================
def attach_attrs(entity, attrs):
    for x, y, label, pk in attrs:
        a = oval(x, y, ATTR_W, ATTR_H, label, pk=pk)
        edge_attr(entity, a)

# tb_klien (NW)
attach_attrs(e_klien, [
    (60,   90, "id_klien",   True),
    (200,  60, "nama_klien", False),
    (60,  150, "alamat",     False),
    (200, 120, "no_telp",    False),
])

# tb_proyek (NE)
attach_attrs(e_proyek, [
    (1240,  60, "id_proyek",     True),
    (1380,  30, "nama_proyek",   False),
    (1520,  60, "id_klien",      False),
    (1520, 110, "status",        False),
    (1520, 160, "phase",         False),
    (1380,  90, "project_value", False),
])

# tb_user (above, top arc)
attach_attrs(e_user, [
    (640, 480, "id_user", True),
    (760, 450, "name",    False),
    (880, 450, "email",   False),
    (1000, 480, "role",   False),
])

# tb_eskalasi (SW)
attach_attrs(e_eskal, [
    (60,  990, "id_eskalasi", True),
    (60, 1050, "id_proyek",   False),
    (60, 1110, "priority",    False),
    (200, 1110, "status",     False),
])

# tb_tugas (below, bottom arc) — careful: avoid r_tug_bk at (1120, 1080)
# attrs to LEFT-bottom and immediate below
attach_attrs(e_tugas, [
    (640, 1010, "id_tugas",  True),
    (640, 1070, "id_proyek", False),
    (760, 1130, "status",    False),
    (880, 1130, "due_date",  False),
])

# tb_bukti (SE)
attach_attrs(e_bukti, [
    (1450, 990,  "id_bukti",  True),
    (1450, 1050, "id_tugas",  False),
    (1570, 990,  "file_path", False),
])

# Caption
shape(550, 1230, 600, 24, "Gambar 4.18 Entity Relationship Diagram", S_CAPTION)

# ============================================================
xml_cells = "\n        ".join(cells)
xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-07T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="erd_konseptual" name="ERD Konseptual">
    <mxGraphModel dx="1400" dy="1000" grid="0" gridSize="10" guides="1" tooltips="1" connect="0" arrows="0" fold="0" page="1" pageScale="1" pageWidth="{PAGE_W}" pageHeight="{PAGE_H}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {xml_cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''
with open(OUT, "w", encoding="utf-8") as f:
    f.write(xml)
print(f"OK -> {OUT}")
