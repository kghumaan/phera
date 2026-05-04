'use client';

/**
 * Shared section container — single source of truth for landing-page
 * horizontal rhythm.
 *
 * Mirrors the design package's `.container { max-width: 1280px; margin: 0
 * auto; padding: 0 32px }` (with `@media (max-width: 768px) { padding: 0 20px }`).
 *
 * Use it in EVERY landing section so the hero and the rest of the page
 * sit on the same horizontal rails. Don't reach for MUI `Container
 * maxWidth="..."` on landing surfaces — that's how we end up with the
 * non-hero sections drifting wider than the hero.
 *
 * ```tsx
 * <Box component="section" sx={{ py: SECTION.py, bgcolor: '...' }}>
 *   <SectionContainer>
 *     ...
 *   </SectionContainer>
 * </Box>
 * ```
 *
 * Pass `sx` to layer in section-specific behaviour (flex, grid, etc.) — it
 * merges on top of the container baseline.
 */

import { Container, type ContainerProps } from '@mui/material';
import { SECTION } from '@/lib/theme/tokens';

export type SectionContainerProps = Omit<ContainerProps, 'maxWidth'>;

export default function SectionContainer({ sx, children, ...rest }: SectionContainerProps) {
  return (
    <Container
      maxWidth={false}
      {...rest}
      sx={{
        maxWidth: SECTION.maxWidth,
        mx: 'auto',
        width: '100%',
        px: SECTION.px,
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}
