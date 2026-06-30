'use client';

import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { InfoAlert, SuccessAlert, ErrorAlert } from '@/components/shared/Alert';
import { COLORS } from '@/lib/theme/tokens';
import type { WhatsAppBroadcastDraft } from '@/lib/agent/types';

export interface BroadcastPanelProps {
  weddingSlug: string;
  draft: WhatsAppBroadcastDraft;
  /** Fired after a successful send — passes a short human summary back to chat. */
  onSent: (summary: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function audienceLabel(draft: WhatsAppBroadcastDraft): string {
  if (draft.audience === 'tags') return `Tagged: ${draft.tags.join(', ') || '—'}`;
  if (draft.audience === 'specific') return `${draft.count} selected`;
  return 'Everyone with a phone';
}

/**
 * Right-pane panel to review a drafted guest broadcast, confirm the audience,
 * and choose how to send: from the couple's OWN number (if connected) or from
 * Phera's number. The send is the couple's explicit action here — the agent
 * never sends on its own.
 */
export function BroadcastPanel({ weddingSlug, draft, onSent, onCancel, disabled }: BroadcastPanelProps) {
  const [message, setMessage] = useState(draft.message);
  const [sendingVia, setSendingVia] = useState<'couple' | 'phera' | null>(null);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (via: 'couple' | 'phera') => {
    if (!message.trim() || draft.count === 0) return;
    setSendingVia(via);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingSlug,
          message: message.trim(),
          audience: draft.audience,
          tags: draft.tags,
          guestIds: draft.guestIds,
          via,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Send failed.');
        return;
      }
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
      const from = via === 'couple' ? 'your WhatsApp' : "Phera's number";
      onSent(
        `Sent to ${data.sent ?? 0} guest(s)${data.failed ? `, ${data.failed} failed` : ''} from ${from}.`,
      );
    } catch {
      setError('Send failed.');
    } finally {
      setSendingVia(null);
    }
  };

  const busy = sendingVia !== null;

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Box>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
          <SendRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
          <Typography variant="body1" sx={{ color: COLORS.text.strong, fontWeight: 700 }}>
            Send to your guests
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <PheraChip size="small" tone="brand" label={`${draft.count} guest${draft.count === 1 ? '' : 's'}`} />
          <PheraChip size="small" tone="neutral" label={audienceLabel(draft)} />
        </Stack>
        {draft.sampleNames.length > 0 && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle, display: 'block', mt: 0.75 }}>
            e.g. {draft.sampleNames.join(', ')}
            {draft.count > draft.sampleNames.length ? ', …' : ''}
          </Typography>
        )}
      </Box>

      <PheraTextField
        fullWidth
        multiline
        minRows={3}
        maxRows={10}
        value={message}
        disabled={busy || disabled || !!result}
        onChange={(e) => setMessage(e.target.value)}
        label="Message"
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {result ? (
        <SuccessAlert>
          Sent to {result.sent} guest{result.sent === 1 ? '' : 's'}
          {result.failed ? `, ${result.failed} couldn’t be reached` : ''}.
        </SuccessAlert>
      ) : (
        <Stack spacing={1}>
          {draft.connected ? (
            <>
              <PrimaryActionButton
                fullWidth
                startIcon={<WhatsAppIcon fontSize="small" />}
                loading={sendingVia === 'couple'}
                disabled={busy || disabled || draft.count === 0 || !message.trim()}
                onClick={() => send('couple')}
              >
                Send from my WhatsApp
              </PrimaryActionButton>
              <SecondaryActionButton
                fullWidth
                startIcon={<GroupsRoundedIcon fontSize="small" />}
                loading={sendingVia === 'phera'}
                disabled={busy || disabled || draft.count === 0 || !message.trim()}
                onClick={() => send('phera')}
              >
                Send from Phera&apos;s number
              </SecondaryActionButton>
            </>
          ) : (
            <>
              <InfoAlert>
                Want these to come from your own number? Ask me to connect your WhatsApp first.
              </InfoAlert>
              <PrimaryActionButton
                fullWidth
                startIcon={<GroupsRoundedIcon fontSize="small" />}
                loading={sendingVia === 'phera'}
                disabled={busy || disabled || draft.count === 0 || !message.trim()}
                onClick={() => send('phera')}
              >
                Send from Phera&apos;s number
              </PrimaryActionButton>
            </>
          )}
          <SecondaryActionButton fullWidth disabled={busy} onClick={onCancel}>
            Cancel
          </SecondaryActionButton>
        </Stack>
      )}
    </Stack>
  );
}

export default BroadcastPanel;
