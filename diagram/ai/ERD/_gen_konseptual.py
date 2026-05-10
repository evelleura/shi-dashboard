# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Chen-notation ERD generator for shi-crm (13 entities, schema-aligned).
Compact form: entity rectangle + PK ellipse only on conceptual diagram.
Relationships shown as diamonds with cardinality labels.
Full attribute lists are documented in SKEMA_FISIK and Tabel 4.6-4.18 of §4.3.3."""
from __future__ import annotations
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ERD_KONSEPTUAL.drawio")

# --- Styles ---
S_ENT = ("rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
         "strokeWidth=1.5;fontSize=11;fontStyle=1;fontColor=#000000;")
S_ENT_WEAK = ("rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
              "strokeWidth=1.5;fontSize=11;fontStyle=1;fontColor=#000000;dashed=1;")
S_ATTR_PK = ("ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
             "strokeWidth=1;fontSize=10;fontStyle=4;fontColor=#000000;")
S_REL = ("rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
         "strokeWidth=1.5;fontSize=10;fontColor=#000000;")
S_LINE = ("endArrow=none;startArrow=none;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;"
          "strokeColor=#000000;strokeWidth=1;jettySize=auto;orthogonalLoop=1;")
S_LINE_STRAIGHT = "endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_CARD = "text;html=1;align=center;fontSize=10;fontStyle=1;fontColor=#000000;"
S_CAPTION = "text;html=1;align=center;fontSize=11;fontStyle=2;fontColor=#000000;"

# --- Canvas ---
PAGE_W, PAGE_H = 2400, 1500

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


def edge(src: str, tgt: str, *, straight: bool = False) -> str:
    i = gid()
    s = S_LINE_STRAIGHT if straight else S_LINE
    cells.append(f'<mxCell id="{i}" value="" style="{s}" edge="1" parent="1" '
                 f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    return i


def card(x: int, y: int, label: str) -> str:
    return shape(x, y, 24, 18, label, S_CARD)


# --- Entity definitions ---
# (id, name_label, pk_label, x_center, y_center, weak)
ENTITIES = [
    # Row 1 (y=140) — Core domain: User authentication / Klien / Proyek
    ("e_user",       "User",            "id",         300,  140, False),
    ("e_klien",      "Klien",           "id",         900,  140, False),
    ("e_proyek",     "Proyek",          "id",        1500,  140, False),
    ("e_audit",      "Audit Log",       "id",        2100,  140, False),

    # Row 2 (y=480) — Penugasan + Tugas + Bukti + Aktivitas
    ("e_penugasan",  "Penugasan Proyek", "(project_id, user_id)", 600, 480, True),
    ("e_tugas",      "Tugas",           "id",        1200,  480, False),
    ("e_bukti",      "Bukti Tugas",     "id",        1800,  480, False),
    ("e_aktivitas",  "Aktivitas Tugas", "id",        2100,  680, False),

    # Row 3 (y=820) — Resource + Daily Report
    ("e_material",   "Material",        "id",         300,  820, False),
    ("e_anggaran",   "Anggaran",        "id",         900,  820, False),
    ("e_daily",      "Daily Report",    "id",        1500,  820, False),

    # Row 4 (y=1180) — Health + Eskalasi
    ("e_health",     "Kesehatan Proyek","project_id", 900, 1180, False),
    ("e_eskalasi",   "Eskalasi",        "id",        1500, 1180, False),
]

# Build entities
ent_ids: dict[str, str] = {}
for ek, name, pk_label, cx, cy, weak in ENTITIES:
    style = S_ENT_WEAK if weak else S_ENT
    eid = shape(cx - 90, cy - 30, 180, 60, name, style)
    ent_ids[ek] = eid
    # PK ellipse below entity
    pk_id = shape(cx - 60, cy + 50, 120, 28, pk_label, S_ATTR_PK)
    edge(eid, pk_id, straight=True)


def diamond(label: str, x: int, y: int) -> str:
    return shape(x - 50, y - 25, 100, 50, label, S_REL)


def link(ent_a: str, rel_id: str, card_a: str, ent_b: str, card_b: str,
         card_a_xy: tuple[int, int], card_b_xy: tuple[int, int]) -> None:
    edge(ent_ids[ent_a], rel_id)
    edge(rel_id, ent_ids[ent_b])
    card(*card_a_xy, card_a)
    card(*card_b_xy, card_b)


# --- Relationships ---
# Each relationship: diamond + 2 edges + 2 cardinality labels

# 1. Klien -- memiliki (1:N) -- Proyek
d1 = diamond("memiliki", 1200, 140)
edge(ent_ids["e_klien"], d1)
edge(d1, ent_ids["e_proyek"])
card(1080, 110, "1")
card(1340, 110, "N")

# 2. User -- mengelola (M:N via Penugasan) -- Proyek (junction shown as weak entity)
d2 = diamond("mengelola", 600, 280)
edge(ent_ids["e_user"], d2)
edge(d2, ent_ids["e_penugasan"])
edge(ent_ids["e_penugasan"], d2)
# Wait: Penugasan IS the relationship-as-entity in M:N. Skip diamond, just link User-Penugasan-Proyek.
cells.pop()  # remove last edge
cells.pop()  # remove second edge
cells.pop()  # remove first edge
cells.pop()  # remove diamond d2
_id[0] -= 4
edge(ent_ids["e_user"], ent_ids["e_penugasan"])
edge(ent_ids["e_penugasan"], ent_ids["e_proyek"])
card(380, 290, "1")
card(750, 460, "N")
card(680, 290, "M")
card(1380, 460, "N")

# 3. Proyek -- memiliki -- Tugas (1:N)
d3 = diamond("memiliki", 1380, 320)
edge(ent_ids["e_proyek"], d3)
edge(d3, ent_ids["e_tugas"])
card(1380, 200, "1")
card(1320, 410, "N")

# 4. User -- mengerjakan -- Tugas (1:N via assigned_to)
d4 = diamond("mengerjakan", 750, 480)
edge(ent_ids["e_user"], d4)
edge(d4, ent_ids["e_tugas"])
card(420, 460, "1")
card(1080, 460, "N")

# 5. Tugas -- memiliki -- Bukti Tugas (1:N)
d5 = diamond("memiliki", 1500, 480)
edge(ent_ids["e_tugas"], d5)
edge(d5, ent_ids["e_bukti"])
card(1290, 460, "1")
card(1700, 460, "N")

# 6. Tugas -- memiliki -- Aktivitas Tugas (1:N)
d6 = diamond("memiliki", 1620, 580)
edge(ent_ids["e_tugas"], d6)
edge(d6, ent_ids["e_aktivitas"])
card(1290, 540, "1")
card(2030, 660, "N")

# 7. User -- mengunggah -- Bukti (1:N) - implicit via uploaded_by FK; omit diamond to reduce clutter
# 8. Proyek -- memiliki -- Material (1:N)
d8 = diamond("memiliki", 600, 820)
edge(ent_ids["e_proyek"], d8)
edge(d8, ent_ids["e_material"])
card(600, 250, "1")
card(390, 800, "N")

# 9. Proyek -- memiliki -- Anggaran (1:N)
d9 = diamond("memiliki", 1100, 820)
edge(ent_ids["e_proyek"], d9)
edge(d9, ent_ids["e_anggaran"])
card(1100, 250, "1")
card(990, 800, "N")

# 10. Proyek -- memiliki -- Daily Report (1:N)
d10 = diamond("memiliki", 1500, 540)
edge(ent_ids["e_proyek"], d10)
edge(d10, ent_ids["e_daily"])
card(1500, 250, "1")
card(1500, 800, "N")

# 11. Tugas -- memiliki -- Daily Report (1:N optional)
d11 = diamond("memiliki", 1320, 720)
edge(ent_ids["e_tugas"], d11)
edge(d11, ent_ids["e_daily"])
card(1180, 540, "1")
card(1380, 800, "N")

# 12. Proyek -- memiliki -- Kesehatan Proyek (1:1)
d12 = diamond("memiliki", 900, 1000)
edge(ent_ids["e_proyek"], d12)
edge(d12, ent_ids["e_health"])
card(900, 250, "1")
card(900, 1100, "1")

# 13. Tugas -- memiliki -- Eskalasi (1:N)
d13 = diamond("memiliki", 1500, 720)
edge(ent_ids["e_tugas"], d13)
edge(d13, ent_ids["e_eskalasi"])
card(1500, 540, "1")
card(1500, 1100, "N")

# 14. Proyek -- memiliki -- Eskalasi (1:N - dual via project_id)
d14 = diamond("memiliki", 1700, 1000)
edge(ent_ids["e_proyek"], d14)
edge(d14, ent_ids["e_eskalasi"])
card(1700, 250, "1")
card(1700, 1100, "N")

# 15. User -- melaporkan -- Eskalasi (1:N via reported_by)
d15 = diamond("melaporkan", 600, 1180)
edge(ent_ids["e_user"], d15)
edge(d15, ent_ids["e_eskalasi"])
card(420, 1170, "1")
card(1380, 1170, "N")

# 16. User -- mencatat -- Audit Log (1:N via changed_by)
d16 = diamond("mencatat", 2100, 320)
edge(ent_ids["e_user"], d16)
edge(d16, ent_ids["e_audit"])
card(420, 290, "1")
card(2100, 200, "N")

# Build XML
HEADER = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel dx="2400" dy="1500" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="0" fold="1" page="1" pageScale="1" pageWidth="{PAGE_W}" pageHeight="{PAGE_H}" math="0" shadow="0" background="#FFFFFF">
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
print(f"  Entities: {len(ENTITIES)} | cells: {len(cells)}")
