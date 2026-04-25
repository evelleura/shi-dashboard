# 7. User Workflows by Role

## Overview: Three User Roles

```
┌─────────────────────────────────────────────────────────────┐
│             SYSTEM USERS BY ROLE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Field Technician (🔧)      Project Manager (👨‍💼)    Admin (👨‍💻)     │
│  ├─ View own tasks          ├─ Manage projects      ├─ Everything │
│  ├─ Work on tasks           ├─ Create/edit tasks    ├─ User mgmt  │
│  ├─ Track time              ├─ Approve task work    ├─ Audit logs │
│  ├─ Upload evidence         ├─ View analytics       ├─ System ops │
│  ├─ See assigned projects   ├─ Manage budget        │              │
│  └─ Report escalations      ├─ Approve surveys      │              │
│                             └─ Manage team          │              │
│                                                      │              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technician Workflow

### 1. Login & Dashboard

**URL:** `http://localhost:3000`

**Steps:**
1. Enter email and password
2. Click "Login" button
3. Redirect to `/my-dashboard`

**Dashboard shows:**
- My tasks count (breakdown by status)
- My assigned projects
- Recent tasks
- Escalations I've opened
- Quick action: View all my tasks

---

### 2. View Assigned Tasks

**URL:** `/my-tasks`

**Two View Options:**

#### Option A: Kanban Board
- 5 columns: To Do | In Progress | Working On It | Review | Done
- Each card shows:
  - Task name
  - Assignee avatar + name
  - Due date (or "Overdue" in red)
  - Time spent counter
  - Evidence count
  - Status dropdown (read-only for technician)
- Limitations:
  - Cannot change to "Done" (manager only)
  - Cannot change to "Review" (automatic after "working_on_it")

#### Option B: Table View
- Sortable columns: Name | Project | Assignee | Status | Due Date | Evidence | Time Spent
- Click row to open detail modal
- Filter by status/project

---

### 3. Start Working on a Task

**Workflow:**

```
1. View task in Kanban or Table
2. Change status: to_do → in_progress
3. Enter task detail modal
4. Review task description and requirements
5. Click "Start Timer" button (green play icon)
   └─ is_tracking = true
   └─ timer_started_at = NOW
   └─ UI shows pulsing green dot on card
6. Begin work
```

**UI Feedback:**
- Card moves to "Working On It" column (if shown)
- Green pulsing dot appears on card
- Time counter starts incrementing
- Status text shows "Currently tracking: X minutes"

---

### 4. Upload Evidence

**Workflow (In Task Detail Modal):**

```
1. Scroll to "Evidence" section
2. Click "Add Evidence" button or drag-drop files
3. Upload dialog:
   ├─ Select file (photo, document, form, screenshot)
   ├─ Optional: Add description/caption
   └─ Click "Upload"
4. File uploaded to server/uploads/task_<ID>/
5. Evidence appears in gallery with:
   ├─ Thumbnail or icon
   ├─ Filename
   ├─ Upload date
   ├─ Uploader name
   └─ Delete button (own uploads only)
```

**Supported File Types:**
- Photo: jpg, jpeg, png
- Document: pdf, doc, docx
- Form: xls, xlsx
- Screenshot: png, jpg
- Other: pdf, txt

**File Size Limit:** 50 MB per file

**Evidence Gallery:**
- Thumbnail grid (4 columns on desktop, 2 on tablet, 1 on mobile)
- Click to view full size or download
- Shows file type icon and upload date

---

### 5. Stop Timer & Complete Work

**Workflow:**

```
1. Finish work on task
2. Click "Stop Timer" button (red pause icon)
   └─ is_tracking = false
   └─ time_spent_seconds += (elapsed seconds)
   └─ timer_started_at = NULL
3. Green dot disappears
4. Time counter frozen at total time spent
5. Status remains "working_on_it" (waiting for manager review)
6. Task card shows:
   ├─ Time spent: "2h 30m"
   ├─ Evidence count: "3 files"
   ├─ Status: "working_on_it"
   └─ Badge: "Pending review"
```

**Manager will:**
- Review evidence and details
- Click "Approve" → status becomes "done"
- Or click "Reject" → reverts to "in_progress"

---

### 6. Report Issues (Escalate)

**Workflow (if stuck or blocked):**

```
1. In task detail modal, scroll to "Escalation" section
2. Click "Report Issue" button
3. Escalation form:
   ├─ Title: "What's the problem?"
   ├─ Description: "Detailed explanation"
   ├─ Priority: low|medium|high|critical
   ├─ Attachment: Optional file upload
   └─ Submit
4. Escalation created:
   ├─ status = "open"
   ├─ reported_by = current user
   ├─ created_at = NOW
5. Manager notified (in notification bell)
6. Escalation appears in manager's dashboard
```

**Escalation Statuses:**
- Open: Just reported, manager not yet reviewed
- In Review: Manager is investigating
- Resolved: Manager provided solution

---

### 7. View Project Details

**URL:** `/my-projects`

**Shows my assigned projects:**
- Client name and address
- Project phase (survey or execution)
- Health status color
- My task count vs completed
- Quick links: View all tasks | See in timeline

**Cannot:**
- Create projects
- Edit project info
- Delete projects
- Manage team
- Approve surveys

---

## Project Manager Workflow

### 1. Manager Dashboard

**URL:** `/dashboard`

**Sections:**

#### a) Summary Cards (4 KPIs)
- Total active projects
- Red/amber/green count
- Average SPI
- Critical alerts

#### b) Project Health Overview
- All projects sorted by criticality (red → amber → green)
- Each row shows:
  - Project code (SHI-YYMMXXX)
  - Name and client
  - Health status (color badge)
  - SPI value (e.g., "0.92")
  - Tasks: 8/10 completed
  - End date
  - Quick action icons

#### c) Eight Chart Types
1. **Project Health Pie:** Red/amber/green distribution
2. **Task Status Bar:** to_do, in_progress, working, review, done
3. **Tasks by Owner:** Technician workload (stacked bar)
4. **Tasks by Due Date:** Monthly task progression (stacked area)
5. **Overdue Tasks:** Overtime vs over_deadline by project
6. **Budget Status:** Planned vs actual spend
7. **Earned Value:** PV/EV/SPI trend
8. **Team Productivity:** Weekly task completion rate

#### d) Date Range Filter (Bank-Style)
- Presets: 7 days, 30 days, 3 months, 6 months, this year, all
- Custom range: Click calendar twice (start → end)
- All charts update automatically on filter change

#### e) Global Search Bar
- Search projects, tasks, clients
- Min 2 characters to trigger search
- Results grouped by type
- Click result to navigate

#### f) Notification Bell
- Shows critical alerts (red projects)
- Warnings (amber projects)
- Overtime tasks
- Open escalations
- Badge shows count
- Click to see detailed list

---

### 2. Projects Management

**URL:** `/projects`

**Features:**

#### a) Projects Table
- Columns: Code | Name | Client | Phase | Status | SPI | Health | Value | Created
- Sortable by clicking column header
- Pagination: 10/25/50 rows per page
- Search by name or code

#### b) Inline Editing
- Double-click cell to edit
- Pencil icon appears on hover
- Edit fields: Name, Phase, Status, Value
- Press Enter or click away to save
- Press Escape to cancel
- Audit log captures change (field_name, old_value, new_value)

#### c) Create Project
- Click "+ New Project" button
- Modal form:
  ```
  Project Name: [text input]
  Client: [dropdown - existing clients]
  Start Date: [date picker]
  End Date: [date picker]
  Project Value (Rp): [number input]
  Description: [textarea]
  Phase: [survey|execution radio]
  Target Description: [textarea for survey goals]
  [Cancel] [Create]
  ```
- System auto-generates project_code: SHI-YYMMXXX
- Redirects to project detail page

#### d) Delete Project
- Click row → select "Delete"
- Confirmation dialog: "Delete project and all tasks?"
- Cascade deletes: tasks, evidence, budget, materials
- Audit log: action='delete'

#### e) Excel Export
- Click "Export" button
- Downloads XLSX with all projects
- Columns: Code, Name, Client, Phase, Status, SPI, Health, Value, Created

---

### 3. Project Detail & Task Management

**URL:** `/projects/:id`

**Sections:**

#### a) Project Header
- Project code and name
- Client and address
- Status: active|completed|on-hold|cancelled (editable)
- Phase: survey|execution (editable)
- Health status: Red/Amber/Green circle
- SPI value: "0.92" (blue/amber/red text)
- Actions:
  - Edit project button
  - Assign technician button
  - Approve survey button (if phase='survey')

#### b) Task Kanban Board
- 5 columns with counts:
  ```
  To Do (3)  |  In Progress (2)  |  Working (1)  |  Review (1)  |  Done (5)
  
  [Cards appear in columns by status]
  [Orange cards: overtime (working + overdue)]
  [Red cards: over_deadline (to_do + overdue)]
  ```
- Each card shows:
  - Task name
  - Assigned technician
  - Due date (or "Overdue: date")
  - Time spent
  - Evidence count
  - Status dropdown (can change via dropdown)
- Click card to open detail modal
- Not drag-and-drop (use dropdown instead)

#### c) Task Table View
- Toggle to table via "View Toggle" button
- Columns: Name | Project | Assigned To | Status | Due Date | Evidence | Time Spent
- Sortable, filterable
- Click row to open detail modal

#### d) Task Detail Modal
- Opened when clicking card or table row
- Tabs or sections:
  1. **Task Info**
     - Name, description (editable)
     - Assigned to (dropdown to change)
     - Status (dropdown)
     - Due date (date picker)
     - Budget (editable number)
  2. **Evidence**
     - Gallery of uploaded files
     - Manager can view/download
     - Cannot delete (only uploader can)
  3. **Activity Feed**
     - Timeline of status changes
     - Comments/notes from team
     - Who changed what when
  4. **Time Tracking**
     - Total time spent
     - Timeline of timer sessions
     - Cannot edit (audit trail)

#### e) Create New Task
- Click "+ Add Task" button in Kanban header
- Modal form:
  ```
  Task Name: [text input]
  Description: [textarea]
  Assigned To: [dropdown - project technicians]
  Due Date: [date picker]
  Timeline Start: [date picker]
  Timeline End: [date picker]
  Budget (Rp): [number input]
  Is Survey Task: [checkbox]
  [Cancel] [Create]
  ```
- Task created with status='to_do'
- Kanban refreshes automatically
- SPI recalculated (if any tasks exist)

#### f) Materials List
- Table of materials needed for project
- Columns: Name | Quantity | Unit | Unit Price | Total Price
- Create: Click "+ Add Material"
- Edit: Click pencil icon (inline editing)
- Delete: Click trash icon + confirmation
- Total at bottom: Σ total_price

#### g) Budget Tracking
- Two sections: Planned | Actual
- Each category shows amount
- Variance calculation (actual - planned)
- Create/edit/delete budget items
- Chart: Bar chart comparing planned vs actual

---

### 4. Assign Technicians to Project

**Workflow:**

```
1. In project detail, click "Assign Technician" button
2. Modal dialog:
   ├─ List of all unassigned technicians
   ├─ Search by name
   ├─ Checkboxes to select multiple
   └─ [Cancel] [Assign]
3. Selected technicians:
   ├─ Added to project_assignments table
   ├─ Can now view this project in my-projects
   ├─ Can see tasks assigned to them
4. Confirmation toast: "2 technicians assigned"
```

---

### 5. Approve Survey Phase

**Workflow:**

```
1. Project in survey phase (phase='survey')
2. Manager reviews survey deliverables:
   ├─ Target description completed
   ├─ Site assessment done
   ├─ Client requirements documented
3. Click "Approve Survey" button
4. Confirmation dialog:
   "Approve survey and move to execution phase?"
5. POST /api/projects/:id/approve-survey
   ├─ phase = 'execution'
   ├─ survey_approved = true
   ├─ survey_approved_by = current user
   ├─ survey_approved_at = NOW
6. Tasks now active in Kanban
7. Notification sent to assigned technicians
```

---

### 6. Review & Approve Task Work

**Workflow (for tasks in 'review' status):**

```
1. Manager sees task in "Review" column
2. Review task details:
   ├─ View evidence gallery (photos, docs)
   ├─ Check time spent
   ├─ Read technician notes
   ├─ Verify quality
3. Decision:
   Option A: Approve
   ├─ Click "Approve" button
   ├─ PATCH /api/tasks/:id { status: 'done' }
   ├─ SPI recalculated automatically
   ├─ Project health updated
   ├─ Dashboard charts refresh
   ├─ Technician notified: "Your work was approved!"
   
   Option B: Reject (needs more work)
   ├─ Click "Reject" button
   ├─ PATCH /api/tasks/:id { status: 'in_progress' }
   ├─ Technician can rework
   ├─ Notified: "Please revise and resubmit"
   ├─ Time spent carries over (not reset)
```

---

### 7. View Reports & Analytics

**URL:** `/reports`

**Interactive Report Table:**
- Every row clickable for detail
- Columns: Code | Name | Client | Phase | Status | SPI | Health | Value | Days Left
- Inline dropdowns: Phase and Status (edit without modal)
- Action buttons: Eye (view detail) | Pencil (edit modal)

**Edit Modal:**
- Form with all project fields
- Save changes
- Link: "Open Full Detail" → navigates to project detail page

**Export:**
- Excel button: Downloads XLSX of report
- Print button: Formatted for PDF printing

---

### 8. View Project Timeline

**URL:** `/timeline`

**Visualization:**
- Horizontal bars for each project
- X-axis: Calendar (months and days)
- Bar color: Green/Amber/Red by health status
- Inside bar: Progress % (width) and SPI value
- Today marker: Vertical red line
- Hover: Shows project name and dates
- Click: Navigate to project detail

**Filters:**
- Status: Active | Completed | All
- Sort: Start Date | End Date | Health

**Use Cases:**
- Spot schedule conflicts
- See overall portfolio timeline
- Identify which projects are running long
- Plan resource allocation

---

## Admin Workflow

### 1. User Management

**URL:** `/users`

**Table Columns:** Name | Email | Role | Joined | Actions

#### Create User
```
1. Click "+ New User" button
2. Form:
   ├─ Name: [text input]
   ├─ Email: [email input, must be unique]
   ├─ Password: [temporary password, min 8 chars]
   ├─ Role: [dropdown: technician|manager|admin]
   └─ [Cancel] [Create]
3. User created with hashed password
4. Email sent with login credentials (future: email integration)
5. User must change password on first login
```

#### Edit User
```
1. Click pencil icon on row
2. Modal form (cannot edit email):
   ├─ Name: [editable]
   ├─ Email: [read-only]
   ├─ Role: [dropdown to change]
   └─ [Cancel] [Save]
3. PATCH /api/users/:id
   └─ Audit log captures role change
```

#### Reset Password
```
1. Click "Reset Password" button on row
2. Sub-modal:
   ├─ New Password: [text input, min 8 chars]
   └─ [Cancel] [Reset]
3. Password hashed and updated
4. User can login with new password next time
```

#### Delete User
```
1. Click trash icon on row
2. Confirmation: "Delete user? This cannot be undone."
3. User deleted (cannot delete self)
4. Cascade: User's audit log entries remain (for trail)
```

---

### 2. Audit Log Viewer

**URL:** `/audit-log`

**Columns:** Timestamp | User | Action | Entity | Field | Old Value | New Value

#### Features:
- Filter by entity type: project|task|user|client|material
- Filter by entity ID: [text search]
- Load More: Pagination (50 entries per load)
- Copy to Clipboard: Click value to copy

#### Use Cases:
- Who deleted that project? → Search entity_type='project', look for action='delete'
- When did this value change? → Filter by entity_id
- Did someone change the budget? → Search field_name='project_value'
- What did user X do today? → Filter by changed_by

**Audit Entry Example:**
```
2026-04-23 14:30  Manager A  update  project  phase
Old: survey
New: execution
```

---

### 3. System Health & Maintenance

**Future Endpoints (not yet implemented):**
- Database backup status
- API performance metrics
- Error rate dashboard
- Storage usage
- Connection pool status

**Current Actions:**
- Manual database maintenance via Adminer/pgAdmin
- Monitor PostgreSQL logs
- Check API logs for errors

---

## Shared Workflows

### 1. Login & Session Management

**Login Flow:**
```
1. POST /api/auth/login { email, password }
2. Backend:
   ├─ Query user by email
   ├─ bcrypt.compare(password, hash)
   ├─ Generate JWT token (HS256 with secret)
   └─ Return { token, user }
3. Frontend:
   ├─ localStorage.setItem('token', token)
   ├─ localStorage.setItem('user', JSON.stringify(user))
   └─ Redirect to /dashboard
4. Every API request:
   ├─ Header: Authorization: Bearer <token>
   ├─ Backend: JWT.verify(token)
   └─ Proceed if valid, return 401 if expired
```

**Logout Flow:**
```
1. Click "Logout" in sidebar
2. Frontend:
   ├─ localStorage.removeItem('token')
   ├─ localStorage.removeItem('user')
   └─ Redirect to /login
3. Session cleared
```

---

### 2. Evidence Upload

**Process:**
```
1. Task detail modal open
2. Evidence section:
   ├─ Drag file or click to browse
   ├─ Select file(s)
   ├─ Optional: Add description
   └─ Click "Upload"
3. Frontend:
   ├─ Create FormData with file + metadata
   ├─ POST /api/evidence (multipart/form-data)
   ├─ Show progress bar
   └─ Toast: "Uploaded successfully"
4. Backend:
   ├─ multer validates file type and size
   ├─ Save to server/uploads/task_<ID>/<filename>
   ├─ INSERT into task_evidence table
   ├─ Return file metadata
5. Frontend:
   ├─ Add to evidence gallery
   ├─ Refresh task detail
   └─ No page reload needed (TanStack Query)
```

---

### 3. Theme Management

**Dark Mode Toggle:**
```
1. Click theme icon in top bar (sun/moon)
2. Frontend:
   ├─ useTheme hook toggles state
   ├─ Apply 'dark' class to <html>
   ├─ localStorage.setItem('shi-theme', 'dark')
3. All components respond automatically:
   ├─ Background colors inverse
   ├─ Text colors inverse
   ├─ Charts update colors
   └─ Persistence across sessions
```

---

### 4. Real-Time Updates

**TanStack Query Cache Strategy:**

```
Event: Task status changed from 'to_do' to 'in_progress'
   │
   ├─ PATCH /api/tasks/:id response returns updated task
   │
   ├─ queryClient.invalidateQueries({ queryKey: ['tasks'] })
   │
   ├─ All queries with 'tasks' key refetch:
   │  ├─ Task list for project
   │  ├─ Task detail
   │  ├─ My tasks (technician view)
   │  └─ Dashboard summary
   │
   ├─ SPI recalculated on backend
   │  └─ project_health table updated
   │
   ├─ queryClient.invalidateQueries({ queryKey: ['dashboard'] })
   │
   ├─ Dashboard page refetches:
   │  ├─ Summary cards
   │  ├─ Project health list
   │  └─ All 8 charts
   │
   └─ UI re-renders with new data (no manual refresh needed)
```

**Stale Time:** 5 minutes
- After 5 mins, cache marked as stale
- Next query triggers background refetch
- User sees cached data while fresh data loads
- Smooth experience, no loading spinners

---

## Error Scenarios & Recovery

### Scenario 1: Session Expired

**During interaction:**
```
User clicks button → API returns 401 Unauthorized
   │
   ├─ Frontend clears localStorage
   ├─ Redirect to /login
   ├─ Toast: "Session expired, please login again"
```

**Recovery:**
```
User logs in again
   └─ Fresh token issued
   └─ Can resume work
```

---

### Scenario 2: Technician Timer Runs Out

**If timer runs > 24 hours:**
```
Backend check on stop:
   ├─ If elapsed > 24 hours, cap at 24 hours
   ├─ Toast warning: "Timer limited to 24 hours"
   ├─ User can start new timer if needed
```

---

### Scenario 3: Failed Task Status Update

**Concurrent modification:**
```
Manager A clicks "Approve" task
Manager B also clicks "Approve" same task (faster)
   │
   ├─ B's request processes first: status → 'done'
   ├─ A's request arrives: task already 'done'
   ├─ Backend returns error: "Task already done"
   ├─ Frontend shows toast: "Task status changed by another user"
   ├─ Refetch task detail (show current state)
```

---

### Scenario 4: File Upload Failure

**Network issue during upload:**
```
User uploads 50 MB file
Network drops mid-upload
   │
   ├─ Frontend shows failed state
   ├─ User can retry
   ├─ Browser cache prevents re-upload overhead (if supported)
```

