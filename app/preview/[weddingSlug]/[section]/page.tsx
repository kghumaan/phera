'use client';

import { use, useRef, useState, useEffect } from 'react';
import { Box, Typography, Stack, useTheme, useMediaQuery, Button, ListItemIcon, ListItemText } from '@mui/material';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import { Visibility, Lock, PersonOff, HowToReg } from '@mui/icons-material';
import { redirect } from 'next/navigation';
import { WeddingProvider, useWedding } from '@/lib/contexts/WeddingContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import VerticalScrollLayout from '@/components/guest/VerticalScrollLayout';
import Image from 'next/image';
import FAQPage from '@/app/(guest)/[weddingSlug]/faq/page';
import SchedulePage from '@/app/(guest)/[weddingSlug]/schedule/page';
import TravelPage from '@/app/(guest)/[weddingSlug]/travel/page';
import RegistryPage from '@/app/(guest)/[weddingSlug]/registry/page';
import WhereToShopPage from '@/app/(guest)/[weddingSlug]/where-to-shop/page';
import { COLORS, RADII } from '@/lib/theme/tokens';

const VALID_SECTIONS = ['schedule', 'travel', 'faq', 'registry', 'shopping'];

type PreviewView = 'pin_entry' | 'no_rsvp' | 'rsvp_submitted';

const PREVIEW_VIEW_OPTIONS: { value: PreviewView; label: string; icon: React.ReactNode }[] = [
  { value: 'pin_entry', label: 'Pin Entry Screen', icon: <Lock fontSize="small" /> },
  { value: 'no_rsvp', label: 'No RSVP Submitted', icon: <PersonOff fontSize="small" /> },
  { value: 'rsvp_submitted', label: 'RSVP Submitted', icon: <HowToReg fontSize="small" /> },
];

// Countdown hook (same as main preview page)
const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState({
    months: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference > 0) {
        const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
        const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ months, days, hours, minutes, seconds });
      } else {
        setTimeLeft({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const timeLeft = useCountdown(targetDate);

  // Hide countdown when date is TBD (epoch sentinel)
  if (new Date(targetDate).getTime() === 0) return null;

  const timeUnits = [
    { label: 'months', value: timeLeft.months },
    { label: 'days', value: timeLeft.days },
    { label: 'hours', value: timeLeft.hours },
    { label: 'mins', value: timeLeft.minutes },
    { label: 'secs', value: timeLeft.seconds },
  ];

  return (
    <Box
      sx={{
        backgroundColor: COLORS.bg.white,
        borderRadius: 8,
        px: { xs: 3, sm: 4, md: 5, lg: 5.5, xl: 6 },
        py: { xs: 1.5, sm: 1.75, md: 2, lg: 2.5, xl: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: { xs: 340, md: '100%' },
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 3, sm: 3.5, md: 3.5, lg: 4, xl: 5 }}
        justifyContent="center"
        alignItems="center"
      >
        {timeUnits.map((unit) => (
          <Stack key={unit.label} alignItems="center" spacing={0} sx={{ minWidth: { xs: 35, sm: 40, md: 45, lg: 55, xl: 65 } }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400,
                color: '#000000',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2.25rem', xl: '2.75rem' },
                lineHeight: 1.2,
              }}
            >
              {unit.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#000000',
                fontWeight: 400,
                fontSize: { xs: '0.75rem', sm: '0.75rem', lg: '0.85rem', xl: '0.9rem' },
                lineHeight: 1.4,
                textAlign: 'center',
              }}
            >
              {unit.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

function SectionPreviewContent({ section }: { section: string }) {
  const { wedding, isLoading, error } = useWedding();
  const headerRef = useRef<HTMLDivElement>(null);
  const [previewView, setPreviewView] = useState<PreviewView>('rsvp_submitted');
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [isInIframe, setIsInIframe] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    // When inside an iframe, trap back-navigation so history.back() in guest
    // components (e.g. back buttons) can't escape and navigate the parent admin page
    if (inIframe) {
      window.history.replaceState({ preview: true }, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState({ preview: true }, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="" />
      </Box>
    );
  }

  if (error || !wedding) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Wedding not found or you don't have access</Typography>
      </Box>
    );
  }

  // Determine layout mode: multi-page renders standalone section components,
  // vertical scroll renders the full VerticalScrollLayout and scrolls to section
  const isVerticalScroll = !isMobile && (wedding.website_layout === 'infinite_scroll' || wedding.website_layout === 'vertical_scroll');

  if (!isVerticalScroll) {
    const SectionComponent: Record<string, React.ComponentType> = {
      faq: FAQPage,
      schedule: SchedulePage,
      travel: TravelPage,
      registry: RegistryPage,
      shopping: WhereToShopPage,
    };
    const Component = SectionComponent[section];
    if (Component) return <Box sx={{ pt: isMobile ? 2 : 0 }}><Component /></Box>;
  }

  const ViewSwitcher = isInIframe ? null : (
    <>
      <Button
        onClick={(e) => setViewMenuAnchor(e.currentTarget)}
        variant="contained"
        startIcon={<Visibility sx={{ fontSize: 16 }} />}
        sx={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          backdropFilter: 'blur(8px)',
          borderRadius: RADII.xl,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          px: 2,
          py: 0.75,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.85)' },
        }}
      >
        {PREVIEW_VIEW_OPTIONS.find(o => o.value === previewView)?.label || 'Change View'}
      </Button>
      <PheraMenu
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={() => setViewMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 200,
              bgcolor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              color: 'white',
            },
          },
        }}
      >
        {PREVIEW_VIEW_OPTIONS.map((option) => (
          <PheraMenuItem
            key={option.value}
            selected={previewView === option.value}
            onClick={() => { setPreviewView(option.value); setViewMenuAnchor(null); }}
            sx={{
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.15)' },
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </PheraMenuItem>
        ))}
      </PheraMenu>
    </>
  );

  return (
    <OptimizedBackground
      src={wedding.background_image || undefined}
      useAppDefault={!wedding.background_image}
      className="min-h-screen flex flex-col"
    >
      {ViewSwitcher}

      {/* Mock Header for Preview */}
      <Box
        ref={headerRef}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'transparent',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Box sx={{
          height: { xs: 64, md: 120 },
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, md: 4 },
          width: '100%',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: { xs: 80, sm: 100, md: 120 }, height: { xs: 32, sm: 40, md: 48 }, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/logo.svg" alt="Phera Logo" fill priority style={{ objectFit: 'contain', filter: 'brightness(0)' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>
              KG
            </Box>
          </Box>
        </Box>
      </Box>

      <VerticalScrollLayout
        wedding={{
          id: wedding.id,
          couple_name: wedding.couple_name,
          wedding_date: wedding.wedding_date,
          wedding_date_display: wedding.wedding_date_display,
          venue_name: wedding.venue_name,
          venue_location: wedding.venue_location || '',
          venue_flag: wedding.venue_flag || '',
          rsvp_deadline: wedding.rsvp_deadline,
          welcome_text: wedding.welcome_text || undefined,
          registry_description: (wedding as any).registry_description || undefined,
          primary_color: wedding.primary_color || undefined,
          couple_images: Array.isArray(wedding.couple_images) ? wedding.couple_images as string[] : undefined,
        }}
        weddingSlug={wedding.slug}
        isBypassPin={true}
        hasRSVPed={previewView === 'rsvp_submitted'}
        user={previewView === 'no_rsvp' ? null : { id: 'preview-user' }}
        CountdownTimer={CountdownTimer}
        headerRef={headerRef as React.RefObject<HTMLDivElement>}
        initialSection={section}
      />
    </OptimizedBackground>
  );
}

export default function PreviewSectionPage({ params }: { params: Promise<{ weddingSlug: string; section: string }> }) {
  const { weddingSlug, section } = use(params);

  if (!VALID_SECTIONS.includes(section)) {
    redirect(`/preview/${weddingSlug}`);
  }

  return (
    <WeddingProvider weddingSlug={weddingSlug} mode="preview">
      <SectionPreviewContent section={section} />
    </WeddingProvider>
  );
}
