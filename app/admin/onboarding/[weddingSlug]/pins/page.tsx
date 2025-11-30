'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Snackbar,
  Alert,
  alpha,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Add, Delete } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function PINManagementPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [newPin, setNewPin] = useState({ pin: '', type: 'guest', allows_plus_one: false });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');

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
        const settingsData = await weddingService.getSettings(wedding.id);
        if (settingsData) {
          setSettings(settingsData);
        }
      }
    } catch (err) {
      console.error('Error loading PIN settings:', err);
      showToast('Failed to load PIN settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPin = async () => {
    if (!newPin.pin) {
      showToast('Please enter a PIN code', 'error');
      return;
    }

    try {
      const currentPins = settings?.pin_codes || [];
      const updatedPins = [...currentPins, newPin];

      if (settings?.id) {
        await weddingService.updateSettings(weddingId!, {
          pin_codes: updatedPins,
        });
      } else {
        await weddingService.createSettings({
          wedding_id: weddingId!,
          pin_codes: updatedPins,
          whatsapp_group_link: '',
          google_sheets_id: '',
          lapse_event_codes: {},
        });
      }

      setPinDialogOpen(false);
      setNewPin({ pin: '', type: 'guest', allows_plus_one: false });
      await loadData();
      showToast('PIN added successfully', 'success');
    } catch (err) {
      console.error('Error adding PIN:', err);
      showToast('Failed to add PIN', 'error');
    }
  };

  const handleDeletePin = async (pinToDelete: string) => {
    if (!confirm('Delete this PIN?')) return;

    try {
      const currentPins = settings?.pin_codes || [];
      const updatedPins = currentPins.filter((p: any) => p.pin !== pinToDelete);

      await weddingService.updateSettings(weddingId!, {
        pin_codes: updatedPins,
      });

      await loadData();
      showToast('PIN deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete PIN', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading PIN management..." />
      </Container>
    );
  }

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            PIN Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
            Create and manage unique PIN codes for your guests to access the wedding website
          </Typography>
        </Box>

        {/* PIN Management Section */}
        <Paper sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: '24px', 
          bgcolor: 'white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' 
        }}>
          <Stack spacing={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                  Guest PIN Codes
                </Typography>
                <Typography variant="body1" sx={{ color: '#6a6a6a', fontSize: '1.1rem' }}>
                  {(settings?.pin_codes?.length || 0) > 0 
                    ? `You have ${settings.pin_codes.length} PIN code${settings.pin_codes.length > 1 ? 's' : ''} configured`
                    : 'Add unique PIN codes for your guests to access the wedding website'}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => setPinDialogOpen(true)}
                size="large"
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                  '&:hover': {
                    bgcolor: '#C8365A',
                    boxShadow: '0 6px 16px rgba(222, 63, 94, 0.4)',
                  },
                }}
              >
                Add PIN
              </Button>
            </Box>

            {(!settings?.pin_codes || settings.pin_codes.length === 0) ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8, 
                  bgcolor: alpha('#f5f5f5', 0.5), 
                  borderRadius: '16px',
                  border: '2px dashed #e0e0e0'
                }}
              >
                <Typography variant="h6" sx={{ color: '#6a6a6a', mb: 1, fontSize: '1.2rem' }}>
                  No PIN codes yet
                </Typography>
                <Typography variant="body1" sx={{ color: '#9a9a9a', fontSize: '1rem' }}>
                  Add your first PIN to give guests access to your wedding website
                </Typography>
              </Box>
            ) : (
              <List sx={{ bgcolor: alpha('#f5f5f5', 0.3), borderRadius: '16px', p: 1 }}>
                {settings.pin_codes.map((pinData: any, index: number) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '12px',
                      mb: 1,
                      py: 2,
                      '&:last-child': { mb: 0 },
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeletePin(pinData.pin)}
                        sx={{
                          color: '#EF4444',
                          '&:hover': {
                            bgcolor: alpha('#EF4444', 0.1),
                          },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#1a1a1a', fontSize: '1.2rem', fontWeight: 600 }}>
                          {pinData.pin}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={2} mt={1}>
                          <Chip 
                            label={pinData.type} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.875rem', 
                              height: 28,
                              bgcolor: alpha('#DE3F5E', 0.1),
                              color: '#DE3F5E',
                              fontWeight: 600
                            }} 
                          />
                          <Chip 
                            label={pinData.allows_plus_one ? 'Plus One Allowed' : 'No Plus One'} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.875rem', 
                              height: 28,
                              bgcolor: pinData.allows_plus_one ? alpha('#10B981', 0.1) : alpha('#6a6a6a', 0.1),
                              color: pinData.allows_plus_one ? '#10B981' : '#6a6a6a',
                              fontWeight: 600
                            }} 
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        </Paper>

        {/* PIN Dialog */}
        <Dialog 
          open={pinDialogOpen} 
          onClose={() => setPinDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: '1.5rem' }}>Add Guest PIN</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="PIN Code"
                fullWidth
                value={newPin.pin}
                onChange={(e) => setNewPin({ ...newPin, pin: e.target.value })}
                placeholder="e.g., JOHN2026"
                required
                helperText="Create a unique PIN for your guest(s)"
                sx={textFieldSx}
              />
              <TextField
                label="Type"
                fullWidth
                value={newPin.type}
                onChange={(e) => setNewPin({ ...newPin, type: e.target.value })}
                placeholder="e.g., guest, family, vip"
                helperText="Optional: Categorize this PIN"
                sx={textFieldSx}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '1.1rem' }}>
                  Allows Plus One: <Typography component="span" sx={{ color: newPin.allows_plus_one ? '#10B981' : '#6a6a6a', fontWeight: 600 }}>
                    {newPin.allows_plus_one ? 'Yes' : 'No'}
                  </Typography>
                </Typography>
                <Button
                  size="medium"
                  variant="outlined"
                  onClick={() => setNewPin({ ...newPin, allows_plus_one: !newPin.allows_plus_one })}
                  sx={{
                    borderColor: '#DE3F5E',
                    color: '#DE3F5E',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: '80px',
                    '&:hover': {
                      borderColor: '#C8365A',
                      bgcolor: 'rgba(222, 63, 94, 0.08)',
                    },
                  }}
                >
                  Toggle
                </Button>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 3 }}>
            <Button onClick={() => setPinDialogOpen(false)} sx={{ color: '#6a6a6a', fontSize: '1rem' }}>Cancel</Button>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleAddPin}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                fontSize: '1rem',
                '&:hover': {
                  bgcolor: '#C8365A',
                },
              }}
            >
              Add PIN
            </Button>
          </DialogActions>
        </Dialog>

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

