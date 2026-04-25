# 6. Business Logic & Formulas

## Core Concept: Schedule Performance Index (SPI)

### Definition
**SPI = Earned Value (EV) / Planned Value (PV)**

The ratio of actual work completed versus expected work by today's date.

### Interpretation
- **SPI = 1.0:** Exactly on schedule
- **SPI > 1.0:** Ahead of schedule (bonus productivity)
- **SPI < 1.0:** Behind schedule (at-risk project)

### Business Meaning
For a project with 30 days, if 15 days have elapsed:
- Planned work (PV) = 50% complete by day 15
- If actual work (EV) = 45% complete → SPI = 0.90 (behind schedule)
- If actual work (EV) = 60% complete → SPI = 1.20 (ahead of schedule)

---

## SPI Calculation Formula

```typescript
// Primary method: Task-based calculation (preferred)
SPI = (completed_tasks / total_tasks) / (days_elapsed / total_project_days)

// Example:
// Project duration: 30 days (start: 2026-04-01, end: 2026-05-01)
// Today: 2026-04-16 (day 16 of 30)
// Tasks: 10 total, 8 completed
//
// days_elapsed = 15 days
// total_project_days = 30 days
// planned_value = 15 / 30 = 0.50 (50% of work should be done)
// earned_value = 8 / 10 = 0.80 (80% of work is actually done)
// SPI = 0.80 / 0.50 = 1.60 (ahead of schedule!)

// Fallback method: Daily reports
// If no tasks exist, use progress_percentage from daily_reports
// SPI = daily_report.progress_percentage / planned_value
```

### Code Implementation

**File:** `frontend/src/lib/spiCalculator.ts`

```typescript
export async function recalculateSPI(projectId: number) {
  // 1. Get project details
  const projectResult = await query<Project>(
    `SELECT * FROM projects WHERE id = $1`,
    [projectId]
  );
  const project = projectResult.rows[0];
  if (!project) return;

  // 2. Count tasks
  const tasksResult = await query<{ total: number; completed: number }>(
    `SELECT 
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'done' THEN 1 END) as completed
     FROM tasks
     WHERE project_id = $1`,
    [projectId]
  );
  const { total, completed } = tasksResult.rows[0];

  // 3. Calculate days elapsed and total days
  const startDate = new Date(project.start_date);
  const endDate = new Date(project.end_date);
  const today = new Date();
  
  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // 4. Calculate SPI
  let spiValue = null;
  if (total > 0 && totalDays > 0) {
    const plannedValue = daysElapsed / totalDays;
    const earnedValue = completed / total;
    spiValue = earnedValue / plannedValue;
  }

  // 5. Determine health status
  let status = 'green';
  if (spiValue !== null) {
    if (spiValue < 0.85) status = 'red';
    else if (spiValue < 0.95) status = 'amber';
  }

  // 6. Calculate other metrics
  const overallDeviation = ((earnedValue - plannedValue) / plannedValue) * 100;
  const actualProgress = earnedValue * 100;
  const plannedProgress = plannedValue * 100;

  // 7. Count overtime and overdue tasks
  const taskDetailsResult = await query<{
    working_tasks: number;
    overtime_tasks: number;
    overdue_tasks: number;
  }>(
    `SELECT
       COUNT(CASE WHEN status = 'working_on_it' THEN 1 END) as working_tasks,
       COUNT(CASE WHEN status = 'working_on_it' AND due_date < CURRENT_DATE THEN 1 END) as overtime_tasks,
       COUNT(CASE WHEN status = 'to_do' AND due_date < CURRENT_DATE THEN 1 END) as overdue_tasks
     FROM tasks
     WHERE project_id = $1`,
    [projectId]
  );
  const { working_tasks, overtime_tasks, overdue_tasks } = taskDetailsResult.rows[0];

  // 8. Upsert into project_health
  await query(
    `INSERT INTO project_health (project_id, spi_value, status, deviation_percent,
       actual_progress, planned_progress, total_tasks, completed_tasks, 
       working_tasks, overtime_tasks, overdue_tasks, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
     ON CONFLICT (project_id) DO UPDATE SET
       spi_value = $2,
       status = $3,
       deviation_percent = $4,
       actual_progress = $5,
       planned_progress = $6,
       total_tasks = $7,
       completed_tasks = $8,
       working_tasks = $9,
       overtime_tasks = $10,
       overdue_tasks = $11,
       last_updated = CURRENT_TIMESTAMP`,
    [projectId, spiValue, status, overallDeviation, actualProgress, 
     plannedProgress, total, completed, working_tasks, overtime_tasks, overdue_tasks]
  );
}
```

---

## Health Status Thresholds

### Status Classification

| Status | SPI Range | Color | Meaning |
|---|---|---|---|
| 🟢 Green | SPI ≥ 0.95 | Emerald-500 | On track, within acceptable variance |
| 🟡 Amber | 0.85 ≤ SPI < 0.95 | Amber-500 | Warning, behind schedule but recoverable |
| 🔴 Red | SPI < 0.85 | Red-500 | Critical, significantly behind schedule |
| ⚪ No Health | No tasks | Gray-400 | Insufficient data (survey phase) |

### Threshold Rationale
- **95%:** 5% variance is acceptable in real-world projects
- **85%:** 15% slip requires immediate action
- **Below 85%:** Escalation and corrective action needed

---

## Task Status Workflow

### Complete State Machine

```
┌────────────────────────────────────────────────────────────┐
│                    TECHNICIAN VIEW                          │
└────────────────────────────────────────────────────────────┘

  ┌──────────┐
  │  to_do   │  (Task created by manager)
  └────┬─────┘
       │ Technician starts work
       ▼
  ┌──────────────┐
  │ in_progress  │  (Task actively being worked on)
  └────┬─────────┘
       │ Technician enables timer
       ▼
  ┌──────────────┐
  │working_on_it │  (Timer running, evidence accumulating)
  │(Timer mode)  │  (Time tracked: time_spent_seconds increments)
  └────┬─────────┘
       │ Technician stops, uploads evidence
       ▼
  ┌────────────────────────────────────────────────┐
  │              MANAGER REVIEW GATE                 │
  │  Task status remains 'review' until approved    │
  └────┬─────────────────────────────────────────┬──┘
       │                                         │
       │ Manager approves                        │ Manager rejects
       ▼                                         ▼
  ┌──────────┐                            ┌──────────────┐
  │   done   │                            │ in_progress  │
  │(Final)   │                            │(back to work)│
  └──────────┘                            └──────────────┘
       │
       └─► SPI recalculated
       └─► project_health updated
       └─► dashboard refreshed
```

### Status Semantics

| Status | Meaning | Who? | Time Tracked? | Evidence Visible? |
|---|---|---|---|---|
| to_do | Waiting to start | Anyone | No | No |
| in_progress | Actively working | Technician | No (yet) | No |
| working_on_it | Timer running | Technician | Yes (live) | Yes |
| review | Awaiting approval | Manager | Yes (frozen) | Yes |
| done | Approved, complete | Manager | Yes (final) | Yes |

---

## Overtime vs Over Deadline

### Two Computed Indicators (not DB statuses)

**Overtime:** `status = 'working_on_it' AND due_date < TODAY`
- Technician actively working on task past deadline
- Shows as orange card in Kanban
- Needs immediate attention

**Over Deadline:** `status = 'to_do' AND due_date < TODAY`
- Task not started and past deadline
- Shows as red card in Kanban
- Critical blocker

**In SQL Query:**
```sql
SELECT
  COUNT(CASE WHEN status = 'working_on_it' AND due_date < CURRENT_DATE THEN 1 END) AS overtime_tasks,
  COUNT(CASE WHEN status = 'to_do' AND due_date < CURRENT_DATE THEN 1 END) AS overdue_tasks
FROM tasks
WHERE project_id = $1;
```

---

## Project Phases

### Survey Phase
- **Purpose:** Understand client requirements, assess site conditions
- **Duration:** Before project execution
- **Manager Action:** Approve survey to unlock execution
- **API Endpoint:** `POST /projects/:id/approve-survey`
- **Tasks Marked:** `is_survey_task = true` for survey-specific tasks
- **Transition:** Manager clicks "Approve Survey" → `phase = 'execution'`, `survey_approved = true`

### Execution Phase
- **Purpose:** Implement the smart home system
- **Duration:** Main project timeline
- **Task Management:** Full Kanban/table workflow
- **Completion:** When all tasks = 'done'

### Status vs Phase

| Phase | Status | Meaning |
|---|---|---|
| survey | active | Gathering requirements |
| execution | active | Implementation in progress |
| execution | completed | All work done, customer accepted |
| execution | on-hold | Paused, will resume |
| execution | cancelled | Abandoned, will not complete |

---

## SPI Recalculation Triggers

SPI is recalculated automatically when:

1. **Task created** → Total task count increases
2. **Task deleted** → Total task count decreases
3. **Task status changed** → Completed count changes
   - to_do → in_progress: no change to SPI
   - in_progress → working_on_it: no change to SPI
   - working_on_it → review: no change to SPI
   - review → done: **TRIGGERS RECALCULATION**
   - review → in_progress: (rejection) no change to SPI
4. **Daily report submitted** (fallback)

**Implementation:** Each API mutation calls `recalculateSPI(projectId)` after database change

---

## Earned Value Analysis

### What it Measures
- **Planned Value (PV):** How much work *should* be done by today
- **Earned Value (EV):** How much work *is actually* done
- **Schedule Variance (SV):** EV - PV (positive = ahead, negative = behind)

### Formula
```
PV = (Days Elapsed / Total Project Days) × 100%
EV = (Completed Tasks / Total Tasks) × 100%
SPI = EV / PV
SV = (EV - PV) × Total Project Value
```

### Example
```
Project: 30 days (Apr 1 - May 1)
Today: Apr 16 (16 days elapsed)
Tasks: 10 total, 8 completed

PV = (16 / 30) × 100 = 53.3%
EV = (8 / 10) × 100 = 80%
SPI = 80 / 53.3 = 1.50 (50% ahead of schedule!)
SV = (80 - 53.3) × 100 = 26.7 points (positive variance)
```

### Earned Value Chart
- X-axis: Timeline (days)
- Y-axis: Percentage complete (0-100%)
- Blue line: PV (straight diagonal from 0 to 100%)
- Orange line: EV (actual progress curve)
- Space between lines: Schedule variance

**Interpretation:**
- EV above PV → Ahead of schedule (good)
- EV below PV → Behind schedule (bad)
- EV crosses PV → Catchup happening

---

## Budget Tracking

### Two Categories: Planned vs Actual

```sql
-- Planned budget (estimates before project)
SELECT SUM(amount) FROM budget_items 
WHERE project_id = ? AND is_actual = false;

-- Actual budget (real costs incurred)
SELECT SUM(amount) FROM budget_items 
WHERE project_id = ? AND is_actual = true;

-- Variance
variance = actual - planned;
variance_percent = (variance / planned) × 100%;
```

### Materials Total Price (Computed)

```sql
-- Each material row auto-calculates
total_price = quantity × unit_price

-- Project materials sum
SELECT SUM(total_price) FROM materials WHERE project_id = ?;
```

---

## Audit Trail

### What Gets Logged

Every CREATE, UPDATE, DELETE operation on:
- projects
- tasks
- users
- clients
- materials
- budget_items

### Logged Information

```
{
  entity_type: 'project',        // What was changed
  entity_id: 1,                  // Which record
  entity_name: 'Project A',      // Human-readable name
  action: 'update',              // create|update|delete
  field_name: 'status',          // Which field changed (null for create/delete)
  old_value: 'active',           // Before
  new_value: 'on-hold',          // After
  changed_by: 2,                 // Who did it
  changed_by_name: 'Manager A',  // Human-readable
  created_at: '2026-04-23T14:30' // When
}
```

### Implementation

**File:** `frontend/src/lib/handlers/audit.ts`

```typescript
export async function logChange({
  entityType,
  entityId,
  entityName,
  action,
  changes,
  userId,
  userName,
}: {
  entityType: string;
  entityId: number;
  entityName: string;
  action: 'create' | 'update' | 'delete';
  changes: Array<{ field: string; oldValue: any; newValue: any }>;
  userId: number;
  userName: string;
}) {
  for (const change of changes) {
    await query(
      `INSERT INTO audit_log (entity_type, entity_id, entity_name, action,
        field_name, old_value, new_value, changed_by, changed_by_name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [
        entityType,
        entityId,
        entityName,
        action,
        change.field === '*' ? null : change.field,  // null for create/delete
        change.oldValue?.toString() || null,
        change.newValue?.toString() || null,
        userId,
        userName,
      ]
    );
  }
}
```

---

## Time Tracking Logic

### Timer Mechanism

**Start:** `POST /api/tasks/:id/timer-start`
```typescript
UPDATE tasks 
SET timer_started_at = CURRENT_TIMESTAMP, is_tracking = true
WHERE id = ?;
```

**Stop:** `POST /api/tasks/:id/timer-stop`
```typescript
-- Calculate elapsed time
const elapsed = (NOW - timer_started_at) in seconds

-- Add to total
UPDATE tasks 
SET time_spent_seconds = time_spent_seconds + ?,
    is_tracking = false,
    timer_started_at = NULL
WHERE id = ?;
```

**Display Format:**
```typescript
function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
// Example: 7200 seconds → "2h 0m"
```

---

## Role-Based Access Control

### Permission Matrix

| Action | Technician | Manager | Admin |
|---|---|---|---|
| View dashboard | ❌ | ✅ | ✅ |
| View own tasks | ✅ | ❌ | ❌ |
| Create project | ❌ | ✅ | ✅ |
| Edit project | ❌ | ✅ | ✅ |
| Delete project | ❌ | ✅ | ✅ |
| Create task | ❌ | ✅ | ✅ |
| Change task to "done" | ❌ | ✅ | ✅ |
| Upload evidence | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |
| Approve survey | ❌ | ✅ | ✅ |

### Implementation

**Auth check in handlers:**
```typescript
const roleCheck = authorizeRoles(auth.user, ['manager', 'admin']);
if (roleCheck) return roleCheck;  // Returns 403 Forbidden
```

---

## Data Validation Rules

### Project
- name: required, non-empty
- start_date < end_date: required
- client_id: optional but must exist if provided
- project_value: optional, must be ≥ 0
- phase: must be 'survey' or 'execution'

### Task
- project_id: required, must exist
- name: required, non-empty
- assigned_to: optional but must exist if provided
- due_date: optional, must be ≥ start_date if provided
- status: must be one of 5 valid statuses
- budget: optional, must be ≥ 0

### User
- name: required, non-empty
- email: required, unique
- password: min 8 characters (on create)
- role: must be one of 3 valid roles

### Budget Item
- amount: required, must be > 0
- category: required
- is_actual: required, boolean

---

## Error Handling Philosophy

### Validation Errors (400)
```json
{
  "success": false,
  "error": "end_date must be after start_date"
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": "Project not found"
}
```

### Server Errors (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Frontend behavior:**
- Display error toast with user-friendly message
- Log to console for debugging
- Retry queries up to 1 time (TanStack Query)
- Gracefully degrade if repeated failure

