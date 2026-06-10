"""
Generator ERD selaras dengan classdiagram_new.drawio.

Strategi: pakai struktur drawio yang sama persis dengan class diagram --
swimlane + childLayout=stackLayout + text rows -- tapi tanpa method.
Edge memakai exitX/exitY/entryX/entryY eksplisit (mirip class diagram)
agar label kardinalitas berada di luar boundary entity.

Output: drawio/erd_new.drawio
"""

# ============================================================================
# Style constants
# ============================================================================
W = 260
HEADER = 28
ROW_H = 20

SWIMLANE = (
    'swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;'
    'horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;'
    'resizeLast=0;collapsible=0;marginBottom=0;strokeWidth=1.5;swimlaneFillColor=#FFFFFF;'
    'fontSize=12;'
)
ROW = (
    'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;'
    'spacingRight=6;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];'
    'portConstraint=eastwest;fontSize=11;fontColor=#000000;'
)
EDGE_BASE = (
    'endArrow=none;startArrow=none;edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;'
    'strokeColor=#000000;strokeWidth=1;fontSize=10;fontColor=#000000;'
)
EDGE_LABEL = (
    'edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];'
    'fontSize=11;fontStyle=1;fontColor=#000000;background=#FFFFFF;'
)
EDGE_LABEL_ITALIC = (
    'edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];'
    'fontSize=10;fontStyle=2;fontColor=#000000;'
)

# Sides for exitX/exitY/entryX/entryY
RIGHT  = (1.0, 0.5)
LEFT   = (0.0, 0.5)
TOP    = (0.5, 0.0)
BOTTOM = (0.5, 1.0)


# ============================================================================
# Entitas + posisi (sesuai layout class diagram)
# ============================================================================
ENTITIES = [
    {
        'name': 'User', 'x': 40, 'y': 40,
        'rows': [
            '- id: int {PK}',
            '- name: string',
            '- email: string {unique}',
            '- password_hash: string',
            '- role: enum {technician|manager}',
            '- is_active: boolean',
            '- created_at: timestamp',
        ],
    },
    {
        'name': 'Klien', 'x': 360, 'y': 40,
        'rows': [
            '- id: int {PK}',
            '- name: string',
            '- address: string',
            '- phone: string',
            '- email: string',
            '- user_id: int {FK}',
            '- created_at: timestamp',
        ],
    },
    {
        'name': 'Proyek', 'x': 680, 'y': 40,
        'rows': [
            '- id: int {PK}',
            '- name: string',
            '- client_id: int {FK}',
            '- user_id: int {FK}',
            '- start_date: date',
            '- end_date: date',
            '- status: enum {active|completed|on-hold}',
            '- phase: enum {survey|execution}',
            '- project_value: decimal',
            '- survey_approved: boolean',
            '- created_by: int {FK}',
            '- created_at: timestamp',
        ],
    },
    {
        'name': 'KesehatanProyek', 'x': 1020, 'y': 40,
        'rows': [
            '- project_id: int {PK, FK}',
            '- spi_value: decimal',
            '- status: enum {green|amber|red}',
            '- deviation_percent: decimal',
            '- actual_progress: decimal',
            '- planned_progress: decimal',
            '- total_tasks: int',
            '- completed_tasks: int',
            '- last_updated: timestamp',
        ],
    },
    {
        'name': 'PenugasanProyek', 'x': 360, 'y': 420,
        'rows': [
            '- project_id: int {PK, FK}',
            '- user_id: int {PK, FK}',
            '- assigned_at: timestamp',
        ],
    },
    {
        'name': 'Tugas', 'x': 680, 'y': 470,
        'rows': [
            '- id: int {PK}',
            '- project_id: int {FK}',
            '- name: string',
            '- assigned_to: int {FK}',
            '- status: enum {to_do|working_on_it|done}',
            '- due_date: date',
            '- sort_order: int',
            '- created_by: int {FK}',
            '- created_at: timestamp',
            '- updated_at: timestamp',
        ],
    },
    {
        'name': 'BuktiTugas', 'x': 1020, 'y': 420,
        'rows': [
            '- id: int {PK}',
            '- task_id: int {FK}',
            '- file_path: string',
            '- file_name: string',
            '- file_type: enum',
            '- file_size: int',
            '- uploaded_by: int {FK}',
            '- uploaded_at: timestamp',
        ],
    },
    {
        'name': 'Eskalasi', 'x': 1020, 'y': 750,
        'rows': [
            '- id: int {PK}',
            '- task_id: int {FK}',
            '- reported_by: int {FK}',
            '- title: string',
            '- description: string',
            '- priority: enum {low|medium|high}',
            '- status: enum {open|handled|closed}',
            '- created_at: timestamp',
        ],
    },
]

# (source, target, exit_side(x,y), entry_side(x,y), src_card, tgt_card, label, dashed)
# Sides spread di Y berbeda untuk hindari penumpukan edge.
RELATIONS = [
    # User -> Klien: User.right -> Klien.left
    ('User',            'Klien',           (1.0, 0.30), (0.0, 0.30), '1', 'M', None,       False),
    # Klien -> Proyek: Klien.right -> Proyek.left (atas)
    ('Klien',           'Proyek',          (1.0, 0.30), (0.0, 0.15), '1', 'M', None,       False),
    # Proyek -> KesehatanProyek: Proyek.right -> KesehatanProyek.left
    ('Proyek',          'KesehatanProyek', (1.0, 0.50), (0.0, 0.50), '1', '1', None,       False),
    # User -> PenugasanProyek: User.bottom turun -> PenugasanProyek.left
    ('User',            'PenugasanProyek', (1.0, 0.85), (0.0, 0.50), '1', 'M', None,       False),
    # Proyek -> PenugasanProyek: Proyek.bottom -> PenugasanProyek.right (naik dari Proyek bawah)
    ('Proyek',          'PenugasanProyek', (0.10, 1.0), (1.0, 0.50), '1', 'M', None,       False),
    # Proyek -> Tugas: vertical
    ('Proyek',          'Tugas',           (0.50, 1.0), (0.50, 0.0), '1', 'M', None,       False),
    # User -> Tugas: dashed assignee, dari User.bottom ke Tugas.left
    ('User',            'Tugas',           (0.50, 1.0), (0.0, 0.50), '1', 'M', 'assignee', True),
    # Tugas -> BuktiTugas: Tugas.right -> BuktiTugas.left (atas)
    ('Tugas',           'BuktiTugas',      (1.0, 0.20), (0.0, 0.60), '1', 'M', None,       False),
    # Tugas -> Eskalasi: Tugas.right -> Eskalasi.left
    ('Tugas',           'Eskalasi',        (1.0, 0.80), (0.0, 0.50), '1', 'M', None,       False),
]


# ============================================================================
# XML builder
# ============================================================================
def build():
    cells = ['<mxCell id="0" />', '<mxCell id="1" parent="0" />']
    eid = {}
    counter = [0]

    def nxt():
        counter[0] += 1
        return f'e{counter[0]}'

    def esc(s):
        return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    for ent in ENTITIES:
        nrows = len(ent['rows'])
        h = HEADER + nrows * ROW_H
        gid = nxt()
        eid[ent['name']] = gid
        cells.append(
            f'<mxCell id="{gid}" value="{ent["name"]}" style="{SWIMLANE}" vertex="1" parent="1">'
            f'<mxGeometry x="{ent["x"]}" y="{ent["y"]}" width="{W}" height="{h}" as="geometry" /></mxCell>'
        )
        for i, txt in enumerate(ent['rows']):
            rid = nxt()
            y = HEADER + i * ROW_H
            cells.append(
                f'<mxCell id="{rid}" value="{esc(txt)}" style="{ROW}" vertex="1" parent="{gid}">'
                f'<mxGeometry y="{y}" width="{W}" height="{ROW_H}" as="geometry" /></mxCell>'
            )

    for src, tgt, exit_, entry, sc, tc, label, dashed in RELATIONS:
        sid, tid = eid[src], eid[tgt]
        ex, ey = exit_
        nx, ny = entry
        dash = 'dashed=1;' if dashed else ''
        style = (
            f'{EDGE_BASE}'
            f'exitX={ex};exitY={ey};exitDx=0;exitDy=0;'
            f'entryX={nx};entryY={ny};entryDx=0;entryDy=0;{dash}'
        )
        rid = nxt()
        cells.append(
            f'<mxCell id="{rid}" edge="1" parent="1" source="{sid}" target="{tid}" '
            f'style="{style}"><mxGeometry relative="1" as="geometry" /></mxCell>'
        )
        # Kardinalitas via relative position pada edge (-0.85 = dekat source,
        # 0.85 = dekat target). Dengan exit/entry eksplisit, label sit di luar
        # boundary entity.
        l1 = nxt()
        cells.append(
            f'<mxCell id="{l1}" value="{sc}" style="{EDGE_LABEL}" vertex="1" connectable="0" parent="{rid}">'
            f'<mxGeometry x="-0.85" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>'
        )
        l2 = nxt()
        cells.append(
            f'<mxCell id="{l2}" value="{tc}" style="{EDGE_LABEL}" vertex="1" connectable="0" parent="{rid}">'
            f'<mxGeometry x="0.85" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>'
        )
        if label:
            l3 = nxt()
            cells.append(
                f'<mxCell id="{l3}" value="{label}" style="{EDGE_LABEL_ITALIC}" vertex="1" connectable="0" parent="{rid}">'
                f'<mxGeometry x="0" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>'
            )

    body = '\n        '.join(cells)
    return f'''<mxfile host="app.diagrams.net">
  <diagram name="ERD Sistem" id="erd_shi_new">
    <mxGraphModel dx="1422" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''


if __name__ == '__main__':
    out = 'drawio/erd_new.drawio'
    with open(out, 'w', encoding='utf-8') as f:
        f.write(build())
    print(f'[OK] {out}  ({len(ENTITIES)} entitas, {len(RELATIONS)} relasi)')
