'use client';

/**
 * Shown after the couple clicks "Generate WhatsApp links". Renders one
 * wa.me deep link per recipient. Each link pre-fills the rendered message
 * and opens in the couple's personal WhatsApp — no Meta API involved.
 *
 * Each "Send" click marks that guest as contacted (status bump + event
 * logged) so the guest list can reflect progress.
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { OpenInNew, CheckCircle, ContentCopy, WhatsApp } from '@mui/icons-material';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { InfoAlert, SuccessAlert } from '@/components/shared/Alert';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { renderTemplate, type InviteTemplate } from '@/lib/invites/templates';
import type { AudienceGuest } from './AudiencePicker';

export interface SendLinksDialogProps {
  open: boolean;
  onClose: () => void;
  weddingSlug: string;
  template: InviteTemplate | null;
  sharedVars: Record<string, string>;
  recipients: AudienceGuest[];
  /** Called after a guest's send is marked — parent persists + refreshes. */
  onMarkSent: (guestId: string) => Promise<void> | void;
}

function toWaMeUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function rsvpLinkFor(weddingSlug: string, guestId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://phera.io';
  return `${base}/${weddingSlug}?g=${guestId}`;
}

function travelLinkFor(weddingSlug: string, guestId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://phera.io';
  return `${base}/${weddingSlug}/travel?g=${guestId}`;
}

export function SendLinksDialog({
  open,
  onClose,
  weddingSlug,
  template,
  sharedVars,
  recipients,
  onMarkSent,
}: SendLinksDialogProps) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const links = useMemo(() => {
    if (!template) return [];
    return recipients.map((r) => {
      const firstName = r.name.trim().split(/\s+/)[0] || 'there';
      const vars: Record<string, string> = {
        ...sharedVars,
        guest_first_name: firstName,
        rsvp_link: rsvpLinkFor(weddingSlug, r.id),
        travel_link: travelLinkFor(weddingSlug, r.id),
      };
      const message = renderTemplate(template.body, vars);
      return {
        guest: r,
        message,
        url: toWaMeUrl(r.phone || '', message),
      };
    });
  }, [recipients, sharedVars, template, weddingSlug]);

  const markSent = async (guestId: string) => {
    if (sentIds.has(guestId) || busyIds.has(guestId)) return;
    setBusyIds((s) => {
      const n = new Set(s);
      n.add(guestId);
      return n;
    });
    try {
      await onMarkSent(guestId);
      setSentIds((s) => {
        const n = new Set(s);
        n.add(guestId);
        return n;
      });
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(guestId);
        return n;
      });
    }
  };

  const openAndMark = (guestId: string, url: string) => {
    window.open(url, '_blank');
    markSent(guestId);
  };

  const copyAll = async () => {
    const text = links.map((l) => `${l.guest.name} — ${l.url}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Graceful: browser without clipboard permission — user can still use individual buttons.
    }
  };

  const allSent = links.length > 0 && links.every((l) => sentIds.has(l.guest.id));

  return (
    <PheraDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <PheraDialogTitle onClose={onClose}>
        Send {template?.title || 'invite'}
      </PheraDialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {allSent ? (
          <SuccessAlert>All {links.length} guests marked as contacted. You can close this dialog.</SuccessAlert>
        ) : (
          <InfoAlert>
            Each link opens WhatsApp on your phone with the message pre-filled for that guest. Tap &ldquo;Send&rdquo; —
            we&rsquo;ll mark them as contacted the moment you open the link.
          </InfoAlert>
        )}

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            {sentIds.size} of {links.length} sent
          </Typography>
          <SecondaryActionButton
            startIcon={<ContentCopy />}
            onClick={copyAll}
            sx={{ px: 1.5, py: 0.5 }}
          >
            {copied ? 'Copied!' : 'Copy all links'}
          </SecondaryActionButton>
        </Stack>

        <Box
          sx={{
            border: `1px solid ${COLORS.border.faint}`,
            borderRadius: RADII.md,
            bgcolor: COLORS.bg.white,
            overflow: 'hidden',
          }}
        >
          {links.map((l) => {
            const sent = sentIds.has(l.guest.id);
            const busy = busyIds.has(l.guest.id);
            return (
              <Box
                key={l.guest.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1.25,
                  borderBottom: `1px solid ${COLORS.border.faint}`,
                  '&:last-child': { borderBottom: 'none' },
                  bgcolor: sent ? COLORS.brand.primaryWash : 'transparent',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                    {l.guest.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                    {l.guest.phone}
                  </Typography>
                </Box>
                {sent ? (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CheckCircle sx={{ fontSize: 18, color: COLORS.brand.primary }} />
                    <Typography variant="body2" sx={{ color: COLORS.brand.primary, fontWeight: 600 }}>
                      Sent
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => window.open(l.url, '_blank')}
                      aria-label="Re-open WhatsApp"
                    >
                      <OpenInNew sx={{ fontSize: 16, color: COLORS.text.faint }} />
                    </IconButton>
                  </Stack>
                ) : (
                  <PrimaryActionButton
                    startIcon={busy ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <WhatsApp />}
                    onClick={() => openAndMark(l.guest.id, l.url)}
                    disabled={busy}
                    sx={{ px: 1.75, py: 0.5 }}
                  >
                    Send
                  </PrimaryActionButton>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <PrimaryActionButton onClick={onClose}>Done</PrimaryActionButton>
      </DialogActions>
    </PheraDialog>
  );
}

export default SendLinksDialog;
