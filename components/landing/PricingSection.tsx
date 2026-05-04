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

export default function PricingSection({ onBaseClick, onPremiumClick, onPlannerClick }: PricingProps) {
  // Map our PRICING_TIERS data into the design's card shape, preserving
  // the design's MOST CHOSEN highlight on the middle (Base) tier.
  const tiers: CardTier[] = PRICING_TIERS.map((t) => {
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
    };
  });

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
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {tiers.map((t, i) => (
            <Reveal key={i} delay={Math.min(3, i + 1) as 1 | 2 | 3}>
              <div
                style={{
                  background: 'white',
                  color: 'var(--text-strong)',
                  border: t.highlight ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 22,
                  padding: 32,
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
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="display" style={{ fontSize: 64, fontStyle: 'italic', lineHeight: 1, color: 'var(--text-strong)' }}>{t.price}</span>
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
                    className={t.highlight ? 'btn btn-primary' : 'btn btn-ghost'}
                    style={{ marginTop: 28, width: '100%' }}
                  >
                    {t.cta} <span className="btn-arrow">→</span>
                  </button>
                ) : (
                  <Link
                    href={t.href || '/auth/signup'}
                    className={t.highlight ? 'btn btn-primary' : 'btn btn-ghost'}
                    style={{ marginTop: 28, width: '100%' }}
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
              padding: 32,
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
              className="btn btn-ghost"
            >
              {PLANNER_TIER.buttonText} <span className="btn-arrow">→</span>
            </button>
          </div>
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .planner-strip { grid-template-columns: 1fr !important; gap: 20px !important; }
          .planner-price { padding-right: 0 !important; }
        }
      `}</style>
    </section>
  );
}
