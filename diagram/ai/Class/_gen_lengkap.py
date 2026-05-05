#!/usr/bin/env python3
"""Generate CD_SISTEM_LENGKAP.drawio - combined class diagram for PT Smart Home Inovasi."""

STYLE_CLASS = 'swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;swimlaneFillColor=#FFFFFF;fontSize=12;fontColor=#000000;'
STYLE_ATTR  = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=6;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=11;fontColor=#000000;'
STYLE_SEP   = 'line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;strokeColor=#000000;'
STYLE_LABEL = 'edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;fontColor=#000000;'
STYLE_LABEL_IT = 'edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;fontColor=#000000;fontStyle=2;'
STYLE_TEXT  = 'text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;fontSize=11;fontStyle=2;fontColor=#000000;'
STYLE_ENUM_STEREO = 'text;strokeColor=none;fillColor=none;align=center;verticalAlign=top;spacingLeft=6;spacingRight=6;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=11;fontColor=#000000;fontStyle=2;'

cells = []
cell_id = [10]  # mutable counter

def cid():
    cell_id[0] += 1
    return f'u_{cell_id[0]}'

def class_block(uid, label, x, y, w, attrs, methods):
    """Returns list of XML cell strings for a swimlane class block."""
    row_h = 20
    sep_h = 10
    total_h = 28 + len(attrs)*row_h + sep_h + len(methods)*row_h
    lines = []
    lines.append(f'<mxCell id="{uid}" value="{label}" style="{STYLE_CLASS}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{total_h}" as="geometry" /></mxCell>')
    yoff = 28
    for a in attrs:
        lines.append(f'<mxCell id="{cid()}" value="{a}" style="{STYLE_ATTR}" vertex="1" parent="{uid}"><mxGeometry y="{yoff}" width="{w}" height="{row_h}" as="geometry" /></mxCell>')
        yoff += row_h
    lines.append(f'<mxCell id="{cid()}" value="" style="{STYLE_SEP}" vertex="1" parent="{uid}"><mxGeometry y="{yoff}" width="{w}" height="{sep_h}" as="geometry" /></mxCell>')
    yoff += sep_h
    for m in methods:
        lines.append(f'<mxCell id="{cid()}" value="{m}" style="{STYLE_ATTR}" vertex="1" parent="{uid}"><mxGeometry y="{yoff}" width="{w}" height="{row_h}" as="geometry" /></mxCell>')
        yoff += row_h
    return lines

def enum_block(uid, label, x, y, w, values):
    row_h = 20
    sep_h = 10
    stereo_h = 20
    total_h = 28 + stereo_h + sep_h + len(values)*row_h
    lines = []
    lines.append(f'<mxCell id="{uid}" value="{label}" style="{STYLE_CLASS}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{total_h}" as="geometry" /></mxCell>')
    lines.append(f'<mxCell id="{cid()}" value="&lt;&lt;enumeration&gt;&gt;" style="{STYLE_ENUM_STEREO}" vertex="1" parent="{uid}"><mxGeometry y="28" width="{w}" height="{stereo_h}" as="geometry" /></mxCell>')
    lines.append(f'<mxCell id="{cid()}" value="" style="{STYLE_SEP}" vertex="1" parent="{uid}"><mxGeometry y="{28+stereo_h}" width="{w}" height="{sep_h}" as="geometry" /></mxCell>')
    yoff = 28 + stereo_h + sep_h
    for v in values:
        lines.append(f'<mxCell id="{cid()}" value="{v}" style="{STYLE_ATTR}" vertex="1" parent="{uid}"><mxGeometry y="{yoff}" width="{w}" height="{row_h}" as="geometry" /></mxCell>')
        yoff += row_h
    return lines

def edge(uid, src, tgt, style, lms='', lmt='', lmr=''):
    lines = [f'<mxCell id="{uid}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry" /></mxCell>']
    if lms:
        lines.append(f'<mxCell id="{cid()}" value="{lms}" style="{STYLE_LABEL}" connectable="0" vertex="1" parent="{uid}"><mxGeometry x="-0.85" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>')
    if lmt:
        lines.append(f'<mxCell id="{cid()}" value="{lmt}" style="{STYLE_LABEL}" connectable="0" vertex="1" parent="{uid}"><mxGeometry x="0.85" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>')
    if lmr:
        lines.append(f'<mxCell id="{cid()}" value="{lmr}" style="{STYLE_LABEL_IT}" connectable="0" vertex="1" parent="{uid}"><mxGeometry relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>')
    return lines

STYLE_ASSOC  = 'endArrow=open;endFill=0;endSize=12;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;'
STYLE_COMP   = 'endArrow=diamondThin;endFill=1;endSize=14;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
STYLE_AGG    = 'endArrow=diamondThin;endFill=0;endSize=14;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
STYLE_GEN    = 'endArrow=block;endFill=0;endSize=12;startArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'

all_cells = []

# ── IDs for classes ──────────────────────────────────────────
U_USER        = 'u_User'
U_TECH        = 'u_Technician'
U_MGR         = 'u_Manager'
U_ADMIN       = 'u_Admin'
U_CLIENT      = 'u_Client'
U_PROJECT     = 'u_Project'
U_ASSIGN      = 'u_ProjectAssignment'
U_HEALTH      = 'u_ProjectHealth'
U_TASK        = 'u_Task'
U_EVIDENCE    = 'u_TaskEvidence'
U_ACTIVITY    = 'u_TaskActivity'
U_MATERIAL    = 'u_Material'
U_BUDGET      = 'u_BudgetItem'
U_ESCALATION  = 'u_Escalation'
U_ESCUPDATE   = 'u_EscalationUpdate'
U_AUDITLOG    = 'u_AuditLog'
U_DAILYRPT    = 'u_DailyReport'

E_ROLE        = 'u_eRole'
E_TASKSTATUS  = 'u_eTaskStatus'
E_PROJSTATUS  = 'u_eProjStatus'
E_PROJPHASE   = 'u_eProjPhase'
E_HEALTHST    = 'u_eHealthStatus'
E_ESCSTAT     = 'u_eEscStatus'
E_ESCPRI      = 'u_eEscPriority'
E_EVIDTYPE    = 'u_eEvidType'

# ── CLASS BLOCKS ─────────────────────────────────────────────

# User  (x=1340, y=40)
all_cells += class_block(U_USER, 'User', 1340, 40, 260,
    ['- id: int {PK}',
     '- name: string',
     '- email: string {unique}',
     '- role: enum',
     '- password_hash: string',
     '- is_active: boolean',
     '- created_at: timestamp'],
    ['+ getFullName(): string',
     '+ hasRole(role): boolean',
     '+ changeRole(role): void',
     '+ deactivate(): void'])

# Technician (x=1020, y=340)
all_cells += class_block(U_TECH, 'Technician', 1020, 340, 260,
    [],
    ['+ getAssignedTasks(): Task[]',
     '+ submitActivityLog(): void'])

# Manager (x=1340, y=340)
all_cells += class_block(U_MGR, 'Manager', 1340, 340, 260,
    [],
    ['+ approveSurvey(project): void',
     '+ markTaskDone(task): void',
     '+ viewDashboard(): Dashboard'])

# Admin (x=1660, y=340)
all_cells += class_block(U_ADMIN, 'Admin', 1660, 340, 240,
    [],
    ['+ manageUsers(): void',
     '+ viewAuditLog(): AuditLog[]'])

# Client (x=60, y=40)
all_cells += class_block(U_CLIENT, 'Client', 60, 40, 300,
    ['- id: int {PK}',
     '- name: string',
     '- address: string',
     '- phone: string',
     '- email: string',
     '- notes: string',
     '- latitude: float',
     '- longitude: float',
     '- photo_path: string',
     '- created_by: int {FK}',
     '- created_at: timestamp',
     '- updated_at: timestamp'],
    ['+ create(data): Client',
     '+ update(data): void',
     '+ delete(): void',
     '+ search(query): Client[]',
     '+ uploadPhoto(file): void',
     '+ getProjects(): Project[]'])

# Project (x=560, y=160)
all_cells += class_block(U_PROJECT, 'Project', 560, 160, 320,
    ['- id: int {PK}',
     '- project_code: string {unique}',
     '- name: string',
     '- description: string',
     '- client_id: int {FK}',
     '- start_date: date',
     '- end_date: date',
     '- duration: int {derived}',
     '- status: enum',
     '- phase: enum',
     '- category: enum',
     '- project_value: decimal',
     '- survey_approved: boolean',
     '- survey_approved_by: int {FK}',
     '- survey_approved_at: timestamp',
     '- target_description: string',
     '- created_by: int {FK}',
     '- created_at: timestamp',
     '- updated_at: timestamp'],
    ['+ create(data): Project',
     '+ update(data): void',
     '+ delete(): void',
     '+ approveSurvey(by): void',
     '+ assignTechnician(user): void',
     '+ unassignTechnician(user): void',
     '+ changePhase(phase): void',
     '+ calculateSPI(): float',
     '+ getHealth(): ProjectHealth'])

# ProjectAssignment (x=120, y=640)
all_cells += class_block(U_ASSIGN, 'ProjectAssignment', 120, 640, 270,
    ['- project_id: int {PK,FK}',
     '- user_id: int {PK,FK}',
     '- assigned_at: timestamp'],
    ['+ assign(): void',
     '+ unassign(): void',
     '+ getByProject(): User[]'])

# ProjectHealth (x=1060, y=640)
all_cells += class_block(U_HEALTH, 'ProjectHealth', 1060, 640, 290,
    ['- project_id: int {PK,FK}',
     '- spi_value: decimal',
     '- status: enum',
     '- deviation_percent: decimal',
     '- actual_progress: decimal',
     '- planned_progress: decimal',
     '- total_tasks: int',
     '- completed_tasks: int',
     '- working_tasks: int',
     '- overtime_tasks: int',
     '- overdue_tasks: int',
     '- last_updated: timestamp'],
    ['+ recalculate(): void',
     '+ getStatus(): HealthStatus',
     '+ computePlannedValue(): decimal'])

# Task (x=560, y=640)
all_cells += class_block(U_TASK, 'Task', 560, 640, 300,
    ['- id: int {PK}',
     '- project_id: int {FK}',
     '- name: string',
     '- description: string',
     '- assigned_to: int {FK}',
     '- status: enum',
     '- due_date: date',
     '- timeline_start: date',
     '- timeline_end: date',
     '- notes: string',
     '- budget: decimal',
     '- sort_order: int',
     '- is_survey_task: boolean',
     '- timer_started_at: timestamp',
     '- time_spent_seconds: int',
     '- is_tracking: boolean',
     '- estimated_hours: decimal',
     '- created_by: int {FK}',
     '- created_at: timestamp',
     '- updated_at: timestamp'],
    ['+ create(data): Task',
     '+ update(data): void',
     '+ delete(): void',
     '+ changeStatus(status): void',
     '+ assignTo(user): void',
     '+ startTimer(): void',
     '+ pauseTimer(): void',
     '+ resumeTimer(): void',
     '+ isOvertime(): boolean',
     '+ isOverDeadline(): boolean'])

# TaskEvidence (x=60, y=1360)
all_cells += class_block(U_EVIDENCE, 'TaskEvidence', 60, 1360, 280,
    ['- id: int {PK}',
     '- task_id: int {FK}',
     '- file_path: string',
     '- file_name: string',
     '- file_type: enum',
     '- file_size: int',
     '- description: string',
     '- uploaded_by: int {FK}',
     '- uploaded_at: timestamp'],
    ['+ upload(file): TaskEvidence',
     '+ download(): File',
     '+ delete(): void',
     '+ getByTask(): TaskEvidence[]'])

# TaskActivity (x=1060, y=1360)
all_cells += class_block(U_ACTIVITY, 'TaskActivity', 1060, 1360, 280,
    ['- id: int {PK}',
     '- task_id: int {FK}',
     '- user_id: int {FK}',
     '- message: string',
     '- activity_type: enum',
     '- file_path: string',
     '- file_name: string',
     '- file_size: int',
     '- created_at: timestamp'],
    ['+ log(message, type): void',
     '+ getJournal(): TaskActivity[]',
     '+ logArrival(): void',
     '+ logComplete(): void'])

# Material (x=2100, y=40)
all_cells += class_block(U_MATERIAL, 'Material', 2100, 40, 290,
    ['- id: int {PK}',
     '- project_id: int {FK}',
     '- name: string',
     '- quantity: decimal',
     '- unit: string',
     '- unit_price: decimal',
     '- total_price: decimal {derived}',
     '- notes: string',
     '- created_at: timestamp'],
    ['+ create(data): Material',
     '+ update(data): void',
     '+ delete(): void',
     '+ calculateTotal(): decimal',
     '+ getByProject(): Material[]'])

# BudgetItem (x=2100, y=380)
all_cells += class_block(U_BUDGET, 'BudgetItem', 2100, 380, 290,
    ['- id: int {PK}',
     '- project_id: int {FK}',
     '- category: string',
     '- description: string',
     '- amount: decimal',
     '- is_actual: boolean',
     '- created_at: timestamp'],
    ['+ create(data): BudgetItem',
     '+ update(data): void',
     '+ delete(): void',
     '+ getTotalPlanned(): decimal',
     '+ getTotalActual(): decimal',
     '+ getDeviation(): decimal'])

# Escalation (x=2100, y=700)
all_cells += class_block(U_ESCALATION, 'Escalation', 2100, 700, 310,
    ['- id: int {PK}',
     '- task_id: int {FK}',
     '- project_id: int {FK}',
     '- reported_by: int {FK}',
     '- title: string',
     '- description: string',
     '- status: enum',
     '- priority: enum',
     '- file_path: string',
     '- resolved_by: int {FK}',
     '- resolved_at: timestamp',
     '- resolution_notes: string',
     '- created_at: timestamp',
     '- updated_at: timestamp'],
    ['+ open(data): Escalation',
     '+ updateStatus(status): void',
     '+ resolve(notes, by): void',
     '+ getSummary(): EscalationSummary'])

# EscalationUpdate (x=2100, y=1180)
all_cells += class_block(U_ESCUPDATE, 'EscalationUpdate', 2100, 1180, 290,
    ['- id: int {PK}',
     '- escalation_id: int {FK}',
     '- author_id: int {FK}',
     '- message: string',
     '- created_at: timestamp'],
    ['+ post(message): void',
     '+ getThread(): EscalationUpdate[]'])

# AuditLog (x=60, y=580)
all_cells += class_block(U_AUDITLOG, 'AuditLog', 60, 580, 280,
    ['- id: int {PK}',
     '- entity_type: string',
     '- entity_id: int',
     '- entity_name: string',
     '- action: string',
     '- field_name: string',
     '- old_value: string',
     '- new_value: string',
     '- changed_by: int {FK}',
     '- changed_by_name: string',
     '- created_at: timestamp'],
    ['+ record(entity, action): void',
     '+ query(filter): AuditLog[]',
     '+ getByEntity(type, id): AuditLog[]'])

# DailyReport (x=560, y=1360)
all_cells += class_block(U_DAILYRPT, 'DailyReport', 560, 1360, 285,
    ['- id: int {PK}',
     '- project_id: int {FK}',
     '- task_id: int {FK, nullable}',
     '- report_date: date',
     '- progress_percentage: decimal',
     '- constraints: string',
     '- created_by: int {FK}',
     '- created_at: timestamp'],
    ['+ submit(data): DailyReport',
     '+ getHistory(): DailyReport[]',
     '+ getByDate(date): DailyReport[]'])

# ── ENUMS ────────────────────────────────────────────────────
# Clustered bottom-right starting y=1300, x=2400
EX = 2440
all_cells += enum_block(E_ROLE,       'Role',              EX,    1300, 190, ['technician','manager','admin'])
all_cells += enum_block(E_TASKSTATUS, 'TaskStatus',        EX+220, 1300, 220, ['to_do','working_on_it','review','done'])
all_cells += enum_block(E_PROJSTATUS, 'ProjectStatus',     EX+470, 1300, 210, ['active','completed','on-hold','cancelled'])
all_cells += enum_block(E_PROJPHASE,  'ProjectPhase',      EX,    1500, 190, ['survey','execution'])
all_cells += enum_block(E_HEALTHST,   'HealthStatus',      EX+220, 1500, 200, ['green','amber','red'])
all_cells += enum_block(E_ESCSTAT,    'EscalationStatus',  EX+450, 1500, 210, ['open','in_review','resolved'])
all_cells += enum_block(E_ESCPRI,     'EscalationPriority',EX,    1660, 230, ['low','medium','high','critical'])
all_cells += enum_block(E_EVIDTYPE,   'EvidenceFileType',  EX+260, 1660, 220, ['photo','document','form','screenshot','other'])

# ── RELATIONS ────────────────────────────────────────────────
# Generalisation: Technician/Manager/Admin --> User
all_cells += edge('rel_tech_user',  U_TECH,  U_USER, STYLE_GEN)
all_cells += edge('rel_mgr_user',   U_MGR,   U_USER, STYLE_GEN)
all_cells += edge('rel_admin_user', U_ADMIN, U_USER, STYLE_GEN)

# Client 1 --<> 1..* Project (aggregation open diamond at Client side)
all_cells += edge('rel_client_proj', U_CLIENT, U_PROJECT, STYLE_AGG, '1', '1..*')

# Project 1 --<fill> * Task
all_cells += edge('rel_proj_task', U_TASK, U_PROJECT, STYLE_COMP, '*', '1')

# Project 1 --<fill> 1 ProjectHealth
all_cells += edge('rel_proj_health', U_HEALTH, U_PROJECT, STYLE_COMP, '1', '1')

# Project --<fill> * Material
all_cells += edge('rel_proj_material', U_MATERIAL, U_PROJECT, STYLE_COMP, '*', '1')

# Project --<fill> * BudgetItem
all_cells += edge('rel_proj_budget', U_BUDGET, U_PROJECT, STYLE_COMP, '*', '1')

# Project --<fill> * Escalation
all_cells += edge('rel_proj_esc', U_ESCALATION, U_PROJECT, STYLE_COMP, '*', '1')

# Task --<fill> * TaskEvidence
all_cells += edge('rel_task_evidence', U_EVIDENCE, U_TASK, STYLE_COMP, '*', '1')

# Task --<fill> * TaskActivity
all_cells += edge('rel_task_activity', U_ACTIVITY, U_TASK, STYLE_COMP, '*', '1')

# Task --<fill> * Escalation (task also owns escalations)
all_cells += edge('rel_task_esc', U_ESCALATION, U_TASK, STYLE_ASSOC, '*', '1')

# Escalation --<fill> * EscalationUpdate
all_cells += edge('rel_esc_escupdate', U_ESCUPDATE, U_ESCALATION, STYLE_COMP, '*', '1')

# User 1 -- * ProjectAssignment
all_cells += edge('rel_user_assign', U_USER, U_ASSIGN, STYLE_ASSOC, '1', '*')

# Project 1 -- * ProjectAssignment
all_cells += edge('rel_proj_assign', U_PROJECT, U_ASSIGN, STYLE_ASSOC, '1', '*')

# User 1 -- * Task (assignee)
all_cells += edge('rel_user_task', U_USER, U_TASK, STYLE_ASSOC, '1', '*', 'assignee')

# User 1 -- * TaskEvidence (uploader)
all_cells += edge('rel_user_evidence', U_USER, U_EVIDENCE, STYLE_ASSOC, '1', '*', 'uploader')

# User 1 -- * AuditLog (changed_by)
all_cells += edge('rel_user_audit', U_USER, U_AUDITLOG, STYLE_ASSOC, '1', '*', 'changed_by')

# User 1 -- * Escalation (reporter)
all_cells += edge('rel_user_esc', U_USER, U_ESCALATION, STYLE_ASSOC, '1', '*', 'reporter')

# Project 1 -- * DailyReport
all_cells += edge('rel_proj_rpt', U_DAILYRPT, U_PROJECT, STYLE_COMP, '*', '1')

# User 1 -- * DailyReport (reporter)
all_cells += edge('rel_user_rpt', U_USER, U_DAILYRPT, STYLE_ASSOC, '1', '*', 'reporter')

# ── CAPTION ──────────────────────────────────────────────────
all_cells.append(
    f'<mxCell id="u_caption" value="&lt;i&gt;Gambar 4.X Class Diagram Sistem PT Smart Home Inovasi.&lt;/i&gt;" '
    f'style="{STYLE_TEXT}" vertex="1" parent="1">'
    f'<mxGeometry x="800" y="2100" width="700" height="30" as="geometry" /></mxCell>'
)

# ── ASSEMBLE XML ─────────────────────────────────────────────
xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mxfile host="app.diagrams.net" modified="2026-05-05T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">',
    '  <diagram id="CD_SISTEM_LENGKAP" name="CD_SISTEM_LENGKAP">',
    '    <mxGraphModel dx="1800" dy="1400" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3200" pageHeight="2200" background="#FFFFFF" math="0" shadow="0">',
    '      <root>',
    '        <mxCell id="0" />',
    '        <mxCell id="1" parent="0" />',
]

for c in all_cells:
    xml.append('        ' + c)

xml += [
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>',
]

out = '\n'.join(xml)
path = '/Users/user/Documents/COLLEGE/Mata Kuliah/8/Tugas Akhir/coding/project_ta_dian_putri_iswandi/diagram/ai/Class/CD_SISTEM_LENGKAP.drawio'
with open(path, 'w', encoding='utf-8') as f:
    f.write(out)

print(f'Written {len(out)} bytes to {path}')
print(f'Total mxCell blocks: {len(all_cells)}')
