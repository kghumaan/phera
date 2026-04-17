'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
  TextField,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  alpha,
} from '@mui/material';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { useState, useEffect, use, useCallback } from 'react';
import { CheckCircle, Cancel, Launch, ContentCopy } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

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
        // Normalize status: convert 'preview' to 'draft', default to 'draft' if invalid or missing
        const normalizedStatus = (wedding.status === 'live') ? 'live' : 'draft';
        setStatus(normalizedStatus);

        // If status was 'preview' or invalid, update it in the database
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

  // Auto-save when integrations change
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
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
            Settings & Publish
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            Manage your wedding website settings and publish when ready
          </Typography>
        </Box>

        {/* Publish Control Section */}
        <Paper sx={{
          p: 4,
          borderRadius: RADII.lg,
          bgcolor: status === 'live' ? alpha(COLORS.brand.primary, 0.03) : COLORS.bg.muted,
          boxShadow: 'none',
          border: status === 'live' ? '2px solid #DE3F5E' : 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }
        }}>
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
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>

            {/* Status Description */}
            <Alert
              severity={status === 'live' ? 'success' : 'info'}
              sx={{
                borderRadius: RADII.md,
                bgcolor: status === 'live' ? alpha(COLORS.accent.success, 0.1) : alpha(COLORS.accent.info, 0.1),
                border: `1px solid ${status === 'live' ? alpha(COLORS.accent.success, 0.3) : alpha(COLORS.accent.info, 0.3)}`,
                '& .MuiAlert-icon': {
                  color: status === 'live' ? COLORS.accent.success : COLORS.accent.info,
                },
                '& .MuiAlert-message': {
                  color: COLORS.text.strong,
                  fontWeight: 500,
                }
              }}
            >
              {status === 'draft' && 'Draft mode: Your wedding is private. Only you can see it while editing.'}
              {status === 'live' && 'Your wedding website is now live and accessible to all guests with their unique PIN codes!'}
            </Alert>

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

              <Button
                variant="outlined"
                onClick={() => handleUpdateStatus(status === 'live' ? 'draft' : 'live')}
                disabled={updatingStatus}
                sx={{
                  borderColor: COLORS.text.subtle,
                  color: COLORS.text.subtle,
                  py: 1.5,
                  px: 4,
                  borderRadius: RADII.md,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: COLORS.text.muted,
                    bgcolor: alpha(COLORS.text.subtle, 0.05),
                    borderWidth: 2,
                  },
                }}
              >
                Switch to {status === 'live' ? 'Draft' : 'Live'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Website Links Section */}
        <Paper sx={{
          p: 4,
          borderRadius: RADII.lg,
          bgcolor: COLORS.bg.muted,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: COLORS.text.strong }}>
            Website Links
          </Typography>

          <Stack spacing={3}>
            {/* Main Wedding URL */}
            <Box>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontWeight: 600, mb: 1.5 }}>
                Your Wedding URL
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'stretch' }}>
                <TextField
                  fullWidth
                  value={weddingUrl}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    ...textFieldSx,
                    '& .MuiOutlinedInput-root': {
                      ...textFieldSx['& .MuiOutlinedInput-root'],
                      bgcolor: COLORS.bg.white,
                    }
                  }}
                />
                <IconButton
                  onClick={() => copyToClipboard(weddingUrl)}
                  sx={{
                    bgcolor: alpha(COLORS.brand.primary, 0.1),
                    color: COLORS.brand.primary,
                    '&:hover': {
                      bgcolor: alpha(COLORS.brand.primary, 0.2),
                    },
                  }}
                >
                  <ContentCopy />
                </IconButton>
                <Button
                  variant="outlined"
                  startIcon={<Launch />}
                  href={weddingUrl}
                  target="_blank"
                  sx={{
                    borderColor: COLORS.brand.primary,
                    color: COLORS.brand.primary,
                    borderRadius: RADII.md,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': {
                      borderColor: COLORS.brand.primaryHover,
                      bgcolor: 'rgba(222, 63, 94, 0.05)',
                    },
                  }}
                >
                  Open
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>


        {/* Integrations (Optional) */}
        <Paper sx={{
          p: 4,
          borderRadius: RADII.lg,
          bgcolor: COLORS.bg.muted,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }
        }}>
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
              <TextField
                label="WhatsApp Group Link"
                fullWidth
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                helperText="Share a WhatsApp group link with your guests"
                sx={{
                  ...textFieldSx,
                  '& .MuiOutlinedInput-root': {
                    ...textFieldSx['& .MuiOutlinedInput-root'],
                    bgcolor: COLORS.bg.white,
                  }
                }}
              />

              <TextField
                label="Google Sheets ID"
                fullWidth
                value={googleSheetsId}
                onChange={(e) => setGoogleSheetsId(e.target.value)}
                placeholder="1ABC..."
                helperText="For syncing RSVP data with Google Sheets"
                sx={{
                  ...textFieldSx,
                  '& .MuiOutlinedInput-root': {
                    ...textFieldSx['& .MuiOutlinedInput-root'],
                    bgcolor: COLORS.bg.white,
                  }
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Pre-Publish Checklist */}
        <Paper sx={{
          p: 4,
          borderRadius: RADII.lg,
          bgcolor: COLORS.bg.muted,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }
        }}>
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
        </Paper>
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
