'use client';

import { createContext, useContext } from 'react';

export type AdminRole = 'owner' | 'admin' | 'viewer' | null;

interface AdminRoleContextType {
  role: AdminRole;
  isViewOnly: boolean;
}

const AdminRoleContext = createContext<AdminRoleContextType>({ role: null, isViewOnly: false });

export function AdminRoleProvider({ role, children }: { role: AdminRole; children: React.ReactNode }) {
  return (
    <AdminRoleContext.Provider value={{ role, isViewOnly: role === 'viewer' }}>
      {children}
    </AdminRoleContext.Provider>
  );
}

export const useAdminRole = () => useContext(AdminRoleContext);
