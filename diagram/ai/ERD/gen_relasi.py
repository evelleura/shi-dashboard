#!/usr/bin/env python3
"""Generate RELASI_DATA.drawio matching the MySQL Workbench / dbSchema visual style."""

HDR = '#4D7EA8'   # table header blue-gray
HDR_STR = '#2C5F88'
ROW_PK = '#EDF2FA'
ROW_ALT = '#F6F9FD'
ROW_WH  = '#FFFFFF'
ROW_STR = '#C4D3DC'
TW = 300   # table width
IW = 28    # icon column width
RH = 22    # row height
SZ = 30    # header startSize

TABLE_STYLE = (
    f"shape=table;startSize={SZ};container=1;collapsible=0;"
    f"childLayout=tableLayout;fixedRows=1;rowLines=0;"
    f"fontStyle=1;align=left;resizeLast=1;"
    f"fillColor={HDR};strokeColor={HDR_STR};fontColor=#FFFFFF;fontSize=10;html=1;"
)
def row_style(fill):
    return (
        f"shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;"
        f"fillColor={fill};strokeColor={ROW_STR};"
        f"collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];"
        f"portConstraint=eastwest;fontSize=9;top=0;left=0;right=0;bottom=1;"
    )
ICON_STYLE = (
    "shape=partialRectangle;connectable=0;fillColor=none;"
    "top=0;left=0;bottom=0;right=0;fontStyle=0;overflow=hidden;"
    "fontSize=10;align=center;verticalAlign=middle;"
)
def txt_style(bold=False, italic=False, color='#333333'):
    fs = (1 if bold else 0) | (2 if italic else 0)
    return (
        "shape=partialRectangle;connectable=0;fillColor=none;"
        "top=0;left=0;bottom=0;right=0;overflow=hidden;"
        f"fontStyle={fs};fontSize=9;align=left;verticalAlign=middle;"
        f"spacingLeft=4;fontColor={color};"
    )

cells = []
id_counter = [10]

def nid(prefix='c'):
    id_counter[0] += 1
    return f"{prefix}{id_counter[0]}"

def cell(cid, value, style, vertex=True, parent='1', x=None, y=None, w=None, h=None, edge=False,
         source=None, target=None, extra=''):
    geo = ''
    if x is not None:
        gy = y if y is not None else 0
        geo = f'<mxGeometry x="{x}" y="{gy}" width="{w}" height="{h}" as="geometry"/>'
    elif y is not None and w is not None:
        geo = f'<mxGeometry y="{y}" width="{w}" height="{h}" as="geometry"/>'
    elif w is not None:
        geo = f'<mxGeometry width="{w}" height="{h}" as="geometry"><mxRectangle width="{w}" height="{h}" as="alternateBounds"/></mxGeometry>'
    vx = 'vertex="1"' if vertex else ''
    ed = 'edge="1"' if edge else ''
    src = f'source="{source}"' if source else ''
    tgt = f'target="{target}"' if target else ''
    val = value.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')
    return f'<mxCell id="{cid}" value="{val}" style="{style}" {vx} {ed} {src} {tgt} parent="{parent}" {extra}>{geo}</mxCell>'

# ── icon selector ──────────────────────────────────────────────────
def icon(kind):
    if kind == 'PK':   return '🔑'
    if kind == 'FK':   return 'FK'
    if kind == 'PKFK': return '🔑'
    if kind == 'NN':   return '🔒'
    return '○'

def icon_style(kind):
    if kind == 'FK':
        return ICON_STYLE + "fontStyle=3;fontSize=8;fontColor=#0066AA;"
    return ICON_STYLE

def field_style(kind):
    if kind == 'PK':   return txt_style(bold=True)
    if kind == 'PKFK': return txt_style(bold=True)
    if kind == 'FK':   return txt_style(italic=True, color='#0066AA')
    return txt_style()

# ── build one table ────────────────────────────────────────────────
# fields = list of (kind, label)   kind in PK FK PKFK NN N
def make_table(tid, label, x, y, fields):
    h = SZ + len(fields) * RH
    cells.append(cell(tid, f"V ○  shi_  {label}", TABLE_STYLE, x=x, y=y, w=TW, h=h))
    row_ids = []
    for i, (kind, text) in enumerate(fields):
        ry = SZ + i * RH
        fill = ROW_PK if kind in ('PK','PKFK') else (ROW_ALT if i % 2 == 0 else ROW_WH)
        rid = f"{tid}_r{i+1}"
        lid = f"{tid}_l{i+1}"
        cid = f"{tid}_c{i+1}"
        cells.append(cell(rid, '', row_style(fill), x=None, y=ry, w=TW, h=RH, parent=tid))
        cells.append(cell(lid, icon(kind), icon_style(kind), w=IW, h=RH, parent=rid))
        cells.append(cell(cid, text, field_style(kind), x=IW, y=None, w=TW-IW, h=RH, parent=rid))
        row_ids.append(rid)
    return row_ids

# ── edge builder ──────────────────────────────────────────────────
def edge(eid, src, tgt, color, ex=1, ey=0.5, nx=0, ny=0.5, pts=None):
    pts_xml = ''
    if pts:
        pts_xml = '<Array as="points">' + ''.join(f'<mxPoint x="{p[0]}" y="{p[1]}"/>' for p in pts) + '</Array>'
    style = (
        f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;"
        f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
        f"entryX={nx};entryY={ny};entryDx=0;entryDy=0;"
        f"strokeColor={color};strokeWidth=1.5;html=1;endArrow=ERmany;startArrow=ERone;"
        f"endFill=0;startFill=0;"
    )
    return f'<mxCell id="{eid}" value="" style="{style}" edge="1" source="{src}" target="{tgt}" parent="1"><mxGeometry relative="1" as="geometry">{pts_xml}</mxGeometry></mxCell>'

def edge11(eid, src, tgt, color, ex=1, ey=0.5, nx=0, ny=0.5, pts=None):
    pts_xml = ''
    if pts:
        pts_xml = '<Array as="points">' + ''.join(f'<mxPoint x="{p[0]}" y="{p[1]}"/>' for p in pts) + '</Array>'
    style = (
        f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;"
        f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
        f"entryX={nx};entryY={ny};entryDx=0;entryDy=0;"
        f"strokeColor={color};strokeWidth=1.5;html=1;endArrow=ERone;startArrow=ERone;"
        f"endFill=0;startFill=0;"
    )
    return f'<mxCell id="{eid}" value="" style="{style}" edge="1" source="{src}" target="{tgt}" parent="1"><mxGeometry relative="1" as="geometry">{pts_xml}</mxGeometry></mxCell>'

# ══════════════════════════════════════════════════════════════════
#  TABLES
# ══════════════════════════════════════════════════════════════════

# users  (col 1, x=30)
u = make_table('T_u', 'users', 30, 30, [
    ('PK', 'id : bigint NOT NULL'),
    ('NN', 'name : varchar(100) NOT NULL'),
    ('NN', 'email : varchar(150) NOT NULL UNIQUE'),
    ('NN', 'password_hash : text NOT NULL'),
    ('NN', 'role : enum(\'technician\',\'manager\',\'admin\') NOT NULL'),
    ('N',  'is_active : boolean DEFAULT true'),
    ('N',  'created_at : timestamp DEFAULT NOW()'),
])

# clients  (col 1)
c = make_table('T_c', 'clients', 30, 264, [
    ('PK', 'id : bigint NOT NULL'),
    ('NN', 'name : varchar(100) NOT NULL'),
    ('N',  'address : text'),
    ('N',  'phone : varchar(20)'),
    ('N',  'email : varchar(150)'),
    ('N',  'notes : text'),
    ('N',  'created_at : timestamp DEFAULT NOW()'),
])

# projects  (col 2, x=390)
p = make_table('T_p', 'projects', 390, 30, [
    ('PK', 'id : bigint NOT NULL'),
    ('NN', 'name : varchar(200) NOT NULL'),
    ('N',  'description : text'),
    ('FK', 'client_id : bigint [→ clients.id]'),
    ('NN', 'start_date : date NOT NULL'),
    ('NN', 'end_date : date NOT NULL'),
    ('N',  'status : enum(\'active\',\'completed\',\'on_hold\')'),
    ('N',  'project_value : numeric(15,2)'),
    ('N',  'phase : enum(\'survey\',\'execution\')'),
    ('N',  'survey_approved : boolean DEFAULT false'),
    ('FK', 'created_by : bigint [→ users.id]'),
    ('N',  'created_at : timestamp DEFAULT NOW()'),
    ('N',  'updated_at : timestamp'),
])

# project_assignments  (col 2)
pa = make_table('T_pa', 'project_assignments', 390, 406, [
    ('PK', 'id : bigint NOT NULL'),
    ('FK', 'project_id : bigint [→ projects.id]'),
    ('FK', 'user_id : bigint [→ users.id]'),
    ('N',  'role : varchar(50)'),
    ('N',  'assigned_at : timestamp DEFAULT NOW()'),
])

# project_health  (col 3, x=760)
ph = make_table('T_ph', 'project_health', 760, 30, [
    ('PKFK','project_id : bigint [PK, FK → projects.id]'),
    ('N',  'spi_value : numeric(5,4)'),
    ('N',  'status : enum(\'green\',\'amber\',\'red\')'),
    ('N',  'deviation_percent : numeric(5,2)'),
    ('N',  'actual_progress : numeric(5,2)'),
    ('N',  'planned_progress : numeric(5,2)'),
    ('N',  'total_tasks : int DEFAULT 0'),
    ('N',  'completed_tasks : int DEFAULT 0'),
    ('N',  'last_updated : timestamp'),
])

# tasks  (col 3)
t = make_table('T_t', 'tasks', 760, 318, [
    ('PK', 'id : bigint NOT NULL'),
    ('FK', 'project_id : bigint [→ projects.id]'),
    ('NN', 'title : varchar(200) NOT NULL'),
    ('N',  'description : text'),
    ('FK', 'assigned_to : bigint [→ users.id]'),
    ('NN', 'status : enum(\'to_do\',\'working_on_it\',\'done\') NOT NULL'),
    ('N',  'due_date : date'),
    ('N',  'sort_order : int DEFAULT 0'),
    ('N',  'created_at : timestamp'),
    ('N',  'updated_at : timestamp'),
])

# task_evidence  (col 4, x=1130)
te = make_table('T_te', 'task_evidence', 1130, 120, [
    ('PK', 'id : bigint NOT NULL'),
    ('FK', 'task_id : bigint [→ tasks.id]'),
    ('NN', 'file_path : text NOT NULL'),
    ('N',  'file_name : varchar(255)'),
    ('N',  'file_type : varchar(50)'),
    ('N',  'file_size : bigint'),
    ('FK', 'uploaded_by : bigint [→ users.id]'),
    ('N',  'created_at : timestamp'),
])

# materials  (col 4)
mat = make_table('T_mat', 'materials', 1130, 400, [
    ('PK', 'id : bigint NOT NULL'),
    ('FK', 'project_id : bigint [→ projects.id]'),
    ('NN', 'name : varchar(200) NOT NULL'),
    ('N',  'quantity : numeric(10,2)'),
    ('N',  'unit : varchar(50)'),
    ('N',  'unit_price : numeric(15,2)'),
    ('N',  'notes : text'),
    ('N',  'created_at : timestamp'),
])

# budget_items  (col 4)
bud = make_table('T_bud', 'budget_items', 1130, 680, [
    ('PK', 'id : bigint NOT NULL'),
    ('FK', 'project_id : bigint [→ projects.id]'),
    ('N',  'description : text'),
    ('N',  'category : varchar(50)'),
    ('N',  'amount : numeric(15,2)'),
    ('N',  'notes : text'),
    ('N',  'created_at : timestamp'),
])

# ══════════════════════════════════════════════════════════════════
#  EDGES  (FK row → PK row)
# ══════════════════════════════════════════════════════════════════
edges = [
    # clients.id → projects.client_id  (green)
    edge('E1', c[0], p[3], '#34A853', ex=1, ey=0.5, nx=0, ny=0.5),
    # users.id → projects.created_by  (blue)
    edge('E2', u[0], p[10], '#4285F4', ex=1, ey=0.5, nx=0, ny=0.5),
    # projects.id → project_assignments.project_id  (orange)
    edge('E3', p[0], pa[1], '#FF6D00', ex=0.5, ey=1, nx=0.5, ny=0),
    # users.id → project_assignments.user_id  (purple)
    edge('E4', u[0], pa[2], '#9C27B0', ex=1, ey=1, nx=0, ny=0.5),
    # projects.id → project_health.project_id  (red, 1:1)
    edge11('E5', p[0], ph[0], '#EA4335', ex=1, ey=0.5, nx=0, ny=0.5),
    # projects.id → tasks.project_id  (teal)
    edge('E6', p[0], t[1], '#00ACC1', ex=1, ey=0.6, nx=0, ny=0.5),
    # users.id → tasks.assigned_to  (dark blue)
    edge('E7', u[0], t[4], '#1A73E8', ex=1, ey=0.8, nx=0, ny=0.5),
    # tasks.id → task_evidence.task_id  (dark green)
    edge('E8', t[0], te[1], '#0F9D58', ex=1, ey=0.5, nx=0, ny=0.5),
    # users.id → task_evidence.uploaded_by  (brown)
    edge('E9', u[0], te[6], '#795548', ex=1, ey=0.9, nx=0, ny=0.5),
    # projects.id → materials.project_id  (amber)
    edge('E10', p[0], mat[1], '#F57C00', ex=1, ey=0.7, nx=0, ny=0.5),
    # projects.id → budget_items.project_id  (crimson)
    edge('E11', p[0], bud[1], '#AD1457', ex=1, ey=0.8, nx=0, ny=0.5),
]

# ══════════════════════════════════════════════════════════════════
#  LEGEND
# ══════════════════════════════════════════════════════════════════
leg_cells = [
    f'<mxCell id="Leg0" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFD;strokeColor=#C4D3DC;strokeWidth=1;" vertex="1" parent="1"><mxGeometry x="30" y="500" width="290" height="175" as="geometry"/></mxCell>',
    f'<mxCell id="Leg1" value="Keterangan" style="text;html=1;align=left;fontSize=10;fontStyle=1;fontColor=#2C5F88;" vertex="1" parent="1"><mxGeometry x="42" y="510" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg2" value="🔑  Primary Key (PK)" style="text;html=1;align=left;fontSize=9;fontColor=#333333;" vertex="1" parent="1"><mxGeometry x="42" y="532" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg3" value="FK  Foreign Key (cetak miring biru)" style="text;html=1;align=left;fontSize=9;fontColor=#0066AA;fontStyle=2;" vertex="1" parent="1"><mxGeometry x="42" y="552" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg4" value="🔒  NOT NULL" style="text;html=1;align=left;fontSize=9;fontColor=#333333;" vertex="1" parent="1"><mxGeometry x="42" y="572" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg5" value="○  Nullable" style="text;html=1;align=left;fontSize=9;fontColor=#333333;" vertex="1" parent="1"><mxGeometry x="42" y="592" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg6" value="──► Satu ke Banyak (1:N)" style="text;html=1;align=left;fontSize=9;fontColor=#333333;" vertex="1" parent="1"><mxGeometry x="42" y="612" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg7" value="──| Satu ke Satu (1:1)  [project_health]" style="text;html=1;align=left;fontSize=9;fontColor=#333333;" vertex="1" parent="1"><mxGeometry x="42" y="632" width="260" height="18" as="geometry"/></mxCell>',
    f'<mxCell id="Leg8" value="ON DELETE CASCADE berlaku untuk semua FK" style="text;html=1;align=left;fontSize=8;fontColor=#888888;" vertex="1" parent="1"><mxGeometry x="42" y="655" width="260" height="14" as="geometry"/></mxCell>',
]

# ══════════════════════════════════════════════════════════════════
#  ASSEMBLE XML
# ══════════════════════════════════════════════════════════════════
header = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-07T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="relasi_antar_data" name="Perancangan Relasi Antar Data">
    <mxGraphModel dx="1500" dy="1050" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>'''

footer = '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

lines = [header]
for c2 in cells:
    lines.append('        ' + c2)
for e2 in edges:
    lines.append('        ' + e2)
for lc in leg_cells:
    lines.append('        ' + lc)
lines.append(footer)

out_path = 'RELASI_DATA.drawio'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Written {len(cells)} cells + {len(edges)} edges → {out_path}")
