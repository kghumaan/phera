'use client';

import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { PheraCard } from '@/components/shared/Card';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { InfoAlert, ErrorAlert } from '@/components/shared/Alert';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface WhatsAppPairingPanelProps {
  weddingSlug: string;
  initialStatus: string;
  /** Fired once when the couple's device finishes pairing (status → auth). */
  onConnected: () => void;
  disabled?: boolean;
}

/** Normalize a base64 QR (raw or already a data URL) into an <img> src. */
function qrSrc(raw: string): string {
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
}

/**
 * Right-pane panel that walks the couple through linking their OWN WhatsApp to
 * Phera via QR (WhatsApp › Linked Devices). Provisioning the channel is deferred
 * until they tap Connect (it costs money), then we show the QR and poll status
 * until the device is paired.
 */
export function WhatsAppPairingPanel({
  weddingSlug,
  initialStatus,
  onConnected,
  disabled,
}: WhatsAppPairingPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  // Resume automatically if a channel is already mid-pairing (qr); otherwise
  // wait for an explicit Connect tap so we don't provision a paid channel early.
  const [started, setStarted] = useState(initialStatus === 'qr');
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectedRef = useRef(false);

  const startConnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not start the connection.');
        return;
      }
      setStatus(data?.status || 'pending');
      setStarted(true);
    } catch {
      setError('Could not start the connection.');
    } finally {
      setBusy(false);
    }
  }, [weddingSlug]);

  // Poll status + fetch the QR while pairing is in progress.
  useEffect(() => {
    if (status === 'auth') {
      if (!connectedRef.current) {
        connectedRef.current = true;
        onConnected();
      }
      return;
    }
    if (!started) return;

    let cancelled = false;

    const refreshQr = async () => {
      try {
        const res = await fetch(`/api/whatsapp/connect/qr?weddingSlug=${encodeURIComponent(weddingSlug)}`);
        const data = await res.json();
        if (!cancelled && data?.qrBase64) setQr(data.qrBase64);
      } catch {
        /* best-effort */
      }
    };

    const tick = async () => {
      try {
        const res = await fetch(`/api/whatsapp/connect?weddingSlug=${encodeURIComponent(weddingSlug)}`);
        const data = await res.json();
        if (!cancelled && data?.status) setStatus(data.status);
      } catch {
        /* keep polling */
      }
    };

    void refreshQr();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, started, weddingSlug, onConnected]);

  const connected = status === 'auth';

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Box>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
          <WhatsAppIcon sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
          <Typography variant="body1" sx={{ color: COLORS.text.strong, fontWeight: 700 }}>
            Connect your WhatsApp
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
          Link your own number so Phera can create your guest group and send messages as you — just
          like you would yourself. It&apos;s a one-time scan, and you can unlink anytime from
          WhatsApp.
        </Typography>
      </Box>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {connected ? (
        <PheraCard variant="muted" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircleRoundedIcon sx={{ color: COLORS.brand.primary }} />
            <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              WhatsApp connected — you&apos;re all set.
            </Typography>
          </Stack>
        </PheraCard>
      ) : !started ? (
        <PrimaryActionButton fullWidth loading={busy} disabled={disabled} onClick={startConnect}>
          Connect WhatsApp
        </PrimaryActionButton>
      ) : (
        <PheraCard variant="default" sx={{ p: 2 }}>
          <Stack spacing={1.5} alignItems="center">
            <InfoAlert>
              On your phone: WhatsApp → Settings → <strong>Linked Devices</strong> → Link a Device,
              then scan this code.
            </InfoAlert>
            {qr ? (
              <Box
                component="img"
                src={qrSrc(qr)}
                alt="WhatsApp pairing QR code"
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: RADII.md,
                  border: `1px solid ${COLORS.border.faint}`,
                  bgcolor: COLORS.bg.white,
                  p: 1,
                }}
              />
            ) : (
              <Stack spacing={1} alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={22} sx={{ color: COLORS.brand.primary }} />
                <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                  Preparing your secure code…
                </Typography>
              </Stack>
            )}
            <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
              Waiting for you to scan… this updates automatically.
            </Typography>
          </Stack>
        </PheraCard>
      )}
    </Stack>
  );
}

export default WhatsAppPairingPanel;
