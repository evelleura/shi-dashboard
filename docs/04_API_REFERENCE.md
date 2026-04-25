# 4. API Endpoints Reference

Base URL: `http://localhost:3000/api`

---

## Authentication (4 endpoints)

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    }
  }
}
```

**Errors:**
- 400: Invalid email or password
- 500: Server error

---

### POST /auth/register
Create new user account (managers/admins only).

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "technician"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "technician"
  }
}
```

---

### GET /auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager"
  }
}
```

**Errors:**
- 401: Not authenticated

---

### POST /auth/logout
Logout current user (clears token on frontend).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Projects (8 endpoints)

### GET /projects
List all projects with health status and latest progress.

**Query Parameters:**
- `status`: Filter by status (active|completed|on-hold|cancelled)
- `phase`: Filter by phase (survey|execution)
- `client_id`: Filter by client

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "project_code": "SHI-2604001",
      "name": "Smart Home Installation - PT ABC",
      "description": "...",
      "client_id": 1,
      "client_name": "PT ABC",
      "start_date": "2026-04-01",
      "end_date": "2026-05-01",
      "duration": 30,
      "status": "active",
      "phase": "execution",
      "project_value": 50000000,
      "survey_approved": true,
      "spi_value": 0.92,
      "health_status": "amber",
      "total_tasks": 10,
      "completed_tasks": 8,
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

### POST /projects
Create new project (manager|admin only).

**Request:**
```json
{
  "name": "New Smart Home Project",
  "description": "Installation at client site",
  "client_id": 1,
  "start_date": "2026-04-15",
  "end_date": "2026-05-15",
  "project_value": 75000000,
  "target_description": "Complete survey phase",
  "phase": "survey"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "project_code": "SHI-2604005",
    "name": "New Smart Home Project",
    ...
  }
}
```

**Errors:**
- 400: Invalid input or dates
- 403: Insufficient permissions

---

### GET /projects/:id
Get project detail with all related data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "project_code": "SHI-2604001",
    "name": "Smart Home Installation - PT ABC",
    "tasks": [
      {
        "id": 1,
        "name": "Site survey",
        "status": "done",
        "assigned_to_name": "Technician A",
        "due_date": "2026-04-10",
        "budget": 1000000,
        "evidence_count": 3
      }
    ],
    "materials": [
      {
        "id": 1,
        "name": "Smart switch module",
        "quantity": 10,
        "unit": "pcs",
        "unit_price": 150000,
        "total_price": 1500000
      }
    ],
    "budget_items": [
      {
        "id": 1,
        "category": "Material",
        "amount": 25000000,
        "is_actual": false
      }
    ],
    "assigned_technicians": [
      {
        "id": 2,
        "name": "Technician A",
        "email": "tech-a@example.com"
      }
    ],
    "health": {
      "spi_value": 0.92,
      "status": "amber",
      "completed_tasks": 8,
      "total_tasks": 10
    }
  }
}
```

---

### PATCH /projects/:id
Update project (manager|admin only).

**Request:**
```json
{
  "name": "Updated project name",
  "status": "on-hold",
  "phase": "execution",
  "project_value": 80000000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated project */ }
}
```

---

### DELETE /projects/:id
Delete project (manager|admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

**Note:** Cascade deletes tasks, evidence, budget items, materials

---

### POST /projects/:id/approve-survey
Approve survey phase, transition to execution (manager|admin only).

**Request:**
```json
{
  "phase": "execution"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated project with phase='execution' */ }
}
```

---

### GET /projects/:id/health
Get project health status and SPI details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "project_id": 1,
    "spi_value": 0.92,
    "status": "amber",
    "deviation_percent": -8.0,
    "actual_progress": 80,
    "planned_progress": 90,
    "total_tasks": 10,
    "completed_tasks": 8,
    "working_tasks": 1,
    "overtime_tasks": 1,
    "overdue_tasks": 0,
    "last_updated": "2026-04-23T15:30:00Z"
  }
}
```

---

## Tasks (8 endpoints)

### GET /tasks
List all tasks (with optional filtering).

**Query Parameters:**
- `project_id`: Filter by project
- `status`: Filter by status
- `assigned_to`: Filter by assigned user

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "project_id": 1,
      "project_name": "Smart Home Installation - PT ABC",
      "name": "Site survey",
      "assigned_to_name": "Technician A",
      "status": "done",
      "due_date": "2026-04-10",
      "timeline_start": "2026-04-01",
      "timeline_end": "2026-04-10",
      "budget": 1000000,
      "is_tracking": false,
      "time_spent_seconds": 7200,
      "evidence_count": 3,
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

### POST /tasks
Create new task (manager|admin only).

**Request:**
```json
{
  "project_id": 1,
  "name": "Install smart switches",
  "description": "Install all smart switch modules",
  "assigned_to": 2,
  "due_date": "2026-04-20",
  "timeline_start": "2026-04-15",
  "timeline_end": "2026-04-20",
  "budget": 2000000,
  "is_survey_task": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* created task */ }
}
```

---

### GET /tasks/:id
Get task detail.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "Site survey",
    "assigned_to": 2,
    "assigned_to_name": "Technician A",
    "status": "done",
    "due_date": "2026-04-10",
    "budget": 1000000,
    "is_tracking": false,
    "time_spent_seconds": 7200,
    "evidence_count": 3,
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

---

### PATCH /tasks/:id
Update task (manager|admin, or assigned technician for status change).

**Request:**
```json
{
  "status": "in_progress",
  "assigned_to": 3,
  "due_date": "2026-04-25"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated task */ }
}
```

**Note:** Changing status triggers SPI recalculation

---

### DELETE /tasks/:id
Delete task (manager|admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted"
}
```

**Note:** Also deletes all associated evidence

---

### POST /tasks/:id/timer-start
Start time tracking on task (technician only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_tracking": true,
    "timer_started_at": "2026-04-23T14:30:00Z"
  }
}
```

---

### POST /tasks/:id/timer-stop
Stop time tracking and accumulate time_spent_seconds.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_tracking": false,
    "time_spent_seconds": 3600,
    "timer_started_at": null
  }
}
```

---

## Evidence Upload (4 endpoints)

### GET /evidence
List all evidence for a task.

**Query Parameters:**
- `task_id`: Task ID (required)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_id": 1,
      "file_name": "site-photo-1.jpg",
      "file_type": "photo",
      "file_size": 2048576,
      "uploaded_by_name": "Technician A",
      "uploaded_at": "2026-04-10T10:00:00Z"
    }
  ]
}
```

---

### POST /evidence
Upload evidence file for a task (multipart/form-data).

**Form Fields:**
- `task_id`: Task ID
- `file`: Binary file data
- `file_type`: photo|document|form|screenshot|other
- `description`: Optional caption

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "task_id": 1,
    "file_name": "evidence.jpg",
    "file_path": "uploads/task_1/evidence.jpg",
    "file_type": "photo",
    "file_size": 2048576,
    "uploaded_by": 2,
    "uploaded_at": "2026-04-10T10:00:00Z"
  }
}
```

**Constraints:**
- Max file size: 50MB
- Allowed types: jpg, jpeg, png, pdf, doc, docx, xls, xlsx

---

### GET /evidence/:id/download
Download evidence file.

**Response:** Binary file data with appropriate Content-Type

---

### DELETE /evidence/:id
Delete evidence file (uploader or admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Evidence deleted"
}
```

---

## Dashboard (14 endpoints)

### GET /dashboard
Get dashboard summary cards.

**Query Parameters:**
- `start_date`: Optional YYYY-MM-DD
- `end_date`: Optional YYYY-MM-DD

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_projects": 15,
    "active_projects": 12,
    "total_red": 2,
    "total_amber": 3,
    "total_green": 7,
    "total_no_health": 3,
    "avg_spi": 0.89,
    "total_tasks": 150,
    "completed_tasks": 120,
    "in_progress_tasks": 15,
    "working_tasks": 10,
    "review_tasks": 3,
    "overtime_tasks": 5,
    "over_deadline_tasks": 2,
    "overdue_projects": 1
  }
}
```

---

### GET /dashboard/health
Get list of all projects with health status (sorted by criticality).

**Query Parameters:**
- `sort_by`: spi|end_date|name

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "project_code": "SHI-2604001",
      "name": "Project A",
      "spi_value": 0.70,
      "health_status": "red",
      "total_tasks": 10,
      "completed_tasks": 7,
      "end_date": "2026-04-25"
    }
  ]
}
```

---

### GET /dashboard/charts/status
Task status distribution.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "status": "to_do", "count": 20, "percentage": 13.3 },
    { "status": "in_progress", "count": 15, "percentage": 10.0 },
    { "status": "working_on_it", "count": 10, "percentage": 6.7 },
    { "status": "review", "count": 5, "percentage": 3.3 },
    { "status": "done", "count": 100, "percentage": 66.7 }
  ]
}
```

---

### GET /dashboard/charts/owner
Tasks by assigned technician.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 2,
      "name": "Technician A",
      "total": 25,
      "done": 20,
      "in_progress": 3,
      "working": 1,
      "review": 1,
      "overtime": 1,
      "to_do": 4
    }
  ]
}
```

---

### GET /dashboard/charts/due-date
Tasks by due date (monthly breakdown).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "month": "2026-04",
      "to_do": 10,
      "in_progress": 8,
      "working_on_it": 5,
      "review": 2,
      "done": 25,
      "overtime": 3,
      "over_deadline": 2
    }
  ]
}
```

---

### GET /dashboard/charts/overdue
Overdue and overtime tasks by project.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "project_id": 1,
      "project_name": "Project A",
      "overtime": 3,
      "over_deadline": 1
    }
  ]
}
```

---

### GET /dashboard/charts/budget
Budget planned vs actual by project.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "project_id": 1,
      "name": "Project A",
      "planned": 50000000,
      "actual": 48500000
    }
  ]
}
```

---

### GET /dashboard/charts/earned-value
Earned value (EV) vs planned value (PV) trend.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "project_id": 1,
      "timeline": [
        {
          "date": "2026-04-01",
          "pv": 16.7,
          "ev": 20.0,
          "spi": 1.20
        }
      ]
    }
  ]
}
```

---

### GET /dashboard/charts/categories
Projects by phase (survey vs execution).

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "phase": "survey", "count": 3 },
    { "phase": "execution", "count": 12 }
  ]
}
```

---

### GET /dashboard/charts/technician-workload
Technician workload distribution.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 2,
      "name": "Technician A",
      "total": 25,
      "done": 20,
      "in_progress": 3,
      "overtime": 1
    }
  ]
}
```

---

### GET /dashboard/charts/spi-trend
SPI trend over time (weekly averages).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "week_start": "2026-04-01",
      "avg_spi": 0.92,
      "project_count": 10
    }
  ]
}
```

---

### GET /dashboard/charts/recent-activity
Recent activity log (last 10 actions).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "task_completed",
      "item_name": "Site survey",
      "project_name": "Project A",
      "user_name": "Technician A",
      "activity_at": "2026-04-23T14:30:00Z"
    }
  ]
}
```

---

### GET /dashboard/charts/tech-productivity
Technician task completion per week.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "week_start": "2026-04-01",
      "completed": 8
    }
  ]
}
```

---

### GET /dashboard/charts/tech-time-spent
Total time spent per technician per project.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "project_id": 1,
      "project_name": "Project A",
      "hours": 40.5
    }
  ]
}
```

---

### GET /dashboard/search
Global search across projects, tasks, and clients.

**Query Parameters:**
- `q`: Search query (min 2 characters)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "project",
      "id": 1,
      "name": "Smart Home Installation",
      "subtitle": "PT ABC",
      "url": "/projects/1"
    },
    {
      "type": "task",
      "id": 1,
      "name": "Site survey",
      "subtitle": "Project A",
      "url": "/projects/1#task-1"
    }
  ]
}
```

---

## Users (7 endpoints)

### GET /users
List all users (admin only).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

### POST /users
Create new user (admin only).

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "temporary123",
  "role": "technician"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* created user */ }
}
```

---

### PATCH /users/:id
Update user (admin only).

**Request:**
```json
{
  "name": "Jane Smith Updated",
  "role": "manager"
}
```

---

### DELETE /users/:id
Delete user (admin only, cannot delete self).

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

### POST /users/:id/reset-password
Reset user password (admin only).

**Request:**
```json
{
  "new_password": "newpass123"
}
```

---

### PATCH /users/me
Update own profile (all users).

**Request:**
```json
{
  "name": "John Doe Updated"
}
```

---

### POST /users/me/change-password
Change own password (all users).

**Request:**
```json
{
  "current_password": "oldpass123",
  "new_password": "newpass456"
}
```

---

## Clients (5 endpoints)

### GET /clients
List all clients.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "PT ABC",
      "address": "Jln. Smart Home No. 1",
      "phone": "0274-123456",
      "email": "contact@ptabc.com",
      "project_count": 5
    }
  ]
}
```

---

### POST /clients
Create new client (manager|admin).

**Request:**
```json
{
  "name": "PT XYZ",
  "address": "Jln. Smart Home No. 2",
  "phone": "0274-789012",
  "email": "contact@ptxyz.com"
}
```

---

### GET /clients/:id
Get client detail with projects.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "PT ABC",
    "projects": [ /* list of projects */ ]
  }
}
```

---

### PATCH /clients/:id
Update client (manager|admin).

---

### DELETE /clients/:id
Delete client (manager|admin, only if no projects).

---

## Materials (4 endpoints)

### GET /materials/:projectId
List project materials.

---

### POST /materials
Create material (manager|admin).

---

### PATCH /materials/:id
Update material (manager|admin).

---

### DELETE /materials/:id
Delete material (manager|admin).

---

## Budget (4 endpoints)

### GET /budget/:projectId
List project budget items (planned + actual).

---

### POST /budget
Create budget item (manager|admin).

---

### PATCH /budget/:id
Update budget item (manager|admin).

---

### DELETE /budget/:id
Delete budget item (manager|admin).

---

## Audit Log (2 endpoints)

### GET /audit-log
List audit log entries (admin only, paginated).

**Query Parameters:**
- `entity_type`: Filter by entity type
- `entity_id`: Filter by specific entity
- `limit`: Entries per page (default 50)
- `offset`: Pagination offset (default 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "entity_type": "project",
        "entity_id": 1,
        "entity_name": "Project A",
        "action": "update",
        "field_name": "status",
        "old_value": "active",
        "new_value": "on-hold",
        "changed_by_name": "Manager A",
        "created_at": "2026-04-23T14:30:00Z"
      }
    ],
    "total": 2456
  }
}
```

---

### GET /audit-log/:entityType/:entityId
Get audit history for specific entity.

**Response (200):**
```json
{
  "success": true,
  "data": [
    /* audit entries for this entity */
  ]
}
```

---

## Escalations (5 endpoints)

### GET /escalations
List escalations (filtered by role).

---

### POST /escalations
Create escalation (technician can escalate assigned tasks).

---

### GET /escalations/:id
Get escalation detail.

---

### PATCH /escalations/:id
Update escalation status (manager|admin).

---

### DELETE /escalations/:id
Delete escalation (manager|admin).

