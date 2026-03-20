'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SaveStatus } from '@/lib/hooks/useAutoSave';

interface AutoSaveContextType {
  status: SaveStatus;
  message: string | null;
  setStatus: (status: SaveStatus, message?: string) => void;
  /** Show a brief status message in the header (auto-clears after timeout) */
  showStatus: (status: 'saving' | 'saved' | 'error', message?: string) => void;
}

const AutoSaveContext = createContext<AutoSaveContextType | undefined>(undefined);

export function AutoSaveProvider({ children }: { children: ReactNode }) {
  const [status, setStatusRaw] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const setStatus = useCallback((s: SaveStatus, msg?: string) => {
    setStatusRaw(s);
    setMessage(msg || null);
  }, []);

  const showStatus = useCallback((s: 'saving' | 'saved' | 'error', msg?: string) => {
    setStatusRaw(s);
    setMessage(msg || null);
    if (s === 'saved') setTimeout(() => { setStatusRaw('idle'); setMessage(null); }, 2000);
    if (s === 'error') setTimeout(() => { setStatusRaw('idle'); setMessage(null); }, 3000);
  }, []);

  return (
    <AutoSaveContext.Provider value={{ status, message, setStatus, showStatus }}>
      {children}
    </AutoSaveContext.Provider>
  );
}

export function useAutoSaveStatus() {
  const ctx = useContext(AutoSaveContext);
  if (!ctx) {
    return { status: 'idle' as SaveStatus, message: null as string | null, setStatus: () => {}, showStatus: () => {} };
  }
  return ctx;
}
