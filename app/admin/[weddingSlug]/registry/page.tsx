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
  CircularProgress,
} from '@mui/material';
import React, { useState, useEffect, use } from 'react';
import { Add, Edit, Delete, ChevronRight, CardGiftcard, LockOutlined } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';

import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function RegistryPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { isViewOnly } = useAdminRole();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
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
    if (isViewOnly) return;
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

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isViewOnly) return;
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

    setSaving(true);
    try {
      if (currentItem.id) {
        await weddingService.updateRegistryItem(currentItem.id, currentItem);
      } else {
        await weddingService.createRegistryItem(currentItem);
      }
      await loadData();
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
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
    } finally {
      setSaving(false);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const handleDelete = async (itemId: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Delete this registry link?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await weddingService.deleteRegistryItem(itemId);
          await loadData();
          if (weddingId) {
            await weddingService.markUnpublishedChanges(weddingId);
            const channel = new BroadcastChannel('phera-design-sync');
            channel.postMessage({ type: 'PREVIEW_REFRESH' });
            channel.close();
          }
          setSuccess(true);
          showToast('Registry link deleted successfully', 'success');
        } catch (err) {
          const errorMessage = 'Failed to delete registry link';
          setError(errorMessage);
          showToast(errorMessage, 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading registry..." />
      </Box>
    );
  }

  // Pro gate - show upgrade UI for non-Pro users
  if (!isPro) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          {/* Header row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Registry Integration
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Accept contributions seamlessly with integrated payment links
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<CardGiftcard />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                px: 3,
                py: 1.25,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                flexShrink: 0,
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          {/* Description */}
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.75, mb: 1.25 }}>
              Stop juggling multiple registry platforms. <strong>Registry Integration</strong> lets you add payment links from Stripe, Zola, Amazon, or any other registry — all displayed beautifully on your wedding website.
            </Typography>
            <Stack spacing={0.6} sx={{ pl: 0 }}>
              {([
                <><strong>Link to any registry</strong> — Stripe payment links, Zola, Amazon, Honeyfund, and more</>,
                <><strong>Cash fund support</strong> for honeymoon contributions or home down payments</>,
                <><strong>Beautiful display</strong> with custom emojis and names for each registry</>,
                <><strong>Secure payments</strong> handled entirely by your chosen platform</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Blurred mock view */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            {/* Mock UI */}
            <Box sx={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
              <Stack spacing={2}>
                {[
                  { emoji: '💝', name: 'Honeymoon Fund', url: 'https://stripe.com/pay/honeymoon-fund' },
                  { emoji: '🏠', name: 'New Home Contribution', url: 'https://zola.com/registry/couple-name' },
                  { emoji: '✈️', name: 'Adventure Fund', url: 'https://honeyfund.com/couple' },
                ].map((item, idx) => (
                  <Paper key={idx} sx={{
                    p: 3,
                    borderRadius: '16px',
                    bgcolor: '#fafafa',
                    boxShadow: 'none',
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="h4">{item.emoji}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{item.name}</Typography>
                        <Typography variant="body2" sx={{ color: '#6a6a6a' }}>{item.url}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* Lock overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                bgcolor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
              </Box>
              <Button
                variant="contained"
                startIcon={<CardGiftcard />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  px: 3.5,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Unlock Registry Integration
              </Button>
            </Box>
          </Box>
        </Stack>

        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
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
              boxShadow: 'none',
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
              boxShadow: 'none',
            }}>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
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
            onClick={handleSave}
            disabled={saving}
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
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
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
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
      <ContinueButton weddingSlug={weddingSlug} currentSection="registry" weddingId={weddingId} />
    </Box>
  );
}
