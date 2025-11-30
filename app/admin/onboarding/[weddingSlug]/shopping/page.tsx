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
import { Add, Edit, Delete, Save, OpenInNew } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { SHOP_TEMPLATES, ShopTemplate } from '@/components/admin/ShopTemplates';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function ShoppingPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentShop, setCurrentShop] = useState<any>(null);
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
        const data = await weddingService.getShops(wedding.id);
        setShops(data);
      }
    } catch (err) {
      console.error('Error loading shops:', err);
      const errorMessage = 'Failed to load shops';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromTemplate = (template: ShopTemplate) => {
    setCurrentShop({
      wedding_id: weddingId,
      name: template.name,
      details: template.details,
      url: template.url,
      order_index: shops.length,
    });
    setTemplateDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleAddCustom = () => {
    setCurrentShop({
      wedding_id: weddingId,
      name: '',
      details: '',
      url: '',
      order_index: shops.length,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (shop: any) => {
    setCurrentShop(shop);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentShop?.name || !currentShop?.url) {
      const errorMessage = 'Please fill in shop name and URL';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    try {
      if (currentShop.id) {
        await weddingService.updateShop(currentShop.id, currentShop);
      } else {
        await weddingService.createShop(currentShop);
      }
      await loadData();
      setEditDialogOpen(false);
      setCurrentShop(null);
      setSuccess(true);
      showToast('Changes saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving shop:', err);
      const errorMessage = 'Failed to save shop';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm('Delete this shop?')) return;
    try {
      await weddingService.deleteShop(shopId);
      await loadData();
      setSuccess(true);
      showToast('Shop deleted successfully', 'success');
    } catch (err) {
      const errorMessage = 'Failed to delete shop';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading shopping guide..." />
      </Container>
    );
  }

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Shopping Guide
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
            Recommend online stores for Indian outfits
          </Typography>
        </Box>


        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setTemplateDialogOpen(true)}
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
            Add Recommended Shop
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddCustom}
            sx={{
              borderColor: '#DE3F5E',
              color: '#DE3F5E',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#C8365A',
                bgcolor: 'rgba(222, 63, 94, 0.05)',
              },
            }}
          >
            Create Custom Shop
          </Button>
        </Stack>

        <Stack spacing={2}>
          {shops.map((shop) => (
            <Paper key={shop.id} sx={{ 
              p: 3,
              borderRadius: '16px',
              bgcolor: '#fafafa',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }
            }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {shop.name}
                    </Typography>
                    <IconButton size="small" href={shop.url} target="_blank">
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#6a6a6a' }}>
                    {shop.details}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => handleEdit(shop)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(shop.id)} color="error">
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}

          {shops.length === 0 && (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: '16px',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <Typography sx={{ color: '#6a6a6a' }}>
                No stores yet. Add a recommended shop from our curated list or create a custom one.
              </Typography>
            </Paper>
          )}
        </Stack>

        {/* Template Selection Dialog */}
        <Dialog 
          open={templateDialogOpen} 
          onClose={() => setTemplateDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>Choose a Recommended Shop</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {SHOP_TEMPLATES.map((template) => (
                <Grid size={{ xs: 12, sm: 6 }} key={template.name}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderRadius: '12px',
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    onClick={() => handleAddFromTemplate(template)}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a', whiteSpace: 'pre-line' }}>
                      {template.details.split('\n')[0]}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
            <Button onClick={() => setTemplateDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Shop Dialog */}
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
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{currentShop?.id ? 'Edit Store' : 'New Store'}</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Store Name *"
                fullWidth
                value={currentShop?.name || ''}
                onChange={(e) => setCurrentShop({ ...currentShop, name: e.target.value })}
                placeholder="e.g., Pernia's Pop-Up Shop"
                sx={textFieldSx}
              />
              <TextField
                label="Details"
                fullWidth
                multiline
                rows={4}
                value={currentShop?.details || ''}
                onChange={(e) => setCurrentShop({ ...currentShop, details: e.target.value })}
                placeholder="Shipping details, price range, etc."
                helperText="Use line breaks for formatting"
                sx={textFieldSx}
              />
              <TextField
                label="Website URL *"
                fullWidth
                value={currentShop?.url || ''}
                onChange={(e) => setCurrentShop({ ...currentShop, url: e.target.value })}
                placeholder="https://..."
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
      </Stack>
    </Container>
  );
}

