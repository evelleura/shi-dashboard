"""Regenerate CD_SISTEM and UC_SISTEM cleanly to match Gambar 4.14 and 4.3."""

from pathlib import Path

BASE = Path(__file__).parent

# ============================================================================
# CD_SISTEM - Gambar 4.14: 8 classes, simple connections
# Classes: User, Client, Project, ProjectAssignment, ProjectHealth, Task, TaskEvidence, Escalation
# ============================================================================

CLASSES = {
    "User": {
        "x": 40, "y": 40, "w": 200,
        "attrs": [
            "- id: int {PK}",
            "- name: string",
            "- email: string {unique}",
            "- password_hash: string",
            "- role: enum (technician/manager/admin)",
            "- is_active: boolean",
            "- created_at: timestamp",
        ],
        "methods": [
            "+ login(email, password): boolean",
            "+ logout(): void",
            "+ hasRole(role): boolean",
        ],
    },
    "Client": {
        "x": 320, "y": 40, "w": 200,
        "attrs": [
            "- id: int {PK}",
            "- name: string",
            "- address: string",
            "- phone: string",
            "- email: string",
            "- created_at: timestamp",
        ],
        "methods": [
            "+ create(data): Client",
            "+ update(data): void",
            "+ delete(): void",
        ],
    },
    "Project": {
        "x": 600, "y": 40, "w": 220,
        "attrs": [
            "- id: int {PK}",
            "- name: string",
            "- client_id: int {FK}",
            "- start_date: date",
            "- end_date: date",
            "- status: enum (active/completed/on-hold)",
            "- phase: enum (survey/execution)",
            "- project_value: decimal",
            "- survey_approved: boolean",
            "- created_by: int {FK}",
            "- created_at: timestamp",
        ],
        "methods": [
            "+ create(data): Project",
            "+ approveSurvey(): void",
            "+ calculateSPI(): float",
            "+ assignTechnician(user): void",
            "+ getHealth(): ProjectHealth",
        ],
    },
    "ProjectHealth": {
        "x": 900, "y": 40, "w": 230,
        "attrs": [
            "- project_id: int {PK, FK}",
            "- spi_value: decimal",
            "- status: enum (green/amber/red)",
            "- deviation_percent: decimal",
            "- actual_progress: decimal",
            "- planned_progress: decimal",
            "- total_tasks: int",
            "- completed_tasks: int",
            "- last_updated: timestamp",
        ],
        "methods": [
            "+ recalculate(): void",
            "+ getStatus(): HealthStatus",
            "+ computePlannedValue(): decimal",
            "+ sortByUrgency(): Project[]",
            "+ computeEarnedValue(): decimal",
        ],
    },
    "ProjectAssignment": {
        "x": 320, "y": 400, "w": 220,
        "attrs": [
            "- project_id: int {PK, FK}",
            "- user_id: int {PK, FK}",
            "- assigned_at: timestamp",
        ],
        "methods": [
            "+ assign(): void",
            "+ unassign(): void",
            "+ getByProject(): User[]",
        ],
    },
    "Task": {
        "x": 600, "y": 400, "w": 220,
        "attrs": [
            "- id: int {PK}",
            "- project_id: int {FK}",
            "- name: string",
            "- assigned_to: int {FK}",
            "- status: enum (to_do/working_on_it/done)",
            "- due_date: date",
            "- sort_order: int",
            "- created_by: int {FK}",
            "- created_at: timestamp",
            "- updated_at: timestamp",
        ],
        "methods": [
            "+ create(data): Task",
            "+ changeStatus(status): void",
            "+ markDone(by): void",
            "+ isOvertime(): boolean",
            "+ isOverDeadline(): boolean",
        ],
    },
    "TaskEvidence": {
        "x": 900, "y": 400, "w": 220,
        "attrs": [
            "- id: int {PK}",
            "- task_id: int {FK}",
            "- file_path: string",
            "- file_name: string",
            "- file_type: enum",
            "- file_size: int",
            "- uploaded_by: int {FK}",
            "- uploaded_at: timestamp",
        ],
        "methods": [
            "+ upload(file): TaskEvidence",
            "+ download(): File",
            "+ delete(): void",
        ],
    },
    "Escalation": {
        "x": 900, "y": 720, "w": 220,
        "attrs": [
            "- id: int {PK}",
            "- project_id: int {FK}",
            "- task_id: int {FK}",
            "- reported_by: int {FK}",
            "- title: string",
            "- description: string",
            "- priority: enum (low/medium/high)",
            "- status: enum (open/handled/closed)",
            "- created_at: timestamp",
        ],
        "methods": [
            "+ create(): Escalation",
            "+ resolve(): void",
            "+ sendInstructions(msg): void",
        ],
    },
}

# Relations: (source, target, src_card, tgt_card, label, exits_hint)
# exits_hint = exit/entry side fixes for routing to avoid overlapping class bodies
RELATIONS = [
    ("Client", "Project", "1", "*", "memiliki",
        "exitX=1;exitY=0.5;entryX=0;entryY=0.5;"),
    ("User", "ProjectAssignment", "1", "*", "",
        "exitX=0.3;exitY=1;entryX=0.3;entryY=0;"),
    ("Project", "ProjectAssignment", "1", "*", "",
        "exitX=0.2;exitY=1;entryX=1;entryY=0.3;"),
    ("Project", "ProjectHealth", "1", "1", "memiliki",
        "exitX=1;exitY=0.5;entryX=0;entryY=0.5;"),
    ("Project", "Task", "1", "*", "memiliki",
        "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"),
    ("Task", "TaskEvidence", "1", "*", "memiliki",
        "exitX=1;exitY=0.5;entryX=0;entryY=0.5;"),
    ("Project", "Escalation", "1", "*", "",
        "exitX=0.8;exitY=1;entryX=0.5;entryY=0;"),
    ("Task", "Escalation", "1", "*", "",
        "exitX=1;exitY=0.8;entryX=0;entryY=0.5;"),
    ("User", "Escalation", "1", "*", "melaporkan",
        "exitX=0.5;exitY=1;entryX=0.5;entryY=1;"),
    ("User", "Task", "1", "*", "ditugaskan",
        "exitX=0.3;exitY=1;entryX=0.3;entryY=1;"),
]

def class_cell(name, cfg):
    """Render a UML class box matching reference 4.14:
    blue header band (#DAE8FC fill, #6C8EBF border) + white body."""
    title_h = 28
    attr_h = 18
    method_h = 18
    sep = 6
    attrs_h = len(cfg["attrs"]) * attr_h
    methods_h = len(cfg["methods"]) * method_h
    total_h = title_h + attrs_h + sep + methods_h + sep
    x, y, w = cfg["x"], cfg["y"], cfg["w"]
    BORDER = "#6C8EBF"
    HEADER_FILL = "#DAE8FC"

    cells = []
    # outer container (white body, blue border)
    cells.append(f'<mxCell id="cls_{name}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor={BORDER};strokeWidth=1.5;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{total_h}" as="geometry"/></mxCell>')
    # title header band (blue fill)
    cells.append(f'<mxCell id="cls_{name}_hdr" value="{name}" style="rounded=0;whiteSpace=wrap;html=1;fillColor={HEADER_FILL};strokeColor={BORDER};strokeWidth=1;fontStyle=1;fontSize=12;align=center;verticalAlign=middle;fontColor=#000000;" vertex="1" parent="cls_{name}"><mxGeometry x="0" y="0" width="{w}" height="{title_h}" as="geometry"/></mxCell>')
    # attribute lines
    for i, a in enumerate(cfg["attrs"]):
        ay = title_h + i*attr_h
        cells.append(f'<mxCell id="cls_{name}_a{i}" value="{a}" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;fontSize=10;fontColor=#000000;" vertex="1" parent="cls_{name}"><mxGeometry x="0" y="{ay}" width="{w}" height="{attr_h}" as="geometry"/></mxCell>')
    # divider line between attrs and methods
    div_y2 = title_h + attrs_h + sep//2
    cells.append(f'<mxCell id="cls_{name}_div2" value="" style="endArrow=none;html=1;strokeColor={BORDER};strokeWidth=1;" edge="1" parent="cls_{name}"><mxGeometry relative="1" as="geometry"><mxPoint x="0" y="{div_y2}" as="sourcePoint"/><mxPoint x="{w}" y="{div_y2}" as="targetPoint"/></mxGeometry></mxCell>')
    # methods
    for i, m in enumerate(cfg["methods"]):
        my = title_h + attrs_h + sep + i*method_h
        cells.append(f'<mxCell id="cls_{name}_m{i}" value="{m}" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;fontSize=10;fontColor=#000000;" vertex="1" parent="cls_{name}"><mxGeometry x="0" y="{my}" width="{w}" height="{method_h}" as="geometry"/></mxCell>')
    return cells

def rel_edge(idx, src, tgt, sc, tc, label, exits=""):
    eid = f"rel_{idx}"
    style = ("endArrow=open;endFill=0;html=1;strokeColor=#000000;strokeWidth=1.2;"
             "edgeStyle=orthogonalEdgeStyle;rounded=0;jettySize=auto;orthogonalLoop=1;"
             "labelBackgroundColor=#FFFFFF;") + exits
    return [
        f'<mxCell id="{eid}" value="{label}" style="{style}fontSize=10;" edge="1" parent="1" source="cls_{src}" target="cls_{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>',
        f'<mxCell id="{eid}_s" value="{sc}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;fontSize=10;labelBackgroundColor=#FFFFFF;" connectable="0" vertex="1" parent="{eid}"><mxGeometry x="-0.85" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>',
        f'<mxCell id="{eid}_t" value="{tc}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;fontSize=10;labelBackgroundColor=#FFFFFF;" connectable="0" vertex="1" parent="{eid}"><mxGeometry x="0.85" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>',
    ]

def gen_cd_sistem():
    cells = []
    for name, cfg in CLASSES.items():
        cells.extend(class_cell(name, cfg))
    for i, rel in enumerate(RELATIONS):
        s, t, sc, tc, lbl = rel[0], rel[1], rel[2], rel[3], rel[4]
        exits = rel[5] if len(rel) > 5 else ""
        cells.extend(rel_edge(i, s, t, sc, tc, lbl, exits))
    body = "        " + "\n        ".join(cells)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-13T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="cd_sistem" name="Class Diagram Sistem">
    <mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="1100" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''


# ============================================================================
# UC_SISTEM - Gambar 4.3: 2 actors (Teknisi, Manajer), Login centre, use cases
# ============================================================================

def gen_uc_sistem():
    cells = []
    cells.append('<mxCell id="sys" value="Use Case Dashboard Daily Report Proyek PT SHI Berbasis Web" style="rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fontSize=11;fontStyle=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;spacingTop=4;" vertex="1" parent="1"><mxGeometry x="100" y="40" width="860" height="660" as="geometry"/></mxCell>')

    # Actors
    cells.append('<mxCell id="a_tek" value="TEKNISI" style="shape=umlActor;verticalLabelPosition=bottom;labelPosition=center;verticalAlign=top;html=1;fontSize=11;fontStyle=1;fillColor=#FFFFFF;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="35" y="370" width="40" height="80" as="geometry"/></mxCell>')
    cells.append('<mxCell id="a_man" value="MANAJER" style="shape=umlActor;verticalLabelPosition=bottom;labelPosition=center;verticalAlign=top;html=1;fontSize=11;fontStyle=1;fillColor=#FFFFFF;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="985" y="200" width="40" height="80" as="geometry"/></mxCell>')

    # Central Login
    cells.append('<mxCell id="uc_login" value="Login" style="ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="480" y="380" width="120" height="50" as="geometry"/></mxCell>')

    # Teknisi use cases (left)
    tek_ucs = [
        ("uc_t_dash", "Tinjau dashboard performa", 130, 330),
        ("uc_t_riwayat", "Melihat riwayat proyek", 320, 330),
        ("uc_t_detail", "Lihat detail tugas &amp; proyek", 130, 405),
        ("uc_t_daily", "Mengisi daily report", 130, 470),
        ("uc_t_rdaily", "Lihat riwayat daily report", 320, 470),
        ("uc_t_esk", "Mengajukan eskalasi/&#10;kendala lapangan", 130, 540),
    ]
    for uid, lbl, x, y in tek_ucs:
        cells.append(f'<mxCell id="{uid}" value="{lbl}" style="ellipse;whiteSpace=wrap;html=1;fontSize=10;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="160" height="55" as="geometry"/></mxCell>')

    # Manajer use cases (right)
    man_ucs = [
        ("uc_m_dash", "Tinjau dashboard proyek", 750, 130),
        ("uc_m_klien", "Menghapus data pelanggan", 540, 165),
        ("uc_m_proyek", "Kelola data proyek", 750, 200),
        ("uc_m_detail", "Lihat detail dan&#10;progres proyek", 540, 230),
        ("uc_m_tek", "Kelola penugasan teknisi", 540, 305),
        ("uc_m_daily", "Kelola daily report", 750, 280),
        ("uc_m_esk", "Menindaklanjuti eskalasi", 750, 360),
    ]
    for uid, lbl, x, y in man_ucs:
        cells.append(f'<mxCell id="{uid}" value="{lbl}" style="ellipse;whiteSpace=wrap;html=1;fontSize=10;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="160" height="55" as="geometry"/></mxCell>')

    # Actor-UC associations (solid lines)
    def assoc(eid, src, tgt):
        return f'<mxCell id="{eid}" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1;" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>'

    # Teknisi connects to its UCs
    for i, uid in enumerate(["uc_t_dash","uc_t_detail","uc_t_daily","uc_t_esk"]):
        cells.append(assoc(f"e_t{i}", "a_tek", uid))
    # Manajer connects to its UCs
    for i, uid in enumerate(["uc_m_dash","uc_m_proyek","uc_m_daily","uc_m_tek","uc_m_esk","uc_m_detail","uc_m_klien"]):
        cells.append(assoc(f"e_m{i}", "a_man", uid))

    # <<include>> from Tek UCs to Login (html=0 so XML decode renders as plain text)
    def include(eid, src, tgt, lbl="&lt;&lt;include&gt;&gt;"):
        return f'<mxCell id="{eid}" value="{lbl}" style="endArrow=open;endFill=0;dashed=1;html=0;strokeColor=#000000;strokeWidth=1;fontSize=12;fontStyle=0;labelBackgroundColor=#FFFFFF;align=center;verticalAlign=middle;" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>'

    cells.append(include("inc_t1","uc_t_dash","uc_login"))
    cells.append(include("inc_t2","uc_t_detail","uc_login"))
    cells.append(include("inc_t3","uc_t_daily","uc_login"))
    cells.append(include("inc_t4","uc_t_esk","uc_login"))
    cells.append(include("inc_m1","uc_m_dash","uc_login"))
    cells.append(include("inc_m2","uc_m_proyek","uc_login"))
    cells.append(include("inc_m3","uc_m_daily","uc_login"))
    cells.append(include("inc_m4","uc_m_tek","uc_login"))
    cells.append(include("inc_m5","uc_m_esk","uc_login"))

    # <<extend>> relations
    cells.append(include("ext_t1","uc_t_riwayat","uc_t_detail","&lt;&lt;extend&gt;&gt;"))
    cells.append(include("ext_t2","uc_t_rdaily","uc_t_daily","&lt;&lt;extend&gt;&gt;"))
    cells.append(include("ext_m1","uc_m_detail","uc_m_proyek","&lt;&lt;extend&gt;&gt;"))
    # <<exclude>> manajer hapus pelanggan
    cells.append(include("exc_m1","uc_m_klien","uc_m_proyek","&lt;&lt;exclude&gt;&gt;"))

    body = "        " + "\n        ".join(cells)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-13T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="uc_sistem" name="Use Case Diagram Sistem">
    <mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="760" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''


if __name__ == "__main__":
    (BASE/"Class/CD_SISTEM.drawio").write_text(gen_cd_sistem(), encoding="utf-8")
    print("wrote Class/CD_SISTEM.drawio")
    (BASE/"Use Case/UC_SISTEM.drawio").write_text(gen_uc_sistem(), encoding="utf-8")
    print("wrote Use Case/UC_SISTEM.drawio")
