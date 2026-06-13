import { PERMISSIONS } from '../constants/permissions';

interface UserForPermission {
  roles?: Array<{ role_id: number; name: string }>;
  permissions?: string[];
}

export function hasPermission(user: UserForPermission | null, code: string): boolean {
  if (!user) return false;
  if (user.roles?.some(r => r.name === 'administrator')) return true;
  return user.permissions?.includes(code) ?? false;
}

type StaffPermissionKey = keyof typeof PERMISSIONS.staff;

export function hasStaffPermission(user: UserForPermission | null, key: StaffPermissionKey): boolean {
  return hasPermission(user, PERMISSIONS.staff[key]);
}
