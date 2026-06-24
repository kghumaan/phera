'use client';

/**
 * "Meet your planner" — the voice-forward centerpiece, sits right after the
 * Hero and before the FeatureStepper. The hero promises "chat or voice"; this
 * section proves the VOICE half: the real VoiceOrb cycles idle → listening →
 * thinking → speaking while a scripted transcript shows the planner updating
 * real wedding data as the couple talks. Reuses VoiceOrb, SectionHeader, and
 * the landing `section`/`container` rails so it matches the rest of the page.
 */

import { useEffect, useState } from 'react';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { VoiceOrb, type OrbState } from '@/components/agent/VoiceOrb';
import { Reveal } from './design-primitives';

type Step = { state: OrbState; caption: string; lines: number; chips: number; dur: number };

// One ~14.6s loop. `lines`/`chips` are how much of the transcript is revealed at
// each beat (bubbles fade in/out by opacity so the loop restart is smooth).
const SEQUENCE: Step[] = [
  { state: 'idle', caption: 'Ready when you are', lines: 0, chips: 0, dur: 1300 },
  { state: 'listening', caption: 'Listening…', lines: 1, chips: 0, dur: 2300 },
  { state: 'thinking', caption: 'Thinking…', lines: 1, chips: 0, dur: 1100 },
  { state: 'speaking', caption: 'Speaking…', lines: 2, chips: 1, dur: 2700 },
  { state: 'listening', caption: 'Listening…', lines: 3, chips: 1, dur: 2300 },
  { state: 'thinking', caption: 'Thinking…', lines: 3, chips: 1, dur: 1100 },
  { state: 'speaking', caption: 'Speaking…', lines: 4, chips: 2, dur: 2700 },
  { state: 'idle', caption: 'All set', lines: 4, chips: 2, dur: 1100 },
];

type Turn = { role: 'you' | 'planner'; text: string; chip?: string };

const TRANSCRIPT: Turn[] = [
  { role: 'you', text: 'We booked the Leela in Udaipur — April 12–14, about 250 guests.' },
  { role: 'planner', text: "Gorgeous pick. Dates and venue are in — starting your room blocks now.", chip: 'Venue + dates' },
  { role: 'you', text: 'My brother and his wife land Wednesday — add them to the shuttle.' },
  { role: 'planner', text: "Done. When do they land, and from where? I'll set their pickup.", chip: 'Shuttle · +2 guests' },
];

const BULLETS = [
  'Voice or chat — whichever feels natural in the moment',
  'Updates your real data live: guests, RSVPs, rooms, vendors, schedule',
  'Proactive — spots gaps and confirms before any big change',
];

export default function MeetYourPlannerSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Honor reduced-motion: hold the final, fully-revealed state and don't cycle.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStep(SEQUENCE.length - 1);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setStep(i);
      const dur = SEQUENCE[i].dur;
      i = (i + 1) % SEQUENCE.length;
      timer = setTimeout(tick, dur);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const cur = SEQUENCE[step];
  // Pure ordinal for each chip-bearing turn (1st chip = 1, 2nd = 2…) — computed
  // per item so nothing mutates during render.
  const chipOrdinalAt = (i: number) => TRANSCRIPT.slice(0, i + 1).filter((t) => t.chip).length;

  return (
    <section id="meet-planner" className="section" style={{ background: 'var(--white)' }}>
      <div className="container">
        <div className="myp-grid">
          {/* LEFT — copy, points, CTAs */}
          <div className="myp-left">
            <Reveal>
              <h2
                className="display wrap-balance"
                style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  lineHeight: 0.98,
                  fontSize: 'clamp(40px, 4.6vw, 62px)',
                  color: 'var(--text-strong)',
                  margin: 0,
                }}
              >
                Meet your planner.
              </h2>
            </Reveal>
            <Reveal delay={1}>
              <p className="myp-kicker">
                One AI wedding planner you run by voice or chat. Wherever you are — newly engaged or
                down to the final week — just say what&apos;s happening and watch your whole wedding
                update in real time.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <ul className="myp-points">
                {BULLETS.map((b) => (
                  <li key={b}>
                    <span className="myp-check" aria-hidden>
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={3}>
              <div className="myp-ctas">
                <ActionButton
                  href="/auth/login"
                  variant="contained"
                  className="btn btn-primary"
                  sx={{
                    fontSize: { xs: 15, sm: 16 },
                    padding: { xs: '13px 22px', sm: '16px 28px' },
                    borderRadius: RADII.pill,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: 'var(--accent)',
                    color: COLORS.text.inverse,
                    '&:hover': { bgcolor: 'var(--accent-hover)' },
                  }}
                  endIcon={
                    <span className="btn-arrow" style={{ display: 'inline-block' }}>
                      →
                    </span>
                  }
                >
                  Start a conversation
                </ActionButton>
                <ActionButton
                  href="/demo"
                  variant="outlined"
                  className="btn btn-ghost"
                  spinnerColor={COLORS.brand.primary}
                  sx={{
                    fontSize: { xs: 15, sm: 16 },
                    padding: { xs: '13px 22px', sm: '16px 28px' },
                    borderRadius: RADII.pill,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Watch the demo
                </ActionButton>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — the orb + live conversation */}
          <div className="myp-right" aria-hidden>
            <div className="myp-orb">
              <VoiceOrb state={cur.state} size={190} />
            </div>
            <p className="myp-caption" role="status" aria-live="polite">
              {cur.caption}
            </p>
            <div className="myp-transcript">
              {TRANSCRIPT.map((t, i) => {
                const visible = i < cur.lines;
                const isPlanner = t.role === 'planner';
                const chipVisible = !!t.chip && visible && cur.chips >= chipOrdinalAt(i);
                return (
                  <div
                    key={i}
                    className="myp-row"
                    style={{
                      alignItems: isPlanner ? 'flex-start' : 'flex-end',
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0)' : 'translateY(6px)',
                    }}
                  >
                    <div
                      className="myp-bubble"
                      style={{
                        alignSelf: isPlanner ? 'flex-start' : 'flex-end',
                        background: isPlanner ? COLORS.bg.white : COLORS.brand.primaryWash,
                        border: `1px solid ${isPlanner ? COLORS.border.faint : COLORS.brand.primaryBorder}`,
                        color: COLORS.text.strong,
                        boxShadow: SHADOWS.card,
                      }}
                    >
                      {!isPlanner && (
                        <MicRoundedIcon sx={{ fontSize: 15, color: COLORS.brand.primary, mr: 0.75, verticalAlign: '-2px' }} />
                      )}
                      {t.text}
                    </div>
                    {t.chip && (
                      <span
                        className="myp-chip"
                        style={{
                          background: COLORS.accent.successBg,
                          color: COLORS.accent.successText,
                          opacity: chipVisible ? 1 : 0,
                          transform: chipVisible ? 'scale(1)' : 'scale(0.85)',
                        }}
                      >
                        ✓ Updated · {t.chip}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .myp-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
          gap: 64px;
          align-items: center;
        }
        .myp-left { display: flex; flex-direction: column; align-items: flex-start; text-align: left; }
        .myp-kicker {
          margin: 20px 0 0;
          font-size: 18px;
          line-height: 1.55;
          color: var(--text-muted);
          max-width: 46ch;
        }
        .myp-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
        }
        .myp-orb { transform: scale(1); transform-origin: center; transition: transform 0.3s ease; }
        .myp-caption {
          margin: 14px 0 0;
          font-family: var(--mono);
          font-size: 14px;
          letter-spacing: 0.04em;
          color: var(--text-subtle);
          min-height: 1.2em;
          transition: opacity 0.2s ease;
        }
        .myp-transcript {
          width: 100%;
          max-width: 440px;
          margin: 22px auto 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .myp-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .myp-bubble {
          max-width: 90%;
          padding: 12px 16px;
          border-radius: ${RADII.lg};
          font-size: 15px;
          line-height: 1.45;
        }
        .myp-chip {
          align-self: flex-start;
          font-family: var(--mono);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 5px 11px;
          border-radius: ${RADII.pill};
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .myp-points {
          list-style: none;
          padding: 0;
          margin: 28px 0 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 46ch;
          text-align: left;
        }
        .myp-points li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 16px;
          line-height: 1.5;
          color: var(--text-strong);
        }
        .myp-check { color: var(--accent); font-weight: 700; flex: none; margin-top: 1px; }
        .myp-ctas {
          display: flex;
          gap: 12px;
          margin-top: 36px;
          flex-wrap: wrap;
        }
        @media (max-width: 960px) {
          .myp-grid { grid-template-columns: 1fr; gap: 40px; }
          .myp-left { align-items: center; text-align: center; }
          .myp-kicker, .myp-points { margin-left: auto; margin-right: auto; }
          .myp-points { align-items: flex-start; }
          .myp-ctas { justify-content: center; }
        }
        @media (max-width: 600px) {
          .myp-orb { transform: scale(0.82); }
          .myp-transcript { max-width: 100%; }
          .myp-ctas { flex-direction: column; width: 100%; max-width: 320px; }
          .myp-ctas > * { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .myp-row, .myp-chip, .myp-caption, .myp-orb { transition: none; }
        }
      `}</style>
    </section>
  );
}
