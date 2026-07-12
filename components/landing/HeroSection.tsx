'use client';

/**
 * Landing Hero — cloud bg, marigold garlands, fluid clamp H1 with the
 * highlight-strike, and the marquee at the bottom, all centered around the
 * planner chat box (Origami-style): visitors type what they need and are
 * dropped straight into a live planner session, no account first. The old
 * pill CTAs live on as quiet text links under the box.
 */

import Image from 'next/image';
import Link from 'next/link';
import HeroPlannerChat from './HeroPlannerChat';
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
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
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
              fontSize: 'clamp(40px, 6vw, 84px)',
              color: 'var(--text-strong)',
              maxWidth: '17ch',
              margin: '0 auto',
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
              marginTop: 24,
              fontSize: 'clamp(15px, 1.1vw, 18px)',
              color: 'var(--text-muted)',
              maxWidth: '56ch',
              lineHeight: 1.5,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Tell your AI wedding planner what you need — guest lists, RSVPs, rooms, WhatsApp,
            vendors — and watch it get done.{' '}
            <Link
              href="/demo"
              style={{
                color: 'var(--text-strong)',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Try the live demo →
            </Link>
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="hero-chat-row" style={{ marginTop: 32, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <HeroPlannerChat />
          </div>
          {/* Quiet secondary path — the chat box is the primary CTA, the demo
              link lives inline at the end of the subtitle. */}
          <p
            className="hero-scope-line"
            style={{
              marginTop: 26,
              marginBottom: 0,
              fontSize: 'clamp(14px, 0.95vw, 14.5px)',
              color: 'var(--text-subtle)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            Planning weddings for clients?{' '}
            <Link
              href="/planners"
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Phera for planners →
            </Link>
          </p>
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
        @media (max-width: 600px) {
          .hero-section { padding-top: 88px; }
          .hero-content { padding-top: clamp(64px, 10vh, 120px); }
          .hero-chat-row { margin-top: 24px !important; }
          .hero-marquee-word { font-size: 22px !important; }
          .hero-marquee-bar { padding: 12px 0 !important; }
        }
      `}</style>
    </section>
  );
}
