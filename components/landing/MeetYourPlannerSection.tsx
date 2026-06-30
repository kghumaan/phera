'use client';

/**
 * "Meet your planner" — the voice-forward centerpiece, sits right after the
 * Hero and before the FeatureStepper. The real VoiceOrb cycles idle →
 * listening → thinking → speaking while a scripted transcript cycles through
 * several real use-cases (venue/dates, CSV guest-list import, room assignments
 * from an uploaded floor plan, shuttle pickups, vendor coordination). Each
 * scene plays at least two full back-and-forth exchanges before it clears and
 * the next one begins.
 */

import { Fragment, useEffect, useState } from 'react';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { VoiceOrb, type OrbState } from '@/components/agent/VoiceOrb';
import { Reveal } from './design-primitives';

type Turn = { role: 'you' | 'planner'; text: string; chip?: string };
type Upload = { file: string; status: string; note: string };
type Scene = { id: string; turns: Turn[]; upload?: Upload };

// Each scene runs two full exchanges before clearing.
const SCENES: Scene[] = [
  {
    id: 'venue',
    turns: [
      { role: 'you', text: 'We booked the Leela in Udaipur — April 12–14.' },
      { role: 'planner', text: 'Gorgeous pick. Dates and venue are in — starting your room blocks now.', chip: 'Venue + dates' },
      { role: 'you', text: 'About 250 guests, maybe 80 flying in from the US.' },
      { role: 'planner', text: 'Noted. I’ll plan travel and shuttles around the US arrivals.', chip: '250 guests' },
    ],
  },
  {
    id: 'csv',
    upload: { file: '📄 guests.csv', status: '248 rows', note: '✓ De-duped · grouped by family' },
    turns: [
      { role: 'you', text: 'Can you import my guest list? I have it as a CSV.' },
      { role: 'planner', text: 'On it — pulled everyone in, de-duped and grouped by family.', chip: '248 imported' },
      { role: 'you', text: 'A few of those are plus-ones, not confirmed yet.' },
      { role: 'planner', text: 'Flagged them as tentative — I’ll confirm on the RSVP round.', chip: 'Tentative tagged' },
    ],
  },
  {
    id: 'rooms',
    upload: { file: '📑 floorplan.pdf', status: '12 floors', note: '✓ 240 rooms parsed' },
    turns: [
      { role: 'you', text: 'Here’s the floor plan from the hotel.' },
      { role: 'planner', text: 'Got it — siblings together, in-laws on a quiet floor, late arrivals near the lobby.', chip: 'Rooms drafted' },
      { role: 'you', text: 'Can my parents be near the lift?' },
      { role: 'planner', text: 'Done — moved them to the 2nd floor by the lift.', chip: 'Updated' },
    ],
  },
  {
    id: 'shuttle',
    turns: [
      { role: 'you', text: 'My brother and his wife land Wednesday — add them to the shuttle.' },
      { role: 'planner', text: 'Done. When do they land, and from where?', chip: 'Shuttle · +2' },
      { role: 'you', text: '11 PM, flying in from SFO.' },
      { role: 'planner', text: 'Got it — they’re on the 11:30 PM pickup. I’ll text them the details.', chip: 'Pickup set' },
    ],
  },
  {
    id: 'vendors',
    turns: [
      { role: 'you', text: 'Add our photographer to the vendor group — Joseph Radhik.' },
      { role: 'planner', text: 'Added. I’ll watch the thread and flag anything that needs you.', chip: 'Vendor added' },
      { role: 'you', text: 'Ask if drone shots are included.' },
      { role: 'planner', text: 'Asked — I’ll surface their reply the moment it comes in.', chip: 'Question sent' },
    ],
  },
];

// upload: 0 hidden · 1 importing (bar animating) · 2 done.
type Beat = { sceneIdx: number; visible: number; state: OrbState; caption: string; dur: number; upload: 0 | 1 | 2 };

function buildBeats(scenes: Scene[]): Beat[] {
  const beats: Beat[] = [];
  scenes.forEach((scene, sceneIdx) => {
    let up: 0 | 1 | 2 = 0;
    let firstPlanner = true;
    beats.push({ sceneIdx, visible: 0, state: 'idle', caption: 'Ready when you are', dur: 900, upload: up });
    scene.turns.forEach((turn, ti) => {
      if (turn.role === 'you') {
        beats.push({ sceneIdx, visible: ti + 1, state: 'listening', caption: 'Listening…', dur: 2100, upload: up });
      } else {
        // The file finishes uploading during the FIRST planner reply.
        if (scene.upload && firstPlanner) up = 1;
        beats.push({ sceneIdx, visible: ti, state: 'thinking', caption: 'Thinking…', dur: 1100, upload: up });
        if (scene.upload && firstPlanner) up = 2;
        beats.push({ sceneIdx, visible: ti + 1, state: 'speaking', caption: 'Speaking…', dur: 2600, upload: up });
        firstPlanner = false;
      }
    });
    beats.push({ sceneIdx, visible: scene.turns.length, state: 'idle', caption: 'All set', dur: 1400, upload: up });
  });
  return beats;
}

const BEATS = buildBeats(SCENES);

const BULLETS = [
  'Voice or chat — whichever feels natural in the moment',
  'Updates your real data live: guests, RSVPs, rooms, vendors, schedule',
  'Proactive — spots gaps and confirms before any big change',
];

// Asymmetric radius + a clip-path tail = a pointed speech-bubble corner facing
// the speaker (planner = bottom-left, you = bottom-right).
const plannerRadius = `${RADII.lg} ${RADII.lg} ${RADII.lg} 2px`;
const youRadius = `${RADII.lg} ${RADII.lg} 2px ${RADII.lg}`;

export default function MeetYourPlannerSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStep(BEATS.length - 1);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setStep(i);
      const dur = BEATS[i].dur;
      i = (i + 1) % BEATS.length;
      timer = setTimeout(tick, dur);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const cur = BEATS[step];
  const scene = SCENES[cur.sceneIdx];

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
                There&apos;s so much that has to go right on your big day — and you don&apos;t realize how
                much until you&apos;re in it. We built the wedding planner that lives in your pocket, 24/7,
                handling whatever comes up so you can stay in the moment.
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
                  href="/auth/signup"
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
                  Start free
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
                  Try the live demo
                </ActionButton>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — the orb + live conversation (pulled up to the top of the row) */}
          <div className="myp-right" aria-hidden>
            <div className="myp-orb">
              <VoiceOrb state={cur.state} size={150} />
            </div>
            <p className="myp-caption" role="status" aria-live="polite">
              {cur.caption}
            </p>
            <div className="myp-transcript" key={cur.sceneIdx}>
              {scene.turns.map((t, i) => {
                const visible = i < cur.visible;
                const isPlanner = t.role === 'planner';
                return (
                  <Fragment key={i}>
                    <div
                      className="myp-row"
                      style={{
                        alignItems: isPlanner ? 'flex-start' : 'flex-end',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(6px)',
                      }}
                    >
                      <div
                        className={`myp-bubble ${isPlanner ? 'myp-bubble--planner' : 'myp-bubble--you'}`}
                        style={{
                          alignSelf: isPlanner ? 'flex-start' : 'flex-end',
                          background: isPlanner ? COLORS.bg.white : COLORS.brand.primaryWash,
                          border: `1px solid ${isPlanner ? COLORS.border.faint : COLORS.brand.primaryBorder}`,
                          color: COLORS.text.strong,
                          borderRadius: isPlanner ? plannerRadius : youRadius,
                        }}
                      >
                        <span className="myp-bubble-text">
                          {!isPlanner && (
                            <MicRoundedIcon sx={{ fontSize: 15, color: COLORS.brand.primary, mr: 0.75, verticalAlign: '-2px' }} />
                          )}
                          {t.text}
                        </span>
                        {/* Update confirmation, themed + tucked into the bottom-right of the bubble. */}
                        {t.chip && <span className="myp-chip-inline">✓ {t.chip}</span>}
                      </div>
                    </div>

                    {/* File-upload card (CSV import / floor-plan PDF) — appears
                        between the ask and the confirmation, with a progress bar
                        that fills as it imports. */}
                    {scene.upload && i === 0 && (
                      <div
                        className="myp-upload"
                        style={{
                          opacity: cur.upload >= 1 ? 1 : 0,
                          transform: cur.upload >= 1 ? 'translateY(0)' : 'translateY(6px)',
                        }}
                      >
                        <div className="myp-upload-top">
                          <span className="myp-upload-file">{scene.upload.file}</span>
                          <span className="myp-upload-status">{cur.upload >= 2 ? scene.upload.status : 'uploading…'}</span>
                        </div>
                        <div className="myp-upload-bar">
                          <div
                            className="myp-upload-fill"
                            style={{ width: cur.upload >= 2 ? '100%' : cur.upload === 1 ? '72%' : '0%' }}
                          />
                        </div>
                        <div className="myp-upload-done" style={{ opacity: cur.upload >= 2 ? 1 : 0 }}>
                          {scene.upload.note}
                        </div>
                      </div>
                    )}
                  </Fragment>
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
          align-items: start;
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
        .myp-orb { transform: scale(1); transform-origin: center; }
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
          min-height: 280px;
          margin: 20px auto 0;
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
          position: relative;
          max-width: 90%;
          padding: 12px 16px;
          font-size: 15px;
          line-height: 1.45;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        /* Pointed speech-bubble tails. */
        .myp-bubble--planner::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -7px;
          width: 11px;
          height: 15px;
          background: ${COLORS.bg.white};
          clip-path: polygon(100% 0, 100% 100%, 0 100%);
        }
        .myp-bubble--you::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -7px;
          width: 11px;
          height: 15px;
          background: ${COLORS.brand.primaryWash};
          clip-path: polygon(0 0, 0 100%, 100% 100%);
        }
        /* Planner bubbles stack their text + the update pill so the pill can sit
           bottom-right. */
        .myp-bubble--planner { display: flex; flex-direction: column; align-items: flex-start; }
        .myp-bubble-text { display: block; }
        .myp-chip-inline {
          align-self: flex-end;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 9px;
          font-family: var(--mono);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          padding: 3px 9px;
          border-radius: ${RADII.pill};
          background: ${COLORS.brand.primaryWash};
          color: ${COLORS.brand.primary};
          border: 1px solid ${COLORS.brand.primaryBorder};
        }
        .myp-upload {
          align-self: flex-start;
          width: 80%;
          max-width: 300px;
          padding: 11px 13px;
          border-radius: ${RADII.lg};
          background: ${COLORS.bg.white};
          border: 1px solid ${COLORS.border.faint};
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .myp-upload-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .myp-upload-file { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.84rem; color: var(--text-strong); }
        .myp-upload-status { font-family: var(--mono); font-size: 0.74rem; color: var(--text-subtle); }
        .myp-upload-bar { margin-top: 9px; height: 5px; border-radius: 999px; background: rgba(0,0,0,0.06); overflow: hidden; }
        .myp-upload-fill { height: 100%; border-radius: 999px; background: ${COLORS.brand.primary}; width: 0%; transition: width 1.6s cubic-bezier(0.22,1,0.36,1); }
        .myp-upload-done { margin-top: 8px; font-size: 0.76rem; font-weight: 600; color: ${COLORS.brand.primary}; transition: opacity 0.35s ease; }
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
          .myp-grid { grid-template-columns: 1fr; gap: 40px; align-items: stretch; }
          .myp-left { align-items: center; text-align: center; }
          .myp-kicker, .myp-points { margin-left: auto; margin-right: auto; }
          .myp-points { align-items: flex-start; }
          .myp-ctas { justify-content: center; }
        }
        @media (max-width: 600px) {
          .myp-orb { transform: scale(0.9); }
          .myp-transcript { max-width: 100%; min-height: 260px; }
          .myp-ctas { flex-direction: column; width: 100%; max-width: 320px; }
          .myp-ctas > * { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .myp-row, .myp-caption, .myp-upload, .myp-upload-fill, .myp-upload-done { transition: none; }
        }
      `}</style>
    </section>
  );
}
