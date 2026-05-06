'use client';

/**
 * Pricing - "One flat fee. Per wedding." section.
 *
 * 1:1 mirror of the Claude Design package's Pricing function
 * (/tmp/phera-zip/app.jsx). Three pricing cards + a planner strip
 * underneath. Wired to our PRICING_TIERS + PLANNER_TIER data and the
 * handleBaseAction / handlePremiumAction handlers from HomePageClient.
 */

import Link from 'next/link';
import { Reveal, SectionHeader } from './design-primitives';
import { PRICING_TIERS, PLANNER_TIER } from '@/lib/pricing/tiers';

interface PricingProps {
  onBaseClick: (e?: React.MouseEvent) => void;
  onPremiumClick: (e?: React.MouseEvent) => void;
  onPlannerClick: (e?: React.MouseEvent) => void;
  /** Which paid tier (if any) is mid-redirect — its CTA shows a spinner. */
  loadingTier?: 'base' | 'premium' | 'planner_perwedding' | null;
}

interface CardTier {
  id: string;
  name: string;
  price: string;
  sub: string;
  desc: string;
  features: string[];
  cta: string;
  href?: string;
  onClick?: (e?: React.MouseEvent) => void;
  highlight: boolean;
}

export default function PricingSection({ onBaseClick, onPremiumClick, onPlannerClick, loadingTier }: PricingProps) {
  // Map our PRICING_TIERS data into the design's card shape, preserving
  // the design's MOST CHOSEN highlight on the middle (Base) tier.
  const tiers: (CardTier & { tierId: 'base' | 'premium' | null })[] = PRICING_TIERS.map((t) => {
    const isFree = t.id === 'free';
    const isBase = t.id === 'paid';
    const isWhiteGlove = t.id === 'white_glove';
    return {
      id: t.id,
      name: t.name,
      price: t.price,
      sub: isFree ? 'forever' : 'one-time, per wedding',
      desc: t.description || (isBase
        ? 'The full ops team. WhatsApp outreach, concierge, travel, rooms.'
        : isWhiteGlove
          ? 'Plus reverse-destination, weekend concierge, dedicated coordinator.'
          : 'Beautiful site, guest list, RSVPs. The basics, on us.'),
      features: t.features,
      cta: t.buttonText,
      href: isBase || isWhiteGlove ? undefined : (t.buttonHref || '/auth/signup'),
      onClick: isBase ? onBaseClick : isWhiteGlove ? onPremiumClick : undefined,
      highlight: t.highlight,
      tierId: isBase ? 'base' : isWhiteGlove ? 'premium' : null,
    };
  });

  const isAnyLoading = !!loadingTier;
  const Spinner = (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'phera-spin 0.7s linear infinite',
        verticalAlign: 'middle',
      }}
    />
  );

  return (
    <section id="pricing" className="section" style={{ background: 'var(--paper)' }}>
      <div className="container">
        <SectionHeader
          eyebrow="Pricing"
          title="One flat fee. Per wedding."
          kicker="Less than a single shuttle bus rental. No subscription. No surprises."
          singleLine
        />

        <div
          className="pricing-grid"
          style={{
            marginTop: 'clamp(48px, 6vw, 80px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {tiers.map((t, i) => (
            <Reveal key={i} delay={Math.min(3, i + 1) as 1 | 2 | 3}>
              <div
                className="pricing-card"
                style={{
                  background: 'white',
                  color: 'var(--text-strong)',
                  border: t.highlight ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 22,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: t.highlight ? '0 30px 60px rgba(222,63,94,0.14)' : 'none',
                }}
              >
                {t.highlight && (
                  <span style={{
                    position: 'absolute', top: -12, right: 24,
                    background: 'var(--accent)', color: 'white',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                    padding: '5px 12px', borderRadius: 999,
                  }}>MOST CHOSEN</span>
                )}
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                  {t.name}
                </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    className="pricing-price display"
                    style={{
                      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      lineHeight: 1,
                      color: 'var(--text-strong)',
                    }}
                  >
                    {t.price}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{t.sub}</span>
                </div>
                <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {t.desc}
                </p>
                <ul style={{ listStyle: 'none', marginTop: 22, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {t.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-strong)' }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                {t.onClick ? (
                  <button
                    type="button"
                    onClick={(e) => t.onClick?.(e)}
                    disabled={isAnyLoading}
                    aria-busy={loadingTier === t.tierId}
                    className={t.highlight ? 'btn btn-primary' : 'btn btn-ghost'}
                    style={{
                      marginTop: 28,
                      width: '100%',
                      opacity: isAnyLoading && loadingTier !== t.tierId ? 0.55 : 1,
                      cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loadingTier === t.tierId ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        {Spinner} Redirecting to checkout…
                      </span>
                    ) : (
                      <>{t.cta} <span className="btn-arrow">→</span></>
                    )}
                  </button>
                ) : (
                  <Link
                    href={t.href || '/auth/signup'}
                    className={t.highlight ? 'btn btn-primary' : 'btn btn-ghost'}
                    style={{
                      marginTop: 28,
                      width: '100%',
                      pointerEvents: isAnyLoading ? 'none' : undefined,
                      opacity: isAnyLoading ? 0.55 : 1,
                    }}
                  >
                    {t.cta} <span className="btn-arrow">→</span>
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Planner strip - design verbatim, wired to our PLANNER_TIER copy. */}
        <Reveal delay={4}>
          <div
            className="planner-strip"
            style={{
              marginTop: 32,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,153,51,0.05))',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 22,
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 32,
              alignItems: 'center',
            }}
          >
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', textTransform: 'uppercase' }}>For wedding planners</div>
              <h3 className="display" style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                fontSize: 'clamp(24px, 3vw, 36px)',
                marginTop: 6,
                marginBottom: 0,
                lineHeight: 1.1,
                color: 'var(--text-strong)',
              }}>
                Wholesale pricing for the planners running 30 weddings a year.
              </h3>
              <p style={{ marginTop: 10, fontSize: 15, color: 'var(--text-muted)', maxWidth: '60ch' }}>
                {PLANNER_TIER.description}
              </p>
            </div>
            <div className="planner-price" style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingRight: 8 }}>
              <span className="display" style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 56,
                lineHeight: 1,
                color: 'var(--text-strong)',
              }}>
                {PLANNER_TIER.price}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
                {PLANNER_TIER.priceSuffix || '/wedding'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => onPlannerClick?.(e)}
              disabled={isAnyLoading}
              aria-busy={loadingTier === 'planner_perwedding'}
              className="btn btn-ghost"
              style={{
                opacity: isAnyLoading && loadingTier !== 'planner_perwedding' ? 0.55 : 1,
                cursor: isAnyLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingTier === 'planner_perwedding' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {Spinner} Redirecting…
                </span>
              ) : (
                <>{PLANNER_TIER.buttonText} <span className="btn-arrow">→</span></>
              )}
            </button>
          </div>
        </Reveal>
      </div>
      <style>{`
        @keyframes phera-spin { to { transform: rotate(360deg); } }
        .pricing-card { padding: 32px; }
        .pricing-price { font-size: 64px; }
        .planner-strip { padding: 32px; }
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .planner-strip { grid-template-columns: 1fr !important; gap: 20px !important; padding: 24px !important; }
          .planner-price { padding-right: 0 !important; }
        }
        @media (max-width: 600px) {
          .pricing-card { padding: 24px; border-radius: 18px !important; }
          .pricing-price { font-size: 52px !important; }
        }
      `}</style>
    </section>
  );
}
