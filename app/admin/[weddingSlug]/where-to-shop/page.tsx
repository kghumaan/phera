'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  TextField,
  DialogContent,
  DialogActions,
  Grid,
  ClickAwayListener,
} from '@mui/material';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { useState, useEffect, use, useCallback } from 'react';
import { Delete } from '@mui/icons-material';
import { weddingService, type WeddingShop } from '@/lib/supabase/wedding-service';
import { SHOP_TEMPLATES, ShopTemplate } from '@/components/admin/ShopTemplates';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import { ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

const inlineFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': { color: COLORS.text.muted, fontSize: '0.875rem', '&.Mui-focused': { color: COLORS.brand.primary } },
  '& .MuiInputBase-input': { color: COLORS.text.strong, fontSize: '1rem' },
};

interface ShopDraft {
  id?: string;
  wedding_id: string | null;
  name: string;
  details: string;
  url: string;
  order_index: number;
}

export default function ShoppingPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isViewOnly } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [shops, setShops] = useState<WeddingShop[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const { showStatus } = useAutoSaveStatus();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShopDraft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [weddingSlug]);


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
      showStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const syncPreview = useCallback(async () => {
    if (!weddingId) return;
    await weddingService.markUnpublishedChanges(weddingId);
    const channel = new BroadcastChannel('phera-design-sync');
    channel.postMessage({ type: 'PREVIEW_REFRESH' });
    channel.close();
  }, [weddingId]);

  const startEditing = (shop: WeddingShop) => {
    if (isViewOnly) return;
    setEditingId(shop.id);
    setDraft({
      id: shop.id,
      wedding_id: shop.wedding_id,
      name: shop.name,
      details: shop.details || '',
      url: shop.url || '',
      order_index: shop.order_index,
    });
  };

  const startNew = () => {
    if (isViewOnly) return;
    setEditingId('__new__');
    setDraft({
      wedding_id: weddingId,
      name: '',
      details: '',
      url: '',
      order_index: shops.length,
    });
  };

  const startFromTemplate = () => {
    if (isViewOnly) return;
    setTemplateDialogOpen(true);
  };

  const handleSelectTemplate = (template: ShopTemplate) => {
    if (isViewOnly) return;
    setTemplateDialogOpen(false);
    setEditingId('__new__');
    setDraft({
      wedding_id: weddingId,
      name: template.name,
      details: template.details,
      url: template.url,
      order_index: shops.length,
    });
  };

  const cancelEditing = () => {
    if (saving) return;
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (isViewOnly || !draft) return;
    if (!draft.name.trim() || !draft.url.trim()) {
      showStatus('error', 'Please fill in shop name and URL');
      return;
    }

    setSaving(true);
    try {
      if (draft.id) {
        await weddingService.updateShop(draft.id, draft);
      } else {
        await weddingService.createShop(draft);
      }
      await loadData();
      await syncPreview();
      setEditingId(null);
      setDraft(null);
      showStatus('saved');
    } catch (err) {
      console.error('Error saving shop:', err);
      showStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shopId: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Delete this shop?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await weddingService.deleteShop(shopId);
          if (editingId === shopId) { setEditingId(null); setDraft(null); }
          await loadData();
          await syncPreview();
          showStatus('saved');
        } catch (err) {
          showStatus('error');
        }
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading shopping guide..." />
      </Box>
    );
  }

  const isAddingNew = editingId === '__new__';

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <PageHeading
          title="Shopping Guide"
          subtitle="Recommend online stores for Indian outfits"
        />

        <Stack spacing={2}>
          {shops.map((shop) => (
            editingId === shop.id ? (
              <InlineShopForm
                key={shop.id}
                draft={draft!}
                setDraft={setDraft}
                onSave={handleSave}
                onCancel={cancelEditing}
                onDelete={() => handleDelete(shop.id)}
                saving={saving}
              />
            ) : (
              <Paper
                key={shop.id}
                sx={{
                  p: 3,
                  borderRadius: RADII.lg,
                  bgcolor: COLORS.bg.white,
                  border: '1px solid #EEE',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  '&:hover': { borderColor: COLORS.border.default, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' },
                }}
                onClick={() => startEditing(shop)}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.1rem', mb: 0.5 }}>
                      {shop.name}
                    </Typography>
                    {shop.details && (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: COLORS.text.subtle, mb: 0.5 }}>
                        {shop.details}
                      </Typography>
                    )}
                    {shop.url && (
                      <Typography variant="caption" sx={{ color: COLORS.brand.primary, wordBreak: 'break-all' }}>
                        {shop.url}
                      </Typography>
                    )}
                  </Box>
                  {!isViewOnly && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleDelete(shop.id); }}
                      sx={{ color: COLORS.text.strong, flexShrink: 0 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            )
          ))}

          {isAddingNew && draft && (
            <InlineShopForm
              draft={draft}
              setDraft={setDraft}
              onSave={handleSave}
              onCancel={cancelEditing}
              saving={saving}
              isNew
            />
          )}

          {shops.length === 0 && !isAddingNew && (
            <PheraCard variant="default" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                No stores yet. Add one below.
              </Typography>
            </PheraCard>
          )}

          {/* Add buttons at bottom */}
          {!isViewOnly && !isAddingNew && (
            <Stack direction="row" spacing={1.5}>
              <Box
                onClick={startNew}
                sx={{
                  flex: 1,
                  bgcolor: COLORS.border.light,
                  border: '1px dashed #BCBCBC',
                  borderRadius: RADII.sm,
                  px: 2, py: 1.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': { bgcolor: COLORS.border.default, borderColor: COLORS.text.faint },
                }}
              >
                <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem', lineHeight: 1.5 }}>
                  Add Custom Store
                </Typography>
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Enter your own store details
                </Typography>
              </Box>
              <Box
                onClick={startFromTemplate}
                sx={{
                  flex: 1,
                  bgcolor: COLORS.border.light,
                  border: '1px dashed #BCBCBC',
                  borderRadius: RADII.sm,
                  px: 2, py: 1.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': { bgcolor: COLORS.border.default, borderColor: COLORS.text.faint },
                }}
              >
                <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem', lineHeight: 1.5 }}>
                  Add Recommended Shop
                </Typography>
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Choose from popular stores
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>

        {/* Template Selection Dialog */}
        <PheraDialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <PheraDialogTitle onClose={() => setTemplateDialogOpen(false)}>
            Choose a Recommended Shop
          </PheraDialogTitle>
          <DialogContent sx={{ bgcolor: COLORS.bg.white }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {SHOP_TEMPLATES.map((template) => (
                <Grid size={{ xs: 12, sm: 6 }} key={template.name}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderRadius: RADII.md,
                      bgcolor: COLORS.bg.white,
                      boxShadow: 'none',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
                    }}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: COLORS.text.strong }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.text.subtle, whiteSpace: 'pre-line' }}>
                      {template.details.split('\n')[0]}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ bgcolor: COLORS.bg.white, px: 3, pb: 2 }}>
            <Button onClick={() => setTemplateDialogOpen(false)} sx={{ color: COLORS.text.subtle }}>Cancel</Button>
          </DialogActions>
        </PheraDialog>

      </Stack>
      <ConfirmDialog open={confirmDialog.open} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} />
      <ContinueButton weddingSlug={weddingSlug} currentSection="shopping" weddingId={weddingId} />
    </Box>
  );
}

// ── Inline Shop Form ─────────────────────────────────────────────────────────

const inFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': { color: COLORS.text.muted, fontSize: '0.875rem', '&.Mui-focused': { color: COLORS.brand.primary } },
  '& .MuiInputBase-input': { color: COLORS.text.strong, fontSize: '1rem' },
};

interface InlineShopFormProps {
  draft: ShopDraft;
  setDraft: (d: ShopDraft | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saving: boolean;
  isNew?: boolean;
}

function InlineShopForm({ draft, setDraft, onSave, onCancel, onDelete, saving, isNew }: InlineShopFormProps) {
  const canSave = !!draft.name.trim() && !!draft.url.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  return (
    <ClickAwayListener onClickAway={onCancel}>
      <Paper sx={{ p: 2.5, borderRadius: RADII.lg, bgcolor: COLORS.bg.white, border: '1px solid #EEE', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
        <Stack spacing={2}>
          <TextField
            label="Store Name"
            size="small"
            fullWidth
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            autoFocus
            onKeyDown={handleKeyDown}
            placeholder="e.g., Pernia's Pop-Up Shop"
            sx={inFieldSx}
          />
          <TextField
            label="Details"
            size="small"
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            value={draft.details}
            onChange={(e) => setDraft({ ...draft, details: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Shipping details, price range, etc."
            sx={inFieldSx}
          />
          <TextField
            label="Website URL"
            size="small"
            fullWidth
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            sx={inFieldSx}
          />
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
            {!isNew && onDelete && (
              <IconButton size="small" onClick={onDelete} sx={{ color: COLORS.text.strong }}>
                <Delete fontSize="small" />
              </IconButton>
            )}
            <PrimaryActionButton
              onClick={onSave}
              loading={saving}
              disabled={!canSave}
              sx={{
                px: 3, minWidth: 80,
                '&.Mui-disabled': { bgcolor: COLORS.border.faint, color: COLORS.text.faint },
              }}
            >
              Save
            </PrimaryActionButton>
          </Stack>
        </Stack>
      </Paper>
    </ClickAwayListener>
  );
}
