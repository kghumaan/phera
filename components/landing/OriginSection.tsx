'use client';

/**
 * Origin - "We built the team / we wish we had." section.
 *
 * 1:1 mirror of the Claude Design package's Story function
 * (/tmp/phera-zip/app.jsx). Sunset bg, 2-col grid, photo with tilted
 * gradient backing + 10px white border + Sim & KV date pill, founder
 * IG pills below the byline.
 */

import { Instagram, LinkedIn, Language } from '@mui/icons-material';
import { Reveal } from './design-primitives';

interface SocialLinks {
  name: string;
  instagram: string;
  linkedin: string;
  website: string;
}

const FOUNDERS: SocialLinks[] = [
  {
    name: 'Sim Savani',
    instagram: 'https://www.instagram.com/simransimranaway/',
    linkedin: 'https://www.linkedin.com/in/simransavani/',
    website: 'https://simmetrystudios.com/',
  },
  {
    name: 'KV Ghumaan',
    instagram: 'https://www.instagram.com/kvghumaan/',
    linkedin: 'https://www.linkedin.com/in/kvghumaan',
    website: 'https://ghumaanventures.com',
  },
];

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
                Hi, we&rsquo;re KV and Sim. A software engineer and a product designer who met, fell in love, and then completely nerded out planning our wedding.
              </p>
              <p style={{ marginBottom: 18 }}>
                It started with the website. We looked at Zola, WithJoy, all of them, and nothing felt right. They weren&rsquo;t built for Indian weddings, and the aesthetic wasn&rsquo;t us. We wanted something <em>desi</em>, young, and alive — something that would get our guests excited months before the wedding. We were planning a destination wedding with a bunch of non-desi friends attending, and we wanted them to feel the color and energy of it all before they even boarded a flight.
              </p>
              <p style={{ marginBottom: 18 }}>
                So we built our own. And then while planning, we started noticing everything else that was broken. The follow-ups being sent manually. The same questions asked over and over. The things we were getting ChatGPT and Claude to cobble together because no tool actually handled them properly. One of us kept finding problems, the other kept building solutions.
              </p>
              <p style={{ marginBottom: 18 }}>
                By the time we were on our honeymoon, we had the bones of Phera. Everything we wished we&rsquo;d had. Everything we&rsquo;d already quietly built for ourselves.
              </p>
              <p style={{ marginBottom: 0 }}>
                We&rsquo;re still building it, and we&rsquo;d love your help making it better. Message us anytime — we reply, usually within the hour.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {FOUNDERS.map((f) => (
                <div key={f.name}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>
                    {f.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <SocialIconLink href={f.instagram} label={`${f.name} on Instagram`}>
                      <Instagram sx={{ fontSize: 18 }} />
                    </SocialIconLink>
                    <SocialIconLink href={f.linkedin} label={`${f.name} on LinkedIn`}>
                      <LinkedIn sx={{ fontSize: 18 }} />
                    </SocialIconLink>
                    <SocialIconLink href={f.website} label={`${f.name}'s website`}>
                      <Language sx={{ fontSize: 18 }} />
                    </SocialIconLink>
                  </div>
                </div>
              ))}
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

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 999,
        background: 'rgba(222,63,94,0.08)',
        color: 'var(--accent)',
        border: '1px solid rgba(222,63,94,0.18)',
        textDecoration: 'none',
        transition: 'background-color 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(222,63,94,0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(222,63,94,0.08)';
      }}
    >
      {children}
    </a>
  );
}
