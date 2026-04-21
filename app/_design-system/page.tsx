'use client';

/**
 * Phera design-system reference page.
 *
 * Renders every shared primitive with every variant side-by-side.
 * Open at `/_design-system` to eyeball drift, verify tokens, or
 * pattern-match when building new UI. Route is under-hood because
 * it's for internal reference — not linked anywhere public.
 *
 * Add new primitives here the moment you ship them.
 */

import { Box, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  People,
  Hotel,
  CheckCircle,
  Cancel,
  HelpOutline,
  Event,
} from '@mui/icons-material';
import { InfoAlert, SuccessAlert, WarningAlert, ErrorAlert } from '@/components/shared/Alert';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraCard } from '@/components/shared/Card';
import { PageHeading, SectionHeading } from '@/components/shared/PageHeading';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatCard } from '@/components/shared/StatCard';
import { PheraChip } from '@/components/shared/Chip';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import {
  PrimaryActionButton,
  SecondaryActionButton,
  IconActionButton,
} from '@/components/admin/ActionButton';
import { COLORS, RADII, FONTS, TEXT } from '@/lib/theme/tokens';
import { useState } from 'react';

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <Stack spacing={0.5} alignItems="center">
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: RADII.md,
          bgcolor: value,
          border: `1px solid ${COLORS.border.light}`,
        }}
      />
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontWeight: 600 }}>
        {name}
      </Typography>
      <Typography variant="caption" sx={{ color: COLORS.text.faint, fontFamily: FONTS.body }}>
        {value}
      </Typography>
    </Stack>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" sx={{ fontFamily: FONTS.display, color: COLORS.text.strong }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {children}
      <Divider sx={{ borderColor: COLORS.border.faint, mt: 4 }} />
    </Stack>
  );
}

export default function DesignSystemPage() {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={6}>
        <PageHeading
          title="Phera Design System"
          subtitle="Every primitive, every variant. Reference page — eye-test before shipping new UI."
        />

        {/* COLORS */}
        <Section
          title="Colors"
          description="All sourced from COLORS in lib/theme/tokens. Never inline hex."
        >
          <SectionHeading title="Brand" />
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            <Swatch name="primary" value={COLORS.brand.primary} />
            <Swatch name="primaryHover" value={COLORS.brand.primaryHover} />
            <Swatch name="primarySubtle" value={COLORS.brand.primarySubtle} />
            <Swatch name="primaryWash" value={COLORS.brand.primaryWash} />
            <Swatch name="primaryBorder" value={COLORS.brand.primaryBorder} />
          </Stack>

          <SectionHeading title="Text" sx={{ mt: 3 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            <Swatch name="strong" value={COLORS.text.strong} />
            <Swatch name="muted" value={COLORS.text.muted} />
            <Swatch name="subtle" value={COLORS.text.subtle} />
            <Swatch name="faint" value={COLORS.text.faint} />
            <Swatch name="placeholder" value={COLORS.text.placeholder} />
          </Stack>

          <SectionHeading title="Accents" sx={{ mt: 3 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            <Swatch name="success" value={COLORS.accent.success} />
            <Swatch name="warning" value={COLORS.accent.warning} />
            <Swatch name="danger" value={COLORS.accent.danger} />
            <Swatch name="info" value={COLORS.accent.info} />
          </Stack>

          <SectionHeading title="Side" sx={{ mt: 3 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            <Swatch name="bride" value={COLORS.side.bride} />
            <Swatch name="groom" value={COLORS.side.groom} />
            <Swatch name="both" value={COLORS.side.both} />
          </Stack>
        </Section>

        {/* TYPOGRAPHY */}
        <Section
          title="Typography"
          description="14px (0.875rem) is the minimum. Use Typography variants — never inline fontSize below the floor. Anything ≥ 2rem auto-swaps to Instrument Serif."
        >
          <Stack spacing={1}>
            <Typography variant="h1">h1 — Instrument Serif</Typography>
            <Typography variant="h2">h2 — Instrument Serif</Typography>
            <Typography variant="h3">h3 — Instrument Serif</Typography>
            <Typography variant="h4">h4 — Outfit 600</Typography>
            <Typography variant="h5">h5 — Outfit 600</Typography>
            <Typography variant="h6">h6 — Outfit 600</Typography>
            <Typography variant="subtitle1">subtitle1 — Outfit 600</Typography>
            <Typography variant="subtitle2">subtitle2 — Outfit 600</Typography>
            <Typography variant="subtitleCaps">subtitleCaps</Typography>
            <Typography variant="body1">body1 — standard body copy. 1rem base.</Typography>
            <Typography variant="body2">body2 — dense body. 0.875rem floor.</Typography>
            <Typography variant="body3">body3 — small body. 14px floor.</Typography>
            <Typography variant="caption">caption — meta/labels.</Typography>
          </Stack>
        </Section>

        {/* RADII */}
        <Section
          title="Radii"
          description="Every borderRadius literal must come from RADII."
        >
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            {(['sm', 'md', 'lg', 'xl', 'cta', 'dialog', 'pill'] as const).map((k) => (
              <Stack key={k} spacing={0.5} alignItems="center">
                <Box sx={{ width: 80, height: 80, borderRadius: RADII[k], bgcolor: COLORS.brand.primaryWash, border: `1px solid ${COLORS.brand.primaryBorder}` }} />
                <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontWeight: 600 }}>{k}</Typography>
                <Typography variant="caption" sx={{ color: COLORS.text.faint }}>{RADII[k]}</Typography>
              </Stack>
            ))}
          </Stack>
        </Section>

        {/* BUTTONS */}
        <Section
          title="Buttons"
          description="Every CTA uses ActionButton wrappers. Loading state, spinner, disabled styling all baked in."
        >
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            <PrimaryActionButton>Primary</PrimaryActionButton>
            <PrimaryActionButton disabled>Disabled</PrimaryActionButton>
            <PrimaryActionButton loading>Loading</PrimaryActionButton>
            <SecondaryActionButton>Secondary</SecondaryActionButton>
            <SecondaryActionButton disabled>Disabled</SecondaryActionButton>
            <IconActionButton>
              <CheckCircle fontSize="small" />
            </IconActionButton>
          </Stack>
        </Section>

        {/* ALERTS */}
        <Section
          title="Alerts"
          description="Four tones. White-tinted bg, token-driven icon + text. Pass onClose for dismissible."
        >
          <Stack spacing={2}>
            <InfoAlert>Info — neutral notice.</InfoAlert>
            <SuccessAlert>Success — operation complete.</SuccessAlert>
            <WarningAlert>Warning — please review before continuing.</WarningAlert>
            <ErrorAlert>Error — something went wrong.</ErrorAlert>
            <InfoAlert title="With title">Title + body copy pair.</InfoAlert>
            {!dismissedAlert && (
              <SuccessAlert onClose={() => setDismissedAlert(true)}>
                Dismissible — click the × to close.
              </SuccessAlert>
            )}
          </Stack>
        </Section>

        {/* CARDS */}
        <Section
          title="Cards"
          description="PheraCard with variant. Never hand-roll Paper with borderRadius + border inline."
        >
          <Grid container spacing={2}>
            {(['default', 'muted', 'feature', 'hero'] as const).map((v) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={v}>
                <PheraCard variant={v} sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, mb: 1 }}>
                    {v}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                    Example content in a {v} card.
                  </Typography>
                </PheraCard>
              </Grid>
            ))}
          </Grid>
        </Section>

        {/* CHIPS */}
        <Section
          title="Chips"
          description="PheraChip with tone. Resolves tone → tokens automatically."
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <PheraChip tone="neutral" label="Neutral" />
            <PheraChip tone="brand" label="Brand" />
            <PheraChip tone="success" label="Attending" />
            <PheraChip tone="warning" label="Maybe" />
            <PheraChip tone="danger" label="Not Attending" />
            <PheraChip tone="info" label="Info" />
            <PheraChip tone="side-bride" label="Bride" />
            <PheraChip tone="side-groom" label="Groom" />
            <PheraChip tone="side-both" label="Both" />
          </Stack>
        </Section>

        {/* TEXT FIELDS */}
        <Section
          title="Text fields"
          description="PheraTextField wraps ENHANCED_TEXT_FIELD_SX. Consistent height, focus ring, label treatment."
        >
          <Stack spacing={2} sx={{ maxWidth: 400 }}>
            <PheraTextField label="Full name" placeholder="Priya Sharma" />
            <PheraTextField label="With value" defaultValue="priya@email.com" />
            <PheraTextField label="Disabled" disabled defaultValue="locked" />
            <PheraTextField label="With error" error helperText="Required field" />
            <PheraTextField label="Multiline" multiline rows={3} placeholder="Write here…" />
          </Stack>
        </Section>

        {/* STAT CARD */}
        <Section
          title="Stat cards"
          description="Icon + big number + label. Click + selected work for tab-style UIs."
        >
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
            <StatCard icon={<People />} value={220} label="Total Responses" iconColor={COLORS.brand.primary} />
            <StatCard icon={<CheckCircle />} value={180} label="Attending" iconColor={COLORS.accent.success} hint="including plus-ones" selected />
            <StatCard icon={<HelpOutline />} value={12} label="Maybe" iconColor={COLORS.accent.warning} />
            <StatCard icon={<Cancel />} value={28} label="Not Attending" iconColor={COLORS.accent.danger} />
          </Stack>
        </Section>

        {/* EMPTY STATE */}
        <Section
          title="Empty states"
          description="Replaces the ad-hoc `<Box py=6 textAlign=center>` pattern."
        >
          <PheraCard sx={{ p: 0 }}>
            <EmptyState
              icon={<Hotel sx={{ fontSize: 40 }} />}
              title="No rooms yet"
              subtitle="Upload a floorplan or list above, or add rooms manually one at a time."
              action={<SecondaryActionButton>Add Room</SecondaryActionButton>}
            />
          </PheraCard>
        </Section>

        {/* MENU */}
        <Section
          title="Dropdown menus"
          description="PheraMenu + PheraMenuItem. Always white-bg, dark text — no more black MUI default."
        >
          <Stack direction="row" spacing={2}>
            <SecondaryActionButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              Open menu
            </SecondaryActionButton>
            <PheraMenu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <PheraMenuItem onClick={() => setMenuAnchor(null)}>First option</PheraMenuItem>
              <PheraMenuItem onClick={() => setMenuAnchor(null)}>Second option</PheraMenuItem>
              <PheraMenuItem onClick={() => setMenuAnchor(null)}>Third option</PheraMenuItem>
            </PheraMenu>
          </Stack>
        </Section>

        {/* DIALOG */}
        <Section
          title="Dialogs"
          description="PheraDialog + PheraDialogTitle. Serif-display title, dialog radius, close button built-in."
        >
          <Stack direction="row" spacing={2}>
            <PrimaryActionButton onClick={() => setDialogOpen(true)}>Open dialog</PrimaryActionButton>
            <PheraDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
              <PheraDialogTitle onClose={() => setDialogOpen(false)}>
                Example Dialog
              </PheraDialogTitle>
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 2 }}>
                  Dialog body content. Uses token radii + shadow automatically.
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <SecondaryActionButton onClick={() => setDialogOpen(false)}>Cancel</SecondaryActionButton>
                  <PrimaryActionButton onClick={() => setDialogOpen(false)}>Confirm</PrimaryActionButton>
                </Stack>
              </Box>
            </PheraDialog>
          </Stack>
        </Section>
      </Stack>
    </Container>
  );
}
