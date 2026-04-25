'use client';

/**
 * Expandable template row. Collapsed = compact summary (icon + title +
 * category chip + description). Expanded = summary + inline composer
 * (variables form) on the left + live WhatsApp preview on the right +
 * audience picker below, then "Generate links" CTA.
 *
 * Mirrors the inline-edit pattern used on the schedule page — no modal
 * overlay, edit happens in place with the rest of the page still visible.
 */

import { useMemo, useState } from 'react';
import { Box, Stack, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, Send } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { PheraCard } from '@/components/shared/Card';
import { PheraChip } from '@/components/shared/Chip';
import { PheraTextField } from '@/components/shared/TextField';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { SectionHeading } from '@/components/shared/PageHeading';
import { COLORS, RADII } from '@/lib/theme/tokens';
import {
  CATEGORY_LABELS,
  renderTemplate,
  type InviteTemplate,
} from '@/lib/invites/templates';
import { WhatsAppPreview } from './WhatsAppPreview';
import {
  AudiencePicker,
  resolveAudience,
  type AudienceGuest,
  type AudienceSelection,
} from './AudiencePicker';

export interface TemplateCardSubmit {
  template: InviteTemplate;
  sharedVars: Record<string, string>;
  audience: AudienceSelection;
  recipients: AudienceGuest[];
}

export interface TemplateCardProps {
  template: InviteTemplate;
  expanded: boolean;
  onToggle: () => void;
  guests: AudienceGuest[];
  defaultVars: Record<string, string>;
  onSubmit: (draft: TemplateCardSubmit) => void;
}

export function TemplateCard({
  template,
  expanded,
  onToggle,
  guests,
  defaultVars,
  onSubmit,
}: TemplateCardProps) {
  const Icon = template.icon;

  // Form state is local per-card. Switching to a different template
  // resets because the other card unmounts its state.
  const [sharedVars, setSharedVars] = useState<Record<string, string>>({});
  const [audience, setAudience] = useState<AudienceSelection>({
    mode: 'all',
    tags: [],
    guestIds: [],
  });

  const mergedVars = { ...defaultVars, ...sharedVars };

  const recipients = useMemo(
    () => resolveAudience(guests, audience),
    [guests, audience],
  );

  const previewVars: Record<string, string> = {
    ...mergedVars,
    guest_first_name: recipients[0]?.name.split(' ')[0] || 'Alex',
    rsvp_link: mergedVars.rsvp_link || 'https://phera.io/rsvp/demo',
    travel_link: mergedVars.travel_link || 'https://phera.io/travel/demo',
  };

  const previewMessage = renderTemplate(template.body, previewVars);
  const editableVars = template.variables.filter((v) => !v.perGuest);
  const canSubmit = recipients.length > 0;

  const handleSend = () => {
    if (!canSubmit) return;
    onSubmit({ template, sharedVars: mergedVars, audience, recipients });
  };

  return (
    <PheraCard
      variant="default"
      sx={{
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderColor: expanded ? COLORS.brand.primary : COLORS.border.faint,
        transition: 'border-color 0.15s',
      }}
    >
      {/* Header — title/description over the preview, always visible + clickable. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={onToggle}
        sx={{
          p: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: expanded ? 'transparent' : COLORS.bg.muted },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: RADII.md,
            bgcolor: alpha(COLORS.brand.primary, 0.1),
            color: COLORS.brand.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
            <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              {template.title}
            </Typography>
            <PheraChip
              tone="neutral"
              label={CATEGORY_LABELS[template.category]}
              size="small"
            />
          </Stack>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            {template.description}
          </Typography>
        </Box>
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse template' : 'Expand template'}
          sx={{
            color: COLORS.text.faint,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <ExpandMore />
        </IconButton>
      </Stack>

      {/* Preview — always rendered, even when collapsed. Sits between the
          title/description row above and the expanded composer below. */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          bgcolor: COLORS.bg.muted,
          borderTop: `1px solid ${COLORS.border.faint}`,
          pt: 2,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <WhatsAppPreview message={previewMessage} dense />
      </Box>

      <Collapse in={expanded} timeout={180} unmountOnExit>
        <Box sx={{ px: 2, pb: 2, borderTop: `1px solid ${COLORS.border.faint}`, pt: 2 }}>
          <SectionHeading title="Message details" />
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            {editableVars.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                No customization needed — this template fills itself from guest context.
              </Typography>
            ) : (
              editableVars.map((v) => (
                <PheraTextField
                  key={v.key}
                  label={v.label}
                  placeholder={v.placeholder}
                  value={sharedVars[v.key] ?? defaultVars[v.key] ?? ''}
                  onChange={(e) =>
                    setSharedVars((prev) => ({ ...prev, [v.key]: e.target.value }))
                  }
                  size="small"
                  fullWidth
                  multiline={v.multiline}
                  minRows={v.multiline ? 3 : undefined}
                />
              ))
            )}
          </Stack>

          <Box sx={{ mt: 3 }}>
            <SectionHeading title="Who gets it" />
            <Box sx={{ mt: 1.5 }}>
              <AudiencePicker guests={guests} value={audience} onChange={setAudience} />
            </Box>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
            justifyContent="flex-end"
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `1px solid ${COLORS.border.faint}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: COLORS.text.muted, flex: 1, textAlign: 'left' }}
            >
              {recipients.length > 0
                ? `Ready to send to ${recipients.length} guest${recipients.length === 1 ? '' : 's'}`
                : 'Select an audience with at least one guest'}
            </Typography>
            <SecondaryActionButton onClick={onToggle}>Close</SecondaryActionButton>
            <PrimaryActionButton
              startIcon={<Send />}
              onClick={handleSend}
              disabled={!canSubmit}
            >
              Generate WhatsApp links
            </PrimaryActionButton>
          </Stack>
        </Box>
      </Collapse>
    </PheraCard>
  );
}

export default TemplateCard;
