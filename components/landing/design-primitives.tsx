'use client';

/**
 * Shared primitives ported verbatim from the Claude Design package
 * (/tmp/phera-zip/components-base.jsx + app.jsx).
 *
 * Used by every landing section so the design's JSX maps over with
 * minimal translation.
 */

import { useEffect, useRef } from 'react';

/* ============ Reveal on scroll ============ */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-visible');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const cls = `reveal ${delay ? `reveal-delay-${delay}` : ''} ${className}`.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ElTag: any = Tag;
  return <ElTag ref={ref} className={cls}>{children}</ElTag>;
}

/* ============ Lotus glyph (used by marquee + footer) ============ */
export function LotusGlyph({
  size = 32,
  color = 'currentColor',
  className = '',
  style = {},
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M27.6936 14.2925C28.514 15.3601 29.3788 16.4886 29.8523 17.7968C30.5511 19.7256 30.6792 21.9522 30.2587 23.9452C29.8755 25.7602 29.2394 27.0528 28.2914 28.6336C26.7175 31.258 25.2036 32.9992 24.6539 36.1555C24.475 37.1813 24.5523 38.2832 24.4177 39.2893C24.4004 39.4176 24.2518 39.7538 24.1864 39.8608C24.0767 40.0415 23.8097 40.0693 23.6811 39.8848C23.4816 39.5993 23.4378 38.6194 23.4049 38.2334C23.2227 36.0774 23.0411 34.1593 21.8818 32.2556C19.8139 28.8608 17.492 25.8981 17.4126 21.7116C17.3585 18.8521 18.8502 16.2213 20.4857 13.9626C21.6159 12.4016 22.5352 11.1458 23.3233 9.33833C23.5924 8.72034 23.8075 7.85215 24.0956 7.2689C24.1859 7.0866 24.3621 6.91553 24.561 7.04597C24.8388 7.2288 24.8582 8.46533 24.9225 8.82672C25.3225 11.0742 26.3478 12.5411 27.693 14.2925Z" fill={color}/>
      <path d="M35.2705 36.419C33.5831 37.996 31.3261 39.0118 29.0831 39.5731C28.3016 39.7688 27.5054 39.9078 26.7304 39.9692C26.4856 39.9885 26.1948 40.1563 25.9267 40.136L25.7959 39.8356C25.8029 39.7875 25.9716 39.7153 26.0288 39.6527C28.4486 37.0289 28.4864 33.3033 29.7809 30.1064C31.3872 26.1397 34.8717 23.7762 39.1069 23.2127C39.2722 23.1908 39.4803 23.0476 39.6738 23.0999C39.8327 23.1427 40.0187 23.2967 39.9976 23.4747C39.9814 23.6094 39.5641 24.2472 39.4706 24.5086C37.967 28.7122 38.8615 33.0622 35.2694 36.4195Z" fill={color}/>
      <path d="M16.4709 38.8124C14.8505 38.1874 12.9297 37.0268 11.8946 35.6128C9.83541 32.7997 9.52356 29.319 8.78472 26.0194C8.63338 25.3437 8.45989 24.8529 8.18965 24.2012C8.0675 23.9072 7.64593 23.4646 8.09506 23.2507C8.37828 23.1155 8.69392 23.2117 8.98524 23.2539C14.049 23.9874 17.3649 27.202 18.742 31.9936C19.5641 34.8542 19.5473 37.1038 21.7292 39.4101C21.9011 39.5918 22.3416 39.7656 22.0573 40.1099C21.9157 40.2809 21.1904 40.1104 20.959 40.065C19.4549 39.7688 17.8761 39.355 16.4698 38.8129Z" fill={color}/>
      <path d="M12.4109 37.4277C13.6448 38.544 15.1868 39.4736 16.7439 40.0649C17.0001 40.1622 17.3006 40.2868 17.5682 40.2926L17.4779 40.6177L15.3241 40.9331C11.09 41.3442 7.18879 39.8735 4.96308 36.2136C4.15128 34.8782 3.70322 33.3669 2.51633 32.272C2.32013 32.0908 2.00665 32.0261 1.99963 31.7123C1.99422 31.475 2.17691 31.4001 2.37797 31.336C4.46044 30.6704 7.24608 31.336 9.04804 32.4939C9.39665 32.7179 9.55987 33.4754 9.73715 33.8438C10.3522 35.1247 11.3467 36.466 12.4104 37.4277Z" fill={color}/>
      <path d="M30.3943 40.5435C30.3067 40.4456 30.3094 40.3285 30.4337 40.2671C30.6288 40.1703 31.1985 40.0896 31.4585 39.9982C34.0214 39.0947 37.1978 36.4196 38.3161 33.9508C38.5469 33.4408 38.6458 32.6795 39.17 32.3897C40.1861 31.8289 41.1206 31.3804 42.3027 31.2115C43.5841 31.0286 44.3143 30.9618 45.5623 31.3398C45.7898 31.4087 46.0639 31.3082 45.9866 31.6985C45.9315 31.9776 45.7315 32.0075 45.5893 32.1641C45.0445 32.765 44.5538 33.3419 44.1381 34.0433C42.9253 36.0881 42.1805 38.1864 39.9273 39.4475C37.173 40.9893 35.0905 41.1486 31.966 40.8327C31.6433 40.8001 30.5813 40.7536 30.3943 40.544Z" fill={color}/>
      <path d="M25.7937 19.1114C26.2974 19.245 26.4985 19.5562 26.7303 19.9763C26.9498 20.3736 27.2978 21.2904 27.3508 21.7683C27.4475 22.644 27.3217 24.1063 26.9184 24.8948C26.5294 25.6555 26.2307 26.3824 25.5715 26.9079C24.5717 27.7049 23.1021 27.0648 22.8776 26.9079C22.1081 26.3701 21.3061 25.5658 20.8791 23.6795C20.4193 21.6482 21.0045 19.4551 22.2714 17.9208C22.7897 17.2927 23.6723 16.5287 24.0452 15.8263C24.1322 15.6621 24.2955 14.9153 24.3527 14.8998C24.4635 14.8699 24.5035 14.9479 24.5641 15.0099C24.6246 15.0719 25.4526 16.386 25.4991 16.4908C25.8272 17.2365 25.6796 18.3143 25.7942 19.1119Z" fill={color}/>
    </svg>
  );
}

/* ============ Section header (eyebrow + display title + kicker) ============ */
export function SectionHeader({
  eyebrow,
  title,
  kicker,
  align = 'left',
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  kicker?: React.ReactNode;
  align?: 'left' | 'center';
}) {
  const isCenter = align === 'center';
  return (
    <div style={{ textAlign: align, maxWidth: 880, margin: isCenter ? '0 auto' : '0' }}>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: isCenter ? 'center' : 'flex-start' }}>
          <span style={{ display: 'inline-block', width: 28, height: 1, background: 'rgba(0,0,0,0.22)', flex: 'none' }} />
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>{eyebrow}</span>
        </div>
      </Reveal>
      <Reveal delay={1}>
        <h2 className="display wrap-balance" style={{
          // Inline font props - MUI CssBaseline + Tailwind preflight reset
          // h1-h6 in ways that beat `.phera-landing .display` cascade.
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 400,
          letterSpacing: '-0.025em',
          lineHeight: 0.95,
          fontSize: 'clamp(36px, 5.5vw, 76px)',
          marginTop: 18,
          marginBottom: 0,
          color: 'var(--text-strong)',
          maxWidth: '18ch',
          marginLeft: isCenter ? 'auto' : 0,
          marginRight: isCenter ? 'auto' : 0,
        }}>
          {title}
        </h2>
      </Reveal>
      {kicker && (
        <Reveal delay={2}>
          <p className="wrap-pretty" style={{ marginTop: 18, fontSize: 18, color: 'var(--text-muted)', maxWidth: '52ch', marginLeft: isCenter ? 'auto' : 0, marginRight: isCenter ? 'auto' : 0 }}>
            {kicker}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ============ Image placeholder (used inside FeatureStepper steps) ============ */
export function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: 380,
      borderRadius: 18,
      background: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 14px, rgba(0,0,0,0.02) 14px 28px)',
      border: '1.5px dashed rgba(0,0,0,0.18)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      color: 'var(--text-subtle)',
      textAlign: 'center',
      padding: 32,
      position: 'relative',
    }}>
      <div className="mono" style={{
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.35)',
      }}>
        Image placeholder
      </div>
      <div className="display" style={{
        fontSize: 22,
        fontStyle: 'italic',
        color: 'var(--text-strong)',
        lineHeight: 1.2,
        maxWidth: '24ch',
      }}>
        {label}
      </div>
      <div className="mono" style={{
        fontSize: 10,
        letterSpacing: '0.14em',
        color: 'rgba(0,0,0,0.3)',
        marginTop: 4,
      }}>
        drop a screenshot here
      </div>
    </div>
  );
}
