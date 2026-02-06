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
      <Box sx={{ maxWidth: 800 }}>
        <LoadingSpinner message="Loading registry..." />
      </Box>
    );
  }



  return (
    <Box sx={{ maxWidth: 800 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Registry Links
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Link to your external registry sites (Stripe Payment Link, Zola, Amazon, etc.)
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
            alignSelf: 'flex-start',
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
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  {/* First Row: Emoji and Name */}
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: item.external_url ? 1 : 0 }}>
                    <Typography variant="h4">
                      {item.emoji}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {item.fund_name}
                    </Typography>
                  </Stack>
                  {/* Second Row: Link */}
                  {item.external_url && (
                    <Typography variant="body2" sx={{ color: '#6a6a6a', wordBreak: 'break-all', pl: 0 }}>
                      {item.external_url}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton
                    onClick={() => handleEdit(item)}
                    sx={{ color: '#DE3F5E', '&:hover': { bgcolor: 'rgba(222, 63, 94, 0.08)' } }}
                  >
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
    </Box>
  );
}
