'use client';

/**
 * FAQ - "Things people ask." section.
 *
 * 1:1 mirror of the Claude Design package's FAQ function
 * (/tmp/phera-zip/app.jsx). Sky-soft bg, white headline card,
 * flat list with hairline dividers + rotating plus icons.
 */

import { useState } from 'react';
import { Reveal } from './design-primitives';
import { FAQ_ITEMS as FAQS } from '@/lib/landing/faq-content';

export default function FAQSection() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section id="faq" className="section bg-textured bg-paper-floral" style={{ background: 'var(--paper)' }}>
      <div className="container">
        {/* Custom header — keep "FAQ" eyebrow flush-left while centering the
            "Things people ask." title above the FAQ list. SectionHeader
            shares one alignment for both, so the header is inlined here. */}
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>FAQ</span>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <h2
              className="display wrap-balance"
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                lineHeight: 0.95,
                fontSize: 'clamp(50px, 6.5vw, 76px)',
                marginTop: 18,
                marginBottom: 0,
                color: 'var(--text-strong)',
                textAlign: 'center',
              }}
            >
              Things people ask.
            </h2>
          </Reveal>
        </div>
        <div className="faq-list" style={{ maxWidth: 800, margin: '48px auto 0' }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="faq-trigger"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    padding: '20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    fontFamily: 'var(--sans)',
                    color: 'inherit',
                  }}
                >
                  <span className="faq-question" style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-strong)', lineHeight: 1.35 }}>{f.q}</span>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.1)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)',
                    transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    fontSize: 18, lineHeight: 1, flexShrink: 0,
                  }}>+</span>
                </button>
                <div style={{
                  maxHeight: isOpen ? 600 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(.2,.7,.2,1)',
                }}>
                  <p className="faq-answer" style={{ paddingBottom: 22, fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '60ch', margin: 0 }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .phera-landing .faq-trigger:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-radius: 6px;
        }
        @media (max-width: 600px) {
          .faq-list { margin-top: 32px !important; }
          .faq-trigger { padding: 16px 0 !important; gap: 12px !important; }
          .faq-question { font-size: 16px !important; }
          .faq-answer { font-size: 15px !important; padding-bottom: 18px !important; }
        }
      `}</style>
    </section>
  );
}
