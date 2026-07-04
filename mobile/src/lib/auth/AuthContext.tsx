import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { MOCK_USER } from '@/lib/mock/fixtures';
import { isPreviewMode, supabase } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string;
}

/** What a password submit resolved to — mirrors the web login flow. */
export type SignInResult =
  | { status: 'ok' }
  | { status: 'otp' } // account created / unconfirmed — verify the emailed code
  | { status: 'error'; message: string };

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isPreviewMode: boolean;
  signInWithPassword: (email: string, password: string) => Promise<SignInResult>;
  verifyOtp: (email: string, code: string) => Promise<{ error: string | null }>;
  resendOtp: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  enterPreview: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Create a session from an auth redirect/deep link (OAuth return or magic
 * link). Handles both PKCE `?code=` and implicit `#access_token=` forms.
 */
export async function createSessionFromUrl(url: string): Promise<boolean> {
  if (!supabase) return false;
  const parsed = Linking.parse(url.replace('#', '?'));
  const params = parsed.queryParams ?? {};
  if (typeof params.code === 'string') {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return !error;
  }
  if (typeof params.access_token === 'string' && typeof params.refresh_token === 'string') {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return !error;
  }
  return false;
}

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
    // Magic links / OAuth returns arrive as phera:// deep links.
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      void createSessionFromUrl(url);
    });
    return () => {
      sub.subscription.unsubscribe();
      linkSub.remove();
    };
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
      signInWithPassword: async (email, password): Promise<SignInResult> => {
        if (!supabase) {
          setPreviewUser({ id: MOCK_USER.id, email: email || MOCK_USER.email });
          return { status: 'ok' };
        }
        // Web login parity (app/auth/login/page.tsx): try sign-in, and on
        // invalid credentials attempt sign-up for new accounts.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError) return { status: 'ok' };

        if (signInError.message.includes('Email not confirmed')) {
          await supabase.auth.resend({ type: 'signup', email });
          return { status: 'otp' };
        }
        if (!signInError.message.includes('Invalid login credentials')) {
          return { status: 'error', message: signInError.message };
        }
        if (password.length < 6) {
          return { status: 'error', message: 'Password must be at least 6 characters for a new account' };
        }
        const { data: signUp, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          return {
            status: 'error',
            message: signUpError.message.includes('registered')
              ? 'Incorrect password. Try again or use Google sign-in.'
              : signUpError.message,
          };
        }
        // Empty identities = the email exists with a different password.
        if (signUp.user && signUp.user.identities?.length === 0) {
          return { status: 'error', message: 'Incorrect password. Try again or use Google sign-in.' };
        }
        return signUp.session ? { status: 'ok' } : { status: 'otp' };
      },
      verifyOtp: async (email, code) => {
        if (!supabase) return { error: null };
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
        return { error: error?.message ?? null };
      },
      resendOtp: async (email) => {
        if (!supabase) return { error: null };
        const { error } = await supabase.auth.resend({ type: 'signup', email });
        return { error: error?.message ?? null };
      },
      signInWithGoogle: async () => {
        if (!supabase) return { error: 'Google sign-in is not available in preview mode' };
        const redirectTo = Linking.createURL('auth/callback'); // phera://auth/callback
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data.url) return { error: error?.message ?? 'Could not start Google sign-in' };
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') return { error: null }; // user dismissed — not an error
        const ok = await createSessionFromUrl(result.url);
        return { error: ok ? null : 'Google sign-in did not complete — try again' };
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
