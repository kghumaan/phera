'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  TextField,
  ClickAwayListener,
} from '@mui/material';
import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import { Delete, CardGiftcard, LockOutlined } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { PrimaryActionButton } from '@/components/admin/ActionButton';

import { ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';

const inlineFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': {
    color: COLORS.text.muted,
    fontSize: '0.875rem',
    '&.Mui-focused': { color: COLORS.brand.primary },
  },
  '& .MuiInputBase-input': {
    color: COLORS.text.strong,
    fontSize: '1rem',
  },
};

interface RegistryDraft {
  id?: string;
  wedding_id: string | null;
  fund_name: string;
  emoji: string;
  external_url: string;
  order_index: number;
}

export default function RegistryPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { isViewOnly } = useAdminRole();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [registry, setRegistry] = useState<any[]>([]);
  const { showStatus } = useAutoSaveStatus();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RegistryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [registryDescription, setRegistryDescription] = useState('');
  const descriptionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        setRegistryDescription((wedding as any).registry_description || '');
        const data = await weddingService.getRegistry(wedding.id);
        setRegistry(data);
      }
    } catch (err) {
      console.error('Error loading registry:', err);
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

  // Auto-save registry description with debounce
  const saveDescription = useCallback(async (text: string) => {
    if (!weddingId || isViewOnly) return;
    try {
      await weddingService.updateWedding(weddingId, { registry_description: text } as any);
      await syncPreview();
      showStatus('saved');
    } catch {
      showStatus('error');
    }
  }, [weddingId, isViewOnly, syncPreview, showStatus]);

  const handleDescriptionChange = (text: string) => {
    setRegistryDescription(text);
    if (descriptionTimerRef.current) clearTimeout(descriptionTimerRef.current);
    descriptionTimerRef.current = setTimeout(() => saveDescription(text), 1000);
  };

  const startEditing = (item: any) => {
    if (isViewOnly) return;
    setEditingId(item.id);
    setDraft({
      id: item.id,
      wedding_id: item.wedding_id,
      fund_name: item.fund_name,
      emoji: item.emoji || '',
      external_url: item.external_url || '',
      order_index: item.order_index,
    });
  };

  const startNew = () => {
    if (isViewOnly) return;
    setEditingId('__new__');
    setDraft({
      wedding_id: weddingId,
      fund_name: '',
      emoji: '',
      external_url: '',
      order_index: registry.length,
    });
  };

  const cancelEditing = () => {
    if (saving) return;
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (isViewOnly || !draft) return;
    if (!draft.fund_name.trim() || !draft.external_url.trim()) {
      showStatus('error', 'Please fill in all required fields (name and URL)');
      return;
    }

    try {
      new URL(draft.external_url);
    } catch {
      showStatus('error', 'Please enter a valid URL (e.g., https://www.zola.com/registry/yourname)');
      return;
    }

    setSaving(true);
    try {
      if (draft.id) {
        await weddingService.updateRegistryItem(draft.id, draft);
      } else {
        await weddingService.createRegistryItem(draft);
      }
      await loadData();
      await syncPreview();
      setEditingId(null);
      setDraft(null);
      showStatus('saved');
    } catch (err) {
      console.error('Error saving registry item:', err);
      showStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Delete this registry link?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await weddingService.deleteRegistryItem(itemId);
          if (editingId === itemId) { setEditingId(null); setDraft(null); }
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
        <LoadingSpinner message="Loading registry..." />
      </Box>
    );
  }

  // Pro gate
  if (!isPro) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <PageHeading
            title="Registry Integration"
            subtitle="Accept contributions seamlessly with integrated payment links"
            actions={
              <PrimaryActionButton
                startIcon={<CardGiftcard />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ flexShrink: 0 }}
              >
                Upgrade to Pro
              </PrimaryActionButton>
            }
          />

          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.75, mb: 1.25 }}>
              Stop juggling multiple registry platforms. <strong>Registry Integration</strong> lets you add payment links from Stripe, Zola, Amazon, or any other registry — all displayed beautifully on your wedding website.
            </Typography>
            <Stack spacing={0.6}>
              {([
                <><strong>Link to any registry</strong> — Stripe payment links, Zola, Amazon, Honeyfund, and more</>,
                <><strong>Cash fund support</strong> for honeymoon contributions or home down payments</>,
                <><strong>Beautiful display</strong> with custom emojis and names for each registry</>,
                <><strong>Secure payments</strong> handled entirely by your chosen platform</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: COLORS.brand.primary, lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
              <Stack spacing={2}>
                {[
                  { name: 'Honeymoon Fund', url: 'https://stripe.com/pay/honeymoon-fund' },
                  { name: 'New Home Contribution', url: 'https://zola.com/registry/couple-name' },
                  { name: 'Adventure Fund', url: 'https://honeyfund.com/couple' },
                ].map((item, idx) => (
                  <PheraCard key={idx} variant="muted" sx={{ p: 3 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>{item.name}</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>{item.url}</Typography>
                    </Box>
                  </PheraCard>
                ))}
              </Stack>
            </Box>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: COLORS.bg.white, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined sx={{ fontSize: 26, color: COLORS.brand.primary }} />
              </Box>
              <PrimaryActionButton
                startIcon={<CardGiftcard />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ px: 3.5, py: 1.5, borderRadius: 2, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)' }}
              >
                Unlock Registry Integration
              </PrimaryActionButton>
            </Box>
          </Box>
        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  const isAddingNew = editingId === '__new__';

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <PageHeading
          title="Registry Links"
          subtitle="Link to your external registry sites (Stripe Payment Link, Zola, Amazon, etc.)"
        />

        <TextField
          label="Registry Description"
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={registryDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="e.g., Your presence is enough of a present to us! But for those of you who are stubborn, we've put together a wish-list to help you out."
          helperText="This text appears above your registry links on the wedding website"
          disabled={isViewOnly}
          sx={inlineFieldSx}
        />

        <Stack spacing={2}>
          {registry.map((item) => (
            editingId === item.id ? (
              <InlineRegistryForm
                key={item.id}
                draft={draft!}
                setDraft={setDraft}
                onSave={handleSave}
                onCancel={cancelEditing}
                onDelete={() => handleDelete(item.id)}
                saving={saving}
              />
            ) : (
              <Paper
                key={item.id}
                sx={{
                  p: 3,
                  borderRadius: RADII.lg,
                  bgcolor: COLORS.bg.white,
                  border: '1px solid #EEE',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  '&:hover': { borderColor: COLORS.border.default, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' },
                }}
                onClick={() => startEditing(item)}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.1rem', mb: item.external_url ? 0.5 : 0 }}>
                      {item.fund_name}
                    </Typography>
                    {item.external_url && (
                      <Typography variant="body2" sx={{ color: COLORS.text.subtle, wordBreak: 'break-all' }}>
                        {item.external_url}
                      </Typography>
                    )}
                  </Box>
                  {!isViewOnly && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
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
            <InlineRegistryForm
              draft={draft}
              setDraft={setDraft}
              onSave={handleSave}
              onCancel={cancelEditing}
              saving={saving}
              isNew
            />
          )}

          {registry.length === 0 && !isAddingNew && (
            <PheraCard variant="default" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                No registry links yet. Add your first registry link below.
              </Typography>
            </PheraCard>
          )}

          {!isViewOnly && !isAddingNew && (
            <Box
              onClick={startNew}
              sx={{
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
                Add Registry Link
              </Typography>
              <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                Stripe, Zola, Amazon, Honeyfund, etc.
              </Typography>
            </Box>
          )}
        </Stack>
      </Stack>

      <ConfirmDialog open={confirmDialog.open} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} />
      <ContinueButton weddingSlug={weddingSlug} currentSection="registry" weddingId={weddingId} />
    </Box>
  );
}

// ── Inline Registry Form ─────────────────────────────────────────────────────

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

interface InlineRegistryFormProps {
  draft: RegistryDraft;
  setDraft: (d: RegistryDraft | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saving: boolean;
  isNew?: boolean;
}

function InlineRegistryForm({ draft, setDraft, onSave, onCancel, onDelete, saving, isNew }: InlineRegistryFormProps) {
  const canSave = !!draft.fund_name.trim() && !!draft.external_url.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  return (
    <ClickAwayListener onClickAway={onCancel}>
      <Paper sx={{ p: 2.5, borderRadius: RADII.lg, bgcolor: COLORS.bg.white, border: '1px solid #EEE', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
        <Stack spacing={2}>
          <TextField
            label="Registry Name"
            size="small"
            fullWidth
            value={draft.fund_name}
            onChange={(e) => setDraft({ ...draft, fund_name: e.target.value })}
            autoFocus
            onKeyDown={handleKeyDown}
            placeholder="e.g., Zola Registry"
            sx={inFieldSx}
          />
          <TextField
            label="External URL"
            size="small"
            fullWidth
            value={draft.external_url}
            onChange={(e) => setDraft({ ...draft, external_url: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="https://www.zola.com/registry/yourname"
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
