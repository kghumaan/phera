'use client';

import { Box, Typography } from '@mui/material';
import { Fragment } from 'react';
import { COLORS } from '@/lib/theme/tokens';

/**
 * Minimal, injection-safe markdown for agent chat replies. Handles the small
 * subset the model actually emits — **bold**, *italic*, [links](/in-app or
 * https), bullet lists, and paragraph breaks — without pulling a full markdown
 * dependency or ever using dangerouslySetInnerHTML.
 */

// Bare URLs the model drops straight into prose (not [label](href) markdown) —
// still worth calling out as a link visually. Trailing punctuation (period,
// comma, em dash) is peeled off so it doesn't get swallowed into the link.
const BARE_URL_RE = /(https?:\/\/[^\s)]+)/g;
const TRAILING_PUNCT_RE = /[).,;:!?]+$/;

function renderBareUrls(text: string, keyPrefix: string) {
  const segments = text.split(BARE_URL_RE);
  return segments.filter(Boolean).map((seg, i) => {
    if (!seg.startsWith('http://') && !seg.startsWith('https://')) {
      return <Fragment key={`${keyPrefix}-u${i}`}>{seg}</Fragment>;
    }
    const trailingMatch = seg.match(TRAILING_PUNCT_RE);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const url = trailing ? seg.slice(0, -trailing.length) : seg;
    return (
      <Fragment key={`${keyPrefix}-u${i}`}>
        <Box
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: COLORS.brand.primary, fontWeight: 700 }}
        >
          {url}
        </Box>
        {trailing}
      </Fragment>
    );
  });
}

function renderEmphasis(text: string, keyPrefix: string) {
  // Split on **bold** and *italic* while keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${i}`} style={{ fontWeight: 700 }}>
          {renderBareUrls(part.slice(2, -2), `${keyPrefix}-${i}`)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${keyPrefix}-${i}`}>{renderBareUrls(part.slice(1, -1), `${keyPrefix}-${i}`)}</em>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{renderBareUrls(part, `${keyPrefix}-${i}`)}</Fragment>;
  });
}

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text: string, keyPrefix: string) {
  // Links first ([label](href)), then bold/italic within the surrounding text.
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let idx = 0;
  LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = LINK_RE.exec(text))) {
    if (m.index > last) nodes.push(...renderEmphasis(text.slice(last, m.index), `${keyPrefix}-t${idx}`));
    const href = m[2];
    // Injection-safe: in-app paths navigate in place; https opens a new tab;
    // anything else (javascript:, data:, …) renders as plain text.
    if (href.startsWith('/') || href.startsWith('https://')) {
      nodes.push(
        <Box
          component="a"
          key={`${keyPrefix}-a${idx}`}
          href={href}
          {...(href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          sx={{
            color: COLORS.brand.primary,
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            '&:hover': { color: COLORS.brand.primaryHover },
          }}
        >
          {m[1]}
        </Box>
      );
    } else {
      nodes.push(<Fragment key={`${keyPrefix}-a${idx}`}>{m[1]}</Fragment>);
    }
    last = m.index + m[0].length;
    idx++;
  }
  if (last < text.length) nodes.push(...renderEmphasis(text.slice(last), `${keyPrefix}-tail`));
  return nodes;
}

export function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = [...bullets];
    bullets = [];
    blocks.push(
      <Box key={`ul-${blocks.length}`} component="ul" sx={{ m: 0, my: 0.5, pl: 2.5 }}>
        {items.map((item, i) => (
          <Typography key={i} component="li" variant="body2" sx={{ color: COLORS.text.strong, mb: 0.25 }}>
            {renderInline(item, `li-${i}`)}
          </Typography>
        ))}
      </Box>
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();
    if (line.trim() === '') {
      blocks.push(<Box key={`sp-${blocks.length}`} sx={{ height: 8 }} />);
    } else {
      blocks.push(
        <Typography
          key={`p-${blocks.length}`}
          variant="body2"
          sx={{ color: COLORS.text.strong, wordBreak: 'break-word' }}
        >
          {renderInline(line, `p-${blocks.length}`)}
        </Typography>
      );
    }
  }
  flushBullets();

  return <>{blocks}</>;
}

export default MarkdownText;
