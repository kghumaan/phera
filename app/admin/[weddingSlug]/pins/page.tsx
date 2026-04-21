'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  IconButton,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  alpha,
  Divider,
  FormControlLabel,
    Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  ClickAwayListener,
} from '@mui/material';
import { useState, useEffect, use, useCallback } from 'react';
import { Delete, Edit, Add } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { BACKGROUNDS, BACKGROUND_UI_OPTIONS } from '@/lib/constants/images';
import { usePlan } from '@/lib/contexts/PlanContext';
import ProBadge from '@/components/admin/ProBadge';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { useNavigationGuard } from '@/lib/contexts/NavigationGuardContext';
import ProSelectionsModal, { ProSelection } from '@/components/admin/ProSelectionsModal';
import ContinueButton from '@/components/admin/ContinueButton';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraSwitch } from '@/components/shared/Switch';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PheraCard } from '@/components/shared/Card';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const BACKGROUND_OPTIONS = BACKGROUND_UI_OPTIONS;

const FREE_BACKGROUND_COUNT = 4;

function generatePinSummary(
  pin: { skip_rsvp: boolean; allows_plus_one: boolean; hidden_events: string[] },
  events: { id: string; name: string }[]
): string {
  const parts: string[] = [];

  if (pin.skip_rsvp) {
    parts.push('skip RSVP');
  } else {
    parts.push('require RSVP');
    parts.push(pin.allows_plus_one ? 'allow plus ones' : 'not allow plus ones');
  }

  if (pin.hidden_events.length > 0) {
    const hiddenNames = pin.hidden_events
      .map(id => events.find(e => e.id === id)?.name)
      .filter(Boolean);
    if (hiddenNames.length > 0) {
      parts.push(`hide ${hiddenNames.join(' and ')} from the schedule`);
    }
  }

  if (parts.length === 1) return `This code will ${parts[0]}.`;
  if (parts.length === 2) return `This code will ${parts[0]} and ${parts[1]}.`;
  const last = parts.pop();
  return `This code will ${parts.join(', ')}, and ${last}.`;
}

export default function PINManagementPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { user: authUser } = useAuth();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [editingPinIndex, setEditingPinIndex] = useState<number | null>(null);
  const [newPin, setNewPin] = useState<{ pin: string; name: string; allows_plus_one: boolean; skip_rsvp: boolean; hidden_events: string[] }>({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proSelections, setProSelections] = useState<ProSelection[]>([]);
  const { registerGuard, unregisterGuard } = useNavigationGuard();
  const [deletePinTarget, setDeletePinTarget] = useState<string | null>(null);

  // Lock screen design state
  const [pinEntryText, setPinEntryText] = useState('');
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState('');
  const [pinEntryBackground, setPinEntryBackground] = useState<string>(BACKGROUNDS.BLUE_CLOUDS);
  const [customPinEntryBackground, setCustomPinEntryBackground] = useState<string | null>(null);
  const [visiblePinBgs, setVisiblePinBgs] = useState(8);
  const [initialLockScreenData, setInitialLockScreenData] = useState<any>(null);
  const [isLockScreenDirty, setIsLockScreenDirty] = useState(false);

  // Auto-save for lock screen design
  const saveLockScreenDesign = useCallback(async () => {
    if (isViewOnly) return;
    if (!weddingId) return;

    // Check if any selected options require pro
    if (!isPro) {
      const pinBgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);

      if (pinBgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) {
        return;
      }
    }

    const pinBackgroundToUse = customPinEntryBackground || pinEntryBackground;

    const result = await weddingService.updateWedding(weddingId, {
      pin_entry_text: pinEntryText,
      pin_entry_subtitle_text: pinEntrySubtitleText,
      pin_entry_background: pinBackgroundToUse,
    });
    if (!result) throw new Error('Save failed');

    await weddingService.markUnpublishedChanges(weddingId);

    setInitialLockScreenData({
      pin_entry_text: pinEntryText,
      pin_entry_subtitle_text: pinEntrySubtitleText,
      pin_entry_background: pinBackgroundToUse,
    });
    setIsLockScreenDirty(false);
  }, [weddingId, isPro, pinEntryText, pinEntrySubtitleText, pinEntryBackground, customPinEntryBackground]);

  const { saveStatus, debouncedSave } = useAutoSave({ onSave: saveLockScreenDesign, enabled: !!authUser });

  // Track lock screen dirty state and trigger auto-save
  useEffect(() => {
    if (initialLockScreenData) {
      const currentData = {
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinEntryBackground,
      };
      const dirty = JSON.stringify(currentData) !== JSON.stringify(initialLockScreenData);
      setIsLockScreenDirty(dirty);
      if (dirty) {
        debouncedSave();
      }
    }
  }, [
    pinEntryText,
    pinEntrySubtitleText,
    pinEntryBackground,
    initialLockScreenData,
    debouncedSave,
  ]);

  // Real-time Preview Sync for lock screen (debounced)
  useEffect(() => {
    if (!weddingId) return;

    const timer = setTimeout(() => {
      const channel = new BroadcastChannel('phera-design-sync');

      const syncData = {
        type: 'DESIGN_UPDATE',
        weddingId,
        updates: {
          pin_entry_text: pinEntryText,
          pin_entry_subtitle_text: pinEntrySubtitleText,
          pin_entry_background: customPinEntryBackground || pinEntryBackground,
        }
      };

      channel.postMessage(syncData);
      channel.close();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    weddingId,
    pinEntryText,
    pinEntrySubtitleText,
    pinEntryBackground,
    customPinEntryBackground,
  ]);

  // Navigation guard: prompt on leave if pro selections exist
  useEffect(() => {
    if (isPro) return;

    const getProSelections = () => {
      const sels: ProSelection[] = [];
      const bgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);
      if (bgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) {
        sels.push({ category: 'Pin Entry Background', name: BACKGROUND_OPTIONS[bgIndex].name });
      }
      return sels;
    };

    registerGuard(() => {
      const sels = getProSelections();
      if (sels.length > 0) {
        setProSelections(sels);
        setProModalOpen(true);
        return false;
      }
      return true;
    });

    return () => unregisterGuard();
  }, [isPro, pinEntryBackground, customPinEntryBackground, registerGuard, unregisterGuard]);

  // Beforeunload safety net
  useEffect(() => {
    if (isPro) return;

    const handler = (e: BeforeUnloadEvent) => {
      const bgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);
      if (bgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isPro, pinEntryBackground, customPinEntryBackground]);

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const settingsData = await weddingService.getSettings(wedding.id);
        if (settingsData) {
          setSettings(settingsData);
        }
        const weddingEvents = await weddingService.getWeddingEvents(wedding.id);
        setEvents(weddingEvents.map((e: any) => ({ id: e.id, name: e.name })));

        // Load lock screen design fields
        const defaultText = "You're invited!";
        const defaultSubtitle = 'Enter your invitation code to see all the details and RSVP for our celebration';

        setPinEntryText(wedding.pin_entry_text || defaultText);
        setPinEntrySubtitleText(wedding.pin_entry_subtitle_text || defaultSubtitle);
        setPinEntryBackground(wedding.pin_entry_background || BACKGROUNDS.BLUE_CLOUDS);

        setInitialLockScreenData({
          pin_entry_text: wedding.pin_entry_text || defaultText,
          pin_entry_subtitle_text: wedding.pin_entry_subtitle_text || defaultSubtitle,
          pin_entry_background: wedding.pin_entry_background || BACKGROUNDS.BLUE_CLOUDS,
        });
      }
    } catch (err) {
      console.error('Error loading PIN settings:', err);
      showStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const [savingPin, setSavingPin] = useState(false);

  const handleAddPin = async () => {
    if (isViewOnly) return;
    if (!newPin.pin) {
      showStatus('error', 'Please enter a PIN code');
      return;
    }

    setSavingPin(true);
    try {
      const currentPins = settings?.pin_codes || [];
      let updatedPins;

      if (editingPinIndex !== null && editingPinIndex >= 0) {
        updatedPins = [...currentPins];
        updatedPins[editingPinIndex] = newPin;
      } else {
        updatedPins = [...currentPins, newPin];
      }

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

      setEditingPinIndex(null);
      setNewPin({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
      await loadData();
      showStatus('saved');
    } catch (err) {
      console.error('Error saving PIN:', err);
      showStatus('error');
    } finally {
      setSavingPin(false);
    }
  };

  const handleEditPin = (pinData: any, index: number) => {
    setNewPin({
      pin: pinData.pin,
      name: pinData.name || pinData.type || '',
      allows_plus_one: pinData.allows_plus_one || false,
      skip_rsvp: pinData.skip_rsvp || false,
      hidden_events: pinData.hidden_events || [],
    });
    setEditingPinIndex(index);
  };

  const handleCancelPinEdit = () => {
    if (savingPin) return;
    setEditingPinIndex(null);
    setNewPin({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
  };

  const startNewPin = () => {
    if (isViewOnly) return;
    setEditingPinIndex(-1); // -1 = adding new
    setNewPin({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
  };

  const [deletingPin, setDeletingPin] = useState(false);

  const handleDeletePin = async () => {
    if (isViewOnly) return;
    if (!deletePinTarget) return;

    setDeletingPin(true);
    try {
      const currentPins = settings?.pin_codes || [];
      const updatedPins = currentPins.filter((p: any) => p.pin !== deletePinTarget);

      await weddingService.updateSettings(weddingId!, {
        pin_codes: updatedPins,
      });

      setDeletePinTarget(null);
      await loadData();
      showStatus('saved');
    } catch (err) {
      showStatus('error');
    } finally {
      setDeletingPin(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading PIN management..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <PageHeading
          title="PIN Management"
          subtitle="Create and manage unique PIN codes for your guests to access the wedding website"
        />

        {/* PIN Codes Section */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
            Guest PIN Codes
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
            {(settings?.pin_codes?.length || 0) > 0
              ? `You have ${settings.pin_codes.length} PIN code${settings.pin_codes.length > 1 ? 's' : ''} configured`
              : 'Add unique PIN codes for your guests to access the wedding website'}
          </Typography>
        </Box>

        <Stack spacing={2}>
          {(settings?.pin_codes || []).map((pinData: any, index: number) => (
            editingPinIndex === index ? (
              <InlinePinForm
                key={index}
                pin={newPin}
                setPin={setNewPin}
                events={events}
                isEditing
                onSave={handleAddPin}
                onCancel={handleCancelPinEdit}
                onDelete={() => setDeletePinTarget(pinData.pin)}
                saving={savingPin}
              />
            ) : (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  borderRadius: RADII.lg,
                  bgcolor: COLORS.bg.white,
                  border: '1px solid #EEE',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  '&:hover': { borderColor: COLORS.border.default, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' },
                }}
                onClick={() => handleEditPin(pinData, index)}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                      <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.2rem' }}>
                        {pinData.pin}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          label={pinData.name || pinData.type || 'Guest'}
                          size="small"
                          sx={{ bgcolor: alpha(COLORS.brand.primary, 0.1), color: COLORS.brand.primary, fontWeight: 600 }}
                        />
                        {pinData.hidden_events?.length > 0 && (
                          <Tooltip
                            title={
                              <Stack spacing={0.25} sx={{ py: 0.5 }}>
                                {pinData.hidden_events.map((eid: string) => {
                                  const ev = events.find(e => e.id === eid);
                                  return ev ? <Typography key={eid} variant="body2" sx={{ fontSize: '0.875rem' }}>{ev.name}</Typography> : null;
                                })}
                              </Stack>
                            }
                            arrow
                          >
                            <Chip
                              label={`${pinData.hidden_events.length} hidden`}
                              size="small"
                              sx={{ bgcolor: alpha(COLORS.text.strong, 0.08), color: COLORS.text.muted, fontWeight: 600, cursor: 'pointer' }}
                            />
                          </Tooltip>
                        )}
                        {pinData.skip_rsvp ? (
                          <Chip label="Skip RSVP" size="small" sx={{ bgcolor: alpha(COLORS.text.strong, 0.08), color: COLORS.text.muted, fontWeight: 600 }} />
                        ) : (
                          <Chip
                            label={pinData.allows_plus_one ? 'Plus One' : 'No Plus One'}
                            size="small"
                            sx={{ bgcolor: alpha(COLORS.text.strong, 0.08), color: COLORS.text.subtle, fontWeight: 600 }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                  {!isViewOnly && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setDeletePinTarget(pinData.pin); }}
                      sx={{ color: COLORS.text.strong, flexShrink: 0 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            )
          ))}

          {/* Inline form for new PIN */}
          {editingPinIndex === -1 && (
            <InlinePinForm
              pin={newPin}
              setPin={setNewPin}
              events={events}
              onSave={handleAddPin}
              onCancel={handleCancelPinEdit}
              saving={savingPin}
            />
          )}

          {(!settings?.pin_codes || settings.pin_codes.length === 0) && editingPinIndex !== -1 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: RADII.lg, bgcolor: COLORS.bg.white, boxShadow: 'none' }}>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                No PIN codes yet. Add your first PIN below.
              </Typography>
            </Paper>
          )}

          {/* Add button at bottom */}
          {!isViewOnly && editingPinIndex === null && (
            <Box
              onClick={startNewPin}
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
                Add PIN Code
              </Typography>
              <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                Create a new access code for your guests
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Lock Screen Design Section */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
            Lock Screen Design
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
            Customize the appearance of the PIN entry screen your guests see
          </Typography>
        </Box>

        {/* Welcome Text */}
        <PheraCard variant="muted" sx={{ p: 3, border: '1px solid rgba(0,0,0,0.07)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: COLORS.text.strong }}>
            Welcome Text
          </Typography>

          <Stack spacing={3}>
            <TextField
              label="Main Heading"
              value={pinEntryText}
              onChange={(e) => setPinEntryText(e.target.value)}
              placeholder="You're invited!"
              fullWidth
              multiline
              rows={2}
              helperText="Use {couple_name} as a placeholder for the couple's name"
              sx={textFieldSx}
            />

            <TextField
              label="Subtitle Text"
              value={pinEntrySubtitleText}
              onChange={(e) => setPinEntrySubtitleText(e.target.value)}
              placeholder="Enter your invitation code to see all the details and RSVP for our celebration"
              fullWidth
              multiline
              rows={2}
              helperText="This appears below the main heading"
              sx={textFieldSx}
            />
          </Stack>
        </PheraCard>

        {/* Background Selection */}
        <PheraCard variant="muted" sx={{ p: 3, border: '1px solid rgba(0,0,0,0.07)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: COLORS.text.strong }}>
            Background Image
          </Typography>

          <Grid container spacing={2} mb={3}>
            {BACKGROUND_OPTIONS.slice(0, visiblePinBgs).map((bg, index) => {
              const isProOption = index >= FREE_BACKGROUND_COUNT;

              return (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`pin-bg-${bg.url}`}>
                  <Box
                    onClick={() => {
                      setPinEntryBackground(bg.url);
                      setCustomPinEntryBackground(null);
                    }}
                    sx={{
                      width: '100%',
                      aspectRatio: '1/1',
                      backgroundImage: `url(${bg.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: 3,
                      borderColor: pinEntryBackground === bg.url && !customPinEntryBackground ? COLORS.brand.primary : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative',
                      '&:hover': {
                        borderColor: COLORS.brand.primary,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {isProOption && !isPro && <ProBadge position="corner" />}
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    {bg.name}
                  </Typography>
                </Grid>
              );
            })}
          </Grid>

          <Stack direction="row" spacing={2} mb={3} justifyContent="center">
            {visiblePinBgs < BACKGROUND_OPTIONS.length && (
              <Button
                onClick={() => setVisiblePinBgs((prev: number) => Math.min(prev + 8, BACKGROUND_OPTIONS.length))}
                variant="outlined"
                sx={{ color: COLORS.brand.primary, borderColor: COLORS.brand.primary, '&:hover': { borderColor: COLORS.brand.primary, bgcolor: 'rgba(222, 63, 94, 0.04)' } }}
              >
                Show More
              </Button>
            )}
            {visiblePinBgs > 8 && (
              <Button
                onClick={() => setVisiblePinBgs(8)}
                variant="text"
                sx={{ color: COLORS.text.subtle }}
              >
                Show Less
              </Button>
            )}
          </Stack>

          {weddingId && (
            <ImageUpload
              label="Upload Custom Background"
              value={customPinEntryBackground}
              onChange={(url) => {
                setCustomPinEntryBackground(url);
                if (url) setPinEntryBackground('');
              }}
              path={getWeddingImagePath(weddingId, 'backgrounds')}
              helperText="Upload your own background image (recommended: 1920x1080px)"
              aspectRatio="16/9"
              maxWidth={600}
            />
          )}
        </PheraCard>

        {/* Delete Confirmation Dialog */}
        <PheraDialog
          open={!!deletePinTarget}
          onClose={() => setDeletePinTarget(null)}
          PaperProps={{ sx: { p: 1, maxWidth: 400 } }}
        >
          <PheraDialogTitle onClose={() => setDeletePinTarget(null)}>
            Delete PIN?
          </PheraDialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              Are you sure you want to delete PIN <strong>{deletePinTarget}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeletePinTarget(null)} sx={{ color: COLORS.text.subtle, borderRadius: RADII.md, textTransform: 'none' }}>
              Cancel
            </Button>
            <PrimaryActionButton
              onClick={handleDeletePin}
              loading={deletingPin}
            >
              Delete
            </PrimaryActionButton>
          </DialogActions>
        </PheraDialog>

        {/* Pro Selections Modal */}
        <ProSelectionsModal
          open={proModalOpen}
          selections={proSelections}
          onCancel={() => setProModalOpen(false)}
          onUpgrade={() => {
            setProModalOpen(false);
            setUpgradeModalOpen(true);
          }}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      </Stack>
      <ContinueButton weddingSlug={weddingSlug} currentSection="pins" weddingId={weddingId} />
    </Box>
  );
}

// ── Inline PIN Form ──────────────────────────────────────────────────────────

// Reuse the standard enhanced text field style from the page-level constant
const pinFieldSx = textFieldSx;

// Kept for backwards compat only — PheraSwitch already styles itself.
// Callers can drop `sx={SWITCH_SX}` entirely.
const SWITCH_SX = {};

interface InlinePinFormProps {
  pin: { pin: string; name: string; allows_plus_one: boolean; skip_rsvp: boolean; hidden_events: string[] };
  setPin: (p: any) => void;
  events: { id: string; name: string }[];
  isEditing?: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saving: boolean;
}

function InlinePinForm({ pin, setPin, events, isEditing, onSave, onCancel, onDelete, saving }: InlinePinFormProps) {
  const canSave = !!pin.pin;
  const [showHideEvents, setShowHideEvents] = useState(pin.hidden_events.length > 0);
  const [selectOpen, setSelectOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  const handleClickAway = () => {
    // Don't cancel while the Select dropdown is open
    if (selectOpen) return;
    onCancel();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Paper sx={{ p: 2.5, borderRadius: RADII.lg, bgcolor: COLORS.bg.white, border: '1px solid #EEE', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="PIN Code"
              size="small"
              value={pin.pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin({ ...pin, pin: val });
              }}
              placeholder="1234"
              disabled={isEditing}
              autoFocus={!isEditing}
              onKeyDown={handleKeyDown}
              inputProps={{ inputMode: 'numeric', maxLength: 4 }}
              sx={{ ...pinFieldSx, width: 120 }}
            />
            <TextField
              label="Name"
              size="small"
              fullWidth
              value={pin.name}
              onChange={(e) => setPin({ ...pin, name: e.target.value })}
              placeholder="e.g., Smith Family"
              autoFocus={isEditing}
              onKeyDown={handleKeyDown}
              sx={pinFieldSx}
            />
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <FormControlLabel
              control={
                <PheraSwitch
                  checked={pin.skip_rsvp}
                  onChange={(e) => setPin({ ...pin, skip_rsvp: e.target.checked, allows_plus_one: e.target.checked ? false : pin.allows_plus_one })}
                  size="small"
                  sx={SWITCH_SX}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.875rem' }}>Skip RSVP</Typography>}
            />
            {!pin.skip_rsvp && (
              <FormControlLabel
                control={
                  <PheraSwitch
                    checked={pin.allows_plus_one}
                    onChange={(e) => setPin({ ...pin, allows_plus_one: e.target.checked })}
                    size="small"
                    sx={SWITCH_SX}
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.875rem' }}>Plus One</Typography>}
              />
            )}
            {events.length > 0 && (
              <FormControlLabel
                control={
                  <PheraSwitch
                    checked={showHideEvents}
                    onChange={(e) => {
                      setShowHideEvents(e.target.checked);
                      if (!e.target.checked) {
                        setPin({ ...pin, hidden_events: [] });
                      }
                    }}
                    size="small"
                    sx={SWITCH_SX}
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.875rem' }}>Hide Events</Typography>}
              />
            )}
          </Stack>

          {showHideEvents && events.length > 0 && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel shrink sx={{ color: COLORS.text.muted, fontWeight: 500, '&.Mui-focused': { color: COLORS.brand.primary } }}>Select events to hide</InputLabel>
                <Select
                  value=""
                  open={selectOpen}
                  onOpen={() => setSelectOpen(true)}
                  onClose={() => setSelectOpen(false)}
                  onChange={(e) => {
                    const val = e.target.value as string;
                    if (val && !pin.hidden_events.includes(val)) {
                      setPin({ ...pin, hidden_events: [...pin.hidden_events, val] });
                    }
                  }}
                  label="Select events to hide"
                  displayEmpty
                  notched
                  renderValue={() => <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>Select an event</Typography>}
                  sx={{
                    borderRadius: RADII.sm, bgcolor: COLORS.bg.white,
                    '& fieldset': { borderColor: COLORS.text.faint },
                    '&:hover fieldset': { borderColor: COLORS.text.faint },
                    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                  }}
                >
                  {events
                    .filter(event => !pin.hidden_events.includes(event.id))
                    .map((event) => (
                      <MenuItem key={event.id} value={event.id}>{event.name}</MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {pin.hidden_events.map((eventId) => {
                  const event = events.find(e => e.id === eventId);
                  return event ? (
                    <Chip
                      key={eventId}
                      label={event.name}
                      size="small"
                      onDelete={() => setPin({ ...pin, hidden_events: pin.hidden_events.filter((id: string) => id !== eventId) })}
                      sx={{ bgcolor: alpha(COLORS.brand.primary, 0.1), color: COLORS.brand.primary, fontWeight: 600, '& .MuiChip-deleteIcon': { color: COLORS.brand.primary } }}
                    />
                  ) : null;
                })}
              </Box>
            </>
          )}

          <Box sx={{ p: 1.5, borderRadius: RADII.sm, bgcolor: COLORS.bg.subtle, border: '1px solid rgba(0,0,0,0.07)' }}>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, fontSize: '0.875rem' }}>
              {generatePinSummary(pin, events)}
            </Typography>
          </Box>

          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
            {isEditing && onDelete && (
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
