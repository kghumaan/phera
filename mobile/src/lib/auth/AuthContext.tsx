import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { MOCK_USER } from '@/lib/mock/fixtures';
import { isPreviewMode, supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** Raw Supabase session (null in preview mode). Access token feeds API calls. */
  session: Session | null;
  loading: boolean;
  isPreviewMode: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Preview-mode entry — instant mock session, no network. */
  enterPreview: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [previewUser, setPreviewUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!isPreviewMode);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user: AuthUser | null = session?.user
      ? { id: session.user.id, email: session.user.email ?? '' }
      : previewUser;

    return {
      user,
      session,
      loading,
      isPreviewMode,
      signInWithPassword: async (email, password) => {
        if (!supabase) {
          // Preview mode accepts anything — it's a demo shell.
          setPreviewUser({ id: MOCK_USER.id, email: email || MOCK_USER.email });
          return { error: null };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      enterPreview: () => setPreviewUser({ id: MOCK_USER.id, email: MOCK_USER.email }),
      signOut: async () => {
        setPreviewUser(null);
        if (supabase) await supabase.auth.signOut();
      },
    };
  }, [session, previewUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
