# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Generate RELASI_DATA.drawio + SKEMA_FISIK.drawio for shi-crm (13 tables).
MySQL Workbench / dbSchema visual style. Schema source: frontend/database/schema.sql.

Output:
  RELASI_DATA.drawio  — emphasis on relationships (FK arrows + legend)
  SKEMA_FISIK.drawio  — same schema, minimalist (no legend)
"""
from __future__ import annotations
import os

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Style constants ---
HDR = "#4D7EA8"
HDR_STR = "#2C5F88"
ROW_PK = "#EDF2FA"
ROW_ALT = "#F6F9FD"
ROW_WH = "#FFFFFF"
ROW_STR = "#C4D3DC"
TW = 320
IW = 28
RH = 20
SZ = 28


def table_style() -> str:
    return (
        f"shape=table;startSize={SZ};container=1;collapsible=0;"
        "childLayout=tableLayout;fixedRows=1;rowLines=0;"
        "fontStyle=1;align=left;resizeLast=1;"
        f"fillColor={HDR};strokeColor={HDR_STR};fontColor=#FFFFFF;fontSize=10;html=1;"
    )


def row_style(fill: str) -> str:
    return (
        "shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;"
        f"fillColor={fill};strokeColor={ROW_STR};"
        "collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];"
        "portConstraint=eastwest;fontSize=9;top=0;left=0;right=0;bottom=1;"
    )


def icon_style(kind: str) -> str:
    base = (
        "shape=partialRectangle;connectable=0;fillColor=none;"
        "top=0;left=0;bottom=0;right=0;fontStyle=0;overflow=hidden;"
        "fontSize=10;align=center;verticalAlign=middle;"
    )
    if kind == "FK":
        return base + "fontStyle=3;fontSize=8;fontColor=#0066AA;"
    return base


def txt_style(*, bold: bool = False, italic: bool = False, color: str = "#333333") -> str:
    fs = (1 if bold else 0) | (2 if italic else 0)
    return (
        "shape=partialRectangle;connectable=0;fillColor=none;"
        "top=0;left=0;bottom=0;right=0;overflow=hidden;"
        f"fontStyle={fs};fontSize=9;align=left;verticalAlign=middle;"
        f"spacingLeft=4;fontColor={color};"
    )


def field_style(kind: str) -> str:
    if kind in ("PK", "PKFK"):
        return txt_style(bold=True)
    if kind == "FK":
        return txt_style(italic=True, color="#0066AA")
    return txt_style()


def icon(kind: str) -> str:
    if kind in ("PK", "PKFK"):
        return "PK"
    if kind == "FK":
        return "FK"
    if kind == "NN":
        return "*"
    return "o"


# --- Cell builder ---
def cell(cid: str, value: str, style: str, *, vertex: bool = True, parent: str = "1",
        x=None, y=None, w=None, h=None, edge: bool = False, source=None, target=None) -> str:
    geo = ""
    if x is not None:
        gy = y if y is not None else 0
        geo = f'<mxGeometry x="{x}" y="{gy}" width="{w}" height="{h}" as="geometry"/>'
    elif y is not None and w is not None:
        geo = f'<mxGeometry y="{y}" width="{w}" height="{h}" as="geometry"/>'
    elif w is not None:
        geo = (f'<mxGeometry width="{w}" height="{h}" as="geometry">'
               f'<mxRectangle width="{w}" height="{h}" as="alternateBounds"/></mxGeometry>')
    vx = 'vertex="1"' if vertex else ""
    ed = 'edge="1"' if edge else ""
    src = f'source="{source}"' if source else ""
    tgt = f'target="{target}"' if target else ""
    val = (value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))
    return (f'<mxCell id="{cid}" value="{val}" style="{style}" {vx} {ed} '
            f'{src} {tgt} parent="{parent}">{geo}</mxCell>')


def make_table(cells: list, tid: str, label: str, x: int, y: int,
               fields: list[tuple[str, str]]) -> list[str]:
    h = SZ + len(fields) * RH
    cells.append(cell(tid, f"  {label}", table_style(), x=x, y=y, w=TW, h=h))
    row_ids = []
    for i, (kind, txt) in enumerate(fields):
        ry = SZ + i * RH
        fill = ROW_PK if kind in ("PK", "PKFK") else (ROW_ALT if i % 2 == 0 else ROW_WH)
        rid = f"{tid}_r{i+1}"
        lid = f"{tid}_l{i+1}"
        cid = f"{tid}_c{i+1}"
        cells.append(cell(rid, "", row_style(fill), x=None, y=ry, w=TW, h=RH, parent=tid))
        cells.append(cell(lid, icon(kind), icon_style(kind), w=IW, h=RH, parent=rid))
        cells.append(cell(cid, txt, field_style(kind), x=IW, y=None, w=TW - IW, h=RH, parent=rid))
        row_ids.append(rid)
    return row_ids


def make_edge(eid: str, src: str, tgt: str, color: str, *,
              ex: float = 1, ey: float = 0.5, nx: float = 0, ny: float = 0.5,
              one_to_one: bool = False) -> str:
    end_arrow = "ERone" if one_to_one else "ERmany"
    style = (
        "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;"
        f"exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
        f"entryX={nx};entryY={ny};entryDx=0;entryDy=0;"
        f"strokeColor={color};strokeWidth=1.5;html=1;endArrow={end_arrow};startArrow=ERone;"
        "endFill=0;startFill=0;"
    )
    return (f'<mxCell id="{eid}" value="" style="{style}" edge="1" '
            f'source="{src}" target="{tgt}" parent="1">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>')


# --- Schema definition (all 13 tables) ---
# (key, label, x, y, fields, ref_dict {col_index: row_id_alias for FK targets})
def build_tables(cells: list) -> dict[str, list[str]]:
    refs = {}

    refs["users"] = make_table(cells, "T_users", "users", 30, 30, [
        ("PK", "id : SERIAL NOT NULL"),
        ("NN", "name : VARCHAR(255) NOT NULL"),
        ("NN", "email : VARCHAR(255) UNIQUE NOT NULL"),
        ("NN", "role : VARCHAR(50) NOT NULL"),
        ("NN", "password_hash : VARCHAR(255) NOT NULL"),
        ("N",  "created_at : TIMESTAMP"),
    ])

    refs["clients"] = make_table(cells, "T_clients", "clients", 30, 220, [
        ("PK", "id : SERIAL NOT NULL"),
        ("NN", "name : VARCHAR(255) NOT NULL"),
        ("N",  "address : TEXT"),
        ("N",  "phone : VARCHAR(50)"),
        ("N",  "email : VARCHAR(255)"),
        ("N",  "notes : TEXT"),
        ("N",  "latitude : DECIMAL(10,7)"),
        ("N",  "longitude : DECIMAL(10,7)"),
        ("N",  "photo_path : VARCHAR(1000)"),
        ("FK", "created_by : INT [-> users.id]"),
        ("N",  "created_at : TIMESTAMP"),
        ("N",  "updated_at : TIMESTAMP"),
    ])

    refs["projects"] = make_table(cells, "T_projects", "projects", 410, 30, [
        ("PK", "id : SERIAL NOT NULL"),
        ("NN", "project_code : VARCHAR(12) UNIQUE"),
        ("NN", "name : VARCHAR(255) NOT NULL"),
        ("N",  "description : TEXT"),
        ("FK", "client_id : INT [-> clients.id]"),
        ("NN", "start_date : DATE"),
        ("NN", "end_date : DATE"),
        ("N",  "duration : INT GENERATED"),
        ("NN", "status : VARCHAR(50)"),
        ("NN", "phase : VARCHAR(50)"),
        ("NN", "category : VARCHAR(50)"),
        ("N",  "project_value : DECIMAL(15,2)"),
        ("N",  "survey_approved : BOOLEAN"),
        ("FK", "survey_approved_by : INT [-> users.id]"),
        ("N",  "survey_approved_at : TIMESTAMP"),
        ("N",  "target_description : TEXT"),
        ("FK", "created_by : INT [-> users.id]"),
        ("N",  "created_at : TIMESTAMP"),
        ("N",  "updated_at : TIMESTAMP"),
    ])

    refs["project_assignments"] = make_table(cells, "T_pa", "project_assignments", 410, 510, [
        ("PKFK", "project_id : INT [PK, FK -> projects.id]"),
        ("PKFK", "user_id : INT [PK, FK -> users.id]"),
        ("N",    "assigned_at : TIMESTAMP"),
    ])

    refs["project_health"] = make_table(cells, "T_ph", "project_health", 410, 640, [
        ("PKFK", "project_id : INT [PK, FK -> projects.id]"),
        ("N",    "spi_value : DECIMAL(6,4)"),
        ("N",    "status : VARCHAR(50)"),
        ("N",    "deviation_percent : DECIMAL(6,2)"),
        ("N",    "actual_progress : DECIMAL(5,2)"),
        ("N",    "planned_progress : DECIMAL(5,2)"),
        ("N",    "total_tasks : INT"),
        ("N",    "completed_tasks : INT"),
        ("N",    "working_tasks : INT"),
        ("N",    "overtime_tasks : INT"),
        ("N",    "overdue_tasks : INT"),
        ("N",    "last_updated : TIMESTAMP"),
    ])

    refs["tasks"] = make_table(cells, "T_tasks", "tasks", 800, 30, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "project_id : INT [-> projects.id]"),
        ("NN", "name : VARCHAR(500) NOT NULL"),
        ("N",  "description : TEXT"),
        ("FK", "assigned_to : INT [-> users.id]"),
        ("NN", "status : VARCHAR(50) NOT NULL"),
        ("N",  "due_date : DATE"),
        ("N",  "timeline_start : DATE"),
        ("N",  "timeline_end : DATE"),
        ("N",  "notes : TEXT"),
        ("N",  "budget : DECIMAL(15,2)"),
        ("N",  "sort_order : INT"),
        ("N",  "is_survey_task : BOOLEAN"),
        ("N",  "timer_started_at : TIMESTAMP"),
        ("N",  "time_spent_seconds : INT"),
        ("N",  "is_tracking : BOOLEAN"),
        ("N",  "estimated_hours : DECIMAL(5,1)"),
        ("FK", "depends_on : INT [-> tasks.id]"),
        ("N",  "status_changed_at : TIMESTAMP"),
        ("FK", "created_by : INT [-> users.id]"),
        ("N",  "created_at : TIMESTAMP"),
        ("N",  "updated_at : TIMESTAMP"),
    ])

    refs["task_evidence"] = make_table(cells, "T_te", "task_evidence", 1190, 30, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "task_id : INT [-> tasks.id]"),
        ("NN", "file_path : VARCHAR(1000)"),
        ("NN", "file_name : VARCHAR(500)"),
        ("NN", "file_type : VARCHAR(50)"),
        ("N",  "file_size : INT"),
        ("N",  "description : TEXT"),
        ("FK", "uploaded_by : INT [-> users.id]"),
        ("N",  "uploaded_at : TIMESTAMP"),
    ])

    refs["task_activities"] = make_table(cells, "T_ta", "task_activities", 1190, 245, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "task_id : INT [-> tasks.id]"),
        ("FK", "user_id : INT [-> users.id]"),
        ("NN", "message : TEXT NOT NULL"),
        ("NN", "activity_type : VARCHAR(50)"),
        ("N",  "file_path : VARCHAR(1000)"),
        ("N",  "file_name : VARCHAR(500)"),
        ("N",  "file_type : VARCHAR(50)"),
        ("N",  "file_size : INT"),
        ("N",  "created_at : TIMESTAMP"),
    ])

    refs["escalations"] = make_table(cells, "T_esc", "escalations", 1190, 480, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "task_id : INT [-> tasks.id]"),
        ("FK", "project_id : INT [-> projects.id]"),
        ("FK", "reported_by : INT [-> users.id]"),
        ("NN", "title : VARCHAR(500)"),
        ("NN", "description : TEXT"),
        ("NN", "status : VARCHAR(50)"),
        ("NN", "priority : VARCHAR(50)"),
        ("N",  "file_path : VARCHAR(1000)"),
        ("N",  "file_name : VARCHAR(500)"),
        ("N",  "file_type : VARCHAR(50)"),
        ("N",  "file_size : INT"),
        ("FK", "resolved_by : INT [-> users.id]"),
        ("N",  "resolved_at : TIMESTAMP"),
        ("N",  "resolution_notes : TEXT"),
        ("N",  "created_at : TIMESTAMP"),
        ("N",  "updated_at : TIMESTAMP"),
    ])

    refs["materials"] = make_table(cells, "T_mat", "materials", 1580, 30, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "project_id : INT [-> projects.id]"),
        ("NN", "name : VARCHAR(500) NOT NULL"),
        ("N",  "quantity : DECIMAL(10,2)"),
        ("N",  "unit : VARCHAR(50)"),
        ("N",  "unit_price : DECIMAL(15,2)"),
        ("N",  "total_price : DECIMAL(15,2) GEN"),
        ("N",  "notes : TEXT"),
        ("N",  "created_at : TIMESTAMP"),
    ])

    refs["budget_items"] = make_table(cells, "T_bud", "budget_items", 1580, 245, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "project_id : INT [-> projects.id]"),
        ("NN", "category : VARCHAR(255)"),
        ("N",  "description : TEXT"),
        ("N",  "amount : DECIMAL(15,2)"),
        ("N",  "is_actual : BOOLEAN"),
        ("N",  "created_at : TIMESTAMP"),
    ])

    refs["daily_reports"] = make_table(cells, "T_dr", "daily_reports", 1580, 410, [
        ("PK", "id : SERIAL NOT NULL"),
        ("FK", "project_id : INT [-> projects.id]"),
        ("FK", "task_id : INT [-> tasks.id]"),
        ("NN", "report_date : DATE"),
        ("NN", "progress_percentage : DECIMAL(5,2)"),
        ("N",  "constraints : TEXT"),
        ("FK", "created_by : INT [-> users.id]"),
        ("N",  "created_at : TIMESTAMP"),
    ])

    refs["audit_log"] = make_table(cells, "T_al", "audit_log", 1580, 600, [
        ("PK", "id : SERIAL NOT NULL"),
        ("NN", "entity_type : VARCHAR(50)"),
        ("NN", "entity_id : INT"),
        ("N",  "entity_name : VARCHAR(255)"),
        ("NN", "action : VARCHAR(50)"),
        ("N",  "field_name : VARCHAR(100)"),
        ("N",  "old_value : TEXT"),
        ("N",  "new_value : TEXT"),
        ("FK", "changed_by : INT [-> users.id]"),
        ("N",  "changed_by_name : VARCHAR(255)"),
        ("N",  "created_at : TIMESTAMP"),
    ])

    return refs


def build_edges(refs: dict[str, list[str]]) -> list[str]:
    """Build FK edges. Each: (label, src_col_idx_alias, tgt_col_idx_alias, color, opts)."""
    edges = []
    e_id = [0]

    def add(src_table: str, src_idx: int, tgt_table: str, tgt_idx: int, color: str,
            **kwargs):
        e_id[0] += 1
        eid = f"E{e_id[0]}"
        src_row = refs[src_table][src_idx]
        tgt_row = refs[tgt_table][tgt_idx]
        edges.append(make_edge(eid, src_row, tgt_row, color, **kwargs))

    # users.id (idx 0) -> clients.created_by (idx 9)
    add("users", 0, "clients", 9, "#34A853")
    # clients.id (0) -> projects.client_id (4)
    add("clients", 0, "projects", 4, "#FF6D00")
    # users.id -> projects.created_by (16)
    add("users", 0, "projects", 16, "#4285F4")
    # users.id -> projects.survey_approved_by (13)
    add("users", 0, "projects", 13, "#1A73E8")
    # projects.id -> project_assignments.project_id (0)
    add("projects", 0, "project_assignments", 0, "#9C27B0")
    # users.id -> project_assignments.user_id (1)
    add("users", 0, "project_assignments", 1, "#7B1FA2")
    # projects.id -> project_health.project_id (0) (1:1)
    add("projects", 0, "project_health", 0, "#EA4335", one_to_one=True)
    # projects.id -> tasks.project_id (1)
    add("projects", 0, "tasks", 1, "#00ACC1")
    # users.id -> tasks.assigned_to (4)
    add("users", 0, "tasks", 4, "#0288D1")
    # users.id -> tasks.created_by (19)
    add("users", 0, "tasks", 19, "#0277BD")
    # tasks.id -> tasks.depends_on (17) [self-ref]
    add("tasks", 0, "tasks", 17, "#5D4037")
    # tasks.id -> task_evidence.task_id (1)
    add("tasks", 0, "task_evidence", 1, "#0F9D58")
    # users.id -> task_evidence.uploaded_by (7)
    add("users", 0, "task_evidence", 7, "#795548")
    # tasks.id -> task_activities.task_id (1)
    add("tasks", 0, "task_activities", 1, "#388E3C")
    # users.id -> task_activities.user_id (2)
    add("users", 0, "task_activities", 2, "#2E7D32")
    # tasks.id -> escalations.task_id (1)
    add("tasks", 0, "escalations", 1, "#C62828")
    # projects.id -> escalations.project_id (2)
    add("projects", 0, "escalations", 2, "#AD1457")
    # users.id -> escalations.reported_by (3)
    add("users", 0, "escalations", 3, "#EF6C00")
    # users.id -> escalations.resolved_by (12)
    add("users", 0, "escalations", 12, "#E65100")
    # projects.id -> materials.project_id (1)
    add("projects", 0, "materials", 1, "#F57C00")
    # projects.id -> budget_items.project_id (1)
    add("projects", 0, "budget_items", 1, "#FF8F00")
    # projects.id -> daily_reports.project_id (1)
    add("projects", 0, "daily_reports", 1, "#7CB342")
    # tasks.id -> daily_reports.task_id (2)
    add("tasks", 0, "daily_reports", 2, "#558B2F")
    # users.id -> daily_reports.created_by (6)
    add("users", 0, "daily_reports", 6, "#33691E")
    # users.id -> audit_log.changed_by (8)
    add("users", 0, "audit_log", 8, "#37474F")

    return edges


def build_legend(x: int, y: int) -> list[str]:
    return [
        f'<mxCell id="Leg0" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFD;'
        f'strokeColor=#C4D3DC;strokeWidth=1;" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="290" height="160" as="geometry"/></mxCell>',
        f'<mxCell id="Leg1" value="Keterangan" style="text;html=1;align=left;fontSize=10;'
        f'fontStyle=1;fontColor=#2C5F88;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+10}" width="260" height="18" as="geometry"/></mxCell>',
        f'<mxCell id="Leg2" value="PK  Primary Key" style="text;html=1;align=left;fontSize=9;'
        f'fontColor=#333333;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+32}" width="260" height="16" as="geometry"/></mxCell>',
        f'<mxCell id="Leg3" value="FK  Foreign Key (italic blue)" style="text;html=1;align=left;'
        f'fontSize=9;fontColor=#0066AA;fontStyle=2;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+50}" width="260" height="16" as="geometry"/></mxCell>',
        f'<mxCell id="Leg4" value="*   NOT NULL" style="text;html=1;align=left;fontSize=9;'
        f'fontColor=#333333;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+68}" width="260" height="16" as="geometry"/></mxCell>',
        f'<mxCell id="Leg5" value="o   Nullable" style="text;html=1;align=left;fontSize=9;'
        f'fontColor=#333333;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+86}" width="260" height="16" as="geometry"/></mxCell>',
        f'<mxCell id="Leg6" value=">> Satu ke Banyak (1:N)" style="text;html=1;align=left;'
        f'fontSize=9;fontColor=#333333;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+104}" width="260" height="16" as="geometry"/></mxCell>',
        f'<mxCell id="Leg7" value="-- Satu ke Satu (1:1) [project_health]" style="text;'
        f'html=1;align=left;fontSize=9;fontColor=#333333;" vertex="1" parent="1">'
        f'<mxGeometry x="{x+12}" y="{y+122}" width="260" height="16" as="geometry"/></mxCell>',
    ]


def render(diagram_id: str, name: str, page_w: int, page_h: int,
           tables_xml: list[str], edges_xml: list[str], legend_xml: list[str]) -> str:
    header = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-10T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="{diagram_id}" name="{name}">
    <mxGraphModel dx="2200" dy="1400" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{page_w}" pageHeight="{page_h}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
'''
    footer = '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''
    body = "\n".join("        " + c for c in (tables_xml + edges_xml + legend_xml))
    return header + body + "\n" + footer


def main() -> None:
    PAGE_W, PAGE_H = 2000, 1100
    cells: list[str] = []
    refs = build_tables(cells)
    edges = build_edges(refs)

    # RELASI_DATA — with legend
    legend = build_legend(30, 800)
    relasi_xml = render(
        "relasi_antar_data", "Perancangan Relasi Antar Data",
        PAGE_W, PAGE_H, cells, edges, legend,
    )
    relasi_path = os.path.join(OUT_DIR, "RELASI_DATA.drawio")
    with open(relasi_path, "w", encoding="utf-8") as f:
        f.write(relasi_xml)
    print(f"OK {relasi_path}")
    print(f"  tables: {len(refs)} | cells: {len(cells)} | edges: {len(edges)}")

    # SKEMA_FISIK — same content, no legend (minimalist)
    skema_xml = render(
        "skema_fisik", "Skema Fisik Basis Data",
        PAGE_W, PAGE_H, cells, edges, [],
    )
    skema_path = os.path.join(OUT_DIR, "SKEMA_FISIK.drawio")
    with open(skema_path, "w", encoding="utf-8") as f:
        f.write(skema_xml)
    print(f"OK {skema_path}")


if __name__ == "__main__":
    main()
