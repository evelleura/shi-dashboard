# 5. Frontend Components & Pages

## Page Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with anti-flash theme script
│   │   ├── globals.css         # Tailwind CSS + dark mode config
│   │   ├── page.tsx            # Landing/login redirect
│   │   └── (protected)/
│   │       └── [...slug]/
│   │           └── page.tsx    # Dynamic routing for all protected pages
│   │
│   ├── views/
│   │   ├── DashboardPage.tsx           # Manager dashboard (summary + charts)
│   │   ├── ProjectsPage.tsx            # Projects list with inline editing
│   │   ├── ProjectDetailPage.tsx       # Project detail with tasks + budget
│   │   ├── ClientsPage.tsx             # Clients CRUD
│   │   ├── TechnicianDashboard.tsx     # Technician dashboard
│   │   ├── TechnicianProjectsPage.tsx  # Technician's assigned projects
│   │   ├── TechnicianTasksPage.tsx     # Technician's tasks (Kanban + Table)
│   │   ├── TechnicianEscalationsPage.tsx
│   │   ├── EscalationsPage.tsx         # Manager escalation handling
│   │   ├── AuditLogPage.tsx            # System audit trail (admin only)
│   │   ├── UserManagementPage.tsx      # User CRUD (admin only)
│   │   ├── ProjectTimelinePage.tsx     # Project timeline visualization
│   │   ├── ReportsPage.tsx             # Interactive reports dashboard
│   │   ├── ProfilePage.tsx             # User profile & settings
│   │   └── LoginPage.tsx               # Interactive login with SHI branding
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Layout.tsx              # Sidebar + topbar + main content
│   │   │   ├── Modal.tsx               # Reusable modal component
│   │   │   ├── DataTable.tsx           # Sortable table with pagination
│   │   │   ├── StatusBadge.tsx         # Color-coded status badges
│   │   │   ├── ProgressBar.tsx         # Progress visualization
│   │   │   ├── EmptyState.tsx          # No data placeholder
│   │   │   ├── ConfirmDialog.tsx       # Delete confirmation
│   │   │   ├── DateRangePicker.tsx     # Bank-style date picker
│   │   │   ├── GlobalSearchBar.tsx     # Global search component
│   │   │   └── NotificationBell.tsx    # Alert notifications
│   │   │
│   │   ├── charts/
│   │   │   ├── ProjectHealthPieChart.tsx       # Green/amber/red pie chart
│   │   │   ├── TasksByStatusChart.tsx          # Task status bar chart
│   │   │   ├── TasksByOwnerChart.tsx           # Technician workload
│   │   │   ├── TasksByDueDateChart.tsx         # Timeline stacked bar
│   │   │   ├── OverdueTasksChart.tsx           # Overtime/deadline visualization
│   │   │   ├── BudgetStatusChart.tsx           # Planned vs actual
│   │   │   ├── EarnedValueChart.tsx            # EV vs PV line chart
│   │   │   └── SummaryStatsCards.tsx           # KPI cards in header
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ProjectCard.tsx                 # Project summary card
│   │   │   └── SummaryCards.tsx                # KPI summary section
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectForm.tsx                 # Create/edit project modal
│   │   │   ├── MaterialsList.tsx               # Materials CRUD table
│   │   │   └── BudgetTable.tsx                 # Budget items CRUD table
│   │   │
│   │   ├── tasks/
│   │   │   ├── KanbanBoard.tsx                 # Kanban view with 5 columns
│   │   │   ├── KanbanCard.tsx                  # Individual task card
│   │   │   ├── TaskTable.tsx                   # List view of tasks
│   │   │   ├── TaskDetailModal.tsx             # Task detail & edit
│   │   │   ├── TaskForm.tsx                    # Create/edit task modal
│   │   │   ├── TaskStatusSelect.tsx            # Status dropdown
│   │   │   ├── TaskTimer.tsx                   # Time tracking control
│   │   │   └── ViewToggle.tsx                  # Kanban/Table toggle
│   │   │
│   │   ├── evidence/
│   │   │   ├── EvidenceUploader.tsx            # Drag-drop file upload
│   │   │   └── EvidenceGallery.tsx             # Evidence file gallery
│   │   │
│   │   └── (other components)
│   │
│   ├── hooks/
│   │   ├── useDashboard.ts           # Dashboard data queries
│   │   ├── useProjects.ts            # Project CRUD hooks
│   │   ├── useTasks.ts               # Task CRUD hooks
│   │   ├── useUsers.ts               # User management hooks
│   │   ├── useTheme.ts               # Dark mode state management
│   │   ├── useAuth.ts                # Authentication state
│   │   └── (others)
│   │
│   ├── lib/
│   │   ├── handlers/                 # API route handlers
│   │   │   ├── projects.ts
│   │   │   ├── tasks.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── users.ts
│   │   │   ├── audit.ts
│   │   │   └── (others)
│   │   │
│   │   ├── db.ts                     # PostgreSQL connection pool
│   │   ├── auth.ts                   # JWT verification
│   │   ├── spiCalculator.ts          # SPI calculation logic
│   │   └── (utilities)
│   │
│   └── types/
│       └── index.ts                  # TypeScript type definitions
```

---

## Key Pages

### 1. LoginPage

**Location:** `frontend/src/views/LoginPage.tsx`

**Features:**
- Interactive split-panel design (55% branding, 45% form)
- SHI logo with animated hexagon and IoT waves
- Floating particles with staggered pulse animations
- Animated input focus rings
- Gradient login button with shadow and hover lift
- Thesis attribution footer

**User Interaction:**
```
1. User enters email and password
2. Click "Login" button
3. POST /api/auth/login
4. Token stored in localStorage
5. Redirect to /dashboard
```

**Dark Mode:** Full support with gradient overlays

---

### 2. Dashboard Page

**Location:** `frontend/src/views/DashboardPage.tsx`

**Components:**
- SummaryStatsCards: KPI cards (total, red, amber, green projects)
- ProjectHealthPieChart: 3D pie showing status distribution
- 6 additional chart components for detailed analytics
- Project health list sorted by criticality (red → amber → green)

**Features:**
- Real-time updates via TanStack Query
- Date range filtering (7 days, 30 days, 3 months, 6 months, all)
- Global search bar (search projects/tasks/clients)
- Notification bell with critical alerts
- Responsive grid layout

**Permissions:** Manager and Admin only

---

### 3. Projects Page

**Location:** `frontend/src/views/ProjectsPage.tsx`

**Features:**
- DataTable with sortable columns
- Inline editing: double-click cells to edit
  - Project name
  - Phase (survey/execution)
  - Status (active/completed/on-hold/cancelled)
  - Project value
- Create/Delete buttons
- Excel export
- Project code column (SHI-YYMMXXX format)

**Modal Forms:**
- ProjectForm for create/edit with client dropdown
- Confirmation dialog for delete

**Permissions:** Manager and Admin only

---

### 4. Project Detail Page

**Location:** `frontend/src/views/ProjectDetailPage.tsx`

**Sections:**
1. Project Header
   - Name, code, client
   - Status/phase badges
   - Health indicator (color-coded)
   - SPI value with threshold color

2. Tasks Kanban Board
   - 5 columns: To Do, In Progress, Working On It, Review, Done
   - Overtime (working_on_it past due) in orange
   - Over Deadline (to_do past due) in red
   - Click card to open detail modal

3. Task Table View
   - Alternative list view with columns: name, assignee, status, due date, evidence count
   - Toggle between Kanban and Table

4. Materials List
   - CRUD for project materials
   - Quantity × unit_price = total_price

5. Budget Items
   - Planned vs actual budget tracking
   - Category filtering

6. Team Members
   - Assigned technicians
   - Assign/unassign dialog

**Task Detail Modal:**
- View/edit task fields
- Upload evidence with gallery
- Activity feed
- Time tracking start/stop button

**Permissions:** Manager (full access), Technician (view assigned tasks only)

---

### 5. Tasks Pages

#### Technician Tasks View
**Location:** `frontend/src/views/TechnicianTasksPage.tsx`

**Features:**
- Kanban board (my assigned tasks only)
- Task status: to_do → in_progress → working_on_it (with timer) → review (pending manager)
- Timer start/stop button on card
- Time spent counter
- Evidence upload inline

**Permissions:** Technician only

#### Manager Task Management
**Integrated in ProjectDetailPage**

**Permissions:** Manager only

---

### 6. Audit Log Page

**Location:** `frontend/src/views/AuditLogPage.tsx`

**Columns:**
- Timestamp
- User who made change
- Action (create/update/delete)
- Entity (project/task/user/client)
- Field changed
- Old value → New value

**Features:**
- Filter by entity type
- Load more pagination
- Color-coded actions
- Copy value to clipboard

**Permissions:** Admin only

---

### 7. User Management Page

**Location:** `frontend/src/views/UserManagementPage.tsx`

**Features:**
- DataTable: name, email, role badge, joined date
- Create user button (modal form)
- Edit user button (update name/email/role)
- Delete user button (confirmation)
- Reset password button (modal with new password)

**Modals:**
- CreateUserModal: name, email, password, role
- EditUserModal: name, email, role (password via separate reset)
- ResetPasswordModal: enter new password

**Permissions:** Admin only

---

### 8. Project Timeline Page

**Location:** `frontend/src/views/ProjectTimelinePage.tsx`

**Features:**
- Horizontal timeline bars for all projects
- Color-coded by health (green/amber/red/gray)
- Today marker line
- Month labels
- Progress fill % inside bar
- SPI label on bar
- Filter by status
- Sort by start/end/health
- Responsive scrolling

**Interactions:**
- Hover bar to see details
- Click to navigate to project detail

**Permissions:** Manager and Admin

---

### 9. Reports Page

**Location:** `frontend/src/views/ReportsPage.tsx`

**Features:**
- Interactive data table
- Every row clickable for detail
- Inline status/phase dropdown per row
- Edit modal with full form
- Quick actions (eye icon to view, pencil to edit)
- Print and Excel export buttons
- Date range filtering
- Sortable columns

**Permissions:** Manager and Admin

---

### 10. Profile Page

**Location:** `frontend/src/views/ProfilePage.tsx`

**Features:**
- Edit name and email
- Change password (requires current password)
- Theme toggle (Light/Dark buttons)
- Display current role and user info

**Permissions:** All logged-in users

---

## Chart Components (8 types)

### 1. ProjectHealthPieChart
- 3D pie chart showing green/amber/red distribution
- Percentage labels
- Dark mode colors

### 2. TasksByStatusChart
- Horizontal bar chart
- Shows count per status
- Color-coded by status

### 3. TasksByOwnerChart
- Stacked bar chart
- Each technician's task breakdown (done/in_progress/working/to_do)
- Sortable by name/completion

### 4. TasksByDueDateChart
- Stacked area chart
- Monthly task progression
- Overtime/overdue as separate series

### 5. OverdueTasksChart
- Grouped bar chart
- Overtime vs over_deadline per project
- Red/orange coloring

### 6. BudgetStatusChart
- Grouped bar chart
- Planned vs actual per project
- Variance calculation

### 7. EarnedValueChart
- Line chart with dual axes
- PV (planned), EV (earned), SPI (right axis)
- Shows schedule variance visually

### 8. SummaryStatsCards
- 4 key metric cards
- Total projects, red, amber, green counts
- Large typography, color-coded borders

---

## UI Components (Reusable)

### Modal
**Props:**
```typescript
interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Backdrop click to close
- Escape key to close
- Centered on screen
- Dark mode support

---

### DataTable
**Props:**
```typescript
interface Props {
  data: unknown[];
  columns: Column[];
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  onRowClick?: (row: unknown) => void;
}
```

**Features:**
- Sortable headers
- Pagination controls
- Row hover styling
- Responsive layout

---

### StatusBadge
**Props:**
```typescript
interface Props {
  status: TaskStatus;
  size?: 'sm' | 'md';
  interactive?: boolean;
}
```

**Statuses & Colors:**
- to_do: gray
- in_progress: blue
- working_on_it: green (with pulsing dot)
- review: purple
- done: emerald

---

### DateRangePicker
**Features:**
- Bank-style single dropdown
- Presets: 7 days, 30 days, 3 months, 6 months, this year, all
- Dual-click calendar for custom range
- Indonesian locale
- Dark mode support

---

### TaskTimer
**Props:**
```typescript
interface Props {
  taskId: number;
  isTracking: boolean;
  timeSpent: number;
  onStart: () => void;
  onStop: () => void;
}
```

**Display:**
- Play/pause button
- Time spent counter (HH:MM:SS)
- Loading spinner during request

---

### GlobalSearchBar
**Props:**
```typescript
interface Props {
  onSearch: (results: SearchResult[]) => void;
}
```

**Features:**
- Real-time search (min 2 chars)
- Result grouping by type (project/task/client)
- Navigate on result click
- Keyboard shortcuts (Cmd+K / Ctrl+K)

---

### NotificationBell
**Features:**
- Pulsing red badge with count
- Dropdown menu showing alerts
- Types: critical projects, warning projects, overtime tasks, open escalations
- Click to navigate to relevant section

---

## Hooks (Custom)

### useDashboard
```typescript
const {
  summary,
  projects,
  healthPie,
  statusChart,
  ownerChart,
  // ... 8 chart queries
  dateRange,
  setDateRange,
  isLoading,
} = useDashboard();
```

**Features:**
- Parallel query optimization
- Date range support on all queries
- Automatic refetch on date change

---

### useProjects
```typescript
const {
  projects,
  createProject,
  updateProject,
  deleteProject,
  isLoading,
  error,
} = useProjects();
```

**Mutations:**
- createProject: returns new project ID
- updateProject: triggers audit log
- deleteProject: with confirmation

---

### useTasks
```typescript
const {
  tasks,
  createTask,
  updateTask,
  deleteTask,
  startTimer,
  stopTimer,
  isLoading,
} = useTasks(projectId);
```

---

### useTheme
```typescript
const { theme, toggle, setTheme, isDark } = useTheme();
// theme: 'light' | 'dark'
// isDark: boolean
```

**Storage:**
- localStorage key: 'shi-theme'
- Persists across sessions
- Detects system preference on first load

---

### useAuth
```typescript
const { user, token, login, logout, isAuthenticated } = useAuth();
```

---

## Dark Mode Implementation

### Tailwind CSS Configuration
```css
/* globals.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

/* Override recharts tooltip in dark mode */
.dark .recharts-tooltip-wrapper .recharts-default-tooltip {
  background-color: rgba(31, 41, 55, 0.95) !important;
  border-color: rgb(75, 85, 99) !important;
}
```

### Anti-Flash Script
```html
<!-- layout.tsx <head> -->
<script>
  (function() {
    const theme = localStorage.getItem('shi-theme') || 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  })();
</script>
```

### Component Patterns
```tsx
// Dark mode with utility classes
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  
// Charts with dark variants
<div className="dark:bg-gray-800/50 dark:border-gray-700">
```

---

## Styling & Tailwind v4

### Custom Variants
```css
@custom-variant dark (&:where(.dark, .dark *));
```

### Color Scheme
**Light Mode:**
- Backgrounds: white, gray-50, gray-100
- Text: gray-900, gray-700, gray-600
- Borders: gray-200, gray-300

**Dark Mode:**
- Backgrounds: gray-800, gray-900, gray-950
- Text: gray-100, gray-300, gray-400
- Borders: gray-700, gray-600

### Responsive Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

---

## Performance Optimizations

1. **Code Splitting:** Each page in separate chunk
2. **Image Optimization:** Next.js Image component
3. **Query Caching:** 5-min stale time on all queries
4. **Memoization:** React.memo on chart components
5. **Virtual Scrolling:** DataTable with 100+ rows (future)

---

## Accessibility Features

- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Color not sole indicator (text labels too)
- Focus rings on inputs
- Alt text on images
- Semantic HTML (button, a, label)

