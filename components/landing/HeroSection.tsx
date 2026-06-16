'use client';

/**
 * Landing Hero - 1:1 mirror of the Claude Design package's <Hero> function
 * (/tmp/phera-zip/app.jsx Hero). The cloud bg, marigold sway, fluid clamp
 * H1, highlight-strike, subtitle, two pill CTAs, and the marquee inside
 * the hero at the bottom all match the design verbatim.
 *
 * CTAs are wired to our routes:
 *   primary  -> /auth/login
 *   ghost    -> /demo
 */

import Image from 'next/image';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS } from '@/lib/theme/tokens';
import { LotusGlyph, Reveal } from './design-primitives';

const MARQUEE_WORDS = [
  'Save the dates',
  'RSVPs',
  'Dietary needs',
  'Plus-ones',
  'Flight numbers',
  'Hotel blocks',
  'Shuttle pickups',
  'Dress codes',
  'Visa walkthroughs',
  'Vendor coordination',
  'Cultural briefings',
  'Day-of details',
];

export default function HeroSection() {
  return (
    <section
      id="top"
      className="hero-clouds hero-section"
      style={{
        color: 'var(--text-strong)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* marigold garland corners */}
      <Image
        src="/images/overlays/entry-topleft.png"
        alt=""
        aria-hidden
        width={240}
        height={240}
        priority
        className="hero-garland hero-garland-left"
        style={{ width: 'clamp(140px, 16vw, 240px)', height: 'auto' }}
      />
      <Image
        src="/images/overlays/entry-topright.png"
        alt=""
        aria-hidden
        width={240}
        height={240}
        priority
        className="hero-garland hero-garland-right"
        style={{ width: 'clamp(140px, 16vw, 240px)', height: 'auto' }}
      />

      <div
        className="container hero-content"
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'left',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Reveal delay={1}>
          <h1
            className="display"
            style={{
              // Inline these too because MUI's CssBaseline + Tailwind preflight
              // both touch h1 and the cascade doesn't always pick up
              // `.phera-landing .display`. Inline style wins definitively.
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              lineHeight: 0.95,
              fontSize: 'clamp(56px, 10.5vw, 156px)',
              color: 'var(--text-strong)',
              maxWidth: '17ch',
              margin: 0,
            }}
          >
            <span style={{ display: 'block' }}>Your desi wedding,</span>
            <span className="highlight-strike" style={{ display: 'inline-block' }}>
              minus the headaches.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={2}>
          <p
            className="wrap-pretty"
            style={{
              marginTop: 32,
              fontSize: 'clamp(17px, 1.4vw, 22px)',
              color: 'var(--text-muted)',
              maxWidth: '60ch',
              lineHeight: 1.5,
            }}
          >
            One AI wedding planner that runs it all — just talk to it. Guest list, RSVPs, rooms, shuttles, vendors, and the midnight WhatsApps, handled by chat or voice.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="hero-cta-row">
            <ActionButton
              href="/auth/login"
              variant="contained"
              className="btn btn-primary"
              sx={{
                fontSize: { xs: 15, sm: 17 },
                padding: { xs: '13px 22px', sm: '18px 30px' },
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: 'var(--accent)',
                color: COLORS.text.inverse,
                '&:hover': { bgcolor: 'var(--accent-hover)' },
              }}
              endIcon={<span className="btn-arrow" style={{ display: 'inline-block' }}>→</span>}
            >
              Get started - it&apos;s free
            </ActionButton>
            <ActionButton
              href="/demo"
              variant="outlined"
              className="btn btn-ghost"
              sx={{
                fontSize: { xs: 15, sm: 17 },
                padding: { xs: '13px 22px', sm: '18px 30px' },
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                color: 'var(--text-strong)',
                borderColor: 'rgba(0,0,0,0.18)',
                bgcolor: 'transparent',
                '&:hover': {
                  borderColor: 'var(--text-strong)',
                  bgcolor: 'rgba(0,0,0,0.02)',
                },
              }}
            >
              View Demo
            </ActionButton>
          </div>
        </Reveal>
      </div>

      {/* Marquee at bottom of hero - design verbatim. */}
      <div
        className="hero-marquee-bar"
        style={{
          marginTop: 0,
          padding: '14px 0',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div className="marquee">
          <div className="marquee-track" style={{ color: 'var(--text-muted)' }}>
            {Array.from({ length: 2 }).flatMap((_, k) =>
              MARQUEE_WORDS.map((w, i) => (
                <span key={`${k}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
                  <span
                    className="serif hero-marquee-word"
                    style={{
                      // Inline fontFamily - MUI CssBaseline + Tailwind preflight
                      // can clobber the .phera-landing .serif cascade so the
                      // marquee falls back to Outfit. Locking it in inline.
                      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                      fontSize: 28,
                      fontStyle: 'italic',
                      fontWeight: 400,
                    }}
                  >{w}</span>
                  <LotusGlyph size={20} color="rgba(255,153,51,0.7)" />
                </span>
              )),
            )}
          </div>
        </div>
      </div>
      <style>{`
        /* Hero — push content down a bit so the H1 doesn't sit so high
           against the header. justify-content stays centered for the
           inner stack; the extra push comes from a min top inset. */
        .hero-section { padding-top: 100px; }
        .hero-content { padding-top: clamp(48px, 8vh, 120px); }
        .hero-cta-row { display: flex; gap: 14px; margin-top: 40px; flex-wrap: wrap; align-items: stretch; }
        .hero-cta-row > * {
          flex: 0 0 auto;
          /* Equal heights even though one button has an arrow icon. */
          min-height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 600px) {
          .hero-section { padding-top: 88px; }
          .hero-content { padding-top: clamp(64px, 10vh, 120px); }
          /* Both CTAs are the same size on mobile: equal flex basis,
             equal min-height, same horizontal padding. */
          .hero-cta-row { gap: 10px; margin-top: 28px; flex-direction: column; align-items: stretch; }
          .hero-cta-row > * {
            flex: 1 1 0;
            width: 100%;
            min-width: 0;
            min-height: 52px;
            box-sizing: border-box;
          }
          .hero-marquee-word { font-size: 22px !important; }
          .hero-marquee-bar { padding: 12px 0 !important; }
        }
      `}</style>
    </section>
  );
}
