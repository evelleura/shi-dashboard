"""Generator for class diagrams using proper drawio UML class shape (swimlane + stack)."""
import os, sys

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# === Style fragments per STANDARD.md ===
S_CLASS = ("swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
           "horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;"
           "resizeLast=0;collapsible=0;marginBottom=0;"
           "fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;swimlaneFillColor=#FFFFFF;"
           "fontSize=12;fontColor=#000000;")
# Abstract class: italic+bold class name (fontStyle=3)
S_CLASS_ABSTRACT = ("swimlane;fontStyle=3;align=center;verticalAlign=top;childLayout=stackLayout;"
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
S_SUBTITLE = ("text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];"
              "autosize=1;strokeColor=none;fillColor=none;fontSize=10;fontStyle=2;"
              "fontColor=#000000;")

# --- Edge styles ---
# G3 fix: dashed dependency uses endArrow=open (UML 2.x dependency, open V arrowhead)
S_ASSOC     = "endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_ASSOC_DASH = ("endArrow=open;endFill=0;endSize=12;dashed=1;startArrow=none;"
                "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
                "strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;")
# G6: directional association (navigable, open arrowhead, no fill)
S_ASSOC_DIR = ("endArrow=open;endFill=0;endSize=12;startArrow=none;html=1;rounded=0;"
               "strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;")
S_AGGR  = "endArrow=diamondThin;endFill=0;endSize=14;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
S_COMP  = "endArrow=diamondThin;endFill=1;endSize=14;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
# G1: generalization — hollow triangle, solid line, points FROM subclass TO superclass
S_GENERAL = ("endArrow=block;endFill=0;endSize=16;startArrow=none;"
             "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
             "exitX=0.5;exitY=0;entryX=0.5;entryY=1;"
             "strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;")
# G2: note anchor — dashed line, no arrows
S_NOTE_ANCHOR = ("endArrow=none;dashed=1;startArrow=none;edgeStyle=none;"
                 "rounded=0;html=1;strokeColor=#000000;strokeWidth=1;")

# G2: UML Note shape (light yellow, black stroke per STANDARD.md, left-aligned text)
S_NOTE = ("shape=note;size=14;whiteSpace=wrap;html=1;fontSize=11;fontColor=#000000;"
          "fillColor=#FFF8DC;strokeColor=#000000;strokeWidth=1;"
          "align=left;verticalAlign=top;spacingLeft=6;spacingRight=6;spacingTop=4;")

S_LBL      = "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;fontColor=#000000;"
S_LBL_ROLE = S_LBL + "fontStyle=2;"

ROW_H    = 20
HEADER_H = 28
SEP_H    = 10


def x_attr(s):
    """Escape XML attr value."""
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;").replace("'", "&apos;"))


def cls(cid, name, attrs, methods, x, y, w, abstract=False):
    """Generate a class as swimlane + child rows + separator + method rows."""
    style = S_CLASS_ABSTRACT if abstract else S_CLASS
    h = HEADER_H + len(attrs) * ROW_H + SEP_H + len(methods) * ROW_H
    out = []
    out.append(f'<mxCell id="{cid}" value="{x_attr(name)}" style="{style}" vertex="1" parent="1">')
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


def enum_cls(cid, name, literals, x, y, w=200):
    """G4: Generate an enumeration class box.
    First row = <<enumeration>> stereotype (italic, centered).
    Remaining rows = literal values.
    No method section (enumerations have no methods).
    """
    # stereotype row + separator + literals
    h = HEADER_H + ROW_H + SEP_H + len(literals) * ROW_H
    out = []
    out.append(f'<mxCell id="{cid}" value="{x_attr(name)}" style="{S_CLASS}" vertex="1" parent="1">')
    out.append(f'  <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />')
    out.append('</mxCell>')
    yo = HEADER_H
    # stereotype row — italic, centered
    stereo_style = ("text;strokeColor=none;fillColor=none;align=center;verticalAlign=top;"
                    "spacingLeft=6;spacingRight=6;overflow=hidden;rotatable=0;"
                    "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
                    "fontSize=11;fontColor=#000000;fontStyle=2;")
    out.append(f'<mxCell id="{cid}_stereo" value="&lt;&lt;enumeration&gt;&gt;" style="{stereo_style}" vertex="1" parent="{cid}">')
    out.append(f'  <mxGeometry y="{yo}" width="{w}" height="{ROW_H}" as="geometry" />')
    out.append('</mxCell>')
    yo += ROW_H
    out.append(f'<mxCell id="{cid}_sep" value="" style="{S_SEP}" vertex="1" parent="{cid}">')
    out.append(f'  <mxGeometry y="{yo}" width="{w}" height="{SEP_H}" as="geometry" />')
    out.append('</mxCell>')
    yo += SEP_H
    for i, lit in enumerate(literals):
        out.append(f'<mxCell id="{cid}_l{i}" value="{x_attr(lit)}" style="{S_ROW}" vertex="1" parent="{cid}">')
        out.append(f'  <mxGeometry y="{yo}" width="{w}" height="{ROW_H}" as="geometry" />')
        out.append('</mxCell>')
        yo += ROW_H
    return "\n        ".join(out), h


def note(nid, x, y, w, h, text):
    """G2: Generate a UML Note shape cell."""
    out = []
    out.append(f'<mxCell id="{nid}" value="{x_attr(text)}" style="{S_NOTE}" vertex="1" parent="1">')
    out.append(f'  <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />')
    out.append('</mxCell>')
    return "\n        ".join(out)


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


def note_anchor(eid, src, tgt):
    """G2: Dashed anchor line from note to class, no arrowheads, no labels."""
    out = []
    out.append(f'<mxCell id="{eid}" style="{S_NOTE_ANCHOR}" edge="1" parent="1" source="{src}" target="{tgt}">')
    out.append('  <mxGeometry relative="1" as="geometry" />')
    out.append('</mxCell>')
    return "\n        ".join(out)


def general_edge(eid, subclass_id, superclass_id, exit_xy=None, entry_xy=None):
    """G1: Generalization edge — subclass to superclass, hollow triangle at superclass end."""
    s = S_GENERAL
    if exit_xy:
        s = s.replace("exitX=0.5;exitY=0;", f"exitX={exit_xy[0]};exitY={exit_xy[1]};")
    if entry_xy:
        s = s.replace("entryX=0.5;entryY=1;", f"entryX={entry_xy[0]};entryY={entry_xy[1]};")
    out = []
    out.append(f'<mxCell id="{eid}" style="{s}" edge="1" parent="1" source="{subclass_id}" target="{superclass_id}">')
    out.append('  <mxGeometry relative="1" as="geometry" />')
    out.append('</mxCell>')
    return "\n        ".join(out)


def caption(text, x, y, w=600):
    val = f"<i>{text}</i>"
    return (f'<mxCell id="caption" value="{x_attr(val)}" style="{S_CAPTION}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="30" as="geometry" />\n'
            f'        </mxCell>')


def subtitle(text, x, y, w=600):
    """G7: REF subset subtitle below caption in per-fitur diagrams."""
    val = f"<i>{text}</i>"
    return (f'<mxCell id="subtitle" value="{x_attr(val)}" style="{S_SUBTITLE}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="24" as="geometry" />\n'
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


def emit_diagram(filename, title_indo, page_w, page_h, classes_pos, edges,
                 notes=None, enum_classes=None, extra_edges=None,
                 ref_subtitle=False):
    """
    classes_pos: list of (cid, cdef, x, y, w) OR (cid, cdef, x, y, w, abstract)
    edges: list of edge() arg tuples
    notes: list of (nid, x, y, w, h, text) for note cells
    enum_classes: list of (cid, name, literals, x, y, w) for enum_cls cells
    extra_edges: list of raw cell strings (pre-built by note_anchor / general_edge)
    ref_subtitle: if True, add REF subset note below caption
    """
    body = []
    for item in classes_pos:
        if len(item) == 6:
            cid, cdef, x, y, w, abstract = item
        else:
            cid, cdef, x, y, w = item
            abstract = False
        name, attrs, methods = cdef
        c, _ = cls(cid, name, attrs, methods, x, y, w, abstract=abstract)
        body.append(c)
    if enum_classes:
        for item in enum_classes:
            cid, name, literals, x, y, w = item
            c, _ = enum_cls(cid, name, literals, x, y, w)
            body.append(c)
    for e in edges:
        body.append(edge(*e[:6], **e[6]) if len(e) > 6 else edge(*e))
    if extra_edges:
        for ee in extra_edges:
            body.append(ee)
    if notes:
        for n in notes:
            nid, x, y, w, h, text = n
            body.append(note(nid, x, y, w, h, text))
    cap_x = (page_w - 600) // 2
    cap_y = page_h - 60
    body.append(caption(f"Gambar 4.X {title_indo}.", cap_x, cap_y))
    if ref_subtitle:
        body.append(subtitle(
            "Atribut yang ditampilkan adalah subset relevan untuk fitur ini.",
            cap_x, cap_y + 32, 600
        ))
    out = diagram(filename, page_w, page_h, "\n        ".join(body))
    path = os.path.join(OUT_DIR, filename + ".drawio")
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"wrote {path}")


# ============================================================
# === Class definitions ===
# ============================================================

# G1 + G5: Abstract User — shared attrs, NO role attr (role = discriminator), NO RPC methods
USER_ABSTRACT = (
    "User",
    ["- id: int {PK}", "- name: string", "- email: string {unique}",
     "- password_hash: string", "- is_active: boolean", "- created_at: timestamp"],
    ["+ getFullName(): string", "+ hasRole(role): boolean"],
)

# G1: Concrete subclasses — minimal, role-specific methods only
TECHNICIAN_SUB = (
    "Technician",
    [],
    ["+ getAssignedTasks(): Task[]", "+ submitActivityLog(): void"],
)

MANAGER_SUB = (
    "Manager",
    [],
    ["+ approveSurvey(project): void", "+ markTaskDone(task): void",
     "+ viewDashboard(): Dashboard"],
)

ADMIN_SUB = (
    "Admin",
    [],
    ["+ manageUsers(): void", "+ viewAuditLog(): AuditLog[]"],
)

# G5: Full User for non-generalization diagrams — RPC methods removed
USER_FULL = (
    "User",
    ["- id: int {PK}", "- name: string", "- email: string {unique}",
     "- role: enum", "- password_hash: string", "- is_active: boolean",
     "- created_at: timestamp"],
    ["+ getFullName(): string", "+ hasRole(role): boolean",
     "+ changeRole(role): void", "+ deactivate(): void"],
)

USER_REF = (
    "User",
    ["- id: int {PK}", "- name: string", "- role: enum"],
    [],
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
    [],
)

PROJECT_FULL = (
    "Project",
    ["- id: int {PK}", "- project_code: string {unique}", "- name: string",
     "- description: string", "- client_id: int {FK}", "- start_date: date",
     "- end_date: date", "- duration: int {derived}", "- status: enum", "- phase: enum",
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
     "- estimated_hours: decimal",
     "- created_by: int {FK}", "- created_at: timestamp", "- updated_at: timestamp"],
    ["+ create(data): Task", "+ update(data): void", "+ delete(): void",
     "+ changeStatus(status): void", "+ assignTo(user): void",
     "+ startTimer(): void", "+ pauseTimer(): void", "+ resumeTimer(): void",
     "+ isOvertime(): boolean", "+ isOverDeadline(): boolean"],
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
    ["- id: int {PK}", "- project_id: int {FK}", "- task_id: int {FK, nullable}",
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
     "- resolution_notes: string", "- created_at: timestamp",
     "- updated_at: timestamp"],
    ["+ open(data): Escalation", "+ updateStatus(status): void",
     "+ resolve(notes, by): void", "+ getSummary(): EscalationSummary"],
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

# ============================================================
# === G4: Enumeration class definitions (verified from schema.sql) ===
# ============================================================

# schema.sql:14 — role IN ('technician', 'manager', 'admin')
ENUM_ROLE = ("Role", ["technician", "manager", "admin"])

# schema.sql:112 — status IN ('to_do', 'in_progress', 'working_on_it', 'review', 'done')
ENUM_TASK_STATUS = ("TaskStatus", ["to_do", "in_progress", "working_on_it", "review", "done"])

# schema.sql:62 — status IN ('active', 'completed', 'on-hold', 'cancelled')
ENUM_PROJECT_STATUS = ("ProjectStatus", ["active", "completed", "on-hold", "cancelled"])

# schema.sql:63 — phase IN ('survey', 'execution')
ENUM_PROJECT_PHASE = ("ProjectPhase", ["survey", "execution"])

# schema.sql:218 — status IN ('green', 'amber', 'red')
ENUM_HEALTH_STATUS = ("HealthStatus", ["green", "amber", "red"])

# schema.sql:270 — priority IN ('low', 'medium', 'high', 'critical')
ENUM_ESC_PRIORITY = ("EscalationPriority", ["low", "medium", "high", "critical"])

# schema.sql:269 — status IN ('open', 'in_review', 'resolved')
ENUM_ESC_STATUS = ("EscalationStatus", ["open", "in_review", "resolved"])

# schema.sql:136 — file_type IN ('photo', 'document', 'form', 'screenshot', 'other')
ENUM_EVIDENCE_TYPE = ("EvidenceFileType", ["photo", "document", "form", "screenshot", "other"])

# schema.sql:237 — activity_type IN ('arrival', 'start_work', 'pause', 'resume', 'note', 'photo', 'complete')
ENUM_ACTIVITY_TYPE = ("ActivityType", ["arrival", "start_work", "pause", "resume", "note", "photo", "complete"])

# schema.sql:64 — category IN ('instalasi','maintenance','perbaikan','upgrade','monitoring','security','networking','lainnya')
ENUM_PROJECT_CATEGORY = ("ProjectCategory", [
    "instalasi", "maintenance", "perbaikan", "upgrade",
    "monitoring", "security", "networking", "lainnya"
])


# ============================================================
# === Diagram 1: CD_MANAJEMEN_USER ===
# G1: User generalization (abstract + 3 subclasses)
# G2: UML note (manager review gate rule)
# G4: Role enum
# G5: User methods pruned
# ============================================================
emit_diagram(
    "CD_MANAJEMEN_USER", "Class Diagram Manajemen User",
    1100, 900,
    [
        # Abstract User center-top
        ("cls_user_abs", USER_ABSTRACT, 380, 60, 280, True),
        # Subclasses below
        ("cls_technician", TECHNICIAN_SUB, 60, 320, 260),
        ("cls_manager",    MANAGER_SUB,    380, 320, 260),
        ("cls_admin",      ADMIN_SUB,      700, 320, 260),
        # AuditLog right
        ("cls_audit",      AUDITLOG,       750, 60, 300),
    ],
    [
        # G6: directional assoc User->AuditLog (User is creator/changer)
        ("rel_user_audit", "cls_user_abs", "cls_audit", S_ASSOC_DIR, "1", "*", {
            "role": "changed_by",
            "exit_xy": (1, 0.5), "entry_xy": (0, 0.5),
        }),
    ],
    notes=[
        # G2: Manager review gate note
        ("note_mgr_gate", 60, 640, 340, 80,
         "Aturan otorisasi:\n"
         "  Teknisi: to_do <-> working_on_it saja.\n"
         "  Manager: satu-satunya yang dapat\n"
         "  menandai tugas sebagai 'done'."),
    ],
    enum_classes=[
        # G4: Role enum
        ("enum_role", ENUM_ROLE[0], ENUM_ROLE[1], 60, 60, 180),
    ],
    extra_edges=[
        # G1: generalization edges — subclasses -> abstract User
        general_edge("gen_tech_user",   "cls_technician", "cls_user_abs",
                     exit_xy=(0.5, 0), entry_xy=(0.2, 1)),
        general_edge("gen_mgr_user",    "cls_manager",    "cls_user_abs",
                     exit_xy=(0.5, 0), entry_xy=(0.5, 1)),
        general_edge("gen_admin_user",  "cls_admin",       "cls_user_abs",
                     exit_xy=(0.5, 0), entry_xy=(0.8, 1)),
        # G2: note anchor to Manager subclass
        note_anchor("na_mgr_gate", "note_mgr_gate", "cls_manager"),
        # G4: Role enum dependency to abstract User
        edge("rel_role_user", "enum_role", "cls_user_abs", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (1, 0.5), "entry_xy": (0, 0.5)}),
    ],
)

# ============================================================
# === Diagram 2: CD_MANAJEMEN_KLIEN ===
# G6: directional assoc (User -> Client, created_by)
# G7: REF subtitle
# ============================================================
emit_diagram(
    "CD_MANAJEMEN_KLIEN", "Class Diagram Manajemen Klien",
    900, 700,
    [
        ("cls_user",   USER_REF,    60, 80, 240),
        ("cls_client", CLIENT_FULL, 500, 80, 320),
    ],
    [
        # G6: directional — User is navigated-to from Client.created_by
        ("rel_user_client", "cls_client", "cls_user", S_ASSOC_DIR, "*", "1", {
            "role": "creator",
            "exit_xy": (0, 0.2), "entry_xy": (1, 0.5),
        }),
    ],
    ref_subtitle=True,
)

# ============================================================
# === Diagram 3: CD_MANAJEMEN_PROYEK ===
# G2: UML notes (SPI thresholds, two-phase lifecycle)
# G4: ProjectStatus, ProjectPhase, HealthStatus enums
# G6: directional assoc for created_by, survey_approved_by
# G7: REF subtitle
# ============================================================
emit_diagram(
    "CD_MANAJEMEN_PROYEK", "Class Diagram Manajemen Proyek",
    1600, 1300,
    [
        ("cls_user",       USER_REF,      60,  60, 240),
        ("cls_client",     CLIENT_REF,   1180, 60, 240),
        ("cls_project",    PROJECT_FULL,  520, 280, 340),
        ("cls_assignment", ASSIGNMENT,    60,  480, 280),
        ("cls_health",     HEALTH,       1100, 380, 300),
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
        # G6: directional — who created/approved project
        ("rel_user_project_created", "cls_project", "cls_user", S_ASSOC_DIR, "*", "1", {
            "role": "creator",
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.5),
        }),
    ],
    notes=[
        # G2: SPI thresholds + formula
        ("note_spi", 60, 800, 360, 120,
         "Aturan Status Kesehatan (SPI):\n"
         "  Hijau : SPI >= 0.95\n"
         "  Kuning: 0.85 <= SPI < 0.95\n"
         "  Merah : SPI < 0.85\n\n"
         "SPI = (selesai/total) / (hari_terpakai/total_hari)"),
        # G2: Two-phase lifecycle
        ("note_phase", 500, 800, 360, 80,
         "Siklus dua fase:\n"
         "  phase=survey -> survey_approved=true\n"
         "  -> phase=execution\n"
         "  Hanya manager dapat approve survey."),
    ],
    enum_classes=[
        # G4: enums positioned right side
        ("enum_proj_status",   ENUM_PROJECT_STATUS[0],   ENUM_PROJECT_STATUS[1],   1280, 700, 200),
        ("enum_proj_phase",    ENUM_PROJECT_PHASE[0],    ENUM_PROJECT_PHASE[1],    1280, 820, 180),
        ("enum_health_status", ENUM_HEALTH_STATUS[0],    ENUM_HEALTH_STATUS[1],    1280, 940, 180),
    ],
    extra_edges=[
        # G2: note anchors
        note_anchor("na_spi",   "note_spi",   "cls_health"),
        note_anchor("na_phase", "note_phase", "cls_project"),
        # G4: enum dependencies
        edge("rel_enum_pstatus", "enum_proj_status", "cls_project", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.5), "entry_xy": (1, 0.5)}),
        edge("rel_enum_pphase", "enum_proj_phase", "cls_project", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.5), "entry_xy": (1, 0.6)}),
        edge("rel_enum_hstatus", "enum_health_status", "cls_health", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.5), "entry_xy": (1, 0.5)}),
    ],
    ref_subtitle=True,
)

# ============================================================
# === Diagram 4: CD_MANAJEMEN_TUGAS ===
# G2: UML notes (computed states, authorization)
# G4: TaskStatus, EvidenceFileType enums
# G6: directional assoc (assigned_to, uploaded_by)
# G7: REF subtitle
# ============================================================
emit_diagram(
    "CD_MANAJEMEN_TUGAS", "Class Diagram Manajemen Tugas",
    1600, 1400,
    [
        ("cls_project",  PROJECT_REF, 60,   80, 240),
        ("cls_user",     USER_REF,   1260,  80, 240),
        ("cls_task",     TASK_FULL,   560, 380, 340),
        ("cls_evidence", EVIDENCE,    60,  600, 320),
        ("cls_activity", ACTIVITY,  1160,  600, 320),
    ],
    [
        ("rel_project_task", "cls_task", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.3, 0), "entry_xy": (0.5, 1),
            "points": [(630, 320), (180, 320)],
        }),
        # G6: directional — task assigned_to user
        ("rel_user_task", "cls_task", "cls_user", S_ASSOC_DIR, "*", "1", {
            "role": "assignee",
            "exit_xy": (0.7, 0), "entry_xy": (0.5, 1),
            "points": [(758, 320), (1380, 320)],
        }),
        ("rel_task_evidence", "cls_evidence", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (1, 0.4), "entry_xy": (0, 0.4),
        }),
        ("rel_task_activity", "cls_activity", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.4),
        }),
        # G6: directional — evidence uploaded_by user
        ("rel_user_evidence", "cls_evidence", "cls_user", S_ASSOC_DIR, "*", "1", {
            "role": "uploader",
            "exit_xy": (0.5, 0), "entry_xy": (0, 0.8),
            "points": [(220, 550), (220, 200), (1260, 200)],
        }),
    ],
    notes=[
        # G2: computed states
        ("note_computed", 60, 1050, 360, 90,
         "Status terhitung (computed):\n"
         "  Overtime     : status=working_on_it\n"
         "                 AND due_date < hari_ini\n"
         "  Over Deadline: status=to_do\n"
         "                 AND due_date < hari_ini"),
        # G2: task authorization
        ("note_auth", 500, 1050, 360, 80,
         "Otorisasi status:\n"
         "  Teknisi: to_do <-> working_on_it\n"
         "  Manager: satu-satunya yang dapat\n"
         "  menandai tugas sebagai 'done'."),
    ],
    enum_classes=[
        ("enum_task_status", ENUM_TASK_STATUS[0],   ENUM_TASK_STATUS[1],   1300, 700, 220),
        ("enum_evid_type",   ENUM_EVIDENCE_TYPE[0], ENUM_EVIDENCE_TYPE[1], 1300, 900, 220),
    ],
    extra_edges=[
        note_anchor("na_computed", "note_computed", "cls_task"),
        note_anchor("na_auth",     "note_auth",     "cls_task"),
        edge("rel_enum_tstatus", "enum_task_status", "cls_task", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.5), "entry_xy": (1, 0.3)}),
        edge("rel_enum_etype", "enum_evid_type", "cls_evidence", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.8), "entry_xy": (1, 0.3),
                "points": [(1100, 1020), (380, 1020)]}),
    ],
    ref_subtitle=True,
)

# ============================================================
# === Diagram 5: CD_BUDGET_MATERIAL ===
# G6: directional assoc (created_by on DailyReport)
# G7: REF subtitle
# ============================================================
emit_diagram(
    "CD_BUDGET_MATERIAL", "Class Diagram Budget dan Material",
    1400, 1050,
    [
        ("cls_project",     PROJECT_REF,  500,  60, 280),
        ("cls_material",    MATERIAL,      60, 400, 300),
        ("cls_budget",      BUDGET,       500, 400, 300),
        ("cls_dailyreport", DAILYREPORT,  940, 400, 300),
        ("cls_user",        USER_REF,     940,  60, 240),
    ],
    [
        ("rel_project_material", "cls_material", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.2, 1),
            "points": [(210, 340), (556, 340)],
        }),
        ("rel_project_budget", "cls_budget", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_project_dailyreport", "cls_dailyreport", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.8, 1),
            "points": [(1090, 340), (724, 340)],
        }),
        # G6: directional — daily report created_by user
        ("rel_user_report", "cls_dailyreport", "cls_user", S_ASSOC_DIR, "*", "1", {
            "role": "reporter",
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
    ],
    ref_subtitle=True,
)

# ============================================================
# === Diagram 6: CD_ESKALASI ===
# G2: note (escalation status transitions)
# G4: EscalationStatus, EscalationPriority enums
# G6: directional assoc (reported_by, resolved_by)
# G7: REF subtitle
# ============================================================
emit_diagram(
    "CD_ESKALASI", "Class Diagram Pengelolaan Eskalasi",
    1500, 1200,
    [
        ("cls_task",               TASK_REF,           60,   60, 240),
        ("cls_project",            PROJECT_REF,        460,  60, 240),
        ("cls_user",               USER_REF,          1100,  60, 240),
        ("cls_escalation",         ESCALATION,         380, 340, 360),
        ("cls_escalation_update",  ESCALATION_UPDATE,  880, 480, 320),
    ],
    [
        ("rel_task_escalation", "cls_escalation", "cls_task", S_COMP, "*", "1", {
            "exit_xy": (0.2, 0), "entry_xy": (0.5, 1),
            "points": [(452, 300), (180, 300)],
        }),
        ("rel_project_escalation", "cls_escalation", "cls_project", S_COMP, "*", "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        # G6: directional — escalation reported_by / resolved_by user
        ("rel_user_escalation_rep", "cls_escalation", "cls_user", S_ASSOC_DIR, "*", "1", {
            "role": "reporter",
            "exit_xy": (0.8, 0), "entry_xy": (0.5, 1),
            "points": [(668, 300), (1220, 300)],
        }),
        ("rel_escalation_update", "cls_escalation_update", "cls_escalation", S_COMP, "*", "1", {
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.4),
        }),
    ],
    notes=[
        # G2: escalation status flow
        ("note_esc_status", 60, 800, 360, 80,
         "Alur status eskalasi:\n"
         "  open -> in_review -> resolved\n\n"
         "Prioritas: low / medium / high / critical"),
    ],
    enum_classes=[
        ("enum_esc_status",   ENUM_ESC_STATUS[0],   ENUM_ESC_STATUS[1],   1100, 400, 200),
        ("enum_esc_priority", ENUM_ESC_PRIORITY[0], ENUM_ESC_PRIORITY[1], 1100, 580, 220),
    ],
    extra_edges=[
        note_anchor("na_esc_status", "note_esc_status", "cls_escalation"),
        edge("rel_enum_estatus", "enum_esc_status", "cls_escalation", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.5), "entry_xy": (1, 0.4)}),
        edge("rel_enum_epriority", "enum_esc_priority", "cls_escalation", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0, 0.5), "entry_xy": (1, 0.6)}),
    ],
    ref_subtitle=True,
)

# ============================================================
# === Diagram 7: CD_SISTEM (overview — all classes) ===
# G1: full User + 3 subclasses (generalization)
# G2: SPI note, computed-state note, two-phase note
# G4: all key enums
# G5: User methods pruned (using USER_ABSTRACT for generalization section)
# G6: directional assocs for all FK creator/uploader/reporter roles
# ============================================================
emit_diagram(
    "CD_SISTEM", "Class Diagram Sistem Dashboard PT Smart Home Inovasi",
    2200, 1800,
    [
        # Row 1: core entities
        ("cls_user",        USER_FULL,      60,   60, 240),
        ("cls_client",      CLIENT_FULL,   340,   60, 280),
        ("cls_project",     PROJECT_FULL,  660,   60, 320),
        ("cls_task",        TASK_FULL,    1020,   60, 300),
        ("cls_evidence",    EVIDENCE,     1360,   60, 280),
        # Row 2: supporting entities
        ("cls_audit",       AUDITLOG,       60,  580, 270),
        ("cls_assignment",  ASSIGNMENT,    360,  520, 270),
        ("cls_health",      HEALTH,        660,  660, 280),
        ("cls_activity",    ACTIVITY,     1020,  600, 270),
        ("cls_escalation",  ESCALATION,   1340,  520, 300),
        # Row 3: financial + reporting
        ("cls_material",    MATERIAL,      360,  870, 270),
        ("cls_budget",      BUDGET,        660, 1050, 270),
        ("cls_dailyreport", DAILYREPORT,  1020, 1050, 270),
        ("cls_esc_update",  ESCALATION_UPDATE, 1660, 700, 280),
        # G1: subclasses (below User)
        ("cls_technician",  TECHNICIAN_SUB,  60, 1300, 220),
        ("cls_manager",     MANAGER_SUB,    310, 1300, 220),
        ("cls_admin",       ADMIN_SUB,      560, 1300, 220),
    ],
    [
        # Structural edges (unchanged from original, reviewed for G6)
        ("rel_client_project",     "cls_client",   "cls_project",    S_AGGR,      "0..1", "1..*", {
            "exit_xy": (1, 0.3), "entry_xy": (0, 0.3),
        }),
        ("rel_project_task",       "cls_task",     "cls_project",    S_COMP,      "*",    "1", {
            "exit_xy": (0, 0.3), "entry_xy": (1, 0.3),
        }),
        ("rel_task_evidence",      "cls_evidence", "cls_task",       S_COMP,      "*",    "1", {
            "exit_xy": (0, 0.3), "entry_xy": (1, 0.3),
        }),
        ("rel_user_assignment",    "cls_user",     "cls_assignment", S_ASSOC,     "1",    "*", {
            "exit_xy": (1, 0.6), "entry_xy": (0, 0.5),
        }),
        ("rel_project_assignment", "cls_project",  "cls_assignment", S_ASSOC,     "1",    "*", {
            "exit_xy": (0, 0.6), "entry_xy": (1, 0.5),
        }),
        ("rel_project_health",     "cls_health",   "cls_project",    S_COMP,      "1",    "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_task_activity",      "cls_activity", "cls_task",       S_COMP,      "*",    "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
        }),
        ("rel_task_escalation",    "cls_escalation","cls_task",      S_COMP,      "*",    "1", {
            "exit_xy": (0.2, 0), "entry_xy": (1, 0.85),
        }),
        ("rel_project_material",   "cls_material", "cls_project",    S_COMP,      "*",    "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0, 0.85),
            "points": [(500, 820), (660, 820)],
        }),
        ("rel_project_budget",     "cls_budget",   "cls_project",    S_COMP,      "*",    "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.15, 1),
        }),
        ("rel_project_dailyreport","cls_dailyreport","cls_project",  S_COMP,      "*",    "1", {
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
            "points": [(1180, 1020), (840, 1020)],
        }),
        ("rel_esc_update",         "cls_esc_update","cls_escalation",S_COMP,      "*",    "1", {
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.4),
        }),
        # G6: directional FK associations with role labels
        ("rel_user_audit",         "cls_user",     "cls_audit",      S_ASSOC_DIR, "1",    "*", {
            "role": "changed_by",
            "exit_xy": (0.5, 1), "entry_xy": (0.5, 0),
        }),
        ("rel_user_client_created","cls_client",   "cls_user",       S_ASSOC_DIR, "*",    "1", {
            "role": "creator",
            "exit_xy": (0, 0.5), "entry_xy": (1, 0.5),
        }),
        ("rel_user_project_created","cls_project", "cls_user",       S_ASSOC_DIR, "*",    "1", {
            "role": "creator",
            "exit_xy": (0, 0.4), "entry_xy": (1, 0.4),
        }),
        ("rel_user_task_assigned", "cls_task",     "cls_user",       S_ASSOC_DIR, "*",    "1", {
            "role": "assignee",
            "exit_xy": (0, 0.5), "entry_xy": (1, 0.5),
        }),
        ("rel_user_evidence_up",   "cls_evidence", "cls_user",       S_ASSOC_DIR, "*",    "1", {
            "role": "uploader",
            "exit_xy": (0, 0.7), "entry_xy": (1, 0.7),
        }),
        ("rel_user_report",        "cls_dailyreport","cls_user",     S_ASSOC_DIR, "*",    "1", {
            "role": "reporter",
            "exit_xy": (0.5, 0), "entry_xy": (0.5, 1),
            "points": [(1180, 900), (180, 900)],
        }),
        ("rel_user_esc_rep",       "cls_escalation","cls_user",      S_ASSOC_DIR, "*",    "1", {
            "role": "reporter",
            "exit_xy": (0.5, 0), "entry_xy": (1, 0.5),
        }),
    ],
    notes=[
        # G2: SPI thresholds
        ("note_spi_sys", 800, 1350, 360, 110,
         "Aturan Status Kesehatan (SPI):\n"
         "  Hijau : SPI >= 0.95\n"
         "  Kuning: 0.85 <= SPI < 0.95\n"
         "  Merah : SPI < 0.85\n\n"
         "SPI = (selesai/total) / (hari_terpakai/total_hari)"),
        # G2: computed states
        ("note_computed_sys", 1200, 1350, 360, 90,
         "Status terhitung (computed):\n"
         "  Overtime     : status=working_on_it\n"
         "                 AND due_date < hari_ini\n"
         "  Over Deadline: status=to_do\n"
         "                 AND due_date < hari_ini"),
        # G2: two-phase lifecycle
        ("note_phase_sys", 1600, 1350, 360, 80,
         "Siklus dua fase:\n"
         "  phase=survey -> survey_approved=true\n"
         "  -> phase=execution\n"
         "  Hanya manager dapat approve survey."),
    ],
    enum_classes=[
        # G4: all key enums — bottom-right cluster
        ("enum_role_sys",        ENUM_ROLE[0],           ENUM_ROLE[1],           60,  1480, 180),
        ("enum_tstatus_sys",     ENUM_TASK_STATUS[0],    ENUM_TASK_STATUS[1],    280, 1480, 220),
        ("enum_pstatus_sys",     ENUM_PROJECT_STATUS[0], ENUM_PROJECT_STATUS[1], 540, 1480, 200),
        ("enum_pphase_sys",      ENUM_PROJECT_PHASE[0],  ENUM_PROJECT_PHASE[1],  780, 1480, 180),
        ("enum_hstatus_sys",     ENUM_HEALTH_STATUS[0],  ENUM_HEALTH_STATUS[1],  1000,1480, 180),
        ("enum_epriority_sys",   ENUM_ESC_PRIORITY[0],   ENUM_ESC_PRIORITY[1],   1220,1480, 200),
        ("enum_estatus_sys",     ENUM_ESC_STATUS[0],     ENUM_ESC_STATUS[1],     1460,1480, 200),
        ("enum_evidtype_sys",    ENUM_EVIDENCE_TYPE[0],  ENUM_EVIDENCE_TYPE[1],  1700,1480, 220),
    ],
    extra_edges=[
        # G1: generalization — User subclasses
        general_edge("gen_tech_sys",  "cls_technician", "cls_user",
                     exit_xy=(0.5, 0), entry_xy=(0.2, 1)),
        general_edge("gen_mgr_sys",   "cls_manager",    "cls_user",
                     exit_xy=(0.5, 0), entry_xy=(0.5, 1)),
        general_edge("gen_admin_sys", "cls_admin",       "cls_user",
                     exit_xy=(0.5, 0), entry_xy=(0.8, 1)),
        # G2: note anchors
        note_anchor("na_spi_sys",      "note_spi_sys",      "cls_health"),
        note_anchor("na_computed_sys", "note_computed_sys", "cls_task"),
        note_anchor("na_phase_sys",    "note_phase_sys",    "cls_project"),
        # G4: enum dependencies (select key ones — avoid visual clutter)
        edge("rel_role_user_sys",    "enum_role_sys",      "cls_user",       S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0.5, 0), "entry_xy": (0.5, 1)}),
        edge("rel_tstatus_task_sys", "enum_tstatus_sys",   "cls_task",       S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0.5, 0), "entry_xy": (0.3, 1)}),
        edge("rel_pstatus_proj_sys", "enum_pstatus_sys",   "cls_project",    S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0.5, 0), "entry_xy": (0.5, 1)}),
        edge("rel_hstatus_hlth_sys", "enum_hstatus_sys",   "cls_health",     S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0.5, 0), "entry_xy": (0.5, 1)}),
        edge("rel_estatus_esc_sys",  "enum_estatus_sys",   "cls_escalation", S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0.5, 0), "entry_xy": (0.5, 1)}),
        edge("rel_evidtype_ev_sys",  "enum_evidtype_sys",  "cls_evidence",   S_ASSOC_DASH, "", "",
             **{"role": "<<use>>", "exit_xy": (0.5, 0), "entry_xy": (0.5, 1)}),
    ],
)

print("done")
