# Diagrams Manifest & Generation Guide

## Diagrams Required for Thesis

The following diagrams are referenced throughout the thesis and should be created using draw.io (https://draw.io):

### 1. USE_CASE.drawio
**Type:** UML Use Case Diagram  
**Scope:** System actors and main functional use cases

**Contents:**
- **Actors:** Technician, Manager, Admin
- **Use Cases (18 total):**
  - Technician: Login, Daily Report, Upload Evidence, View Tasks, Update Status, Self-Performance Dashboard
  - Manager: Login, View Dashboard, View Metrics, Monitor EWS, Approve Tasks, Manage Projects, Manage Clients, Manage Tasks, View Reports, Manage Budget, Manage Materials
  - Admin: Manage Users, System Settings

**Relationships:**
- Include: Daily Report <<include>> Upload Evidence
- Extend: Dashboard <<extend>> EWS Alert
- Associations: Actors to use cases

**Export Formats:** .drawio (native), PNG (preview), SVG (vector)

---

### 2. ACTIVITY_DIAGRAM.drawio
**Type:** UML Activity Diagram (6 diagrams)  
**Scope:** Business process flows and system behavior

**Diagram 2.1: Login & Logout**
- Start → Input Credentials → Validate → Check Role → Load Dashboard → End
- Logout flow

**Diagram 2.2: Daily Report & Auto-Assessment (KEY)**
- Technician fills form → Submit → Backend stores → Auto-calculate SPI → Update project_health → Dashboard refreshes
- Shows automatic SPI recalculation trigger

**Diagram 2.3: Project Management**
- CRUD projects, assign technicians, manage budget/materials

**Diagram 2.4: Dashboard View**
- Load projects → Fetch health data → Render charts → Sort by status → Display alerts

**Diagram 2.5: Task Kanban**
- View tasks → Organize by status → Update status → Refresh Kanban

**Diagram 2.6: Escalation & Review**
- Monitor alerts → Review constraints → Take action → Mark done

**Key Elements:**
- Start/end nodes (filled circles)
- Activities (rounded rectangles)
- Decisions (diamonds)
- Fork/join (thick lines for parallel processing)
- Arrows showing flow direction

---

### 3. SEQUENCE_DIAGRAM.drawio
**Type:** UML Sequence Diagram (6 diagrams)  
**Scope:** Message interactions between system components

**Diagram 3.1: Login Sequence**
```
User → UI → Auth API → Database → Session
```

**Diagram 3.2: Daily Report Submission (KEY)**
```
Technician → Form UI → Backend → Database → 
SPI Calculation → project_health Update → 
API Response → Dashboard Auto-Update
```

**Diagram 3.3: Project Management**
```
Manager → Project Form → CRUD API → Database → List API → UI Update
```

**Diagram 3.4: Dashboard Real-Time Update**
```
Database → Backend (SPI calc) → API → TanStack Query → 
Frontend (detect change) → Chart Re-render → Browser Display
```

**Diagram 3.5: Task Status Change**
```
Technician → Kanban UI → Update API → Database → 
Notification API → Manager Browser (update)
```

**Diagram 3.6: Task Approval**
```
Manager → Kanban UI → Mark Done API → Database → 
Task Count Update → Dashboard Charts Refresh
```

**Key Elements:**
- Actor (stick figure)
- Lifeline (dashed vertical line)
- Activation box (thin rectangle on lifeline)
- Synchronous message (solid arrow)
- Asynchronous message (dashed arrow)
- Return message (dashed arrow back)

---

### 4. CLASS_DIAGRAM.drawio
**Type:** UML Class Diagram  
**Scope:** Entity structure and object relationships

**Classes (8 main):**
1. **User**
   - Properties: id, email, name, role, password_hash
   - Methods: authenticate(), hasPermission(), getAssignedProjects()

2. **Project**
   - Properties: id, name, client_id, start_date, end_date, status, phase
   - Methods: calculateSPI(), getHealthStatus(), getTasks(), getDailyReports()

3. **DailyReport**
   - Properties: id, project_id, report_date, progress_percentage, constraints
   - Methods: validate(), trigger_spi_calculation()

4. **ProjectHealth**
   - Properties: project_id, spi_value, status, deviation_percent, last_updated
   - Methods: updateFromDailyReport(), getRAGIndicator()

5. **Task**
   - Properties: id, project_id, assigned_to, status, due_date
   - Methods: isOvertime(), isOverDeadline(), canMarkDone(), getEvidence()

6. **Client**
   - Properties: id, name, address, phone, email
   - Methods: getProjects()

7. **TaskEvidence**
   - Properties: id, task_id, file_path, file_name, file_type, file_size

8. **Material**
   - Properties: id, project_id, name, quantity, unit, unit_price

**Relationships:**
- Association (solid line)
- Inheritance/Generalization (solid line + triangle)
- Composition (solid diamond)
- Aggregation (hollow diamond)
- Dependency (dashed line)
- Cardinality (1, N, 1..N at line ends)

---

### 5. STATECHART_TASK.drawio
**Type:** State Machine Diagram  
**Scope:** Task lifecycle and state transitions

**States:**
1. **TO_DO** (initial state)
   - Entry action: Task created
   - Transition trigger: Start Work (by Technician)
   - Target: WORKING_ON_IT

2. **WORKING_ON_IT** (intermediate state)
   - Entry action: Mark task as in progress
   - Transition trigger: Manager approves completion
   - Target: DONE

3. **DONE** (terminal state)
   - Entry action: Mark completion time
   - Exit action: Update task count in dashboard

**Computed Overlay States (NOT in database):**
- **OVERTIME:** Guard condition: status = WORKING_ON_IT AND due_date < TODAY
  - Visual rendering: Highlighted in orange/red on Kanban
- **OVER_DEADLINE:** Guard condition: status = TO_DO AND due_date < TODAY
  - Visual rendering: Highlighted in red on Kanban

**Key Elements:**
- State (rectangle with rounded corners)
- Initial state (filled circle)
- Final state (filled circle in circle)
- Transition arrow with event/action
- Guard condition in square brackets

---

### 6. DATABASE_ERD.drawio
**Type:** Entity Relationship Diagram  
**Scope:** Database logical structure

**Entities (10):**
```
users
├─ id (PK)
├─ email (UNIQUE)
├─ name
├─ role
└─ password_hash

clients
├─ id (PK)
├─ name
├─ address
├─ phone
└─ email

projects
├─ id (PK)
├─ name
├─ client_id (FK)
├─ start_date
├─ end_date
├─ status
└─ phase

... (and 7 more tables)
```

**Relationships:**
- clients 1 → N projects (one client has many projects)
- projects 1 → N tasks (one project has many tasks)
- projects 1 → N daily_reports (one project has many reports)
- projects 1 → 1 project_health (one health record per project - denormalized)
- users N ← → N projects (via project_assignments - many-to-many)
- tasks 1 → N task_evidence (one task has many evidence files)
- projects 1 → N materials (one project has many materials)
- projects 1 → N budget_items (one project has many budget items)

**Key Elements:**
- Entity box (rectangle)
- Attribute (listed inside entity)
- PK indicator (underline)
- FK indicator (parentheses)
- Relationship line (crow's foot notation)
- Cardinality (1, N at line endpoints)
- Relationship name (on line)

---

### 7. DEPLOYMENT_DIAGRAM.drawio
**Type:** Deployment Architecture Diagram  
**Scope:** System infrastructure and component distribution

**Nodes:**
1. **Client Node**
   - Browser
   - React 19 Application
   - TanStack Query State Manager

2. **Web Server Node**
   - Next.js Server
   - Express API Server
   - Authentication Service

3. **Application Server Node**
   - Business Logic Layer (SPI calculation)
   - API Controllers
   - Service Layer

4. **Database Node**
   - PostgreSQL Instance
   - 10 Database Tables
   - Backup Instance

5. **File Storage Node**
   - Local Disk (server/uploads/)
   - Evidence Files Directory

**Connections:**
- Client ←HTTPS→ Web Server
- Web Server ←REST API→ Application Server
- Application Server ←SQL→ Database
- Application Server ←File I/O→ File Storage

**Deployment Variants:**
- Development: localhost (all on one machine)
- Staging: Separate servers, same network
- Production: Load-balanced, replicated database, backups

---

## How to Create These Diagrams

### Option 1: Using draw.io Web App
1. Go to https://draw.io
2. Create new diagram
3. Select appropriate diagram type from template
4. Add shapes, connectors, labels
5. Export as .drawio file
6. Save to `/thesis/DIAGRAMS/` directory

### Option 2: Using draw.io Desktop
1. Download draw.io Desktop from https://github.com/jgraph/drawio-desktop
2. Open application
3. Create new diagram
4. Follow steps 3-6 from Option 1

### Option 3: Using draw.io VS Code Extension
1. Install "Draw.io Integration" extension in VS Code
2. Create .drawio file
3. Edit with integrated editor
4. Save automatically

---

## File Naming Convention

```
DIAGRAMS/
├── USE_CASE.drawio
├── ACTIVITY_DIAGRAM.drawio
├── SEQUENCE_DIAGRAM.drawio
├── CLASS_DIAGRAM.drawio
├── STATECHART_TASK.drawio
├── DATABASE_ERD.drawio
├── DEPLOYMENT_DIAGRAM.drawio
└── DIAGRAMS_MANIFEST.md (this file)
```

---

## Export Instructions

### For Thesis Printing
1. Open .drawio file in draw.io
2. File → Export As → PNG (for color) or SVG (for vector)
3. Set resolution: 300 DPI for print quality
4. Embed in thesis PDF

### For Digital Distribution
1. Keep native .drawio files for editing
2. Export to SVG for web (scalable)
3. Export to PNG for presentations

### For Technical Documentation
1. Embed SVG in markdown documents
2. Or provide .drawio file with link to edit on draw.io

---

## Diagram Dependencies

```
USE_CASE.drawio
  ├─ Defines scope for ACTIVITY_DIAGRAM
  └─ Defines scope for SEQUENCE_DIAGRAM

ACTIVITY_DIAGRAM.drawio
  └─ Details the flows outlined in USE_CASE

SEQUENCE_DIAGRAM.drawio
  └─ Shows message exchanges for ACTIVITY flows

CLASS_DIAGRAM.drawio
  ├─ Implements entities from DATABASE_ERD
  └─ Supports SEQUENCE message types

DATABASE_ERD.drawio
  └─ Physical design of CLASS_DIAGRAM entities

STATECHART_TASK.drawio
  ├─ Derived from Task entity in CLASS_DIAGRAM
  └─ Affects task-related SEQUENCE diagrams

DEPLOYMENT_DIAGRAM.drawio
  └─ Shows architectural implementation of entire system
```

---

## Completeness Checklist

### USE_CASE.drawio
- [ ] All 3 actors shown (Technician, Manager, Admin)
- [ ] All 18 use cases represented
- [ ] Include relationships clearly marked
- [ ] Extend relationships shown where applicable
- [ ] System boundary defined
- [ ] Legend/notes present

### ACTIVITY_DIAGRAM.drawio
- [ ] 6 separate activity diagrams included
- [ ] Start/end nodes present
- [ ] All activities clearly labeled
- [ ] Decisions (diamonds) for branching
- [ ] Fork/join for parallel processing
- [ ] Flow arrows directional and clear

### SEQUENCE_DIAGRAM.drawio
- [ ] 6 sequence diagrams showing key flows
- [ ] All actors/objects shown as lifelines
- [ ] Messages (sync and async) clearly indicated
- [ ] Return messages shown
- [ ] Activation boxes showing processing
- [ ] Timing sequence visible (top to bottom)

### CLASS_DIAGRAM.drawio
- [ ] 8 main entity classes defined
- [ ] All attributes listed with types
- [ ] All methods documented
- [ ] Relationships with correct cardinality
- [ ] Inheritance/composition clearly shown
- [ ] Multiplicity correct (1, N, 0..1, 1..*)

### STATECHART_TASK.drawio
- [ ] 3 main states (TO_DO, WORKING_ON_IT, DONE)
- [ ] 2 computed overlay states shown
- [ ] Transitions with triggers labeled
- [ ] Entry/exit actions documented
- [ ] Guard conditions in square brackets
- [ ] Initial and terminal states marked

### DATABASE_ERD.drawio
- [ ] All 10 entities/tables shown
- [ ] All relationships drawn
- [ ] Primary keys underlined
- [ ] Foreign keys indicated
- [ ] Cardinality notation correct (1, N, M:N)
- [ ] Crow's foot notation used consistently

### DEPLOYMENT_DIAGRAM.drawio
- [ ] 5 nodes shown (Client, Web Server, App, DB, Storage)
- [ ] Connections/dependencies shown
- [ ] Component distribution clear
- [ ] Technologies labeled
- [ ] Multiple deployment variants shown (dev, staging, prod)

---

## Notes

- All .drawio files are XML-based text files (can be version controlled with Git)
- Diagrams are editable and can be updated as design evolves
- Export to PNG/SVG for static documentation
- Maintain single source of truth in .drawio files
- Use consistent styling/colors across all diagrams
- Add version/date notes to complex diagrams

---

## Related Documentation

- See `05_UML_DIAGRAMS.md` for detailed diagram descriptions
- See `04_DATA_MODEL.md` for database table details
- See `03_ARCHITECTURE.md` for system architecture context
- See `06_IMPLEMENTATION.md` for technical implementation details

