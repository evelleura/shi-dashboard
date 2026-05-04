"""Generator for class diagrams using proper drawio UML class shape (swimlane + stack)."""
import os, sys

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# === Style fragments per STANDARD.md ===
S_CLASS = ("swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
           "horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;"
           "resizeLast=0;collapsible=0;marginBottom=0;"
           "fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;swimlaneFillColor=#FFFFFF;"
           "fontSize=12;fontColor=#000000;")
S_ROW = ("text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;"
         "spacingLeft=6;spacingRight=6;overflow=hidden;rotatable=0;"
         "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
         "fontSize=11;fontColor=#000000;")
S_SEP = ("line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;"
         "spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;"
         "labelPosition=right;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
         "strokeColor=#000000;")
S_CAPTION = ("text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];"
             "autosize=1;strokeColor=none;fillColor=none;fontSize=11;fontStyle=2;"
             "fontColor=#000000;")
S_ASSOC = "endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_ASSOC_DASH = S_ASSOC + "dashed=1;"
S_AGGR = "endArrow=diamondThin;endFill=0;endSize=14;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_COMP = "endArrow=diamondThin;endFill=1;endSize=14;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_LBL = "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;fontColor=#000000;"
S_LBL_ROLE = S_LBL + "fontStyle=2;"

ROW_H = 20
HEADER_H = 28
SEP_H = 10


def x_attr(s):
    """Escape XML attr value."""
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;").replace("'", "&apos;"))


def cls(cid, name, attrs, methods, x, y, w):
    """Generate a class as swimlane + child rows + separator + method rows."""
    h = HEADER_H + len(attrs) * ROW_H + SEP_H + len(methods) * ROW_H
    out = []
    out.append(f'<mxCell id="{cid}" value="{x_attr(name)}" style="{S_CLASS}" vertex="1" parent="1">')
    out.append(f'  <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />')
    out.append('</mxCell>')
    yo = HEADER_H
    for i, a in enumerate(attrs):
        out.append(f'<mxCell id="{cid}_a{i}" value="{x_attr(a)}" style="{S_ROW}" vertex="1" parent="{cid}">')
        out.append(f'  <mxGeometry y="{yo}" width="{w}" height="{ROW_H}" as="geometry" />')
        out.append('</mxCell>')
        yo += ROW_H
    out.append(f'<mxCell id="{cid}_sep" value="" style="{S_SEP}" vertex="1" parent="{cid}">')
    out.append(f'  <mxGeometry y="{yo}" width="{w}" height="{SEP_H}" as="geometry" />')
    out.append('</mxCell>')
    yo += SEP_H
    for i, m in enumerate(methods):
        out.append(f'<mxCell id="{cid}_m{i}" value="{x_attr(m)}" style="{S_ROW}" vertex="1" parent="{cid}">')
        out.append(f'  <mxGeometry y="{yo}" width="{w}" height="{ROW_H}" as="geometry" />')
        out.append('</mxCell>')
        yo += ROW_H
    return "\n        ".join(out), h


def edge(eid, src, tgt, style, ms, mt, role=None,
         exit_xy=None, entry_xy=None, points=None):
    """Generate an edge cell with multiplicity labels."""
    s = style
    if exit_xy:
        s += f"exitX={exit_xy[0]};exitY={exit_xy[1]};exitDx=0;exitDy=0;"
    if entry_xy:
        s += f"entryX={entry_xy[0]};entryY={entry_xy[1]};entryDx=0;entryDy=0;"
    out = []
    out.append(f'<mxCell id="{eid}" style="{s}" edge="1" parent="1" source="{src}" target="{tgt}">')
    if points:
        pts = "".join(f'<mxPoint x="{p[0]}" y="{p[1]}" />' for p in points)
        out.append(f'  <mxGeometry relative="1" as="geometry"><Array as="points">{pts}</Array></mxGeometry>')
    else:
        out.append('  <mxGeometry relative="1" as="geometry" />')
    out.append('</mxCell>')
    out.append(f'<mxCell id="{eid}_lms" value="{x_attr(ms)}" style="{S_LBL}" connectable="0" vertex="1" parent="{eid}">')
    out.append(f'  <mxGeometry x="-0.85" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry>')
    out.append('</mxCell>')
    out.append(f'<mxCell id="{eid}_lmt" value="{x_attr(mt)}" style="{S_LBL}" connectable="0" vertex="1" parent="{eid}">')
    out.append(f'  <mxGeometry x="0.85" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry>')
    out.append('</mxCell>')
    if role:
        out.append(f'<mxCell id="{eid}_lr" value="{x_attr(role)}" style="{S_LBL_ROLE}" connectable="0" vertex="1" parent="{eid}">')
        out.append(f'  <mxGeometry relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry>')
        out.append('</mxCell>')
    return "\n        ".join(out)


def caption(text, x, y, w=600):
    val = f"<i>{text}</i>"
    return (f'<mxCell id="caption" value="{x_attr(val)}" style="{S_CAPTION}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="30" as="geometry" />\n'
            f'        </mxCell>')


def diagram(name, page_w, page_h, body):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-04T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="{name}" name="{name}">
    <mxGraphModel dx="{page_w}" dy="{page_h}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{page_w}" pageHeight="{page_h}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''


# === Class definitions ===
USER_FULL = (
    "User",
    ["- id: int {PK}", "- name: string", "- email: string {unique}",
     "- role: enum", "- password_hash: string", "- is_active: boolean",
     "- created_at: timestamp"],
    ["+ login(email, password): User", "+ logout(): void", "+ register(data): User",
     "+ authenticate(token): User", "+ changeRole(role): void",
     "+ deactivate(): void", "+ list(filter): User[]"],
)

USER_REF = (
    "User",
    ["- id: int {PK}", "- name: string", "- role: enum"],
    ["+ authenticate(): User"],
)

CLIENT_FULL = (
    "Client",
    ["- id: int {PK}", "- name: string", "- address: string", "- phone: string",
     "- email: string", "- notes: string", "- latitude: float", "- longitude: float",
     "- photo_path: string", "- created_by: int {FK}", "- created_at: timestamp",
     "- updated_at: timestamp"],
    ["+ create(data): Client", "+ update(data): void", "+ delete(): void",
     "+ search(query): Client[]", "+ uploadPhoto(file): void", "+ getProjects(): Project[]"],
)

CLIENT_REF = (
    "Client",
    ["- id: int {PK}", "- name: string", "- address: string"],
    ["+ create(): Client"],
)

PROJECT_FULL = (
    "Project",
    ["- id: int {PK}", "- project_code: string {unique}", "- name: string",
     "- description: string", "- client_id: int {FK}", "- start_date: date",
     "- end_date: date", "- duration: int", "- status: enum", "- phase: enum",
     "- category: enum", "- project_value: decimal", "- survey_approved: boolean",
     "- survey_approved_by: int {FK}", "- survey_approved_at: timestamp",
     "- target_description: string", "- created_by: int {FK}", "- created_at: timestamp",
     "- updated_at: timestamp"],
    ["+ create(data): Project", "+ update(data): void", "+ delete(): void",
     "+ approveSurvey(by): void", "+ assignTechnician(user): void",
     "+ unassignTechnician(user): void", "+ changePhase(phase): void",
     "+ calculateSPI(): float", "+ getHealth(): ProjectHealth"],
)

PROJECT_REF = (
    "Project",
    ["- id: int {PK}", "- name: string", "- phase: enum", "- status: enum"],
    ["+ getTasks(): Task[]"],
)

ASSIGNMENT = (
    "ProjectAssignment",
    ["- project_id: int {PK,FK}", "- user_id: int {PK,FK}", "- assigned_at: timestamp"],
    ["+ assign(): void", "+ unassign(): void", "+ getByProject(): User[]"],
)

HEALTH = (
    "ProjectHealth",
    ["- project_id: int {PK,FK}", "- spi_value: decimal", "- status: enum",
     "- deviation_percent: decimal", "- actual_progress: decimal",
     "- planned_progress: decimal", "- total_tasks: int", "- completed_tasks: int",
     "- working_tasks: int", "- overtime_tasks: int", "- overdue_tasks: int",
     "- last_updated: timestamp"],
    ["+ recalculate(): void", "+ getStatus(): HealthStatus",
     "+ computePlannedValue(): decimal"],
)

TASK_FULL = (
    "Task",
    ["- id: int {PK}", "- project_id: int {FK}", "- name: string",
     "- description: string", "- assigned_to: int {FK}", "- status: enum",
     "- due_date: date", "- timeline_start: date", "- timeline_end: date",
     "- notes: string", "- budget: decimal", "- sort_order: int",
     "- is_survey_task: boolean", "- timer_started_at: timestamp",
     "- time_spent_seconds: int", "- is_tracking: boolean",
     "- estimated_hours: decimal", "- depends_on: int {FK}",
     "- created_by: int {FK}", "- created_at: timestamp"],
    ["+ create(data): Task", "+ update(data): void", "+ delete(): void",
     "+ changeStatus(status): void", "+ assignTo(user): void",
     "+ startTimer(): void", "+ pauseTimer(): void", "+ resumeTimer(): void",
     "+ markDone(): void", "+ isOvertime(): boolean", "+ isOverDeadline(): boolean"],
)

TASK_REF = (
    "Task",
    ["- id: int {PK}", "- name: string", "- status: enum"],
    ["+ getEvidence(): TaskEvidence[]"],
)

EVIDENCE = (
    "TaskEvidence",
    ["- id: int {PK}", "- task_id: int {FK}", "- file_path: string",
     "- file_name: string", "- file_type: enum", "- file_size: int",
     "- description: string", "- uploaded_by: int {FK}", "- uploaded_at: timestamp"],
    ["+ upload(file): TaskEvidence", "+ download(): File", "+ delete(): void",
     "+ getByTask(): TaskEvidence[]"],
)

ACTIVITY = (
    "TaskActivity",
    ["- id: int {PK}", "- task_id: int {FK}", "- user_id: int {FK}",
     "- message: string", "- activity_type: enum", "- file_path: string",
     "- file_name: string", "- file_size: int", "- created_at: timestamp"],
    ["+ log(message, type): void", "+ getJournal(): TaskActivity[]",
     "+ logArrival(): void", "+ logComplete(): void"],
)

MATERIAL = (
    "Material",
    ["- id: int {PK}", "- project_id: int {FK}", "- name: string",
     "- quantity: decimal", "- unit: string", "- unit_price: decimal",
     "- total_price: decimal {derived}", "- notes: string", "- created_at: timestamp"],
    ["+ create(data): Material", "+ update(data): void", "+ delete(): void",
     "+ calculateTotal(): decimal", "+ getByProject(): Material[]"],
)

BUDGET = (
    "BudgetItem",
    ["- id: int {PK}", "- project_id: int {FK}", "- category: string",
     "- description: string", "- amount: decimal", "- is_actual: boolean",
     "- created_at: timestamp"],
    ["+ create(data): BudgetItem", "+ update(data): void", "+ delete(): void",
     "+ getTotalPlanned(): decimal", "+ getTotalActual(): decimal",
     "+ getDeviation(): decimal"],
)

DAILYREPORT = (
    "DailyReport",
    ["- id: int {PK}", "- project_id: int {FK}", "- task_id: int {FK}",
     "- report_date: date", "- progress_percentage: decimal",
     "- constraints: string", "- created_by: int {FK}", "- created_at: timestamp"],
    ["+ submit(data): DailyReport", "+ getHistory(): DailyReport[]",
     "+ getByDate(date): DailyReport[]"],
)

ESCALATION = (
    "Escalation",
    ["- id: int {PK}", "- task_id: int {FK}", "- project_id: int {FK}",
     "- reported_by: int {FK}", "- title: string", "- description: string",
     "- status: enum", "- priority: enum", "- file_path: string",
     "- resolved_by: int {FK}", "- resolved_at: timestamp",
     "- resolution_notes: string", "- action_request: enum",
     "- action_request_status: enum", "- created_at: timestamp",
     "- updated_at: timestamp"],
    ["+ open(data): Escalation", "+ updateStatus(status): void",
     "+ assignAction(action, note): void", "+ approveAction(): void",
     "+ rejectAction(): void", "+ resolve(notes, by): void",
     "+ getSummary(): EscalationSummary"],
)

ESCALATION_UPDATE = (
    "EscalationUpdate",
    ["- id: int {PK}", "- escalation_id: int {FK}", "- author_id: int {FK}",
     "- message: string", "- created_at: timestamp"],
    ["+ post(message): void", "+ getThread(): EscalationUpdate[]"],
)

AUDITLOG = (
    "AuditLog",
    ["- id: int {PK}", "- entity_type: string", "- entity_id: int",
     "- entity_name: string", "- action: string", "- field_name: string",
     "- old_value: string", "- new_value: string", "- changed_by: int {FK}",
     "- changed_by_name: string", "- created_at: timestamp"],
    ["+ record(entity, action): void", "+ query(filter): AuditLog[]",
     "+ getByEntity(type, id): AuditLog[]"],
)


def emit_diagram(filename, title_indo, page_w, page_h, classes_pos, edges):
    body = []
    for cid, cdef, x, y, w in classes_pos:
        name, attrs, methods = cdef
        c, _ = cls(cid, name, attrs, methods, x, y, w)
        body.append(c)
    for e in edges:
        body.append(edge(*e[:6], **e[6]) if len(e) > 6 else edge(*e))
    cap_x = (page_w - 600) // 2
    cap_y = page_h - 60
    body.append(caption(f"Gambar 4.X {title_indo}.", cap_x, cap_y))
    out = diagram(filename, page_w, page_h, "\n        ".join(body))
    path = os.path.join(OUT_DIR, filename + ".drawio")
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"wrote {path}")


# === CD_MANAJEMEN_USER ===
emit_diagram(
    "CD_MANAJEMEN_USER", "Class Diagram Manajemen User",
    900, 600,
    [
        ("cls_user", USER_FULL, 60, 60, 280),
        ("cls_audit", AUDITLOG, 500, 60, 320),
    ],
    [
        ("rel_user_audit", "cls_user", "cls_audit", S_ASSOC_DASH, "1", "*", {
            "role": "changed_by",
            "exit_xy": (1, 0.5), "entry_xy": (0, 0.5),
        }),
    ],
)

# === CD_MANAJEMEN_KLIEN ===
emit_diagram(
    "CD_MANAJEMEN_KLIEN", "Class Diagram Manajemen Klien",
    900, 700,
    [
        ("cls_user", USER_REF, 60, 80, 240),
        ("cls_client", CLIENT_FULL, 500, 80, 320),
    ],
    [
        ("rel_user_client", "cls_user", "cls_client", S_ASSOC_DASH, "1", "*", {
            "role": "created_by",
            "exit_xy": (1, 0.5), "entry_xy": (0, 0.2),
        }),
    ],
)

# === CD_MANAJEMEN_PROYEK ===
emit_diagram(
    "CD_MANAJEMEN_PROYEK", "Class Diagram Manajemen Proyek",
    1300, 1100,
    [
        ("cls_user", USER_REF, 60, 60, 240),
        ("cls_client", CLIENT_REF, 980, 60, 240),
        ("cls_project", PROJECT_FULL, 480, 320, 340),
        ("cls_assignment", ASSIGNMENT, 60, 440, 280),
        ("cls_health", HEALTH, 920, 360, 320),
    ],
    [
        ("rel_user_assignment", "cls_user", "cls_assignment", S_ASSOC, "1", "*", {
            "exit_xy": (0.5, 1), "entry_xy": (0.5, 0),
        }),
        ("rel_project_assignment", "cls_project", "cls_assignment", S_ASSOC, "1", "*", {
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.5),
        }),
        ("rel_client_project", "cls_client", "cls_project", S_AGGR, "0..1", "1..*", {
            "exit_xy": (0.5, 1), "entry_xy": (1, 0.15),
        }),
        ("rel_project_health", "cls_health", "cls_project", S_COMP, "1", "1", {
            "exit_xy": (0, 0.3), "entry_xy": (1, 0.3),
        }),
    ],
)

# === CD_MANAJEMEN_TUGAS ===
emit_diagram(
    "CD_MANAJEMEN_TUGAS", "Class Diagram Manajemen Tugas",
    1400, 1200,
    [
        ("cls_project", PROJECT_REF, 60, 80, 240),
        ("cls_user", USER_REF, 1080, 80, 240),
        ("cls_task", TASK_FULL, 520, 360, 340),
        ("cls_evidence", EVIDENCE, 60, 540, 320),
        ("cls_activity", ACTIVITY, 1000, 540, 320),
    ],
    [
        ("rel_project_task", "cls_task", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.3, 0), "entry_xy": (0.5, 1),
            "points": [(610, 320), (180, 320)],
        }),
        ("rel_user_task", "cls_user", "cls_task", S_ASSOC_DASH, "1", "*", {
            "role": "assigned_to",
            "exit_xy": (0.5, 1), "entry_xy": (0.7, 0),
            "points": [(1200, 320), (758, 320)],
        }),
        ("rel_task_evidence", "cls_evidence", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (1, 0.4), "entry_xy": (0, 0.4),
        }),
        ("rel_task_activity", "cls_activity", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.4),
        }),
    ],
)

# === CD_BUDGET_MATERIAL ===
emit_diagram(
    "CD_BUDGET_MATERIAL", "Class Diagram Budget dan Material",
    1300, 1000,
    [
        ("cls_project", PROJECT_REF, 500, 60, 280),
        ("cls_material", MATERIAL, 60, 380, 300),
        ("cls_budget", BUDGET, 500, 380, 300),
        ("cls_dailyreport", DAILYREPORT, 940, 380, 300),
    ],
    [
        ("rel_project_material", "cls_material", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.2, 1),
            "points": [(210, 320), (556, 320)],
        }),
        ("rel_project_budget", "cls_budget", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_project_dailyreport", "cls_dailyreport", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.8, 1),
            "points": [(1090, 320), (724, 320)],
        }),
    ],
)

# === CD_ESKALASI ===
emit_diagram(
    "CD_ESKALASI", "Class Diagram Pengelolaan Eskalasi",
    1300, 1100,
    [
        ("cls_task", TASK_REF, 60, 60, 240),
        ("cls_project", PROJECT_REF, 460, 60, 240),
        ("cls_user", USER_REF, 980, 60, 240),
        ("cls_escalation", ESCALATION, 380, 360, 360),
        ("cls_escalation_update", ESCALATION_UPDATE, 880, 480, 320),
    ],
    [
        ("rel_task_escalation", "cls_escalation", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0.2, 0), "entry_xy": (0.5, 1),
            "points": [(452, 320), (180, 320)],
        }),
        ("rel_project_escalation", "cls_escalation", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_user_escalation", "cls_user", "cls_escalation", S_ASSOC_DASH, "1", "*", {
            "role": "reported_by / resolved_by",
            "exit_xy": (0.5, 1), "entry_xy": (0.8, 0),
            "points": [(1100, 320), (668, 320)],
        }),
        ("rel_escalation_update", "cls_escalation_update", "cls_escalation", S_COMP, "*", "1", {
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.4),
        }),
    ],
)

# === CD_SISTEM (overview) ===
emit_diagram(
    "CD_SISTEM", "Class Diagram Sistem Dashboard PT Smart Home Inovasi",
    1700, 1400,
    [
        ("cls_user", USER_FULL, 60, 60, 260),
        ("cls_client", CLIENT_FULL, 360, 60, 280),
        ("cls_project", PROJECT_FULL, 680, 60, 320),
        ("cls_task", TASK_FULL, 1040, 60, 320),
        ("cls_evidence", EVIDENCE, 1400, 60, 280),
        ("cls_audit", AUDITLOG, 60, 520, 280),
        ("cls_assignment", ASSIGNMENT, 360, 460, 280),
        ("cls_health", HEALTH, 680, 600, 280),
        ("cls_activity", ACTIVITY, 1040, 540, 280),
        ("cls_escalation", ESCALATION, 1380, 460, 300),
        ("cls_material", MATERIAL, 360, 760, 280),
        ("cls_budget", BUDGET, 680, 940, 280),
        ("cls_dailyreport", DAILYREPORT, 1040, 940, 280),
    ],
    [
        ("rel_client_project", "cls_client", "cls_project", S_AGGR, "0..1", "1..*", {
            "exit_xy": (1, 0.3), "entry_xy": (0, 0.3),
        }),
        ("rel_project_task", "cls_task", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0, 0.3), "entry_xy": (1, 0.3),
        }),
        ("rel_task_evidence", "cls_evidence", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0, 0.3), "entry_xy": (1, 0.3),
        }),
        ("rel_user_assignment", "cls_user", "cls_assignment", S_ASSOC, "1", "*", {
            "exit_xy": (1, 0.6), "entry_xy": (0, 0.5),
        }),
        ("rel_project_assignment", "cls_project", "cls_assignment", S_ASSOC, "1", "*", {
            "exit_xy": (0, 0.6), "entry_xy": (1, 0.5),
        }),
        ("rel_project_health", "cls_health", "cls_project", S_COMP, "1", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_task_activity", "cls_activity", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_task_escalation", "cls_escalation", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0.2, 0), "entry_xy": (1, 0.85),
        }),
        ("rel_project_material", "cls_material", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0, 0.85),
            "points": [(500, 720), (660, 720)],
        }),
        ("rel_project_budget", "cls_budget", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.15, 1),
        }),
        ("rel_project_dailyreport", "cls_dailyreport", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
            "points": [(1180, 920), (840, 920)],
        }),
        ("rel_user_audit", "cls_user", "cls_audit", S_ASSOC_DASH, "1", "*", {
            "role": "changed_by",
            "exit_xy": (0.5, 1), "entry_xy": (0.5, 0),
        }),
    ],
)

print("done")
