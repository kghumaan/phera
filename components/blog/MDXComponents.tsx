import React from 'react';
import { Box, Typography } from '@mui/material';
import { COLORS, RADII, FONTS, TEXT } from '@/lib/theme/tokens';
import ChatDemo from './ChatDemo';
import Callout from './Callout';
import BlogCTA from './BlogCTA';
import PlannerChatEmbed from './PlannerChatEmbed';
import { FeatureGrid, Feature } from './FeatureGrid';

/** Shared body-copy styling for prose blocks (p, ul, ol). */
const BODY_SX = {
  fontFamily: FONTS.body,
  fontSize: { xs: TEXT.base, md: TEXT.lg },
  color: COLORS.text.muted,
  lineHeight: 1.7,
  mb: 2.5,
} as const;

const MDXComponents = {
  /* ── Headings ─────────────────────────────────────────────────────── */
  // Posts start at h2 — the page already renders the title as the h1 — but
  // h1 is mapped anyway so a stray one doesn't fall back to browser default.
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h1"
      sx={{
        fontFamily: FONTS.display,
        fontStyle: 'italic',
        fontSize: { xs: TEXT['3xl'], md: TEXT['4xl'] },
        color: COLORS.text.strong,
        lineHeight: 1.2,
        mt: 6,
        mb: 2,
      }}
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h2"
      sx={{
        fontFamily: FONTS.display,
        fontStyle: 'italic',
        fontSize: { xs: TEXT['2xl'], md: TEXT['3xl'] },
        color: COLORS.text.strong,
        lineHeight: 1.25,
        mt: 5,
        mb: 1.5,
      }}
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h3"
      sx={{
        fontFamily: FONTS.body,
        fontSize: { xs: TEXT.xl, md: TEXT['2xl'] },
        fontWeight: 600,
        color: COLORS.text.strong,
        mt: 4,
        mb: 1,
      }}
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h4"
      sx={{
        fontFamily: FONTS.body,
        fontSize: { xs: TEXT.lg, md: TEXT.xl },
        fontWeight: 600,
        color: COLORS.text.strong,
        mt: 3.5,
        mb: 1,
      }}
      {...props}
    />
  ),

  /* ── Prose ────────────────────────────────────────────────────────── */
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <Typography component="p" sx={BODY_SX} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <Box
      component="ul"
      sx={{ ...BODY_SX, pl: 3, listStyleType: 'disc', '& > li': { mb: 1 } }}
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <Box
      component="ol"
      sx={{ ...BODY_SX, pl: 3, listStyleType: 'decimal', '& > li': { mb: 1 } }}
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <Box component="li" sx={{ pl: 0.5 }} {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: `4px solid ${COLORS.brand.primary}`,
        pl: 2.5,
        my: 3,
        mx: 0,
        fontStyle: 'italic',
        color: COLORS.text.muted,
        fontFamily: FONTS.body,
        fontSize: { xs: TEXT.base, md: TEXT.lg },
        '& p': { mb: 0 },
      }}
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const external = props.href?.startsWith('http');
    return (
      <Box
        component="a"
        sx={{
          color: COLORS.brand.primary,
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          transition: 'color 120ms ease',
          '&:hover': { color: COLORS.brand.primaryHover },
        }}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...props}
      />
    );
  },
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Box
      component="img"
      sx={{ borderRadius: RADII.lg, my: 3, width: '100%' }}
      alt={props.alt ?? ''}
      {...props}
    />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <Box
      component="hr"
      sx={{ my: 5, border: 0, borderTop: `1px solid ${COLORS.border.light}` }}
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <Box component="strong" sx={{ fontWeight: 600, color: COLORS.text.strong }} {...props} />
  ),

  /* ── Tables (needs remark-gfm, wired up in app/blog/[slug]/page.tsx) ── */
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <Box sx={{ my: 4, overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontFamily: FONTS.body,
          fontSize: TEXT.base,
          border: `1px solid ${COLORS.border.light}`,
          borderRadius: RADII.md,
          overflow: 'hidden',
        }}
        {...props}
      />
    </Box>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <Box
      component="th"
      sx={{
        textAlign: 'left',
        px: 2,
        py: 1.25,
        bgcolor: COLORS.bg.subtle,
        borderBottom: `1px solid ${COLORS.border.light}`,
        fontWeight: 600,
        color: COLORS.text.strong,
        fontSize: TEXT.sm,
      }}
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <Box
      component="td"
      sx={{
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${COLORS.border.faint}`,
        color: COLORS.text.muted,
        verticalAlign: 'top',
      }}
      {...props}
    />
  ),

  /* ── Custom blog components, usable as JSX inside .mdx ─────────────── */
  ChatDemo,
  Callout,
  BlogCTA,
  PlannerChatEmbed,
  FeatureGrid,
  Feature,
};

export default MDXComponents;
