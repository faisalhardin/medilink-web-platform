/**
 * Centralised permission code registry.
 *
 * Every permission string used in the UI lives here.
 * Group codes by resource so new ones are easy to find and document.
 *
 * Usage:
 *   import { PERMISSIONS } from 'constants/permissions';
 *   hasPermission(user, PERMISSIONS.staff.read);
 */
export const PERMISSIONS = {
  staff: {
    read: 'staff.read',
    create: 'staff.create',
    update: 'staff.update',   // reserved — no API endpoint yet
    delete: 'staff.delete',   // covers activate + deactivate
    roleAssign: 'staff.role.assign',
  },

  product: {
    statistics: 'product.statistics',
  },

  compensation: {
    read: 'compensation.read',
    assign: 'compensation.assign',
    finalize: 'compensation.finalize',
    manage: 'compensation.manage',
  },
} as const;

export type PermissionCode =
  | (typeof PERMISSIONS.staff)[keyof typeof PERMISSIONS.staff]
  | (typeof PERMISSIONS.product)[keyof typeof PERMISSIONS.product]
  | (typeof PERMISSIONS.compensation)[keyof typeof PERMISSIONS.compensation];
