'use client';

import { useEffect, useState } from 'react';
import type { TeamRole } from '@/lib/team-context';
import type { Permission } from '@/lib/permissions';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions';

interface TeamContextResponse {
  userId: string;
  accountId: string;
  role: TeamRole;
  isOwner: boolean;
  teamMemberId?: string;
}

/**
 * React hook for checking permissions in components.
 * Fetches the user's team context and provides permission checking utilities.
 */
export function usePermissions() {
  const [context, setContext] = useState<TeamContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContext();
  }, []);

  const fetchContext = async () => {
    try {
      const response = await fetch('/api/user/context');
      if (response.ok) {
        const data = await response.json();
        setContext(data);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch context');
      }
    } catch (err) {
      setError('Failed to fetch context');
    } finally {
      setLoading(false);
    }
  };

  const role = context?.role || 'member';

  return {
    // State
    loading,
    error,
    context,
    role,
    isOwner: context?.isOwner ?? false,
    isAdmin: role === 'owner' || role === 'admin',
    isMember: role === 'member',
    accountId: context?.accountId,
    teamMemberId: context?.teamMemberId,

    // Permission checks
    can: (permission: Permission) => hasPermission(role, permission),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),

    // Convenience methods
    canManageTeam: () => hasPermission(role, 'team:invite'),
    canManageBilling: () => hasPermission(role, 'billing:manage'),
    canManagePayments: () => hasPermission(role, 'payments:manage'),
    canEditWidget: () => hasPermission(role, 'widget:edit'),
    canEditAppointments: () => hasPermission(role, 'appointments:edit'),
    canDeleteAppointments: () => hasPermission(role, 'appointments:delete'),

    // Refetch context
    refetch: fetchContext,
  };
}
