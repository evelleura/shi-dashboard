import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleCan,
  roleSatisfies,
  satisfiesAnyRole,
  navItemsForRole,
  canAccessRoute,
  roleHome,
} from '../rbac';

describe('RBAC policy', () => {
  describe('role -> permission matrix', () => {
    it('admin is a strict superset of manager', () => {
      for (const perm of ROLE_PERMISSIONS[ROLES.MANAJER]) {
        expect(roleCan(ROLES.ADMIN, perm)).toBe(true);
      }
      // ...plus capabilities the manager does not have.
      expect(ROLE_PERMISSIONS[ROLES.ADMIN].length).toBeGreaterThan(ROLE_PERMISSIONS[ROLES.MANAJER].length);
    });

    // Inti jawaban "apa yang manajer TIDAK bisa, hanya admin": kelola pengguna + audit global.
    it('only admin can manage users and view the global audit log', () => {
      expect(roleCan(ROLES.ADMIN, PERMISSIONS.USER_MANAGE)).toBe(true);
      expect(roleCan(ROLES.ADMIN, PERMISSIONS.AUDIT_VIEW)).toBe(true);

      expect(roleCan(ROLES.MANAJER, PERMISSIONS.USER_MANAGE)).toBe(false);
      expect(roleCan(ROLES.MANAJER, PERMISSIONS.AUDIT_VIEW)).toBe(false);

      expect(roleCan(ROLES.TEKNISI, PERMISSIONS.USER_MANAGE)).toBe(false);
      expect(roleCan(ROLES.TEKNISI, PERMISSIONS.AUDIT_VIEW)).toBe(false);
    });

    it('manager keeps full operational control', () => {
      expect(roleCan(ROLES.MANAJER, PERMISSIONS.PROJECT_MANAGE)).toBe(true);
      expect(roleCan(ROLES.MANAJER, PERMISSIONS.CLIENT_MANAGE)).toBe(true);
      expect(roleCan(ROLES.MANAJER, PERMISSIONS.ESCALATION_MANAGE)).toBe(true);
      expect(roleCan(ROLES.MANAJER, PERMISSIONS.TECHNICIAN_VIEW)).toBe(true);
      expect(roleCan(ROLES.MANAJER, PERMISSIONS.DASHBOARD_VIEW)).toBe(true);
    });

    it('technician is restricted to the field workspace', () => {
      expect(roleCan(ROLES.TEKNISI, PERMISSIONS.MY_WORK_VIEW)).toBe(true);
      expect(roleCan(ROLES.TEKNISI, PERMISSIONS.PROJECT_MANAGE)).toBe(false);
      expect(roleCan(ROLES.TEKNISI, PERMISSIONS.DASHBOARD_VIEW)).toBe(false);
    });
  });

  describe('role hierarchy (legacy authorizeRoles path)', () => {
    it('admin satisfies a manager requirement', () => {
      expect(roleSatisfies(ROLES.ADMIN, ROLES.MANAJER)).toBe(true);
      expect(satisfiesAnyRole(ROLES.ADMIN, ['manajer'])).toBe(true);
    });

    it('manager does not satisfy an admin requirement', () => {
      expect(roleSatisfies(ROLES.MANAJER, ROLES.ADMIN)).toBe(false);
    });

    it('technician satisfies only itself', () => {
      expect(roleSatisfies(ROLES.TEKNISI, ROLES.TEKNISI)).toBe(true);
      expect(roleSatisfies(ROLES.TEKNISI, ROLES.MANAJER)).toBe(false);
      expect(roleSatisfies(ROLES.ADMIN, ROLES.TEKNISI)).toBe(false);
    });
  });

  describe('navbar visibility (the clear menu difference)', () => {
    it('admin navbar contains every manager item plus Users and Audit Log', () => {
      const managerRoutes = navItemsForRole(ROLES.MANAJER).map((i) => i.to);
      const adminRoutes = navItemsForRole(ROLES.ADMIN).map((i) => i.to);

      for (const route of managerRoutes) expect(adminRoutes).toContain(route);
      expect(adminRoutes).toContain('/users');
      expect(adminRoutes).toContain('/audit-log');

      expect(managerRoutes).not.toContain('/users');
      expect(managerRoutes).not.toContain('/audit-log');
    });

    it('technician navbar is only the "my work" section', () => {
      const techRoutes = navItemsForRole(ROLES.TEKNISI).map((i) => i.to);
      expect(techRoutes).toContain('/my-dashboard');
      expect(techRoutes).not.toContain('/dashboard');
      expect(techRoutes).not.toContain('/users');
    });
  });

  describe('route gating', () => {
    it('blocks manager from admin-only routes', () => {
      expect(canAccessRoute(ROLES.MANAJER, 'users')).toBe(false);
      expect(canAccessRoute(ROLES.MANAJER, 'audit-log')).toBe(false);
      expect(canAccessRoute(ROLES.ADMIN, 'users')).toBe(true);
      expect(canAccessRoute(ROLES.ADMIN, 'audit-log')).toBe(true);
    });

    it('blocks technician from operational routes', () => {
      expect(canAccessRoute(ROLES.TEKNISI, 'dashboard')).toBe(false);
      expect(canAccessRoute(ROLES.TEKNISI, 'my-dashboard')).toBe(true);
    });

    it('leaves unguarded routes open to any authenticated role', () => {
      expect(canAccessRoute(ROLES.TEKNISI, 'settings')).toBe(true);
      expect(canAccessRoute(ROLES.TEKNISI, 'profile')).toBe(true);
    });
  });

  describe('roleHome', () => {
    it('routes admin and manager to the operational dashboard, technician to my-dashboard', () => {
      expect(roleHome(ROLES.ADMIN)).toBe('/dashboard');
      expect(roleHome(ROLES.MANAJER)).toBe('/dashboard');
      expect(roleHome(ROLES.TEKNISI)).toBe('/my-dashboard');
    });
  });
});
