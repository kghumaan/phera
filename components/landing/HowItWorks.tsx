'use client';

/**
 * HowItWorks - "Six steps, then we take over." section.
 *
 * 1:1 mirror of the Claude Design package's HowItWorks function
 * (/tmp/phera-zip/app.jsx). Six numbered chips on a paisley-cream
 * texture with a dashed connector behind on desktop.
 */

import { Reveal, SectionHeader } from './design-primitives';

const STEPS = [
  { n: '01', t: 'Bring your guest list', d: 'Spreadsheet, paste, or photo of a notebook. We clean it up and group families.' },
  { n: '02', t: 'Spin up your site', d: 'DIY, AI-assisted, or 1-on-1 with us. Your invitation, schedule, RSVP - live in an afternoon.' },
  { n: '03', t: 'Switch on the bot', d: 'We start outreach on a tuned timeline. The 24/7 reply bot answers questions in your voice.' },
  { n: '04', t: 'Sort rooms & shuttles', d: 'Upload a floor plan, share hotel blocks. We place guests and route every shuttle.' },
  { n: '05', t: 'Loop us into vendors', d: "Add us to your vendor WhatsApp groups. We summarize, chase, and surface what matters." },
  { n: '06', t: 'Show up, celebrate', d: 'Your Control Tower has every flight, room, dietary need, and shuttle. You just enjoy.' },
];

export default function HowItWorks() {
  return (
    <section className="section bg-textured bg-paisley" style={{ background: 'var(--cream)' }}>
      <div className="container">
        <SectionHeader eyebrow="How it works" title="Six steps, then we take over." />
        <div
          className="how-grid"
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0,
            position: 'relative',
          }}
        >
          <div
            className="how-line"
            style={{
              position: 'absolute',
              left: '6%',
              right: '6%',
              top: 32,
              height: 1,
              borderTop: '1.5px dashed rgba(0,0,0,0.15)',
            }}
          />
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={Math.min(4, i + 1) as 1 | 2 | 3 | 4} className="how-step">
              <div style={{ position: 'relative', padding: '0 12px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 28,
                  color: 'var(--accent)',
                  position: 'relative',
                  zIndex: 2,
                }}>{s.n}</div>
                <h4 style={{ fontSize: 17, fontWeight: 600, marginTop: 22, margin: '22px 0 0', color: 'var(--text-strong)' }}>{s.t}</h4>
                <p style={{ fontSize: 13.5, color: 'var(--text-subtle)', marginTop: 8, lineHeight: 1.5, maxWidth: 200, marginInline: 'auto' }}>
                  {s.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1100px) {
          .how-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 40px 16px !important; }
          .how-line { display: none; }
        }
        @media (max-width: 700px) {
          .how-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
