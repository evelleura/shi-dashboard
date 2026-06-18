import { useAuth } from './useAuth';
import { roleCan, canAccessRoute, type Permission, type Role } from '../lib/rbac';

/**
 * Hook kapabilitas client. Membaca peran user aktif (dari useAuth) lalu
 * menjawab pertanyaan akses lewat kebijakan RBAC terpusat. Komponen memanggil
 * `can(PERMISSIONS.X)` alih-alih `user.role === 'manajer'` yang tersebar.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = (user?.role as Role | undefined) ?? undefined;

  return {
    role,
    can: (permission: Permission): boolean => (role ? roleCan(role, permission) : false),
    canAccess: (section: string | undefined): boolean => (role ? canAccessRoute(role, section) : false),
  };
}
