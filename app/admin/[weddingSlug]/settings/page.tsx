'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  alpha,
} from '@mui/material';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { PheraCard } from '@/components/shared/Card';
import { PheraTextField } from '@/components/shared/TextField';
import { PageHeading } from '@/components/shared/PageHeading';
import { SuccessAlert, InfoAlert } from '@/components/shared/Alert';
import { useState, useEffect, use, useCallback } from 'react';
import { CheckCircle, Cancel, Launch, ContentCopy } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function SettingsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { user: authUser } = useAuth();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'live'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [googleSheetsId, setGoogleSheetsId] = useState('');
  const [initialSettings, setInitialSettings] = useState<{ whatsapp: string; sheets: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const normalizedStatus = (wedding.status === 'live') ? 'live' : 'draft';
        setStatus(normalizedStatus);

        if (wedding.status !== 'live' && wedding.status !== 'draft') {
          await weddingService.updateWedding(wedding.id, { status: 'draft' });
        }

        const settingsData = await weddingService.getSettings(wedding.id);
        if (settingsData) {
          setSettings(settingsData);
          setWhatsappLink(settingsData.whatsapp_group_link || '');
          setGoogleSheetsId(settingsData.google_sheets_id || '');
          setInitialSettings({
            whatsapp: settingsData.whatsapp_group_link || '',
            sheets: settingsData.google_sheets_id || '',
          });
        } else {
          setInitialSettings({ whatsapp: '', sheets: '' });
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      const errorMessage = 'Failed to load settings';
      setError(errorMessage);
      showStatus('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = useCallback(async () => {
    if (isViewOnly) return;
    if (!weddingId) return;

    if (settings?.id) {
      await weddingService.updateSettings(weddingId, {
        whatsapp_group_link: whatsappLink,
        google_sheets_id: googleSheetsId,
      });
    } else {
      await weddingService.createSettings({
        wedding_id: weddingId,
        whatsapp_group_link: whatsappLink,
        google_sheets_id: googleSheetsId,
        pin_codes: [],
        lapse_event_codes: {},
      });
    }

    await weddingService.markUnpublishedChanges(weddingId);
    setInitialSettings({ whatsapp: whatsappLink, sheets: googleSheetsId });
  }, [weddingId, settings?.id, whatsappLink, googleSheetsId]);

  const { saveStatus, debouncedSave } = useAutoSave({ onSave: saveSettings, enabled: !!authUser });

  useEffect(() => {
    if (initialSettings) {
      const dirty =
        whatsappLink !== initialSettings.whatsapp ||
        googleSheetsId !== initialSettings.sheets;
      if (dirty) {
        debouncedSave();
      }
    }
  }, [whatsappLink, googleSheetsId, initialSettings, debouncedSave]);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void }>({ open: false, message: '', confirmLabel: 'Confirm', confirmColor: COLORS.accent.danger, onConfirm: () => {} });

  const doUpdateStatus = async (newStatus: 'draft' | 'live') => {
    setUpdatingStatus(true);
    try {
      const result = await weddingService.updateWedding(weddingId!, { status: newStatus });
      if (!result) throw new Error('Failed to update status');
      setStatus(newStatus);
      const statusMessages = {
        draft: 'Wedding set to draft mode',
        live: '🎉 Wedding website is now live!'
      };
      showStatus('saved', statusMessages[newStatus]);
    } catch (err) {
      const errorMessage = 'Failed to update status';
      setError(errorMessage);
      showStatus('error', errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'draft' | 'live') => {
    if (isViewOnly) return;
    if (newStatus === 'live') {
      setConfirmDialog({
        open: true,
        message: 'Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.',
        confirmLabel: 'Publish',
        confirmColor: COLORS.brand.primary,
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          await doUpdateStatus('live');
        },
      });
    } else {
      await doUpdateStatus(newStatus);
    }
  };

  const handlePublishToggle = async () => {
    if (isViewOnly) return;
    if (status === 'live') {
      setConfirmDialog({
        open: true,
        message: 'Are you sure you want to deactivate your wedding website? It will no longer be accessible to guests.',
        confirmLabel: 'Deactivate',
        confirmColor: COLORS.accent.danger,
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          await doUpdateStatus('draft');
        },
      });
    } else {
      setConfirmDialog({
        open: true,
        message: 'Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.',
        confirmLabel: 'Publish',
        confirmColor: COLORS.brand.primary,
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          await doUpdateStatus('live');
        },
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showStatus('saved', 'Copied to clipboard!');
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading settings..." />
      </Box>
    );
  }

  const weddingUrl = `${window.location.origin}/${weddingSlug}`;

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={3}>
        <PageHeading
          title="Settings & Publish"
          subtitle="Manage your wedding website settings and publish when ready"
        />

        {/* Publish Control Section */}
        <PheraCard
          variant={status === 'live' ? 'feature' : 'muted'}
          sx={{
            p: 4,
            border: status === 'live' ? `2px solid ${COLORS.brand.primary}` : undefined,
            bgcolor: status === 'live' ? alpha(COLORS.brand.primary, 0.03) : undefined,
          }}
        >
          <Stack spacing={3}>
            {/* Current Status Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
                  Website Status
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                  {status === 'draft' ? 'Your wedding website is in draft mode' : 'Your wedding website is live'}
                </Typography>
              </Box>
              <Chip
                label={status.toUpperCase()}
                icon={status === 'live' ? <CheckCircle sx={{ fontSize: 18 }} /> : undefined}
                sx={{
                  bgcolor: status === 'live' ? COLORS.brand.primary : COLORS.text.subtle,
                  color: COLORS.text.inverse,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 2.5,
                  height: 'auto',
                  '& .MuiChip-label': { px: 1 },
                  '& .MuiChip-icon': { color: COLORS.text.inverse },
                }}
              />
            </Box>

            {/* Status Description */}
            {status === 'live' ? (
              <SuccessAlert>
                Your wedding website is now live and accessible to all guests with their unique PIN codes!
              </SuccessAlert>
            ) : (
              <InfoAlert>
                Draft mode: Your wedding is private. Only you can see it while editing.
              </InfoAlert>
            )}

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <PrimaryActionButton
                onClick={handlePublishToggle}
                loading={updatingStatus}
                sx={{
                  bgcolor: status === 'live' ? COLORS.text.subtle : COLORS.brand.primary,
                  py: 1.5,
                  px: 4,
                  fontSize: '1rem',
                  flex: 1,
                  '&:hover': {
                    bgcolor: status === 'live' ? COLORS.text.muted : COLORS.brand.primaryHover,
                  },
                }}
              >
                {status === 'live' ? 'Deactivate Website' : 'Publish Website'}
              </PrimaryActionButton>

              <SecondaryActionButton
                onClick={() => handleUpdateStatus(status === 'live' ? 'draft' : 'live')}
                disabled={updatingStatus}
                sx={{ py: 1.5, px: 4 }}
              >
                Switch to {status === 'live' ? 'Draft' : 'Live'}
              </SecondaryActionButton>
            </Stack>
          </Stack>
        </PheraCard>

        {/* Website Links Section */}
        <PheraCard variant="muted" sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: COLORS.text.strong }}>
            Website Links
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontWeight: 600, mb: 1.5 }}>
                Your Wedding URL
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'stretch' }}>
                <PheraTextField
                  fullWidth
                  value={weddingUrl}
                  InputProps={{ readOnly: true }}
                />
                <IconButton
                  onClick={() => copyToClipboard(weddingUrl)}
                  sx={{
                    bgcolor: alpha(COLORS.brand.primary, 0.1),
                    color: COLORS.brand.primary,
                    '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.2) },
                  }}
                >
                  <ContentCopy />
                </IconButton>
                <Button
                  component="a"
                  href={weddingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<Launch />}
                  sx={{
                    borderColor: COLORS.text.strong,
                    color: COLORS.text.strong,
                    borderRadius: RADII.md,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': {
                      borderColor: COLORS.text.strong,
                      bgcolor: alpha(COLORS.text.strong, 0.04),
                    },
                  }}
                >
                  Open
                </Button>
              </Stack>
            </Box>
          </Stack>
        </PheraCard>

        {/* Integrations (Optional) */}
        <PheraCard variant="muted" sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
                Integrations
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                Optional integrations to enhance your wedding website
              </Typography>
            </Box>

            <Stack spacing={3}>
              <PheraTextField
                label="WhatsApp Group Link"
                fullWidth
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                helperText="Share a WhatsApp group link with your guests"
              />

              <PheraTextField
                label="Google Sheets ID"
                fullWidth
                value={googleSheetsId}
                onChange={(e) => setGoogleSheetsId(e.target.value)}
                placeholder="1ABC..."
                helperText="For syncing RSVP data with Google Sheets"
              />
            </Stack>
          </Stack>
        </PheraCard>

        {/* Pre-Publish Checklist */}
        <PheraCard variant="muted" sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
                Pre-Publish Checklist
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                Make sure everything is ready before going live
              </Typography>
            </Box>

            <List sx={{ bgcolor: COLORS.bg.white, borderRadius: RADII.md, p: 2 }}>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: COLORS.accent.success, fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Wedding overview completed"
                  primaryTypographyProps={{ color: COLORS.text.strong, fontSize: '1rem', fontWeight: 500 }}
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: COLORS.accent.success, fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="At least one event added"
                  primaryTypographyProps={{ color: COLORS.text.strong, fontSize: '1rem', fontWeight: 500 }}
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: COLORS.accent.success, fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Schedule configured"
                  primaryTypographyProps={{ color: COLORS.text.strong, fontSize: '1rem', fontWeight: 500 }}
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  {(settings?.pin_codes?.length || 0) > 0 ? (
                    <CheckCircle sx={{ color: COLORS.accent.success, fontSize: 24 }} />
                  ) : (
                    <Cancel sx={{ color: COLORS.accent.danger, fontSize: 24 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Guest PIN codes added"
                  secondary={(settings?.pin_codes?.length || 0) > 0
                    ? `${settings.pin_codes.length} PIN code${settings.pin_codes.length > 1 ? 's' : ''} configured`
                    : 'Add at least one PIN code for guests'}
                  primaryTypographyProps={{
                    color: COLORS.text.strong,
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                  secondaryTypographyProps={{
                    color: (settings?.pin_codes?.length || 0) > 0 ? COLORS.accent.success : COLORS.accent.danger,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mt: 0.5
                  }}
                />
              </ListItem>
            </List>
          </Stack>
        </PheraCard>
      </Stack>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
