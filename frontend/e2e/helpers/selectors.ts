export const SEL = {
  // Auth
  loginEmail: '[data-testid="login-email"], input[type="email"], input[name="email"]',
  loginPassword: '[data-testid="login-password"], input[type="password"], input[name="password"]',
  loginSubmit: '[data-testid="login-submit"], button[type="submit"]',

  // Navigation
  navDashboard: '[data-testid="nav-dashboard"], a[href="/dashboard"]',
  navProjects: '[data-testid="nav-projects"], a[href="/projects"]',
  navClients: '[data-testid="nav-clients"], a[href="/clients"]',

  // Projects
  createProjectBtn: '[data-testid="create-project-btn"], button:has-text("Tambah Proyek"), button:has-text("New Project")',
  projectCard: '[data-testid="project-card"]',
  projectName: '[data-testid="project-name"]',

  // Tasks
  taskCard: '[data-testid="task-card"]',
  taskStatusSelect: '[data-testid="task-status"]',
  kanbanColumn: '[data-testid="kanban-column"]',

  // Modal
  modal: '[role="dialog"], [data-testid="modal"]',
  modalClose: '[data-testid="modal-close"], button[aria-label="Close"], button:has-text("x")',

  // Forms
  saveBtn: 'button[type="submit"], button:has-text("Simpan"), button:has-text("Save")',
  cancelBtn: 'button:has-text("Batal"), button:has-text("Cancel")',
  deleteBtn: 'button:has-text("Hapus"), button:has-text("Delete")',
  confirmDeleteBtn: 'button:has-text("Ya"), button:has-text("Confirm"), button:has-text("Yes")',

  // Toast / notifications
  toast: '[data-testid="toast"], .toast, [role="alert"]',
};
