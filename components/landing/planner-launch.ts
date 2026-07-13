import { supabase } from '@/lib/supabase/client';

/** Must match AgentChatPanel's PENDING_FIRST_MESSAGE_KEY — the planner replays
 *  this as the visitor's opening turn the moment the chat mounts. */
export const PENDING_FIRST_MESSAGE_KEY = 'phera-pending-first-message';

/**
 * Shared launch flow for the landing hero's two entry points — the planner
 * chat box and the Get Started button. Both drop the visitor straight into a
 * live planner session (anonymous Supabase session + draft wedding), no
 * account first; the agent prompts signup in-chat once it knows what they need.
 */

// One-shot across the page: the chat box's focus prewarm and a later button
// click share the same in-flight promise. A failed attempt clears the cache
// so the next interaction retries instead of being stuck on false forever.
let sessionPromise: Promise<boolean> | null = null;

/** Ensure a Supabase session exists, signing in anonymously if needed. */
export function ensurePlannerSession(): Promise<boolean> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) return true;
        const { error: anonError } = await supabase.auth.signInAnonymously();
        if (!anonError) return true;
        // DEV-ONLY test bypass: when anonymous sign-ins are disabled on the
        // Supabase project, a dev-only route mints a confirmed throwaway
        // account so the whole flow stays testable locally. Compiled out of
        // production builds (NODE_ENV is inlined) AND the route 404s in
        // production. Note: this user is NOT is_anonymous, so the agent's
        // signup-card behavior still needs the real toggle to test.
        if (process.env.NODE_ENV === 'development') {
          const res = await fetch('/api/dev/anon-login', { method: 'POST' });
          if (res.ok) {
            const creds = (await res.json()) as { email: string; password: string };
            const { error: pwError } = await supabase.auth.signInWithPassword(creds);
            if (!pwError) {
              console.warn('[hero-chat] DEV bypass: anonymous sign-ins disabled — using throwaway account');
              return true;
            }
          }
        }
        return false;
      } catch {
        return false;
      }
    })().then((ok) => {
      if (!ok) sessionPromise = null;
      return ok;
    });
  }
  return sessionPromise;
}

/** Kick everything the assistant page needs so the hop feels instant. */
export function prewarmPlanner(router: { prefetch: (href: string) => void }): void {
  void ensurePlannerSession();
  router.prefetch('/admin/_/assistant');
  void import('@/components/agent/AgentChatPanel');
}

/** Create the draft wedding and return the assistant URL to navigate to. */
export async function startPlannerSession(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const res = await fetch('/api/agent/onboard/start', { method: 'POST' });
  const data = (await res.json()) as { slug?: string; error?: string };
  if (!res.ok || !data.slug) {
    return { ok: false, error: data.error ?? "Couldn't start your planner just now — please try again." };
  }
  return { ok: true, url: `/admin/${data.slug}/assistant?welcome=1&fresh=1` };
}
