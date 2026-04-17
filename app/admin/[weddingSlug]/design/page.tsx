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
  Divider,
  FormControlLabel,
  RadioGroup,
  Radio,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import { Check, ViewAgenda, UnfoldMore, InfoOutlined, Add, Delete } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';
import { BACKGROUNDS, BACKGROUND_UI_OPTIONS, FRAME_UI_OPTIONS } from '@/lib/constants/images';
import { COUPLE_NAME_FONTS, DEFAULT_COUPLE_FONT_ID, getCoupleFont } from '@/lib/constants/fonts';
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
import FeatureRequestModal from '@/components/admin/FeatureRequestModal';
import { SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

// Consistent section Paper styling (matches other onboarding pages)
const sectionPaperSx = {
  p: 3,
  borderRadius: RADII.lg,
  bgcolor: COLORS.bg.muted,
  boxShadow: 'none',
};

const BACKGROUND_OPTIONS = BACKGROUND_UI_OPTIONS;

// Number of free options for basic plan
const FREE_BACKGROUND_COUNT = 4;
const FREE_COLOR_COUNT = 5;
const FREE_FRAME_COUNT = 4;

const COLOR_OPTIONS = [
  { name: 'Rose', value: COLORS.brand.primary },
  { name: 'Black', value: '#141414' },
  { name: 'Plum', value: '#59114D' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Maroon', value: '#941C28' },
  { name: 'Purple', value: '#AC3FBA' },
  { name: 'Sky', value: '#6290C8' },
  { name: 'Teal', value: '#489991' },
  { name: 'Green', value: '#76B041' },
  { name: 'Forest', value: '#59814B' },
  { name: 'Orange', value: '#DF6507' },
  { name: 'Amber', value: '#FA9A00' },
];

export default function DesignCustomizationPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { user: authUser } = useAuth();
  const { isViewOnly } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showStatus } = useAutoSaveStatus();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proSelections, setProSelections] = useState<ProSelection[]>([]);
  const { registerGuard, unregisterGuard } = useNavigationGuard();
  const [customModalOpen, setCustomModalOpen] = useState(false);

  // Main site customization state
  const [mainBackground, setMainBackground] = useState<string>(BACKGROUNDS.BLUE_CLOUDS);
  const [customMainBackground, setCustomMainBackground] = useState<string | null>(null);
  const [mainPrimaryColor, setMainPrimaryColor] = useState<string>(COLORS.brand.primary);
  const [websiteLayout, setWebsiteLayout] = useState<'multi_page' | 'vertical_scroll'>('vertical_scroll');
  const [frameImageUrl, setFrameImageUrl] = useState<string | null>(null);
  const [coupleNameFont, setCoupleNameFont] = useState<string>(DEFAULT_COUPLE_FONT_ID);
  const [coupleNamePreview, setCoupleNamePreview] = useState<string>('Simran & Arjun');
  const [coupleImages, setCoupleImages] = useState<(string | null)[]>(Array(6).fill(null));

  const [initialDesignData, setInitialDesignData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save hook
  const saveDesign = useCallback(async () => {
    if (isViewOnly) return;
    if (!weddingId) return;

    // Check if any selected options require pro
    if (!isPro) {
      const mainBgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === mainBackground);
      const mainColorIndex = COLOR_OPTIONS.findIndex(c => c.value === mainPrimaryColor);
      const frameIndex = FRAME_UI_OPTIONS.findIndex(f => f.url === frameImageUrl);

      const hasProSelection =
        (mainBgIndex >= FREE_BACKGROUND_COUNT && !customMainBackground) ||
        mainColorIndex >= FREE_COLOR_COUNT ||
        frameIndex >= FREE_FRAME_COUNT;

      if (hasProSelection) {
        return;
      }
    }

    const mainBackgroundToUse = customMainBackground || mainBackground;

    const result = await weddingService.updateWedding(weddingId, {
      background_image: mainBackgroundToUse,
      primary_color: mainPrimaryColor,
      pin_entry_primary_color: mainPrimaryColor,
      website_layout: websiteLayout,
      frame_image_url: frameImageUrl,
      couple_name_font: coupleNameFont,
      couple_images: coupleImages.filter(img => img),
      couple_image_url: (coupleImages.filter(img => img)[0] as string) || null,
    } as any);
    if (!result) throw new Error('Save failed');

    await weddingService.markUnpublishedChanges(weddingId);

    setInitialDesignData({
      background_image: mainBackgroundToUse,
      primary_color: mainPrimaryColor,
      website_layout: websiteLayout,
      frame_image_url: frameImageUrl,
      couple_name_font: coupleNameFont,
      couple_images: coupleImages.filter(img => img),
    });
    setIsDirty(false);
  }, [weddingId, isPro, mainBackground, customMainBackground,
    mainPrimaryColor, websiteLayout, frameImageUrl, coupleNameFont, coupleImages]);

  const { saveStatus, debouncedSave } = useAutoSave({ onSave: saveDesign, enabled: !!authUser });

  // Check if current selections include pro items (basic user)
  const hasProSelection = !isPro && (() => {
    const mainBgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === mainBackground);
    const mainColorIndex = COLOR_OPTIONS.findIndex(c => c.value === mainPrimaryColor);
    const frameIndex = FRAME_UI_OPTIONS.findIndex(f => f.url === frameImageUrl);
    return (
      (mainBgIndex >= FREE_BACKGROUND_COUNT && !customMainBackground) ||
      mainColorIndex >= FREE_COLOR_COUNT ||
      frameIndex >= FREE_FRAME_COUNT
    );
  })();

  // Track dirty state and trigger auto-save
  useEffect(() => {
    if (initialDesignData) {
      const currentData = {
        background_image: mainBackground,
        primary_color: mainPrimaryColor,
        website_layout: websiteLayout,
        frame_image_url: frameImageUrl,
        couple_name_font: coupleNameFont,
        couple_images: coupleImages.filter(img => img),
      };
      const dirty = JSON.stringify(currentData) !== JSON.stringify(initialDesignData);
      setIsDirty(dirty);
      if (dirty && !hasProSelection) {
        debouncedSave();
      }
    }
  }, [
    mainBackground,
    mainPrimaryColor,
    websiteLayout,
    frameImageUrl,
    coupleNameFont,
    coupleImages,
    initialDesignData,
    debouncedSave,
    hasProSelection,
  ]);


  // Navigation guard: prompt on leave if pro selections exist
  useEffect(() => {
    if (isPro) return;

    const getProSelections = () => {
      const sels: ProSelection[] = [];
      const bgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === mainBackground);
      if (bgIndex >= FREE_BACKGROUND_COUNT && !customMainBackground) {
        sels.push({ category: 'Background', name: BACKGROUND_OPTIONS[bgIndex].name });
      }
      const colorIndex = COLOR_OPTIONS.findIndex(c => c.value === mainPrimaryColor);
      if (colorIndex >= FREE_COLOR_COUNT) {
        sels.push({ category: 'Theme Color', name: COLOR_OPTIONS[colorIndex].name, color: mainPrimaryColor });
      }
      const frameIndex = FRAME_UI_OPTIONS.findIndex(f => f.url === frameImageUrl);
      if (frameIndex >= FREE_FRAME_COUNT) {
        sels.push({ category: 'Photo Frame', name: FRAME_UI_OPTIONS[frameIndex].name });
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
  }, [isPro, mainBackground, customMainBackground, mainPrimaryColor, frameImageUrl, registerGuard, unregisterGuard]);

  // Beforeunload safety net
  useEffect(() => {
    if (isPro) return;

    const handler = (e: BeforeUnloadEvent) => {
      const bgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === mainBackground);
      const colorIndex = COLOR_OPTIONS.findIndex(c => c.value === mainPrimaryColor);
      const frameIndex = FRAME_UI_OPTIONS.findIndex(f => f.url === frameImageUrl);
      const hasProSelection =
        (bgIndex >= FREE_BACKGROUND_COUNT && !customMainBackground) ||
        colorIndex >= FREE_COLOR_COUNT ||
        frameIndex >= FREE_FRAME_COUNT;
      if (hasProSelection) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isPro, mainBackground, customMainBackground, mainPrimaryColor, frameImageUrl]);

  // Background pagination state
  const [visibleMainBgs, setVisibleMainBgs] = useState(8);


  // Real-time Preview Sync — only broadcast when serialized value actually changes
  const lastSyncRef = useRef('');

  useEffect(() => {
    if (!weddingId) return;

    const updates = {
      background_image: customMainBackground || mainBackground,
      primary_color: mainPrimaryColor,
      website_layout: websiteLayout,
      frame_image_url: frameImageUrl,
      couple_name_font: coupleNameFont,
      couple_images: coupleImages.filter(img => img),
    };

    const serialized = JSON.stringify(updates);
    if (serialized === lastSyncRef.current) return;
    lastSyncRef.current = serialized;

    const timer = setTimeout(() => {
      const channel = new BroadcastChannel('phera-design-sync');
      channel.postMessage({ type: 'DESIGN_UPDATE', weddingId, updates });
      channel.close();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    weddingId,
    mainBackground,
    customMainBackground,
    mainPrimaryColor,
    websiteLayout,
    frameImageUrl,
    coupleNameFont,
    coupleImages
  ]);

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);

        // Load main site customizations
        setMainBackground(wedding.background_image || BACKGROUNDS.BLUE_CLOUDS);
        setMainPrimaryColor(wedding.primary_color || COLORS.brand.primary);
        const rawLayout = wedding.website_layout as string;
        // Normalize legacy DB values
        const normalizedLayout: 'multi_page' | 'vertical_scroll' =
          (rawLayout === 'infinite_scroll' || rawLayout === 'vertical_scroll') ? 'vertical_scroll' : 'multi_page';
        setWebsiteLayout(normalizedLayout);
        setFrameImageUrl(wedding.frame_image_url || null);
        setCoupleNameFont((wedding as any).couple_name_font || DEFAULT_COUPLE_FONT_ID);
        setCoupleNamePreview(wedding.couple_name || 'Simran & Arjun');

        // Load couple images
        let loadedCoupleImages: (string | null)[] = Array(6).fill(null);
        if (wedding.couple_images && Array.isArray(wedding.couple_images)) {
          const images: (string | null)[] = [...wedding.couple_images as unknown as string[]];
          while (images.length < 6) images.push(null);
          loadedCoupleImages = images.slice(0, 6);
        } else if (wedding.couple_image_url) {
          loadedCoupleImages = [wedding.couple_image_url, null, null, null, null, null];
        }
        setCoupleImages(loadedCoupleImages);

        // Set initial design data for dirty tracking (enables auto-save)
        setInitialDesignData({
          background_image: wedding.background_image || BACKGROUNDS.BLUE_CLOUDS,
          primary_color: wedding.primary_color || COLORS.brand.primary,
          website_layout: normalizedLayout,
          frame_image_url: wedding.frame_image_url || null,
          couple_name_font: (wedding as any).couple_name_font || DEFAULT_COUPLE_FONT_ID,
          couple_images: loadedCoupleImages.filter(img => img),
        });
      }
    } catch (err) {
      console.error('Error loading design settings:', err);
      const errorMessage = 'Failed to load design settings';
      setError(errorMessage);
      showStatus('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading design settings..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
              Look & Feel
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
              Customize the colors, backgrounds, and overall design of your wedding website
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
            <Button variant="outlined" onClick={() => setCustomModalOpen(true)} sx={SECONDARY_BUTTON_SX}>
              Want something custom?
            </Button>
          </Box>
        </Box>

        <Stack spacing={3}>
          {/* Desktop Layout Selection */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ mb: 1, color: COLORS.text.strong }}>
              Desktop Layout
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
              Choose how your wedding details are displayed to guests
            </Typography>

            <RadioGroup
              value={websiteLayout}
              onChange={(e) => setWebsiteLayout(e.target.value as 'multi_page' | 'vertical_scroll')}
              sx={{ width: '100%' }}
            >
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: RADII.sm,
                      bgcolor: COLORS.bg.white,
                      border: websiteLayout === 'vertical_scroll' ? '2px solid #DE3F5E' : '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { borderColor: COLORS.brand.primary },
                    }}
                    onClick={() => setWebsiteLayout('vertical_scroll')}
                  >
                    <FormControlLabel
                      value="vertical_scroll"
                      control={<Radio size="small" sx={{ color: COLORS.brand.primary, '&.Mui-checked': { color: COLORS.brand.primary }, p: 0.5 }} />}
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                              Vertical Scroll
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.text.subtle, lineHeight: 1.3, display: { xs: 'none', sm: 'block' } }}>
                              All details shown as you scroll down
                            </Typography>
                          </Box>
                          <UnfoldMore sx={{ fontSize: 36, color: COLORS.brand.primary, flexShrink: 0, ml: 1 }} />
                        </Box>
                      }
                      sx={{ alignItems: 'center', m: 0, gap: 0.5, width: '100%', '& .MuiFormControlLabel-label': { flex: 1 } }}
                    />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: RADII.sm,
                      bgcolor: COLORS.bg.white,
                      border: websiteLayout === 'multi_page' ? '2px solid #DE3F5E' : '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { borderColor: COLORS.brand.primary },
                    }}
                    onClick={() => setWebsiteLayout('multi_page')}
                  >
                    <FormControlLabel
                      value="multi_page"
                      control={<Radio size="small" sx={{ color: COLORS.brand.primary, '&.Mui-checked': { color: COLORS.brand.primary }, p: 0.5 }} />}
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                              Multi-Page
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.text.subtle, lineHeight: 1.3, display: { xs: 'none', sm: 'block' } }}>
                              Guests tap &apos;View Details&apos; to see event info
                            </Typography>
                          </Box>
                          <ViewAgenda sx={{ fontSize: 36, color: COLORS.brand.primary, flexShrink: 0, ml: 1 }} />
                        </Box>
                      }
                      sx={{ alignItems: 'center', m: 0, gap: 0.5, width: '100%', '& .MuiFormControlLabel-label': { flex: 1 } }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </RadioGroup>
          </Paper>


          {/* Main Background Selection */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ mb: 2, color: COLORS.text.strong }}>
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
                        backgroundImage: `url(${bg.thumbUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: mainBackground === bg.url && !customMainBackground ? COLORS.brand.primary : 'transparent',
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
              {visibleMainBgs < BACKGROUND_OPTIONS.length && (
                <Button
                  onClick={() => setVisibleMainBgs(BACKGROUND_OPTIONS.length)}
                  variant="outlined"
                  sx={{ color: COLORS.brand.primary, borderColor: COLORS.brand.primary, '&:hover': { borderColor: COLORS.brand.primary, bgcolor: 'rgba(222, 63, 94, 0.04)' } }}
                >
                  Show More
                </Button>
              )}
              {visibleMainBgs > 8 && (
                <Button
                  onClick={() => setVisibleMainBgs(8)}
                  variant="text"
                  sx={{ color: COLORS.text.subtle }}
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
            <Typography variant="subtitleCaps" sx={{ mb: 2, color: COLORS.text.strong }}>
              Primary Theme Color
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3 }}>
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
                        borderColor: mainPrimaryColor === color.value ? COLORS.text.strong : 'transparent',
                        transition: 'all 0.2s',
                        position: 'relative',
                        '&:hover': {
                          borderColor: COLORS.text.subtle,
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      {isProOption && !isPro && <ProBadge position="corner" />}
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: COLORS.text.strong }}>
                      {color.name}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Custom Hex"
                value={mainPrimaryColor}
                onChange={(e) => setMainPrimaryColor(e.target.value)}
                placeholder="#DE3F5E"
                disabled={!isPro}
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
              {!isPro && <ProBadge position="inline" />}
            </Box>
          </Paper>

          {/* Primary Font Style */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ mb: 1, color: COLORS.text.strong }}>
              Primary Font Style
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3, display: 'block' }}>
              Choose how the couple names appear on the hero section of your website.
            </Typography>

            {/* Live preview */}
            <Box sx={{ textAlign: 'center', py: 3, mb: 3, bgcolor: COLORS.text.inverse, borderRadius: RADII.md, border: '1px solid #e0e0e0' }}>
              <Typography sx={{
                fontFamily: getCoupleFont(coupleNameFont).cssVar,
                fontStyle: getCoupleFont(coupleNameFont).fontStyle || 'normal',
                fontSize: { xs: 32, sm: 40 },
                color: COLORS.text.strong,
                lineHeight: 1.2,
              }}>
                {coupleNamePreview}
              </Typography>
            </Box>

            {/* Font name chips — horizontal scroll */}
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.12)', borderRadius: 2 } }}>
              {COUPLE_NAME_FONTS.map((font) => (
                <Box
                  key={font.id}
                  onClick={() => { setCoupleNameFont(font.id); debouncedSave(); }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: RADII.sm,
                    border: 2,
                    borderColor: coupleNameFont === font.id ? COLORS.brand.primary : '#e0e0e0',
                    bgcolor: coupleNameFont === font.id ? 'rgba(222, 63, 94, 0.04)' : COLORS.bg.white,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    '&:hover': { borderColor: COLORS.brand.primary },
                  }}
                >
                  <Typography sx={{
                    fontFamily: font.cssVar,
                    fontStyle: font.fontStyle || 'normal',
                    fontSize: 14,
                    color: coupleNameFont === font.id ? COLORS.brand.primary : COLORS.text.strong,
                    fontWeight: coupleNameFont === font.id ? 600 : 400,
                  }}>
                    {font.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Images & Frames */}
          <Paper sx={sectionPaperSx}>
            <Stack spacing={4}>
              {/* Couple Photos */}
              <Box>
                <Typography variant="subtitleCaps" sx={{ mb: 2, color: COLORS.text.strong }}>
                  Couple Photos (up to 6)
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2, display: 'block' }}>
                  Upload your favorite photos — or a wedding logo. Drag to reorder; the first is the main image.
                </Typography>

                {/* Add Photos Button (multiple) */}
                {coupleImages.filter(img => img).length < 6 && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                        input.multiple = true;
                        input.onchange = async (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          if (!files.length) return;
                          const currentCount = coupleImages.filter(img => img).length;
                          const slotsAvailable = 6 - currentCount;
                          const filesToUpload = files.slice(0, slotsAvailable);
                          const { uploadImage } = await import('@/lib/utils/image-upload');
                          const newImages = [...coupleImages];
                          for (const file of filesToUpload) {
                            const result = await uploadImage(file, getWeddingImagePath(weddingId!, 'couple'));
                            if (result.success && result.url) {
                              const nextEmptyIndex = newImages.findIndex(img => !img);
                              if (nextEmptyIndex !== -1) {
                                newImages[nextEmptyIndex] = result.url;
                              } else {
                                newImages.push(result.url);
                              }
                            }
                          }
                          setCoupleImages(newImages.slice(0, 6));
                        };
                        input.click();
                      }}
                      sx={{
                        borderColor: COLORS.brand.primary,
                        color: COLORS.brand.primary,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#C8365A',
                          bgcolor: 'rgba(222, 63, 94, 0.05)',
                        },
                      }}
                    >
                      Add Photos
                    </Button>
                  </Box>
                )}

                {/* Horizontal scrollable thumbnails with drag-to-reorder */}
                {coupleImages.filter(img => img).length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      overflowX: 'auto',
                      pb: 2,
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: COLORS.bg.subtle,
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: COLORS.brand.primary,
                        borderRadius: 4,
                      },
                    }}
                  >
                    {coupleImages.filter((img): img is string => img !== null && img !== '').map((img, actualIndex) => {
                      const originalIndex = coupleImages.indexOf(img);
                      return (
                        <Box
                          key={img}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(actualIndex));
                            (e.currentTarget as HTMLElement).style.opacity = '0.5';
                          }}
                          onDragEnd={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '1';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).style.outline = '2px dashed #DE3F5E';
                          }}
                          onDragLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.outline = 'none';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).style.outline = 'none';
                            const fromVisualIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            const toVisualIndex = actualIndex;
                            if (fromVisualIndex === toVisualIndex) return;
                            // Get only non-null images, reorder, then pad back
                            const active = coupleImages.filter((i): i is string => i !== null && i !== '');
                            const [moved] = active.splice(fromVisualIndex, 1);
                            active.splice(toVisualIndex, 0, moved);
                            const padded: (string | null)[] = [...active];
                            while (padded.length < 6) padded.push(null);
                            setCoupleImages(padded);
                          }}
                          sx={{
                            position: 'relative',
                            minWidth: 160,
                            width: 160,
                            height: 160,
                            flexShrink: 0,
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: actualIndex === 0 ? '3px solid #DE3F5E' : '2px solid #e0e0e0',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            cursor: 'grab',
                            '&:active': { cursor: 'grabbing' },
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'scale(1.02)' },
                          }}
                        >
                          <Box
                            component="img"
                            src={img}
                            alt={`Couple photo ${actualIndex + 1}`}
                            draggable={false}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              pointerEvents: 'none',
                            }}
                          />
                          {actualIndex === 0 && (
                            <Chip
                              label="Main"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                bgcolor: COLORS.brand.primary,
                                color: COLORS.text.inverse,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={async () => {
                              const { deleteImage } = await import('@/lib/utils/image-upload');
                              await deleteImage(img).catch(() => { });
                              const remaining = coupleImages.filter((_, i) => i !== originalIndex).filter(i => i);
                              while (remaining.length < 6) remaining.push(null);
                              setCoupleImages(remaining);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              color: COLORS.text.inverse,
                              '&:hover': {
                                bgcolor: 'rgba(222, 63, 94, 0.9)',
                              },
                              width: 28,
                              height: 28,
                            }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Frame Selection - Grid layout like backgrounds */}
              <Box>
                <Typography variant="subtitle1" sx={{mb: 2, color: COLORS.text.strong }}>
                  Photo Frame
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 2, display: 'block' }}>
                  Choose a decorative frame for your couple photos
                </Typography>

                <Grid container spacing={2}>
                  {FRAME_UI_OPTIONS.map((frame, index) => {
                    const isProFrame = index >= FREE_FRAME_COUNT;
                    return (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={frame.id}>
                      <Box
                        onClick={() => setFrameImageUrl(frame.url)}
                        sx={{
                          width: '100%',
                          aspectRatio: '1/1',
                          borderRadius: 1,
                          border: 3,
                          borderColor: frameImageUrl === frame.url ? COLORS.brand.primary : 'transparent',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative',
                          transition: 'all 0.2s',
                          bgcolor: COLORS.bg.white,
                          '&:hover': {
                            borderColor: COLORS.brand.primary,
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={frame.thumbUrl}
                          alt={frame.name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            p: 1,
                          }}
                        />
                        {isProFrame && !isPro && <ProBadge position="corner" />}
                        {frameImageUrl === frame.url && (
                          <Box sx={{ position: 'absolute', top: 4, right: 4, bgcolor: COLORS.brand.primary, borderRadius: '50%', p: 0.25, display: 'flex' }}>
                            <Check sx={{ color: COLORS.text.inverse, fontSize: 14 }} />
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                        {frame.name}
                      </Typography>
                    </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Stack>

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
      </Stack >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Button variant="outlined" onClick={() => setCustomModalOpen(true)} sx={SECONDARY_BUTTON_SX}>
          Want something custom?
        </Button>
        <Box sx={{ '& > .MuiBox-root': { mt: 0, mb: 0 } }}>
          <ContinueButton weddingSlug={weddingSlug} currentSection="design" weddingId={weddingId} />
        </Box>
      </Box>
      <FeatureRequestModal open={customModalOpen} onClose={() => setCustomModalOpen(false)} variant="custom" weddingId={weddingId || undefined} />
    </Box>
  );
}
