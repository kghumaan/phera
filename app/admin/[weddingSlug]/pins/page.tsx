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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  alpha,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { useState, useEffect, use, useCallback } from 'react';
import { Add, Delete, Edit, Check } from '@mui/icons-material';
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
import AutoSaveIndicator from '@/components/admin/AutoSaveIndicator';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const sectionPaperSx = {
  p: 3,
  borderRadius: '16px',
  bgcolor: '#F8F8F8',
  boxShadow: 'none',
  border: '1px solid rgba(0,0,0,0.07)',
};

const BACKGROUND_OPTIONS = BACKGROUND_UI_OPTIONS;

const FREE_BACKGROUND_COUNT = 3;
const FREE_COLOR_COUNT = 3;

const COLOR_OPTIONS = [
  { name: 'Black', value: '#141414' },
  { name: 'Rose', value: '#DE3F5E' },
  { name: 'Plum', value: '#59114D' },
  { name: 'Purple', value: '#AC3FBA' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Sky', value: '#6290C8' },
  { name: 'Teal', value: '#489991' },
  { name: 'Maroon', value: '#941C28' },
  { name: 'Green', value: '#76B041' },
  { name: 'Forest', value: '#59814B' },
  { name: 'Orange', value: '#DF6507' },
  { name: 'Amber', value: '#FA9A00' },
];

const FONT_COLOR_OPTIONS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#4a4a4a' },
  { name: 'Medium Gray', value: '#6a6a6a' },
  { name: 'White', value: '#FFFFFF' },
];

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
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [editingPinIndex, setEditingPinIndex] = useState<number | null>(null);
  const [newPin, setNewPin] = useState<{ pin: string; name: string; allows_plus_one: boolean; skip_rsvp: boolean; hidden_events: string[] }>({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [deletePinTarget, setDeletePinTarget] = useState<string | null>(null);

  // Lock screen design state
  const [pinEntryText, setPinEntryText] = useState('');
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState('');
  const [pinEntryBackground, setPinEntryBackground] = useState<string>(BACKGROUNDS.BLUE_CLOUDS);
  const [customPinEntryBackground, setCustomPinEntryBackground] = useState<string | null>(null);
  const [pinEntryPrimaryColor, setPinEntryPrimaryColor] = useState('#141414');
  const [pinEntryFontColor, setPinEntryFontColor] = useState('#000000');
  const [pinEntryButtonFontColor, setPinEntryButtonFontColor] = useState('#FFFFFF');
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
      const pinColorIndex = COLOR_OPTIONS.findIndex(c => c.value === pinEntryPrimaryColor);

      const hasProSelection =
        (pinBgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) ||
        pinColorIndex >= FREE_COLOR_COUNT;

      if (hasProSelection) {
        setUpgradeModalOpen(true);
        return;
      }
    }

    const pinBackgroundToUse = customPinEntryBackground || pinEntryBackground;

    const result = await weddingService.updateWedding(weddingId, {
      pin_entry_text: pinEntryText,
      pin_entry_subtitle_text: pinEntrySubtitleText,
      pin_entry_background: pinBackgroundToUse,
      pin_entry_primary_color: pinEntryPrimaryColor,
      pin_entry_font_color: pinEntryFontColor,
      pin_entry_button_font_color: pinEntryButtonFontColor,
    });
    if (!result) throw new Error('Save failed');

    await weddingService.markUnpublishedChanges(weddingId);

    setInitialLockScreenData({
      pin_entry_text: pinEntryText,
      pin_entry_subtitle_text: pinEntrySubtitleText,
      pin_entry_background: pinBackgroundToUse,
      pin_entry_primary_color: pinEntryPrimaryColor,
      pin_entry_font_color: pinEntryFontColor,
      pin_entry_button_font_color: pinEntryButtonFontColor,
    });
    setIsLockScreenDirty(false);
  }, [weddingId, isPro, pinEntryText, pinEntrySubtitleText, pinEntryBackground, customPinEntryBackground,
    pinEntryPrimaryColor, pinEntryFontColor, pinEntryButtonFontColor]);

  const { saveStatus, debouncedSave } = useAutoSave({ onSave: saveLockScreenDesign, enabled: !!authUser });

  // Track lock screen dirty state and trigger auto-save
  useEffect(() => {
    if (initialLockScreenData) {
      const currentData = {
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinEntryBackground,
        pin_entry_primary_color: pinEntryPrimaryColor,
        pin_entry_font_color: pinEntryFontColor,
        pin_entry_button_font_color: pinEntryButtonFontColor,
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
    pinEntryPrimaryColor,
    pinEntryFontColor,
    pinEntryButtonFontColor,
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
          pin_entry_primary_color: pinEntryPrimaryColor,
          pin_entry_font_color: pinEntryFontColor,
          pin_entry_button_font_color: pinEntryButtonFontColor,
          previewMode: 'lock_screen',
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
    pinEntryPrimaryColor,
    pinEntryFontColor,
    pinEntryButtonFontColor,
  ]);

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
        setPinEntryPrimaryColor(wedding.pin_entry_primary_color || '#141414');
        setPinEntryFontColor(wedding.pin_entry_font_color || '#000000');
        setPinEntryButtonFontColor(wedding.pin_entry_button_font_color || '#FFFFFF');

        setInitialLockScreenData({
          pin_entry_text: wedding.pin_entry_text || defaultText,
          pin_entry_subtitle_text: wedding.pin_entry_subtitle_text || defaultSubtitle,
          pin_entry_background: wedding.pin_entry_background || BACKGROUNDS.BLUE_CLOUDS,
          pin_entry_primary_color: wedding.pin_entry_primary_color || '#141414',
          pin_entry_font_color: wedding.pin_entry_font_color || '#000000',
          pin_entry_button_font_color: wedding.pin_entry_button_font_color || '#FFFFFF',
        });
      }
    } catch (err) {
      console.error('Error loading PIN settings:', err);
      toast.error('Failed to load PIN settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPin = async () => {
    if (isViewOnly) return;
    if (!newPin.pin) {
      toast.error('Please enter a PIN code');
      return;
    }

    try {
      const currentPins = settings?.pin_codes || [];
      let updatedPins;

      if (editingPinIndex !== null) {
        // Editing existing PIN - replace at index
        updatedPins = [...currentPins];
        updatedPins[editingPinIndex] = newPin;
      } else {
        // Adding new PIN
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

      setPinDialogOpen(false);
      setEditingPinIndex(null);
      setNewPin({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
      await loadData();
      toast.success(editingPinIndex !== null ? 'PIN updated successfully' : 'PIN added successfully');
    } catch (err) {
      console.error('Error saving PIN:', err);
      toast.error(editingPinIndex !== null ? 'Failed to update PIN' : 'Failed to add PIN');
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
    setPinDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setPinDialogOpen(false);
    setEditingPinIndex(null);
    setNewPin({ pin: '', name: '', allows_plus_one: false, skip_rsvp: false, hidden_events: [] });
  };

  const handleDeletePin = async () => {
    if (isViewOnly) return;
    if (!deletePinTarget) return;

    try {
      const currentPins = settings?.pin_codes || [];
      const updatedPins = currentPins.filter((p: any) => p.pin !== deletePinTarget);

      await weddingService.updateSettings(weddingId!, {
        pin_codes: updatedPins,
      });

      setDeletePinTarget(null);
      await loadData();
      toast.success('PIN deleted successfully');
    } catch (err) {
      toast.error('Failed to delete PIN');
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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              PIN Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Create and manage unique PIN codes for your guests to access the wedding website
            </Typography>
          </Box>
          <AutoSaveIndicator status={saveStatus} />
        </Box>

        {/* PIN Management Section */}
        <Paper elevation={0} sx={{
          pt: 3,
          pb: 2,
          px: 2,
          borderRadius: '16px',
          bgcolor: 'white',
          border: '1px solid rgba(0,0,0,0.07)',
        }}>
          <Stack spacing={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} px={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                  Guest PIN Codes
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: '1.1rem' }}>
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
                <Typography variant="body2" sx={{ color: '#9a9a9a', fontSize: '1rem' }}>
                  Add your first PIN to give guests access to your wedding website
                </Typography>
              </Box>
            ) : (
              <List sx={{ bgcolor: alpha('#f5f5f5', 0.3), borderRadius: '16px', p: 1 }}>
                {settings.pin_codes.map((pinData: any, index: number) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: '#f8f8f8',
                      borderRadius: '12px',
                      mb: 1,
                      py: 2.5,
                      px: 3,
                      border: '2px solid',
                      borderColor: 'rgba(0,0,0,0.07)',
                      '&:last-child': { mb: 0 },
                      '&:hover': {
                        borderColor: 'rgba(0,0,0,0.15)',
                        bgcolor: '#f5f5f5',
                      },
                    }}
                    secondaryAction={
                      <Box display="flex" alignItems="center" gap={2}>
                        <Stack direction="row" spacing={1.5}>
                          <Chip
                            label={pinData.name || pinData.type || 'Guest'}
                            size="medium"
                            sx={{
                              fontSize: '1rem',
                              height: 36,
                              bgcolor: alpha('#DE3F5E', 0.1),
                              color: '#DE3F5E',
                              fontWeight: 600,
                              px: 1,
                            }}
                          />
                          {pinData.hidden_events?.length > 0 && (
                            <Tooltip
                              title={
                                <Stack spacing={0.5} sx={{ py: 0.5 }}>
                                  {pinData.hidden_events.map((eid: string) => {
                                    const ev = events.find(e => e.id === eid);
                                    return ev ? <Typography key={eid} variant="body2">{ev.name}</Typography> : null;
                                  })}
                                </Stack>
                              }
                              arrow
                            >
                              <Chip
                                label={`${pinData.hidden_events.length} hidden`}
                                size="medium"
                                sx={{
                                  fontSize: '1rem',
                                  height: 36,
                                  bgcolor: alpha('#1a1a1a', 0.08),
                                  color: '#4a4a4a',
                                  fontWeight: 600,
                                  px: 1,
                                  cursor: 'pointer',
                                }}
                              />
                            </Tooltip>
                          )}
                          {pinData.skip_rsvp ? (
                            <Chip
                              label="Skip RSVP"
                              size="medium"
                              sx={{
                                fontSize: '1rem',
                                height: 36,
                                bgcolor: alpha('#1a1a1a', 0.08),
                                color: '#4a4a4a',
                                fontWeight: 600,
                                px: 1,
                              }}
                            />
                          ) : (
                            <Chip
                              label={pinData.allows_plus_one ? 'Plus One Allowed' : 'No Plus One'}
                              size="medium"
                              sx={{
                                fontSize: '1rem',
                                height: 36,
                                bgcolor: pinData.allows_plus_one ? alpha('#1a1a1a', 0.08) : alpha('#6a6a6a', 0.1),
                                color: pinData.allows_plus_one ? '#4a4a4a' : '#6a6a6a',
                                fontWeight: 600,
                                px: 1,
                              }}
                            />
                          )}
                        </Stack>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditPin(pinData, index)}
                          sx={{
                            color: '#DE3F5E',
                            ml: 1,
                            '&:hover': {
                              bgcolor: alpha('#DE3F5E', 0.1),
                            },
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => setDeletePinTarget(pinData.pin)}
                          sx={{
                            color: '#DE3F5E',
                            ml: 1,
                            '&:hover': {
                              bgcolor: alpha('#DE3F5E', 0.1),
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#1a1a1a', fontSize: '1.2rem', fontWeight: 600 }}>
                          {pinData.pin}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        </Paper>

        {/* Lock Screen Design Section */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Lock Screen Design
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 2 }}>
            Customize the appearance of the PIN entry screen your guests see
          </Typography>
        </Box>

        {/* Welcome Text */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
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
        </Paper>

        {/* Background Selection */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
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
                      borderColor: pinEntryBackground === bg.url && !customPinEntryBackground ? '#DE3F5E' : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative',
                      '&:hover': {
                        borderColor: '#DE3F5E',
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
                sx={{ color: '#DE3F5E', borderColor: '#DE3F5E', '&:hover': { borderColor: '#DE3F5E', bgcolor: 'rgba(222, 63, 94, 0.04)' } }}
              >
                Show More
              </Button>
            )}
            {visiblePinBgs > 8 && (
              <Button
                onClick={() => setVisiblePinBgs(8)}
                variant="text"
                sx={{ color: '#666' }}
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
        </Paper>

        {/* Colors */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
            Colors
          </Typography>

          <Stack spacing={4}>
            {/* Button Color */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Button Color
              </Typography>

              <Grid container spacing={2} mb={2}>
                {COLOR_OPTIONS.map((color, index) => {
                  const isProOption = index >= FREE_COLOR_COUNT;

                  return (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={`pin-btn-${color.value}`}>
                      <Box
                        onClick={() => setPinEntryPrimaryColor(color.value)}
                        sx={{
                          width: '100%',
                          aspectRatio: '1/1',
                          backgroundColor: color.value,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: 3,
                          borderColor: pinEntryPrimaryColor === color.value ? '#000' : 'transparent',
                          transition: 'all 0.2s',
                          position: 'relative',
                          '&:hover': {
                            borderColor: '#666',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        {isProOption && !isPro && <ProBadge position="corner" />}
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#1a1a1a' }}>
                        {color.name}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>

              <TextField
                label="Custom Hex"
                value={pinEntryPrimaryColor}
                onChange={(e) => setPinEntryPrimaryColor(e.target.value)}
                placeholder="#141414"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Text Color */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Text Color
              </Typography>

              <Grid container spacing={2} mb={2}>
                {FONT_COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={`pin-txt-${color.value}`}>
                    <Box
                      onClick={() => setPinEntryFontColor(color.value)}
                      sx={{
                        width: '100%',
                        aspectRatio: '1/1',
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: pinEntryFontColor === color.value ? pinEntryPrimaryColor : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: pinEntryPrimaryColor,
                          transform: 'scale(1.05)',
                        },
                        ...(color.value === '#FFFFFF' && {
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                        }),
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#1a1a1a' }}>
                      {color.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Custom Hex"
                value={pinEntryFontColor}
                onChange={(e) => setPinEntryFontColor(e.target.value)}
                placeholder="#000000"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Button Text Color */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Button Text Color
              </Typography>

              <Grid container spacing={2} mb={2}>
                {FONT_COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={`pin-btn-txt-${color.value}`}>
                    <Box
                      onClick={() => setPinEntryButtonFontColor(color.value)}
                      sx={{
                        width: '100%',
                        aspectRatio: '1/1',
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: pinEntryButtonFontColor === color.value ? pinEntryPrimaryColor : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: pinEntryPrimaryColor,
                          transform: 'scale(1.05)',
                        },
                        ...(color.value === '#FFFFFF' && {
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                        }),
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#1a1a1a' }}>
                      {color.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Custom Hex"
                value={pinEntryButtonFontColor}
                onChange={(e) => setPinEntryButtonFontColor(e.target.value)}
                placeholder="#FFFFFF"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>
          </Stack>
        </Paper>

        {/* PIN Dialog */}
        <Dialog
          open={pinDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: '1.5rem' }}>
            {editingPinIndex !== null ? 'Edit PIN' : 'Add Guest PIN'}
          </DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="PIN Code"
                fullWidth
                value={newPin.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setNewPin({ ...newPin, pin: val });
                }}
                placeholder="e.g., 1234"
                required
                helperText="4-digit PIN code"
                disabled={editingPinIndex !== null}
                inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                sx={textFieldSx}
              />
              <TextField
                label="Name"
                fullWidth
                value={newPin.name}
                onChange={(e) => setNewPin({ ...newPin, name: e.target.value })}
                placeholder="e.g., Smith Family, VIP Table"
                helperText="Optional: Give this PIN a friendly name"
                sx={textFieldSx}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newPin.skip_rsvp}
                    onChange={(e) => setNewPin({ ...newPin, skip_rsvp: e.target.checked, allows_plus_one: e.target.checked ? false : newPin.allows_plus_one })}
                    sx={{ '& .Mui-checked': { color: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>Skip RSVP</Typography>}
              />
              {!newPin.skip_rsvp && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={newPin.allows_plus_one}
                      onChange={(e) => setNewPin({ ...newPin, allows_plus_one: e.target.checked })}
                      sx={{ '& .Mui-checked': { color: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>Allows Plus One</Typography>}
                />
              )}
              {events.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel shrink sx={{ color: '#4a4a4a', fontWeight: 500, '&.Mui-focused': { color: '#DE3F5E', fontWeight: 600 } }}>Hide Events</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value as string;
                      if (val && !newPin.hidden_events.includes(val)) {
                        setNewPin({ ...newPin, hidden_events: [...newPin.hidden_events, val] });
                      }
                    }}
                    label="Hide Events"
                    displayEmpty
                    notched
                    renderValue={() => <Typography sx={{ color: '#6a6a6a' }}>Select an event to hide</Typography>}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'white',
                      color: '#1a1a1a',
                      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                      '&:hover fieldset': { borderColor: '#DE3F5E' },
                      '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '2px' },
                    }}
                  >
                    {events
                      .filter(event => !newPin.hidden_events.includes(event.id))
                      .map((event) => (
                        <MenuItem key={event.id} value={event.id}>{event.name}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
              {newPin.hidden_events.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newPin.hidden_events.map((eventId) => {
                    const event = events.find(e => e.id === eventId);
                    return event ? (
                      <Chip
                        key={eventId}
                        label={event.name}
                        onDelete={() => setNewPin({ ...newPin, hidden_events: newPin.hidden_events.filter(id => id !== eventId) })}
                        sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E', fontWeight: 600, '& .MuiChip-deleteIcon': { color: '#DE3F5E' } }}
                      />
                    ) : null;
                  })}
                </Box>
              )}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f8f8', border: '1px solid rgba(0,0,0,0.07)' }}>
                <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.875rem' }}>
                  {generatePinSummary(newPin, events)}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#6a6a6a', fontSize: '1rem' }}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={editingPinIndex !== null ? <Edit /> : <Add />}
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
              {editingPinIndex !== null ? 'Update PIN' : 'Add PIN'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletePinTarget}
          onClose={() => setDeletePinTarget(null)}
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 1,
              maxWidth: 400,
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>
            Delete PIN?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
              Are you sure you want to delete PIN <strong>{deletePinTarget}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeletePinTarget(null)} sx={{ color: '#6a6a6a', borderRadius: '12px', textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDeletePin}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#C8365A' },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upgrade Modal */}
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      </Stack>
    </Box>
  );
}
