import type { TeamRole } from '@/lib/team-context';

/**
 * Permission definitions for team-based access control.
 *
 * Permissions follow the format: resource:action
 */
export type Permission =
  // Appointments
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:edit'
  | 'appointments:delete'
  // Appointment Types
  | 'appointment-types:view'
  | 'appointment-types:manage'
  // Widget & Settings
  | 'widget:view'
  | 'widget:edit'
  // Knowledge Base
  | 'knowledge:view'
  | 'knowledge:edit'
  // Chatbot
  | 'chatbot:view'
  | 'chatbot:edit'
  // Forms
  | 'forms:view'
  | 'forms:manage'
  // Availability
  | 'availability:view'
  | 'availability:edit'
  // Calendar
  | 'calendar:view'
  | 'calendar:connect'
  // Billing (owner only)
  | 'billing:view'
  | 'billing:manage'
  // Payments/Stripe Connect (owner only)
  | 'payments:view'
  | 'payments:manage'
  // Team management
  | 'team:view'
  | 'team:invite'
  | 'team:manage-roles'
  | 'team:remove-members';

/**
 * Role-based permission matrix.
 * Each role has a set of permissions it grants.
 */
const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  owner: [
    // Full access to everything
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:delete',
    'appointment-types:view',
    'appointment-types:manage',
    'widget:view',
    'widget:edit',
    'knowledge:view',
    'knowledge:edit',
    'chatbot:view',
    'chatbot:edit',
    'forms:view',
    'forms:manage',
    'availability:view',
    'availability:edit',
    'calendar:view',
    'calendar:connect',
    'billing:view',
    'billing:manage',
    'payments:view',
    'payments:manage',
    'team:view',
    'team:invite',
    'team:manage-roles',
    'team:remove-members',
  ],
  admin: [
    // Can manage most things except billing and payments
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:delete',
    'appointment-types:view',
    'appointment-types:manage',
    'widget:view',
    'widget:edit',
    'knowledge:view',
    'knowledge:edit',
    'chatbot:view',
    'chatbot:edit',
    'forms:view',
    'forms:manage',
    'availability:view',
    'availability:edit',
    'calendar:view',
    'calendar:connect',
    'team:view',
    'team:invite',
    // No billing, payments, or role management
  ],
  member: [
    // Can view and create appointments, limited editing
    'appointments:view',
    'appointments:create',
    'appointment-types:view',
    'widget:view',
    'knowledge:view',
    'chatbot:view',
    'forms:view',
    'availability:view',
    'calendar:view',
    'calendar:connect', // Members can connect their own calendar
    // No editing, billing, payments, or team management
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: TeamRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has all of the specified permissions.
 */
export function hasAllPermissions(role: TeamRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role has any of the specified permissions.
 */
export function hasAnyPermission(role: TeamRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: TeamRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Check if a permission is owner-only.
 */
export function isOwnerOnlyPermission(permission: Permission): boolean {
  const ownerOnlyPermissions: Permission[] = [
    'billing:view',
    'billing:manage',
    'payments:view',
    'payments:manage',
    'team:manage-roles',
    'team:remove-members',
  ];
  return ownerOnlyPermissions.includes(permission);
}

/**
 * Helper to create a permission checker function for a specific role.
 * Useful in React components.
 */
export function createPermissionChecker(role: TeamRole) {
  return {
    can: (permission: Permission) => hasPermission(role, permission),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isMember: role === 'member',
  };
}
