'use client';

/**
 * AppComingSoon — compact "mobile app coming soon" landing section.
 *
 * A slim, centered band (NOT a full-height hero): section-shell header,
 * a live countdown to the next launch slot (lib/landing/app-launch), and
 * two informational store pills (no links — the apps aren't out yet).
 *
 * The countdown target self-rolls forward a week whenever it passes, so
 * this widget always shows a future date until the owner deletes it at
 * real launch.
 */

import { useEffect, useState } from 'react';
import AppleIcon from '@mui/icons-material/Apple';
import AndroidIcon from '@mui/icons-material/Android';
import { Reveal, SectionHeader } from './design-primitives';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { formatCountdown, nextLaunchDate } from '@/lib/landing/app-launch';

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function AppComingSoon() {
  // null until mounted — SSR + first client render show zeros so hydration
  // never mismatches; the interval takes over immediately after mount.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? null : formatCountdown(nextLaunchDate(now) - now);

  const blocks = [
    { value: remaining ? pad2(remaining.days) : '00', label: 'Days' },
    { value: remaining ? pad2(remaining.hours) : '00', label: 'Hours' },
    { value: remaining ? pad2(remaining.minutes) : '00', label: 'Min' },
    { value: remaining ? pad2(remaining.seconds) : '00', label: 'Sec' },
  ];

  return (
    <section id="app" className="section" style={{ background: 'var(--white)' }}>
      <div className="container">
        <SectionHeader
          align="center"
          eyebrow="On your phone"
          title="The Phera app is coming."
          kicker="Your whole wedding in your pocket — for couples and planners. Guests never need to install anything."
          singleLine
        />

        {/* Countdown */}
        <Reveal delay={3}>
          <div
            className="app-countdown"
            style={{
              marginTop: 'clamp(40px, 5vw, 64px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
            aria-label="Countdown to app launch"
          >
            {blocks.map((b) => (
              <div key={b.label} style={{ textAlign: 'center' }}>
                <div
                  className="app-count-num"
                  style={{
                    fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'var(--text-strong)',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: '2.2ch',
                  }}
                >
                  {b.value}
                </div>
                <div
                  className="mono"
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--text-subtle)',
                  }}
                >
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Store pills — informational only, no links yet. */}
        <Reveal delay={4}>
          <div
            className="app-badges"
            style={{
              marginTop: 'clamp(36px, 4vw, 56px)',
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <StorePill icon={<AppleIcon sx={{ fontSize: 30 }} />} store="App Store" />
            <StorePill icon={<AndroidIcon sx={{ fontSize: 30 }} />} store="Google Play" />
          </div>
        </Reveal>
      </div>

      <style>{`
        .app-countdown { gap: clamp(28px, 6vw, 88px); }
        .app-count-num { font-size: clamp(56px, 8vw, 92px); }
        @media (max-width: 600px) {
          .app-countdown { gap: 24px; }
          .app-count-num { font-size: clamp(44px, 12vw, 56px); }
        }
      `}</style>
    </section>
  );
}

function StorePill({ icon, store }: { icon: React.ReactNode; store: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        background: COLORS.text.strong,
        color: COLORS.text.inverse,
        borderRadius: RADII.md,
        padding: '10px 22px 10px 16px',
        opacity: 0.92,
        userSelect: 'none',
      }}
    >
      {icon}
      <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
        <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.75, letterSpacing: '0.02em' }}>
          Coming soon to
        </div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{store}</div>
      </div>
    </div>
  );
}
