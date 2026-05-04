'use client';

/**
 * Origin - "We built the team / we wish we had." section.
 *
 * 1:1 mirror of the Claude Design package's Story function
 * (/tmp/phera-zip/app.jsx). Sunset bg, 2-col grid, photo with tilted
 * gradient backing + 10px white border + Sim & KV date pill, founder
 * IG pills below the byline.
 */

import { Reveal } from './design-primitives';

export default function OriginSection() {
  return (
    <section
      id="story"
      className="section bg-textured bg-sunset"
      style={{ background: 'var(--cream-warm, #F4EBDB)', position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '0.95fr 1.1fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* LEFT: framed photo */}
        <Reveal>
          <div style={{ position: 'relative', maxWidth: 480, marginInline: 'auto' }}>
            <div style={{
              position: 'absolute',
              inset: -18,
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(222,63,94,0.18), rgba(255,153,51,0.14))',
              transform: 'rotate(-2deg)',
              zIndex: 0,
            }} />
            <div style={{
              position: 'relative',
              borderRadius: 22,
              overflow: 'hidden',
              border: '10px solid white',
              boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
              aspectRatio: '1 / 1',
              background: 'var(--cream)',
              zIndex: 1,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/couple/couple-8.jpg"
                alt="Sim and KV - founders of Phera"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: -18,
              right: -10,
              background: 'white',
              borderRadius: 14,
              padding: '10px 16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
              border: '1px solid rgba(0,0,0,0.05)',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--text-strong)',
              zIndex: 2,
            }}>
              Sim &amp; KV  ·  Feb 2025
            </div>
          </div>
        </Reveal>

        {/* RIGHT: copy */}
        <Reveal delay={1}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'inline-block', width: 28, height: 1, background: 'rgba(0,0,0,0.22)', flex: 'none' }} />
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>origin</span>
            </div>
            <h2 className="display" style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              fontSize: 'clamp(40px, 5vw, 76px)',
              marginTop: 16,
              marginBottom: 0,
              lineHeight: 1.02,
              color: 'var(--text-strong)',
            }}>
              We built <em>the team</em><br />we wish we had.
            </h2>
            <div style={{ width: 64, height: 4, background: 'var(--accent)', borderRadius: 2, marginTop: 24, marginBottom: 28 }} />
            <div style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '60ch' }}>
              <p style={{ marginBottom: 18 }}>
                We built Phera because we were that &ldquo;frustrated couple.&rdquo; Planning a modern Indian wedding comes with a level of complexity that global platforms just don&rsquo;t understand. Guest lists spanning continents, rituals to explain to non-desi friends, and an endless WhatsApp queue.
              </p>
              <p style={{ marginBottom: 18 }}>
                We didn&rsquo;t need another website builder. We needed a <em>team</em> to do the work. So we built one - and now we&rsquo;re opening it up to every couple who&rsquo;d rather enjoy their wedding than project-manage it.
              </p>
              <div style={{
                marginTop: 24,
                padding: '18px 22px',
                background: 'rgba(222,63,94,0.05)',
                border: '1px solid rgba(222,63,94,0.15)',
                borderRadius: 18,
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--text-subtle)',
                lineHeight: 1.65,
              }}>
                &ldquo;We&rsquo;re a young product and always improving. If you have suggestions or just want to chat about your wedding - message us. Sim or KV will reply, usually within the hour.&rdquo;
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>Sim Savani &amp; KV Ghumaan</div>
                <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 2 }}>Founders  ·  married Feb 2025  ·  still recovering</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                {[
                  { l: 'Sim · IG', h: 'https://www.instagram.com/simransimranaway/' },
                  { l: 'KV · IG',  h: 'https://www.instagram.com/kvghumaan/' },
                ].map((s) => (
                  <a key={s.l} href={s.h} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 12, padding: '8px 14px', borderRadius: 999,
                    background: 'rgba(222,63,94,0.08)', color: 'var(--accent)',
                    textDecoration: 'none', fontWeight: 600, letterSpacing: '0.04em',
                    border: '1px solid rgba(222,63,94,0.18)',
                  }}>{s.l}</a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #story .container { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}
