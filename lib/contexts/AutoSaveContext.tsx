'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SaveStatus } from '@/lib/hooks/useAutoSave';

interface AutoSaveContextType {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
}

const AutoSaveContext = createContext<AutoSaveContextType | undefined>(undefined);

export function AutoSaveProvider({ children }: { children: ReactNode }) {
  const [status, setStatusRaw] = useState<SaveStatus>('idle');

  const setStatus = useCallback((s: SaveStatus) => {
    setStatusRaw(s);
  }, []);

  return (
    <AutoSaveContext.Provider value={{ status, setStatus }}>
      {children}
    </AutoSaveContext.Provider>
  );
}

export function useAutoSaveStatus() {
  const ctx = useContext(AutoSaveContext);
  if (!ctx) {
    // Return a no-op fallback if used outside provider (e.g. in non-admin pages)
    return { status: 'idle' as SaveStatus, setStatus: () => {} };
  }
  return ctx;
}
