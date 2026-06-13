export interface StaffRoleCatalogItem {
  role_id: number;
  name: string;
  label: string;
}

export const STAFF_ROLES: StaffRoleCatalogItem[] = [
  { role_id: 1, name: 'administrator', label: 'Administrator' },
  { role_id: 2, name: 'clerk', label: 'Clerk' },
  { role_id: 3, name: 'doctor', label: 'Doctor' },
  { role_id: 4, name: 'nurse', label: 'Nurse' },
];

export const getRoleLabel = (roleId: number): string => {
  return STAFF_ROLES.find(r => r.role_id === roleId)?.label ?? String(roleId);
};

// Re-exported from constants/permissions for backwards compatibility.
export { PERMISSIONS as STAFF_PERMISSIONS } from './permissions';
