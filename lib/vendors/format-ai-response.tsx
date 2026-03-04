import React from 'react';
import { Typography, Box } from '@mui/material';

/**
 * Lightweight markdown parser for AI responses.
 * Handles: **bold**, ## headers, - bullets, 1. numbered lists, paragraph breaks.
 */
export function parseAIResponse(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<Box key={key++} sx={{ height: 8 }} />);
      continue;
    }

    // ## or ### headers
    const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      elements.push(
        <Typography
          key={key++}
          sx={{
            fontWeight: 700,
            fontSize: level === 2 ? '0.88rem' : '0.85rem',
            color: '#1a1a1a',
            mt: i > 0 ? 1 : 0,
            mb: 0.5,
            lineHeight: 1.4,
          }}
        >
          {renderInline(headerMatch[2])}
        </Typography>
      );
      continue;
    }

    // Bullet points (- or *)
    const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <Box key={key++} sx={{ display: 'flex', gap: 1, pl: 1, mb: 0.25 }}>
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: '#DE3F5E',
              mt: '7px',
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#1a1a1a' }}>
            {renderInline(bulletMatch[1])}
          </Typography>
        </Box>
      );
      continue;
    }

    // Numbered lists (1. 2. etc.)
    const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      elements.push(
        <Box key={key++} sx={{ display: 'flex', gap: 1, pl: 1, mb: 0.25 }}>
          <Typography
            sx={{
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: '#6a6a6a',
              fontWeight: 600,
              minWidth: 16,
              flexShrink: 0,
            }}
          >
            {numberedMatch[1]}.
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#1a1a1a' }}>
            {renderInline(numberedMatch[2])}
          </Typography>
        </Box>
      );
      continue;
    }

    // Regular text line
    elements.push(
      <Typography key={key++} sx={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#1a1a1a' }}>
        {renderInline(line)}
      </Typography>
    );
  }

  return elements;
}

/** Parse inline **bold** markers within a text string */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
