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
import { Box, DialogActions, DialogContent, Stack, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, Send, AutoAwesome } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { PheraCard } from '@/components/shared/Card';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PheraTextField } from '@/components/shared/TextField';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { SectionHeading } from '@/components/shared/PageHeading';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { renderTemplate, type InviteTemplate } from '@/lib/invites/templates';
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
  weddingSlug: string;
}

export function TemplateCard({
  template,
  expanded,
  onToggle,
  guests,
  defaultVars,
  onSubmit,
  weddingSlug,
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
  // Concierge-send confirmation flow.
  const [conciergeConfirmOpen, setConciergeConfirmOpen] = useState(false);
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeResult, setConciergeResult] = useState<
    | { kind: 'ok'; sent: number; failed: number; firstError?: string }
    | { kind: 'error'; message: string }
    | null
  >(null);

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

  const sendViaConcierge = async () => {
    if (!canSubmit) return;
    setConciergeSending(true);
    setConciergeResult(null);
    try {
      const res = await fetch('/api/invites/send-via-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingSlug,
          templateId: template.id,
          sharedVars: mergedVars,
          targetType: audience.mode,
          targetTags: audience.tags,
          targetGuestIds: audience.guestIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConciergeResult({ kind: 'error', message: data?.error || 'Send failed' });
      } else {
        const firstError = Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors[0]?.reason
          : undefined;
        setConciergeResult({
          kind: 'ok',
          sent: data.sent ?? 0,
          failed: data.failed ?? 0,
          firstError,
        });
        setConciergeConfirmOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setConciergeResult({ kind: 'error', message: msg });
    } finally {
      setConciergeSending(false);
    }
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
      {/* Header — title/description over the preview, always visible + clickable.
          Icon top-aligned with the title so multi-line descriptions don't drift
          the icon off-axis. Category badge removed. */}
      <Stack
        direction="row"
        alignItems="flex-start"
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
          <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 0.25 }}>
            {template.title}
          </Typography>
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

      {/* Collapsed preview — sits below the header so each card tile shows
          its message body at a glance. Hidden when expanded since the
          expanded layout puts the preview on the right column instead. */}
      {!expanded && (
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
      )}

      <Collapse in={expanded} timeout={180} unmountOnExit>
        <Box sx={{ px: 2, pb: 2, borderTop: `1px solid ${COLORS.border.faint}`, pt: 2 }}>
          {/* Two-column: form fields left, live preview right. Stacks on
              narrow widths so phones still get a readable composer. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
              gap: { xs: 2, md: 3 },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
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

              {/* "Who gets it" + CTAs live in the left column so the right
                  preview gets matching height instead of leaving big white
                  space below it. */}
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
                <SecondaryActionButton
                  startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
                  onClick={() => setConciergeConfirmOpen(true)}
                  disabled={!canSubmit}
                >
                  Send via Concierge
                </SecondaryActionButton>
                <PrimaryActionButton
                  startIcon={<Send />}
                  onClick={handleSend}
                  disabled={!canSubmit}
                >
                  Send from my WhatsApp
                </PrimaryActionButton>
              </Stack>

              {conciergeResult?.kind === 'ok' && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        conciergeResult.failed > 0 && conciergeResult.sent === 0
                          ? COLORS.accent.dangerText
                          : COLORS.accent.successText,
                    }}
                  >
                    Sent via Concierge — {conciergeResult.sent} delivered
                    {conciergeResult.failed > 0 ? `, ${conciergeResult.failed} failed` : ''}.
                  </Typography>
                  {conciergeResult.firstError && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, color: COLORS.text.muted, fontSize: '0.8125rem' }}
                    >
                      First error: {conciergeResult.firstError}
                    </Typography>
                  )}
                </Box>
              )}
              {conciergeResult?.kind === 'error' && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5, color: COLORS.accent.dangerText }}
                >
                  {conciergeResult.message}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: COLORS.bg.muted,
                borderRadius: RADII.md,
                display: 'flex',
                justifyContent: 'center',
                position: { md: 'sticky' },
                top: { md: 16 },
              }}
            >
              <WhatsAppPreview message={previewMessage} dense />
            </Box>
          </Box>
        </Box>
      </Collapse>

      {/* Concierge-send confirmation. Sends from the Phera WhatsApp Business
          number (Whapi) to every targeted guest with a phone — no wa.me
          handoff. Per-guest variables are rendered server-side. */}
      <PheraDialog
        open={conciergeConfirmOpen}
        onClose={() => (conciergeSending ? null : setConciergeConfirmOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <PheraDialogTitle onClose={() => setConciergeConfirmOpen(false)}>
          Send via Concierge?
        </PheraDialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
            This will send {template.title.toLowerCase()} to{' '}
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
              {recipients.length} guest{recipients.length === 1 ? '' : 's'}
            </Box>{' '}
            from the Phera Concierge WhatsApp number. Each guest will receive a personalized
            message — first names and links are filled in per-recipient.
          </Typography>
          {conciergeResult?.kind === 'error' && (
            <Typography
              variant="body2"
              sx={{ mt: 1.5, color: COLORS.accent.dangerText }}
            >
              {conciergeResult.message}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <SecondaryActionButton
            onClick={() => setConciergeConfirmOpen(false)}
            disabled={conciergeSending}
          >
            Cancel
          </SecondaryActionButton>
          <PrimaryActionButton
            onClick={sendViaConcierge}
            disabled={conciergeSending || !canSubmit}
            startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
          >
            {conciergeSending
              ? 'Sending…'
              : `Send to ${recipients.length} guest${recipients.length === 1 ? '' : 's'}`}
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    </PheraCard>
  );
}

export default TemplateCard;
