'use client';

import {
  Box,
  Container,
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
  Fade,
  Snackbar,
  alpha,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, CheckCircle, Cancel, Launch, ContentCopy, Check } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Consistent TextField styling with enhanced sizes
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    bgcolor: 'white',
    fontSize: '1.1rem',
    '& input': {
      py: 2.5,
      fontSize: '1.1rem',
    },
    '& textarea': {
      fontSize: '1.1rem',
    },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#DE3F5E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a4a4a',
    fontSize: '1rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E',
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
  },
  '& .MuiFormHelperText-root': {
    color: '#6a6a6a',
    fontSize: '0.875rem',
  },
};

export default function SettingsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'live'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');
  const [settings, setSettings] = useState<any>(null);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [googleSheetsId, setGoogleSheetsId] = useState('');

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

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
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      const errorMessage = 'Failed to load settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      if (settings?.id) {
        await weddingService.updateSettings(weddingId!, {
          whatsapp_group_link: whatsappLink,
          google_sheets_id: googleSheetsId,
        });
      } else {
        await weddingService.createSettings({
          wedding_id: weddingId!,
          whatsapp_group_link: whatsappLink,
          google_sheets_id: googleSheetsId,
          pin_codes: [],
          lapse_event_codes: {},
        });
      }

      setSuccess(true);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowSaveSuccess(false);
      }, 2500);
      await loadData();
    } catch (err) {
      console.error('Error saving settings:', err);
      const errorMessage = 'Failed to save settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'draft' | 'live') => {
    if (newStatus === 'live') {
      if (!confirm('Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.')) {
        return;
      }
    }

    try {
      await weddingService.updateWedding(weddingId!, { status: newStatus });
      setStatus(newStatus);
      setSuccess(true);
      const statusMessages = {
        draft: 'Wedding set to draft mode',
        live: '🎉 Wedding website is now live!'
      };
      showToast(statusMessages[newStatus], 'success');
    } catch (err) {
      const errorMessage = 'Failed to update status';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handlePublishToggle = async () => {
    if (status === 'live') {
      // Deactivate
      if (!confirm('Are you sure you want to deactivate your wedding website? It will no longer be accessible to guests.')) {
        return;
      }
      await handleUpdateStatus('draft');
    } else {
      // Publish
      if (!confirm('Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.')) {
        return;
      }
      await handleUpdateStatus('live');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(true);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowSaveSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading settings..." />
      </Container>
    );
  }

  const weddingUrl = `${window.location.origin}/${weddingSlug}`;

  return (
    <Container maxWidth="xl">
      <Stack spacing={5}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Settings & Publish
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
            Manage your wedding website settings and publish when ready
          </Typography>
        </Box>

        {/* Publish Control Section */}
        <Paper sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: '24px', 
          bgcolor: status === 'live' ? alpha('#DE3F5E', 0.05) : 'white',
          boxShadow: status === 'live' ? '0 12px 40px rgba(222, 63, 94, 0.25)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: status === 'live' ? '2px solid #DE3F5E' : 'none',
        }}>
          <Stack spacing={4} alignItems="center">
            {/* Current Status Display */}
            <Box textAlign="center">
              <Chip
                label={`Current Status: ${status.toUpperCase()}`}
                icon={status === 'live' ? <CheckCircle /> : undefined}
                sx={{
                  bgcolor: status === 'live' ? '#DE3F5E' : '#6a6a6a',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  px: 3,
                  py: 3.5,
                  height: 'auto',
                  '& .MuiChip-label': {
                    px: 2,
                  },
                }}
              />
            </Box>

            {/* Big Publish/Deactivate Button */}
            <Button
              variant="contained"
              size="large"
              onClick={handlePublishToggle}
              sx={{
                bgcolor: status === 'live' ? '#6a6a6a' : '#DE3F5E',
                color: 'white',
                py: 3,
                px: 8,
                borderRadius: '24px',
                fontSize: '1.5rem',
                fontWeight: 700,
                textTransform: 'none',
                minWidth: { xs: '100%', sm: 400 },
                boxShadow: status === 'live' 
                  ? '0 8px 24px rgba(106, 106, 106, 0.4)' 
                  : '0 8px 24px rgba(222, 63, 94, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: status === 'live' ? '#4a4a4a' : '#C8365A',
                  boxShadow: status === 'live' 
                    ? '0 12px 32px rgba(106, 106, 106, 0.5)' 
                    : '0 12px 32px rgba(222, 63, 94, 0.5)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {status === 'live' ? '🔒 Deactivate Website' : '🚀 Publish Website'}
            </Button>

            {/* Status Description */}
            <Alert 
              severity={status === 'live' ? 'success' : 'warning'}
              sx={{ 
                borderRadius: '16px',
                fontSize: '1.1rem',
                width: '100%',
                maxWidth: 600,
                '& .MuiAlert-message': {
                  fontSize: '1.1rem',
                }
              }}
            >
              {status === 'draft' && '📝 Draft mode: Your wedding is private. Only you can see it while editing.'}
              {status === 'live' && '✨ Your wedding website is now live and accessible to all guests with their unique PIN codes!'}
            </Alert>

            {/* Mode Toggle Buttons */}
            <Box sx={{ pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)', width: '100%' }}>
              <Typography variant="body1" sx={{ color: '#6a6a6a', mb: 2, textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>
                Change Mode
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant={status === 'draft' ? 'contained' : 'outlined'}
                  onClick={() => handleUpdateStatus('draft')}
                  size="medium"
                  sx={{
                    minWidth: { xs: '100%', sm: 120 },
                    py: 1.5,
                    px: 3,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    bgcolor: status === 'draft' ? '#6a6a6a' : 'transparent',
                    borderColor: '#6a6a6a',
                    color: status === 'draft' ? 'white' : '#6a6a6a',
                    borderWidth: 2,
                    '&:hover': {
                      bgcolor: status === 'draft' ? '#4a4a4a' : alpha('#6a6a6a', 0.08),
                      borderColor: '#4a4a4a',
                      borderWidth: 2,
                    },
                  }}
                >
                  Draft
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Website Links Section */}
        <Paper sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: '24px', 
          bgcolor: 'white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' 
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
            Website Links
          </Typography>
          
          <Stack spacing={3}>
            {/* Main Wedding URL */}
            <Box>
              <Typography variant="body1" sx={{ color: '#6a6a6a', fontWeight: 600, mb: 1.5, fontSize: '1.1rem' }}>
                Your Wedding URL
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'stretch' }}>
                <TextField
                  fullWidth
                  value={weddingUrl}
                  InputProps={{ 
                    readOnly: true,
                    sx: { fontSize: '1.1rem' }
                  }}
                  sx={{
                    ...textFieldSx,
                    '& .MuiOutlinedInput-root': {
                      ...textFieldSx['& .MuiOutlinedInput-root'],
                      bgcolor: alpha('#DE3F5E', 0.05),
                    }
                  }}
                />
                <IconButton 
                  onClick={() => copyToClipboard(weddingUrl)}
                  sx={{
                    bgcolor: alpha('#DE3F5E', 0.1),
                    color: '#DE3F5E',
                    '&:hover': {
                      bgcolor: alpha('#DE3F5E', 0.2),
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
                    borderColor: '#DE3F5E',
                    color: '#DE3F5E',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: '#C8365A',
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
          p: { xs: 4, md: 6 }, 
          borderRadius: '24px', 
          bgcolor: alpha('#f5f5f5', 0.5),
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' 
        }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                Integrations
              </Typography>
              <Typography variant="body1" sx={{ color: '#6a6a6a', fontSize: '1.1rem' }}>
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
                    bgcolor: 'white',
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
                    bgcolor: 'white',
                  }
                }}
              />

              {/* Save Button with Inline Success */}
              <Box sx={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
                <Button
                  variant="contained"
                  startIcon={showSaveSuccess ? <Check /> : <Save />}
                  onClick={handleSaveSettings}
                  disabled={saving}
                  size="large"
                  sx={{
                    bgcolor: showSaveSuccess ? '#10B981' : '#DE3F5E',
                    color: 'white',
                    py: 1.5,
                    px: 4,
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: showSaveSuccess 
                      ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                      : '0 4px 12px rgba(222, 63, 94, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: showSaveSuccess ? '#059669' : '#C8365A',
                      boxShadow: showSaveSuccess 
                        ? '0 6px 16px rgba(16, 185, 129, 0.5)' 
                        : '0 6px 16px rgba(222, 63, 94, 0.4)',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(222, 63, 94, 0.5)',
                    },
                  }}
                >
                  {saving ? 'Saving...' : showSaveSuccess ? 'Saved!' : 'Save Integrations'}
                </Button>
                
                {/* Success message below button */}
                <Fade in={showSaveSuccess}>
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      mt: 1,
                      color: '#10B981',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Integrations saved!
                  </Typography>
                </Fade>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* Pre-Publish Checklist */}
        <Paper sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: '24px', 
          bgcolor: alpha('#f5f5f5', 0.5),
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' 
        }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                Pre-Publish Checklist
              </Typography>
              <Typography variant="body1" sx={{ color: '#6a6a6a', fontSize: '1.1rem' }}>
                Make sure everything is ready before going live
              </Typography>
            </Box>
            
            <List sx={{ bgcolor: 'white', borderRadius: '16px', p: 2 }}>
              <ListItem sx={{ py: 2 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#10B981', fontSize: 32 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Wedding overview completed" 
                  primaryTypographyProps={{ color: '#1a1a1a', fontSize: '1.15rem', fontWeight: 500 }} 
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ py: 2 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#10B981', fontSize: 32 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="At least one event added" 
                  primaryTypographyProps={{ color: '#1a1a1a', fontSize: '1.15rem', fontWeight: 500 }} 
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ py: 2 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#10B981', fontSize: 32 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Schedule configured" 
                  primaryTypographyProps={{ color: '#1a1a1a', fontSize: '1.15rem', fontWeight: 500 }} 
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ py: 2 }}>
                <ListItemIcon>
                  {(settings?.pin_codes?.length || 0) > 0 ? (
                    <CheckCircle sx={{ color: '#10B981', fontSize: 32 }} />
                  ) : (
                    <Cancel sx={{ color: '#EF4444', fontSize: 32 }} />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary="Guest PIN codes added"
                  secondary={(settings?.pin_codes?.length || 0) > 0 
                    ? `✓ ${settings.pin_codes.length} PIN code${settings.pin_codes.length > 1 ? 's' : ''} configured` 
                    : '✗ Add at least one PIN code for guests'}
                  primaryTypographyProps={{ 
                    color: '#1a1a1a', 
                    fontSize: '1.15rem', 
                    fontWeight: 500 
                  }}
                  secondaryTypographyProps={{ 
                    color: (settings?.pin_codes?.length || 0) > 0 ? '#10B981' : '#EF4444',
                    fontSize: '1rem',
                    fontWeight: 600,
                    mt: 0.5
                  }}
                />
              </ListItem>
            </List>
          </Stack>
        </Paper>


        {/* Toast Notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}

