'use client';

/**
 * FeatureStepper - "The full kit" section.
 *
 * 1:1 mirror of the Claude Design package's FeatureStepper function
 * (/tmp/phera-zip/app.jsx). Sticky right viewport with scroll-driven
 * step changes, progress rail with dot stops, ImagePlaceholder mocks
 * (you'll swap real screenshots in later).
 */

import { useEffect, useRef, useState } from 'react';
import { SectionHeader, ImagePlaceholder } from './design-primitives';
import GuestListImportMock from './feature-mocks/GuestListImportMock';
import WhatsAppBotMock from './feature-mocks/WhatsAppBotMock';
import RoomAssignmentsMock from './feature-mocks/RoomAssignmentsMock';
import TransportationMock from './feature-mocks/TransportationMock';

interface Step {
  tag: string;
  title: string;
  copy: string;
  bullet: string[];
  mockLabel: string;
  tint: string;
  /**
   * Optional custom mock renderer. When set, the FeatureStepper renders
   * this instead of the dashed-border ImagePlaceholder for the step's
   * sticky viewport. Use one custom mock per step as we build them out.
   */
  customMock?: () => React.ReactNode;
}

/** Compact six-step overview chips rendered above the stepper grid. */
const OVERVIEW_STEPS = [
  { n: '01', t: 'Bring your guest list' },
  { n: '02', t: 'Spin up your site' },
  { n: '03', t: 'Switch on the bot' },
  { n: '04', t: 'Sort rooms & shuttles' },
  { n: '05', t: 'Loop us into vendors' },
  { n: '06', t: 'Show up, celebrate' },
];

const STEPS: Step[] = [
  {
    tag: 'STEP 01  ·  Guest list',
    title: 'Bring your guest list. We take it from there.',
    copy: "Drop in a spreadsheet, paste from Google Contacts, or send us a photo of your handwritten list. Once it's in, we know who to reach out to, who's coming, who's asking the same question for the third time - and how to seat their family across the weekend.",
    bullet: [
      'Smart import - CSV, paste, or messy notes',
      'De-dupe, family grouping, side tagging done for you',
      'Becomes the source of truth for RSVPs, rooms & shuttles',
    ],
    mockLabel: 'Guest list import & dashboard',
    tint: 'rgba(222,63,94,0.06)',
    customMock: () => <GuestListImportMock />,
  },
  {
    tag: 'STEP 02  ·  Wedding website',
    title: 'A site that actually gets used.',
    copy: "The digital invitation for this generation - schedule, venues, RSVP, registry, and a built-in cultural guide for the friends flying in from abroad. So when a non-desi friend asks what to wear to the sangeet, the answer is already on their phone.",
    bullet: [
      'Schedule, FAQ, registry, PIN-gated events',
      'Built-in cultural guide: what to wear, what to expect, what NOT to do',
      'DIY, AI-assisted, or 1-on-1 with our team',
    ],
    mockLabel: 'Wedding website + cultural guide',
    tint: 'rgba(255,153,51,0.07)',
  },
  {
    tag: 'STEP 03  ·  WhatsApp bot',
    title: 'Save-the-dates, invites, and a 24/7 reply bot.',
    copy: "Flip it on and we WhatsApp every guest on a timeline we tuned by living through it. Behind the scenes, we auto-build a knowledge bank for your dates and city - weather, hotels, restaurants, dress codes - so the bot answers like a local who's been to your wedding twice already.",
    bullet: [
      'Save-the-dates -> RSVPs -> travel forms, all on schedule',
      '24/7 reply bot trained on your wedding + your city',
      'You text us back; we update everything for you',
    ],
    mockLabel: 'WhatsApp outreach + concierge bot',
    tint: 'rgba(32,201,151,0.07)',
    customMock: () => <WhatsAppBotMock />,
  },
  {
    tag: 'STEP 04  ·  Rooms',
    title: 'Room assignments, without the politics.',
    copy: "Upload a floor plan or hotel block and we help place every guest - siblings together, the loud cousins on a different floor than your in-laws, the late arrivals near the lobby. The puzzle that usually eats a Sunday afternoon, solved before lunch.",
    bullet: [
      'Drag-and-drop floor plan editor',
      'Smart suggestions based on family + side',
      'Per-guest room cards delivered via WhatsApp',
    ],
    mockLabel: 'Floor plan + room assignments',
    tint: 'rgba(108,92,231,0.06)',
    customMock: () => <RoomAssignmentsMock />,
  },
  {
    tag: 'STEP 05  ·  Transportation',
    title: 'Shuttles, airport pickups, venue transfers.',
    copy: "We collect every flight, optimize shuttle routes, and ping pickups before guests even land. Uncle Raj at 4 AM is no longer your problem - he gets a WhatsApp with his driver's name, license plate, and a real-time map.",
    bullet: [
      'Auto-collect flight info via WhatsApp',
      'Optimized shuttle routes + driver dispatch',
      'Live arrival board for the family',
    ],
    mockLabel: 'Travel & shuttle dashboard',
    tint: 'rgba(59,130,246,0.06)',
    customMock: () => <TransportationMock />,
  },
  {
    tag: 'STEP 06  ·  Vendor agent',
    title: 'We sit in your vendor chats.',
    copy: "Add us as a member of your caterer, florist, decor, and DJ groups. We summarize every thread, surface the action items, and chase the things you'd otherwise forget at 11pm. Nothing falls through the cracks because nobody's the project manager.",
    bullet: [
      'Reads your vendor WhatsApp groups for you',
      'Daily digest, action items, blockers',
      'Flags risks before they become disasters',
    ],
    mockLabel: 'Vendor digest + action items',
    tint: 'rgba(212,175,55,0.08)',
  },
];

export default function FeatureStepper() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const center = vh * 0.45;
      let idx = 0;
      let prog = 0;
      for (let i = 0; i < stepRefs.current.length; i++) {
        const el = stepRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= center) {
          idx = i;
          const span = r.height || 1;
          prog = Math.max(0, Math.min(1, (center - r.top) / span));
        }
      }
      setActive(idx);
      setProgress(prog);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="service"
      className="section bg-textured bg-paper-floral"
      style={{ background: 'var(--paper)' }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="The full kit"
          title="One platform. Everything coordinated."
          singleLine
        />

        {/* "Six steps" overview — six numbered chips with a dashed
            connector behind. Hidden on mobile. */}
        <div
          className="feature-steps-overview"
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '6%',
              right: '6%',
              top: 28,
              height: 1,
              borderTop: '1.5px dashed rgba(0,0,0,0.15)',
            }}
          />
          {OVERVIEW_STEPS.map((s, i) => (
            <div key={i} style={{ position: 'relative', padding: '0 12px', textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 24,
                  color: 'var(--accent)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {s.n}
              </div>
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  margin: '14px 0 0',
                  color: 'var(--text-strong)',
                  lineHeight: 1.3,
                }}
              >
                {s.t}
              </h4>
            </div>
          ))}
        </div>

        <div
          className="feature-steps-divider"
          style={{
            marginTop: 48,
            height: 1,
            background: 'rgba(0,0,0,0.06)',
          }}
        />

        <div
          className="stepper-grid"
          style={{
            marginTop: 64,
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: 'clamp(32px, 5vw, 80px)',
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT: scrolling step copy */}
          <div>
            {STEPS.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                style={{
                  minHeight: '70vh',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  paddingRight: 8,
                  opacity: active === i ? 1 : 0.45,
                  transition: 'opacity 0.5s ease',
                }}
              >
                <div className="mono" style={{
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 24, height: 1,
                    background: 'var(--accent)',
                  }} />
                  {s.tag}
                </div>
                <h3 className="display wrap-balance" style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(34px, 4.4vw, 60px)',
                  lineHeight: 1.02,
                  color: 'var(--text-strong)',
                  margin: 0,
                }}>
                  {s.title}
                </h3>
                <p className="wrap-pretty" style={{
                  fontSize: 18,
                  color: 'var(--text-muted)',
                  marginTop: 18,
                  lineHeight: 1.55,
                  maxWidth: '46ch',
                }}>
                  {s.copy}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '24px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  {s.bullet.map((b, j) => (
                    <li key={j} style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      fontSize: 15,
                      color: 'var(--text-strong)',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        marginTop: 8,
                        flex: 'none',
                      }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* RIGHT: sticky square viewport. The grid keeps the original
              1.05fr/1fr separator, but the stage extends past the
              container's right edge all the way to the viewport edge —
              ignoring the 32px container padding plus any auto-margin
              outside the 1280px max. Capped at 640px so it doesn't grow
              unboundedly on ultra-wide viewports. */}
          <div className="stepper-stage" style={{
            position: 'sticky',
            top: 'calc(50vh - 320px)',
            width: 'calc(100% + max(32px, (100vw - 1216px) / 2))',
            maxWidth: 640,
            aspectRatio: '1 / 1',
          }}>
            {/* progress rail */}
            <div className="stepper-rail" style={{
              position: 'absolute',
              left: -32,
              top: 8,
              bottom: 8,
              width: 2,
              background: 'rgba(0,0,0,0.07)',
              borderRadius: 2,
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: `${((active + progress) / STEPS.length) * 100}%`,
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'height 0.25s ease',
              }} />
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${(i / (STEPS.length - 1)) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 12, height: 12,
                  borderRadius: '50%',
                  background: i <= active ? 'var(--accent)' : 'white',
                  border: `2px solid ${i <= active ? 'var(--accent)' : 'rgba(0,0,0,0.15)'}`,
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 24,
              background: STEPS[active].tint,
              border: '1px solid rgba(0,0,0,0.06)',
              padding: 'clamp(20px, 2.4vw, 36px)',
              overflow: 'hidden',
              transition: 'background 0.6s ease',
            }}>

              {/* crossfade/slide stack */}
              {STEPS.map((s, i) => {
                const isActive = i === active;
                const isPrev = i < active;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      inset: 'clamp(20px, 2.4vw, 36px)',
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? 'translateY(0) scale(1)'
                        : isPrev
                          ? 'translateY(-24px) scale(0.97)'
                          : 'translateY(24px) scale(0.97)',
                      transition: 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                      pointerEvents: isActive ? 'auto' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      {s.customMock ? s.customMock() : <ImagePlaceholder label={s.mockLabel} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .stepper-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .stepper-stage { position: relative !important; top: auto !important; aspect-ratio: 1 / 1 !important; max-width: 520px; margin: 0 auto 8px; }
          .stepper-rail { display: none !important; }
        }
        @media (max-width: 768px) {
          .feature-steps-overview, .feature-steps-divider { display: none !important; }
        }
      `}</style>
    </section>
  );
}
