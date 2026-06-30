'use client';

/**
 * FinalCTA - "Stop chasing. Start celebrating." section.
 *
 * 1:1 mirror of the Claude Design package's FinalCTA function
 * (/tmp/phera-zip/app.jsx). Sky-soft bg, centered content, two pill CTAs.
 *
 * Wired to our routes:
 *   primary -> /auth/login
 *   ghost   -> wa.me link (footer's WhatsApp number)
 */

import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS } from '@/lib/theme/tokens';
import { Reveal } from './design-primitives';

export default function FinalCTASection() {
  return (
    <section
      id="cta"
      className="bg-textured bg-sky-soft"
      style={{
        background: 'var(--sky, #E8F1FB)',
        color: 'var(--text-strong)',
        padding: 'var(--section-pad) 0',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <Reveal>
          <div className="eyebrow" style={{ color: 'var(--accent)', justifyContent: 'center', display: 'inline-flex' }}>
            One last thing
          </div>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="display wrap-balance" style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            fontSize: 'clamp(54px, 9vw, 120px)',
            marginTop: 24,
            marginBottom: 0,
            color: 'var(--text-strong)',
            maxWidth: '14ch',
            marginInline: 'auto',
            lineHeight: 0.95,
          }}>
            Plan less.<br />Celebrate <em style={{ color: 'var(--accent)' }}>more</em>.
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="final-cta-kicker" style={{ marginTop: 20, fontSize: 17, color: 'var(--text-muted)', maxWidth: '50ch', marginInline: 'auto' }}>
            Spin up a free site in 10 minutes. Upgrade when you&apos;re ready for us to take over.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="final-cta-row" style={{ marginTop: 32, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <ActionButton
              href="/auth/signup"
              variant="contained"
              className="btn btn-primary"
              sx={{
                fontSize: { xs: 15, sm: 17 },
                padding: { xs: '13px 24px', sm: '18px 32px' },
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: 'var(--accent)',
                color: COLORS.text.inverse,
                '&:hover': { bgcolor: 'var(--accent-hover)' },
              }}
              endIcon={<span className="btn-arrow" style={{ display: 'inline-block' }}>→</span>}
            >
              Start free
            </ActionButton>
            {/* Pre-purchase human path — some couples want to talk to a real
                person before signing up. WhatsApp works today; swap for a
                booking link later if we add one. */}
            <ActionButton
              href="https://wa.me/15558397813"
              variant="outlined"
              className="btn btn-ghost"
              keepBackgroundOnLoad
              sx={{
                fontSize: { xs: 15, sm: 17 },
                padding: { xs: '13px 24px', sm: '18px 32px' },
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
              Talk to a human
            </ActionButton>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-subtle)' }}>
            Questions before you start? We usually reply within the day.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
