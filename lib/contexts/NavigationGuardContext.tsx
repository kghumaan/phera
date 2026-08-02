'use client';

import { createContext, useContext, useRef, useCallback } from 'react';

interface NavigationGuardContextType {
  registerGuard: (fn: () => boolean) => void;
  unregisterGuard: () => void;
  checkGuard: () => boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  registerGuard: () => {},
  unregisterGuard: () => {},
  checkGuard: () => true,
});

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const guardRef = useRef<(() => boolean) | null>(null);

  const registerGuard = useCallback((fn: () => boolean) => {
    guardRef.current = fn;
  }, []);

  const unregisterGuard = useCallback(() => {
    guardRef.current = null;
  }, []);

  const checkGuard = useCallback(() => {
    if (guardRef.current) {
      return guardRef.current();
    }
    return true;
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, unregisterGuard, checkGuard }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export const useNavigationGuard = () => useContext(NavigationGuardContext);
