/**
 * RBAC — Role-Based Access Control policy (single source of truth).
 *
 * Semua keputusan otorisasi (peran, kapabilitas, visibilitas menu, gerbang
 * rute) berasal dari modul ini. Tujuannya menghindari `if (role === 'manajer')`
 * yang tersebar: handler server, navbar, dan penjaga rute semuanya membaca
 * matriks yang sama.
 *
 * ISOMORPHIC: file ini TIDAK mengimpor `next/server`, DB, atau apa pun yang
 * khusus server. Aman diimpor dari handler API maupun komponen client.
 *
 * Model peran (3 peran):
 *   teknisi  — pekerja lapangan; hanya ruang kerja "Saya".
 *   manajer  — operasional penuh proyek/klien/tugas/eskalasi.
 *   admin    — superset ketat dari manajer + administrasi sistem
 *              (kelola pengguna, log audit). "Kontrol penuh."
 */

// ── Peran ────────────────────────────────────────────────────────────────────
export const ROLES = {
  TEKNISI: 'teknisi',
  MANAJER: 'manajer',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = [ROLES.TEKNISI, ROLES.MANAJER, ROLES.ADMIN];

/** Peran yang boleh diberikan admin via kelola-pengguna (termasuk admin). */
export const ASSIGNABLE_ROLES: readonly Role[] = [ROLES.TEKNISI, ROLES.MANAJER, ROLES.ADMIN];

/** Pendaftaran mandiri (endpoint publik /auth/register) TIDAK boleh mint admin. */
export const SELF_REGISTER_ROLES: readonly Role[] = [ROLES.TEKNISI, ROLES.MANAJER];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
}

// ── Kapabilitas (permission = resource:action) ───────────────────────────────
export const PERMISSIONS = {
  // Domain operasional (manajer + admin)
  DASHBOARD_VIEW: 'dashboard:view',
  PROJECT_MANAGE: 'project:manage',
  CLIENT_MANAGE: 'client:manage',
  SCHEDULE_VIEW: 'schedule:view',
  TIMELINE_VIEW: 'timeline:view',
  REPORTS_VIEW: 'reports:view',
  ESCALATION_MANAGE: 'escalation:manage',
  TECHNICIAN_VIEW: 'technician:view', // halaman manajemen teknisi

  // Domain teknisi lapangan
  MY_WORK_VIEW: 'mywork:view',

  // Administrasi sistem (eksklusif admin)
  USER_MANAGE: 'user:manage',
  AUDIT_VIEW: 'audit:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const P = PERMISSIONS;

// ── Matriks peran -> kapabilitas ─────────────────────────────────────────────
const TEKNISI_PERMISSIONS: readonly Permission[] = [P.MY_WORK_VIEW];

const MANAJER_PERMISSIONS: readonly Permission[] = [
  P.DASHBOARD_VIEW,
  P.PROJECT_MANAGE,
  P.CLIENT_MANAGE,
  P.SCHEDULE_VIEW,
  P.TIMELINE_VIEW,
  P.REPORTS_VIEW,
  P.ESCALATION_MANAGE,
  P.TECHNICIAN_VIEW,
];

// Admin = SEMUA kapabilitas manajer + administrasi sistem. Superset ketat:
// menambah kapabilitas manajer otomatis ikut ke admin.
const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...MANAJER_PERMISSIONS,
  P.USER_MANAGE,
  P.AUDIT_VIEW,
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.TEKNISI]: TEKNISI_PERMISSIONS,
  [ROLES.MANAJER]: MANAJER_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
};

/** Apakah peran punya kapabilitas tertentu. Primitif utama pengecekan akses. */
export function roleCan(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function roleCanAny(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((p) => roleCan(role, p));
}

// ── Hierarki peran ───────────────────────────────────────────────────────────
// Dipakai jalur legacy `authorizeRoles(['manajer'])`: admin "memenuhi" manajer
// sehingga otomatis lolos semua endpoint manajer tanpa menyentuh 40+ pemanggil.
const ROLE_INHERITS: Record<Role, readonly Role[]> = {
  [ROLES.ADMIN]: [ROLES.MANAJER],
  [ROLES.MANAJER]: [],
  [ROLES.TEKNISI]: [],
};

export function roleSatisfies(userRole: Role, requiredRole: Role): boolean {
  if (userRole === requiredRole) return true;
  return (ROLE_INHERITS[userRole] ?? []).includes(requiredRole);
}

export function satisfiesAnyRole(userRole: Role, required: readonly string[]): boolean {
  return required.some((r) => isRole(r) && roleSatisfies(userRole, r));
}

// ── Navigasi (digerakkan kapabilitas, bukan if peran) ────────────────────────
export type NavIconKey =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'schedule'
  | 'timeline'
  | 'clients'
  | 'reports'
  | 'escalations'
  | 'technicians'
  | 'users'
  | 'audit';

export type NavSection = 'technician' | 'operational' | 'admin';

export interface NavItemDef {
  to: string;
  labelKey: string;
  icon: NavIconKey;
  permission: Permission;
  section: NavSection;
  /** Sumber badge angka (mis. jumlah eskalasi terbuka). */
  badge?: 'escalations';
}

export const NAV_ITEMS: readonly NavItemDef[] = [
  // Ruang kerja teknisi
  { to: '/my-dashboard', labelKey: 'nav.my_dashboard', icon: 'dashboard', permission: P.MY_WORK_VIEW, section: 'technician' },
  { to: '/my-projects', labelKey: 'nav.my_projects', icon: 'projects', permission: P.MY_WORK_VIEW, section: 'technician' },
  { to: '/my-tasks', labelKey: 'nav.my_tasks', icon: 'tasks', permission: P.MY_WORK_VIEW, section: 'technician' },
  { to: '/my-escalations', labelKey: 'nav.my_escalations', icon: 'escalations', permission: P.MY_WORK_VIEW, section: 'technician', badge: 'escalations' },

  // Operasional (manajer + admin)
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard', permission: P.DASHBOARD_VIEW, section: 'operational' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'projects', permission: P.PROJECT_MANAGE, section: 'operational' },
  { to: '/schedule', labelKey: 'nav.schedule', icon: 'schedule', permission: P.SCHEDULE_VIEW, section: 'operational' },
  { to: '/timeline', labelKey: 'nav.timeline', icon: 'timeline', permission: P.TIMELINE_VIEW, section: 'operational' },
  { to: '/clients', labelKey: 'nav.clients', icon: 'clients', permission: P.CLIENT_MANAGE, section: 'operational' },
  { to: '/reports', labelKey: 'nav.reports', icon: 'reports', permission: P.REPORTS_VIEW, section: 'operational' },
  { to: '/escalations', labelKey: 'nav.escalations', icon: 'escalations', permission: P.ESCALATION_MANAGE, section: 'operational', badge: 'escalations' },
  { to: '/technicians', labelKey: 'nav.technicians', icon: 'technicians', permission: P.TECHNICIAN_VIEW, section: 'operational' },

  // Administrasi sistem (eksklusif admin)
  { to: '/users', labelKey: 'nav.users', icon: 'users', permission: P.USER_MANAGE, section: 'admin' },
  { to: '/audit-log', labelKey: 'nav.audit_log', icon: 'audit', permission: P.AUDIT_VIEW, section: 'admin' },
];

/** Item nav yang boleh dilihat peran tertentu (terfilter kapabilitas). */
export function navItemsForRole(role: Role): NavItemDef[] {
  return NAV_ITEMS.filter((item) => roleCan(role, item.permission));
}

// ── Gerbang rute (segment URL pertama -> kapabilitas yang diwajibkan) ─────────
// Rute tanpa entri (mis. profile, settings) terbuka utk semua user terautentikasi.
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  dashboard: P.DASHBOARD_VIEW,
  projects: P.PROJECT_MANAGE,
  clients: P.CLIENT_MANAGE,
  escalations: P.ESCALATION_MANAGE,
  schedule: P.SCHEDULE_VIEW,
  timeline: P.TIMELINE_VIEW,
  reports: P.REPORTS_VIEW,
  technicians: P.TECHNICIAN_VIEW,
  users: P.USER_MANAGE,
  'audit-log': P.AUDIT_VIEW,
  'my-dashboard': P.MY_WORK_VIEW,
  'my-projects': P.MY_WORK_VIEW,
  'my-tasks': P.MY_WORK_VIEW,
  'my-escalations': P.MY_WORK_VIEW,
};

export function canAccessRoute(role: Role, section: string | undefined): boolean {
  if (!section) return true;
  const required = ROUTE_PERMISSIONS[section];
  if (!required) return true; // rute tak-tergerbang (profile/settings)
  return roleCan(role, required);
}

// ── Helper UI ────────────────────────────────────────────────────────────────
/** Halaman beranda default sesuai peran (dipakai redirect login & root). */
export function roleHome(role: Role): string {
  return roleCan(role, P.DASHBOARD_VIEW) ? '/dashboard' : '/my-dashboard';
}

export const ROLE_LABEL_KEY: Record<Role, string> = {
  [ROLES.TEKNISI]: 'role.teknisi',
  [ROLES.MANAJER]: 'role.manajer',
  [ROLES.ADMIN]: 'role.admin',
};
