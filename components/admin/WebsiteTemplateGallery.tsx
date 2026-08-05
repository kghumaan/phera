'use client';

/**
 * Website Template gallery — a "start with a template" picker for the
 * Look & Feel editor.
 *
 * Each card is a *live* mini-composition (background + framed sample photo +
 * couple names in the template's font + a colour accent) built from the same
 * option assets the guest site uses, so it always reflects reality — no
 * separate screenshot pipeline to keep in sync.
 *
 * Interaction is non-destructive: clicking a card *previews* the look in the
 * live preview pane (nothing is saved); the couple then explicitly Applies it
 * or goes back to their own design. Smoothness when clicking quickly between
 * templates is inherited from the editor's existing DESIGN_UPDATE broadcast
 * (300ms debounce + serialized-compare, latest-wins) — this component only
 * raises the selection; it never spams the preview itself. Full-size background
 * and frame images are preloaded on mount so swaps don't flash.
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Stack, Collapse, IconButton } from '@mui/material';
import { Check, AutoAwesome, ExpandMore } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraCard } from '@/components/shared/Card';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import ProBadge from '@/components/admin/ProBadge';
import { getFrameConfig, BACKGROUND_UI_OPTIONS } from '@/lib/constants/images';
import { getCoupleFont } from '@/lib/constants/fonts';
import { designUsesProAssets } from '@/lib/constants/design-options';
import { WEBSITE_TEMPLATES, type WebsiteTemplate } from '@/lib/constants/website-templates';

const DEFAULT_SAMPLE_PHOTO = '/images/couple/couple-1.jpg';

function thumbForBackground(url: string): string {
  const match = BACKGROUND_UI_OPTIONS.find((b) => b.url === url);
  return match?.thumbUrl ?? url;
}

interface WebsiteTemplateGalleryProps {
  coupleNames: string;
  /** Shown under the names in each card, like the real hero. */
  weddingDate?: string | null;
  location?: string | null;
  /** Label for the sample CTA button in each card. */
  ctaLabel?: string;
  sampleImageUrl?: string | null;
  isPro: boolean;
  /** Template currently being previewed (override active), or null. */
  previewId: string | null;
  /** Template the saved design currently matches, or null. */
  appliedId: string | null;
  onPreview: (template: WebsiteTemplate | null) => void;
  onApply: (template: WebsiteTemplate) => void;
}

export default function WebsiteTemplateGallery({
  coupleNames,
  weddingDate,
  location,
  ctaLabel = 'View Details',
  sampleImageUrl,
  isPro,
  previewId,
  appliedId,
  onPreview,
  onApply,
}: WebsiteTemplateGalleryProps) {
  const samplePhoto = sampleImageUrl || DEFAULT_SAMPLE_PHOTO;
  const [expanded, setExpanded] = useState(true);
  const dateLine = weddingDate?.trim() || 'Your wedding date';
  const locationLine = location?.trim() || 'Your venue';

  // Warm the browser cache for full-size background + frame images so that
  // switching templates in the live preview swaps instantly (no blur flash).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urls = new Set<string>();
    WEBSITE_TEMPLATES.forEach((t) => {
      urls.add(t.config.background_image);
      urls.add(t.config.frame_image_url);
    });
    urls.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  const previewing = previewId ? WEBSITE_TEMPLATES.find((t) => t.id === previewId) ?? null : null;

  return (
    <PheraCard variant="muted" sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        onClick={() => setExpanded((e) => !e)}
        sx={{ mb: expanded ? 1 : 0, cursor: 'pointer' }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <AutoAwesome sx={{ fontSize: 18, color: COLORS.brand.primary }} />
          <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong }}>
            Start With a Template
          </Typography>
        </Stack>
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse templates' : 'Expand templates'}
          aria-expanded={expanded}
          sx={{ color: COLORS.text.subtle }}
        >
          <ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </IconButton>
      </Stack>

      <Collapse in={expanded}>
      <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2.5 }}>
        Pick a ready-made look to preview it live, then apply it — or keep customizing below.
        You can always fine-tune everything afterwards.
      </Typography>

      <Grid container spacing={2}>
        {WEBSITE_TEMPLATES.map((template) => {
          const { config } = template;
          const font = getCoupleFont(config.couple_name_font);
          const frameCfg = getFrameConfig(config.frame_image_url);
          const isProTemplate = designUsesProAssets(config);
          const isPreviewing = previewId === template.id;
          const isApplied = !previewId && appliedId === template.id;
          const isSelected = isPreviewing || isApplied;

          return (
            <Grid size={{ xs: 6, sm: 4 }} key={template.id}>
              <Box
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Preview the ${template.name} template`}
                onClick={() => onPreview(isPreviewing ? null : template)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreview(isPreviewing ? null : template);
                  }
                }}
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3 / 4',
                  borderRadius: RADII.sm,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isSelected
                    ? `3px solid ${COLORS.brand.primary}`
                    : `2px solid ${COLORS.border.faint}`,
                  transition: 'transform 0.18s ease, border-color 0.18s ease',
                  outline: 'none',
                  '&:hover': { transform: 'scale(1.02)', borderColor: COLORS.brand.primary },
                  '&:focus-visible': { borderColor: COLORS.brand.primary, boxShadow: `0 0 0 3px ${COLORS.brand.primarySubtle}` },
                }}
              >
                {/* Background */}
                <Box
                  component="img"
                  src={thumbForBackground(config.background_image)}
                  alt=""
                  aria-hidden
                  draggable={false}
                  sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />

                {/* Composition */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4%',
                    px: '8%',
                  }}
                >
                  {/* Framed sample photo */}
                  <Box sx={{ position: 'relative', width: '70%', aspectRatio: '1 / 1' }}>
                    <Box
                      component="img"
                      src={samplePhoto}
                      alt=""
                      aria-hidden
                      draggable={false}
                      sx={{
                        position: 'absolute',
                        top: frameCfg.top,
                        left: frameCfg.left,
                        width: frameCfg.width,
                        height: frameCfg.height,
                        objectFit: 'cover',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      component="img"
                      src={config.frame_image_url}
                      alt=""
                      aria-hidden
                      draggable={false}
                      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                    />
                  </Box>

                  {/* Date + names + location — mirrors the live site's hero:
                      small caps date, dominant serif names, underlined venue. */}
                  <Stack spacing={0.3} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                    <Typography
                      sx={{
                        '&&': { fontSize: 'clamp(0.42rem, 2vw, 0.62rem)' },
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1.2,
                        color: COLORS.text.strong,
                        textAlign: 'center',
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {dateLine}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: font.cssVar,
                        fontStyle: font.fontStyle || 'normal',
                        '&&': { fontSize: 'clamp(1rem, 4.6vw, 1.5rem)' },
                        lineHeight: 1.1,
                        color: COLORS.text.strong,
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {coupleNames}
                    </Typography>
                    <Typography
                      sx={{
                        '&&': { fontSize: 'clamp(0.42rem, 2vw, 0.62rem)' },
                        lineHeight: 1.2,
                        color: COLORS.text.strong,
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                        textAlign: 'center',
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {locationLine}
                    </Typography>
                  </Stack>

                  {/* Sample CTA button — text, in the template's button colour */}
                  <Box
                    sx={{
                      px: '7%',
                      py: '2.5%',
                      borderRadius: RADII.pill,
                      bgcolor: config.primary_color,
                      maxWidth: '90%',
                    }}
                  >
                    <Typography
                      sx={{
                        '&&': { fontSize: 'clamp(0.4rem, 1.9vw, 0.64rem)' },
                        fontWeight: 700,
                        letterSpacing: '0.3px',
                        lineHeight: 1,
                        color: COLORS.text.inverse,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ctaLabel}
                    </Typography>
                  </Box>
                </Box>

                {isProTemplate && !isPro && <ProBadge position="corner" />}

                {isPreviewing && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      bgcolor: COLORS.brand.primary,
                      px: 1,
                      py: 0.25,
                      borderRadius: RADII.sm,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.text.inverse, fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}
                    >
                      PREVIEWING
                    </Typography>
                  </Box>
                )}

                {isApplied && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: COLORS.brand.primary,
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check sx={{ color: COLORS.text.inverse, fontSize: 15 }} />
                  </Box>
                )}
              </Box>

              <Typography
                variant="body2"
                sx={{ mt: 1, fontWeight: 600, color: COLORS.text.strong, textAlign: 'center', lineHeight: 1.2 }}
              >
                {template.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', color: COLORS.text.subtle, textAlign: 'center', lineHeight: 1.25 }}
              >
                {template.description}
              </Typography>
            </Grid>
          );
        })}
      </Grid>

      {/* Action bar — only while a template is being previewed */}
      {previewing && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{
            mt: 2.5,
            pt: 2.5,
            borderTop: `1px solid ${COLORS.border.faint}`,
          }}
        >
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            Previewing{' '}
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
              {previewing.name}
            </Box>{' '}
            — not saved yet
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
            <SecondaryActionButton onClick={() => onPreview(null)}>
              Back to my design
            </SecondaryActionButton>
            <PrimaryActionButton startIcon={<Check />} onClick={() => onApply(previewing)}>
              Apply this look
            </PrimaryActionButton>
          </Stack>
        </Stack>
      )}
      </Collapse>
    </PheraCard>
  );
}
