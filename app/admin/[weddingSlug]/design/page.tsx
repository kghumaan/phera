'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  TextField,
  Fade,
  Snackbar,
  Alert,
  Divider,
  FormControlLabel,
  RadioGroup,
  Radio,
  Tabs,
  Tab,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, Check, ViewAgenda, UnfoldMore } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';
import { BACKGROUNDS, BACKGROUND_UI_OPTIONS } from '@/lib/constants/images';
import { usePlan } from '@/lib/contexts/PlanContext';
import ProBadge from '@/components/admin/ProBadge';
import UpgradeModal from '@/components/admin/UpgradeModal';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

// Consistent section Paper styling (matches other onboarding pages)
const sectionPaperSx = {
  p: 3,
  borderRadius: '16px',
  bgcolor: '#fafafa',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
};

const BACKGROUND_OPTIONS = BACKGROUND_UI_OPTIONS;

// Number of free options for basic plan
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`design-tabpanel-${index}`}
      aria-labelledby={`design-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 0, pb: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function DesignCustomizationPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleName, setCoupleName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('error');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Pin entry customization state
  const [pinEntryText, setPinEntryText] = useState('');
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState('');
  const [pinEntryBackground, setPinEntryBackground] = useState<string>(BACKGROUNDS.BLUE_CLOUDS);
  const [customPinEntryBackground, setCustomPinEntryBackground] = useState<string | null>(null);
  const [pinEntryPrimaryColor, setPinEntryPrimaryColor] = useState('#141414');
  const [pinEntryFontColor, setPinEntryFontColor] = useState('#000000');
  const [pinEntryButtonFontColor, setPinEntryButtonFontColor] = useState('#FFFFFF');

  // Main site customization state
  const [mainBackground, setMainBackground] = useState<string>(BACKGROUNDS.BLUE_CLOUDS);

  const [customMainBackground, setCustomMainBackground] = useState<string | null>(null);
  const [mainPrimaryColor, setMainPrimaryColor] = useState('#DE3F5E');
  const [websiteLayout, setWebsiteLayout] = useState<'nested' | 'infinite_scroll'>('nested');
  const [activeTab, setActiveTab] = useState(0);

  const [initialDesignData, setInitialDesignData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Track dirty state
  useEffect(() => {
    if (initialDesignData) {
      const currentData = {
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinEntryBackground,
        pin_entry_primary_color: pinEntryPrimaryColor,
        pin_entry_font_color: pinEntryFontColor,
        pin_entry_button_font_color: pinEntryButtonFontColor,
        background_image: mainBackground,
        primary_color: mainPrimaryColor,
        website_layout: websiteLayout,
      };
      setIsDirty(JSON.stringify(currentData) !== JSON.stringify(initialDesignData));
    }
  }, [
    pinEntryText,
    pinEntrySubtitleText,
    pinEntryBackground,
    pinEntryPrimaryColor,
    pinEntryFontColor,
    pinEntryButtonFontColor,
    mainBackground,
    mainPrimaryColor,
    initialDesignData
  ]);


  // Background pagination state
  const [visibleMainBgs, setVisibleMainBgs] = useState(8);
  const [visiblePinBgs, setVisiblePinBgs] = useState(8);


  // Real-time Preview Sync Effect (debounced)
  useEffect(() => {
    // Only sync if we have a weddingId and relevant data
    if (!weddingId) return;

    const timer = setTimeout(() => {
      const channel = new BroadcastChannel('phera-design-sync');

      const syncData = {
        type: 'DESIGN_UPDATE',
        weddingId,
        updates: {
          background_image: customMainBackground || mainBackground,
          primary_color: mainPrimaryColor,
          pin_entry_text: pinEntryText,
          pin_entry_subtitle_text: pinEntrySubtitleText,
          pin_entry_background: customPinEntryBackground || pinEntryBackground,
          pin_entry_primary_color: pinEntryPrimaryColor,
          pin_entry_font_color: pinEntryFontColor,
          pin_entry_button_font_color: pinEntryButtonFontColor,
          previewMode: activeTab === 1 ? 'lock_screen' : 'main',
          website_layout: websiteLayout,
        }
      };

      channel.postMessage(syncData);
      channel.close();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    weddingId,
    mainBackground,
    customMainBackground,
    mainPrimaryColor,
    pinEntryText,
    pinEntrySubtitleText,
    pinEntryBackground,
    customPinEntryBackground,
    pinEntryPrimaryColor,
    pinEntryFontColor,
    pinEntryButtonFontColor,
    activeTab,
    websiteLayout
  ]);

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        setCoupleName(wedding.couple_name);

        // Load pin entry customizations or use defaults
        const defaultText = "You're invited!";
        const defaultSubtitle = 'Enter your invitation code to see all the details and RSVP for our celebration';

        setPinEntryText(wedding.pin_entry_text || defaultText);
        setPinEntrySubtitleText(wedding.pin_entry_subtitle_text || defaultSubtitle);
        setPinEntryBackground(wedding.pin_entry_background || BACKGROUNDS.BLUE_CLOUDS);
        setPinEntryPrimaryColor(wedding.pin_entry_primary_color || '#141414');
        setPinEntryFontColor(wedding.pin_entry_font_color || '#000000');
        setPinEntryButtonFontColor(wedding.pin_entry_button_font_color || '#FFFFFF');

        // Load main site customizations
        setMainBackground(wedding.background_image || BACKGROUNDS.BLUE_CLOUDS);
        setMainPrimaryColor(wedding.primary_color || '#DE3F5E');
        setWebsiteLayout((wedding.website_layout as 'nested' | 'infinite_scroll') || 'nested');
      }
    } catch (err) {
      console.error('Error loading pin entry settings:', err);
      const errorMessage = 'Failed to load pin entry settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if any selected options require pro
    if (!isPro) {
      const mainBgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === mainBackground);
      const pinBgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);
      const mainColorIndex = COLOR_OPTIONS.findIndex(c => c.value === mainPrimaryColor);
      const pinColorIndex = COLOR_OPTIONS.findIndex(c => c.value === pinEntryPrimaryColor);

      const hasProSelection =
        (mainBgIndex >= FREE_BACKGROUND_COUNT && !customMainBackground) ||
        (pinBgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) ||
        mainColorIndex >= FREE_COLOR_COUNT ||
        pinColorIndex >= FREE_COLOR_COUNT;

      if (hasProSelection) {
        setUpgradeModalOpen(true);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const pinBackgroundToUse = customPinEntryBackground || pinEntryBackground;
      const mainBackgroundToUse = customMainBackground || mainBackground;

      await weddingService.updateWedding(weddingId!, {
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinBackgroundToUse,
        pin_entry_primary_color: pinEntryPrimaryColor,
        pin_entry_font_color: pinEntryFontColor,
        pin_entry_button_font_color: pinEntryButtonFontColor,
        // Save main site customizations
        background_image: mainBackgroundToUse,
        primary_color: mainPrimaryColor,
        website_layout: websiteLayout,
      });

      setInitialDesignData({
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinBackgroundToUse,
        pin_entry_primary_color: pinEntryPrimaryColor,
        pin_entry_font_color: pinEntryFontColor,
        pin_entry_button_font_color: pinEntryButtonFontColor,
        background_image: mainBackgroundToUse,
        primary_color: mainPrimaryColor,
        website_layout: websiteLayout,
      });

      setSuccess(true);
      setShowSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => {
        setSuccess(false);
        setShowSaveSuccess(false);
      }, 2500);

    } catch (err) {
      console.error('Error saving pin entry settings:', err);
      const errorMessage = 'Failed to save pin entry settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading pin entry settings..." />
      </Container>
    );
  }

  // Generate preview text with couple name if placeholder is used
  const previewText = pinEntryText.replace(/\{couple_name\}/g, coupleName);
  const previewSubtitle = pinEntrySubtitleText.replace(/\{couple_name\}/g, coupleName);

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Look & Feel
            </Typography>
            <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
              Customize the colors, backgrounds, and overall design of your wedding website
            </Typography>
          </Box>
          {isDirty && (
            <Button
              variant="contained"
              startIcon={showSaveSuccess ? <Check /> : <Save />}
              onClick={handleSave}
              disabled={saving || showSaveSuccess}
              sx={{
                bgcolor: showSaveSuccess ? '#10B981' : '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,

                boxShadow: showSaveSuccess
                  ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                  : '0 4px 12px rgba(222, 63, 94, 0.3)',
                '&:hover': {
                  bgcolor: showSaveSuccess ? '#059669' : '#C8365A',
                  boxShadow: showSaveSuccess
                    ? '0 6px 16px rgba(16, 185, 129, 0.5)'
                    : '0 6px 16px rgba(222, 63, 94, 0.4)',
                },
              }}
            >
              {saving ? 'Saving...' : showSaveSuccess ? 'Saved!' : 'Save Look & Feel'}
            </Button>
          )}
        </Box>


        <Box>
          <Box>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                borderBottom: 1,
                borderColor: '#e0e0e0',
                minHeight: 'auto',
                gap: 0.5,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minWidth: 160,
                  color: '#6a6a6a',
                  border: '1px solid #e0e0e0', // Visible border for all tabs
                  borderBottom: 'none', // Remove bottom border to rely on the Tabs container border
                  borderRadius: '12px 12px 0 0',
                  transition: 'all 0.2s',
                  minHeight: 48,
                  bgcolor: '#f5f5f5', // Light gray for unselected tabs
                  mr: 0.5,
                  '&:hover': {
                    bgcolor: '#eeeeee',
                  },
                },
                '& .Mui-selected': {
                  color: '#DE3F5E !important',
                  borderColor: '#e0e0e0 !important',
                  borderBottomColor: '#ffffff !important',
                  backgroundColor: '#ffffff !important',
                  mb: '-1px', // Pull down to overlap the bottom border
                  zIndex: 1,
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                }
              }}
            >
              <Tab label="Main Website" />
              <Tab label="Lock Screen" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Stack spacing={3}>
              {/* Website Layout Selection */}
              <Paper sx={sectionPaperSx}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                  Website Layout
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 2 }}>
                  Choose how your wedding details are displayed to guests
                </Typography>

                <RadioGroup
                  value={websiteLayout}
                  onChange={(e) => setWebsiteLayout(e.target.value as 'nested' | 'infinite_scroll')}
                  sx={{ flexDirection: 'row', gap: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: '#ffffff',
                          border: websiteLayout === 'nested' ? '2px solid #DE3F5E' : '1px solid #e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          height: '100%',
                          '&:hover': { borderColor: '#DE3F5E' },
                        }}
                        onClick={() => setWebsiteLayout('nested')}
                      >
                        <FormControlLabel
                          value="nested"
                          control={<Radio sx={{ color: '#DE3F5E', '&.Mui-checked': { color: '#DE3F5E' } }} />}
                          label={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                  Nested
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                                  Guests tap 'View Details' to see event info, schedule, and more in an overlay
                                </Typography>
                              </Box>
                              <ViewAgenda sx={{ fontSize: 32, color: '#DE3F5E', flexShrink: 0, ml: 2 }} />
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', m: 0 }}
                        />
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: '#ffffff',
                          border: websiteLayout === 'infinite_scroll' ? '2px solid #DE3F5E' : '1px solid #e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          height: '100%',
                          '&:hover': { borderColor: '#DE3F5E' },
                        }}
                        onClick={() => setWebsiteLayout('infinite_scroll')}
                      >
                        <FormControlLabel
                          value="infinite_scroll"
                          control={<Radio sx={{ color: '#DE3F5E', '&.Mui-checked': { color: '#DE3F5E' } }} />}
                          label={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                  Infinite Scroll
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                                  All wedding details are displayed as you scroll down the page
                                </Typography>
                              </Box>
                              <UnfoldMore sx={{ fontSize: 32, color: '#DE3F5E', flexShrink: 0, ml: 2 }} />
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', m: 0 }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                </RadioGroup>
              </Paper>


              {/* Main Background Selection */}
              <Paper sx={sectionPaperSx}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Main Background Image
                </Typography>

                <Grid container spacing={2} mb={3}>
                  {BACKGROUND_OPTIONS.slice(0, visibleMainBgs).map((bg, index) => {
                    const isProOption = index >= FREE_BACKGROUND_COUNT;

                    return (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`main-bg-${bg.url}`}>
                        <Box
                          onClick={() => {
                            setMainBackground(bg.url);
                            setCustomMainBackground(null);
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
                            borderColor: mainBackground === bg.url && !customMainBackground ? '#DE3F5E' : 'transparent',
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
                  {visibleMainBgs < BACKGROUND_OPTIONS.length && (
                    <Button
                      onClick={() => setVisibleMainBgs(prev => Math.min(prev + 8, BACKGROUND_OPTIONS.length))}
                      variant="outlined"
                      sx={{ color: '#DE3F5E', borderColor: '#DE3F5E', '&:hover': { borderColor: '#DE3F5E', bgcolor: 'rgba(222, 63, 94, 0.04)' } }}
                    >
                      Show More
                    </Button>
                  )}
                  {visibleMainBgs > 8 && (
                    <Button
                      onClick={() => setVisibleMainBgs(8)}
                      variant="text"
                      sx={{ color: '#666' }}
                    >
                      Show Less
                    </Button>
                  )}
                </Stack>

                {weddingId && (
                  <ImageUpload
                    label="Upload Custom Main Background"
                    value={customMainBackground}
                    onChange={(url) => {
                      setCustomMainBackground(url);
                      if (url) setMainBackground('');
                    }}
                    path={getWeddingImagePath(weddingId, 'backgrounds')}
                    helperText="Recommended: 1920x1080px (Main site background)"
                    aspectRatio="16/9"
                    maxWidth={600}
                  />
                )}
              </Paper>

              {/* Main Primary Color Selection */}
              <Paper sx={sectionPaperSx}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Primary Theme Color
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3 }}>
                  Used for buttons, accents, and highlighting important elements
                </Typography>

                <Grid container spacing={2} mb={3}>
                  {COLOR_OPTIONS.map((color, index) => {
                    const isProOption = index >= FREE_COLOR_COUNT;

                    return (
                      <Grid size={{ xs: 6, sm: 4, md: 2 }} key={`main-color-${color.value}`}>
                        <Box
                          onClick={() => setMainPrimaryColor(color.value)}
                          sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            backgroundColor: color.value,
                            borderRadius: 1,
                            cursor: 'pointer',
                            border: 3,
                            borderColor: mainPrimaryColor === color.value ? '#000' : 'transparent',
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
                  value={mainPrimaryColor}
                  onChange={(e) => setMainPrimaryColor(e.target.value)}
                  placeholder="#DE3F5E"
                  sx={{ ...textFieldSx, maxWidth: 200 }}
                />
              </Paper>
            </Stack>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Stack spacing={3}>

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

              {/* Background Selection Section */}
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
                      onClick={() => setVisiblePinBgs(prev => Math.min(prev + 8, BACKGROUND_OPTIONS.length))}
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

              {/* Colors Section */}
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
            </Stack>
          </TabPanel>
        </Box>




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

        {/* Upgrade Modal */}
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      </Stack >
    </Container >
  );
}
