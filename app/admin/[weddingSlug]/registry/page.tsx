'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Add, Edit, Delete, Save, ChevronRight } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MobilePreviewFrame from '@/components/admin/MobilePreviewFrame';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function RegistryPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [registry, setRegistry] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
        const data = await weddingService.getRegistry(wedding.id);
        setRegistry(data);
      }
    } catch (err) {
      console.error('Error loading registry:', err);
      const errorMessage = 'Failed to load registry';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentItem({
      wedding_id: weddingId,
      fund_name: '',
      emoji: '💝',
      external_url: '',
      order_index: registry.length,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setCurrentItem(item);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentItem?.fund_name || !currentItem?.emoji || !currentItem?.external_url) {
      const errorMessage = 'Please fill in all required fields (name, emoji, and URL)';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    // Basic URL validation
    try {
      new URL(currentItem.external_url);
    } catch {
      const errorMessage = 'Please enter a valid URL (e.g., https://www.zola.com/registry/yourname)';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    try {
      if (currentItem.id) {
        await weddingService.updateRegistryItem(currentItem.id, currentItem);
      } else {
        await weddingService.createRegistryItem(currentItem);
      }
      await loadData();
      setEditDialogOpen(false);
      setCurrentItem(null);
      setSuccess(true);
      showToast('Registry link saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving registry item:', err);
      const errorMessage = 'Failed to save registry link';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this registry link?')) return;
    try {
      await weddingService.deleteRegistryItem(itemId);
      await loadData();
      setSuccess(true);
      showToast('Registry link deleted successfully', 'success');
    } catch (err) {
      const errorMessage = 'Failed to delete registry link';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading registry..." />
      </Container>
    );
  }

  // Mobile Preview Component
  const MobilePreview = () => (
    <MobilePreviewFrame title="Registry" backgroundImage="#E8D5E8">
      {registry.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography sx={{ fontFamily: 'Outfit', fontSize: 14, color: '#6a6a6a', textAlign: 'center' }}>
            Add a registry link to see preview
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {registry.map((item) => (
            <Box
              key={item.id}
              component="button"
              sx={{
                display: 'block',
                width: '100%',
                textDecoration: 'none',
                border: 'none',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.25)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: 4,
                  backgroundColor: '#ffffff',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 600,
                    fontSize: 28,
                    lineHeight: 1,
                    color: '#141414',
                  }}
                >
                  {item.emoji} {item.fund_name}
                </Typography>
                <ChevronRight sx={{ color: '#141414', fontSize: 40, flexShrink: 0 }} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </MobilePreviewFrame>
  );

  return (
    <Container maxWidth="xl">
      <Grid container spacing={4}>
        {/* Left Column - Form Controls */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={ENHANCED_SECTION_SPACING}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Registry Links
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 400, color: '#6a6a6a', mb: 1 }}>
                Link to your external registry sites (Zola, Amazon, The Knot, etc.)
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a', fontStyle: 'italic' }}>
                Guests will be redirected to your registry site when they click on a link
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#C8365A',
                },
              }}
            >
              Add Registry Link
            </Button>

            <Stack spacing={2}>
              {registry.map((item) => (
                <Paper key={item.id} sx={{
                  p: 3,
                  borderRadius: '16px',
                  bgcolor: '#fafafa',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {item.emoji}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                        {item.fund_name}
                      </Typography>
                      {item.external_url && (
                        <Typography variant="body2" sx={{ color: '#6a6a6a', wordBreak: 'break-all' }}>
                          {item.external_url}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton onClick={() => handleEdit(item)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)} color="error">
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {registry.length === 0 && (
                <Paper sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '16px',
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}>
                  <Typography sx={{ color: '#6a6a6a' }}>
                    No registry links yet. Add your first registry link to get started.
                  </Typography>
                </Paper>
              )}
            </Stack>
          </Stack>
        </Grid>

        {/* Right Column - Mobile Preview (Desktop Only) */}
        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
          <MobilePreview />
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>
            {currentItem?.id ? 'Edit Registry Link' : 'New Registry Link'}
          </DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Registry Name *"
                fullWidth
                value={currentItem?.fund_name || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, fund_name: e.target.value })}
                placeholder="e.g., Zola Registry, Amazon Registry"
                sx={textFieldSx}
              />
              <TextField
                label="Icon/Emoji *"
                fullWidth
                value={currentItem?.emoji || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, emoji: e.target.value })}
                placeholder="e.g., 🎁 🏠 ✈️"
                sx={textFieldSx}
              />
              <TextField
                label="External URL *"
                fullWidth
                value={currentItem?.external_url || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, external_url: e.target.value })}
                placeholder="https://www.zola.com/registry/yourname"
                helperText="Full URL to your registry site"
                sx={textFieldSx}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#C8365A',
                },
              }}
            >
              Save
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
    </Container>
  );
}
