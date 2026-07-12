'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { supabase } from '@/lib/supabase/client';
import { setPendingAttachment } from '@/lib/agent/pending-attachment';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

/** Must match AgentChatPanel's PENDING_FIRST_MESSAGE_KEY — the planner replays
 *  this as the visitor's opening turn the moment the chat mounts. */
const PENDING_FIRST_MESSAGE_KEY = 'phera-pending-first-message';

/** The rotating "things you can ask" — typed out one by one in the box.
 *  Written the way couples actually talk: specific people, real asks. */
const ROTATING_PROMPTS = [
  'Build our wedding website — June in Bali',
  'Check if Amit uncle is still coming',
  "Who still hasn't RSVPed from the groom's side?",
  'Make sure the after-party invite is adults-only',
  'Put my college friends on the same hotel floor',
  'Nani lands Friday at 6 — set up her airport pickup',
  'Find me a mehendi artist in Udaipur under ₹50k',
  'Draft a save-the-date message my family will love',
];

const TYPE_MS = 38;
const DELETE_MS = 14;
const HOLD_MS = 1600;

/** Typewriter loop over the rotating prompts — pauses while the visitor is
 *  engaged with the box (focused or typed something). */
function useTypewriter(active: boolean) {
  const [text, setText] = useState('');
  const stateRef = useRef({ prompt: 0, char: 0, deleting: false });
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const s = stateRef.current;
      const full = ROTATING_PROMPTS[s.prompt % ROTATING_PROMPTS.length];
      let delay = s.deleting ? DELETE_MS : TYPE_MS;
      if (!s.deleting) {
        s.char += 1;
        if (s.char >= full.length) {
          s.char = full.length;
          s.deleting = true;
          delay = HOLD_MS;
        }
      } else {
        s.char -= 1;
        if (s.char <= 0) {
          s.char = 0;
          s.deleting = false;
          s.prompt += 1;
        }
      }
      setText(full.slice(0, s.char));
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, TYPE_MS);
    return () => clearTimeout(timer);
  }, [active]);
  return text;
}

/**
 * The landing-hero chat box (Origami-style): a visitor types anything and is
 * dropped straight into a live planner session — no account first. On focus we
 * pre-warm everything (anonymous Supabase session + the assistant route's JS);
 * on submit we create the draft wedding, stash the message, and navigate. The
 * planner replays the message as the opening turn.
 */
export default function HeroPlannerChat() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // One-shot pre-warm: kicked on first focus, awaited on submit.
  const prewarmRef = useRef<Promise<boolean> | null>(null);

  const typed = useTypewriter(!focused && value.length === 0 && !busy);

  const ensureSession = useCallback((): Promise<boolean> => {
    if (!prewarmRef.current) {
      prewarmRef.current = (async () => {
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
      })();
    }
    return prewarmRef.current;
  }, []);

  const prewarm = useCallback(() => {
    void ensureSession();
    router.prefetch('/admin/_/assistant');
    void import('@/components/agent/AgentChatPanel');
  }, [ensureSession, router]);

  const submit = useCallback(async () => {
    const message = value.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    try {
      try {
        window.sessionStorage.setItem(PENDING_FIRST_MESSAGE_KEY, message);
      } catch {
        /* private mode — the planner just opens without the replayed message */
      }
      // The attached file rides along to the planner (module store survives
      // the client-side navigation; the name survives even a full redirect).
      if (attachment) setPendingAttachment(attachment);
      const hasSession = await ensureSession();
      if (!hasSession) {
        // Anonymous sign-ins unavailable — the stash survives the signup flow,
        // so their message still opens the conversation after they register.
        router.push('/auth/signup');
        return;
      }
      const res = await fetch('/api/agent/onboard/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.slug) {
        setError(data.error ?? "Couldn't start your planner just now — please try again.");
        setBusy(false);
        return;
      }
      router.push(`/admin/${data.slug}/assistant?welcome=1&fresh=1`);
    } catch {
      setError("Couldn't start your planner just now — please try again.");
      setBusy(false);
    }
  }, [value, busy, attachment, ensureSession, router]);

  const pickAttachment = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('That file is over 10MB — try a smaller one.');
      return;
    }
    setError(null);
    setAttachment(file);
  };

  return (
    // Deterministic width: ancestors (Reveal) shrink-wrap, so percentages
    // collapse to the textarea's intrinsic size — min() sidesteps them all.
    // 660px ≈ the rendered width of the subtitle line above the box.
    <div style={{ width: 'min(660px, 92vw)' }}>
      {/* Origami-style composer: a multi-line box — text starts top-left,
          attach + send controls sit on the bottom rail. */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: COLORS.bg.white,
          border: `1px solid ${focused ? COLORS.brand.primaryBorder : 'rgba(0,0,0,0.12)'}`,
          borderRadius: RADII.dialog,
          boxShadow: focused ? `0 0 0 4px ${COLORS.brand.primaryWash}, ${SHADOWS.popover}` : SHADOWS.popover,
          cursor: 'text',
          textAlign: 'left',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <textarea
            ref={inputRef}
            rows={2}
            value={value}
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {
              setFocused(true);
              prewarm();
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            aria-label="Tell your wedding planner what you need"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              fontSize: 'clamp(16px, 1.15vw, 17px)',
              lineHeight: 1.55,
              color: COLORS.text.strong,
              fontFamily: 'inherit',
              padding: '16px 20px 2px',
              display: 'block',
            }}
          />
          {value.length === 0 && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 16,
                left: 20,
                right: 20,
                pointerEvents: 'none',
                fontSize: 'clamp(16px, 1.15vw, 17px)',
                lineHeight: 1.55,
                color: COLORS.text.faint,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {focused ? 'Ask for anything — your planner is listening' : typed}
              </span>
              {!focused && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 2,
                    height: '1.2em',
                    marginLeft: 2,
                    flexShrink: 0,
                    background: COLORS.text.subtle,
                    animation: 'phera-caret-blink 1.1s steps(1) infinite',
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px 12px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                pickAttachment(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // don't let the container steal focus to the textarea
                fileRef.current?.click();
              }}
              disabled={busy}
              aria-label="Attach a file — guest list, floor plan, anything"
              title="Attach a file"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: `1px solid rgba(0,0,0,0.12)`,
                background: 'transparent',
                color: COLORS.text.subtle,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <AttachFileRoundedIcon sx={{ fontSize: 19 }} />
            </button>
            {attachment && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 38,
                  padding: '0 6px 0 14px',
                  borderRadius: 19,
                  border: `1px solid rgba(0,0,0,0.12)`,
                  background: COLORS.bg.subtle,
                  fontSize: 14,
                  color: COLORS.text.strong,
                  maxWidth: 260,
                  minWidth: 0,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachment(null);
                  }}
                  aria-label="Remove attachment"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    color: COLORS.text.subtle,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || value.trim().length === 0}
            aria-label="Start planning"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: 'none',
              flexShrink: 0,
              background: value.trim() && !busy ? COLORS.brand.primary : 'rgba(0,0,0,0.08)',
              color: value.trim() && !busy ? COLORS.text.inverse : COLORS.text.subtle,
              cursor: value.trim() && !busy ? 'pointer' : 'default',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
          >
            {busy ? (
              <CircularProgress size={20} sx={{ color: COLORS.brand.primary }} />
            ) : (
              <ArrowUpwardRoundedIcon sx={{ fontSize: 22 }} />
            )}
          </button>
        </div>
      </div>
      <p
        style={{
          margin: '12px 4px 0',
          fontSize: 14,
          // Token, not var(--text-subtle): that CSS var only exists in
          // landing-design.css, and this component is also embedded in blog
          // posts, which don't load it. Same value.
          color: busy ? COLORS.text.muted : COLORS.text.subtle,
          lineHeight: 1.5,
        }}
      >
        {error ?? (busy ? 'Setting up your planner…' : 'Free to start, no credit card required.')}
      </p>
      <style>{`
        @keyframes phera-caret-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}
