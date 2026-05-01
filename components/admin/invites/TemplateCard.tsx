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

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, DialogActions, DialogContent, Stack, Typography, IconButton } from '@mui/material';
import { toast } from 'sonner';
import { ExpandMore, Send, AutoAwesome } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { PheraCard } from '@/components/shared/Card';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PheraTextField } from '@/components/shared/TextField';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { SectionHeading } from '@/components/shared/PageHeading';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { renderTemplate, type InviteTemplate } from '@/lib/invites/templates';
import type { BroadcastDataField } from '@/lib/supabase/broadcasts-service';
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

  // Auto-detected data-collection schema. Mirrors the BroadcastComposer flow:
  // we hand the rendered preview body to the suggest-fields endpoint and, if
  // it spots one or more asks (e.g. "share your dietary restrictions"), we
  // surface chips telling the couple what we'll track when they send via the
  // Phera bot. wa.me sends are advisory only — replies land in the couple's
  // own WhatsApp so we can't attribute them.
  const [dataSchema, setDataSchema] = useState<BroadcastDataField[]>([]);
  const [collectsData, setCollectsData] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const detectReqId = useRef(0);

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

  // Strip unfilled `{{placeholder}}` tokens so a body that's nothing but
  // empty placeholders (e.g. the Create custom template before the user
  // types anything) reads as empty here. Without this, every Create custom
  // card would briefly flash "Scanning…" against the literal `{{message_body}}`
  // string the renderer leaves behind.
  const meaningfulPreview = previewMessage.replace(/\{\{[^}]*\}\}/g, '').trim();
  const hasMessageContent = meaningfulPreview.length >= 6;

  // Debounced auto-detect against the rendered preview body. Skipped when the
  // card is collapsed (no point burning a Gemini call on every keystroke if
  // the user can't see the result yet) or when the body is essentially empty.
  useEffect(() => {
    if (!expanded) return;
    if (!hasMessageContent) {
      setDataSchema([]);
      setCollectsData(false);
      setDetecting(false);
      return;
    }
    const trimmed = previewMessage.trim();
    if (trimmed.length < 8) {
      setDataSchema([]);
      setCollectsData(false);
      setDetecting(false);
      return;
    }
    const reqId = ++detectReqId.current;
    setDetecting(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/concierge/broadcasts/suggest-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed }),
        });
        const data = await res.json();
        if (reqId !== detectReqId.current) return;
        const fields: BroadcastDataField[] = Array.isArray(data?.fields) ? data.fields : [];
        setDataSchema(fields);
        setCollectsData(fields.length > 0);
      } catch {
        // suggest-fields is best-effort; silent failure is fine
      } finally {
        if (reqId === detectReqId.current) setDetecting(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [previewMessage, expanded, hasMessageContent]);

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
          collectsData,
          dataSchema,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Send failed';
        setConciergeResult({ kind: 'error', message: msg });
        toast.error(`Bot send failed: ${msg}`);
      } else {
        const firstError = Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors[0]?.reason
          : undefined;
        const sent = data.sent ?? 0;
        const failed = data.failed ?? 0;
        setConciergeResult({ kind: 'ok', sent, failed, firstError });
        setConciergeConfirmOpen(false);
        if (failed > 0) {
          toast.error(
            `${failed} send${failed === 1 ? '' : 's'} failed${firstError ? `: ${firstError}` : ''}`,
          );
        } else {
          toast.success(`Sent to ${sent} guest${sent === 1 ? '' : 's'} via Bot`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setConciergeResult({ kind: 'error', message: msg });
      toast.error(`Bot send failed: ${msg}`);
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

      {/* Collapsed cards stay compact — preview is reserved for the expanded
          right column so every tile in the grid keeps a uniform height. */}

      {/* Hard mount/unmount keyed off expanded — no Collapse animation. The
          grid parent reorders the card position when expandedId changes, and
          a 180ms height transition was racing that reorder, leaving stale
          DOM visible inside a narrow column. */}
      {expanded && (
        <Box sx={{ px: 2, pb: 2, borderTop: `1px solid ${COLORS.border.faint}`, pt: 2 }}>
          {/* Two-column: form fields left, live preview right. Stacks on
              narrow widths so phones still get a readable composer. */}
          <Box
            sx={{
              display: 'grid',
              // Right column fixed at the preview's max width (360 + 32 padding)
              // so the WhatsApp bubble keeps a constant footprint regardless
              // of message length. `auto` was sizing to content, shrinking
              // the bubble to the size of the placeholder when empty.
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 392px' },
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
                      minRows={v.multiline ? v.minRows ?? 3 : undefined}
                      maxRows={v.multiline ? v.maxRows : undefined}
                    />
                  ))
                )}
              </Stack>

              {/* "Who gets it" — recipient summary row also hosts the send
                  CTAs via the picker's `actions` slot, so the buttons sit on
                  the same line as "X recipients · N skipped". */}
              <Box sx={{ mt: 3 }}>
                <SectionHeading title="Who gets it" />
                <Box sx={{ mt: 1.5 }}>
                  <AudiencePicker
                    guests={guests}
                    value={audience}
                    onChange={setAudience}
                    actions={
                      <>
                        <SecondaryActionButton
                          startIcon={<Send />}
                          onClick={handleSend}
                          disabled={!canSubmit}
                        >
                          Send from my WhatsApp
                        </SecondaryActionButton>
                        <PrimaryActionButton
                          startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
                          onClick={() => setConciergeConfirmOpen(true)}
                          disabled={!canSubmit}
                        >
                          Send via Bot
                        </PrimaryActionButton>
                      </>
                    }
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: COLORS.text.faint, fontSize: '0.8125rem', textAlign: 'right' }}
                >
                  We&apos;re only able to track bot messages.
                </Typography>

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
                      Sent via Bot — {conciergeResult.sent} delivered
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
            </Box>

            {/* Right column: WhatsApp preview + (when relevant) the auto-detect
                chip strip directly underneath, sharing the preview's width
                so the visual block stays anchored to what the guest will see. */}
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: COLORS.bg.muted,
                  borderRadius: RADII.md,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <WhatsAppPreview message={previewMessage} dense />
              </Box>

              {hasMessageContent && (detecting || (collectsData && dataSchema.length > 0)) && (
                <Box
                  sx={{
                    p: 1.75,
                    borderRadius: RADII.md,
                    bgcolor:
                      collectsData && dataSchema.length > 0
                        ? alpha(COLORS.brand.primary, 0.05)
                        : COLORS.bg.subtle,
                    border: '1px solid',
                    borderColor:
                      collectsData && dataSchema.length > 0
                        ? alpha(COLORS.brand.primary, 0.2)
                        : COLORS.border.faint,
                  }}
                >
                  {detecting ? (
                    <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                      Scanning your message for info you&apos;re asking for…
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <AutoAwesome sx={{ fontSize: 16, color: COLORS.brand.primary }} />
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: COLORS.text.strong }}>
                          We&apos;ll track these replies for you
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ gap: 0.75 }}>
                        {dataSchema.map((f) => (
                          <Chip
                            key={f.key}
                            label={f.label}
                            size="small"
                            sx={{
                              bgcolor: COLORS.bg.white,
                              color: COLORS.brand.primary,
                              fontWeight: 600,
                              border: `1px solid ${alpha(COLORS.brand.primary, 0.3)}`,
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography variant="body2" sx={{ color: COLORS.text.faint, fontSize: '0.8125rem' }}>
                        Replies surface in Guest Responses &rsaquo; Collected Data when you Send via Bot.
                      </Typography>
                    </Stack>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      )}

      {/* Bot-send confirmation. Sends from the Phera WhatsApp Business
          number (Whapi) to every targeted guest with a phone — no wa.me
          handoff. Per-guest variables are rendered server-side. */}
      <PheraDialog
        open={conciergeConfirmOpen}
        onClose={() => (conciergeSending ? null : setConciergeConfirmOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <PheraDialogTitle onClose={() => setConciergeConfirmOpen(false)}>
          Send via Bot?
        </PheraDialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
            This will send {template.title.toLowerCase()} to{' '}
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
              {recipients.length} guest{recipients.length === 1 ? '' : 's'}
            </Box>{' '}
            from the Phera Bot WhatsApp number. Each guest will receive a personalized
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
