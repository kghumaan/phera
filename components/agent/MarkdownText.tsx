'use client';

import { Box, Typography } from '@mui/material';
import { Fragment } from 'react';
import { COLORS } from '@/lib/theme/tokens';

/**
 * Minimal, injection-safe markdown for agent chat replies. Handles the small
 * subset the model actually emits — **bold**, *italic*, bullet lists, and
 * paragraph breaks — without pulling a full markdown dependency or ever using
 * dangerouslySetInnerHTML.
 */

function renderInline(text: string, keyPrefix: string) {
  // Split on **bold** and *italic* while keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${i}`} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
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
